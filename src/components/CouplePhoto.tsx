import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { bloom } from "@/lib/bloom";
import { useCallback, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { toast } from "sonner";

/** Monogram from the couple's names ("Andra" & "Rina" → "AR"). */
export function coupleInitials(one?: string, two?: string): string {
  const a = one?.trim().charAt(0) ?? "";
  const b = two?.trim().charAt(0) ?? "";
  return `${a}${b}`.toUpperCase() || "PW";
}

/**
 * Uploads (or replaces) the couple photo saved on the wedding document.
 * Spread `inputProps` onto a single hidden `<input type="file" />`.
 */
export function useCouplePhotoUpload() {
  const generateUploadUrl = useAction(api.files.generateUploadUrl);
  const setCouplePhoto = useMutation(api.wedding.setCouplePhoto);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const handleFiles = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      setUploading(true);
      try {
        const uploadUrl = await generateUploadUrl({
          contentType: file.type,
          sizeBytes: file.size,
        });
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok) throw new Error("upload gagal");
        const { storageId } = (await response.json()) as {
          storageId: Id<"_storage">;
        };
        await setCouplePhoto({ storageId });
        bloom();
        toast.success("Foto pasangan diperbarui.");
      } catch {
        toast.error("Gagal mengunggah foto.");
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl, setCouplePhoto],
  );

  return {
    uploading,
    openPicker,
    inputProps: { ref: inputRef, onChange: handleFiles },
  };
}
