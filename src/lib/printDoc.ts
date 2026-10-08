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
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Inter", Arial, sans-serif; color: #151b31; margin: 0; }
  header { border-bottom: 3px double #151b31; padding-bottom: 12px; margin-bottom: 20px; }
  h1 { font-family: "GRIFTER", "Bagel Fat One", "Inter", Arial, sans-serif; font-size: 22px; margin: 0 0 4px; color: #151b31; letter-spacing: .02em; }
  .subtitle { font-size: 12px; color: #6d6f75; margin: 0; }
  h2 { font-family: "GRIFTER", "Bagel Fat One", "Inter", Arial, sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: .08em;
       color: #151b31; margin: 22px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #dcdad7; padding: 6px 8px; text-align: left; }
  th { background: #f2f2f2; font-weight: 700; }
  tr:nth-child(even) td { background: #f7f7f8; }
  .line { font-size: 12px; margin: 4px 0; }
  footer { margin-top: 28px; font-size: 10px; color: #8b8d93; text-align: center; }
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
