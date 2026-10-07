import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/** Batas unggahan foto (moodboard & foto pasangan): 5 MB per file. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Satu-satunya jenis file yang diunggah aplikasi ini adalah gambar. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

/**
 * Pemeriksaan otoritatif dipanggil mutation yang menyimpan storageId.
 * Metadata dibaca dari storage Convex (bukan klaim klien), jadi ukuran dan
 * tipe tidak bisa diakali; file yang melanggar langsung dihapus dari storage
 * supaya tidak menumpuk sebagai sampah.
 */
export async function assertValidImageUpload(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
): Promise<void> {
  const meta = await ctx.storage.getMetadata(storageId);
  if (!meta) throw new Error("File hasil unggahan tidak ditemukan.");
  if (meta.size > MAX_UPLOAD_BYTES) {
    await ctx.storage.delete(storageId);
    throw new Error("Ukuran file melebihi 5 MB.");
  }
  const contentType = meta.contentType ?? "";
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    await ctx.storage.delete(storageId);
    throw new Error("Tipe file tidak didukung (hanya gambar).");
  }
}

/**
 * Generates a short-lived upload URL untuk foto moodboard & pasangan.
 * Wajib login; tipe/ukuran yang dideklarasikan klien diperiksa sebelum URL
 * dibuat. Pemeriksaan final atas metadata asli terjadi saat storageId
 * disimpan (assertValidImageUpload) sehingga ada dua lapis pengaman.
 */
export const generateUploadUrl = action({
  args: { contentType: v.string(), sizeBytes: v.number() },
  handler: async (ctx, { contentType, sizeBytes }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    if (
      !Number.isFinite(sizeBytes) ||
      sizeBytes <= 0 ||
      sizeBytes > MAX_UPLOAD_BYTES
    ) {
      throw new Error("Ukuran file melebihi 5 MB.");
    }
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      throw new Error("Tipe file tidak didukung (hanya gambar).");
    }
    return await ctx.storage.generateUploadUrl();
  },
});
