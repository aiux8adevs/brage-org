// The radiography series: the one place that knows the order of the topics.
// Used by the learn overview (cards, grouped in course order) and by every topic page
// (tabs Video / Simulator / Glossary, and previous / next at the bottom).
// Language comes from <html lang>, which each page sets itself; when it changes, this redraws.

const SERIES = [
  { da: "Det digitale billede", en: "The digital image", pages: [
    // simulator and podcast approved 2026-11-02
    { path: "detector", tabs: ["video", "podcast", "simulator", "handout", "selftest"], draftTabs: ["video", "podcast", "simulator", "handout", "selftest"], file: "detektor",
      podcast: [["detektor", { title: "From photon to number", minutes: 9 }]],
      da: { title: "Fra foton til tal", text: "Hvordan røntgenfotonen bliver til et tal: scintillator, fill factor, udlæsning, ADC, bitdybde, matrix og pixel. Simulatoren: vælg detektor, lagtykkelse, pixelstørrelse og bit." },
      en: { title: "From photon to number", text: "How the X-ray photon becomes a number: scintillator, fill factor, readout, ADC, bit depth, matrix and pixel. The simulator: choose the detector, layer thickness, pixel size and bits." } },
    // podcast approved 2026-11-02
    { path: "histogram", tabs: ["video", "podcast", "simulator", "handout", "selftest"], draftTabs: ["video", "podcast", "simulator", "handout", "selftest"], file: "histogram",
      podcast: [["histogram", { title: "From number to image", minutes: 8 }]],
      da: { title: "Fra tal til billede", text: "Histogram, eksponeringsindeks (EI og REX), automatisk skalering, LUT og WW/WL. Simulatoren: skru på dosis og indblænding, og se hvorfor lysheden intet siger om dosis." },
      en: { title: "From number to image", text: "Histogram, exposure index (EI and REX), automatic rescaling, LUT and WW/WL. The simulator: change dose and collimation, and see why brightness says nothing about dose." } },
  ] },
  { da: "Støj", en: "Noise", pages: [
    // simulator live 2026-11-02; video and handout live 2026-11-02 (owner approved the English basic version)
    // podcast approved 2026-11-02
    { path: "noise", tabs: ["video", "podcast", "simulator", "handout", "selftest"], draftTabs: ["video", "podcast", "simulator", "handout", "selftest"], file: "stoej",
      podcast: [["stoej", { title: "Noise: when there are not enough photons", minutes: 7 }]],
      da: { title: "Støj, SNR og CNR", text: "Kvantestøj, SNR og CNR. Simulatoren: skru på dosis, kV, pixelstørrelse og detektor, og se hvilke detaljer der forsvinder i støjen." },
      en: { title: "Noise, SNR and CNR", text: "Quantum noise, SNR and CNR. The simulator: change dose, kV, pixel size and detector, and see which details disappear in the noise." } },
  ],
    soon: { da: "Støj, SNR og CNR. Under produktion.", en: "Noise, SNR and CNR. In production." } },
  { da: "Spredt stråling", en: "Scatter", pages: [
    // 3a with its podcast and 3b approved 2026-11-02; 3c and the 3b/3c podcasts approved 2026-11-23
    { path: "scatter", tabs: ["video", "podcast", "simulator", "handout", "selftest"], draftTabs: ["video", "podcast", "simulator", "handout", "selftest"],
      podcast: [["spredt", { title: "3a Scatter: the fog over the image", minutes: 9 }], ["raster3b", { title: "3b The grid: how it works, and what it costs", minutes: 10 }],
                     ["tage3c", { title: "3c Other ways: virtual grid, air gap and compression", minutes: 9 }]],
      files: [["spredt", { da: "3a Spredt stråling", en: "3a Scatter" }], ["raster3b", { da: "3b Rasteret", en: "3b The grid" }],
              ["tage3c", { da: "3c Andre veje", en: "3c Other ways" }]],
      da: { title: "Spredt stråling", text: "Tågen over billedet: Compton-spredning, SPR, indblænding, raster og Bucky-faktor, luftspalte, kompression og virtuelt raster. Simulatoren: skru selv på felt, tykkelse, kV og raster." },
      en: { title: "Scatter", text: "The fog over the image: Compton scatter, SPR, collimation, grids and the Bucky factor, air gap, compression and virtual grids. The simulator: change field, thickness, kV and grid yourself." } },
  ],
    soon: { da: "Spredt stråling, raster, luftspalte, kompression og indblænding. Under produktion.", en: "Scatter, grids, air gap, compression and collimation. In production." } },
  { da: "Skarphed", en: "Sharpness", pages: [
    // the video is added to tabs once it is approved
    // video and podcast approved 2026-11-02
    { path: "shadow", tabs: ["video", "podcast", "simulator", "handout", "selftest"], draftTabs: ["video", "podcast", "simulator", "handout", "selftest"], file: "uskarphed",
      podcast: [["uskarphed", { title: "Sharpness: five ways the shadow lies", minutes: 7 }]],
      da: { title: "Skarphed: fem måder skyggen snyder på", text: "Forstørrelse, formforvrængning, geometrisk uskarphed, bevægelsesuskarphed og overlejring. Flyt fokus, objekt og detektor." },
      en: { title: "Sharpness: five ways the shadow lies", text: "Magnification, shape distortion, focal spot blur, motion blur and superimposition. Move the focal spot, the object and the detector." } },
  ] },
  { da: "Røntgenrøret", en: "The X-ray tube", pages: [
    // draft until the owner approves: shown only with ?draft=1
    // simulator live 2026-11-13; videos 5a/5b and their PDFs live 2026-11-23
    { path: "tube", tabs: ["video", "simulator", "handout", "selftest"], draftTabs: ["video", "simulator", "handout", "selftest"],
      files: [["roer5a", { da: "5a Røret og strålen", en: "5a The tube and the beam" }], ["aec5b", { da: "5b Automatisk eksponering", en: "5b Automatic exposure control" }]],
      da: { title: "Røntgenrøret", text: "Bremsestråling og karakteristisk stråling, spektret, heel-effekten, filtrering og automatisk eksponering (AEC). Simulatoren: skru på kV og filter, vend røret, og vælg ionkamre." },
      en: { title: "The X-ray tube", text: "Bremsstrahlung and characteristic radiation, the spectrum, the heel effect, filtration and automatic exposure control (AEC). The simulator: change kV and filter, turn the tube, and choose chambers." } },
  ],
    soon: { da: "Heel-effekt, filtrering og AEC. Under produktion.", en: "Heel effect, filtration and AEC. In production." } },
];

const WORDS = {
  da: { video: "Video", podcast: "Podcast", simulator: "Simulator og opgaver", handout: "Ordkort og PDF", selftest: "Test dig selv", prev: "Forrige", next: "Næste",
        soon: "På vej", pdf: "Ordkort og transskription (PDF)", pdfOther: "Engelsk udgave (PDF)",
        pdfNote: "Det hele, der bliver sagt i videoen, plus en dansk-engelsk ordliste til Bushong.",
        podNote: "En samtale på engelsk mellem to værter, til efter videoen. Den går lidt dybere og kan høres uden skærm, fx på vej hjem. Lyden spiller videre, når skærmen slukker.",
        podSynth: "Stemmerne er syntetiske.",
        open: "Åbn →", kinds: { video: "Video", podcast: "Podcast", simulator: "Simulator", handout: "Ordkort", selftest: "Selvtest" } },
  en: { video: "Video", podcast: "Podcast", simulator: "Simulator and tasks", handout: "Glossary and PDF", selftest: "Test yourself", prev: "Previous", next: "Next",
        soon: "On the way", pdf: "Glossary and transcript (PDF)", pdfOther: "Danish version (PDF)",
        pdfNote: "Everything said in the video, plus a Danish-English glossary.",
        podNote: "A conversation in English between two hosts, for after the video. It goes a little deeper and works without a screen, on the way home for example. It keeps playing when the screen turns off.",
        podSynth: "The voices are synthetic.",
        open: "Open →", kinds: { video: "Video", podcast: "Podcast", simulator: "Simulator", handout: "Glossary", selftest: "Self-test" } },
};

const lang = () => (document.documentElement.lang === "da" ? "da" : "en");
const level = () => new URLSearchParams(location.search).get("level") === "deep" ? "&level=deep" : "";
const DRAFT = new URLSearchParams(location.search).get("draft") === "1";
for (const g of SERIES) for (const p of g.pages) {
  if (DRAFT && p.draftTabs) p.tabs = p.draftTabs;
  if (DRAFT && p.draftFiles) p.files = p.draftFiles;
  if (DRAFT && p.draftPodcast) p.podcast = p.draftPodcast;
}
for (const g of SERIES) g.pages = g.pages.filter(p => DRAFT || !p.draft || p.path === document.body.dataset.topic);
const pages = SERIES.flatMap(g => g.pages);

// ---- the learn overview: one group per topic, in course order ----
function drawOverview(box) {
  const L = lang(), W = WORDS[L];
  box.innerHTML = SERIES.map((g, i) => {
    const cards = g.pages.map(p => `
      <a class="card sim-card" href="radiography/${p.path}/?lang=${L}${DRAFT ? "&draft=1" : ""}">
        <span class="kind">${p.tabs.map(t => W.kinds[t]).join(" · ")}</span>
        <h3>${p[L].title}</h3><p class="muted">${p[L].text}</p><span class="go">${W.open}</span></a>`).join("");
    const soon = g.soon && !g.pages.length ? `<div class="card sim-card soon"><span class="kind">${W.soon}</span><p>${g.soon[L]}</p></div>` : "";
    return `<div class="topic-group"><h3 class="topic-head"><span>${i + 1}</span> ${g[L]}</h3>
      <div class="grid-3 track">${cards}${soon}</div></div>`;
  }).join("");
}

// ---- a topic page: tabs, the handout tab, previous / next ----
function show(hash) {
  const here = pages.find(p => p.path === document.body.dataset.topic);
  const [tab0, arg] = decodeURIComponent(hash).split(/:(.*)/s);           // "video:raster3b@83.5", "task:3:1"
  let tab = tab0 === "task" ? "simulator" : tab0;
  if (!here.tabs.includes(tab)) tab = here.tabs[0];
  document.querySelectorAll("[data-tab]").forEach(el => { el.hidden = el.dataset.tab !== tab; });
  document.querySelectorAll(".tabs a").forEach(a => a.setAttribute("aria-current", a.dataset.go === tab ? "page" : "false"));
  if (tab !== "video") document.querySelectorAll("video").forEach(v => v.pause());
  window.dispatchEvent(new Event("resize"));     // the simulators size their canvases to what is visible
  if (tab === "video" && tab0 === "video" && arg) seek(arg);
  if (tab0 === "task" && arg) openTask(arg);
}
// play the video from a moment: "<file>@<seconds>"; on pages with parts, switch to that part first
function seek(arg) {
  const [file, t] = arg.split("@"), sec = parseFloat(t);
  if (typeof PART_FILES !== "undefined") document.querySelector(`#parts button[data-p="${PART_FILES.indexOf(file)}"]`)?.click();
  const vid = document.getElementById("vid");
  if (!vid || !isFinite(sec)) return;
  const go = () => { vid.currentTime = sec; vid.play().catch(() => {}); };
  if (vid.readyState >= 1) go(); else { vid.preload = "metadata"; vid.addEventListener("loadedmetadata", go, { once: true }); vid.load(); }
  vid.scrollIntoView({ block: "start" });
}
// open the simulator task with this id ("group:item"; older links: its title) and bring it into view;
// opening it also shows it in the card beside the simulator
function openTask(key) {
  const d = document.querySelector(`#task-list details[data-id="${key.replace(/["\\]/g, "")}"]`) ||
    [...document.querySelectorAll("#task-list summary")].find(x => x.textContent.trim() === key.trim())?.parentElement;
  if (!d) return;
  d.open = true;
  setTimeout(() => (document.querySelector(`#task-list details[data-id="${key.replace(/["\\]/g, "")}"]`) || d).scrollIntoView({ block: "center" }), 50);
}
// ---- the self-test tab (live 2026-11-16, approved by the owner): loads selftest.js and the questions (../selftest.json, kept in
// step with the videos and tasks by selftest/selftest.py) when first needed ----
let TEST = null, TIMES = {};
// the self-test links only into videos this page shows: none without a video tab, and not a part that is still a draft
const shown = file => { const here = pages.find(p => p.path === document.body.dataset.topic);
  return here.tabs.includes("video") && (!here.files || here.files.some(f => f[0] === file)); };
function drawSelftest(here) {
  if (TEST) { TEST.draw(); return; }
  let box = document.getElementById("selftest-box");
  if (!box) {
    box = document.createElement("section");
    box.className = "box selftest"; box.id = "selftest-box"; box.dataset.tab = "selftest"; box.hidden = true;
    (document.getElementById("handout-box") || document.getElementById("tabs")).after(box);
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "../../selftest.css?v=1"; document.head.append(css);
    const load = src => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.append(s); });
    Promise.all([load("../../selftest.js?v=2"), fetch("../selftest.json?v=2").then(r => r.json())]).then(([, all]) => {
      const data = all.pages[here.path];
      if (!data) return;
      TEST = SelfTest.mount(box, { lang, concepts: data.concepts, qs: data.qs, link: (c, kind) => {
        if (kind === "task") return c.task ? "#task:" + c.task : null;
        if (!shown(c.file)) return null;
        const t = TIMES[c.file]?.[`${lang()}_${level() ? "fordybelse" : "grund"}`]?.[c.line];
        return t === undefined ? null : `#video:${c.file}@${t}`;
      } });
      for (const f of new Set(Object.values(data.concepts).map(c => c.file).filter(shown)))
        fetch(`video/times_${f}.json`).then(r => r.ok ? r.json() : null).then(j => { if (j) { TIMES[f] = j; TEST.draw(); } }).catch(() => {});
    }).catch(() => {});
  }
}
// ---- the podcast tab: a plain <audio> element, because that is what phones let play on with the
// screen off; the Media Session API puts the title and play/skip buttons on the lock screen ----
function drawPodcast(here, L, W) {
  let box = document.getElementById("podcast-box");
  if (!box) {
    box = document.createElement("section");
    box.className = "box podcast"; box.id = "podcast-box"; box.dataset.tab = "podcast"; box.hidden = true;
    document.getElementById("tabs").after(box);
  }
  if ([...box.querySelectorAll("audio")].some(a => !a.paused)) return;   // a language switch must not stop the episode
  box.innerHTML = here.podcast.map(([f, ep]) => `<h3>${ep.title}</h3>
    <audio controls preload="none" src="video/podcast_${f}_en.mp3" data-title="${ep.title}"></audio>
    <p class="note">${ep.minutes} min · ${W.podNote} ${W.podSynth}</p>`).join("");
  box.querySelectorAll("audio").forEach(a => a.addEventListener("play", () => {
    document.querySelectorAll("video").forEach(v => v.pause());
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: a.dataset.title, artist: "Oliver Brage", album: "brage.org · Radiography",
      artwork: [{ src: "video/poster_" + (here.files ? here.files[0][0] + "_" : "") + "en.jpg", sizes: "1280x720", type: "image/jpeg" }] });
    navigator.mediaSession.setActionHandler("seekbackward", () => { a.currentTime = Math.max(0, a.currentTime - 15); });
    navigator.mediaSession.setActionHandler("seekforward", () => { a.currentTime = Math.min(a.duration || 0, a.currentTime + 30); });
  }));
}

const current = () => (location.hash || "#").slice(1);

function drawTopic() {
  const L = lang(), W = WORDS[L], here = pages.find(p => p.path === document.body.dataset.topic);
  document.getElementById("tabs").innerHTML = here.tabs.map((t, i) =>
    `<a href="#${t}" data-go="${t}"><span>${i + 1}</span> ${W[t]}</a>`).join("");
  const ho = document.getElementById("handout-box");
  if (ho) {
    const other = L === "da" ? "en" : "da";
    const files = here.files || [[here.file, null]];
    ho.innerHTML = files.map(([f, name]) => `<p><a class="pdf" href="video/${f}_${L}.pdf">${name ? name[L] + ": " : ""}${W.pdf}</a>
      · <a href="video/${f}_${other}.pdf">${W.pdfOther}</a></p>`).join("") + `<p class="note">${W.pdfNote}</p>`;
  }
  if (here.podcast && here.tabs.includes("podcast")) drawPodcast(here, L, W);
  if (here.tabs.includes("selftest")) drawSelftest(here);
  const i = pages.indexOf(here), prev = pages[i - 1], next = pages[i + 1];
  const link = (p, cls, word) => p ? `<a class="${cls}" href="../${p.path}/?lang=${L}${level()}"><small>${word}</small>${p[L].title}</a>` : "<span></span>";
  document.getElementById("series").innerHTML = link(prev, "prev", "← " + W.prev) + link(next, "next", W.next + " →");
  show(current());
}

const overview = document.getElementById("topics");
const draw = overview ? () => drawOverview(overview) : drawTopic;
draw();
new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
if (!overview) window.addEventListener("hashchange", () => show(current()));
// a self-test link clicked twice has the same hash, which fires no hashchange: handle the click directly
if (!overview) document.addEventListener("click", e => {
  const a = e.target.closest("a.st-go");
  if (!a) return;
  e.preventDefault();
  history.replaceState(null, "", location.search + a.getAttribute("href"));
  show(a.getAttribute("href").slice(1));
});
