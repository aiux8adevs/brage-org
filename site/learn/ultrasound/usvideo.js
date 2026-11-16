// Ultrasound topic pages: adds the tabs Video / Simulator / Glossary and PDF around the simulator page, and links
// to the previous and next page at the bottom (course order U1–U6, then the self-test).
// The page's own script stays as it is; this one reads its language (<html lang>) and level (the "deeper" button)
// and follows them. The video files live in the page's video/ folder, copied there by sync_videos.sh:
// <name>_<da|en>_<grund|fordybelse>.mp4, poster_<da|en>.jpg and <name>_<da|en>.pdf, where <name> is the body's
// data-video attribute. A page without data-video (no video yet) gets only the previous / next links.
(() => {
  const ORDER = [
    ["echo", "U1 Lyd og ekko", "U1 Sound and echo"], ["tissue", "U2 Lyd møder væv", "U2 Sound meets tissue"],
    ["probe", "U3 Proben og strålen", "U3 The probe and the beam"], ["knobs", "U4 Knapper og orientering", "U4 Knobs and orientation"],
    ["artefacts", "U5 Artefakter i klinikken", "U5 Artefacts in the clinic"], ["doppler", "U6 Doppler og sikkerhed", "U6 Doppler and safety"],
    ["quiz", "Test dig selv", "Test yourself"],
  ];
  const W = {
    da: { video: "Video", simulator: "Simulator og opgaver", handout: "Ordkort og PDF", prev: "Forrige", next: "Næste",
          note: "Videoen følger sproget og niveauet (grund eller fordybelse) øverst på siden. Stemmen er syntetisk.",
          pdf: "Ordkort og transskription (PDF)", pdfOther: "Engelsk udgave (PDF)",
          pdfNote: "Det hele, der bliver sagt i videoen, plus en dansk-engelsk ordliste.", glossary: "Hele ordlisten for ultralyd" },
    en: { video: "Video", simulator: "Simulator and tasks", handout: "Glossary and PDF", prev: "Previous", next: "Next",
          note: "The video follows the language and the level (basic or deeper) at the top of the page. The voice is synthetic.",
          pdf: "Glossary and transcript (PDF)", pdfOther: "Danish version (PDF)",
          pdfNote: "Everything said in the video, plus a Danish-English glossary.", glossary: "The full ultrasound glossary" },
  };
  const TABS = ["video", "simulator", "handout"];
  const name = document.body.dataset.video;
  const here = location.pathname.split("/").filter(Boolean).pop();
  const el = (tag, attrs = {}) => Object.assign(document.createElement(tag), attrs);
  const lang = () => (document.documentElement.lang === "da" ? "da" : "en");
  const deep = () => document.getElementById("lvl-deep")?.getAttribute("aria-pressed") === "true";
  const header = document.querySelector(".wrap > header"), footer = document.querySelector(".wrap > footer");

  // ---- previous / next ----
  const series = el("nav", { className: "series" });
  footer.before(series);
  function drawSeries() {
    const L = lang(), T = W[L], i = ORDER.findIndex(o => o[0] === here), q = deep() ? "&level=deep" : "";
    const link = (o, cls, word) => o ? `<a class="${cls}" href="../${o[0]}/?lang=${L}${q}"><small>${word}</small>${o[L === "da" ? 1 : 2]}</a>` : "<span></span>";
    series.innerHTML = link(ORDER[i - 1], "prev", "← " + T.prev) + link(ORDER[i + 1], "next", T.next + " →");
  }

  // ---- tabs: only on pages with a video ----
  let nav, vbox, sim, hbox, vid, vnote;
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
    header.after(nav, vbox, sim, hbox);
  }
  // show one tab; the simulator sizes its canvases to what is visible, so it gets a resize
  function show(tab) {
    if (!name) return;
    if (!TABS.includes(tab)) tab = "video";
    for (const box of [vbox, sim, hbox]) box.hidden = box.dataset.tab !== tab;
    nav.querySelectorAll("a").forEach(a => a.setAttribute("aria-current", a.dataset.go === tab ? "page" : "false"));
    if (tab !== "video") vid.pause();
    window.dispatchEvent(new Event("resize"));
  }
  function drawTabs() {
    const L = lang(), T = W[L], other = L === "da" ? "en" : "da";
    nav.setAttribute("aria-label", L === "da" ? "Indhold" : "Contents");
    nav.innerHTML = TABS.map((t, i) => `<a href="#${t}" data-go="${t}"><span>${i + 1}</span> ${T[t]}</a>`).join("");
    vnote.textContent = T.note;
    const file = `video/${name}_${L}_${deep() ? "fordybelse" : "grund"}.mp4`;
    if (vid.getAttribute("src") !== file) { vid.poster = `video/poster_${L}.jpg`; vid.src = file; }
    hbox.innerHTML = `<p><a class="pdf" href="video/${name}_${L}.pdf">${T.pdf}</a> · ` +
      `<a href="video/${name}_${other}.pdf">${T.pdfOther}</a></p><p class="note">${T.pdfNote}</p>` +
      `<p><a class="pdf" href="../glossary/?lang=${L}">${T.glossary} →</a></p>`;
    show(location.hash.slice(1));
  }

  function draw() { drawSeries(); if (name) drawTabs(); }
  draw();
  // the page's script changes <html lang> and the level buttons; follow both
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  const lvl = document.getElementById("lvl-deep");
  if (lvl) new MutationObserver(draw).observe(lvl, { attributes: true, attributeFilter: ["aria-pressed"] });
  window.addEventListener("hashchange", () => show(location.hash.slice(1)));
})();
