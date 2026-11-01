// Detector video page: language and level live in the address (?lang=da&level=deep),
// not in browser storage, the same as the simulators.
const T = {
  da: {
    title: "Fra foton til tal",
    sub: "Video 1a om det digitale billede: hvordan røntgenfotonen bliver til et tal i en matrix. Næste video, Fra tal til billede, tager over derfra.",
    grund: "Grund", deep: "Fordybelse", back: "← Læring",
    videoNote: "Fordybelsen tilføjer DQE, selen og mammografi, fill factor som formel, CR-udlæsning, kvantiseringsfejl og Nyquist-frekvens.",
    chapters: "Kapitler",
    list: ["Fra skygge til tal", "Detektoren", "Detektorelementet og fill factor", "Udlæsning",
           "Fra spænding til tal", "Matrix, pixel og opløsning", "Opsummering"],
    next: "Næste: Fra tal til billede, med simulator →",
    foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
  },
  en: {
    title: "From photon to number",
    sub: "Video 1a on the digital image: how the X-ray photon becomes a number in a matrix. The next video, From number to image, takes over from there.",
    grund: "Basic", deep: "Deeper level", back: "← Learn",
    videoNote: "The deeper level adds DQE, selenium and mammography, fill factor as a formula, CR readout, quantization error and the Nyquist frequency.",
    chapters: "Chapters",
    list: ["From shadow to numbers", "The detector", "The detector element and fill factor", "Readout",
           "From voltage to numbers", "Matrix, pixel and resolution", "Summary"],
    next: "Next: From number to image, with a simulator →",
    foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
  },
};
const S = { lang: "da", level: "grund" };
const $ = id => document.getElementById(id);

function render() {
  const L = T[S.lang];
  document.documentElement.lang = S.lang;
  document.title = L.title + " | Oliver Brage";
  for (const k of ["title", "sub", "back", "chapters", "foot", "privacy"]) $("t-" + k).textContent = L[k];
  $("t-videonote").textContent = L.videoNote;
  $("t-back").href = "../../?lang=" + S.lang;
  $("lvl-grund").textContent = L.grund;
  $("lvl-deep").textContent = L.deep;
  $("level-group").setAttribute("aria-label", S.lang === "da" ? "Niveau" : "Level");
  $("chapter-list").innerHTML = L.list.map(c => `<li>${c}</li>`).join("");
  $("t-next").innerHTML = `<a href="../histogram/?lang=${S.lang}${S.level === "deep" ? "&level=deep" : ""}#video">${L.next}</a>`;
  // the video in the chosen language and level; only reloaded when that choice changes
  const vid = $("vid"), file = `video/detektor_${S.lang}_${S.level === "deep" ? "fordybelse" : "grund"}.mp4`;
  if (vid.getAttribute("src") !== file) { vid.poster = `video/poster_${S.lang}.jpg`; vid.src = file; }
  for (const [id, on] of [["lang-da", S.lang === "da"], ["lang-en", S.lang === "en"],
                          ["lvl-grund", S.level === "grund"], ["lvl-deep", S.level === "deep"]])
    $(id).setAttribute("aria-pressed", on);
  const q = new URLSearchParams(location.search);
  q.set("lang", S.lang); S.level === "deep" ? q.set("level", "deep") : q.delete("level");
  history.replaceState(null, "", "?" + q);
}

{
  const q = new URLSearchParams(location.search), l = q.get("lang");
  S.lang = l === "da" || l === "en" ? l : (navigator.language || "").toLowerCase().startsWith("da") ? "da" : "en";
  if (q.get("level") === "deep") S.level = "deep";
}
$("lang-da").onclick = () => { S.lang = "da"; render(); };
$("lang-en").onclick = () => { S.lang = "en"; render(); };
$("lvl-grund").onclick = () => { S.level = "grund"; render(); };
$("lvl-deep").onclick = () => { S.level = "deep"; render(); };
render();
