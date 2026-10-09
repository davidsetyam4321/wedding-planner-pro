import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

/**
 * Aturan backend halaman Budget: nama kategori unik & wajib, nominal harus
 * positif, status belum-lunas menyimpan `paidAt` terhapus (bukan 0), kaskade
 * hapus kategori, dan sinkronisasi pembayaran vendor (belum/dp/lunas) yang
 * dihitung ulang di setiap overview.
 */
type Test = TestConvex<typeof schema>;

const modules = import.meta.glob([
  "../convex/**/*.ts",
  "!../convex/**/*.test.ts",
]);
const t0 = () => convexTest(schema, modules);

async function makeWorkspace(t: Test) {
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { isAnonymous: true }),
  );
  const as = t.withIdentity({ subject: userId });
  await as.mutation(api.wedding.ensureSetup, {});
  return { userId, as };
}

describe("kategori budget", () => {
  it("menolak nama kosong dan nama yang sudah dipakai (tanpa beda huruf)", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);

    await expect(
      as.mutation(api.budget.createCategory, { name: "   ", allocated: 0 }),
    ).rejects.toThrow(/tidak boleh kosong/i);

    // "Venue" sudah ada dari seed — huruf kecil pun dianggap sama.
    await expect(
      as.mutation(api.budget.createCategory, {
        name: "  venue ",
        allocated: 1_000_000,
      }),
    ).rejects.toThrow(/sudah dipakai/i);
  });

  it("rename menolak bentrok dengan kategori lain", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);
    const overview = await as.query(api.budget.overview, {});
    const venue = overview.categories.find((c) => c.name === "Venue");
    expect(venue).toBeDefined();

    await expect(
      as.mutation(api.budget.renameCategory, {
        categoryId: venue!._id,
        name: "katering", // sudah ada (Katering), beda huruf saja
      }),
    ).rejects.toThrow(/sudah dipakai/i);

    await as.mutation(api.budget.renameCategory, {
      categoryId: venue!._id,
      name: "Gedung Serbaguna",
    });
    const after = await as.query(api.budget.overview, {});
    expect(after.categories.some((c) => c.name === "Gedung Serbaguna")).toBe(
      true,
    );
  });
});

describe("pengeluaran budget", () => {
  it("menolak nominal nol/negatif dan keterangan kosong", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);
    const overview = await as.query(api.budget.overview, {});
    const categoryId = overview.categories[0]._id;

    await expect(
      as.mutation(api.budget.addExpense, {
        categoryId,
        label: "DP katering",
        amount: 0,
      }),
    ).rejects.toThrow(/lebih dari 0/i);
    await expect(
      as.mutation(api.budget.addExpense, {
        categoryId,
        label: "DP katering",
        amount: -5_000,
      }),
    ).rejects.toThrow(/lebih dari 0/i);
    await expect(
      as.mutation(api.budget.addExpense, {
        categoryId,
        label: "   ",
        amount: 1_000,
      }),
    ).rejects.toThrow(/keterangan/i);
  });

  it("kategori baru bisa dibuat langsung dari form pengeluaran", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);
    await as.mutation(api.budget.addExpense, {
      categoryName: "Mahar",
      label: "Cincin",
      amount: 1_500_000,
      paid: true,
    });

    const overview = await as.query(api.budget.overview, {});
    expect(overview.categories.some((c) => c.name === "Mahar")).toBe(true);
    const expense = overview.expenses.find(
      (e) => e.source === "manual" && e.label === "Cincin",
    );
    expect(expense?.amount).toBe(1_500_000);
    expect(expense?.paidAt).toBeTruthy();
  });

  it("belum lunas menghapus paidAt (bukan menyimpan 0)", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);
    const overview = await as.query(api.budget.overview, {});
    const categoryId = overview.categories[0]._id;

    await as.mutation(api.budget.addExpense, {
      categoryId,
      label: "Sewa tenda",
      amount: 750_000,
      paid: true,
    });
    const created = (await as.query(api.budget.overview, {})).expenses.find(
      (e): e is Extract<typeof e, { source: "manual" }> =>
        e.source === "manual" && e.label === "Sewa tenda",
    );
    expect(created?.paidAt).toBeTruthy();

    await as.mutation(api.budget.updateExpense, {
      expenseId: created!._id,
      paid: false,
    });
    const updated = (await as.query(api.budget.overview, {})).expenses.find(
      (e) => e.source === "manual" && e.label === "Sewa tenda",
    );
    expect(updated?.paidAt).toBeUndefined();

    await expect(
      as.mutation(api.budget.updateExpense, {
        expenseId: created!._id,
        amount: 0,
      }),
    ).rejects.toThrow(/lebih dari 0/i);
  });

  it("menghapus kategori beserta pengeluaran di dalamnya", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);
    await as.mutation(api.budget.addExpense, {
      categoryName: "Souvenir",
      label: "Gantungan kunci",
      amount: 300_000,
    });
    const before = await as.query(api.budget.overview, {});
    const category = before.categories.find((c) => c.name === "Souvenir");
    expect(category).toBeDefined();

    await as.mutation(api.budget.deleteCategory, {
      categoryId: category!._id,
    });

    const after = await as.query(api.budget.overview, {});
    expect(after.categories.some((c) => c.name === "Souvenir")).toBe(false);
    expect(
      after.expenses.some((e) => e.label === "Gantungan kunci"),
    ).toBe(false);
  });
});

describe("sinkronisasi vendor → budget", () => {
  it("hanya vendor berstatus dp/lunas yang masuk, dengan nominal yang benar", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);

    await as.mutation(api.vendors.create, {
      name: "Katering Sari",
      category: "Katering",
      cost: 10_000_000,
      status: "belum",
    });
    await as.mutation(api.vendors.create, {
      name: "Dekor Melati",
      category: "Dekorasi & Florist",
      cost: 8_000_000,
      dpAmount: 2_000_000,
      status: "dp",
    });
    await as.mutation(api.vendors.create, {
      name: "Foto Senja",
      category: "Dokumentasi",
      cost: 5_000_000,
      status: "lunas",
    });

    const overview = await as.query(api.budget.overview, {});
    const vendorRows = overview.expenses.filter((e) => e.source === "vendor");

    // "Belum" tidak mengeluarkan uang — tidak boleh muncul.
    expect(vendorRows.map((row) => row.label).sort()).toEqual([
      "Dekor Melati",
      "Foto Senja",
    ]);
    expect(
      vendorRows.find((row) => row.label === "Dekor Melati")?.amount,
    ).toBe(2_000_000);
    expect(vendorRows.find((row) => row.label === "Foto Senja")?.amount).toBe(
      5_000_000,
    );
  });
});
