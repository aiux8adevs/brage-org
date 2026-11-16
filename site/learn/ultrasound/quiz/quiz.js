// Ultrasound self-test: six questions per topic, in clinical language, each with an explanation.
// Runs in the browser only: nothing is sent or saved; a reload starts over. Numbers match the simulators.
// Each question: { da: [question, [options], explanation], en: [...], a: index of the right option }.
const QUIZ = [
  { n: "U1", path: "echo", da: "Lyd og ekko", en: "Sound and echo", qs: [
    { a: 1, da: ["Du skal se en sene 1 cm under huden. Hvilken frekvens vælger du?", ["3,5 MHz", "12 MHz", "Det er ligegyldigt"], "Høj frekvens giver kort bølgelængde og skarpere billede. Rækkevidden er kort, men senen ligger lige under huden."],
               en: ["You need to see a tendon 1 cm under the skin. Which frequency do you choose?", ["3.5 MHz", "12 MHz", "It does not matter"], "A high frequency gives a short wavelength and a sharper image. The reach is short, but the tendon lies just under the skin."] },
    { a: 0, da: ["Et ekko kommer tilbage efter 130 mikrosekunder. Hvor dybt tegner skanneren det?", ["10 cm", "5 cm", "20 cm"], "Lyden går ned og op igen med 1540 m/s: 13 mikrosekunder pr. centimeter dybde. 130 / 13 = 10 cm."],
               en: ["An echo returns after 130 microseconds. How deep does the scanner draw it?", ["10 cm", "5 cm", "20 cm"], "The sound goes down and back up at 1540 m/s: 13 microseconds per centimetre of depth. 130 / 13 = 10 cm."] },
    { a: 2, da: ["Hvordan ser væske i en simpel cyste ud?", ["Hyperekkoisk", "Hypoekkoisk med korn", "Ekkofri (sort)"], "Væske har ingen små strukturer, der spreder lyden, så der kommer intet ekko indefra."],
               en: ["What does fluid in a simple cyst look like?", ["Hyperechoic", "Hypoechoic with grain", "Anechoic (black)"], "Fluid has no small structures that scatter sound, so no echo comes from inside."] },
    { a: 1, da: ["Bag et tykt fedtlag ligger en struktur lidt for dybt i billedet. Hvorfor?", ["Fedt dæmper lyden", "Lyden er langsommere i fedt, men skanneren regner med 1540 m/s", "Fedt giver genlyd"], "Ekkoet er længere om at komme tilbage, og skanneren omsætter tid til dybde med 1540 m/s. Derfor tegnes det, der ligger bagved, for dybt."],
               en: ["Behind a thick fat layer a structure lies slightly too deep in the image. Why?", ["Fat attenuates the sound", "Sound is slower in fat, but the scanner assumes 1540 m/s", "Fat causes reverberation"], "The echo takes longer to return, and the scanner turns time into depth at 1540 m/s. So whatever lies behind is drawn too deep."] },
    { a: 0, da: ["Hvad betyder hyperekkoisk?", ["Lysere end vævet omkring", "Helt sort", "Med mange artefakter"], "Hyper- og hypoekkoisk sammenligner altid med noget: lysere eller mørkere end vævet omkring."],
               en: ["What does hyperechoic mean?", ["Brighter than the tissue around", "Completely black", "With many artefacts"], "Hyper- and hypoechoic always compare with something: brighter or darker than the tissue around."] },
    { a: 2, da: ["Du skal se 15 cm ned i en stor patient. Hvad sker der ved 10 MHz?", ["Billedet bliver skarpere i dybden", "Ingenting", "Lyden når kun cirka 7 cm ned; dybden bliver støj"], "Dæmpningen vokser med frekvensen. Rækkevidden er cirka 70 / f cm, så 7 cm ved 10 MHz. Vælg 3–4 MHz."],
               en: ["You need to see 15 cm deep in a large patient. What happens at 10 MHz?", ["The image gets sharper in depth", "Nothing", "The sound only reaches about 7 cm; the depth turns to noise"], "Attenuation grows with frequency. The reach is about 70 / f cm, so 7 cm at 10 MHz. Choose 3–4 MHz."] },
  ] },
  { n: "U2", path: "tissue", da: "Lyd møder væv", en: "Sound meets tissue", qs: [
    { a: 1, da: ["Hvorfor skal der gel på proben?", ["Den køler huden", "Luft mellem probe og hud kaster næsten al lyden tilbage", "Den forstærker ekkoet"], "Luft har meget lav impedans. Grænsen mellem væv og luft kaster næsten 100 % tilbage, så intet kommer ind."],
               en: ["Why must there be gel on the probe?", ["It cools the skin", "Air between probe and skin sends almost all the sound back", "It amplifies the echo"], "Air has a very low impedance. The tissue–air boundary sends almost 100 % back, so nothing gets in."] },
    { a: 0, da: ["Hvad bestemmer, hvor stærkt ekkoet er ved en grænse?", ["Forskellen i impedans på de to sider", "Hvor dybt grænsen ligger", "Gain"], "Jo større forskel i impedans, jo mere lyd kastes tilbage. Blødt væv mod blødt væv giver under 1 %."],
               en: ["What sets how strong the echo is at a boundary?", ["The difference in impedance on the two sides", "How deep the boundary lies", "The gain"], "The larger the difference in impedance, the more sound is sent back. Soft tissue against soft tissue gives under 1 %."] },
    { a: 2, da: ["En glat organkapsel forsvinder, når du vipper proben. Hvorfor?", ["Den dæmper lyden", "Snittykkelse", "Spejlende refleksion: ekkoet går forbi proben, når strålen ikke rammer vinkelret"], "En stor, glat grænse kaster lyden tilbage som et spejl. Skrå indfald sender ekkoet væk fra proben."],
               en: ["A smooth organ capsule disappears when you tilt the probe. Why?", ["It attenuates the sound", "Slice thickness", "Specular reflection: the echo misses the probe when the beam does not hit at right angles"], "A large, smooth boundary sends the sound back like a mirror. A slanted beam sends the echo away from the probe."] },
    { a: 1, da: ["Hvorfor bliver dybe dele af billedet mørkere uden TGC?", ["Spredning", "Dæmpning: lyden mister cirka 0,5 dB pr. cm pr. MHz hver vej", "Brydning"], "Lyden dæmpes på vejen ned og op. Skanneren udligner det med dybdeforstærkning."],
               en: ["Why do deep parts of the image get darker without TGC?", ["Scatter", "Attenuation: the sound loses about 0.5 dB per cm per MHz each way", "Refraction"], "The sound is attenuated on the way down and up. The scanner evens it out with time gain compensation."] },
    { a: 0, da: ["Hvad giver vævets kornede mønster (speckle)?", ["Spredning fra mange små strukturer", "Genlyd", "Støj i kablet"], "Ekkoerne fra mange små spredere lægges sammen og giver et kornet mønster, der ikke er et billede af de enkelte strukturer."],
               en: ["What gives the tissue's grainy pattern (speckle)?", ["Scatter from many small structures", "Reverberation", "Noise in the cable"], "The echoes from many small scatterers add up to a grainy pattern that is not an image of the single structures."] },
    { a: 2, da: ["Hvorfor kan du ikke se ind i en knogle?", ["Knogle er ekkofri", "Lyden bliver brudt", "Knogle kaster meget tilbage og dæmper resten kraftigt; bagved er der skygge"], "Knogle har høj impedans og dæmper cirka 40 gange mere end blødt væv. Overfladen ses lys, og bagved er der akustisk skygge."],
               en: ["Why can you not see into bone?", ["Bone is anechoic", "The sound is refracted", "Bone sends a lot back and attenuates the rest strongly; behind it there is a shadow"], "Bone has a high impedance and attenuates about 40 times more than soft tissue. The surface shows bright, with acoustic shadowing behind."] },
  ] },
  { n: "U3", path: "probe", da: "Proben og strålen", en: "The probe and the beam", qs: [
    { a: 1, da: ["Hvilken probe vælger du til en abdominal skanning?", ["Lineær 10 MHz", "Konveks 3,5 MHz", "Sektor 2,5 MHz"], "Den konvekse probe har lav frekvens, når dybt og giver et bredt billede i dybden."],
               en: ["Which probe do you choose for an abdominal scan?", ["Linear 10 MHz", "Curved 3.5 MHz", "Phased 2.5 MHz"], "The curved probe has a low frequency, reaches deep and gives a wide image at depth."] },
    { a: 0, da: ["Hvor skal fokus ligge?", ["Ved det, du vil se, eller lige under", "Altid i toppen af billedet", "Altid i bunden"], "Strålen er smallest i fokus, så det er dér, opløsningen til siden er bedst."],
               en: ["Where should the focus be?", ["At what you want to see, or just below", "Always at the top of the image", "Always at the bottom"], "The beam is narrowest at the focus, so that is where the lateral resolution is best."] },
    { a: 2, da: ["Hvad forbedrer opløsningen i dybden (aksial)?", ["Flere fokuszoner", "At flytte fokus", "Højere frekvens: kortere puls"], "Aksial opløsning er en halv pulslængde. Kortere bølgelængde giver kortere puls. Fokus ændrer den ikke."],
               en: ["What improves the axial resolution?", ["More focal zones", "Moving the focus", "A higher frequency: a shorter pulse"], "Axial resolution is half the pulse length. A shorter wavelength gives a shorter pulse. Focus does not change it."] },
    { a: 1, da: ["En cyste på 2 mm ser grå og fast ud ved 7 cm med konveks probe. Hvad er den mest sandsynlige forklaring?", ["Den er fast", "Snittykkelsen: snittet er tykkere end cysten, så vævet ved siden af kommer med", "Forkert gain"], "Snittet er over 2 mm tykt dér. Brug højere frekvens, hvis du kan, og se den i to plan."],
               en: ["A 2 mm cyst looks grey and solid at 7 cm with a curved probe. What is the most likely explanation?", ["It is solid", "Slice thickness: the slice is thicker than the cyst, so the tissue beside it is included", "Wrong gain"], "The slice is over 2 mm thick there. Use a higher frequency if you can, and look at it in two planes."] },
    { a: 0, da: ["Du slår tre fokuszoner til. Hvad sker der med billedhastigheden?", ["Den falder til cirka en tredjedel", "Den stiger", "Ingenting"], "Hver linje sendes én gang pr. fokuszone. 43 billeder/s bliver til 14 ved 14 cm dybde."],
               en: ["You switch on three focal zones. What happens to the frame rate?", ["It falls to about a third", "It rises", "Nothing"], "Each line is sent once per focal zone. 43 frames/s becomes 14 at 14 cm depth."] },
    { a: 2, da: ["Hvad er prisen for harmonisk billede?", ["Bredere stråle", "Flere sidelapper", "Mindre rækkevidde"], "Harmonisk billede giver smallere stråle og færre sidelapper, men signalet er svagere, så rækkevidden falder."],
               en: ["What is the price of harmonic imaging?", ["A wider beam", "More side lobes", "Less reach"], "Harmonic imaging gives a narrower beam and fewer side lobes, but the signal is weaker, so the reach falls."] },
  ] },
  { n: "U4", path: "knobs", da: "Knapper og orientering", en: "Knobs and orientation", qs: [
    { a: 1, da: ["Den nederste del af leveren er mørk, mens toppen er fin. Hvad justerer du først?", ["Gain", "TGC i dybden", "Frekvensen op"], "Gain ændrer hele billedet. TGC kan løfte netop dybden, hvor dæmpningen har gjort ekkoerne svagere."],
               en: ["The lower part of the liver is dark while the top is fine. What do you adjust first?", ["Gain", "The TGC at depth", "The frequency up"], "Gain changes the whole image. TGC can lift just the depth where attenuation has weakened the echoes."] },
    { a: 0, da: ["Nyren fylder kun den øverste halvdel af billedet. Hvad gør du?", ["Mindsker dybden", "Øger gain", "Slår harmonisk til"], "Mindre dybde gør nyren større på skærmen og giver flere billeder pr. sekund."],
               en: ["The kidney only fills the upper half of the image. What do you do?", ["Reduce the depth", "Increase the gain", "Switch on harmonics"], "Less depth makes the kidney larger on the screen and gives more frames per second."] },
    { a: 2, da: ["I et tværsnit af abdomen: hvor er patientens højre side på skærmen?", ["Til højre", "Øverst", "Til venstre"], "Konventionen i radiologi: patientens højre på skærmens venstre, som hvis man ser op fra fødderne."],
               en: ["In a transverse view of the abdomen: where is the patient's right side on the screen?", ["On the right", "At the top", "On the left"], "The radiology convention: the patient's right on the screen's left, as if looking up from the feet."] },
    { a: 1, da: ["Hvad sker der, når du sænker dynamikområdet?", ["Billedet bliver blødere med flere grå toner", "Hårdere kontrast med færre grå toner", "Billedet bliver lysere"], "Færre dB fordeles på de grå toner, så svage ekkoer bliver sorte og stærke hvide."],
               en: ["What happens when you lower the dynamic range?", ["The image gets softer with more grey levels", "Harder contrast with fewer grey levels", "The image gets brighter"], "Fewer dB are spread over the grey levels, so weak echoes turn black and strong ones white."] },
    { a: 0, da: ["Billedet er grynet og støjfyldt overalt, også i galdeblæren. Hvad er sandsynligst?", ["For meget gain", "For lidt gain", "Forkert fokus"], "Gain forstærker også støjen. Galdeblæren skal være sort; skru ned, til den er det."],
               en: ["The image is grainy and noisy everywhere, even in the gallbladder. What is most likely?", ["Too much gain", "Too little gain", "Wrong focus"], "Gain amplifies the noise too. The gallbladder should be black; turn down until it is."] },
    { a: 2, da: ["Hvorfor skal du se en struktur i to plan?", ["Det er hurtigere", "For at få flere billeder pr. sekund", "Én skive kan snyde: form, størrelse og artefakter afsløres i det andet plan"], "En cyste kan ligne fast væv i ét plan, og en rund ting kan være et kar. Det andet plan afgør det."],
               en: ["Why should you look at a structure in two planes?", ["It is faster", "To get more frames per second", "One slice can deceive: shape, size and artefacts show in the other plane"], "A cyst can look solid in one plane, and a round thing can be a vessel. The other plane decides."] },
  ] },
  { n: "U5", path: "artefacts", da: "Artefakter i klinikken", en: "Artefacts in the clinic", qs: [
    { a: 0, da: ["Bag en lys struktur i galdeblæren er der en ren, sort skygge. Hvad er det sandsynligvis?", ["En galdesten", "En polyp", "Gas"], "En sten kaster det meste af lyden tilbage og dæmper resten: ren akustisk skygge. En polyp giver ingen skygge."],
               en: ["Behind a bright structure in the gallbladder there is a clean, black shadow. What is it most likely?", ["A gallstone", "A polyp", "Gas"], "A stone sends most of the sound back and attenuates the rest: clean acoustic shadowing. A polyp gives no shadow."] },
    { a: 2, da: ["Bag en rund, sort struktur er vævet lysere. Hvad fortæller det?", ["Den er fast", "Den indeholder gas", "Den indeholder væske (forstærkning)"], "Væske dæmper næsten ingen lyd, så der kommer mere lyd ned bag den. Det er et tegn på cyste."],
               en: ["Behind a round, black structure the tissue is brighter. What does that tell you?", ["It is solid", "It contains gas", "It contains fluid (enhancement)"], "Fluid hardly attenuates sound, so more sound reaches the tissue behind it. It is a sign of a cyst."] },
    { a: 1, da: ["Bag tarmgas ses lyse streger med lige store afstande. Hvad er det?", ["Tarmvæg", "Genlyd (reverberation)", "Spejlbillede"], "Ekkoet går frem og tilbage mellem gassen og proben og tegnes i 2, 3 og 4 gange gassens dybde."],
               en: ["Behind bowel gas there are bright lines at equal distances. What are they?", ["Bowel wall", "Reverberation", "Mirror image"], "The echo bounces between the gas and the probe and is drawn at 2, 3 and 4 times the depth of the gas."] },
    { a: 0, da: ["Leveren ses også over diafragma. Hvad betyder det?", ["Spejlbillede: lungen er luftfyldt, som den skal være", "Leveren ligger i brysthulen", "Pleuravæske"], "Diafragma med luft bagved virker som et spejl. Forsvinder spejlbilledet, kan der være væske i lungehulen."],
               en: ["The liver is also seen above the diaphragm. What does it mean?", ["Mirror image: the lung holds air, as it should", "The liver lies in the chest", "Pleural fluid"], "The diaphragm with air behind it acts as a mirror. If the mirror image disappears, there may be fluid in the pleural space."] },
    { a: 2, da: ["En sene ser mørk ud midt i forløbet. Hvad gør du, før du kalder det en skade?", ["Skruer op for gain", "Skifter til konveks probe", "Vipper proben, så strålen rammer senen vinkelret"], "Anisotropi: senens fibre giver kun stærkt ekko ved vinkelret indfald. Allerede 10° kan gøre den mørk."],
               en: ["A tendon looks dark in the middle. What do you do before calling it an injury?", ["Turn up the gain", "Switch to a curved probe", "Tilt the probe so the beam hits the tendon at right angles"], "Anisotropy: the tendon's fibres only give a strong echo when hit at right angles. Even 10° can make it dark."] },
    { a: 1, da: ["Galdeblæren har et svagt slør tæt på tarmgassen. Hvad kan fjerne det?", ["Mere gain", "Harmonisk billede", "Lavere frekvens"], "Sløret kommer fra sidelapper, der rammer gassen. Harmonisk billede har meget svagere sidelapper."],
               en: ["The gallbladder has a faint haze close to the bowel gas. What can remove it?", ["More gain", "Harmonic imaging", "A lower frequency"], "The haze comes from side lobes hitting the gas. Harmonic imaging has much weaker side lobes."] },
  ] },
  { n: "U6", path: "doppler", da: "Doppler og sikkerhed", en: "Doppler and safety", qs: [
    { a: 2, da: ["Hvad er den vigtigste ultralydstest for dyb venetrombose i lysken?", ["Farvedoppler", "Spektraldoppler", "Kompression: venen skal klappe helt sammen"], "En normal vene klapper sammen under tryk. Kan den ikke, tyder det på en trombe. Doppler er kun en hjælp."],
               en: ["What is the most important ultrasound test for deep vein thrombosis in the groin?", ["Colour Doppler", "Spectral Doppler", "Compression: the vein must collapse fully"], "A normal vein collapses under pressure. If it cannot, it suggests a thrombus. Doppler is only a help."] },
    { a: 0, da: ["Arterien er rød og venen blå. Du vender proben. Hvad sker der?", ["Farverne bytter plads", "Intet", "Begge bliver røde"], "Farven viser retningen mod eller væk fra proben, ikke om det er arterie eller vene."],
               en: ["The artery is red and the vein blue. You turn the probe round. What happens?", ["The colours swap", "Nothing", "Both turn red"], "The colour shows the direction towards or away from the probe, not whether it is an artery or a vein."] },
    { a: 1, da: ["Farven i arterien skifter midt i karret fra rød til blå med gult imellem. Hvad er det sandsynligvis?", ["Turbulens", "Aliasing: skalaen er for lav", "En trombe"], "Hastigheder over halvdelen af PRF vises i den forkerte retning. Hæv skalaen (PRF) eller flyt baselinen."],
               en: ["The colour in the artery changes mid-vessel from red to blue through yellow. What is it most likely?", ["Turbulence", "Aliasing: the scale is too low", "A thrombus"], "Speeds above half the PRF are shown in the wrong direction. Raise the scale (PRF) or move the baseline."] },
    { a: 2, da: ["Hvorfor skal dopplervinklen være under 60°?", ["Ellers bliver billedet mørkt", "Ellers kommer der aliasing", "Ellers bliver små vinkelfejl til store hastighedsfejl"], "Hastigheden regnes med cos(vinklen). Over 60° ændrer cos sig hurtigt, så en lille fejl i vinklen giver en stor fejl."],
               en: ["Why should the Doppler angle be below 60°?", ["Otherwise the image goes dark", "Otherwise there is aliasing", "Otherwise small angle errors become large speed errors"], "The speed is calculated with cos(angle). Above 60° cos changes fast, so a small error in the angle gives a large error."] },
    { a: 0, da: ["Hvornår er der intet farvesignal, selv om der er flow?", ["Når strålen står vinkelret på karret", "Når PRF er lav", "Når gain er høj"], "Ved 90° er der ingen bevægelse mod eller væk fra proben, så intet dopplerskift. Vip strålen (steer) eller proben."],
               en: ["When is there no colour signal although there is flow?", ["When the beam is at right angles to the vessel", "When the PRF is low", "When the gain is high"], "At 90° there is no movement towards or away from the probe, so no Doppler shift. Steer the beam or tilt the probe."] },
    { a: 1, da: ["Hvad betyder ALARA i praksis?", ["Brug altid højeste effekt for bedste billede", "Hold TI og MI lave og skan ikke længere end nødvendigt", "Undgå doppler helt"], "As low as reasonably achievable: så lidt energi og tid som muligt for at få svaret. Især ved fostre og øjne."],
               en: ["What does ALARA mean in practice?", ["Always use the highest output for the best image", "Keep TI and MI low and do not scan longer than needed", "Avoid Doppler completely"], "As low as reasonably achievable: as little energy and time as possible to get the answer. Especially for foetuses and eyes."] },
  ] },
];

const TEXT = {
  da: { title: "Test dig selv | Ultralyd | Oliver Brage", skip: "Spring til indhold", eyebrow: "Ultralyd · selvtest", h1: "Test dig selv", back: "← Ultralyd",
        lead: "Seks spørgsmål pr. emne, i klinisk sprog. Vælg et svar, og læs forklaringen. Intet bliver gemt eller sendt; genindlæs siden for at starte forfra.",
        all: "Alle", score: (r, n, t) => `${r} rigtige af ${n} besvarede (${t} i alt)`, restart: "Start forfra", right: "Rigtigt.", wrong: "Ikke helt.",
        open: "Til emnet →", rights: "Alle rettigheder forbeholdes.", privacy: "Privatliv", profile: "Profil", projects: "Projekter", learn: "Læring" },
  en: { title: "Test yourself | Ultrasound | Oliver Brage", skip: "Skip to content", eyebrow: "Ultrasound · self-test", h1: "Test yourself", back: "← Ultrasound",
        lead: "Six questions per topic, in clinical language. Choose an answer and read the explanation. Nothing is saved or sent; reload the page to start over.",
        all: "All", score: (r, n, t) => `${r} right of ${n} answered (${t} in all)`, restart: "Start over", right: "Right.", wrong: "Not quite.",
        open: "To the topic →", rights: "All rights reserved.", privacy: "Privacy", profile: "Profile", projects: "Projects", learn: "Learn" },
};

let LANG = "da", ONLY = "";
let ANS = {};                                   // "U1-0" -> chosen option, in memory only
const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function drawQuiz() {
  const t = TEXT[LANG];
  $("quiz").innerHTML = QUIZ.filter(g => !ONLY || g.n === ONLY).map(g =>
    `<div class="gl-group"><h3><small>${g.n}</small>${g[LANG]} · <a href="../${g.path}/?lang=${LANG}">${t.open}</a></h3>` +
    g.qs.map((q, i) => {
      const id = `${g.n}-${i}`, [text, opts, why] = q[LANG], chosen = ANS[id];
      const done = chosen !== undefined;
      return `<div class="q"><h4><small>${i + 1}</small>${esc(text)}</h4><div class="opts">` +
        opts.map((o, k) => `<button class="opt${done && k === q.a ? " right" : ""}${done && k === chosen && k !== q.a ? " wrong" : ""}"` +
          ` data-id="${id}" data-k="${k}"${done ? " disabled" : ""}>${esc(o)}</button>`).join("") + `</div>` +
        (done ? `<p class="why"><b>${chosen === q.a ? t.right : t.wrong}</b> ${esc(why)}</p>` : "") + `</div>`;
    }).join("") + `</div>`).join("");
  $("quiz").querySelectorAll("button.opt").forEach(b => { b.onclick = () => { ANS[b.dataset.id] = +b.dataset.k; drawQuiz(); }; });
  drawScore();
}
function drawScore() {
  const t = TEXT[LANG], groups = QUIZ.filter(g => !ONLY || g.n === ONLY);
  let n = 0, r = 0, total = 0;
  for (const g of groups) g.qs.forEach((q, i) => { total++; const c = ANS[`${g.n}-${i}`]; if (c !== undefined) { n++; if (c === q.a) r++; } });
  $("score-text").textContent = t.score(r, n, total);
  $("restart").textContent = t.restart;
}
function drawChips() {
  const t = TEXT[LANG];
  $("chips").innerHTML = [["", t.all], ...QUIZ.map(g => [g.n, g.n])].map(([k, s]) =>
    `<button class="chip" data-k="${k}" aria-pressed="${ONLY === k}">${s}</button>`).join(" ");
  $("chips").querySelectorAll("button").forEach(b => { b.onclick = () => { ONLY = b.dataset.k; drawChips(); drawQuiz(); }; });
}
function apply(lang) {
  LANG = lang;
  const t = TEXT[lang];
  document.documentElement.lang = lang;
  document.title = t.title;
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t[el.dataset.t]; });
  document.querySelectorAll(".lang-switch button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  $("back").href = "../?lang=" + lang;
  drawChips(); drawQuiz();
  const q = new URLSearchParams(location.search); q.set("lang", lang);
  history.replaceState(null, "", "?" + q);
}
function pickLang() {
  const l = new URLSearchParams(location.search).get("lang");
  if (l === "da" || l === "en") return l;
  return (navigator.language || "").toLowerCase().startsWith("da") ? "da" : "en";
}
document.querySelectorAll(".lang-switch button").forEach(b => { b.onclick = () => apply(b.dataset.lang); });
$("restart").onclick = () => { ANS = {}; drawQuiz(); window.scrollTo(0, 0); };
{ const t = new URLSearchParams(location.search).get("topic"); if (QUIZ.some(g => g.n === t)) ONLY = t; }
apply(pickLang());
