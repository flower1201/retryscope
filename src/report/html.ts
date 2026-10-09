import type { ReportDocument } from "./types.js";

function embedJson(doc: ReportDocument): string {
  // Prevent </script> breakouts inside HTML script payload
  return JSON.stringify(doc)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function renderHtmlReport(doc: ReportDocument): string {
  const payload = embedJson(doc);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>RetryScope Report</title>
<style>
  :root {
    --bg: #0f1419;
    --panel: #1a222c;
    --text: #e7eef7;
    --muted: #9aabbd;
    --fail: #ff6b6b;
    --ok: #3dd68c;
    --unk: #f0c14b;
    --line: #2b3642;
    --accent: #6cb6ff;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", system-ui, sans-serif;
    background: radial-gradient(1200px 600px at 10% -10%, #1c2a3a, var(--bg));
    color: var(--text);
    line-height: 1.45;
  }
  header, main { max-width: 960px; margin: 0 auto; padding: 24px 20px; }
  h1 { margin: 0 0 6px; font-size: 1.6rem; letter-spacing: 0.02em; }
  .tagline { color: var(--muted); margin-bottom: 18px; }
  .demo { color: var(--unk); font-size: 0.9rem; margin-bottom: 16px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
  .card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px;
  }
  .card .n { font-size: 1.5rem; font-weight: 700; }
  .card .l { color: var(--muted); font-size: 0.85rem; }
  .finding {
    margin-top: 16px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 16px;
  }
  .finding h2 { margin: 0 0 8px; font-size: 1.1rem; }
  .meta { color: var(--muted); font-size: 0.9rem; margin-bottom: 10px; }
  .timeline { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
  .ev {
    display: grid;
    grid-template-columns: 18px 1fr;
    gap: 10px;
    align-items: start;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    background: #121820;
  }
  .ev:hover, .ev.active { border-color: var(--accent); }
  .dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; }
  .dot.failure { background: var(--fail); }
  .dot.success { background: var(--ok); }
  .dot.unknown { background: var(--unk); }
  .detail {
    margin-top: 8px;
    padding: 10px;
    border-radius: 8px;
    background: #10161d;
    border: 1px dashed var(--line);
    color: var(--muted);
    font-size: 0.9rem;
    display: none;
  }
  .detail.open { display: block; }
  .status-failure { color: var(--fail); }
  .status-success { color: var(--ok); }
  .status-unknown { color: var(--unk); }
  ul.limits { color: var(--muted); }
  footer { max-width: 960px; margin: 0 auto; padding: 0 20px 40px; color: var(--muted); font-size: 0.85rem; }
</style>
</head>
<body>
<header>
  <h1>RETRYSCOPE</h1>
  <div class="tagline">Find out where your AI coding agent got stuck.</div>
  <div id="demoNote" class="demo"></div>
  <div class="cards" id="cards"></div>
</header>
<main>
  <section id="findings"></section>
  <section>
    <h2>Limitations</h2>
    <ul class="limits" id="limits"></ul>
  </section>
</main>
<footer id="footer"></footer>
<script>
const DATA = ${payload};
(function () {
  const $ = (id) => document.getElementById(id);
  function text(el, value) { el.textContent = value == null ? "" : String(value); }

  if (DATA.demoNote) text($("demoNote"), DATA.demoNote);

  const s = DATA.summary;
  const cardDefs = [
    ["Tool Calls", s.totalToolCalls],
    ["Confirmed Failures", s.confirmedFailures],
    ["Successful Results", s.successCount],
    ["Unknown Results", s.unknownCount],
    ["Retry Patterns", s.findingsCount],
  ];
  const cards = $("cards");
  for (const [label, n] of cardDefs) {
    const d = document.createElement("div");
    d.className = "card";
    const nn = document.createElement("div");
    nn.className = "n";
    text(nn, n);
    const ll = document.createElement("div");
    ll.className = "l";
    text(ll, label);
    d.appendChild(nn);
    d.appendChild(ll);
    cards.appendChild(d);
  }

  const root = $("findings");
  if (!DATA.findings.length) {
    const p = document.createElement("p");
    text(p, "No repeated-failure patterns detected under the current rule.");
    root.appendChild(p);
  }

  DATA.findings.forEach((f, fi) => {
    const box = document.createElement("article");
    box.className = "finding";
    const h = document.createElement("h2");
    text(h, "Potential repeated failure " + f.id + " — " + f.toolName);
    box.appendChild(h);

    const meta = document.createElement("div");
    meta.className = "meta";
    text(meta,
      "Calls: " + f.callCount +
      " · Confirmed failures: " + f.confirmedFailures +
      " · Success: " + f.successCount +
      " · Unknown: " + f.unknownCount
    );
    box.appendChild(meta);

    const expl = document.createElement("p");
    text(expl, f.explanation);
    box.appendChild(expl);

    const tlTitle = document.createElement("h3");
    text(tlTitle, "Execution timeline");
    box.appendChild(tlTitle);

    const tl = document.createElement("div");
    tl.className = "timeline";
    const detail = document.createElement("div");
    detail.className = "detail";
    detail.id = "detail-" + fi;

    f.evidence.forEach((e, ei) => {
      const row = document.createElement("div");
      row.className = "ev";
      row.setAttribute("role", "button");
      row.tabIndex = 0;
      const dot = document.createElement("div");
      dot.className = "dot " + e.status;
      const body = document.createElement("div");
      const line1 = document.createElement("div");
      const ts = e.timestamp ? e.timestamp.replace("T", " ").replace(/\\.\\d+Z$/, "Z") : "no timestamp";
      text(line1, ts + "  ·  ");
      const st = document.createElement("span");
      st.className = "status-" + e.status;
      text(st, e.status);
      line1.appendChild(st);
      const line2 = document.createElement("div");
      line2.style.color = "var(--muted)";
      line2.style.fontSize = "0.85rem";
      text(line2, "Event " + e.eventId + " · source line " + e.sourceLine);
      body.appendChild(line1);
      body.appendChild(line2);
      row.appendChild(dot);
      row.appendChild(body);

      function activate() {
        document.querySelectorAll(".ev.active").forEach((n) => n.classList.remove("active"));
        row.classList.add("active");
        detail.classList.add("open");
        text(detail,
          "Event ID: " + e.eventId +
          "\\nSource line: " + e.sourceLine +
          "\\nTimestamp: " + (e.timestamp || "n/a") +
          "\\nTool status: " + e.status +
          "\\n(Raw commands and tool outputs are omitted for privacy.)"
        );
      }
      row.addEventListener("click", activate);
      row.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); activate(); }
      });
      if (ei === 0) activate();
      tl.appendChild(row);
    });

    box.appendChild(tl);
    const evTitle = document.createElement("h3");
    text(evTitle, "Evidence explorer");
    box.appendChild(evTitle);
    box.appendChild(detail);

    const lim = document.createElement("ul");
    f.limitations.forEach((x) => {
      const li = document.createElement("li");
      text(li, x);
      lim.appendChild(li);
    });
    box.appendChild(lim);
    root.appendChild(box);
  });

  const limits = $("limits");
  DATA.limitations.forEach((x) => {
    const li = document.createElement("li");
    text(li, x);
    limits.appendChild(li);
  });

  text($("footer"),
    "schema " + DATA.schemaVersion +
    " · engine " + DATA.engineVersion +
    " · generated " + DATA.generatedAt +
    " · offline local report (no network)"
  );
})();
</script>
</body>
</html>
`;
}
