// Danish/English switch for the learning pages. The choice lives in the address (?lang=da),
// not in browser storage, so nothing is saved on the visitor's device.
const TEXT = {
  en: {
    title: "Learn | Oliver Brage", eyebrow: "Learn",
    h1: "Interactive material for radiography.",
    lead: "Simulators and short videos that let you try the physics behind the image yourself. Each one comes in Danish and English, with a basic and a deeper level.",
    radiography: "Radiography", radioIntro: "Image geometry, the digital image, noise and scatter.",
    simKind: "Simulator", shadowTitle: "When the shadow lies",
    shadowText: "Magnification, penumbra, motion blur and superimposition. Move the focal spot, the object and the detector.",
    histTitle: "Histogram and window",
    histText: "The histogram, exposure index (REX), automatic rescaling, LUT and WW/WL. Change the dose and collimation, and see why brightness says nothing about dose.",
    open: "Open simulator →",
    soonTitle: "More on the way", soonText: "Videos on the digital image, and simulators on noise and scatter, are in production.",
    rights: "All rights reserved.", privacy: "Privacy", profile: "Profile", projects: "Projects",
  },
  da: {
    title: "Læring | Oliver Brage", eyebrow: "Læring",
    h1: "Interaktivt materiale til radiografi.",
    lead: "Simulatorer og korte videoer, hvor du selv kan prøve fysikken bag billedet. Alt findes på dansk og engelsk, i en grundversion og en fordybelse.",
    radiography: "Radiografi", radioIntro: "Billedgeometri, det digitale billede, støj og spredt stråling.",
    simKind: "Simulator", shadowTitle: "Når skyggen snyder",
    shadowText: "Forstørrelse, halvskygge, bevægelsesuskarphed og overlejring. Flyt fokus, objekt og detektor.",
    histTitle: "Histogram og vindue",
    histText: "Histogram, eksponeringsindeks (REX), automatisk skalering, LUT og WW/WL. Skru på dosis og indblænding, og se hvorfor lysheden intet siger om dosis.",
    open: "Åbn simulatoren →",
    soonTitle: "Mere på vej", soonText: "Videoer om det digitale billede og simulatorer om støj og spredt stråling er under produktion.",
    rights: "Alle rettigheder forbeholdes.", privacy: "Privatliv", profile: "Profil", projects: "Projekter",
  },
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
  // links to simulators open in the same language
  document.querySelectorAll("a[data-keep-lang]").forEach(a => {
    a.href = a.getAttribute("href").split("?")[0] + "?lang=" + lang;
  });
  document.querySelectorAll(".lang-switch button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  history.replaceState(null, "", "?lang=" + lang);
}

document.querySelectorAll(".lang-switch button").forEach(b => { b.onclick = () => apply(b.dataset.lang); });
apply(pickLang());
