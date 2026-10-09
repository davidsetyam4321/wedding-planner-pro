import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
import { DEFAULT_VENDOR_CATEGORIES } from "../convex/wedding";

/**
 * Daftar jenis vendor yang dikelola dari halaman Pengaturan: default bawaan,
 * tambah/hapus (dengan penjagaan duplikat, pemakaian, dan minimal satu jenis),
 * serta gabungan jenis lama yang masih dipakai vendor free-text lama.
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

describe("jenis vendor di pengaturan", () => {
  it("mengembalikan daftar bawaan sebelum daftar disesuaikan", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);
    await expect(
      as.query(api.wedding.getVendorCategories, {}),
    ).resolves.toEqual(DEFAULT_VENDOR_CATEGORIES);
  });

  it("tanpa identitas mengembalikan daftar kosong", async () => {
    const t = t0();
    await expect(t.query(api.wedding.getVendorCategories, {})).resolves.toEqual(
      [],
    );
  });

  it("menambah jenis baru; menolak duplikat, kosong, dan kepanjangan", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);

    await as.mutation(api.wedding.addVendorCategory, {
      name: "  Photobooth  ",
    });
    const types = await as.query(api.wedding.getVendorCategories, {});
    expect(types).toContain("Photobooth");
    expect(types[types.length - 1]).toBe("Photobooth");

    await expect(
      as.mutation(api.wedding.addVendorCategory, { name: "photobooth" }),
    ).rejects.toThrow(/sudah ada/i);
    await expect(
      as.mutation(api.wedding.addVendorCategory, { name: "   " }),
    ).rejects.toThrow(/tidak boleh kosong/i);
    await expect(
      as.mutation(api.wedding.addVendorCategory, { name: "x".repeat(41) }),
    ).rejects.toThrow(/terlalu panjang/i);
  });

  it("menghapus jenis tak terpakai secara permanen (default tidak dihidupkan lagi)", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);

    await as.mutation(api.wedding.removeVendorCategory, {
      name: "Transportasi",
    });
    let types = await as.query(api.wedding.getVendorCategories, {});
    expect(types).not.toContain("Transportasi");

    // Perubahan bertahan melewati penambahan berikutnya.
    await as.mutation(api.wedding.addVendorCategory, { name: "Jasa MC" });
    types = await as.query(api.wedding.getVendorCategories, {});
    expect(types).not.toContain("Transportasi");
    expect(types).toContain("Jasa MC");
  });

  it("menolak menghapus jenis yang masih dipakai vendor", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);
    await as.mutation(api.vendors.create, {
      name: "Katering Sari",
      category: "Katering",
      cost: 1_000_000,
      status: "belum",
    });

    await expect(
      as.mutation(api.wedding.removeVendorCategory, { name: "Katering" }),
    ).rejects.toThrow(/Masih dipakai 1 vendor/i);
    await expect(
      as.query(api.wedding.getVendorCategories, {}),
    ).resolves.toContain("Katering");
  });

  it("menolak menghapus jenis terakhir", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);
    const types = await as.query(api.wedding.getVendorCategories, {});
    for (const type of types.slice(0, -1)) {
      await as.mutation(api.wedding.removeVendorCategory, { name: type });
    }

    const last = (await as.query(api.wedding.getVendorCategories, {}))[0];
    expect(last).toBeDefined();
    await expect(
      as.mutation(api.wedding.removeVendorCategory, { name: last }),
    ).rejects.toThrow(/Minimal satu jenis/i);
  });

  it("jenis lama dari data vendor free-text ikut tampil dan terlindungi", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);
    await as.mutation(api.vendors.create, {
      name: "Studio Mugen",
      category: "Fotografer Mugen",
      cost: 3_000_000,
      status: "belum",
    });

    const types = await as.query(api.wedding.getVendorCategories, {});
    expect(types).toContain("Fotografer Mugen");

    // Karena masih dipakai, penghapusan tetap ditolak dengan pesan jelas.
    await expect(
      as.mutation(api.wedding.removeVendorCategory, {
        name: "Fotografer Mugen",
      }),
    ).rejects.toThrow(/Masih dipakai 1 vendor/i);
  });
});
