import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import schema from "../convex/schema";

/**
 * Batas keamanan aplikasi ini: satu workspace hanya boleh dibaca/diubah oleh
 * pemiliknya (dan pasangan yang sudah bergabung lewat kode undangan). Semua
 * data disaring lewat index `by_user`, jadi tes ini memastikan tidak ada query
 * atau mutation yang bocor ke workspace lain.
 */
type Test = TestConvex<typeof schema>;

// Fungsi Convex tinggal di `src/convex`, bukan `convex/` di root proyek,
// jadi daftar modulnya diberikan eksplisit (file tes sendiri dikecualikan).
const modules = import.meta.glob([
  "../convex/**/*.ts",
  "!../convex/**/*.test.ts",
]);
const t0 = () => convexTest(schema, modules);

async function seedWorkspace(t: Test, label: string) {
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { isAnonymous: true, name: label }),
  );
  const as = t.withIdentity({ subject: userId });

  await as.mutation(api.wedding.ensureSetup, {});
  await as.mutation(api.guests.create, {
    name: `Tamu ${label}`,
    group: "Keluarga",
    pax: 2,
  });
  const checklistId = await as.mutation(api.checklist.create, {
    label: `Tugas ${label}`,
  });
  await as.mutation(api.vendors.create, {
    name: `Vendor ${label}`,
    category: "Katering",
    cost: 10_000_000,
    status: "dp",
    dpAmount: 2_000_000,
  });
  await as.mutation(api.budget.createCategory, {
    name: `Kategori ${label}`,
    allocated: 1_000_000,
  });
  await as.mutation(api.savings.add, { amount: 500_000, note: label });
  await as.mutation(api.rundown.create, {
    startTime: "09:00",
    title: `Acara ${label}`,
  });

  const category = await as.run((ctx) =>
    ctx.db
      .query("budgetCategory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first(),
  );
  await as.mutation(api.budget.addExpense, {
    categoryId: category!._id,
    label: `Pengeluaran ${label}`,
    amount: 250_000,
  });

  const guest = await as.run((ctx) =>
    ctx.db
      .query("guest")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first(),
  );

  return {
    userId,
    as,
    guestId: guest!._id,
    checklistId,
    categoryId: category!._id,
  };
}

/** Ringkasan budget workspace milik `userId` (manual vs baris turunan vendor). */
async function budgetSummary(t: Test, userId: Id<"users">) {
  const overview = await t
    .withIdentity({ subject: userId })
    .query(api.budget.overview, {});
  return {
    categories: overview.categories.map((category) => category.name),
    manual: overview.expenses
      .filter((expense) => expense.source === "manual")
      .map((expense) => expense.label),
    fromVendors: overview.expenses
      .filter((expense) => expense.source === "vendor")
      .map((expense) => expense.label),
  };
}

describe("isolasi antar workspace", () => {
  it("hanya menampilkan data milik workspace sendiri", async () => {
    const t = t0();
    const a = await seedWorkspace(t, "A");
    const b = await seedWorkspace(t, "B");

    const guests = await b.as.query(api.guests.list, {});
    expect(guests.map((guest) => guest.name)).toEqual(["Tamu B"]);
    expect(await a.as.query(api.guests.list, {})).toHaveLength(1);

    // `ensureSetup` menanam 10 tugas default, jadi yang diperiksa: tugas B ada
    // dan tidak ada satu pun baris milik workspace A.
    const checklist = await b.as.query(api.checklist.list, {});
    expect(checklist.map((item) => item.label)).toContain("Tugas B");
    expect(checklist.some((item) => item.label === "Tugas A")).toBe(false);
    expect(new Set(checklist.map((item) => item.userId))).toEqual(
      new Set([b.userId]),
    );

    const vendors = await b.as.query(api.vendors.list, {});
    expect(vendors.map((vendor) => vendor.name)).toEqual(["Vendor B"]);

    // 9 kategori default ikut ter-seed, jadi hanya kategori buatan yang dicek.
    const budget = await budgetSummary(t, b.userId);
    expect(budget.categories).toContain("Kategori B");
    expect(budget.categories).not.toContain("Kategori A");
    expect(budget.manual).toEqual(["Pengeluaran B"]);
    expect(budget.fromVendors).toEqual(["Vendor B"]);

    const deposits = await b.as.query(api.savings.list, {});
    expect(deposits.map((deposit) => deposit.note)).toEqual(["B"]);

    const rundown = await b.as.query(api.rundown.list, {});
    expect(rundown.map((item) => item.title)).toContain("Acara B");
    expect(rundown.map((item) => item.title)).not.toContain("Acara A");
  });

  it("tetap memisahkan data walau keduanya memakai seed default", async () => {
    const t = t0();
    const a = await seedWorkspace(t, "A");
    const b = await seedWorkspace(t, "B");

    // `ensureSetup` menanam 10 tugas default & 9 kategori default; keduanya
    // harus melihat miliknya sendiri saja (tidak saling silang).
    const checklistA = await a.as.query(api.checklist.list, {});
    const checklistB = await b.as.query(api.checklist.list, {});
    expect(checklistA).toHaveLength(11);
    expect(checklistB).toHaveLength(11);
    // 10 tugas default sama untuk semua workspace, tugas ke-11 milik sendiri.
    expect(checklistA[10].label).toBe("Tugas A");
    expect(checklistB[10].label).toBe("Tugas B");
    expect(new Set(checklistB.map((item) => item.userId))).toEqual(
      new Set([b.userId]),
    );
  });

  it("menolak mutation yang menyasar id milik workspace lain", async () => {
    const t = t0();
    const a = await seedWorkspace(t, "A");
    const b = await seedWorkspace(t, "B");

    await expect(
      b.as.mutation(api.guests.remove, { guestId: a.guestId }),
    ).rejects.toThrow(/not found/i);
    await expect(
      b.as.mutation(api.checklist.remove, { itemId: a.checklistId }),
    ).rejects.toThrow(/not found/i);
    await expect(
      b.as.mutation(api.budget.deleteCategory, { categoryId: a.categoryId }),
    ).rejects.toThrow(/not found/i);
    await expect(
      b.as.mutation(api.budget.renameCategory, {
        categoryId: a.categoryId,
        name: "Dibajak",
      }),
    ).rejects.toThrow(/not found/i);
    await expect(
      b.as.mutation(api.guests.update, { guestId: a.guestId, name: "Dibajak" }),
    ).rejects.toThrow(/not found/i);
    await expect(
      b.as.query(api.moodboard.listBoxes, { category: "Dekorasi" }),
    ).resolves.toEqual([]);

    // Data A tetap utuh setelah semua percobaan di atas.
    const guestsA = await a.as.query(api.guests.list, {});
    expect(guestsA.map((guest) => guest.name)).toEqual(["Tamu A"]);
    const overviewA = await a.as.query(api.budget.overview, {});
    expect(overviewA.categories.map((category) => category.name)).toContain(
      "Kategori A",
    );
  });

  it("menolak akses tanpa identitas", async () => {
    const t = t0();
    await seedWorkspace(t, "A");

    await expect(t.query(api.guests.list, {})).resolves.toEqual([]);
    await expect(t.query(api.budget.overview, {})).resolves.toMatchObject({
      categories: [],
    });
    await expect(t.query(api.workspace.status, {})).resolves.toBeNull();
    await expect(
      t.mutation(api.guests.create, { name: "Tamu X", group: "Umum", pax: 1 }),
    ).rejects.toThrow(/not signed in/i);

    const deposit = await t.run((ctx) => ctx.db.query("savingDeposit").first());
    await expect(
      t.mutation(api.savings.remove, { depositId: deposit!._id }),
    ).rejects.toThrow(/not signed in/i);
  });
});
