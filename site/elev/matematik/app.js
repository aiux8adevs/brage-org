// Maths, part without aids: overview, diagnostic test, adaptive practice and a timed test.
// Pages by address: #  (overview) · #diagnose · #oev  or  #oev/<skill> · #proeve
// Every answer becomes a progress event (shared/progress.js). Each skill's level is worked out from the events:
// three right in a row at the current level moves up, two wrong in a row moves down (levels 1–3).
// A diagnostic answer sets the start: right gives level 2 with a head start, wrong gives level 1.
(() => {
  const { SKILLS, AREAS, byId, dk, withSeed } = MathSkills;
  const SUB = "matematik", main = document.getElementById("app");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // ---------- feedback after an answer: verdict, the right answer, what went wrong, why, and the rule ----------
  // Made to be easy to take in at a glance: a big ✓ or ✗, then short blocks, the same order every time.
  const Fs = (a, b) => `<span class="fr"><span>${dk(a)}</span><span>${dk(b)}</span></span>`;
  function answerText(t) {
    if (t.ans) return t.ans;
    if (t.spec.kind !== "num") return "";
    const v = t.spec.v;
    if (t.spec.tol > 1e-6) {                                       // answers with π: show "9π ≈ 28,27"
      const k = v / Math.PI, kr = Math.round(k * 2) / 2;
      return (Math.abs(k - kr) < 1e-9 ? `${dk(kr)}π ≈ ` : "≈ ") + dk(Math.round(v * 100) / 100);
    }
    for (let d = 1; d <= 100; d++) {                                // a fraction when the value is one, else the number
      const n = Math.round(v * d);
      if (Math.abs(v * d - n) < 1e-9) {
        if (d === 1) return dk(n);
        const short = Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-9;
        return Fs(n, d) + (short ? ` = ${dk(v)}` : "");
      }
    }
    return dk(Math.round(v * 1000) / 1000);
  }
  function trapHint(t, r) {
    if (r.ok || r.value === undefined || !t.traps) return "";
    const tol = Math.max(1e-9, (t.spec.tol || 1e-9) * Math.abs(t.spec.v));
    const hit = t.traps.find(([v]) => Math.abs(v - t.spec.v) > tol && Math.abs(r.value - v) <= Math.max(1e-9, (t.spec.tol || 1e-9) * Math.abs(v)));
    return hit ? hit[1] : "";
  }
  function feedbackHTML(t, r, given, skillId) {
    const steps = String(t.sol).split(/(?<=\.)\s+(?=[A-ZÆØÅ0-9(√−])/).filter(Boolean);
    const rule = (typeof MathRules !== "undefined" && MathRules[skillId]) || "";
    const ans = answerText(t), trap = trapHint(t, r);
    return `<div class="verdict ${r.ok ? "ok" : "no"}">${r.ok ? "✓ Rigtigt" : r.empty ? "Ikke besvaret" : "✗ Ikke helt"}</div>` +
      (ans ? `<p class="right-ans">Det rigtige svar er <b>${ans}</b></p>` : "") +
      (!r.ok && !r.empty ? `<p class="you">Du skrev ${esc(given)}</p>` : "") +
      (trap ? `<p class="trap">${trap}</p>` : "") +
      `<div class="why"><b>Her er hvorfor</b><ol>${steps.map(x => `<li>${x}</li>`).join("")}</ol></div>` +
      (rule ? `<div class="rule"><b>Regel</b> ${rule}</div>` : "");
  }

  // ---------- skill states from the events ----------
  function states() {
    const st = Object.fromEntries(SKILLS.map(s => [s.id, { lv: 1, streak: 0, wrongs: 0, n: 0, recent: [], last: 0 }]));
    for (const e of Progress.events(SUB)) {
      const k = st[e.s]; if (!k) continue;
      k.n++; k.recent.push(e.ok); if (k.recent.length > 10) k.recent.shift(); k.last = e.t;
      if (e.mode === "diag") { k.lv = e.ok ? 2 : 1; k.streak = e.ok ? 1 : 0; k.wrongs = 0; continue; }
      if (e.lv !== k.lv) continue;                                  // answers at another level (timed test) only count as history
      if (e.ok) { k.wrongs = 0; if (++k.streak >= 3 && k.lv < 3) { k.lv++; k.streak = 0; } }
      else { k.streak = 0; if (++k.wrongs >= 2 && k.lv > 1) { k.lv--; k.wrongs = 0; } }
    }
    for (const k of Object.values(st)) {
      const acc = k.recent.length ? k.recent.filter(Boolean).length / k.recent.length : 0;
      k.acc = acc;
      k.score = k.n ? 0.5 * (k.lv - 1) / 2 + 0.5 * acc : 0;           // 0..1: level and recent accuracy
      k.colour = !k.n ? "new" : k.score >= 0.75 ? "good" : k.score >= 0.45 ? "mid" : "weak";
    }
    return st;
  }
  // next skill to practise: weak and long-unseen skills first, never the same twice in a row
  function nextSkill(st, prev) {
    const now = Date.now();
    const w = SKILLS.filter(s => s.id !== prev).map(s => {
      const k = st[s.id], days = k.last ? (now - k.last) / 864e5 : 7;
      return [s, (1.15 - k.score) + Math.min(days, 7) * 0.05 + Math.random() * 0.25];
    }).sort((a, b) => b[1] - a[1]);
    return w[0][0];
  }

  // ---------- one task on screen ----------
  function taskHTML(t, i) {
    return `<div class="task" data-i="${i}"><div class="tq">${t.q}</div>${t.fig || ""}` +
      `<div class="answer"><input type="text" autocomplete="off" spellcheck="false" aria-label="Dit svar" placeholder="Dit svar">` +
      `<span class="keys">${["x", "^", "/", "π", "√", "½"].map(k => `<button type="button" class="key" data-k="${k}">${k}</button>`).join("")}</span></div>` +
      (t.hint ? `<p class="hint">${t.hint}</p>` : "") + `<div class="fb" aria-live="polite"></div></div>`;
  }
  function wireKeys(root) {
    root.querySelectorAll(".key").forEach(b => b.onclick = () => {
      const inp = b.closest(".task").querySelector("input"), p = inp.selectionStart ?? inp.value.length;
      inp.value = inp.value.slice(0, p) + b.dataset.k + inp.value.slice(inp.selectionEnd ?? p); inp.focus();
      inp.setSelectionRange(p + b.dataset.k.length, p + b.dataset.k.length);
    });
  }

  // ---------- overview ----------
  function overview() {
    const st = states(), diagDone = Progress.events(SUB).some(e => e.mode === "diag");
    const dots = lv => [1, 2, 3].map(l => `<i class="${l <= lv ? "on" : ""}"></i>`).join("");
    const rows = Object.entries(AREAS).map(([a, name]) => `<section class="area"><h2>${name}</h2><ul class="skills">` +
      SKILLS.filter(s => s.area === a).map(s => { const k = st[s.id];
        return `<li class="${k.colour}"><a href="#oev/${s.id}"><span class="sn">${s.name}</span>` +
          `<span class="lv" title="Niveau ${k.lv} af 3">${dots(k.n ? k.lv : 0)}</span>` +
          `<span class="acc">${k.n ? `${k.recent.filter(Boolean).length}/${k.recent.length}` : "ikke prøvet"}</span></a></li>`; }).join("") +
      `</ul></section>`).join("");
    main.innerHTML = `<div class="actions">` +
      (diagDone ? "" : `<a class="big primary" href="#diagnose"><b>Start med diagnosetesten</b><span>Én opgave i hvert emne, ca. 25 minutter. Så ved træneren, hvor du skal starte.</span></a>`) +
      `<a class="big${diagDone ? " primary" : ""}" href="#oev"><b>Øv</b><span>10 opgaver. Træneren vælger de emner, du har mest brug for.</span></a>` +
      `<a class="big" href="#proeve"><b>Prøve på tid</b><span>Som prøven uden hjælpemidler: 1 time, ingen lommeregner, svar først til sidst.</span></a></div>` +
      `<p class="legend"><span class="good">sidder</span> <span class="mid">på vej</span> <span class="weak">øv mere</span> · prikkerne er niveau 1–3 · tallet er de seneste svar. Klik et emne for at øve netop det.</p>` + rows +
      `<h2>Spil</h2><div class="actions"><a class="big game" href="spil/stoevsuger/"><b>Støvsugerkrigen</b><span>Robotstøvsugere med tal på ryggen. Skyd dem i stykker med primtal.</span></a>` +
      `<a class="big game" href="spil/skrotregn/"><b>Skrotregn</b><span>Rumskrot med figurer på. Laseren skyder kun, når du har regnet rigtigt.</span></a>` +
      `<a class="big game" href="spil/prelleskud/"><b>Prelleskud</b><span>Kampvogne og bandeskud. Ram om hjørner med vinkler.</span></a></div>`;
  }

  // ---------- practice and diagnostic: one task at a time ----------
  function session(mode, only) {
    const list = mode === "diag" ? [...SKILLS].sort(() => Math.random() - 0.5) : null;
    const total = mode === "diag" ? list.length : 10;
    let i = 0, right = 0, prev = null;
    const done = [];
    function show() {
      if (i >= total) return summary();
      const st = states(), skill = mode === "diag" ? list[i] : only ? byId(only) : nextSkill(st, prev);
      const lv = mode === "diag" ? 2 : st[skill.id].lv, t = skill.gen(lv), t0 = Date.now();
      prev = skill.id;
      main.innerHTML = `<div class="bar"><a href="#">← Oversigt</a><span>${mode === "diag" ? "Diagnosetest" : only ? `Øv: ${skill.name}` : "Øv"} · ${i + 1} af ${total}</span></div>` +
        `<p class="topic">${AREAS[skill.area]} · ${skill.name} · niveau ${lv}</p>` + taskHTML(t, 0) +
        `<div class="nav"><button class="btn primary" id="go">Tjek</button></div>`;
      const box = main.querySelector(".task"), inp = box.querySelector("input"), fb = box.querySelector(".fb"), go = main.querySelector("#go");
      wireKeys(main); inp.focus();
      let checked = false, checkedAt = 0;
      const check = () => {
        // a moment's pause before moving on, so the answer and the explanation are seen, not skipped by a double Enter
        if (checked) { if (Date.now() - checkedAt < 700) return; i++; return show(); }
        const r = Check.answer(inp.value, t.spec);
        if (r.empty) { fb.innerHTML = `<p class="note">Skriv et svar først.</p>`; return; }
        if (r.unread) { fb.innerHTML = `<p class="note">Svaret kunne ikke læses. Brug tal, komma, / til brøk og ^ til potens.</p>`; return; }
        checked = true; checkedAt = Date.now(); inp.readOnly = true;
        Progress.add({ sub: SUB, s: skill.id, lv, ok: r.ok, mode, ms: Date.now() - t0 });
        if (r.ok) right++;
        done.push([skill, r.ok]);
        fb.innerHTML = feedbackHTML(t, r, inp.value, skill.id);
        box.classList.add(r.ok ? "is-ok" : "is-no");
        go.textContent = i + 1 >= total ? "Se resultatet" : "Næste";
        go.focus();
      };
      go.onclick = check;
      // Enter checks the answer; preventDefault stops the same key press from also clicking "Næste", which gets focus
      inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); check(); } };
    }
    function summary() {
      const st = states(), weak = [...new Set(done.filter(d => !d[1]).map(d => d[0]))];
      main.innerHTML = `<div class="bar"><a href="#">← Oversigt</a><span>${mode === "diag" ? "Diagnosetest" : "Øv"} · færdig</span></div>` +
        `<h2>${right} af ${total} rigtige</h2>` +
        (weak.length ? `<p>Emner at øve videre på:</p><ul class="skills">${weak.map(s => `<li class="${st[s.id].colour}"><a href="#oev/${s.id}"><span class="sn">${s.name}</span><span class="acc">øv →</span></a></li>`).join("")}</ul>` : `<p>Ingen fejl i denne runde.</p>`) +
        `<div class="nav"><a class="btn primary" href="#oev">10 nye opgaver</a> <a class="btn" href="#">Oversigt</a></div>`;
    }
    show();
  }

  // ---------- timed test: one task per skill, answers checked at the end ----------
  const EXAM = "elev.matematik.proeve.v1", MINUTES = 60;
  function examTasks(seed) {
    // the same seed always gives the same tasks, so a reload rebuilds the test; levels mixed 1:2:1
    return SKILLS.map((s, k) => { const lv = [1, 2, 2, 3][(seed + k * 7) % 4]; return [s, lv, withSeed(seed + k * 101, () => s.gen(lv))]; });
  }
  function exam() {
    let saved; try { saved = JSON.parse(localStorage.getItem(EXAM) || "null"); } catch { saved = null; }
    if (!saved) {
      main.innerHTML = `<div class="bar"><a href="#">← Oversigt</a><span>Prøve på tid</span></div><h2>Prøve uden hjælpemidler</h2>` +
        `<p>${SKILLS.length} opgaver, én fra hvert emne, i blandet sværhed. Du har ${MINUTES} minutter. Kun papir og blyant. Du kan springe rundt og rette svar. Svarene rettes først, når du afleverer, ligesom til prøven.</p>` +
        `<div class="nav"><button class="btn primary" id="start">Start prøven</button></div>`;
      main.querySelector("#start").onclick = () => { localStorage.setItem(EXAM, JSON.stringify({ seed: (Date.now() % 1e9) | 0, start: Date.now(), answers: {} })); exam(); };
      return;
    }
    const tasks = examTasks(saved.seed);
    main.innerHTML = `<div class="bar sticky"><a href="#">← Oversigt</a><span id="clock"></span><button class="btn primary" id="hand">Aflever</button></div>` +
      tasks.map(([s, lv, t], k) => `<div class="exam-item"><p class="topic">Opgave ${k + 1}</p>${taskHTML(t, k)}</div>`).join("") +
      `<div class="nav"><button class="btn primary" id="hand2">Aflever</button></div>`;
    wireKeys(main);
    main.querySelectorAll(".task").forEach(box => {
      const k = box.dataset.i, inp = box.querySelector("input");
      inp.value = saved.answers[k] || "";
      inp.oninput = () => { saved.answers[k] = inp.value; localStorage.setItem(EXAM, JSON.stringify(saved)); };
    });
    const clock = main.querySelector("#clock");
    const tick = () => {
      const left = saved.start + MINUTES * 60e3 - Date.now();
      if (!document.body.contains(clock)) return clearInterval(timer);
      if (left <= 0) { clearInterval(timer); return grade(); }
      clock.textContent = `${Math.floor(left / 60e3)}:${String(Math.floor(left / 1e3) % 60).padStart(2, "0")} tilbage`;
    };
    const timer = setInterval(tick, 1000); tick();
    const grade = () => {
      clearInterval(timer);
      const per = {}; let right = 0;
      main.querySelectorAll(".task").forEach(box => {
        const k = +box.dataset.i, [s, lv, t] = tasks[k], r = Check.answer(saved.answers[k] || "", t.spec);
        if (r.ok) right++;
        (per[s.area] = per[s.area] || [0, 0])[1]++; if (r.ok) per[s.area][0]++;
        if (!r.empty) Progress.add({ sub: SUB, s: s.id, lv, ok: r.ok, mode: "proeve", ms: 0 });
        box.querySelector("input").readOnly = true;
        box.classList.add(r.ok ? "is-ok" : "is-no");
        box.querySelector(".fb").innerHTML = feedbackHTML(t, r, saved.answers[k] || "", s.id);
      });
      const used = Math.min(MINUTES, Math.round((Date.now() - saved.start) / 60e3));
      localStorage.removeItem(EXAM);
      main.querySelector(".bar").innerHTML = `<a href="#">← Oversigt</a><span>Afleveret</span>`;
      main.querySelector(".nav").remove();
      main.insertAdjacentHTML("afterbegin", `<div class="result"><h2>${right} af ${tasks.length} rigtige</h2><p>Brugt tid: ${used} minutter.</p><ul>` +
        Object.entries(per).map(([a, [r, n]]) => `<li>${AREAS[a]}: ${r} af ${n}</li>`).join("") + `</ul><p>Gennemgå opgaverne herunder. De forkerte emner er lagt i din oversigt.</p></div>`);
      scrollTo(0, 0);
    };
    const hand = () => { if (confirm("Vil du aflevere nu?")) grade(); };
    main.querySelector("#hand").onclick = hand; main.querySelector("#hand2").onclick = hand;
  }

  // ---------- routing ----------
  function route() {
    const [page, arg] = location.hash.slice(1).split("/");
    if (page === "diagnose") session("diag");
    else if (page === "oev") session("oev", arg && byId(arg) ? arg : null);
    else if (page === "proeve") exam();
    else overview();
    scrollTo(0, 0);
  }
  Progress.renderStatus(document.getElementById("sync"));
  window.addEventListener("hashchange", route);
  Progress.onChange(() => { if (!location.hash || location.hash === "#") overview(); });
  route();
  Progress.ready.then(() => { if (!location.hash || location.hash === "#") overview(); });
})();
