import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "../convex/_generated/api";
import schema from "../convex/schema";

/**
 * Cron harian mencari tugas & vendor yang jatuh tempo H-3, H-1, atau sudah
 * lewat. Yang diuji di sini: ambang tenggat, penandaan `lastRemindedAt`, dan
 * bahwa satu item tidak masuk antrean dua kali di hari yang sama.
 */
type Test = TestConvex<typeof schema>;

const modules = import.meta.glob([
  "../convex/**/*.ts",
  "!../convex/**/*.test.ts",
]);
const t0 = () => convexTest(schema, modules);

const DAY = 24 * 60 * 60 * 1000;

/** Awal hari ini — sama dengan `startOfDay` di reminders.ts. */
function today(): number {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

async function makeWorkspace(t: Test, email?: string) {
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", email ? { email, isAnonymous: false } : { isAnonymous: true }),
  );
  const as = t.withIdentity({ subject: userId });
  await as.mutation(api.wedding.ensureSetup, {});
  return { userId, as };
}

async function outbox(t: Test) {
  return await t.run((ctx) => ctx.db.query("reminderOutbox").collect());
}

describe("cron pengingat harian", () => {
  it("mengantre H-3, H-1, dan yang sudah lewat saja", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t, "pasangan@example.com");

    await as.mutation(api.checklist.create, {
      label: "Kirim undangan",
      dueDate: today() + 3 * DAY,
    });
    await as.mutation(api.checklist.create, {
      label: "Fitting baju",
      dueDate: today() + 1 * DAY,
    });
    await as.mutation(api.checklist.create, {
      label: "Bayar katering",
      dueDate: today() - 2 * DAY,
    });
    // Di luar ambang & tanpa tenggat: tidak boleh masuk antrean.
    await as.mutation(api.checklist.create, {
      label: "Pilih souvenir",
      dueDate: today() + 5 * DAY,
    });
    await as.mutation(api.checklist.create, { label: "Tugas tanpa tenggat" });

    // Tugas H-1 yang sudah selesai juga dilewati.
    const done = await as.mutation(api.checklist.create, {
      label: "Sudah selesai",
      dueDate: today() + 1 * DAY,
    });
    await as.mutation(api.checklist.toggle, { itemId: done, done: true });

    const result = await t.mutation(internal.reminders.scanDue, {});
    expect(result.queued).toBe(3);

    const rows = await outbox(t);
    expect(rows.map((row) => row.label).sort()).toEqual([
      "Bayar katering",
      "Fitting baju",
      "Kirim undangan",
    ]);
    expect(rows.find((row) => row.label === "Bayar katering")?.daysLeft).toBe(-2);
  });

  it("mengantre DP/pelunasan vendor dan melewati yang sudah lunas", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t, "pasangan@example.com");

    await as.mutation(api.vendors.create, {
      name: "Katering Sehat",
      category: "Katering",
      cost: 10_000_000,
      status: "dp",
      dueDate: today() + 1 * DAY,
    });
    await as.mutation(api.vendors.create, {
      name: "MUA Cantik",
      category: "Rias",
      cost: 3_000_000,
      status: "belum",
      dueDate: today() + 3 * DAY,
    });
    await as.mutation(api.vendors.create, {
      name: "Foto Cerah",
      category: "Foto",
      cost: 5_000_000,
      status: "lunas",
      dueDate: today() + 1 * DAY,
    });

    const result = await t.mutation(internal.reminders.scanDue, {});
    expect(result.queued).toBe(2);

    const rows = await outbox(t);
    expect(rows.map((row) => row.label).sort()).toEqual([
      "DP MUA Cantik",
      "Pelunasan Katering Sehat",
    ]);
    expect(rows.every((row) => row.kind === "vendor")).toBe(true);
  });

  it("tidak mengantre ulang di hari yang sama (lastRemindedAt)", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t, "pasangan@example.com");

    const itemId = await as.mutation(api.checklist.create, {
      label: "Konfirmasi vendor",
      dueDate: today() + 1 * DAY,
    });

    expect((await t.mutation(internal.reminders.scanDue, {})).queued).toBe(1);
    expect((await t.mutation(internal.reminders.scanDue, {})).queued).toBe(0);
    expect(await outbox(t)).toHaveLength(1);

    const item = await t.run((ctx) => ctx.db.get(itemId));
    expect(item?.lastRemindedAt).toBeTypeOf("number");

    // Pengingat harian tetap berlaku besok: tandai "kemarin" lalu scan lagi.
    await t.run((ctx) =>
      ctx.db.patch(itemId, { lastRemindedAt: today() - DAY }),
    );
    expect((await t.mutation(internal.reminders.scanDue, {})).queued).toBe(1);
    expect(await outbox(t)).toHaveLength(2);
  });

  it("mengelompokkan antrean per pemilik workspace yang punya email", async () => {
    const t = t0();
    const { userId, as } = await makeWorkspace(t, "pasangan@example.com");
    await as.mutation(api.checklist.create, {
      label: "Cetak undangan",
      dueDate: today() - DAY,
    });
    await as.mutation(api.checklist.create, {
      label: "Booking venue",
      dueDate: today() + 3 * DAY,
    });

    // Workspace anonim: pengingatnya hanya tampil di aplikasi, bukan email.
    const anonymous = await makeWorkspace(t);
    await anonymous.as.mutation(api.checklist.create, {
      label: "Tugas anonim",
      dueDate: today() + DAY,
    });

    expect((await t.mutation(internal.reminders.scanDue, {})).queued).toBe(3);

    const groups = await t.query(internal.reminders.pendingOutbox, {});
    expect(groups).toHaveLength(1);
    expect(groups[0].email).toBe("pasangan@example.com");
    expect(groups[0].userId).toBe(userId);
    expect(groups[0].items.map((item) => item.label).sort()).toEqual([
      "Booking venue",
      "Cetak undangan",
    ]);
  });

  it("tidak menandai terkirim kalau gateway email belum diatur", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t, "pasangan@example.com");
    await as.mutation(api.checklist.create, {
      label: "Kirim undangan",
      dueDate: today() + DAY,
    });
    await t.mutation(internal.reminders.scanDue, {});

    // Email di-skip dulu (keputusan produk), jadi antrean harus tetap utuh.
    const result = await t.action(internal.reminders.deliverPending, {});
    expect(result.sent).toBe(0);
    expect(result.groups).toBe(1);

    const rows = await outbox(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].sentAt).toBeUndefined();
  });
});
