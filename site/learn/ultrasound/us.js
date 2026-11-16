// The ultrasound overview: the six topics in course order, Danish/English in the address (?lang=da),
// nothing saved on the visitor's device. A topic with a path has a page; the others are on the way.
const TOPICS = [
  { n: "U1", path: "echo", kinds: ["video", "simulator"],
             da: ["Lyd og ekko", "Lyd, frekvens og bølgelængde, 1540 m/s, puls-ekko og gråtoner. Hvorfor væv ser lyst eller mørkt ud. Simulatoren: følg pulsen ned og ekkoet op, i en lever og et testfantom."],
             en: ["Sound and echo", "Sound, frequency and wavelength, 1540 m/s, pulse-echo and grey scale. Why tissue looks bright or dark. The simulator: follow the pulse down and the echo back, in a liver and a test phantom."] },
  { n: "U2", path: "tissue", kinds: ["video", "simulator"],
             da: ["Lyd møder væv", "Impedans og refleksion, spejl og spredning, dæmpning, forstærkning og skygge, og brydning. Simulatoren: ribben, galdeblære og tarmluft, og et fantom med et lag, du selv vælger."],
             en: ["Sound meets tissue", "Impedance and reflection, mirror and scatter, attenuation, enhancement and shadow, and refraction. The simulator: a rib, the gallbladder and bowel gas, and a phantom with a layer you choose."] },
  { n: "U3", path: "probe", kinds: ["video", "simulator"],
             da: ["Proben og strålen", "Probetyper, fokus, strålens form, opløsning i dybden og til siden, snittykkelse, kontrast, billedhastighed og harmoniske. Simulatoren: et testfantom med tråde og cyster, og en lup."],
             en: ["The probe and the beam", "Probe types, focus, the beam's shape, axial and lateral resolution, slice thickness, contrast, frame rate and harmonics. The simulator: a test phantom with wires and cysts, and a magnifier."] },
  { n: "U4", path: "knobs", kinds: ["video", "simulator"],
             da: ["Knapper og orientering", "Gain, TGC, dybde, zoom, frekvens, fokus, dynamikområde, sektor og linjetæthed, og hvordan billedet vender. Simulatoren: en nyre set gennem leveren."],
             en: ["Knobs and orientation", "Gain, TGC, depth, zoom, frequency, focus, dynamic range, sector and line density, and which way the image faces. The simulator: a kidney seen through the liver."] },
  { n: "U5", path: "artefacts", kinds: ["simulator"], da: ["Artefakter i klinikken", "Genlyd, skygge, forstærkning, spejlbillede og andre artefakter, koblet til sten, cyster, fedtlever og kanyler. Simulatoren: flyt sten, gas, cyste og kanyle."],
             en: ["Artefacts in the clinic", "Reverberation, shadowing, enhancement, mirror images and other artefacts, linked to stones, cysts, fatty liver and needles. The simulator: move stone, gas, cyst and needle."] },
  { n: "U6", path: "doppler", kinds: ["video", "simulator"], da: ["Doppler og sikkerhed", "Dopplereffekten, vinkel, farve-, power- og spektraldoppler, aliasing, kompression ved DVT, TI/MI og ALARA. Simulatoren: arterie og vene i lysken."],
             en: ["Doppler and safety", "The Doppler effect, angle, colour, power and spectral Doppler, aliasing, compression for DVT, TI/MI and ALARA. The simulator: artery and vein in the groin."] },
];
// after the six topics: the glossary and the self-test, across all topics
const EXTRA = [
  { path: "glossary", da: ["Ordliste", "Ordene fra alle seks emner på dansk og engelsk, med en kort forklaring. Søg på begge sprog."],
                      en: ["Glossary", "The words from all six topics in Danish and English, with a short explanation. Search in either language."] },
  { path: "quiz", da: ["Test dig selv", "Seks spørgsmål pr. emne i klinisk sprog, med forklaring. Intet bliver gemt."],
                  en: ["Test yourself", "Six questions per topic in clinical language, with explanations. Nothing is saved."] },
];
const TEXT = {
  da: { title: "Ultralyd | Oliver Brage", skip: "Spring til indhold", eyebrow: "Læring · forhåndsvisning", h1: "Ultralyd",
        lead: "Fysikken bag ultralydsbilledet, så tiden i klassen kan gå til at skanne. Simulatorer og korte videoer på dansk og engelsk, i en grundversion og en fordybelse, plus en ordliste og en selvtest.",
        topicsTitle: "Emner", topicsIntro: "Seks emner i kursets rækkefølge. Hvert emne har en video, en simulator med opgaver og et ordkort.",
        soon: "På vej", open: "Åbn →", kinds: { simulator: "Simulator", video: "Video" }, all: "Alle emner",
        rights: "Alle rettigheder forbeholdes.", privacy: "Privatliv", profile: "Profil", projects: "Projekter", learn: "Læring" },
  en: { title: "Ultrasound | Oliver Brage", skip: "Skip to content", eyebrow: "Learn · preview", h1: "Ultrasound",
        lead: "The physics behind the ultrasound image, so class time can go to scanning. Simulators and short videos in Danish and English, with a basic and a deeper level, plus a glossary and a self-test.",
        topicsTitle: "Topics", topicsIntro: "Six topics in course order. Each topic has a video, a simulator with tasks and a glossary card.",
        soon: "On the way", open: "Open →", kinds: { simulator: "Simulator", video: "Video" }, all: "All topics",
        rights: "All rights reserved.", privacy: "Privacy", profile: "Profile", projects: "Projects", learn: "Learn" },
};
function pickLang() {
  const l = new URLSearchParams(location.search).get("lang");
  if (l === "da" || l === "en") return l;
  return (navigator.language || "").toLowerCase().startsWith("da") ? "da" : "en";
}
function apply(lang) {
  const t = TEXT[lang];
  document.documentElement.lang = lang;
  document.title = t.title;
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t[el.dataset.t]; });
  document.querySelectorAll(".lang-switch button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  document.getElementById("topics").innerHTML = `<div class="grid-3 track">` + TOPICS.map(p => {
    const [title, text] = p[lang];
    return p.path
      ? `<a class="card sim-card" href="${p.path}/?lang=${lang}"><span class="kind">${p.n} · ${p.kinds.map(k => t.kinds[k]).join(" · ")}</span>
         <h3>${title}</h3><p class="muted">${text}</p><span class="go">${t.open}</span></a>`
      : `<div class="card sim-card soon"><span class="kind">${p.n} · ${t.soon}</span><h3>${title}</h3><p>${text}</p></div>`;
  }).join("") + EXTRA.map(p => `<a class="card sim-card" href="${p.path}/?lang=${lang}"><span class="kind">${t.all}</span>
         <h3>${p[lang][0]}</h3><p class="muted">${p[lang][1]}</p><span class="go">${t.open}</span></a>`).join("") + `</div>`;
  history.replaceState(null, "", "?lang=" + lang);
}
document.querySelectorAll(".lang-switch button").forEach(b => { b.onclick = () => apply(b.dataset.lang); });
apply(pickLang());
