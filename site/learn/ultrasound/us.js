// The ultrasound overview: the six topics in course order, Danish/English in the address (?lang=da),
// nothing saved on the visitor's device. A topic with a path has a page; the others are on the way.
const TOPICS = [
  { n: "U1", da: ["Lyd og ekko", "Lyd, frekvens og bølgelængde, 1540 m/s, puls-ekko og gråtoner. Hvorfor væv ser lyst eller mørkt ud."],
             en: ["Sound and echo", "Sound, frequency and wavelength, 1540 m/s, pulse-echo and grey scale. Why tissue looks bright or dark."] },
  { n: "U2", da: ["Lyd møder væv", "Impedans, refleksion, spredning og speckle, brydning, absorption og dæmpning."],
             en: ["Sound meets tissue", "Impedance, reflection, scatter and speckle, refraction, absorption and attenuation."] },
  { n: "U3", da: ["Proben og strålen", "Piezo, probetyper, fokusering, strålens form og de fem slags opløsning."],
             en: ["The probe and the beam", "Piezo, probe types, focusing, the beam's shape and the five kinds of resolution."] },
  { n: "U4", path: "knobs", kinds: ["simulator"],
             da: ["Knapper og orientering", "Gain, TGC, dybde, zoom, frekvens, fokus, dynamikområde, sektor og linjetæthed, og hvordan billedet vender. Simulatoren: en nyre set gennem leveren."],
             en: ["Knobs and orientation", "Gain, TGC, depth, zoom, frequency, focus, dynamic range, sector and line density, and which way the image faces. The simulator: a kidney seen through the liver."] },
  { n: "U5", path: "artefacts", kinds: ["simulator"], da: ["Artefakter i klinikken", "Genlyd, skygge, forstærkning, spejlbillede og andre artefakter, koblet til sten, cyster, fedtlever og kanyler. Simulatoren: flyt sten, gas, cyste og kanyle."],
             en: ["Artefacts in the clinic", "Reverberation, shadowing, enhancement, mirror images and other artefacts, linked to stones, cysts, fatty liver and needles. The simulator: move stone, gas, cyst and needle."] },
  { n: "U6", da: ["Doppler og sikkerhed", "Dopplereffekten, vinkel, farve-, power- og spektraldoppler, aliasing, kompression ved DVT, TI/MI og ALARA."],
             en: ["Doppler and safety", "The Doppler effect, angle, colour, power and spectral Doppler, aliasing, compression for DVT, TI/MI and ALARA."] },
];
const TEXT = {
  da: { title: "Ultralyd | Oliver Brage", skip: "Spring til indhold", eyebrow: "Læring · forhåndsvisning", h1: "Ultralyd",
        lead: "Fysikken bag ultralydsbilledet, så tiden i klassen kan gå til at skanne. Simulatorer og korte videoer på dansk og engelsk, i en grundversion og en fordybelse.",
        topicsTitle: "Emner", topicsIntro: "Seks emner i kursets rækkefølge. Flere kommer til efterhånden.",
        soon: "På vej", open: "Åbn →", kinds: { simulator: "Simulator", video: "Video" },
        rights: "Alle rettigheder forbeholdes.", privacy: "Privatliv", profile: "Profil", projects: "Projekter", learn: "Læring" },
  en: { title: "Ultrasound | Oliver Brage", skip: "Skip to content", eyebrow: "Learn · preview", h1: "Ultrasound",
        lead: "The physics behind the ultrasound image, so class time can go to scanning. Simulators and short videos in Danish and English, with a basic and a deeper level.",
        topicsTitle: "Topics", topicsIntro: "Six topics in course order. More are added as they are ready.",
        soon: "On the way", open: "Open →", kinds: { simulator: "Simulator", video: "Video" },
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
  }).join("") + `</div>`;
  history.replaceState(null, "", "?lang=" + lang);
}
document.querySelectorAll(".lang-switch button").forEach(b => { b.onclick = () => apply(b.dataset.lang); });
apply(pickLang());
