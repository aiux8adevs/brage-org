// The X-ray tube page (videos 5a and 5b) and its simulator in three parts: the spectrum and filtration,
// the heel effect, and automatic exposure control. Language and level live in the address.
// The models, written out in the "How the models work" box:
//
//   spectrum     Kramers: (kV − E)/E photons per keV, through the anode itself (as 1 mm Al), 1 mm Al inherent,
//                added Al and Cu (NIST attenuation tables); tungsten K peaks at 59 and 67 keV above 69.5 kV
//   skin dose    Σ n·E·μen(water);  signal = Σ n·E after 20 cm of water;  contrast of 1 cm bone
//   heel         I(φ) = exp(−k / sin(θ − φ)), φ the ray's angle towards the anode, θ the anode angle,
//                k set so a 36 cm field at 100 cm with 12° is 45 % stronger at the cathode edge (Bushong)
//   AEC          the chosen chambers' mean reading; exposure stops when it reaches the set level;
//                the effect of kV comes from the spectrum model, through 10 cm of water

// ---- tables: mass attenuation (and energy absorption for water), cm²/g, NIST -------------------
const ETAB = [10, 15, 20, 30, 40, 50, 60, 80, 100, 150];
const TAB = {
  al: [[26.2, 7.96, 3.44, 1.13, 0.569, 0.368, 0.278, 0.202, 0.170, 0.138], 2.70],
  cu: [[215.9, 74.1, 33.8, 10.9, 4.86, 2.61, 1.59, 0.763, 0.458, 0.222], 8.96],
  water: [[5.33, 1.67, 0.810, 0.376, 0.268, 0.227, 0.206, 0.184, 0.171, 0.150], 1.0],
  bone: [[28.5, 9.03, 4.00, 1.33, 0.665, 0.424, 0.315, 0.223, 0.186, 0.148], 1.92],
};
const MUEN_W = [4.94, 1.37, 0.550, 0.156, 0.0695, 0.0422, 0.0319, 0.0260, 0.0255, 0.0276];
function logInterp(tab, e) {
  let i = 0; while (i < ETAB.length - 2 && e > ETAB[i + 1]) i++;
  const t = (Math.log(e) - Math.log(ETAB[i])) / (Math.log(ETAB[i + 1]) - Math.log(ETAB[i]));
  return Math.exp(Math.log(tab[i]) + t * (Math.log(tab[i + 1]) - Math.log(tab[i])));
}
const mu = (m, e) => logInterp(TAB[m][0], e) * TAB[m][1];      // per cm
const ES = Array.from({ length: 441 }, (_, i) => 10 + i * 0.25);
// everything that depends only on the energy is worked out once, so a slider move costs a few thousand multiplications
const MU_AL = ES.map(e => mu("al", e) / 10), MU_CU = ES.map(e => mu("cu", e) / 10);   // per mm
const MU_W = ES.map(e => mu("water", e)), MU_BW = ES.map(e => mu("bone", e) - mu("water", e));   // per cm
const E_MUEN = ES.map(e => e * logInterp(MUEN_W, e));           // energy absorbed per photon in a thin layer of water
const T20 = MU_W.map(m => Math.exp(-m * 20)), T10 = MU_W.map(m => Math.exp(-m * 10));
const PEAKS = ES.map(e => Math.exp(-(((e - 59.3) / 1.0) ** 2)) + 0.3 * Math.exp(-(((e - 67.2) / 1.0) ** 2)));
const INHERENT = 1.0;                                            // mm Al in the tube itself (glass, oil, window)
const SELF = 1.0;                                                // the anode's own absorption, as mm Al: photons start inside the tungsten
const K_EDGE = 69.5;                                             // keV: the binding energy of tungsten's K shell

function spectrum(kv, mas, alAdded, cu) {
  const al = SELF + INHERENT + alAdded;
  // the K peaks grow as (kV − 69.5)^1.63: about a tenth of the photons at 100 kV
  const a = kv > K_EDGE ? 0.0088 * (kv - K_EDGE) ** 1.63 : 0;
  return ES.map((e, i) => mas * (Math.max(kv - e, 0) / e + a * PEAKS[i]) * Math.exp(-MU_AL[i] * al - MU_CU[i] * cu));
}
function specModel(s) {
  const n = spectrum(s.kv, s.mas, s.al, s.cu);
  let N = 0, NE = 0, skin = 0, det = 0, detB = 0;
  for (let i = 0; i < ES.length; i++) {
    const v = n[i], e = ES[i]; N += v; NE += v * e;
    skin += v * E_MUEN[i];                                         // energy absorbed in the first layer: skin dose
    det += v * e * T20[i];                                         // through 20 cm of tissue
    detB += v * e * T20[i] * Math.exp(-MU_BW[i]);                  // 1 cm of bone instead of tissue
  }
  // HVL: the aluminium that halves the air kerma (weighted by E·μen, water as a stand-in for air); found by halving the interval
  const kerma = t => { let x = 0; for (let i = 0; i < ES.length; i++) x += n[i] * E_MUEN[i] * Math.exp(-MU_AL[i] * t); return x; };
  let lo = 0, hi = 20;
  for (let k = 0; k < 14; k++) { const mid = (lo + hi) / 2; if (kerma(mid) > skin / 2) lo = mid; else hi = mid; }
  return { n, mean: NE / N, skin, det, contrast: 1 - detB / det, hvl: (lo + hi) / 2 };
}
const SPEC_REF = specModel({ kv: 80, mas: 10, al: 1.5, cu: 0 });

// heel: rays at angle φ (degrees, + towards the anode) leave the anode through a path ∝ 1/sin(θ − φ)
const HEEL_K = 0.0127;
function heel(phi, theta) {
  const a = (theta - phi) * Math.PI / 180;
  return a <= 0 ? 0 : Math.exp(-HEEL_K / Math.sin(a));
}
const FEMUR = u => 18 - 7 * u;            // thigh thickness in cm along the femur, u = 0 at the hip, 1 at the knee
const TRACK = 5;                          // mm: the length of the strip on the anode that the electrons hit
function heelModel(s) {
  const half = s.len / 2, n = 81, xs = [], I = [], sig = [];
  for (let k = 0; k < n; k++) {
    const x = -half + (k / (n - 1)) * s.len;                         // cm along the field, + towards the anode
    const i = heel(Math.atan(x / s.sid) * 180 / Math.PI, s.theta);
    const u = s.hip === "cathode" ? k / (n - 1) : 1 - k / (n - 1);     // where on the femur this point is
    xs.push(x); I.push(i); sig.push(i * Math.exp(-0.2 * FEMUR(u)));
  }
  const c = heel(0, s.theta), rad = s.theta * Math.PI / 180;
  const hipSig = s.hip === "cathode" ? sig[0] : sig[n - 1], kneeSig = s.hip === "cathode" ? sig[n - 1] : sig[0];
  return { xs, I: I.map(v => v / c), sig, ratio: I[n - 1] > 0 ? I[0] / I[n - 1] : Infinity, cover: half < s.sid * Math.tan(rad),
           even: hipSig > 0 && kneeSig > 0 ? kneeSig / hipSig : Infinity,
           maxField: 2 * s.sid * Math.tan(rad), focus: TRACK * Math.sin(rad) };
}

// AEC: the PA chest of video 5b on a 96 × 120 grid
const NX = 96, NY = 120;
const CHAMBERS = { L: [0.3, 0.4], C: [0.5, 0.62], R: [0.7, 0.4] }, CW = 0.14, CH = 0.12;
function chest(shift, pros, field) {
  const t = new Float32Array(NX * NY);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const X = (i + 0.5) / NX, y = (j + 0.5) / NY, x = X - shift;
    let v = 3.0;
    const body = ((x - 0.5) / 0.44) ** 2 + ((y - 0.55) / 0.62) ** 4 < 1;
    if (body) v = 0.45;
    for (const cx of [0.3, 0.7]) if (((x - cx) / 0.16) ** 2 + ((y - 0.42) / 0.27) ** 2 < 1) v = 1.0;
    if (Math.abs(x - 0.5) < 0.07 && body) v = 0.28;
    if (((x - 0.55) / 0.13) ** 2 + ((y - 0.62) / 0.12) ** 2 < 1) v = 0.3;
    if (pros && ((x - 0.7) / 0.065) ** 2 + ((y - 0.4) / 0.1) ** 2 < 1) v = 0.02;
    if (Math.abs(X - 0.5) > field / 2) v = 0;                          // outside the field: no radiation
    t[j * NX + i] = v;
  }
  return t;
}
function reading(t, name) {
  const [cx, cy] = CHAMBERS[name]; let s = 0, k = 0;
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const x = (i + 0.5) / NX, y = (j + 0.5) / NY;
    if (Math.abs(x - cx) < CW / 2 && Math.abs(y - cy) < CH / 2) { s += t[j * NX + i]; k++; }
  }
  return s / k;
}
// what a change of kV does, taken from the spectrum model with 2.5 mm Al: the radiation that gets through
// 10 cm of water (a chest is mostly air) and the skin dose, both per mAs and relative to 110 kV
const KV_CACHE = {};
function kvFactor(kv) {
  if (!KV_CACHE[kv]) {
    const q = v => { const n = spectrum(v, 1, 1.5, 0); let d = 0, s = 0; for (let i = 0; i < ES.length; i++) { d += n[i] * ES[i] * T10[i]; s += n[i] * E_MUEN[i]; } return [d, s]; };
    const [d, s] = q(kv), [d0, s0] = q(110);
    KV_CACHE[kv] = { rate: d / d0, skin: s / s0 };
  }
  return KV_CACHE[kv];
}
const STEP = 0.2, BACKUP = 6;                                          // 20 % per dose step in the model; backup at 6 × the normal time
function aecModel(s) {
  const t = chest(s.shift / 100, s.pros === "on", s.field / 100);
  const { rate, skin } = kvFactor(s.kv);
  const chosen = ["L", "C", "R"].filter(c => s[c] === "on");
  const level = (1 + STEP) ** s.dens;
  const raw = Object.fromEntries(["L", "C", "R"].map(c => [c, reading(t, c)]));
  const read = chosen.length ? chosen.reduce((a, c) => a + raw[c], 0) / chosen.length * rate : 0;
  const limit = BACKUP / rate;                                         // the backup follows the expected time at this kV
  const time = chosen.length ? Math.min(limit, level / Math.max(read, 1e-6)) : limit;   // relative to the right setting at 110 kV
  const lungDose = time * rate;                                        // radiation at the detector under the lungs
  return { t, chosen, time, level, backup: time >= limit - 1e-9, mas: 2.5 * time, rex: 250 * lungDose,
           patient: time * skin,                                       // entrance (skin) dose, relative to the right setting at 110 kV
           got: Object.fromEntries(["L", "C", "R"].map(c => [c, raw[c] * rate * time])) };
}

const T = {
  da: {
    title: "Røntgenrøret", sub: "Strålen før patienten: røret, spektret, heel-effekten, filtrering og automatisk eksponering. Simulatoren er klar; to videoer er på vej.",
    grund: "Grund", deep: "Fordybelse", back: "← Læring",
    parts: ["5a Røret og strålen", "5b Automatisk eksponering"],
    partNote: "Se de to dele i rækkefølge. Hver del er cirka fem til ni minutter.",
    simTitle: "Simulator: Røntgenrøret",
    modes: { spec: "Spektrum og filter", heel: "Heel-effekt", aec: "AEC" },
    head: { spec: ["Røntgenspektret", "Dosis, signal og kontrast"], heel: ["Røret og feltet", "Det detektoren får langs lårbenet"],
            aec: ["Thorax PA i stativet", "Ionkamrene"] },
    note: {
      spec: ["Kurven viser, hvor mange fotoner strålen har ved hver energi. Den grå kurve er udgangspunktet (80 kV, 10 mAs, 2,5 mm Al i alt). Kurven slutter ved den energi, der svarer til kV. De smalle toppe er wolframs karakteristiske stråling; de findes kun over 69,5 kV, og ved høj kV rager de ud over grafen. De stiplede streger er middelenergien.",
             "Søjlerne sammenligner med udgangspunktet (×1). Huddosis er den energi, strålen afsætter i huden. Signal er det, der når detektoren gennem 20 cm væv. Kontrast er forskellen mellem 1 cm knogle og væv."],
      heel: ["Røret set fra siden: elektronerne går fra katoden til anodens skrå flade, og strålen går nedad. Mod anodesiden skal fotonerne gennem mere af anoden, så strålen er svagere dér. Kurven nederst viser strålens styrke hen over feltet, i procent af centralstrålen. Bliver feltet for stort til anodevinklen, bliver et område rødt: dér skærer anoden strålen helt af. Tegningen er trukket ud i bredden, så vinklerne kan ses.",
             "Lårbenet er tykt ved hoften og tyndt ved knæet. Den grå kurve er strålen før patienten, den cyan det, der når detektoren. Hver kurve er skaleret til sin egen top. Jo fladere den cyan kurve er, jo jævnere bliver billedet."],
      aec: ["Billedet skaleres som på et DR-anlæg, så det er lige lyst uanset dosis; kun støjen ændrer sig. Firkanterne er ionkamrene: de orange er valgt. Venstre og højre er som i billedet. Den cyan ramme er feltet (indblændingen).",
            "Søjlerne viser, hvor meget stråling hvert kammer havde fået, da eksponeringen stoppede, i procent af stopniveauet. Den stiplede streg er det niveau, anlægget stopper ved. Kun de valgte kamre (orange) tæller med."],
    },
    tasks: "Opgaver", answer: "Vis svar", of: "af", prev: "Forrige opgave", next: "Næste opgave",
    model: "Sådan virker modellerne", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
    seen: "Det kan du se:", pin: "Gem tallene", unpin: "Fjern de gemte", saved: "gemt",
    see: {
      specBase: "Udgangspunktet: 80 kV, 10 mAs og 2,5 mm Al i alt.",
      noK: "Ingen karakteristiske toppe: kV er under 69,5.",
      soft: "Under 2,5 mm Al i alt: mange svage fotoner ender i huden.",
      effLow: "Huddosis pr. signal er {e} gange udgangspunktet: mindre dosis for det samme billede.",
      effHigh: "Huddosis pr. signal er {e} gange udgangspunktet: mere dosis for det samme billede.",
      weak: "Signalet er under det halve. Uden flere mAs får billedet mere støj.",
      cut: "Anoden skærer strålen af. Mindre felt, længere afstand eller større anodevinkel hjælper.",
      edge: "Feltet når helt ud til anodens grænse. Ved anodekanten er strålen næsten væk.",
      even: "Strålen er næsten jævn hen over feltet.",
      heel: "Strålen er {p} % stærkere ved katodekanten end ved anodekanten.",
      hipAnode: "Den tykke hofte får den svage ende af strålen.",
      hipCathode: "Den tykke hofte får den stærke ende af strålen.",
      none: "Intet kammer er valgt, så kun back-up-tiden stopper eksponeringen.",
      backup: "Kamrene fik aldrig nok. Back-up-tiden stoppede eksponeringen.",
      over: "Patienten får {x} gange den rigtige dosis, men billedet ser normalt ud. Kun REX afslører det.",
      under: "Eksponeringen stoppede for tidligt: mere støj i billedet.",
      aecOk: "De valgte kamre måler det rigtige, og anlægget stopper i rette tid.",
      kvHigh: "Højere kV: færre mAs og lidt lavere patientdosis, men mindre kontrast.",
      kvLow: "Lavere kV: flere mAs og højere patientdosis for samme dosis til detektoren.",
    },
    ctl: { mode: "Del", kv: "Kilovolt", kvA: "Kilovolt", mas: "mAs", al: "Tilføjet aluminium", cu: "Kobberfilter", theta: "Anodevinkel", sid: "Afstand fokus–detektor (SID)",
           len: "Feltlængde langs røret", hip: "Hoften vender mod", cathode: "katoden", anode: "anoden",
           ch: "Ionkamre", L: "Venstre", C: "Midt", R: "Højre", on: "Til", off: "Fra", field: "Feltbredde", shift: "Patienten forskudt",
           pros: "Metal over højre kammer", dens: "Dosisniveau (trin)", reset: "Nulstil" },
    help: { kv: "Spændingen. Den bestemmer fotonernes højeste energi.", mas: "Antallet af elektroner, og dermed af fotoner.",
            al: "Lægges oven i 1 mm egenfiltrering i røret.", cu: "Et ekstra filter, som kan slås til og fra.",
            theta: "Vinklen på anodens skrå flade.", sid: "Længere afstand: feltet bruger en mindre del af strålen.",
            len: "Feltets længde i retningen katode–anode.", hip: "Reglen: den tykke ende under katoden.",
            ch: "Vælg de kamre, der ligger under det, du vil se.", kvA: "Du vælger kV. AEC bestemmer mAs.",
            field: "Feltets bredde i procent af detektoren.", shift: "Hvor langt patienten står fra midten af detektoren.",
            pros: "For eksempel en protese. Metal stopper strålen.", dens: "Hvert trin flytter stopniveauet 20 %." },
    k: { mean: "Middelenergi", hvl: "Halvværdilag (HVL)", skin: "Huddosis", det: "Signal ved detektoren", con: "Knoglekontrast", eff: "Huddosis pr. signal",
         ratio: "Katodekant / anodekant", cover: "Største felt", even: "Signal knæ / hofte", focus: "Effektivt fokus",
         mas: "mAs", rex: "REX", pat: "Patientdosis", time: "Stoppet af" },
    f: { mean: "gennemsnitlig fotonenergi", hvl: "aluminium, der halverer strålen", rel: "i forhold til udgangspunktet",
         con: "1 cm knogle mod væv", eff: "lavere er bedre", ratio: "strålens styrke ved kanterne", cover: c => c ? "anoden dækker feltet" : "anoden skærer af",
         even: "tættere på 1 er jævnere", focus: "linjefokus: 5 mm · sin(vinkel)", mas: "2,5 mAs er rigtigt ved 110 kV",
         rex: r => r < 125 ? "for lidt: støj" : r <= 400 ? "i orden" : "for meget dosis",
         pat: "i forhold til rigtig indstilling", time: b => b ? "kamrene fik aldrig nok" : "kamrene havde fået nok", aec: "AEC", backup: "Back-up" },
    lbl: { energy: "energi (keV)", count: "antal fotoner", ref: "udgangspunkt", now: "nu", saved: "gemt", mean: "middel", cathode: "katode", anode: "anode",
           cside: "katodeside", aside: "anodeside", hip: "hofte", knee: "knæ", electrons: "elektroner",
           cutoff: "afskåret", before: "før patienten", after: "til detektoren", enough: "stop", skin: "huddosis", det: "signal", con: "kontrast",
           ch: { L: "V", C: "M", R: "H" } },
    dec: ",",
    modelText: `<p><b>Spektret.</b> Bremsestråling efter Kramers: $(kV - E)/E$ fotoner pr. keV. Over 69,5 kV lægges wolframs K-toppe ved 59 og 67 keV til. De vokser som $(kV - 69{,}5)^{1{,}63}$ og udgør cirka 10 % af fotonerne ved 100 kV. Strålen dæmpes af anoden selv (regnet som 1 mm aluminium), 1 mm aluminium i røret (egenfiltrering), det tilføjede aluminium og kobberet: $e^{-\\mu(E) \\cdot x}$ med dæmpningskoefficienter fra NIST.</p>
<p>Huddosis er den energi, strålen afsætter i det første lag vand, uden tilbagespredning. Signal er energien i den primære stråle efter 20 cm vand; spredt stråling og detektorens følsomhed er ikke med. Knoglekontrast er, hvor meget 1 cm knogle i stedet for væv sænker signalet. HVL er den tykkelse aluminium, der halverer luftkermaen (dosis i luft, her regnet med vand i stedet for luft). Op til 80 kV passer HVL med standardstrålerne; over 100 kV er modellens HVL lidt for lav. Alle tal er relative: simulatoren regner ikke dosis i mGy.</p>
<p><b>Heel-effekten.</b> En foton, der går i vinklen $\\varphi$ mod anodesiden, skal gennem anoden ad en vej, der er proportional med $1/\\sin(\\theta - \\varphi)$, hvor $\\theta$ er anodevinklen. Styrken er $e^{-k/\\sin(\\theta-\\varphi)}$, med $k$ sat, så et felt på 36 cm ved 100 cm og 12° er 45 % stærkere ved katodekanten end ved anodekanten (Bushong). Når $\\varphi \\ge \\theta$, skærer anoden strålen af, så det største felt er $2 \\cdot SID \\cdot \\tan\\theta$. I praksis er det brugbare felt lidt mindre. At strålen også bliver svagere mod begge kanter, fordi afstanden til fokus er længere dér, er ikke med. Effektivt fokus er $5\\ \\text{mm} \\cdot \\sin\\theta$ (linjefokusprincippet). Lårbenet er 18 cm tykt ved hoften og 11 cm ved knæet, med $\\mu$ = 0,2 pr. cm.</p>
<p><b>AEC.</b> Thorax PA med lunger (transmission 1), rygsøjle og hjerte (cirka 0,3), bløddele (0,45), metal (0,02) og fri stråling ved siden af patienten (3). Hvert kammer måler gennemsnittet under sig. Eksponeringen stopper, når de valgte kamres gennemsnit når niveauet, eller ved back-up-tiden (6 gange den normale tid). Hvert dosistrin er 20 % i modellen; tjek, hvad jeres anlæg bruger. Hvad kV betyder, er regnet med spektrummodellen: strålingen gennem 10 cm vand bestemmer mAs, og huddosis bestemmer patientdosis. REX er 250 ved rigtig indstilling og følger dosis til detektoren under lungerne. Billedet har kvantestøj og skaleres som på et DR-anlæg.</p>
<p>Kilder: Bushong, Radiologic Science for Technologists (spektret, heel-effekten, linjefokus, filtrering, 15 %-reglen, AEC). Dæmpningskoefficienter: NIST, X-Ray Mass Attenuation Coefficients (Hubbell og Seltzer). Kramers' lov for bremsestrålingens spektrum (1923).</p>`,
    groups: [
      ["Spektret", [
        ["Højere kV", "Gå fra 80 til 100 kV. Hvad sker der med spektret og middelenergien?", "Kurven bliver både højere og bredere: der kommer flere fotoner, og de stærkeste har mere energi. Middelenergien stiger fra 43 til 49 keV."],
        ["Højeste energi", "Sæt 100 kV. Ved hvilken energi slutter kurven? Sammenlign med middelenergien.", "Kurven slutter ved 100 keV: en foton kan højst få hele elektronens energi. Men der er meget få fotoner deroppe. Middelenergien er kun cirka 49 keV, omkring det halve."],
        ["Karakteristisk stråling", "Skru kV ned fra 80 til 65. Hvad sker der med de smalle toppe? Hvorfor?", "De forsvinder under 69,5 kV, fordi elektronerne ikke længere har energi nok til at slå en K-elektron løs i wolfram. Toppene flytter sig aldrig; de ligger fast ved 59 og 67 keV."],
        ["Flere mAs", "Fordobl mAs. Hvad ændrer sig, og hvad gør ikke?", "Kurven bliver dobbelt så høj, men har samme form. Middelenergi og kontrast er de samme; huddosis og signal fordobles."],
        ["15 %-reglen", "Gå fra 80 til 92 kV (15 % mere), og halvér mAs til 5. Hvad sker der med signal, huddosis og kontrast?", "Signalet er næsten det samme (×1,06), men huddosis falder til cirka ×0,70. Prisen er lavere knoglekontrast: fra 39 til 34 %."],
      ], "spec"],
      ["Filtrering", [
        ["Ingen tilføjet filtrering", "Sæt det tilføjede aluminium til 0. Hvad sker der med huddosis og signal?", "Huddosis bliver cirka 1,8 gange så stor, mens signalet kun stiger til cirka 1,15. De svage fotoner giver dosis til huden, men når ikke detektoren."],
        ["Hvilke fotoner fjerner filteret?", "Skift mellem 0 og 5 mm tilføjet aluminium, og hold øje med kurven. Hvilken side af kurven ændrer sig mest?", "Venstre side. Under 30 keV forsvinder næsten alt, mens kurven over 60 keV kun ændres lidt. Toppen flytter mod højre, og middelenergien stiger fra 40 til 48 keV: strålen bliver hårdere."],
        ["Kobber", "Nulstil, og slå 0,1 mm kobber til. Hvad vinder du, og hvad koster det?", "Huddosis halveres (×0,50), mens signalet kun falder til ×0,82. Prisen er, at mAs skal lidt op, og at kontrasten falder en smule (fra 39 til 37 %)."],
        ["Samme billede, mindre dosis", "Slå 0,2 mm kobber til, og skru mAs op, til signalet igen er cirka ×1. Hvad er huddosis nu?", "Det kræver 14 til 15 mAs. Huddosis er stadig under det halve af udgangspunktet (cirka ×0,45). Filteret koster altså mAs, men sparer dosis til huden."],
        ["HVL", "Hvad er HVL ved udgangspunktet? Hvad sker der ved 120 kV, og med 0,2 mm kobber ved 80 kV?", "Cirka 2,9 mm Al ved udgangspunktet, 4,3 mm ved 120 kV og 5,5 mm med 0,2 mm kobber. Både højere kV og mere filtrering gør strålen hårdere og HVL større.", { deep: 1 }],
      ], "spec"],
      ["Heel-effekt", [
        ["Hvor stor?", "Se på udgangspunktet: 12°, 100 cm, 36 cm felt. Hvor meget stærkere er strålen ved katodekanten end ved anodekanten?", "Cirka 1,45 gange, altså 45 % stærkere, som Bushong beskriver. Kurven viser 103 % ved katodekanten og 71 % ved anodekanten."],
        ["Vend lårbenet", "Vend hoften mod anoden. Hvad sker der med forholdet mellem signalet ved knæet og ved hoften?", "Det stiger fra 2,8 til 5,9: den tykke hofte får nu den svageste del af strålen. Med hoften mod katoden udligner heel-effekten noget af forskellen i tykkelse."],
        ["Lille felt eller lang afstand", "Sæt feltet ned til 20 cm. Nulstil, og prøv så 36 cm felt ved 180 cm SID. Hvad sker der?", "Heel-effekten bliver meget mindre i begge tilfælde (×1,08): feltet bruger kun den midterste del af strålen, hvor den er jævn."],
        ["Anodevinklen", "Sæt anodevinklen til 16°. Hvad sker der med heel-effekten? Prøv så 10°.", "Ved 16° er forskellen kun ×1,10. Ved 10° kan anoden højst dække 35 cm ved 100 cm, så kanten af feltet på 36 cm bliver skåret af. Længere afstand eller mindre felt hjælper."],
        ["Linjefokus", "Hold øje med Effektivt fokus, mens du ændrer anodevinklen. Hvorfor vælger man ikke bare altid en stor vinkel?", "Effektivt fokus vokser fra 0,6 mm ved 7° til 1,5 mm ved 17°. En lille vinkel giver et lille fokus og et skarpere billede, men stærkere heel-effekt og et mindre felt. Anodevinklen er et kompromis.", { deep: 1 }],
      ], "heel"],
      ["AEC", [
        ["Midterkammeret", "Slå sidekamrene fra og midterkammeret til. Hvad sker der med mAs, REX og billedet?", "Midterkammeret ligger over rygsøjlen, hvor kun cirka 30 % kommer igennem. Anlægget bliver ved: mAs og REX bliver cirka 3,3 gange så høje. Billedet ser lige lyst ud."],
        ["Forskudt patient", "Nulstil, og sæt patientforskydningen til 18 %. Hvad måler kamrene nu?", "Det ene sidekammer ligger nu over rygsøjlen og bløddele og får for lidt. Eksponeringen bliver cirka 1,65 gange for lang, og REX stiger til cirka 410."],
        ["For tidligt stop", "Sæt patientforskydningen til 25 %. Nu stopper anlægget for tidligt. Hvorfor?", "Det ene sidekammer ligger delvis uden for patienten, i den frie stråling, og får hurtigt nok. Eksponeringen stopper efter 0,8 af den rigtige tid, REX falder til cirka 205, og billedet får mere støj."],
        ["Metal", "Nulstil, og slå metal over højre kammer til. Hvad sker der? Hvad kan du gøre?", "Metallet stopper strålen over højre kammer, så eksponeringen bliver cirka 1,7 gange for lang. Vælg kun venstre kammer, eller indstil manuelt."],
        ["For lille felt", "Nulstil, og sæt feltbredden til 30 %. Hvad sker der?", "Sidekamrene ligger uden for feltet og får næsten ingen stråling. Eksponeringen fortsætter til back-up-tiden, og REX bliver alt for høj (1500)."],
        ["Dosistrin", "Nulstil, og sæt dosisniveauet til +2. Hvad sker der med mAs og REX?", "Begge stiger med 44 % (1,2 × 1,2 = 1,44). Kamrene måler stadig; de stopper bare ved et højere niveau."],
        ["kV og AEC", "Gå fra 110 til 125 kV med de rigtige kamre. Hvad sker der med mAs og patientdosis?", "mAs falder fra 2,5 til 1,6, fordi flere fotoner når kamrene, og patientdosis falder cirka 16 %. Prisen er lavere kontrast, som i spektrum-delen.", { deep: 1 }],
      ], "aec"],
      ["Formler", [
        ["Dæmpning i filteret", "Et filter dæmper strålen efter $$I = I_0 \\cdot e^{-\\mu \\cdot x}$$ For aluminium er $\\mu$ cirka 3,05 pr. cm ved 30 keV og 0,75 pr. cm ved 60 keV. Hvor stor en del kommer gennem 2,5 mm (0,25 cm) ved de to energier?",
         "$e^{-3{,}05 \\cdot 0{,}25} \\approx 0{,}47$ og $e^{-0{,}75 \\cdot 0{,}25} \\approx 0{,}83$. Filteret fjerner over halvdelen af fotonerne ved 30 keV, men kun en sjettedel ved 60 keV. Derfor bliver strålen hårdere.", { deep: 1, mode: "spec" }],
        ["HVL i hånden", "Efter tykkelsen $x$ er der $$I = I_0 \\cdot 0{,}5^{x/HVL}$$ tilbage. HVL er 2,9 mm ved udgangspunktet. Hvor meget er der tilbage efter 2,9 mm og efter 5,8 mm aluminium? Tjek det første tal: læg 3 mm aluminium til, og se på huddosis.",
         "50 % og 25 %. Simulatoren viser ×0,49 efter 3 mm. I virkeligheden bliver der lidt mere end 25 % tilbage efter 5,8 mm, fordi strålen er blevet hårdere undervejs: HVL er steget til 4,2 mm.", { deep: 1, mode: "spec" }],
        ["Mindste bølgelængde", "Den højeste fotonenergi i keV er lig med kV. Den svarer til den mindste bølgelængde: $$\\lambda_{min} = \\frac{1{,}24}{kV}\\ \\text{nm}$$ Regn $\\lambda_{min}$ ud for 80 og 124 kV.",
         "$\\frac{1{,}24}{80} \\approx 0{,}0155$ nm og $\\frac{1{,}24}{124} = 0{,}01$ nm. Højere kV giver kortere bølgelængde, altså mere energirige fotoner.", { deep: 1, mode: "spec" }],
        ["Største felt", "Anoden kan højst dække feltet $$L_{max} = 2 \\cdot SID \\cdot \\tan\\theta$$ Regn $L_{max}$ ud for 12° og 100 cm, og tjek tallet i simulatoren. Hvad med 180 cm?",
         "$2 \\cdot 100 \\cdot \\tan 12° \\approx 42{,}5$ cm. Ved 180 cm er det $2 \\cdot 180 \\cdot 0{,}213 \\approx 76{,}5$ cm. Derfor hjælper længere afstand mod afskæring.", { deep: 1, mode: "heel" }],
        ["Linjefokus i hånden", "Det effektive fokus er $$f_{eff} = f \\cdot \\sin\\theta$$ hvor $f$ er længden af den strimmel, elektronerne rammer (5 mm i modellen). Regn $f_{eff}$ ud for 12° og 7°.",
         "$5 \\cdot \\sin 12° \\approx 1{,}04$ mm og $5 \\cdot \\sin 7° \\approx 0{,}61$ mm. Varmen fordeles på 5 mm, men detektoren ser et fokus på cirka 1 mm.", { deep: 1, mode: "heel" }],
        ["Dosistrin i hånden", "Med 20 % pr. trin er $$\\text{mAs} = 2{,}5 \\cdot 1{,}2^{n}$$ Regn mAs ud for $n = 3$ og $n = -3$, og tjek i simulatoren.",
         "$2{,}5 \\cdot 1{,}2^{3} \\approx 4{,}3$ og $2{,}5 \\cdot 1{,}2^{-3} \\approx 1{,}4$. Tre trin op er altså 73 % mere, ikke 60 %, fordi trinene ganges sammen.", { deep: 1, mode: "aec" }],
      ], "spec"],
    ],
  },
  en: {
    title: "The X-ray tube", sub: "The beam before the patient: the tube, the spectrum, the heel effect, filtration and automatic exposure control. The simulator is ready; two videos are on the way.",
    grund: "Basic", deep: "Deeper level", back: "← Learn",
    parts: ["5a The tube and the beam", "5b Automatic exposure control"],
    partNote: "Watch the two parts in order. Each is about five to nine minutes.",
    simTitle: "Simulator: The X-ray tube",
    modes: { spec: "Spectrum and filter", heel: "Heel effect", aec: "AEC" },
    head: { spec: ["The X-ray spectrum", "Dose, signal and contrast"], heel: ["The tube and the field", "What the detector gets along the femur"],
            aec: ["PA chest on the stand", "The chambers"] },
    note: {
      spec: ["The curve shows how many photons the beam has at each energy. The grey curve is the starting point (80 kV, 10 mAs, 2.5 mm Al in total). The curve ends at the energy that matches the kV. The narrow peaks are tungsten's characteristic radiation; they exist only above 69.5 kV, and at high kV they run off the top of the graph. The dashed lines are the mean energy.",
             "The bars compare with the starting point (×1). Skin dose is the energy the beam deposits in the skin. Signal is what reaches the detector through 20 cm of tissue. Contrast is the difference between 1 cm of bone and tissue."],
      heel: ["The tube seen from the side: the electrons go from the cathode to the sloping face of the anode, and the beam goes downwards. Towards the anode side the photons have to pass through more of the anode, so the beam is weaker there. The curve at the bottom shows the strength of the beam across the field, as a percentage of the central ray. If the field gets too large for the anode angle, an area turns red: there the anode cuts the beam off completely. The drawing is stretched sideways so the angles can be seen.",
             "The femur is thick at the hip and thin at the knee. The grey curve is the beam before the patient, the cyan curve what reaches the detector. Each curve is scaled to its own peak. The flatter the cyan curve, the more even the image."],
      aec: ["The image is rescaled as on a DR system, so it is equally bright whatever the dose; only the noise changes. The squares are the chambers: the orange ones are chosen. Left and right are as in the image. The cyan frame is the field (the collimation).",
            "The bars show how much radiation each chamber had received when the exposure stopped, as a percentage of the stop level. The dashed line is the level the system stops at. Only the chosen chambers (orange) count."],
    },
    tasks: "Tasks", answer: "Show answer", of: "of", prev: "Previous task", next: "Next task",
    model: "How the models work", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
    seen: "What you can see:", pin: "Save the numbers", unpin: "Remove saved", saved: "saved",
    see: {
      specBase: "The starting point: 80 kV, 10 mAs and 2.5 mm Al in total.",
      noK: "No characteristic peaks: the kV is below 69.5.",
      soft: "Less than 2.5 mm Al in total: many weak photons end up in the skin.",
      effLow: "Skin dose per signal is {e} times the starting point: less dose for the same image.",
      effHigh: "Skin dose per signal is {e} times the starting point: more dose for the same image.",
      weak: "The signal is less than half. Without more mAs the image gets noisier.",
      cut: "The anode cuts the beam off. A smaller field, a longer distance or a larger anode angle helps.",
      edge: "The field reaches the limit of the anode. At the anode edge the beam is almost gone.",
      even: "The beam is almost even across the field.",
      heel: "The beam is {p} % stronger at the cathode edge than at the anode edge.",
      hipAnode: "The thick hip gets the weak end of the beam.",
      hipCathode: "The thick hip gets the strong end of the beam.",
      none: "No chamber is chosen, so only the backup time stops the exposure.",
      backup: "The chambers never got enough. The backup time stopped the exposure.",
      over: "The patient gets {x} times the right dose, but the image looks normal. Only REX reveals it.",
      under: "The exposure stopped too early: more noise in the image.",
      aecOk: "The chosen chambers measure the right thing, and the system stops at the right time.",
      kvHigh: "Higher kV: fewer mAs and a slightly lower patient dose, but less contrast.",
      kvLow: "Lower kV: more mAs and a higher patient dose for the same dose to the detector.",
    },
    ctl: { mode: "Part", kv: "Kilovoltage", kvA: "Kilovoltage", mas: "mAs", al: "Added aluminium", cu: "Copper filter", theta: "Anode angle", sid: "Source-to-image distance (SID)",
           len: "Field length along the tube", hip: "The hip faces the", cathode: "cathode", anode: "anode",
           ch: "Chambers", L: "Left", C: "Middle", R: "Right", on: "On", off: "Off", field: "Field width", shift: "Patient off centre",
           pros: "Metal over the right chamber", dens: "Dose level (steps)", reset: "Reset" },
    help: { kv: "The voltage. It sets the highest photon energy.", mas: "The number of electrons, and so of photons.",
            al: "Added on top of 1 mm inherent filtration in the tube.", cu: "An extra filter that can be switched on and off.",
            theta: "The angle of the anode's sloping face.", sid: "A longer distance: the field uses a smaller part of the beam.",
            len: "The length of the field in the cathode–anode direction.", hip: "The rule: the thick end under the cathode.",
            ch: "Choose the chambers that lie under what you want to see.", kvA: "You choose the kV. The AEC sets the mAs.",
            field: "The width of the field as a percentage of the detector.", shift: "How far the patient stands from the middle of the detector.",
            pros: "A prosthesis, for example. Metal stops the beam.", dens: "Each step moves the stop level by 20 %." },
    k: { mean: "Mean energy", hvl: "Half-value layer (HVL)", skin: "Skin dose", det: "Signal at the detector", con: "Bone contrast", eff: "Skin dose per signal",
         ratio: "Cathode edge / anode edge", cover: "Largest field", even: "Signal knee / hip", focus: "Effective focal spot",
         mas: "mAs", rex: "REX", pat: "Patient dose", time: "Stopped by" },
    f: { mean: "average photon energy", hvl: "aluminium that halves the beam", rel: "relative to the starting point",
         con: "1 cm of bone against tissue", eff: "lower is better", ratio: "beam strength at the edges", cover: c => c ? "the anode covers the field" : "the anode cuts off",
         even: "closer to 1 is more even", focus: "line focus: 5 mm · sin(angle)", mas: "2.5 mAs is right at 110 kV",
         rex: r => r < 125 ? "too little: noise" : r <= 400 ? "fine" : "dose too high",
         pat: "relative to the right setting", time: b => b ? "the chambers never got enough" : "the chambers had enough", aec: "AEC", backup: "Backup" },
    lbl: { energy: "energy (keV)", count: "number of photons", ref: "starting point", now: "now", saved: "saved", mean: "mean", cathode: "cathode", anode: "anode",
           cside: "cathode side", aside: "anode side", hip: "hip", knee: "knee", electrons: "electrons",
           cutoff: "cut off", before: "before the patient", after: "to the detector", enough: "stop", skin: "skin dose", det: "signal", con: "contrast",
           ch: { L: "L", C: "C", R: "R" } },
    dec: ".",
    modelText: `<p><b>The spectrum.</b> Bremsstrahlung after Kramers: $(kV - E)/E$ photons per keV. Above 69.5 kV, tungsten's K peaks at 59 and 67 keV are added. They grow as $(kV - 69.5)^{1.63}$ and make up about 10 % of the photons at 100 kV. The beam is attenuated by the anode itself (counted as 1 mm of aluminium), 1 mm of aluminium in the tube (inherent filtration), the added aluminium and the copper: $e^{-\\mu(E) \\cdot x}$ with attenuation coefficients from NIST.</p>
<p>Skin dose is the energy the beam deposits in the first layer of water, without backscatter. Signal is the energy of the primary beam after 20 cm of water; scatter and the detector's sensitivity are left out. Bone contrast is how much 1 cm of bone instead of tissue lowers the signal. HVL is the thickness of aluminium that halves the air kerma (the dose in air, here calculated with water instead of air). Up to 80 kV the HVL matches the standard beams; above 100 kV the model's HVL is a little low. All numbers are relative: the simulator does not calculate dose in mGy.</p>
<p><b>The heel effect.</b> A photon going at the angle $\\varphi$ towards the anode side has to pass through the anode along a path proportional to $1/\\sin(\\theta - \\varphi)$, where $\\theta$ is the anode angle. The strength is $e^{-k/\\sin(\\theta-\\varphi)}$, with $k$ set so a 36 cm field at 100 cm and 12° is 45 % stronger at the cathode edge than at the anode edge (Bushong). When $\\varphi \\ge \\theta$, the anode cuts the beam off, so the largest field is $2 \\cdot SID \\cdot \\tan\\theta$. In practice the usable field is a little smaller. That the beam also gets weaker towards both edges, because the distance to the focal spot is longer there, is left out. The effective focal spot is $5\\ \\text{mm} \\cdot \\sin\\theta$ (the line-focus principle). The femur is 18 cm thick at the hip and 11 cm at the knee, with $\\mu$ = 0.2 per cm.</p>
<p><b>AEC.</b> A PA chest with lungs (transmission 1), spine and heart (about 0.3), soft tissue (0.45), metal (0.02) and the open beam beside the patient (3). Each chamber measures the average under it. The exposure stops when the chosen chambers' average reaches the level, or at the backup time (6 times the normal time). Each dose step is 20 % in the model; check what your system uses. The effect of kV is calculated with the spectrum model: the radiation through 10 cm of water sets the mAs, and the skin dose sets the patient dose. REX is 250 at the right setting and follows the dose to the detector under the lungs. The image has quantum noise and is rescaled as on a DR system.</p>
<p>Sources: Bushong, Radiologic Science for Technologists (the spectrum, the heel effect, line focus, filtration, the 15 % rule, AEC). Attenuation coefficients: NIST, X-Ray Mass Attenuation Coefficients (Hubbell and Seltzer). Kramers' law for the bremsstrahlung spectrum (1923).</p>`,
    groups: [
      ["The spectrum", [
        ["Higher kV", "Go from 80 to 100 kV. What happens to the spectrum and the mean energy?", "The curve gets both taller and wider: there are more photons, and the strongest have more energy. The mean energy rises from 43 to 49 keV."],
        ["Highest energy", "Set 100 kV. At what energy does the curve end? Compare with the mean energy.", "The curve ends at 100 keV: a photon can at most get the whole energy of the electron. But there are very few photons up there. The mean energy is only about 49 keV, around half."],
        ["Characteristic radiation", "Turn the kV down from 80 to 65. What happens to the narrow peaks? Why?", "They disappear below 69.5 kV, because the electrons no longer have enough energy to knock a K electron loose in tungsten. The peaks never move; they stay at 59 and 67 keV."],
        ["More mAs", "Double the mAs. What changes, and what does not?", "The curve gets twice as tall but keeps its shape. Mean energy and contrast stay the same; skin dose and signal double."],
        ["The 15 % rule", "Go from 80 to 92 kV (15 % more), and halve the mAs to 5. What happens to the signal, the skin dose and the contrast?", "The signal is almost the same (×1.06), but the skin dose falls to about ×0.70. The price is lower bone contrast: from 39 to 34 %."],
      ], "spec"],
      ["Filtration", [
        ["No added filtration", "Set the added aluminium to 0. What happens to the skin dose and the signal?", "The skin dose rises by a factor of about 1.8, while the signal rises only to about 1.15. The weak photons give dose to the skin but do not reach the detector."],
        ["Which photons does the filter remove?", "Switch between 0 and 5 mm of added aluminium and watch the curve. Which side of the curve changes most?", "The left side. Below 30 keV almost everything disappears, while the curve above 60 keV changes only a little. The peak moves to the right, and the mean energy rises from 40 to 48 keV: the beam gets harder."],
        ["Copper", "Reset, and switch on 0.1 mm of copper. What do you gain, and what does it cost?", "The skin dose is halved (×0.50), while the signal falls only to ×0.82. The price is that the mAs must go up a little, and that the contrast drops slightly (from 39 to 37 %)."],
        ["Same image, less dose", "Switch on 0.2 mm of copper, and turn the mAs up until the signal is about ×1 again. What is the skin dose now?", "It takes 14 to 15 mAs. The skin dose is still less than half of the starting point (about ×0.45). So the filter costs mAs but saves dose to the skin."],
        ["HVL", "What is the HVL at the starting point? What happens at 120 kV, and with 0.2 mm of copper at 80 kV?", "About 2.9 mm Al at the starting point, 4.3 mm at 120 kV and 5.5 mm with 0.2 mm of copper. Both higher kV and more filtration make the beam harder and the HVL larger.", { deep: 1 }],
      ], "spec"],
      ["Heel effect", [
        ["How large?", "Look at the starting point: 12°, 100 cm, 36 cm field. How much stronger is the beam at the cathode edge than at the anode edge?", "About 1.45 times, so 45 % stronger, as Bushong describes. The curve shows 103 % at the cathode edge and 71 % at the anode edge."],
        ["Turn the femur", "Turn the hip towards the anode. What happens to the ratio between the signal at the knee and at the hip?", "It rises from 2.8 to 5.9: the thick hip now gets the weakest part of the beam. With the hip towards the cathode, the heel effect evens out some of the difference in thickness."],
        ["Small field or long distance", "Set the field to 20 cm. Reset, and then try a 36 cm field at 180 cm SID. What happens?", "The heel effect becomes much smaller in both cases (×1.08): the field uses only the middle part of the beam, where it is even."],
        ["The anode angle", "Set the anode angle to 16°. What happens to the heel effect? Then try 10°.", "At 16° the difference is only ×1.10. At 10° the anode can cover at most 35 cm at 100 cm, so the edge of the 36 cm field is cut off. A longer distance or a smaller field helps."],
        ["Line focus", "Watch the effective focal spot while you change the anode angle. Why not simply always choose a large angle?", "The effective focal spot grows from 0.6 mm at 7° to 1.5 mm at 17°. A small angle gives a small focal spot and a sharper image, but a stronger heel effect and a smaller field. The anode angle is a compromise.", { deep: 1 }],
      ], "heel"],
      ["AEC", [
        ["The middle chamber", "Switch the side chambers off and the middle chamber on. What happens to the mAs, REX and the image?", "The middle chamber lies over the spine, where only about 30 % gets through. The system keeps going: mAs and REX become about 3.3 times higher. The image looks equally bright."],
        ["Patient off centre", "Reset, and set the patient offset to 18 %. What do the chambers measure now?", "One side chamber now lies over the spine and soft tissue and gets too little. The exposure becomes about 1.65 times too long, and REX rises to about 410."],
        ["Stopping too early", "Set the patient offset to 25 %. Now the system stops too early. Why?", "One side chamber lies partly outside the patient, in the open beam, and quickly gets enough. The exposure stops after 0.8 of the right time, REX falls to about 205, and the image gets noisier."],
        ["Metal", "Reset, and switch on metal over the right chamber. What happens? What can you do?", "The metal stops the beam over the right chamber, so the exposure becomes about 1.7 times too long. Choose only the left chamber, or set the exposure manually."],
        ["Field too small", "Reset, and set the field width to 30 %. What happens?", "The side chambers lie outside the field and get almost no radiation. The exposure goes on until the backup time, and REX becomes far too high (1500)."],
        ["Dose steps", "Reset, and set the dose level to +2. What happens to the mAs and REX?", "Both rise by 44 % (1.2 × 1.2 = 1.44). The chambers still measure; they just stop at a higher level."],
        ["kV and AEC", "Go from 110 to 125 kV with the right chambers. What happens to the mAs and the patient dose?", "The mAs falls from 2.5 to 1.6, because more photons reach the chambers, and the patient dose falls by about 16 %. The price is lower contrast, as in the spectrum part.", { deep: 1 }],
      ], "aec"],
      ["Formulas", [
        ["Attenuation in the filter", "A filter attenuates the beam by $$I = I_0 \\cdot e^{-\\mu \\cdot x}$$ For aluminium, $\\mu$ is about 3.05 per cm at 30 keV and 0.75 per cm at 60 keV. What fraction gets through 2.5 mm (0.25 cm) at the two energies?",
         "$e^{-3.05 \\cdot 0.25} \\approx 0.47$ and $e^{-0.75 \\cdot 0.25} \\approx 0.83$. The filter removes more than half of the photons at 30 keV, but only a sixth at 60 keV. That is why the beam gets harder.", { deep: 1, mode: "spec" }],
        ["HVL by hand", "After the thickness $x$, $$I = I_0 \\cdot 0.5^{x/HVL}$$ is left. The HVL is 2.9 mm at the starting point. How much is left after 2.9 mm and after 5.8 mm of aluminium? Check the first number: add 3 mm of aluminium and look at the skin dose.",
         "50 % and 25 %. The simulator shows ×0.49 after 3 mm. In reality a little more than 25 % is left after 5.8 mm, because the beam has become harder on the way: the HVL has risen to 4.2 mm.", { deep: 1, mode: "spec" }],
        ["Shortest wavelength", "The highest photon energy in keV equals the kV. It matches the shortest wavelength: $$\\lambda_{min} = \\frac{1.24}{kV}\\ \\text{nm}$$ Work out $\\lambda_{min}$ for 80 and 124 kV.",
         "$\\frac{1.24}{80} \\approx 0.0155$ nm and $\\frac{1.24}{124} = 0.01$ nm. Higher kV gives a shorter wavelength, that is, more energetic photons.", { deep: 1, mode: "spec" }],
        ["Largest field", "The anode can at most cover the field $$L_{max} = 2 \\cdot SID \\cdot \\tan\\theta$$ Work out $L_{max}$ for 12° and 100 cm, and check the number in the simulator. What about 180 cm?",
         "$2 \\cdot 100 \\cdot \\tan 12° \\approx 42.5$ cm. At 180 cm it is $2 \\cdot 180 \\cdot 0.213 \\approx 76.5$ cm. That is why a longer distance helps against cut-off.", { deep: 1, mode: "heel" }],
        ["Line focus by hand", "The effective focal spot is $$f_{eff} = f \\cdot \\sin\\theta$$ where $f$ is the length of the strip the electrons hit (5 mm in the model). Work out $f_{eff}$ for 12° and 7°.",
         "$5 \\cdot \\sin 12° \\approx 1.04$ mm and $5 \\cdot \\sin 7° \\approx 0.61$ mm. The heat is spread over 5 mm, but the detector sees a focal spot of about 1 mm.", { deep: 1, mode: "heel" }],
        ["Dose steps by hand", "With 20 % per step, $$\\text{mAs} = 2.5 \\cdot 1.2^{n}$$ Work out the mAs for $n = 3$ and $n = -3$, and check in the simulator.",
         "$2.5 \\cdot 1.2^{3} \\approx 4.3$ and $2.5 \\cdot 1.2^{-3} \\approx 1.4$. So three steps up is 73 % more, not 60 %, because the steps multiply.", { deep: 1, mode: "aec" }],
      ], "spec"],
    ],
  },
};

// ---- the page (everything below needs a browser) -------------------------------------
if (typeof document !== "undefined") {
const START = { kv: 80, mas: 10, al: 1.5, cu: 0, theta: 12, sid: 100, len: 36, hip: "cathode",
                L: "on", C: "off", R: "on", field: 100, shift: 0, pros: "off", dens: 0, kvA: 110 };
const S = { lang: "da", level: "grund", part: 0, mode: "spec", ...START };
const $ = id => document.getElementById(id);
// the page's colours and font never change, so each is read from the stylesheet only once
const CSS = {}, css = n => CSS[n] || (CSS[n] = getComputedStyle(document.documentElement).getPropertyValue(n).trim());
const fmt = (v, d = 1) => v.toFixed(d).replace(".", T[S.lang].dec);
// the shared formula converter does not know these two Greek letters
const math = s => withMath(s).replace(/<mi>varphi<\/mi>/g, "<mi>φ</mi>").replace(/<mi>lambda<\/mi>/g, "<mi>λ</mi>");
const PHOTON = "#FFD84D";
function fit(cv) {
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [ctx, r.width, r.height];
}
function text(ctx, s, x, y, color, align = "left", size = 12) {
  ctx.fillStyle = color; ctx.font = `${size}px ${css("--body")}`; ctx.textAlign = align; ctx.fillText(s, x, y);
}
function line(ctx, pts, color, w = 1.5, dash) {
  ctx.strokeStyle = color; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  ctx.setLineDash([]); ctx.lineWidth = 1;
}
function area(ctx, pts, color, alpha) {
  ctx.fillStyle = color; ctx.globalAlpha = alpha;
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
}
// a legend: short line samples with their names, one under the other
function legend(ctx, items, x, y, align = "left") {
  items.forEach(([name, color, dash], i) => {
    const yy = y + i * 15, x0 = align === "left" ? x : x - 18;
    line(ctx, [[x0, yy - 4], [x0 + 18, yy - 4]], color, 2, dash);
    text(ctx, name, align === "left" ? x + 24 : x - 24, yy, color, align, 11);
  });
}

let M = null;
let PIN = null;   // the numbers saved with the compare button (and, in the spectrum part, the curve)
function compute() {
  if (S.mode === "spec") M = specModel(S);
  else if (S.mode === "heel") M = heelModel(S);
  else M = aecModel({ ...S, kv: S.kvA });
}

// ---- spectrum part ----
function drawSpec() {
  const [ctx, W, H] = fit($("main")); if (W < 10) return;
  const L = T[S.lang].lbl, x0 = 14, y0 = H - 28, x1 = W - 10, y1 = 14;
  // the height follows the smooth part of the curve; at high kV the narrow peaks are allowed to run off the top
  const hump = n => { let m = 0; for (let i = 0; i < 160; i++) m = Math.max(m, n[i]); return m; };      // below 50 keV
  const ymax = Math.max(hump(SPEC_REF.n) * 1.7, Math.min(Math.max(...M.n) * 1.08, hump(M.n) * 2.4));
  const X = e => x0 + (e - 10) / 140 * (x1 - x0), Y = v => y0 - v / ymax * (y0 - y1);
  const curve = n => ES.map((e, i) => [X(e), Y(n[i])]);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y1 - 8, x1 - x0, y0 - y1 + 8); ctx.clip();
  area(ctx, [[X(10), y0], ...curve(M.n), [X(150), y0]], css("--signal"), 0.12);
  line(ctx, curve(SPEC_REF.n), css("--muted"), 1.5);
  if (PIN && PIN.n) line(ctx, curve(PIN.n), css("--amber"), 1.5, [5, 4]);
  line(ctx, curve(M.n), css("--signal"), 2.2);
  ctx.restore();
  line(ctx, [[x0, y1], [x0, y0], [x1, y0]], css("--line"));
  for (const e of [20, 40, 60, 80, 100, 120, 140]) { line(ctx, [[X(e), y0], [X(e), y0 + 4]], css("--line")); text(ctx, String(e), X(e), y0 + 16, css("--muted"), "center", 10); }
  text(ctx, L.energy, x1, y0 + 27, css("--muted"), "right", 10); text(ctx, L.count, x0 + 5, y1 + 4, css("--muted"), "left", 11);
  // the mean energies, and the kV: where the curve ends
  line(ctx, [[X(SPEC_REF.mean), y0], [X(SPEC_REF.mean), y0 - 26]], css("--muted"), 1.2, [4, 3]);
  line(ctx, [[X(M.mean), y0], [X(M.mean), y0 - 40]], css("--fg"), 1.5, [4, 3]);
  const mx = X(M.mean), left = mx > 110;                               // the label beside the line, on the side with room
  text(ctx, `${L.mean} ${fmt(M.mean, 0)} keV`, mx + (left ? -6 : 6), y0 - 28, css("--fg"), left ? "right" : "left", 11);
  line(ctx, [[X(S.kv), y0], [X(S.kv), y0 - 12]], css("--amber"), 2);
  text(ctx, `${S.kv} kV`, X(S.kv), y0 - 16, css("--amber"), S.kv > 138 ? "right" : "center", 11);
  if (S.kv > K_EDGE) { text(ctx, "Kα", X(59.3) - 5, Math.max(Y(M.n[197]) - 4, y1 + 10), css("--signal"), "right", 10); text(ctx, "Kβ", X(67.2) + 5, Math.max(Y(M.n[229]) - 4, y1 + 10), css("--signal"), "left", 10); }
  legend(ctx, [[L.now, css("--signal")], [L.ref, css("--muted")], ...(PIN && PIN.n ? [[L.saved, css("--amber"), [5, 4]]] : [])], x1 - 4, y1 + 6, "right");
}
function drawSpecBars() {
  const [ctx, W, H] = fit($("side")); if (W < 10) return;
  const L = T[S.lang].lbl, vals = [[L.skin, M.skin / SPEC_REF.skin, css("--hot")], [L.det, M.det / SPEC_REF.det, css("--signal")],
                                   [L.con, M.contrast / SPEC_REF.contrast, css("--amber")]];
  const vmax = Math.max(1.6, ...vals.map(v => v[1])) * 1.12, bw = W / 3 * 0.5, y0 = H - 24;
  line(ctx, [[0, y0], [W, y0]], css("--line"));
  const yref = y0 - (1 / vmax) * (y0 - 18);
  vals.forEach(([lbl, v, col], i) => {
    const cx = W / 3 * (i + 0.5), h = v / vmax * (y0 - 18);
    ctx.fillStyle = col; ctx.globalAlpha = 0.8; ctx.fillRect(cx - bw / 2, y0 - h, bw, h); ctx.globalAlpha = 1;
    text(ctx, `×${fmt(v, 2)}`, cx, y0 - h - 5, css("--fg"), "center", 12);
    text(ctx, lbl, cx, y0 + 15, css("--muted"), "center", 11);
  });
  line(ctx, [[0, yref], [W, yref]], css("--muted"), 1, [4, 4]);
  // only "×1" at the left edge: a longer label ran into the first bar's value; the note below says what 1 is
  text(ctx, "×1", 2, yref - 4, css("--muted"), "left", 10);
}

// ---- heel part ----
function drawHeel() {
  const [ctx, W, H] = fit($("main")); if (W < 10) return;
  const L = T[S.lang].lbl, cx = W / 2, fy = 52, n = M.xs.length;
  const ph = Math.min(84, H * 0.22), py = H - 20;                     // the strength curve: its height and its base line
  const dyMax = py - ph - 24, vs = (dyMax - fy) / 180, dy = fy + S.sid * vs;   // the detector moves down with the SID
  const hs = Math.min(W * 0.8 / 43, 12), half = S.len / 2;            // px per cm sideways: stretched compared with the height
  const a = S.theta * Math.PI / 180, cut = Math.tan(a) * S.sid;       // cm from the centre where the anode's shadow begins
  const PX = x => cx + x * hs;
  // the beam as thin slices, each as bright as the beam is strong in that direction; red where the anode shadows it
  for (let k = 0; k < n - 1; k += 2) {
    const k2 = Math.min(k + 2, n - 1), v = (M.I[k] + M.I[k2]) / 2;
    if (v > 0) area(ctx, [[cx, fy], [PX(M.xs[k]), dy], [PX(M.xs[k2]), dy]], PHOTON, 0.04 + 0.26 * Math.min(v, 1.1));
  }
  if (!M.cover) area(ctx, [[cx, fy], [PX(cut), dy], [PX(half), dy]], css("--hot"), 0.3);
  line(ctx, [[cx, fy], [PX(-half), dy]], PHOTON, 1.2);
  line(ctx, [[cx, fy], [PX(Math.min(half, cut)), dy]], PHOTON, 1.2);
  line(ctx, [[cx, fy], [cx, dy]], css("--muted"), 1, [3, 4]);
  // the anode: its face runs along the last ray it lets out, so the drawing shows why the beam is cut off
  const ul = Math.hypot(Math.sin(a) * hs, Math.cos(a) * vs), ux = Math.sin(a) * hs / ul, uy = Math.cos(a) * vs / ul, fl = 34;
  ctx.fillStyle = "#5A6070";
  ctx.beginPath(); ctx.moveTo(cx - fl * ux, fy - fl * uy); ctx.lineTo(cx + fl * ux, fy + fl * uy);
  ctx.lineTo(cx + 100, fy + fl * uy); ctx.lineTo(cx + 100, fy - fl * uy); ctx.closePath(); ctx.fill();
  line(ctx, [[cx - fl * ux, fy - fl * uy], [cx + fl * ux, fy + fl * uy]], css("--fg"), 1.5);
  text(ctx, L.anode, cx + 66, fy + 4, css("--fg"), "center", 11);
  // the cathode and the electrons
  ctx.fillStyle = css("--muted"); ctx.fillRect(cx - 104, fy - 10, 16, 20);
  line(ctx, [[cx - 86, fy], [cx - 6, fy]], css("--signal"), 1.2, [2, 4]);
  text(ctx, L.cathode, cx - 96, fy - 16, css("--muted"), "center", 11);
  text(ctx, L.electrons, cx - 46, fy + 14, css("--signal"), "center", 10);
  ctx.fillStyle = css("--amber"); ctx.beginPath(); ctx.arc(cx, fy, 3.5, 0, 7); ctx.fill();
  // the anode angle, between the central ray and the anode's face
  const scr = Math.atan2(ux, uy);
  ctx.strokeStyle = css("--amber"); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, fy, 26, Math.PI / 2 - scr, Math.PI / 2); ctx.stroke(); ctx.lineWidth = 1;
  text(ctx, `${S.theta}°`, cx + 32 * Math.sin(scr / 2) + 2, fy + 32 * Math.cos(scr / 2) + 10, css("--amber"), "left", 12);
  // the detector
  line(ctx, [[PX(-21.5) - 6, dy], [PX(21.5) + 6, dy]], css("--muted"), 4);
  if (!M.cover) { line(ctx, [[PX(cut), dy], [PX(half), dy]], css("--hot"), 4); text(ctx, L.cutoff, PX(half), dy - 8, css("--hot"), "right", 11); }
  text(ctx, `SID ${S.sid} cm`, 4, (fy + dy) / 2 + 20, css("--muted"), "left", 11);
  text(ctx, `${S.len} cm`, cx, dy + 15, css("--muted"), "center", 11);
  // the strength of the beam across the field, 100 % = the central ray
  for (const x of [-half, half]) line(ctx, [[PX(x), dy + 4], [PX(x), py]], css("--line"), 1, [2, 4]);   // the same field, straight below
  const PY = v => py - Math.min(v, 1.2) / 1.2 * ph, prof = M.xs.map((x, k) => [PX(x), PY(M.I[k])]);
  area(ctx, [[PX(-half), py], ...prof, [PX(half), py]], css("--signal"), 0.14);
  line(ctx, [[PX(-half), py], [PX(half), py]], css("--line"));
  line(ctx, [[PX(-half), PY(1)], [PX(half), PY(1)]], css("--muted"), 1, [3, 4]);
  line(ctx, prof, css("--signal"), 2.2);
  const pc = v => `${Math.round(v * 100)} %`;
  text(ctx, pc(M.I[0]), PX(-half) - 5, PY(M.I[0]) + 4, css("--signal"), "right", 11);
  text(ctx, pc(M.I[n - 1]), PX(half) + 5, PY(M.I[n - 1]) + 4, M.cover ? css("--signal") : css("--hot"), "left", 11);
  text(ctx, L.cside, PX(-half), py + 14, css("--muted"), "left", 10); text(ctx, L.aside, PX(half), py + 14, css("--muted"), "right", 10);
}
function drawHeelSide() {
  const [ctx, W, H] = fit($("side")); if (W < 10) return;
  const L = T[S.lang].lbl, x0 = 10, x1 = W - 10, n = M.xs.length, hipLeft = S.hip === "cathode";
  const X = k => x0 + k / (n - 1) * (x1 - x0), U = k => hipLeft ? k / (n - 1) : 1 - k / (n - 1);
  // the femur as a band, thick at the hip
  const my = H - 42, ts = Math.min(1.2, H / 260);
  const band = []; for (let k = 0; k < n; k++) band.push([X(k), my - FEMUR(U(k)) * ts]);
  for (let k = n - 1; k >= 0; k--) band.push([X(k), my + FEMUR(U(k)) * ts]);
  area(ctx, band, "#6B5A55", 1);
  text(ctx, L.hip, hipLeft ? x0 + 6 : x1 - 6, my + 4, css("--fg"), hipLeft ? "left" : "right", 11);
  text(ctx, L.knee, hipLeft ? x1 - 6 : x0 + 6, my + 4, css("--fg"), hipLeft ? "right" : "left", 11);
  text(ctx, L.cside, x0, H - 4, css("--muted"), "left", 10); text(ctx, L.aside, x1, H - 4, css("--muted"), "right", 10);
  // the two curves, each scaled to its own top
  const imax = Math.max(...M.I) || 1, smax = Math.max(...M.sig) || 1, yb = my - 18 * ts - 10, y1 = 44, hh = yb - y1;
  line(ctx, [[x0, yb], [x1, yb]], css("--line"));
  line(ctx, M.I.map((v, k) => [X(k), yb - v / imax * hh]), css("--muted"), 1.5);
  line(ctx, M.sig.map((v, k) => [X(k), yb - v / smax * hh]), css("--signal"), 2.4);
  legend(ctx, [[L.before, css("--muted")], [L.after, css("--signal")]], x0, 14);
}

// ---- AEC part ----
// the same noise pattern every time, so only its strength changes with the dose
const NOISE = (() => {
  let a = 3; const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  return Float32Array.from({ length: NX * NY }, () => { let s = 0; for (let k = 0; k < 6; k++) s += r(); return (s - 3) / Math.sqrt(0.5); });
})();
let OFF = null;
function drawAec() {
  const [ctx, W, H] = fit($("main")); if (W < 10) return;
  const L = T[S.lang].lbl, h = H - 10, w = h * NX / NY, ox = (W - w) / 2, oy = 5;
  if (!OFF) { OFF = document.createElement("canvas"); OFF.width = NX; OFF.height = NY; }
  const octx = OFF.getContext("2d"), img = octx.createImageData(NX, NY), d = img.data;
  const lung = 300 * M.rex / 250;                                       // photons per pixel under the lung
  for (let k = 0; k < NX * NY; k++) {
    const n = lung * M.t[k], v = n + Math.sqrt(Math.max(n, 1)) * NOISE[k];
    const gr = Math.min(255, Math.max(0, 220 - 150 * v / Math.max(lung, 1)));   // rescaled: the lung always lands on the same grey
    d[k * 4] = d[k * 4 + 1] = d[k * 4 + 2] = gr; d[k * 4 + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(OFF, ox, oy, w, h);
  ctx.strokeStyle = css("--line"); ctx.strokeRect(ox, oy, w, h);
  // the field (the collimation)
  ctx.strokeStyle = css("--signal"); ctx.lineWidth = 2;
  ctx.strokeRect(ox + (0.5 - S.field / 200) * w + 2, oy + 2, S.field / 100 * w - 4, h - 4);
  for (const [name, [cx, cy]] of Object.entries(CHAMBERS)) {
    const on = S[name] === "on", bx = ox + (cx - CW / 2) * w, by = oy + (cy - CH / 2) * h;
    ctx.fillStyle = "rgba(10,14,24,.3)"; ctx.fillRect(bx, by, CW * w, CH * h);
    ctx.strokeStyle = on ? css("--amber") : css("--fg"); ctx.lineWidth = on ? 3 : 1.2;
    if (!on) ctx.setLineDash([4, 3]);
    ctx.strokeRect(bx, by, CW * w, CH * h); ctx.setLineDash([]);
    ctx.font = `600 13px ${css("--body")}`; ctx.textAlign = "center"; ctx.fillStyle = on ? css("--amber") : css("--fg");
    ctx.fillText(L.ch[name], ox + cx * w, by + CH * h / 2 + 5);
  }
  ctx.lineWidth = 1;
}
function drawAecSide() {
  const [ctx, W, H] = fit($("side")); if (W < 10) return;
  const L = T[S.lang].lbl, y0 = H - 24, top = 26, vals = ["L", "C", "R"].map(c => M.got[c] / M.level);   // 1 = the stop level
  const vmax = Math.max(1.35, ...vals.map(v => v * 1.12));
  const Y = v => y0 - v / vmax * (y0 - top), bw = W / 3 * 0.42;
  line(ctx, [[0, y0], [W, y0]], css("--line"));
  ["L", "C", "R"].forEach((c, i) => {
    const cx = W / 3 * (i + 0.5), v = vals[i], on = S[c] === "on", col = on ? css("--amber") : css("--muted");
    ctx.fillStyle = col; ctx.globalAlpha = on ? 0.85 : 0.4;
    ctx.fillRect(cx - bw / 2, Y(v), bw, y0 - Y(v)); ctx.globalAlpha = 1;
    text(ctx, `${Math.round(v * 100)} %`, cx, Y(v) - 6, on ? css("--fg") : css("--muted"), "center", 12);
    text(ctx, L.ch[c], cx, y0 + 16, col, "center", 12);
  });
  line(ctx, [[0, Y(1)], [W, Y(1)]], css("--amber"), 1.5, [5, 4]);
  text(ctx, L.enough, W - 2, Y(1) - 5, css("--amber"), "right", 10);
}

// ---- the numbers, what you can see, and the saved numbers ----
function metrics() {
  const L = T[S.lang], deep = S.level === "deep";
  if (S.mode === "spec") {
    const eff = (M.skin / M.det) / (SPEC_REF.skin / SPEC_REF.det);
    return [["ok", "mean", `${fmt(M.mean, 0)} keV`, L.f.mean], ["mag", "con", `${fmt(M.contrast * 100, 0)} %`, L.f.con],
            ["err", "skin", `×${fmt(M.skin / SPEC_REF.skin, 2)}`, L.f.rel], ["ok", "det", `×${fmt(M.det / SPEC_REF.det, 2)}`, L.f.rel],
            ["", "eff", `×${fmt(eff, 2)}`, L.f.eff], ...(deep ? [["", "hvl", `${fmt(M.hvl, 1)} mm Al`, L.f.hvl]] : [])];
  }
  if (S.mode === "heel") {
    return [["mag", "ratio", !M.cover ? "–" : M.ratio > 10 ? "> 10" : `×${fmt(M.ratio, 2)}`, L.f.ratio],
            [M.cover ? "ok" : "err", "cover", `${fmt(M.maxField, 1)} cm`, L.f.cover(M.cover)],
            ["", "even", M.cover && M.ratio <= 10 ? `×${fmt(M.even, 1)}` : "–", L.f.even],
            ...(deep ? [["", "focus", `${fmt(M.focus, 1)} mm`, L.f.focus]] : [])];
  }
  return [["mag", "mas", fmt(M.mas, 1), L.f.mas], [M.rex < 125 || M.rex > 400 ? "err" : "ok", "rex", String(Math.round(M.rex)), L.f.rex(M.rex)],
          [M.patient > 1.3 ? "err" : "", "pat", `×${fmt(M.patient, 2)}`, L.f.pat], [M.backup ? "err" : "ok", "time", M.backup ? L.f.backup : L.f.aec, L.f.time(M.backup)]];
}
function observations() {
  const L = T[S.lang].see;
  let found;
  if (S.mode === "spec") {
    const eff = (M.skin / M.det) / (SPEC_REF.skin / SPEC_REF.det), fill = t => t.replace("{e}", fmt(eff, 2));
    found = [[S.kv <= K_EDGE, "noK"], [INHERENT + S.al < 2.5 && !S.cu, "soft"], [eff < 0.9, "effLow"], [eff > 1.1, "effHigh"],
             [M.det < 0.5 * SPEC_REF.det, "weak"]].filter(([on]) => on).slice(0, 2).map(([, k]) => fill(L[k]));
    return found.length ? found : [L.specBase];
  }
  if (S.mode === "heel") {
    if (!M.cover) return [L.cut];
    if (M.ratio > 3) return [L.edge];
    return [M.ratio < 1.15 ? L.even : L.heel.replace("{p}", Math.round((M.ratio - 1) * 100)), S.hip === "anode" ? L.hipAnode : L.hipCathode];
  }
  if (!M.chosen.length) return [L.none];
  if (M.backup) return [L.backup];
  const right = M.rex >= 235 && M.rex <= 265;
  found = [[M.rex > 265, L.over.replace("{x}", fmt(M.rex / 250, 1))], [M.rex < 235, L.under], [right && S.dens === 0, L.aecOk],
           [S.kvA > 110, L.kvHigh], [S.kvA < 110, L.kvLow]].filter(([on]) => on).slice(0, 2).map(([, t]) => t);
  return found;
}
function readouts() {
  const L = T[S.lang], pinned = PIN && PIN.mode === S.mode ? PIN.vals : null;
  $("readout").innerHTML = metrics().map(([cls, key, value, foot]) =>
    `<div class="metric ${cls}"><div class="k">${L.k[key]}</div><div class="v">${value}</div><div class="f">${foot}</div>` +
    (pinned && pinned[key] ? `<div class="p">${L.saved}: ${pinned[key]}</div>` : "") + `</div>`).join("");
  $("t-seen").textContent = L.seen; $("seen").textContent = observations().join(" ");
  $("pin").textContent = pinned ? L.unpin : L.pin;
}
$("pin").onclick = () => {
  PIN = PIN && PIN.mode === S.mode ? null
      : { mode: S.mode, vals: Object.fromEntries(metrics().map(([, key, value]) => [key, value])), n: S.mode === "spec" ? M.n : null };
  render();
};

// ---- controls, text, tasks ----------------------------------------------------------
const SLIDERS = {
  spec: [["kv", 40, 150, 1, v => `${v} kV`], ["mas", 1, 40, 1, v => `${v} mAs`], ["al", 0, 5, 0.5, v => `${fmt(v, 1)} mm`]],
  heel: [["theta", 7, 17, 1, v => `${v}°`], ["sid", 100, 180, 5, v => `${v} cm`], ["len", 18, 43, 1, v => `${v} cm`]],
  aec: [["kvA", 80, 125, 5, v => `${v} kV`], ["field", 20, 100, 5, v => `${v} %`], ["shift", -25, 25, 1, v => `${v} %`], ["dens", -3, 3, 1, v => (v > 0 ? "+" : "") + v]],
};
function buildControls() {
  const L = T[S.lang].ctl, box = $("controls"), Hh = T[S.lang].help, SL = SLIDERS[S.mode];
  const help = k => S.level === "grund" && Hh[k] ? `<p class="help">${Hh[k]}</p>` : "";
  const wrap = (key, buttons) => `<div class="ctl"><label><span>${L[key]}</span><span></span></label><div class="seg">${buttons}</div>${help(key)}</div>`;
  const seg = (key, opts) => wrap(key, opts.map(([val, lbl]) =>
    `<button data-k="${key}" data-v="${val}" aria-pressed="${String(S[key]) === String(val)}">${lbl}</button>`).join(""));
  const sl = k => { const [, mn, mx, st, f] = SL.find(s => s[0] === k);
    return `<div class="ctl"><label for="s-${k}"><span>${L[k]}</span><span id="o-${k}">${f(S[k])}</span></label>` +
      `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}">${help(k)}</div>`; };
  const M_ = T[S.lang].modes, mm = v => `${fmt(v, 1)} mm`;
  let html = `<div class="ctl modes"><label><span>${L.mode}</span><span></span></label><div class="seg">` +
    ["spec", "heel", "aec"].map(m => `<button data-k="mode" data-v="${m}" aria-pressed="${S.mode === m}">${M_[m]}</button>`).join("") + `</div></div>`;
  if (S.mode === "spec") html += sl("kv") + sl("mas") + sl("al") + seg("cu", [[0, "0"], [0.1, mm(0.1)], [0.2, mm(0.2)], [0.3, mm(0.3)]]);
  if (S.mode === "heel") html += sl("theta") + sl("sid") + sl("len") + seg("hip", [["cathode", L.cathode], ["anode", L.anode]]);
  // the three chambers are one row of buttons, each switched on and off by itself, as on the console
  if (S.mode === "aec") html += wrap("ch", ["L", "C", "R"].map(c => `<button data-k="${c}" data-v="toggle" aria-pressed="${S[c] === "on"}">${L[c]}</button>`).join("")) +
    sl("kvA") + sl("field") + sl("shift") + seg("pros", [["off", L.off], ["on", L.on]]) + sl("dens");
  box.innerHTML = html + `<div class="ctl"><button class="reset" id="reset">${L.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    const k = b.dataset.k, v = b.dataset.v;
    if (k === "mode") { setMode(v); return; }
    S[k] = v === "toggle" ? (S[k] === "on" ? "off" : "on") : k === "cu" ? +v : v;
    buildControls(); update();
  });
  SL.forEach(([k, , , , f]) => {
    const el = $(`s-${k}`);
    el.oninput = () => { S[k] = +el.value; $(`o-${k}`).textContent = f(S[k]); updateSoon(); };
  });
  $("reset").onclick = () => { Object.assign(S, START); buildControls(); update(); };
}
// the tasks that are shown at this level, each with the part of the simulator it belongs to
function taskList() {
  const out = [];
  T[S.lang].groups.forEach(([g, items, gm], gi) => {
    const vis = items.map((it, ii) => [it, ii]).filter(([it]) => S.level === "deep" || !(it[3] && it[3].deep));
    vis.forEach(([it, ii], k) => out.push({ id: gi + ":" + ii, g, k: k + 1, n: vis.length, h: it[0], q: it[1], a: it[2], mode: (it[3] && it[3].mode) || gm }));
  });
  return out;
}
let taskId = "0:0";
function buildCard() {
  const L = T[S.lang], flat = taskList();
  let i = flat.findIndex(t => t.id === taskId);
  if (i < 0 || flat[i].mode !== S.mode) i = Math.max(0, flat.findIndex(t => t.mode === S.mode));   // the card follows the chosen part
  const t = flat[i]; taskId = t.id;
  $("taskcard").innerHTML =
    `<div class="tc-head"><span>${t.g} · ${t.k} ${L.of} ${t.n}</span>` +
    `<span class="seg"><button id="tc-prev" aria-label="${L.prev}">‹</button><button id="tc-next" aria-label="${L.next}">›</button></span></div>` +
    `<h4>${t.h}</h4><p class="q">${math(t.q)}</p>` +
    `<details class="answer"><summary>${L.answer}</summary><p class="a">${math(t.a)}</p></details>`;
  // stepping to a task in another part switches the simulator to that part
  const go = d => { const nx = flat[(i + d + flat.length) % flat.length]; taskId = nx.id; if (nx.mode !== S.mode) setMode(nx.mode); else buildCard(); };
  $("tc-prev").onclick = () => go(-1);
  $("tc-next").onclick = () => go(1);
}
function setMode(m) { S.mode = m; buildText(); buildControls(); update(); }
const PART_FILES = ["roer5a", "aec5b"];
function buildVideo() {
  const L = T[S.lang];
  $("parts").innerHTML = L.parts.map((p, i) => `<button data-p="${i}" aria-pressed="${S.part === i}">${p}</button>`).join("");
  document.querySelectorAll("#parts button").forEach(b => b.onclick = () => { S.part = +b.dataset.p; buildVideo(); });
  $("t-partnote").textContent = L.partNote;
  const vid = $("vid"), file = `video/${PART_FILES[S.part]}_${S.lang}_${S.level === "deep" ? "fordybelse" : "grund"}.mp4`;
  if (vid.getAttribute("src") !== file) { vid.poster = `video/poster_${PART_FILES[S.part]}_${S.lang}.jpg`; vid.src = file; }
}
function buildText() {
  const L = T[S.lang], set = (id, s) => { $(id).textContent = s; };
  document.documentElement.lang = S.lang;
  document.title = L.title + " | Oliver Brage";
  for (const k of ["title", "sub", "tasks", "model", "foot", "privacy"]) set("t-" + k, L[k]);
  set("t-back", L.back); set("t-simtitle", L.simTitle);
  set("t-main", L.head[S.mode][0]); set("t-side", L.head[S.mode][1]);
  set("t-mainnote", L.note[S.mode][0]); set("t-sidenote", L.note[S.mode][1]);
  $("t-back").href = "../../?lang=" + S.lang;
  set("lvl-grund", L.grund); set("lvl-deep", L.deep);
  $("model-text").innerHTML = math(L.modelText);
  let last = "";
  $("task-list").innerHTML = taskList().map(t => {
    const head = t.g === last ? "" : `<h4 class="tgroup">${t.g}</h4>`; last = t.g;
    return head + `<details><summary>${t.h}</summary><p class="q">${math(t.q)}</p><details class="answer">` +
      `<summary>${L.answer}</summary><p class="a">${math(t.a)}</p></details></details>`; }).join("");
  buildCard(); buildVideo();
  document.body.dataset.mode = S.mode;
}
function setPressed() {
  for (const [id, on] of [["lang-da", S.lang === "da"], ["lang-en", S.lang === "en"],
                          ["lvl-grund", S.level === "grund"], ["lvl-deep", S.level === "deep"]])
    $(id).setAttribute("aria-pressed", on);
}
function render() {
  if (S.mode === "spec") { drawSpec(); drawSpecBars(); }
  else if (S.mode === "heel") { drawHeel(); drawHeelSide(); }
  else { drawAec(); drawAecSide(); }
  readouts();
}
function update() { compute(); render(); }
// while a slider is dragged it fires many events; redraw at most once per screen frame so the thumb keeps up
let pending = false;
function updateSoon() { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; update(); }); } }
function all() { PIN = null; setPressed(); buildText(); buildControls(); update(); }
function save() {
  const q = new URLSearchParams(location.search);
  q.set("lang", S.lang); S.level === "deep" ? q.set("level", "deep") : q.delete("level");
  history.replaceState(null, "", "?" + q + location.hash);
}
$("lang-da").onclick = () => { S.lang = "da"; save(); all(); };
$("lang-en").onclick = () => { S.lang = "en"; save(); all(); };
$("lvl-grund").onclick = () => { S.level = "grund"; save(); all(); };
$("lvl-deep").onclick = () => { S.level = "deep"; save(); all(); };
{
  const q = new URLSearchParams(location.search), l = q.get("lang");
  S.lang = l === "da" || l === "en" ? l : (navigator.language || "").toLowerCase().startsWith("da") ? "da" : "en";
  if (q.get("level") === "deep") S.level = "deep";
}
window.addEventListener("resize", render);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
all();
}
