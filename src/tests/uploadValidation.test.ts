import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { MutationCtx } from "../convex/_generated/server";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  assertValidImageUpload,
} from "../convex/files";
import schema from "../convex/schema";

/**
 * Validasi unggahan foto punya dua lapis:
 * 1. `generateUploadUrl` menolak klaim klien yang salah sebelum URL dibuat
 *    (diuji sebagai query/mutation biasa lewat convex-test).
 * 2. `assertValidImageUpload` memeriksa metadata asli di storage saat
 *    storageId disimpan. Lapis ini memakai `ctx.storage.getMetadata`, syscall
 *    yang belum didukung convex-test, jadi ctx-nya diganti objek palsu —
 *    perilaku yang diuji tetap kode asli fungsi tersebut.
 */
type Test = TestConvex<typeof schema>;

// Fungsi Convex tinggal di `src/convex`, bukan `convex/` di root proyek,
// jadi daftar modulnya diberikan eksplisit (file tes sendiri dikecualikan).
const modules = import.meta.glob([
  "../convex/**/*.ts",
  "!../convex/**/*.test.ts",
]);
const t0 = () => convexTest(schema, modules);

async function makeUser(t: Test) {
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { isAnonymous: true }),
  );
  return t.withIdentity({ subject: userId });
}

const MB = 1024 * 1024;
const STORAGE_ID = "storage-palsu" as unknown as Id<"_storage">;

/** ctx minimal untuk `assertValidImageUpload`. */
function fakeStorageCtx(meta: { size: number; contentType: string | null }) {
  const deleted: Id<"_storage">[] = [];
  const ctx = {
    storage: {
      getMetadata: async () => ({ ...meta, sha256: "x" }),
      delete: async (id: Id<"_storage">) => {
        deleted.push(id);
      },
    },
  } as unknown as MutationCtx;
  return { ctx, deleted };
}

describe("validasi unggahan foto", () => {
  it("menerima semua tipe gambar yang didukung", async () => {
    const t = t0();
    const as = await makeUser(t);

    for (const contentType of ALLOWED_IMAGE_TYPES) {
      await expect(
        as.action(api.files.generateUploadUrl, {
          contentType,
          sizeBytes: 1 * MB,
        }),
      ).resolves.toEqual(expect.any(String));
    }
  });

  it("menolak file lebih dari 5 MB sebelum URL dibuat", async () => {
    const t = t0();
    const as = await makeUser(t);

    await expect(
      as.action(api.files.generateUploadUrl, {
        contentType: "image/jpeg",
        sizeBytes: MAX_UPLOAD_BYTES + 1,
      }),
    ).rejects.toThrow(/5 MB/i);

    // Tepat 5 MB masih boleh.
    await expect(
      as.action(api.files.generateUploadUrl, {
        contentType: "image/jpeg",
        sizeBytes: MAX_UPLOAD_BYTES,
      }),
    ).resolves.toEqual(expect.any(String));
  });

  it("menolak file non-gambar sebelum URL dibuat", async () => {
    const t = t0();
    const as = await makeUser(t);

    for (const contentType of ["application/pdf", "text/plain", "video/mp4"]) {
      await expect(
        as.action(api.files.generateUploadUrl, {
          contentType,
          sizeBytes: 1024,
        }),
      ).rejects.toThrow(/hanya gambar/i);
    }
  });

  it("menolak unggahan tanpa sesi", async () => {
    const t = t0();
    await expect(
      t.action(api.files.generateUploadUrl, {
        contentType: "image/png",
        sizeBytes: 1024,
      }),
    ).rejects.toThrow(/not signed in/i);
  });

  it("menolak metadata storage yang tidak sesuai saat disimpan", async () => {
    const oversize = fakeStorageCtx({
      size: MAX_UPLOAD_BYTES + 1,
      contentType: "image/png",
    });
    await expect(
      assertValidImageUpload(oversize.ctx, STORAGE_ID),
    ).rejects.toThrow(/5 MB/i);
    // File yang ditolak dihapus supaya tidak menumpuk di storage.
    expect(oversize.deleted).toEqual([STORAGE_ID]);

    const wrongType = fakeStorageCtx({
      size: 1024,
      contentType: "text/plain",
    });
    await expect(
      assertValidImageUpload(wrongType.ctx, STORAGE_ID),
    ).rejects.toThrow(/hanya gambar/i);
    expect(wrongType.deleted).toEqual([STORAGE_ID]);

    // Metadata tanpa contentType juga ditolak, bukan diloloskan.
    const missingType = fakeStorageCtx({ size: 1024, contentType: null });
    await expect(
      assertValidImageUpload(missingType.ctx, STORAGE_ID),
    ).rejects.toThrow(/hanya gambar/i);

    const ok = fakeStorageCtx({ size: MAX_UPLOAD_BYTES, contentType: "image/webp" });
    await expect(
      assertValidImageUpload(ok.ctx, STORAGE_ID),
    ).resolves.toBeUndefined();
    expect(ok.deleted).toEqual([]);
  });

  it("menolak storageId yang tidak ditemukan", async () => {
    const ctx = {
      storage: {
        getMetadata: async () => null,
        delete: async () => undefined,
      },
    } as unknown as MutationCtx;
    await expect(assertValidImageUpload(ctx, STORAGE_ID)).rejects.toThrow(
      /tidak ditemukan/i,
    );
  });

  it("menjaga batas ukuran dan tipe tetap konsisten dengan UI", () => {
    // Kontrak yang dipakai UI sebelum mengunggah: 5 MB dan hanya gambar.
    expect(MAX_UPLOAD_BYTES).toBe(5 * MB);
    expect(ALLOWED_IMAGE_TYPES.length).toBeGreaterThan(0);
    for (const type of ALLOWED_IMAGE_TYPES) {
      expect(type.startsWith("image/")).toBe(true);
    }
  });
});
