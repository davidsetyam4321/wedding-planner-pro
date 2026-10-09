function c(r,n,i){const e=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),l=i.map(t=>{const p=t.headers&&t.rows?`<table>
              <thead><tr>${t.headers.map(o=>`<th>${e(o)}</th>`).join("")}</tr></thead>
              <tbody>
                ${t.rows.map(o=>`<tr>${o.map(m=>`<td>${e(m)}</td>`).join("")}</tr>`).join("")}
              </tbody>
            </table>`:"",s=(t.lines??[]).map(o=>`<p class="line">${e(o)}</p>`).join("");return`<section><h2>${e(t.title)}</h2>${p}${s}</section>`}).join(""),d=`<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${e(r)}</title>
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Plus Jakarta Sans", Arial, sans-serif; color: #3a2317; margin: 0; }
  header { border-bottom: 3px double #3a2317; padding-bottom: 12px; margin-bottom: 20px; }
  h1 { font-family: "Marcellus", "GRIFTER", Georgia, serif; font-size: 22px; margin: 0 0 4px; color: #3a2317; letter-spacing: .02em; }
  .subtitle { font-size: 12px; color: #7a6247; margin: 0; }
  h2 { font-family: "GRIFTER", "Bagel Fat One", "Inter", Arial, sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: .08em;
       color: #3a2317; margin: 22px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #dcdad7; padding: 6px 8px; text-align: left; }
  th { background: #efe6d6; font-weight: 700; }
  tr:nth-child(even) td { background: #f7f7f8; }
  .line { font-size: 12px; margin: 4px 0; }
  footer { margin-top: 28px; font-size: 10px; color: #8b8d93; text-align: center; }
</style>
</head>
<body>
<header>
  <h1>${e(r)}</h1>
  <p class="subtitle">${e(n)}</p>
</header>
${l}
<footer>Dicetak dari SatuJanji · ${new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</footer>
</body>
</html>`,a=window.open("","_blank","noopener,noreferrer");if(!a){window.print();return}a.document.write(d),a.document.close(),a.addEventListener("load",()=>{a.focus(),a.print()})}export{c as p};
