// Ultrasound glossary: the words from the six topics, Danish and English, each with a short explanation in own words
// (not the textbook's). Numbers match the simulators. Language in the address (?lang=da), nothing saved.
// Each term: [Danish word, English word, Danish explanation, English explanation].
const GROUPS = [
  { n: "U1", path: "echo", da: "Lyd og ekko", en: "Sound and echo", terms: [
    ["Frekvens", "Frequency", "Hvor mange svingninger lyden laver pr. sekund, målt i megahertz (MHz). Høj frekvens giver skarpere billeder, men når ikke så dybt.", "How many cycles the sound makes per second, in megahertz (MHz). A high frequency gives sharper images but does not reach as deep."],
    ["Bølgelængde", "Wavelength", "Længden af én svingning: lydens hastighed divideret med frekvensen. 0,44 mm ved 3,5 MHz i blødt væv.", "The length of one cycle: the speed of sound divided by the frequency. 0.44 mm at 3.5 MHz in soft tissue."],
    ["Lydens hastighed", "Speed of sound", "Skanneren regner med 1540 m/s i alt blødt væv. I fedt er lyden langsommere (cirka 1450 m/s), så ting bag fedt tegnes lidt for dybt.", "The scanner assumes 1540 m/s in all soft tissue. In fat sound is slower (about 1450 m/s), so things behind fat are drawn slightly too deep."],
    ["Puls-ekko", "Pulse-echo", "Proben sender en kort puls og lytter efter ekkoerne. Tiden, til ekkoet kommer tilbage, giver dybden: 13 mikrosekunder pr. centimeter.", "The probe sends a short pulse and listens for the echoes. The time until the echo returns gives the depth: 13 microseconds per centimetre."],
    ["A-linje / B-billede", "A-line / B-mode", "En A-linje er ekkoets styrke langs én linje. Et B-billede er mange linjer ved siden af hinanden, hvor styrken vises som grå toner.", "An A-line is the echo strength along one line. A B-mode image is many lines side by side, with the strength shown as grey levels."],
    ["Ekkofri", "Anechoic", "Sort: der kommer intet ekko, fx fra væske i en cyste eller galdeblæren.", "Black: no echo comes back, for example from fluid in a cyst or the gallbladder."],
    ["Hypo- / hyperekkoisk", "Hypo- / hyperechoic", "Mørkere / lysere end vævet omkring. Ordene sammenligner altid med noget.", "Darker / brighter than the tissue around. The words always compare with something."],
    ["Rækkevidde", "Penetration", "Hvor dybt der stadig kommer brugbare ekkoer. Cirka 70 divideret med frekvensen i MHz, i centimeter, i simulatorerne.", "How deep useful echoes still come from. About 70 divided by the frequency in MHz, in centimetres, in the simulators."],
  ] },
  { n: "U2", path: "tissue", da: "Lyd møder væv", en: "Sound meets tissue", terms: [
    ["Impedans", "Impedance", "Hvor svært det er for lyden at sætte vævet i bevægelse: tæthed gange lydens hastighed. Forskellen i impedans ved en grænse bestemmer ekkoet.", "How hard it is for sound to set the tissue moving: density times the speed of sound. The difference in impedance at a boundary sets the echo."],
    ["Refleksion", "Reflection", "Lyd, der kastes tilbage ved en grænse. Blødt væv mod blødt væv: under 1 %. Blødt væv mod luft: næsten 100 %.", "Sound sent back at a boundary. Soft tissue against soft tissue: under 1 %. Soft tissue against air: almost 100 %."],
    ["Spejlende refleksion", "Specular reflection", "Fra en glat, stor grænse. Ekkoet er stærkt, men kun når strålen rammer vinkelret.", "From a smooth, large boundary. The echo is strong, but only when the beam hits at right angles."],
    ["Spredning", "Scatter", "Fra små strukturer inde i vævet. Lyden går i alle retninger og giver vævets kornede mønster (speckle).", "From small structures inside the tissue. Sound goes in all directions and gives the tissue's grainy pattern (speckle)."],
    ["Dæmpning", "Attenuation", "Lyden bliver svagere på vejen: cirka 0,5 dB pr. cm pr. MHz i blødt væv, begge veje. Mest absorption, hvor lyden bliver til varme.", "The sound gets weaker on the way: about 0.5 dB per cm per MHz in soft tissue, both ways. Mostly absorption, where sound turns into heat."],
    ["Gel", "Gel", "Fjerner luften mellem proben og huden. Uden gel kastes næsten al lyden tilbage ved huden.", "Removes the air between the probe and the skin. Without gel almost all the sound is sent back at the skin."],
    ["Brydning", "Refraction", "Lyden skifter retning, når den går skråt over en grænse mellem væv med forskellig lydhastighed. Ting bagved kan blive tegnet forskudt.", "The sound changes direction when it crosses a boundary between tissues with different speeds at a slant. Things behind can be drawn shifted."],
    ["Total refleksion", "Total reflection", "Over en vis vinkel kommer lyden slet ikke over grænsen, fx ind i knogle ved mere end cirka 22°.", "Above a certain angle the sound does not cross the boundary at all, for example into bone at more than about 22°."],
  ] },
  { n: "U3", path: "probe", da: "Proben og strålen", en: "The probe and the beam", terms: [
    ["Piezoelektrisk element", "Piezoelectric element", "Krystal i proben, der svinger, når den får spænding, og giver spænding, når ekkoet rammer den. Proben både sender og lytter.", "A crystal in the probe that vibrates when given a voltage, and gives a voltage when the echo hits it. The probe both sends and listens."],
    ["Lineær probe", "Linear probe", "Flad probe med parallelle linjer og høj frekvens. Billedet er et rektangel. Til kar, sener, muskler og skjoldbruskkirtel.", "A flat probe with parallel lines and a high frequency. The image is a rectangle. For vessels, tendons, muscles and the thyroid."],
    ["Konveks probe", "Curvilinear probe", "Buet probe med lav frekvens. Linjerne spreder sig, så billedet bliver bredere nedad. Til abdomen og bækken.", "A curved probe with a low frequency. The lines fan out, so the image widens with depth. For the abdomen and pelvis."],
    ["Sektorprobe", "Phased array probe", "Lille probe, hvor linjerne styres ud fra ét punkt. Kan se mellem ribbenene, fx på hjertet.", "A small probe where the lines are steered out from one point. Can see between the ribs, for example the heart."],
    ["Fokus", "Focus", "Dybden, hvor strålen er smallest. Læg det ved det, du vil se, eller lige under.", "The depth where the beam is narrowest. Put it at what you want to see, or just below."],
    ["Aksial opløsning", "Axial resolution", "Hvor tæt to ting oven over hinanden kan ligge og stadig ses som to: en halv pulslængde. Bedre med høj frekvens.", "How close two things one above the other can be and still show as two: half the pulse length. Better at a high frequency."],
    ["Lateral opløsning", "Lateral resolution", "Det samme for to ting ved siden af hinanden. Bestemmes af strålens bredde, så den er bedst i fokus.", "The same for two things side by side. Set by the width of the beam, so it is best at the focus."],
    ["Snittykkelse", "Slice thickness", "Strålens tykkelse på tværs af billedet, fastlagt af en linse på proben. Små cyster kan blive grå, fordi vævet ved siden af kommer med.", "The beam's thickness across the image, set by a lens on the probe. Small cysts can turn grey because the tissue beside them is included."],
    ["Kontrastopløsning", "Contrast resolution", "Evnen til at vise små forskelle i ekkostyrke. Små forskelle drukner i vævets korn.", "The ability to show small differences in echo strength. Small differences drown in the tissue's grain."],
    ["Harmonisk billede", "Harmonic imaging", "Skanneren lytter efter den dobbelte frekvens, som vævet selv laver. Smallere stråle og færre sidelapper, men mindre rækkevidde.", "The scanner listens for twice the frequency, which the tissue makes itself. A narrower beam and fewer side lobes, but less reach."],
  ] },
  { n: "U4", path: "knobs", da: "Knapper og orientering", en: "Knobs and orientation", terms: [
    ["Gain", "Gain", "Forstærker alle ekkoer lige meget, også støjen. Gør billedet lysere eller mørkere.", "Amplifies all echoes equally, the noise too. Makes the image brighter or darker."],
    ["Dybdeforstærkning (TGC)", "Time gain compensation (TGC)", "Forstærkning, der kan stilles for hver dybde, så dæmpningen udlignes, og vævet ser ens ud fra top til bund.", "Gain that can be set for each depth, so attenuation is evened out and the tissue looks the same from top to bottom."],
    ["Dybde", "Depth", "Hvor dybt billedet går. Mindre dybde giver et større billede af det, du ser på, og flere billeder pr. sekund.", "How deep the image goes. Less depth gives a larger image of what you look at, and more frames per second."],
    ["Dynamikområde", "Dynamic range", "Hvor mange dB fra svageste til stærkeste ekko, der vises som grå toner. Lavt: hård kontrast. Højt: blødere billede med flere nuancer.", "How many dB from the weakest to the strongest echo are shown as grey levels. Low: hard contrast. High: a softer image with more shades."],
    ["Fokuszone", "Focal zone", "Hver ekstra fokuszone sender hver linje en gang til. Skarpere over et større område, men færre billeder pr. sekund.", "Each extra focal zone sends each line once more. Sharper over a larger range, but fewer frames per second."],
    ["Billedfrekvens", "Frame rate", "Billeder pr. sekund. Falder med dybden, antallet af linjer og antallet af fokuszoner.", "Frames per second. Falls with depth, the number of lines and the number of focal zones."],
    ["Markør", "Orientation marker", "Mærket på proben svarer til mærket på skærmen. I tværsnit: patientens højre på skærmens venstre.", "The mark on the probe matches the mark on the screen. In transverse: the patient's right on the screen's left."],
    ["Skanplan", "Scan plane", "Længdesnit (sagittalt) eller tværsnit (transversalt). Se altid en struktur i to plan.", "Longitudinal (sagittal) or transverse. Always look at a structure in two planes."],
  ] },
  { n: "U5", path: "artefacts", da: "Artefakter i klinikken", en: "Artefacts in the clinic", terms: [
    ["Artefakt", "Artefact", "Noget i billedet, der ikke er der, eller noget, der er der, men ikke ses. Opstår, når skannerens antagelser ikke passer.", "Something in the image that is not there, or something that is there but is not seen. Arises when the scanner's assumptions do not hold."],
    ["Akustisk skygge", "Acoustic shadowing", "Mørkt område bag noget, der kaster lyden tilbage eller dæmper meget: sten, knogle (ren skygge) og gas (snavset skygge).", "A dark area behind something that sends the sound back or attenuates a lot: stones, bone (clean shadow) and gas (dirty shadow)."],
    ["Forstærkning", "Enhancement", "Lysere område bag noget, der dæmper lidt, fx væske i en cyste eller galdeblæren. Et tegn på væske.", "A brighter area behind something that attenuates little, for example fluid in a cyst or the gallbladder. A sign of fluid."],
    ["Genlyd", "Reverberation", "Ekkoet går frem og tilbage mellem proben og en stærk reflektor og tegnes som kopier med lige store afstande.", "The echo bounces between the probe and a strong reflector and is drawn as copies at equal distances."],
    ["Comet tail", "Comet tail", "Genlyd inden i en lille struktur, fx en kanyle: tætte, lyse streger, der bliver svagere nedad.", "Reverberation inside a small structure, for example a needle: close, bright lines that fade downwards."],
    ["Spejlbillede", "Mirror image", "En kopi bag en stærk, glat reflektor, fx leveren bag diafragma. Forsvinder, hvis der er væske i lungehulen.", "A copy behind a strong, smooth reflector, for example the liver behind the diaphragm. Disappears if there is fluid in the pleural space."],
    ["Kantskygge", "Edge shadow", "Smal, mørk stribe under kanten af en rund, væskefyldt struktur, hvor lyden bøjes og spredes væk.", "A narrow dark streak under the edge of a round, fluid-filled structure, where the sound is bent and scattered away."],
    ["Sidelapper", "Side lobes", "Svage stråler ud til siden. Ekkoer fra dem tegnes, som om de kom fra hovedstrålen, og kan ligne slam i galdeblæren.", "Weak beams out to the side. Echoes from them are drawn as if they came from the main beam, and can look like sludge in the gallbladder."],
    ["Anisotropi", "Anisotropy", "Sener og kanyler giver kun stærkt ekko, når strålen rammer vinkelret. Vippet bliver de mørke. Vip proben, før du konkluderer.", "Tendons and needles only give a strong echo when the beam hits at right angles. Tilted, they turn dark. Tilt the probe before you conclude."],
  ] },
  { n: "U6", path: "doppler", da: "Doppler og sikkerhed", en: "Doppler and safety", terms: [
    ["Dopplerskift", "Doppler shift", "Ændringen i frekvens, når lyden rammer blod i bevægelse. Højere mod proben, lavere væk fra den.", "The change in frequency when the sound hits moving blood. Higher towards the probe, lower away from it."],
    ["Dopplervinkel", "Doppler angle", "Vinklen mellem strålen og blodets retning. Hold den under 60°; ved 90° måles intet.", "The angle between the beam and the direction of the blood. Keep it below 60°; at 90° nothing is measured."],
    ["Farvedoppler", "Colour Doppler", "Viser retning og hastighed som farve oven på B-billedet. Rød og blå betyder mod og væk fra proben, ikke arterie og vene.", "Shows direction and speed as colour on top of the B-mode image. Red and blue mean towards and away from the probe, not artery and vein."],
    ["Powerdoppler", "Power Doppler", "Viser, at der er flow, men ikke retningen. Mere følsom for langsomt flow og næsten uafhængig af vinklen.", "Shows that there is flow, but not its direction. More sensitive to slow flow and almost independent of the angle."],
    ["Spektraldoppler", "Spectral Doppler", "Hastigheden over tid i én prøveboks, vist som et spektrum. Bruges til at måle hastigheder.", "The speed over time in one sample box, shown as a spectrum. Used to measure speeds."],
    ["Skala (PRF)", "Scale (PRF)", "Hvor mange pulser pr. sekund. Bestemmer, hvor høje hastigheder der kan vises uden aliasing.", "How many pulses per second. Sets how high speeds can be shown without aliasing."],
    ["Aliasing", "Aliasing", "Hastigheder over halvdelen af PRF vises i den forkerte retning. Hæv skalaen, flyt baselinen eller sænk dybden.", "Speeds above half the PRF are shown in the wrong direction. Raise the scale, move the baseline or reduce the depth."],
    ["Vægfilter", "Wall filter", "Fjerner de langsomme signaler fra karvæggens bevægelse. For højt filter kan fjerne langsomt blodflow.", "Removes the slow signals from the vessel wall's movement. Too high a filter can remove slow blood flow."],
    ["Kompression", "Compression", "Tryk med proben på venen. En normal vene klapper helt sammen; en vene, der ikke gør det, tyder på en trombe (DVT).", "Pressing on the vein with the probe. A normal vein collapses fully; a vein that does not suggests a thrombus (DVT)."],
    ["TI og MI", "TI and MI", "Termisk indeks (opvarmning) og mekanisk indeks (tryk). Vises på skærmen; hold dem lave og skan ikke længere end nødvendigt (ALARA).", "Thermal index (heating) and mechanical index (pressure). Shown on the screen; keep them low and scan no longer than needed (ALARA)."],
  ] },
];

const TEXT = {
  da: { title: "Ordliste | Ultralyd | Oliver Brage", skip: "Spring til indhold", eyebrow: "Ultralyd · ordliste", h1: "Ordliste", back: "← Ultralyd",
        lead: "Ordene fra de seks emner på dansk og engelsk, med en kort forklaring. Søg på begge sprog.",
        find: "Søg, fx skygge eller aliasing", all: "Alle", none: "Intet ord passer til søgningen.", open: "Til emnet →",
        rights: "Alle rettigheder forbeholdes.", privacy: "Privatliv", profile: "Profil", projects: "Projekter", learn: "Læring" },
  en: { title: "Glossary | Ultrasound | Oliver Brage", skip: "Skip to content", eyebrow: "Ultrasound · glossary", h1: "Glossary", back: "← Ultrasound",
        lead: "The words from the six topics in Danish and English, with a short explanation. Search in either language.",
        find: "Search, for example shadow or aliasing", all: "All", none: "No word matches the search.", open: "To the topic →",
        rights: "All rights reserved.", privacy: "Privacy", profile: "Profile", projects: "Projects", learn: "Learn" },
};

let LANG = "da", ONLY = "";
const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fold = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function drawList() {
  const t = TEXT[LANG], q = fold($("find").value.trim()), o = LANG === "da" ? 0 : 1;
  const html = GROUPS.filter(g => !ONLY || g.n === ONLY).map(g => {
    const rows = g.terms.filter(r => !q || fold(r.join(" ")).includes(q));
    if (!rows.length) return "";
    return `<div class="gl-group"><h3><small>${g.n}</small>${g[LANG]} · <a href="../${g.path}/?lang=${LANG}">${t.open}</a></h3><dl class="gl">` +
      rows.map(r => `<dt>${esc(r[o])}<span>${esc(r[1 - o])}</span></dt><dd>${esc(r[2 + o])}</dd>`).join("") + `</dl></div>`;
  }).join("");
  $("list").innerHTML = html || `<p class="empty">${t.none}</p>`;
}
function drawChips() {
  const t = TEXT[LANG];
  $("chips").innerHTML = [["", t.all], ...GROUPS.map(g => [g.n, g.n])].map(([k, s]) =>
    `<button class="chip" data-k="${k}" aria-pressed="${ONLY === k}">${s}</button>`).join(" ");
  $("chips").querySelectorAll("button").forEach(b => { b.onclick = () => { ONLY = b.dataset.k; drawChips(); drawList(); }; });
}
function apply(lang) {
  LANG = lang;
  const t = TEXT[lang];
  document.documentElement.lang = lang;
  document.title = t.title;
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t[el.dataset.t]; });
  document.querySelectorAll(".lang-switch button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  $("back").href = "../?lang=" + lang;
  $("find").placeholder = t.find; $("find").setAttribute("aria-label", t.find);
  drawChips(); drawList();
  history.replaceState(null, "", "?lang=" + lang);
}
function pickLang() {
  const l = new URLSearchParams(location.search).get("lang");
  if (l === "da" || l === "en") return l;
  return (navigator.language || "").toLowerCase().startsWith("da") ? "da" : "en";
}
document.querySelectorAll(".lang-switch button").forEach(b => { b.onclick = () => apply(b.dataset.lang); });
$("find").addEventListener("input", drawList);
apply(pickLang());
