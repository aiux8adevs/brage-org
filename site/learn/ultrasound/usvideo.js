// Ultrasound topic pages: adds the tabs Video / Simulator / Glossary and PDF / Test yourself around the simulator
// page, and links to the previous and next page at the bottom (course order U1–U6, then the self-test page).
// The page's own script stays as it is; this one reads its language (<html lang>) and level (the "deeper" button)
// and follows them. The video files live in the page's video/ folder, copied there by sync_videos.sh:
// <name>_<da|en>_<grund|fordybelse>.mp4, poster_<da|en>.jpg, <name>_<da|en>.pdf and times.json (where each narrated
// line starts), where <name> is the body's data-video attribute. A page without data-video (no video yet) gets only
// the previous / next links.
// The address can point into the page: #video:83.5 plays the video from 83.5 s, #task:3:1 opens that simulator task
// (group 3, item 1; older links by title still work). The self-test's links use this, also from the page with all
// topics. The self-test's questions are in ../selftest.json.
(() => {
  const ORDER = [
    ["echo", "U1 Lyd og ekko", "U1 Sound and echo"], ["tissue", "U2 Lyd møder væv", "U2 Sound meets tissue"],
    ["probe", "U3 Proben og strålen", "U3 The probe and the beam"], ["knobs", "U4 Knapper og orientering", "U4 Knobs and orientation"],
    ["artefacts", "U5 Artefakter i klinikken", "U5 Artefacts in the clinic"], ["doppler", "U6 Doppler og sikkerhed", "U6 Doppler and safety"],
    ["quiz", "Test dig selv: alle emner", "Test yourself: all topics"],
  ];
  const W = {
    da: { video: "Video", simulator: "Simulator og opgaver", handout: "Ordkort og PDF", selftest: "Test dig selv", prev: "Forrige", next: "Næste",
          note: "Videoen følger sproget og niveauet (grund eller fordybelse) øverst på siden. Stemmen er syntetisk.",
          pdf: "Ordkort og transskription (PDF)", pdfOther: "Engelsk udgave (PDF)",
          pdfNote: "Det hele, der bliver sagt i videoen, plus en dansk-engelsk ordliste.", glossary: "Hele ordlisten for ultralyd" },
    en: { video: "Video", simulator: "Simulator and tasks", handout: "Glossary and PDF", selftest: "Test yourself", prev: "Previous", next: "Next",
          note: "The video follows the language and the level (basic or deeper) at the top of the page. The voice is synthetic.",
          pdf: "Glossary and transcript (PDF)", pdfOther: "Danish version (PDF)",
          pdfNote: "Everything said in the video, plus a Danish-English glossary.", glossary: "The full ultrasound glossary" },
  };
  const name = document.body.dataset.video;
  const here = location.pathname.split("/").filter(Boolean).pop();
  const idx = ORDER.findIndex(o => o[0] === here);
  const TABS = ["video", "simulator", "handout", "selftest"];
  const el = (tag, attrs = {}) => Object.assign(document.createElement(tag), attrs);
  const lang = () => (document.documentElement.lang === "da" ? "da" : "en");
  const deep = () => document.getElementById("lvl-deep")?.getAttribute("aria-pressed") === "true";
  const header = document.querySelector(".wrap > header"), footer = document.querySelector(".wrap > footer");
  let TIMES = null;                                   // video/times.json: { "da_grund": { lineKey: seconds }, ... }

  // ---- previous / next ----
  const series = el("nav", { className: "series" });
  footer.before(series);
  function drawSeries() {
    const L = lang(), T = W[L], q = deep() ? "&level=deep" : "";
    const link = (o, cls, word) => o ? `<a class="${cls}" href="../${o[0]}/?lang=${L}${q}"><small>${word}</small>${o[L === "da" ? 1 : 2]}</a>` : "<span></span>";
    series.innerHTML = link(ORDER[idx - 1], "prev", "← " + T.prev) + link(ORDER[idx + 1], "next", T.next + " →");
  }

  // ---- tabs: only on pages with a video ----
  let nav, vbox, sim, hbox, sbox, vid, vnote, test;
  if (name) {
    nav = el("nav", { className: "tabs", id: "tabs" });
    sim = el("div"); sim.dataset.tab = "simulator";
    while (header.nextElementSibling && header.nextElementSibling !== series) sim.append(header.nextElementSibling);
    vbox = el("div"); vbox.dataset.tab = "video";
    const section = el("section", { className: "video" });
    vid = el("video", { controls: true, preload: "none", playsInline: true });
    vnote = el("p", { className: "note" });
    section.append(vid, vnote); vbox.append(section);
    hbox = el("section", { className: "box", id: "handout-box" }); hbox.dataset.tab = "handout";
    sbox = el("section", { className: "box selftest" }); sbox.dataset.tab = "selftest";
    header.after(nav, vbox, sim, hbox, sbox);
    fetch("../selftest.json?v=2").then(r => r.json()).then(data => {
      const topic = data.pages[here];
      if (!topic) { TABS.pop(); drawTabs(); return; }                  // no questions for this page yet
      test = SelfTest.mount(sbox, { lang, concepts: topic.concepts, qs: topic.qs, link });
      return fetch("video/times.json").then(r => r.ok ? r.json() : null).then(j => { TIMES = j; test.draw(); });
    }).catch(() => {});
  }

  // the self-test's links: the video at the line that explains the concept, and the task that practises it
  function link(c, kind) {
    if (kind === "task") return c.task ? "#task:" + c.task : null;
    const t = lineTime(c.line);
    return t === null ? null : "#video:" + t;
  }
  function lineTime(key) {
    if (!TIMES) return null;
    const L = lang(), own = TIMES[`${L}_${deep() ? "fordybelse" : "grund"}`] || {};
    return own[key] ?? null;
  }

  // ---- show a tab, or a place in it: "video", "video:83.5", "task:3:1" ----
  function show(hash) {
    if (!name) return;
    const [tab0, arg] = decodeURIComponent(hash).split(/:(.*)/s);
    const tab = tab0 === "task" ? "simulator" : TABS.includes(tab0) ? tab0 : "video";
    for (const box of [vbox, sim, hbox, sbox]) box.hidden = box.dataset.tab !== tab;
    nav.querySelectorAll("a").forEach(a => a.setAttribute("aria-current", a.dataset.go === tab ? "page" : "false"));
    if (tab !== "video") vid.pause();
    window.dispatchEvent(new Event("resize"));
    if (tab0 === "video" && arg) seek(parseFloat(arg));
    if (tab0 === "task" && arg) openTask(arg);
  }
  function seek(t) {
    if (!isFinite(t)) return;
    const go = () => { vid.currentTime = t; vid.play().catch(() => {}); };
    if (vid.readyState >= 1) go(); else { vid.preload = "metadata"; vid.addEventListener("loadedmetadata", go, { once: true }); vid.load(); }
    vbox.scrollIntoView({ block: "start" });
  }
  // open the task with this id (or, from older links, this title) in the simulator's task list and bring it into view;
  // opening it also shows it in the card beside the simulator
  function openTask(key) {
    const d = document.querySelector(`#task-list details[data-id="${key.replace(/["\\]/g, "")}"]`) ||
      [...document.querySelectorAll("#task-list summary")].find(x => x.textContent.trim() === key.trim())?.parentElement;
    if (!d) return;
    d.open = true;
    setTimeout(() => d.scrollIntoView({ block: "center" }), 50);
  }
  function drawTabs() {
    const L = lang(), T = W[L], other = L === "da" ? "en" : "da";
    nav.setAttribute("aria-label", L === "da" ? "Indhold" : "Contents");
    nav.innerHTML = TABS.map((t, i) => `<a href="#${t}" data-go="${t}"><span>${i + 1}</span> ${T[t]}</a>`).join("");
    const open = [vbox, sim, hbox, sbox].find(b => !b.hidden)?.dataset.tab;
    nav.querySelectorAll("a").forEach(a => a.setAttribute("aria-current", a.dataset.go === open ? "page" : "false"));
    vnote.textContent = T.note;
    const file = `video/${name}_${L}_${deep() ? "fordybelse" : "grund"}.mp4`;
    if (vid.getAttribute("src") !== file) { vid.poster = `video/poster_${L}.jpg`; vid.src = file; }
    hbox.innerHTML = `<p><a class="pdf" href="video/${name}_${L}.pdf">${T.pdf}</a> · ` +
      `<a href="video/${name}_${other}.pdf">${T.pdfOther}</a></p><p class="note">${T.pdfNote}</p>` +
      `<p><a class="pdf" href="../glossary/?lang=${L}">${T.glossary} →</a></p>`;
    if (test) test.draw();
  }

  function draw() { drawSeries(); if (name) drawTabs(); }
  draw();
  if (name) show(location.hash.slice(1));
  // the page's script changes <html lang> and the level buttons; follow both (the tab stays where it is)
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  const lvl = document.getElementById("lvl-deep");
  if (lvl) new MutationObserver(draw).observe(lvl, { attributes: true, attributeFilter: ["aria-pressed"] });
  window.addEventListener("hashchange", () => show(location.hash.slice(1)));
  // a self-test link clicked twice has the same hash, which fires no hashchange: handle the click directly
  document.addEventListener("click", e => {
    const a = e.target.closest("a.st-go");
    if (!a || !a.getAttribute("href").startsWith("#")) return;
    e.preventDefault();
    history.replaceState(null, "", location.search + a.getAttribute("href"));
    show(a.getAttribute("href").slice(1));
  });
})();
