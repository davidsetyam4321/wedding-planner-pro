import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

/**
 * Alur pasangan: satu workspace dipakai berdua.
 *
 * - Pemilik membagikan kode 6 karakter.
 * - Satu workspace maksimal punya SATU pasangan.
 * - Pasangan membaca & mengubah data yang sama (bukan salinan).
 * - Keluar dari workspace mengembalikan workspace sendiri yang kosong.
 */
type Test = TestConvex<typeof schema>;

// Fungsi Convex tinggal di `src/convex`, bukan `convex/` di root proyek,
// jadi daftar modulnya diberikan eksplisit (file tes sendiri dikecualikan).
const modules = import.meta.glob(["../convex/**/*.ts", "!../convex/**/*.test.ts"]);
const t0 = () => convexTest(schema, modules);

async function makeEmailUser(t: Test, email: string) {
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { email, isAnonymous: false }),
  );
  return { userId, as: t.withIdentity({ subject: userId }) };
}

async function makeAnonymousUser(t: Test) {
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { isAnonymous: true }),
  );
  return { userId, as: t.withIdentity({ subject: userId }) };
}

async function setupOwner(t: Test, email: string) {
  const owner = await makeEmailUser(t, email);
  await owner.as.mutation(api.wedding.ensureSetup, {});
  const code = await owner.as.mutation(api.workspace.revealInviteCode, {});
  return { ...owner, code: code! };
}

describe("alur pasangan lewat kode undangan", () => {
  it("membagikan data yang sama setelah bergabung", async () => {
    const t = t0();
    const owner = await setupOwner(t, "pemilik@example.com");
    const partner = await makeEmailUser(t, "pasangan@example.com");

    await owner.as.mutation(api.guests.create, {
      name: "Tamu Bersama",
      group: "Keluarga",
      pax: 2,
    });

    await partner.as.mutation(api.workspace.joinByInviteCode, {
      code: owner.code,
    });

    const status = await partner.as.query(api.workspace.status, {});
    expect(status).toMatchObject({
      isOwner: false,
      email: "pasangan@example.com",
    });

    const seenByPartner = await partner.as.query(api.guests.list, {});
    expect(seenByPartner.map((guest) => guest.name)).toEqual(["Tamu Bersama"]);
    // Baris tetap milik pemilik workspace, bukan disalin ke pasangan.
    expect(seenByPartner[0].userId).toBe(owner.userId);

    // Pasangan menulis, pemilik langsung melihatnya di workspace yang sama.
    await partner.as.mutation(api.guests.create, {
      name: "Tamu dari Pasangan",
      group: "Teman",
      pax: 1,
    });
    const seenByOwner = await owner.as.query(api.guests.list, {});
    expect(seenByOwner.map((guest) => guest.name)).toEqual([
      "Tamu Bersama",
      "Tamu dari Pasangan",
    ]);
    expect(seenByOwner[1].userId).toBe(owner.userId);

    // Pasangan juga boleh mengubah kategori budget (bukan cuma menambah).
    const overview = await owner.as.query(api.budget.overview, {});
    const category = overview.categories[0];
    await partner.as.mutation(api.budget.renameCategory, {
      categoryId: category._id,
      name: "Kategori Bersama",
    });
    const afterRename = await owner.as.query(api.budget.overview, {});
    expect(
      afterRename.categories.some((item) => item.name === "Kategori Bersama"),
    ).toBe(true);
  });

  it("membatasi satu pasangan per workspace", async () => {
    const t = t0();
    const owner = await setupOwner(t, "pemilik@example.com");
    const partner = await makeEmailUser(t, "pasangan@example.com");
    const other = await makeEmailUser(t, "oranglain@example.com");

    await partner.as.mutation(api.workspace.joinByInviteCode, {
      code: owner.code,
    });

    await expect(
      other.as.mutation(api.workspace.joinByInviteCode, { code: owner.code }),
    ).rejects.toThrow(/sudah punya pasangan/i);
  });

  it("menolak kode tidak valid, tidak ditemukan, dan kode sendiri", async () => {
    const t = t0();
    const owner = await setupOwner(t, "pemilik@example.com");
    const partner = await makeEmailUser(t, "pasangan@example.com");
    const other = await setupOwner(t, "lain@example.com");

    await expect(
      partner.as.mutation(api.workspace.joinByInviteCode, { code: "abc" }),
    ).rejects.toThrow(/format kode/i);
    await expect(
      partner.as.mutation(api.workspace.joinByInviteCode, { code: "ZZZZZZ" }),
    ).rejects.toThrow(/tidak ditemukan/i);
    await expect(
      owner.as.mutation(api.workspace.joinByInviteCode, { code: owner.code }),
    ).rejects.toThrow(/workspacemu sendiri/i);

    // Pemilik yang sudah berpasangan tidak boleh ikut workspace orang lain.
    await partner.as.mutation(api.workspace.joinByInviteCode, {
      code: owner.code,
    });
    await expect(
      owner.as.mutation(api.workspace.joinByInviteCode, { code: other.code }),
    ).rejects.toThrow(/sudah punya pasangan/i);
  });

  it("menolak pengguna anonim, baik bergabung maupun membagikan kode", async () => {
    const t = t0();
    const owner = await setupOwner(t, "pemilik@example.com");
    const anonymous = await makeAnonymousUser(t);

    await expect(
      anonymous.as.mutation(api.workspace.joinByInviteCode, {
        code: owner.code,
      }),
    ).rejects.toThrow(/masuk dengan email/i);

    // Workspace milik akun anonim tidak bisa dijadikan tujuan bergabung.
    const anonOwner = await makeAnonymousUser(t);
    await anonOwner.as.mutation(api.wedding.ensureSetup, {});
    await expect(
      anonOwner.as.mutation(api.workspace.revealInviteCode, {}),
    ).rejects.toThrow(/masuk dengan email/i);
  });

  it("keluar dari workspace mengembalikan workspace sendiri yang kosong", async () => {
    const t = t0();
    const owner = await setupOwner(t, "pemilik@example.com");
    const partner = await makeEmailUser(t, "pasangan@example.com");

    await owner.as.mutation(api.guests.create, {
      name: "Tamu Bersama",
      group: "Keluarga",
      pax: 2,
    });
    await partner.as.mutation(api.workspace.joinByInviteCode, {
      code: owner.code,
    });
    expect(await partner.as.query(api.guests.list, {})).toHaveLength(1);

    await partner.as.mutation(api.workspace.leaveWorkspace, {});
    expect(await partner.as.query(api.guests.list, {})).toEqual([]);

    // Pemilik tetap memegang datanya.
    expect(await owner.as.query(api.guests.list, {})).toHaveLength(1);
    await expect(
      partner.as.mutation(api.workspace.leaveWorkspace, {}),
    ).rejects.toThrow(/tidak sedang bergabung/i);

    // Setelah keluar, pasangan lama bisa bergabung lagi (slot sudah bebas).
    await partner.as.mutation(api.workspace.joinByInviteCode, {
      code: owner.code,
    });
    expect(await partner.as.query(api.guests.list, {})).toHaveLength(1);
  });

  it("mengganti kode undangan menutup akses kode lama", async () => {
    const t = t0();
    const owner = await setupOwner(t, "pemilik@example.com");
    const partner = await makeEmailUser(t, "pasangan@example.com");

    const fresh = await owner.as.mutation(api.workspace.revealInviteCode, {
      regenerate: true,
    });
    expect(fresh).not.toBe(owner.code);

    await expect(
      partner.as.mutation(api.workspace.joinByInviteCode, { code: owner.code }),
    ).rejects.toThrow(/tidak ditemukan/i);
    await partner.as.mutation(api.workspace.joinByInviteCode, {
      code: fresh!,
    });
    expect(await partner.as.query(api.workspace.status, {})).toMatchObject({
      isOwner: false,
    });
  });
});
