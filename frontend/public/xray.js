(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = (u, t) => (u && /^https?:\/\//.test(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>` : "");
  const api = (p, opt) => fetch(p, opt).then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(new Error(j.detail || r.statusText)))));
  const form = (o) => { const f = new FormData(); Object.entries(o).forEach(([k, v]) => f.append(k, v)); return f; };

  // ---- tabs, mode ----
  document.querySelectorAll(".tab").forEach((b) => b.onclick = () => {
    document.querySelectorAll(".tab,.panel").forEach((e) => e.classList.remove("on"));
    b.classList.add("on"); $("#" + b.dataset.p).classList.add("on");
    if (b.dataset.p === "ven") loadVendors();
    if (b.dataset.p === "alr") loadWatch();
  });
  api("/api/mode").then((m) => {
    const el = $("#mode");
    el.textContent = m.demo ? "Demo mode · cached agent results" : m.live ? "Live · TinyFish connected" : "No TinyFish key";
    el.className = "badge " + (m.demo ? "demo" : m.live ? "live" : "");
  });
  const loadEntities = () => api("/api/entities").then((rows) => { $("#ents").innerHTML = rows.map((r) => `<option value="${esc(r.name)}">${esc(r.kind)}</option>`).join(""); });
  loadEntities();

  // ---- run agents with live progress ----
  const lanes = {};
  function lane(id, a) {
    if (lanes[id]) return lanes[id];
    const d = document.createElement("div");
    d.className = "card lane";
    d.innerHTML = `<div class="k">${esc(a.kind)} agent</div><div class="t">${esc(a.target)}</div><div class="s">Starting…</div><div class="l"></div>`;
    $("#lanes").appendChild(d);
    return (lanes[id] = d);
  }
  $("#go").onclick = async () => {
    const name = $("#name").value.trim();
    if (!name) return;
    $("#go").disabled = true; $("#lanes").innerHTML = ""; $("#phase").textContent = "Starting…"; Object.keys(lanes).forEach((k) => delete lanes[k]);
    try {
      const run = await api("/api/runs", { method: "POST", body: form({ kind: $("#kind").value, name, refresh: $("#refresh").checked }) });
      const es = new EventSource(`/api/investigations/${run.id}/stream`);
      es.onmessage = (m) => {
        const e = JSON.parse(m.data);
        if (e.type === "phase") $("#phase").textContent = e.label;
        else if (e.type === "agent_start") lane(e.agent.id, e.agent);
        else if (e.type === "agent_step" && lanes[e.id]) { const s = lanes[e.id].querySelector(".s"); s.textContent = e.text; if (e.error) s.style.color = "var(--amber)"; }
        else if (e.type === "agent_live" && lanes[e.id]) lanes[e.id].querySelector(".l").innerHTML = link(e.url, "Watch the browser live");
        else if (e.type === "agent_done" && lanes[e.id]) {
          const d = lanes[e.id]; d.classList.add(e.ok ? "done" : "fail");
          d.querySelector(".s").innerHTML = e.ok ? `Done${e.from_cache ? " (from cache)" : ""} · ${(e.sources || []).length} sources` : esc(e.error || "Not found");
        } else if (e.type === "error") $("#phase").textContent = "Error: " + e.message;
        else if (e.type === "done") {
          $("#phase").textContent = "Finished. Map, scorecards and watchlist below are updated.";
          $("#q").value = name; $("#wname").value = name; loadEntities(); showGraph(); loadVendors();
        }
      };
      es.addEventListener("end", () => { es.close(); $("#go").disabled = false; });
      es.onerror = () => { es.close(); $("#go").disabled = false; };
    } catch (err) { $("#phase").textContent = err.message; $("#go").disabled = false; }
  };

  // ---- Feature 1: network ----
  const COLOR = { company: "#5aa2ff", person: "#a78bfa", vendor: "#f59e42", address: "#8b94a3", phone: "#8b94a3", email: "#8b94a3" };
  const SHAPE = { company: "box", person: "dot", vendor: "diamond", address: "triangle", phone: "triangle", email: "triangle" };
  let net, data;
  async function showGraph() {
    const q = $("#q").value.trim(); if (!q) return;
    data = await api(`/api/graph?q=${encodeURIComponent(q)}&depth=${$("#depth").value}`);
    if (!data.found) { $("#detail").innerHTML = `<b>Not found.</b> <span class="muted">Nothing stored for “${esc(q)}” yet. Run the agents above first.</span>`; $("#flags").innerHTML = ""; if (net) net.destroy(); return; }
    const nodes = new vis.DataSet(data.nodes.map((n) => ({
      id: n.id, label: n.label.length > 28 ? n.label.slice(0, 27) + "…" : n.label, shape: SHAPE[n.kind] || "dot",
      color: { background: COLOR[n.kind], border: n.flagged ? "#ff5d5d" : COLOR[n.kind] }, borderWidth: n.flagged ? 4 : 1,
      font: { color: "#e8ecf2", size: 13 }, size: n.id === data.start ? 24 : 16 })));
    const edges = new vis.DataSet(data.edges.map((e) => ({
      id: e.id, from: e.from, to: e.to, label: e.rel.replace("_", " ").toLowerCase(), arrows: "to",
      color: { color: e.flagged ? "#ff5d5d" : "#4a5362" }, width: e.flagged ? 4 : 1.2, dashes: !e.flagged && e.rel.startsWith("HAS"),
      font: { color: "#8b94a3", size: 10, strokeWidth: 0 } })));
    if (net) net.destroy();
    net = new vis.Network($("#graph"), { nodes, edges }, { physics: { stabilization: 120, barnesHut: { springLength: 130 } }, interaction: { hover: true } });
    net.on("click", (p) => {
      if (p.nodes.length) nodeDetail(data.nodes.find((n) => n.id === p.nodes[0]));
      else if (p.edges.length) edgeDetail(data.edges.find((e) => e.id === p.edges[0]));
    });
    nodeDetail(data.nodes.find((n) => n.id === data.start));
    $("#flags").innerHTML = data.flags.length
      ? `<h4>Red flags (need review)</h4>` + data.flags.map((f) => `<div class="flag">${esc(f.reason)}</div>`).join("")
      : `<p class="muted">No shared address, phone, email or repeated vendor found in the stored data.</p>`;
  }
  function nodeDetail(n) {
    if (!n) return;
    const facts = n.facts.map((f) => `<div><span class="muted">${esc(f.field)}:</span> ${esc(f.value)}<br><small class="muted">${link(f.source_url, "source")} · fetched ${esc(f.fetched_at || "?")}</small></div>`).join("");
    $("#detail").innerHTML = `<div class="muted" style="text-transform:uppercase;font-size:12px">${esc(n.kind)}</div><h3 style="margin:2px 0 8px">${esc(n.label)}</h3>`
      + (n.reasons.length ? `<div class="flag">${esc(n.reasons[0])}</div>` : "") + (facts || '<span class="muted">No sourced facts stored.</span>');
  }
  function edgeDetail(e) {
    $("#detail").innerHTML = `<h3 style="margin:0 0 8px">${esc(e.rel.replace("_", " ").toLowerCase())}</h3>` + (e.reason ? `<div class="flag">${esc(e.reason)}</div>` : "")
      + `<div>${link(e.source_url, "Source") || '<span class="muted">No source URL stored</span>'}</div><small class="muted">fetched ${esc(e.fetched_at || "?")}</small>`;
  }
  $("#map").onclick = showGraph;

  // ---- Feature 2: vendors ----
  async function loadVendors() {
    const rows = await api("/api/vendors");
    $("#vgrid").innerHTML = rows.length ? rows.map((v) => {
      const col = v.score == null ? "var(--mute)" : v.score >= 70 ? "var(--green)" : v.score >= 40 ? "var(--amber)" : "var(--red)";
      return `<div class="card"><div class="row"><b>${esc(v.name)}</b><span style="flex:1"></span>${v.multi_company_flag ? '<span class="tag">Used by ' + v.used_by.length + " companies</span>" : ""}</div>
        <div class="muted" style="font-size:13px">Named by: ${esc(v.used_by.join(", ") || "n/a")}</div>
        ${v.score == null ? '<p class="muted">Not checked yet. Run a vendor agent above.</p>' : `<div class="score" style="color:${col}">${v.score}<small class="muted"> / 100 presence</small></div>
        <div class="bar"><i style="width:${v.score}%;background:${col}"></i></div>
        ${v.checks.map((c) => `<div class="chk ${c.status}"><b>${c.status === "pass" ? "✓ pass" : c.status === "fail" ? "✗ fail" : "? unverified"}</b><span>${esc(c.label)} <span class="muted">· ${esc(c.detail)} (${c.points}/${c.max})</span></span></div>`).join("")}
        <small class="muted">Checked ${esc(v.run_at || "")}</small>`}
        <div style="margin-top:6px;font-size:13px">${v.sources.slice(0, 5).map((s) => link(s, new URL(s).hostname)).join(" · ")}</div></div>`;
    }).join("") : '<p class="muted">No vendors stored yet. Run a company to pull its vendors from the offer document.</p>';
  }

  // ---- Feature 3: watch ----
  async function loadWatch() {
    const w = await api("/api/watch");
    $("#wlist").textContent = w.watched.length ? "Watching: " + w.watched.join(", ") : "Watchlist is empty.";
    $("#feed").innerHTML = w.alerts.length ? w.alerts.map((a) => `<div class="alert"><time>${esc(a.detected_at.replace("T", " ").replace("Z", " UTC"))}</time>
      <div><b>${esc(a.subject)}</b> ${a.simulated ? '<span class="tag sim">SIMULATED</span>' : ""}<br>${esc(a.detail)}${a.source_url ? "<br>" + link(a.source_url, "source") : ""}</div></div>`).join("")
      : '<span class="muted">No changes recorded yet. Re-run checks later, or simulate one for the demo.</span>';
  }
  const wn = () => $("#wname").value.trim();
  $("#wadd").onclick = async () => { if (wn()) { await api("/api/watch", { method: "POST", body: form({ name: wn() }) }); loadWatch(); } };
  $("#wsim").onclick = async () => { if (wn()) { await api("/api/watch/simulate", { method: "POST", body: form({ name: wn() }) }); loadWatch(); } };
  $("#wrun").onclick = async () => {
    const b = $("#wrun"); b.disabled = true; b.textContent = "Agents running…";
    try { await api("/api/watch/run", { method: "POST", body: form({ name: wn() }) }); } catch (e) { alert(e.message); }
    b.disabled = false; b.textContent = "Re-run checks now"; loadWatch();
  };
})();
