import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

/**
 * Fitur Seserahan: status awal "link", switch cepat antar tiga tahap
 * (link → keranjang → dibeli), edit nama/link tanpa merusak status,
 * dan isolasi antar workspace.
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

describe("seserahan", () => {
  it("membuat item dengan status awal 'link' dan link tersimpan rapi", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);

    const id = await as.mutation(api.seserahan.create, {
      title: "  Mukena motif  ",
      link: "  tokopedia.com/mukena  ",
    });

    const item = (await as.query(api.seserahan.list, {})).find(
      (i) => i._id === id,
    );
    expect(item?.title).toBe("Mukena motif");
    expect(item?.status).toBe("link");
    expect(item?.link).toBe("tokopedia.com/mukena");

    // Link boleh kosong — barang tetap tercatat.
    const bare = await as.mutation(api.seserahan.create, {
      title: "Hampers keluarga",
    });
    expect(
      (await as.query(api.seserahan.list, {})).find((i) => i._id === bare)
        ?.link,
    ).toBeUndefined();
  });

  it("menyimpan harga, jumlah, dan catatan serta menghitung subtotal", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);

    const id = await as.mutation(api.seserahan.create, {
      title: "Mukena",
      unitPrice: 125000,
      quantity: 2,
      note: "Warna sage",
    });
    let item = (await as.query(api.seserahan.list, {})).find((row) => row._id === id);
    expect(item?.unitPrice).toBe(125000);
    expect(item?.quantity).toBe(2);
    expect(item?.note).toBe("Warna sage");
    expect((item?.unitPrice ?? 0) * (item?.quantity ?? 1)).toBe(250000);

    await as.mutation(api.seserahan.update, {
      itemId: id,
      unitPrice: null,
      quantity: 3,
      note: null,
    });
    item = (await as.query(api.seserahan.list, {})).find((row) => row._id === id);
    expect(item?.unitPrice).toBeUndefined();
    expect(item?.quantity).toBe(3);
    expect(item?.note).toBeUndefined();
  });

  it("menolak harga negatif dan jumlah non-positif atau pecahan", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);

    await expect(
      as.mutation(api.seserahan.create, { title: "Barang", unitPrice: -1 }),
    ).rejects.toThrow(/harga/i);
    await expect(
      as.mutation(api.seserahan.create, { title: "Barang", quantity: 0 }),
    ).rejects.toThrow(/jumlah/i);
    await expect(
      as.mutation(api.seserahan.create, { title: "Barang", quantity: 1.5 }),
    ).rejects.toThrow(/jumlah/i);
  });

  it("menukar status link → keranjang → dibeli lalu menyimpannya", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);

    const id = await as.mutation(api.seserahan.create, { title: "Kotak seserahan" });
    const find = async () =>
      (await as.query(api.seserahan.list, {})).find((i) => i._id === id);

    expect((await find())?.status).toBe("link");

    await as.mutation(api.seserahan.setStatus, { itemId: id, status: "cart" });
    expect((await find())?.status).toBe("cart");

    await as.mutation(api.seserahan.setStatus, {
      itemId: id,
      status: "bought",
    });
    expect((await find())?.status).toBe("bought");

    // Bisa mundur juga — status benar-benar bebas ditukar.
    await as.mutation(api.seserahan.setStatus, { itemId: id, status: "link" });
    expect((await find())?.status).toBe("link");
  });

  it("mengedit nama/link tanpa mengubah status, dan menghapus link dengan null", async () => {
    const t = t0();
    const { as } = await makeWorkspace(t);

    const id = await as.mutation(api.seserahan.create, {
      title: "Sepatu pengantin",
      link: "shopee.co.id/sepatu",
    });
    await as.mutation(api.seserahan.setStatus, { itemId: id, status: "cart" });

    await as.mutation(api.seserahan.update, {
      itemId: id,
      title: "Sepatu pengantin (final)",
    });
    let item = (await as.query(api.seserahan.list, {})).find(
      (i) => i._id === id,
    );
    expect(item?.title).toBe("Sepatu pengantin (final)");
    expect(item?.status).toBe("cart"); // status tidak tersentuh
    expect(item?.link).toBe("shopee.co.id/sepatu");

    await as.mutation(api.seserahan.update, { itemId: id, link: null });
    item = (await as.query(api.seserahan.list, {})).find((i) => i._id === id);
    expect(item?.link).toBeUndefined();
    expect(item?.status).toBe("cart");

    await expect(
      as.mutation(api.seserahan.update, { itemId: id, title: "   " }),
    ).rejects.toThrow(/kosong/i);
  });

  it("menolak perubahan pada seserahan milik workspace lain", async () => {
    const t = t0();
    const a = await makeWorkspace(t);
    const b = await makeWorkspace(t);

    const foreign = await a.as.mutation(api.seserahan.create, {
      title: "Milik A",
    });

    await expect(
      b.as.mutation(api.seserahan.setStatus, {
        itemId: foreign,
        status: "bought",
      }),
    ).rejects.toThrow(/not found/i);
    await expect(
      b.as.mutation(api.seserahan.update, { itemId: foreign, title: "Hack" },
      ),
    ).rejects.toThrow(/not found/i);
    await expect(
      b.as.mutation(api.seserahan.remove, { itemId: foreign }),
    ).rejects.toThrow(/not found/i);

    // Milik A tetap utuh.
    expect(
      (await a.as.query(api.seserahan.list, {})).find(
        (i) => i._id === foreign,
      )?.title,
    ).toBe("Milik A");
  });
});
