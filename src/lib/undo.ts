import { toast } from "sonner";

/**
 * Tampilan baku untuk aksi hapus: data hilang, tetapi pengguna masih punya
 * beberapa detik untuk mengembalikannya lewat tombol "Urungkan".
 *
 * `restore` dipanggil hanya saat tombol itu ditekan — hapus sendiri tetap
 * berjalan langsung supaya UI terasa instan.
 */
export function undoableDelete(
  message: string,
  restore: () => Promise<unknown> | unknown,
  options?: { durationMs?: number; successMessage?: string },
) {
  toast.warning(message, {
    duration: options?.durationMs ?? 7000,
    action: {
      label: "Urungkan",
      onClick: async () => {
        try {
          await restore();
          toast.success(options?.successMessage ?? "Data dikembalikan.");
        } catch {
          toast.error("Gagal mengembalikan. Muat ulang lalu coba lagi.");
        }
      },
    },
  });
}
