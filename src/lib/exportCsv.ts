/**
 * Ekspor CSV sederhana tanpa dependensi: path separator selalu paksa `.`,
 * selalu di-escape, dan diberi BOM UTF-8 supaya Excel (Windows, locale ID)
 * membaca aksen & Rupiah dengan benar.
 */

function escapeCell(value: string | number): string {
  const text = String(value ?? "");
  if (/[",;\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Unduh `rows` sebagai file CSV.
 * Baris pertama `headers` menjadi judul kolom.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const lines = [
    headers.map(escapeCell).join(";"),
    ...rows.map((row) => row.map(escapeCell).join(";")),
  ];
  // BOM agar Excel mendeteksi UTF-8.
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
