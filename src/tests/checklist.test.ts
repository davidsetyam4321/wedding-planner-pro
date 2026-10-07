import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

/**
 * Urutan manual (drag & drop) dan field penanggung jawab — dua perubahan baru
 * pada checklist yang punya aturan tersendiri: urutan mengikuti array, id
 * milik workspace lain ditolak, dan `pic` bisa diisi sekaligus dikosongkan.
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

describe("penyusunan ulang checklist", () => {
  it("menyimpan urutan baru sesuai posisi array", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);

    const a = await as.mutation(api.checklist.create, { label: "Tugas A" });
    const b = await as.mutation(api.checklist.create, { label: "Tugas B" });
    const c = await as.mutation(api.checklist.create, { label: "Tugas C" });

    const before = await as.query(api.checklist.list, {});
    const own = before.filter((item) =>
      [a, b, c].includes(item._id as typeof a),
    );
    expect(own.map((item) => item._id)).toEqual([a, b, c]);

    await as.mutation(api.checklist.reorder, { itemIds: [c, a, b] });

    const after = await as.query(api.checklist.list, {});
    const ownAfter = after.filter((item) => [a, b, c].includes(item._id as typeof a));
    expect(ownAfter.map((item) => item._id)).toEqual([c, a, b]);
    expect(ownAfter.map((item) => item.sortOrder)).toEqual([0, 1, 2]);
  });

  it("menolak menyusun ulang dengan id milik workspace lain", async () => {
    const t = t0();
    const a = await makeWorkspace(t);
    const b = await makeWorkspace(t);

    const mine = await a.as.mutation(api.checklist.create, { label: "Milik A" });
    const foreign = await b.as.mutation(api.checklist.create, {
      label: "Milik B",
    });

    const before = await b.as.query(api.checklist.list, {});
    const beforeSort = before.find((item) => item._id === foreign)?.sortOrder;

    await expect(
      b.as.mutation(api.checklist.reorder, { itemIds: [foreign, mine] }),
    ).rejects.toThrow(/not found/i);

    // Urutan milik B tidak berubah: transaksi gagal dibatalkan seluruhnya.
    const after = await b.as.query(api.checklist.list, {});
    expect(after.find((item) => item._id === foreign)?.sortOrder).toBe(beforeSort);
  });

  it("mengurutkan array kosong tanpa error", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);
    await expect(as.mutation(api.checklist.reorder, { itemIds: [] })).resolves.toBe(
      0,
    );
  });
});

describe("penanggung jawab tugas", () => {
  it("bisa diisi saat dibuat, diubah, lalu dikosongkan", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);

    const id = await as.mutation(api.checklist.create, {
      label: "Cetak undangan",
      pic: "Rina",
    });
    expect((await as.query(api.checklist.list, {})).find((i) => i._id === id)?.pic).toBe(
      "Rina",
    );

    await as.mutation(api.checklist.setPic, { itemId: id, pic: "WO" });
    expect((await as.query(api.checklist.list, {})).find((i) => i._id === id)?.pic).toBe(
      "WO",
    );

    // String kosong menghapus, bukan menyimpan string kosong.
    await as.mutation(api.checklist.update, {
      itemId: id,
      label: "Cetak undangan",
      pic: "  ",
    });
    expect(
      (await as.query(api.checklist.list, {})).find((i) => i._id === id)?.pic,
    ).toBeUndefined();

    // Update tanpa field pic tidak menghapus field lama.
    await as.mutation(api.checklist.setPic, { itemId: id, pic: "Keluarga" });
    await as.mutation(api.checklist.update, {
      itemId: id,
      label: "Cetak undangan (final)",
    });
    expect(
      (await as.query(api.checklist.list, {})).find((i) => i._id === id)?.pic,
    ).toBe("Keluarga");
  });

  it("menolak setPic pada tugas workspace lain", async () => {
    const t = t0();
    const a = await makeWorkspace(t);
    const b = await makeWorkspace(t);
    const foreign = await a.as.mutation(api.checklist.create, {
      label: "Milik A",
    });

    await expect(
      b.as.mutation(api.checklist.setPic, { itemId: foreign, pic: "Penyerbu" }),
    ).rejects.toThrow(/not found/i);
  });
});
