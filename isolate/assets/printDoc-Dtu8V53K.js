function c(r,a,i){const t=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),l=i.map(e=>{const d=e.headers&&e.rows?`<table>
              <thead><tr>${e.headers.map(n=>`<th>${t(n)}</th>`).join("")}</tr></thead>
              <tbody>
                ${e.rows.map(n=>`<tr>${n.map(m=>`<td>${t(m)}</td>`).join("")}</tr>`).join("")}
              </tbody>
            </table>`:"",s=(e.lines??[]).map(n=>`<p class="line">${t(n)}</p>`).join("");return`<section><h2>${t(e.title)}</h2>${d}${s}</section>`}).join(""),p=`<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${t(r)}</title>
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #24302a; margin: 0; }
  header { border-bottom: 3px double #425a49; padding-bottom: 12px; margin-bottom: 20px; }
  h1 { font-size: 22px; margin: 0 0 4px; color: #425a49; letter-spacing: .02em; }
  .subtitle { font-size: 12px; color: #6b7a71; margin: 0; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .08em;
       color: #425a49; margin: 22px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #cfdcd4; padding: 6px 8px; text-align: left; }
  th { background: #eef6f0; font-weight: 700; }
  tr:nth-child(even) td { background: #f8fbf9; }
  .line { font-size: 12px; margin: 4px 0; }
  footer { margin-top: 28px; font-size: 10px; color: #8a978f; text-align: center; }
</style>
</head>
<body>
<header>
  <h1>${t(r)}</h1>
  <p class="subtitle">${t(a)}</p>
</header>
${l}
<footer>Dicetak dari SatuJanji · ${new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</footer>
</body>
</html>`,o=window.open("","_blank","noopener,noreferrer");if(!o){window.print();return}o.document.write(p),o.document.close(),o.addEventListener("load",()=>{o.focus(),o.print()})}export{c as p};
