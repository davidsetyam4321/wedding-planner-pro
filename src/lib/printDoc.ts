/**
 * Ekspor PDF tanpa dependensi: menulis dokumen HTML rapi ke jendela baru
 * lalu memanggil dialog cetak browser — pengguna memilih “Simpan sebagai PDF”.
 * Kembali ke tab asal tetap utuh bila popup diblokir.
 */

export type PrintSection = {
  title: string;
  headers?: string[];
  rows?: (string | number)[][];
  /** Baris teks bebas (dipakai bila tidak ada tabel). */
  lines?: string[];
};

export function printDocument(
  docTitle: string,
  subtitle: string,
  sections: PrintSection[],
): void {
  const esc = (value: string | number) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const body = sections
    .map((section) => {
      const table =
        section.headers && section.rows
          ? `<table>
              <thead><tr>${section.headers
                .map((header) => `<th>${esc(header)}</th>`)
                .join("")}</tr></thead>
              <tbody>
                ${section.rows
                  .map(
                    (row) =>
                      `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`,
                  )
                  .join("")}
              </tbody>
            </table>`
          : "";
      const lines = (section.lines ?? [])
        .map((line) => `<p class="line">${esc(line)}</p>`)
        .join("");
      return `<section><h2>${esc(section.title)}</h2>${table}${lines}</section>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${esc(docTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..600&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Outfit", "Segoe UI", Arial, sans-serif; color: #2f2628; margin: 0; }
  /* Kepala dokumen bergaya kertas undangan: garis rambut atas-bawah, teks di tengah. */
  header { text-align: center; border-top: 1px solid #cbb49f; border-bottom: 1px solid #cbb49f;
           padding: 14px 0; margin-bottom: 22px; }
  h1 { font-family: "Fraunces", Georgia, serif; font-weight: 400; font-size: 24px; margin: 0 0 6px;
       color: #5e1a26; letter-spacing: .01em; }
  .subtitle { font-size: 10.5px; text-transform: uppercase; letter-spacing: .18em; color: #8b7977; margin: 0; }
  h2 { font-family: "Outfit", Arial, sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase;
       letter-spacing: .18em; color: #5e1a26; margin: 24px 0 10px; padding-bottom: 6px;
       border-bottom: 1px solid #e1d4c8; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #e1d4c8; padding: 6px 8px; text-align: left; }
  th { background: #f2e7d5; font-weight: 600; }
  tr:nth-child(even) td { background: #fbf7ee; }
  .line { font-size: 12px; margin: 4px 0; }
  footer { margin-top: 28px; font-size: 10px; color: #8b7977; text-align: center; }
</style>
</head>
<body>
<header>
  <h1>${esc(docTitle)}</h1>
  <p class="subtitle">${esc(subtitle)}</p>
</header>
${body}
<footer>Dicetak dari SatuJanji · ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</footer>
</body>
</html>`;

  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) {
    // Popup diblokir — beri tahu pengguna lewat dialog cetak tab ini saja.
    window.print();
    return;
  }
  win.document.write(html);
  win.document.close();
  // Beri waktu render + gambar sebelum dialog cetak terbuka.
  win.addEventListener("load", () => {
    win.focus();
    win.print();
  });
}
