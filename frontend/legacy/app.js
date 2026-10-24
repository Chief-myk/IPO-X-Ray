/* IPO X-Ray front end. No build step: GSAP + ScrollTrigger + Lenis from CDN. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = !!window.gsap;

  const SEV_ORDER = ["critical", "high", "medium", "low", "unverified", "clear"];
  const SEV_NAME = { critical: "Critical", high: "High", medium: "Medium", low: "Low", unverified: "Unverified", clear: "Checks out" };
  const TYPE_NAME = { company: "Issuer", vendor: "Vendor", client: "Client", director: "Director", address: "Address", financial: "Financials" };

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (!reduce && window.Lenis && hasGsap) {
    lenis = new Lenis({ lerp: 0.11 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToEl = (el) => (lenis ? lenis.scrollTo(el, { offset: -70, duration: 1.2 }) : el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const t = $(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      scrollToEl(t);
      if (a.getAttribute("href") === "#probe") setTimeout(() => $("#company").focus({ preventScroll: true }), 700);
    })
  );

  /* ---------- mode chip ---------- */
  let LIVE = false;
  fetch("/api/health")
    .then((r) => r.json())
    .then((h) => {
      LIVE = h.live;
      const m = $("#mode");
      m.classList.add(h.live ? "live" : "sample");
      m.querySelector("span").textContent = h.live ? "TinyFish agents live" : "Sample mode: add a TinyFish key";
    })
    .catch(() => ($("#mode span").textContent = "Backend not reachable"));

  /* ---------- hero: the scan ---------- */
  const sheet = $("#sheet");
  const gutter = $("#gutter");
  const marks = $$(".claim", sheet);

  function layoutGutter() {
    gutter.innerHTML = "";
    const lb = $(".lightbox").getBoundingClientRect();
    let lastBottom = -Infinity;
    marks.forEach((m, i) => {
      const r = m.getBoundingClientRect();
      const li = document.createElement("li");
      li.dataset.sev = m.dataset.sev;
      li.dataset.i = i;
      li.innerHTML = `<small>${SEV_NAME[m.dataset.sev]}</small>${esc(m.dataset.note)}`;
      let top = r.top - lb.top - 2;
      if (top < lastBottom + 8) top = lastBottom + 8;
      li.style.top = top + "px";
      gutter.appendChild(li);
      lastBottom = top + 48;
      if (m.classList.contains("lit")) li.classList.add("show");
    });
  }
  const light = (i) => {
    marks[i].classList.add("lit");
    gutter.querySelector(`[data-i="${i}"]`)?.classList.add("show");
  };

  function heroIntro() {
    layoutGutter();
    if (reduce || !hasGsap) {
      marks.forEach((_, i) => light(i));
      return;
    }
    const beam = $("#beam");
    const sheetH = () => sheet.offsetHeight;
    const tl = gsap.timeline({ delay: 0.25 });
    tl.from(".hero h1 .line > span", { yPercent: 105, duration: 1, ease: "expo.out", stagger: 0.09 })
      .from(".lede, .probe", { opacity: 0, y: 18, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "-=.6")
      .from(".sheet", { opacity: 0, y: 40, rotate: 2, duration: 1.1, ease: "expo.out" }, "<-.2")
      .set(beam, { opacity: 1, y: 0 })
      .to(beam, {
        y: () => sheetH() + 90,
        duration: 3,
        ease: "none",
        onUpdate() {
          const y = gsap.getProperty(beam, "y") - sheetH() * 0.12 + 45;
          marks.forEach((m, i) => {
            if (!m.classList.contains("lit") && m.offsetTop + m.offsetHeight / 2 < y) light(i);
          });
        },
        onComplete() {
          marks.forEach((_, i) => light(i));
          gsap.to(beam, { opacity: 0, duration: 0.4 });
        },
      });
    // a gentle parallax on the sheet as you leave the hero
    gsap.to(".lightbox", { yPercent: -8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }
  document.fonts ? document.fonts.ready.then(heroIntro) : heroIntro();
  let rT;
  addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(layoutGutter, 150);
  });

  /* ---------- method: pinned, scroll-driven steps ---------- */
  const steps = $$("#steps li");
  const panels = $$("#stage .panel");
  const setStep = (i) => {
    steps.forEach((s, k) => s.classList.toggle("active", k === i));
    panels.forEach((p, k) => p.classList.toggle("active", k === i));
  };
  if (hasGsap && !reduce) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 981px)", () => {
      const st = ScrollTrigger.create({
        trigger: "#how",
        start: "top top",
        end: "+=2200",
        pin: ".method-inner",
        scrub: 0.4,
        onUpdate(self) {
          setStep(Math.min(3, Math.floor(self.progress * 4)));
          gsap.set("#progressBar", { scaleX: Math.max(0.25, self.progress), width: "100%" });
        },
      });
      return () => st.kill();
    });
    mm.add("(max-width: 980px)", () => {
      const st = ScrollTrigger.create({
        trigger: "#how",
        start: "top 60%",
        end: "bottom 40%",
        onUpdate(self) {
          setStep(Math.min(3, Math.floor(self.progress * 4)));
        },
      });
      return () => st.kill();
    });
    // count-up for the one big number in the cases
    const big = $("[data-count]");
    ScrollTrigger.create({
      trigger: big,
      start: "top 85%",
      once: true,
      onEnter() {
        const o = { v: 0 };
        gsap.to(o, { v: +big.dataset.count, duration: 1.6, ease: "power2.out", onUpdate: () => (big.textContent = "₹" + Math.round(o.v).toLocaleString("en-IN")) });
      },
    });
  } else {
    steps.forEach((s, i) => s.addEventListener("mouseenter", () => setStep(i)));
  }

  /* ---------- form ---------- */
  const form = $("#probe");
  const fileIn = $("#drhp");
  const drop = $("#drop");
  const msg = $("#formMsg");
  fileIn.addEventListener("change", () => showFile(fileIn.files[0]));
  function showFile(f) {
    drop.classList.toggle("has", !!f);
    $("#dropText").innerHTML = f ? `${esc(f.name)} <em>(${(f.size / 1048576).toFixed(1)} MB)</em>` : `Attach the DRHP PDF <em>(optional — without it, an agent finds it online)</em>`;
  }
  ["dragenter", "dragover"].forEach((e) => drop.addEventListener(e, (ev) => (ev.preventDefault(), drop.classList.add("over"))));
  ["dragleave", "drop"].forEach((e) => drop.addEventListener(e, (ev) => (ev.preventDefault(), drop.classList.remove("over"))));
  drop.addEventListener("drop", (ev) => {
    const f = ev.dataTransfer.files[0];
    if (f && f.type === "application/pdf") {
      const dt = new DataTransfer();
      dt.items.add(f);
      fileIn.files = dt.files;
      showFile(f);
    } else msg.textContent = "Drop a PDF of the DRHP.";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const company = $("#company").value.trim();
    if (!company) {
      msg.textContent = "Enter the company name as it appears on the IPO.";
      $("#company").focus();
      return;
    }
    if (!LIVE) {
      msg.textContent = "Live agents need TINYFISH_API_KEY in backend/.env. Try the sample case meanwhile.";
      return;
    }
    start({ company, file: fileIn.files[0], demo: false });
  });
  $("#sampleBtn").addEventListener("click", () => start({ company: "", demo: true }));

  /* ---------- investigation state ---------- */
  let S = null;
  let es = null;
  let clock = null;

  async function start({ company, file, demo }) {
    msg.textContent = "";
    const btns = [$("#startBtn"), $("#sampleBtn")];
    btns.forEach((b) => (b.disabled = true));
    try {
      const fd = new FormData();
      fd.append("company", company);
      fd.append("demo", demo ? "true" : "false");
      if (file) fd.append("drhp", file);
      const r = await fetch("/api/investigations", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || "Could not start the investigation.");
      openCase(j);
    } catch (err) {
      msg.textContent = err.message;
    } finally {
      btns.forEach((b) => (b.disabled = false));
    }
  }

  function openCase({ id, company, demo }) {
    if (es) es.close();
    clearInterval(clock);
    S = { id, company, demo, claims: {}, lanes: {}, steps: 0, agents: 0, t0: performance.now(), score: 0 };
    $("#report").hidden = true;
    const sec = $("#case");
    sec.hidden = false;
    $("#caseKicker").textContent = demo ? "Sample investigation (fictional company)" : "Live investigation";
    $("#caseTitle").textContent = company;
    $("#claimList").innerHTML = `<li class="ghost">Reading the document…</li>`;
    $("#lanes").innerHTML = "";
    $("#flagFeed").innerHTML = `<li class="empty">Flags will appear here as agents report back.</li>`;
    $$("#phases li").forEach((l) => l.classList.remove("on", "done"));
    ["#statAgents", "#statSteps"].forEach((s) => ($(s).textContent = "0"));
    setScore(0, true);
    $("#phaseLabel").classList.remove("idle");
    if (hasGsap) ScrollTrigger.refresh();
    requestAnimationFrame(() => scrollToEl(sec));
    clock = setInterval(() => ($("#statTime").textContent = ((performance.now() - S.t0) / 1000).toFixed(1)), 100);

    es = new EventSource(`/api/investigations/${id}/stream`);
    es.onmessage = (e) => handle(JSON.parse(e.data));
    es.addEventListener("end", () => {
      es.close();
      clearInterval(clock);
      $("#phaseLabel").classList.add("idle");
    });
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) clearInterval(clock);
    };
  }

  function setPhase(phase, label) {
    const order = ["read", "dispatch", "verify", "report"];
    const idx = order.indexOf(phase);
    $$("#phases li").forEach((li, i) => {
      li.classList.toggle("on", i === idx);
      li.classList.toggle("done", i < idx);
    });
    if (label) $("#phaseLabel").textContent = label;
  }

  function handle(ev) {
    switch (ev.type) {
      case "phase":
        return setPhase(ev.phase, ev.label);
      case "claims":
        return renderClaims(ev.claims);
      case "agent_start":
        return addLane(ev.agent);
      case "agent_step":
        return addStep(ev);
      case "agent_live":
        return addLive(ev);
      case "agent_done":
        return finishLane(ev);
      case "score":
        setScore(ev.score);
        return renderFeed(ev.flags);
      case "report":
        return renderReport(ev.report);
      case "error":
        $("#phaseLabel").textContent = "Stopped: " + ev.message;
        $("#phaseLabel").classList.add("idle");
        return;
    }
  }

  function renderClaims(claims) {
    const ul = $("#claimList");
    ul.innerHTML = "";
    claims.forEach((c, i) => {
      const li = document.createElement("li");
      li.id = "claim-" + c.id;
      li.innerHTML = `<small>${TYPE_NAME[c.type] || c.type}${c.page ? `, page ${esc(c.page)}` : ""}</small>${esc(c.name)}${c.detail && c.type !== "company" ? `<small>${esc(c.detail)}</small>` : ""}`;
      ul.appendChild(li);
      S.claims[c.id] = { el: li, worst: null, open: 0 };
      if (hasGsap && !reduce) gsap.from(li, { opacity: 0, x: -10, duration: 0.4, delay: i * 0.05 });
    });
  }

  function addLane(a) {
    S.agents++;
    $("#statAgents").textContent = S.agents;
    const el = document.createElement("article");
    el.className = "lane";
    el.innerHTML = `
      <div class="lane-top"><span>${esc(a.label)}</span><span class="lane-state">Working</span></div>
      <p class="lane-target">${esc(a.target)}</p>
      <ul class="lane-log"></ul>
      <div class="lane-foot"><span class="lane-time">0s</span><span class="lane-live"></span></div>`;
    $("#lanes").appendChild(el);
    S.lanes[a.id] = { el, t0: performance.now(), claim: a.claim_id, timer: null };
    const lane = S.lanes[a.id];
    lane.timer = setInterval(() => (el.querySelector(".lane-time").textContent = Math.round((performance.now() - lane.t0) / 1000) + "s"), 1000);
    const c = S.claims[a.claim_id];
    if (c) {
      c.open++;
      if (!c.worst) c.el.dataset.state = "checking";
    }
    if (hasGsap && !reduce) gsap.from(el, { opacity: 0, y: 16, scale: 0.98, duration: 0.45, ease: "power3.out" });
  }

  function addStep(ev) {
    const lane = S.lanes[ev.id];
    if (!lane) return;
    S.steps++;
    $("#statSteps").textContent = S.steps;
    const log = lane.el.querySelector(".lane-log");
    const li = document.createElement("li");
    if (ev.error) li.className = "err";
    li.textContent = ev.text;
    log.appendChild(li);
    while (log.children.length > 5) log.firstElementChild.remove();
    if (hasGsap && !reduce) gsap.from(li, { opacity: 0, x: -6, duration: 0.3 });
  }

  function addLive(ev) {
    const lane = S.lanes[ev.id];
    if (!lane) return;
    lane.el.querySelector(".lane-live").innerHTML = `<a href="${esc(ev.url)}" target="_blank" rel="noopener">Watch the browser</a>`;
  }

  const worst = (list) => list.reduce((w, s) => (w === null || SEV_ORDER.indexOf(s) < SEV_ORDER.indexOf(w) ? s : w), null);

  function finishLane(ev) {
    const lane = S.lanes[ev.id];
    if (!lane) return;
    clearInterval(lane.timer);
    const sev = worst(ev.findings.map((f) => f.severity)) || "clear";
    lane.el.classList.add("finished");
    lane.el.dataset.sev = sev;
    const top = ev.findings.find((f) => f.severity === sev);
    lane.el.querySelector(".lane-state").innerHTML = `<span class="sev" data-sev="${sev}">${SEV_NAME[sev]}</span>`;
    lane.el.querySelector(".lane-live").innerHTML = `<span class="lane-result">${esc(top ? top.title : "")}</span>`;
    const c = S.claims[lane.claim];
    if (c) {
      c.open--;
      c.worst = worst([c.worst, sev].filter(Boolean));
      if (c.open <= 0) {
        delete c.el.dataset.state;
        c.el.dataset.sev = c.worst;
      }
      c.el.classList.remove("flash");
      void c.el.offsetWidth;
      c.el.classList.add("flash");
    }
  }

  function renderFeed(flags) {
    const feed = $("#flagFeed");
    const before = new Set([...feed.children].map((li) => li.dataset.key));
    feed.innerHTML = flags.length ? "" : `<li class="empty">No signal has raised the model's estimate yet.</li>`;
    flags.forEach((f) => {
      const key = f.agent + f.feature + f.title;
      const li = document.createElement("li");
      li.dataset.sev = f.severity;
      li.dataset.key = key;
      li.innerHTML = `<span class="sev">${SEV_NAME[f.severity]}</span>${f.points ? `<span class="pts">+${f.points}</span>` : ""}<br>${esc(f.title)}<small>${esc(f.target)}</small>`;
      feed.appendChild(li);
      if (!before.has(key) && hasGsap && !reduce) gsap.from(li, { opacity: 0, x: 20, duration: 0.45, ease: "power3.out" });
    });
  }

  function scoreColor(v) {
    return v >= 60 ? "var(--critical)" : v >= 30 ? "var(--medium)" : "var(--clear)";
  }
  function setScore(v, instant) {
    const fill = $("#dialFill");
    const C = 314.16;
    fill.style.stroke = scoreColor(v);
    if (!hasGsap || reduce || instant) {
      fill.style.strokeDashoffset = C - (C * v) / 100;
      $("#riskScore").textContent = v;
      S && (S.score = v);
      return;
    }
    const o = { v: S.score };
    gsap.to(o, {
      v,
      duration: 0.8,
      ease: "power2.out",
      onUpdate() {
        $("#riskScore").textContent = Math.round(o.v);
        fill.style.strokeDashoffset = C - (C * o.v) / 100;
      },
    });
    S.score = v;
  }

  /* ---------- report ---------- */
  let lastReport = null;
  function renderReport(r) {
    lastReport = r;
    setPhase("report", `Done in ${r.elapsed}s. ${r.agents_run} agents, ${r.flags.length} flag${r.flags.length === 1 ? "" : "s"}.`);
    $$("#phases li").forEach((li) => li.classList.add("done"));
    const sec = $("#report");
    const tone = r.score >= 60 ? "critical" : r.score >= 30 ? "medium" : "clear";
    sec.dataset.sev = tone;
    $("#reportFor").textContent = `Report on ${r.company}${r.demo ? " (fictional sample)" : ""}`;
    $("#verdict").textContent = r.verdict;
    $("#summary").textContent = r.summary || "Each flag below links back to the claim it concerns and to the sources the agents found.";
    $("#reportScore").textContent = r.score;
    $("#disclaimer").textContent = r.disclaimer;

    const claimName = (id) => S.claims[id]?.el.childNodes[1]?.textContent || "";
    $("#flagList").innerHTML = r.flags.length
      ? r.flags
          .map(
            (f) => `<li data-sev="${f.severity}">
          <div class="flag-side"><span class="sev">${SEV_NAME[f.severity]}</span>${f.points ? `<b class="pts">+${f.points}</b>` : ""}</div>
          <div>
            <h4>${esc(f.title)}</h4>
            <p class="about">${esc(claimName(f.claim_id) || f.target)}</p>
            <p>${esc(f.detail)}</p>
            ${f.evidence?.length ? `<div class="src">${f.evidence.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\//, ""))}</a>`).join("")}</div>` : ""}
          </div></li>`
          )
          .join("")
      : `<li><span></span><div><h4>No red flags</h4><p>Every claim the agents checked was backed by public evidence.</p></div></li>`;
    const maxPts = Math.max(1, ...r.drivers.map((d) => Math.abs(d.points)));
    $("#drivers").innerHTML = r.drivers
      .map((d) => `<li class="${d.points >= 0 ? "up" : "down"}"><span>${esc(d.label)}</span><i style="--w:${(Math.abs(d.points) / maxPts) * 100}%"></i><b>${d.points > 0 ? "+" : ""}${d.points}</b></li>`)
      .join("");
    const m = r.model;
    $("#modelNote").textContent =
      `Scored by ${m.name.toLowerCase()}, trained on ${m.n_synthetic.toLocaleString("en-IN")} synthetic cases` +
      (m.n_real ? ` and ${m.n_real} real labelled IPOs (AUC on real cases: ${m.auc_real ?? "n/a"})` : " and no real labelled IPOs yet") +
      `. Fraud probability ${Math.round(r.probability * 100)}%.` +
      (r.anomaly_pct != null ? ` Less typical than ${r.anomaly_pct}% of clean SME IPOs in the training set.` : "");
    $("#okList").innerHTML = r.verified.length
      ? r.verified.map((c) => `<li>${esc(c.name)}<small>${TYPE_NAME[c.type] || c.type}</small></li>`).join("")
      : `<li class="none">None of the claims could be fully confirmed.</li>`;

    sec.hidden = false;
    if (hasGsap) ScrollTrigger.refresh();
    setTimeout(() => {
      scrollToEl(sec);
      if (hasGsap && !reduce) {
        gsap.from(".verdict", { yPercent: 40, opacity: 0, duration: 1, ease: "expo.out", delay: 0.4 });
        const o = { v: 0 };
        gsap.to(o, { v: r.score, duration: 1.4, delay: 0.4, ease: "power2.out", onUpdate: () => ($("#reportScore").textContent = Math.round(o.v)) });
        gsap.from("#flagList li", { opacity: 0, y: 14, stagger: 0.06, duration: 0.5, delay: 0.7 });
      }
    }, 900);
  }

  $("#downloadBtn").addEventListener("click", () => {
    if (!lastReport) return;
    const blob = new Blob([JSON.stringify(lastReport, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `ipo-xray-${lastReport.company.replace(/\W+/g, "-").toLowerCase()}.json` });
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $("#printBtn").addEventListener("click", () => print());
  $("#againBtn").addEventListener("click", () => {
    scrollToEl($("#top"));
    setTimeout(() => $("#company").focus({ preventScroll: true }), 900);
  });
})();
