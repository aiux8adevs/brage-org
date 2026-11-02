// The radiography series: the one place that knows the order of the topics.
// Used by the learn overview (cards, grouped in course order) and by every topic page
// (tabs Video / Simulator / Glossary, and previous / next at the bottom).
// Language comes from <html lang>, which each page sets itself; when it changes, this redraws.

const SERIES = [
  { da: "Det digitale billede", en: "The digital image", pages: [
    { path: "detector", tabs: ["video", "handout"], file: "detektor",
      da: { title: "Fra foton til tal", text: "Hvordan røntgenfotonen bliver til et tal: scintillator, fill factor, udlæsning, ADC, bitdybde, matrix og pixel." },
      en: { title: "From photon to number", text: "How the X-ray photon becomes a number: scintillator, fill factor, readout, ADC, bit depth, matrix and pixel." } },
    { path: "histogram", tabs: ["video", "simulator", "handout"], file: "histogram",
      da: { title: "Fra tal til billede", text: "Histogram, eksponeringsindeks (EI og REX), automatisk skalering, LUT og WW/WL. Simulatoren: skru på dosis og indblænding, og se hvorfor lysheden intet siger om dosis." },
      en: { title: "From number to image", text: "Histogram, exposure index (EI and REX), automatic rescaling, LUT and WW/WL. The simulator: change dose and collimation, and see why brightness says nothing about dose." } },
  ] },
  { da: "Støj", en: "Noise", pages: [
    // draft: simulator only until video 2 exists and the owner has approved it
    { path: "noise", tabs: ["simulator"], draft: true,
      da: { title: "Støj, SNR og CNR", text: "Kvantestøj, SNR og CNR. Simulatoren: skru på dosis, kV, pixelstørrelse og detektor, og se hvilke detaljer der forsvinder i støjen." },
      en: { title: "Noise, SNR and CNR", text: "Quantum noise, SNR and CNR. The simulator: change dose, kV, pixel size and detector, and see which details disappear in the noise." } },
  ],
    soon: { da: "Støj, SNR og CNR. Under produktion.", en: "Noise, SNR and CNR. In production." } },
  { da: "Spredt stråling", en: "Scatter", pages: [
    // simulator live (approved 2026-11-02); videos, podcast and handout stay drafts until approved
    { path: "scatter", tabs: ["simulator"], draftTabs: ["video", "podcast", "simulator", "handout"],
      podcast: [["spredt", { title: "Scatter: the fog over the image", minutes: 11 }]],
      files: [["spredt", { da: "3a Spredt stråling", en: "3a Scatter" }], ["raster3b", { da: "3b Rasteret", en: "3b The grid" }],
              ["tage3c", { da: "3c Andre veje", en: "3c Other ways" }]],
      da: { title: "Spredt stråling", text: "Tågen over billedet: Compton-spredning, SPR, indblænding, raster og Bucky-faktor, luftspalte, kompression og virtuelt raster. Simulatoren: skru selv på felt, tykkelse, kV og raster." },
      en: { title: "Scatter", text: "The fog over the image: Compton scatter, SPR, collimation, grids and the Bucky factor, air gap, compression and virtual grids. The simulator: change field, thickness, kV and grid yourself." } },
  ],
    soon: { da: "Spredt stråling, raster, luftspalte, kompression og indblænding. Under produktion.", en: "Scatter, grids, air gap, compression and collimation. In production." } },
  { da: "Skarphed", en: "Sharpness", pages: [
    // the video is added to tabs once it is approved
    { path: "shadow", tabs: ["simulator"], draftTabs: ["video", "simulator", "handout"], file: "uskarphed",
      da: { title: "Skarphed: fem måder skyggen snyder på", text: "Forstørrelse, formforvrængning, geometrisk uskarphed, bevægelsesuskarphed og overlejring. Flyt fokus, objekt og detektor." },
      en: { title: "Sharpness: five ways the shadow lies", text: "Magnification, shape distortion, focal spot blur, motion blur and superimposition. Move the focal spot, the object and the detector." } },
  ] },
  { da: "Røntgenrøret", en: "The X-ray tube", pages: [],
    soon: { da: "Heel-effekt, filtrering og AEC. Under produktion.", en: "Heel effect, filtration and AEC. In production." } },
];

const WORDS = {
  da: { video: "Video", podcast: "Podcast", simulator: "Simulator og opgaver", handout: "Ordkort og PDF", prev: "Forrige", next: "Næste",
        soon: "På vej", pdf: "Ordkort og transskription (PDF)", pdfOther: "Engelsk udgave (PDF)",
        pdfNote: "Det hele, der bliver sagt i videoen, plus en dansk-engelsk ordliste til Bushong.",
        podNote: "En samtale på engelsk mellem to værter, til efter videoen. Den går lidt dybere og kan høres uden skærm, fx på vej hjem. Lyden spiller videre, når skærmen slukker.",
        podSynth: "Stemmerne er syntetiske.",
        open: "Åbn →", kinds: { video: "Video", podcast: "Podcast", simulator: "Simulator", handout: "Ordkort" } },
  en: { video: "Video", podcast: "Podcast", simulator: "Simulator and tasks", handout: "Glossary and PDF", prev: "Previous", next: "Next",
        soon: "On the way", pdf: "Glossary and transcript (PDF)", pdfOther: "Danish version (PDF)",
        pdfNote: "Everything said in the video, plus a Danish-English glossary.",
        podNote: "A conversation in English between two hosts, for after the video. It goes a little deeper and works without a screen, on the way home for example. It keeps playing when the screen turns off.",
        podSynth: "The voices are synthetic.",
        open: "Open →", kinds: { video: "Video", podcast: "Podcast", simulator: "Simulator", handout: "Glossary" } },
};

const lang = () => (document.documentElement.lang === "da" ? "da" : "en");
const level = () => new URLSearchParams(location.search).get("level") === "deep" ? "&level=deep" : "";
const DRAFT = new URLSearchParams(location.search).get("draft") === "1";
for (const g of SERIES) for (const p of g.pages) if (DRAFT && p.draftTabs) p.tabs = p.draftTabs;
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
function show(tab) {
  const here = pages.find(p => p.path === document.body.dataset.topic);
  if (!here.tabs.includes(tab)) tab = here.tabs[0];
  document.querySelectorAll("[data-tab]").forEach(el => { el.hidden = el.dataset.tab !== tab; });
  document.querySelectorAll(".tabs a").forEach(a => a.setAttribute("aria-current", a.dataset.go === tab ? "page" : "false"));
  if (tab !== "video") document.querySelectorAll("video").forEach(v => v.pause());
  window.dispatchEvent(new Event("resize"));     // the simulators size their canvases to what is visible
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
  if (here.podcast) drawPodcast(here, L, W);
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
