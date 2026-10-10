function c(r,n,i){const e=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),s=i.map(t=>{const d=t.headers&&t.rows?`<table>
              <thead><tr>${t.headers.map(o=>`<th>${e(o)}</th>`).join("")}</tr></thead>
              <tbody>
                ${t.rows.map(o=>`<tr>${o.map(m=>`<td>${e(m)}</td>`).join("")}</tr>`).join("")}
              </tbody>
            </table>`:"",p=(t.lines??[]).map(o=>`<p class="line">${e(o)}</p>`).join("");return`<section><h2>${e(t.title)}</h2>${d}${p}</section>`}).join(""),l=`<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${e(r)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Plus Jakarta Sans", "Segoe UI", Arial, sans-serif; color: #241c20; margin: 0; }
  /* Kepala dokumen bergaya kertas undangan: garis emas atas-bawah, teks di tengah. */
  header { text-align: center; border-top: 1px solid #c49e62; border-bottom: 1px solid #c49e62;
           padding: 14px 0; margin-bottom: 22px; }
  h1 { font-family: "Cormorant Garamond", Georgia, serif; font-weight: 500; font-size: 27px; margin: 0 0 6px;
       color: #1a3424; letter-spacing: .01em; }
  .subtitle { font-size: 10.5px; text-transform: uppercase; letter-spacing: .2em; color: #9d6d2f; margin: 0; }
  h2 { font-family: "Plus Jakarta Sans", Arial, sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase;
       letter-spacing: .2em; color: #1a3424; margin: 24px 0 10px; padding-bottom: 6px;
       border-bottom: 1px solid #e2d9d7; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #e2d9d7; padding: 6px 8px; text-align: left; }
  th { background: #f3ecdd; font-weight: 600; }
  tr:nth-child(even) td { background: #faf7ee; }
  .line { font-size: 12px; margin: 4px 0; }
  footer { margin-top: 28px; font-size: 10px; color: #9d6d2f; text-align: center; }
</style>
</head>
<body>
<header>
  <h1>${e(r)}</h1>
  <p class="subtitle">${e(n)}</p>
</header>
${s}
<footer>Dicetak dari SatuJanji · ${new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</footer>
</body>
</html>`,a=window.open("","_blank","noopener,noreferrer");if(!a){window.print();return}a.document.write(l),a.document.close(),a.addEventListener("load",()=>{a.focus(),a.print()})}export{c as p};
