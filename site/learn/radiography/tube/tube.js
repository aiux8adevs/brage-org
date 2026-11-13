// The X-ray tube page (videos 5a and 5b) and its simulator in three modes: the spectrum and filtration,
// the heel effect, and automatic exposure control. Language and level live in the address.
// The models, written out in the "How the model works" box:
//
//   spectrum     Kramers: (kV − E)/E photons per keV, through 1 mm Al inherent + added Al + Cu (NIST
//                attenuation tables); tungsten K peaks at 59 and 67 keV above 69.5 kV
//   skin dose    Σ n·E·μen(water);  signal = the same after 20 cm of tissue;  contrast of 1 cm bone
//   heel         I(φ) = exp(−k / sin(θ − φ)), φ the ray's angle towards the anode, θ the anode angle,
//                k set so a 36 cm field at 100 cm with 12° is 45 % stronger at the cathode edge (Bushong)
//   AEC          the chosen chambers' mean reading; exposure stops when it reaches the set level

// ---- tables: mass attenuation (and energy absorption for water), cm²/g, NIST -------------------
const ETAB = [10, 15, 20, 30, 40, 50, 60, 80, 100, 150];
const TAB = {
  al: [[26.2, 7.96, 3.44, 1.13, 0.569, 0.368, 0.278, 0.202, 0.170, 0.138], 2.70],
  cu: [[215.9, 74.1, 33.8, 10.9, 4.86, 2.61, 1.59, 0.763, 0.458, 0.222], 8.96],
  water: [[5.33, 1.67, 0.809, 0.376, 0.268, 0.227, 0.206, 0.184, 0.171, 0.150], 1.0],
  bone: [[28.5, 9.03, 4.00, 1.33, 0.665, 0.424, 0.315, 0.223, 0.186, 0.148], 1.92],
};
const MUEN_W = [4.94, 1.37, 0.539, 0.155, 0.0695, 0.0422, 0.0319, 0.0260, 0.0255, 0.0276];
function logInterp(tab, e) {
  let i = 0; while (i < ETAB.length - 2 && e > ETAB[i + 1]) i++;
  const t = (Math.log(e) - Math.log(ETAB[i])) / (Math.log(ETAB[i + 1]) - Math.log(ETAB[i]));
  return Math.exp(Math.log(tab[i]) + t * (Math.log(tab[i + 1]) - Math.log(tab[i])));
}
const mu = (m, e) => logInterp(TAB[m][0], e) * TAB[m][1];      // per cm
const ES = Array.from({ length: 441 }, (_, i) => 10 + i * 0.25);
const INHERENT = 1.0;                                            // mm Al in the tube itself (glass, oil, window)
const SELF = 1.0;                                                // the anode's own absorption, as mm Al: photons start inside the tungsten

function spectrum(kv, mas, alAdded, cu) {
  const al = SELF + INHERENT + alAdded, a = kv > 69.5 ? 0.07 * (kv - 69.5) : 0;
  return ES.map(e => {
    let n = Math.max(kv - e, 0) / e;
    if (a) n += a * (Math.exp(-(((e - 59.3) / 0.7) ** 2)) + 0.3 * Math.exp(-(((e - 67.2) / 0.7) ** 2)));
    return mas * n * Math.exp(-mu("al", e) * al / 10 - mu("cu", e) * cu / 10);
  });
}
function specModel(s) {
  const n = spectrum(s.kv, s.mas, s.al, s.cu);
  let N = 0, NE = 0, skin = 0, det = 0, detB = 0;
  ES.forEach((e, i) => {
    const v = n[i]; N += v; NE += v * e;
    skin += v * e * logInterp(MUEN_W, e);                          // energy absorbed in the first layer: skin dose
    const tr = Math.exp(-mu("water", e) * 20);                      // through 20 cm of tissue
    det += v * e * tr; detB += v * e * tr * Math.exp(-(mu("bone", e) - mu("water", e)) * 1);   // 1 cm of bone instead of tissue
  });
  // HVL: aluminium that halves the air kerma (weighted by E·μen, water as a stand-in for air)
  const kerma = t => ES.reduce((x, e, i) => x + n[i] * e * logInterp(MUEN_W, e) * Math.exp(-mu("al", e) * t / 10), 0);
  const k0 = kerma(0); let hvl = 0;
  for (let t = 0; t <= 15; t += 0.02) if (kerma(t) <= k0 / 2) { hvl = t; break; }
  return { n, mean: NE / N, skin, det, contrast: 1 - detB / det, hvl };
}
const SPEC_REF = specModel({ kv: 80, mas: 10, al: 1.5, cu: 0 });

// heel: rays at angle φ (degrees, + towards the anode) leave the anode through a path ∝ 1/sin(θ − φ)
const HEEL_K = 0.0127;
function heel(phi, theta) {
  const a = (theta - phi) * Math.PI / 180;
  return a <= 0.004 ? 0 : Math.exp(-HEEL_K / Math.sin(a));
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
const STEP = 0.2, BACKUP = 6;                                          // 20 % per density step in the model; backup at 6 × the normal time
function aecModel(s) {
  const t = chest(s.shift / 100, s.pros === "on", s.field / 100);
  const rate = (s.kv / 110) ** 2;                                      // more photons through at higher kV (simplified)
  const chosen = ["L", "C", "R"].filter(c => s[c] === "on");
  const level = (1 + STEP) ** s.dens;
  const read = chosen.length ? chosen.reduce((a, c) => a + reading(t, c), 0) / chosen.length * rate : 0;
  const time = chosen.length ? Math.min(BACKUP, level / Math.max(read, 1e-6)) : BACKUP;   // relative to the right setting
  const lungDose = time * rate;                                        // radiation at the detector under the lungs
  return { t, chosen, time, backup: time >= BACKUP - 1e-9, mas: 2.5 * time, rex: 250 * lungDose,
           patient: time * (s.kv / 110) ** 2 * (110 / s.kv) ** 0.5,   // entrance dose, relative; a little lower per photon at high kV
           reads: Object.fromEntries(["L", "C", "R"].map(c => [c, reading(t, c) * rate])) };
}

const T = {
  da: {
    title: "Røntgenrøret", sub: "Strålen før patienten: røret, spektret, heel-effekten, filtrering og automatisk eksponering. To videoer og en simulator.",
    grund: "Grund", deep: "Fordybelse", back: "← Læring",
    parts: ["5a Røret og strålen", "5b Automatisk eksponering"],
    partNote: "Se de to dele i rækkefølge. Hver del er cirka fem til ni minutter.",
    simTitle: "Simulator: Røntgenrøret",
    modes: { spec: "Spektrum og filter", heel: "Heel-effekt", aec: "AEC" },
    head: { spec: ["Røntgenspektret", "Hvor energien ender"], heel: ["Røret og feltet", "Det detektoren får langs lårbenet"],
            aec: ["Thorax PA i stativet", "Ionkamrene"] },
    note: {
      spec: ["Kurven viser, hvor mange fotoner strålen har ved hver energi. Den grå kurve er udgangspunktet (80 kV, 10 mAs, 2,5 mm Al i alt). De smalle toppe er wolframs karakteristiske stråling; de findes kun over 69,5 kV. De stiplede linjer er middelenergien.",
             "Søjlerne sammenligner med udgangspunktet. Huddosis er den energi, der afsættes i huden. Signal er det, der når detektoren gennem 20 cm væv. Kontrast er forskellen mellem 1 cm knogle og væv. Filtrering sænker huddosis meget mere end signalet."],
      heel: ["Røret set fra siden, med katoden til venstre og anoden til højre. Den cyan kurve under feltet er strålens styrke: højest mod katodesiden. Mod anodesiden skal fotonerne gennem mere af anoden. Rødt område: anoden skærer strålen helt af.",
             "Lårbenet er tykt ved hoften og tyndt ved knæet. Den grå linje er strålen før patienten, den cyan det, der kommer igennem til detektoren. Jo fladere den cyan linje er, jo jævnere er billedet."],
      aec: ["Billedet er skaleret som på et DR-anlæg, så det er lige lyst uanset dosis. Ionkamrene er de små felter: orange er valgt. Den cyan ramme er feltet (indblændingen).",
            "Søjlerne viser, hvor meget stråling hvert kammer har fået, da eksponeringen stoppede. Stregen er niveauet, anlægget stopper ved. Kun de valgte kamre (orange) tæller."],
    },
    tasks: "Opgaver", answer: "Vis svar", of: "af", prev: "Forrige opgave", next: "Næste opgave",
    model: "Sådan virker modellerne", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
    ctl: { mode: "Del", kv: "Kilovolt", mas: "mAs", al: "Tilføjet aluminium", cu: "Kobberfilter", theta: "Anodevinkel", sid: "Afstand fokus–detektor (SID)",
           len: "Feltlængde langs røret", hip: "Hoften vender mod", cathode: "katoden", anode: "anoden",
           L: "Venstre kammer", C: "Midterkammer", R: "Højre kammer", on: "Til", off: "Fra", field: "Feltbredde", shift: "Patienten forskudt",
           pros: "Protese over højre lunge", dens: "Dosisniveau (trin)", reset: "Nulstil" },
    help: { kv: "Spændingen: hvor energirige fotonerne højst bliver.", mas: "Hvor mange elektroner, og dermed fotoner.",
            al: "Oven i 1 mm egenfiltrering i røret.", cu: "Et ekstra filter, som kan slås til og fra.",
            theta: "Vinklen på anodens skrå flade.", sid: "Længere afstand: strålen bruger kun en mindre vinkel.",
            len: "Længden af feltet langs aksen katode–anode.", hip: "Læg den tykke ende under katoden.",
            field: "Hvor bredt feltet er, i procent af detektoren.", shift: "Patienten står ikke midt på detektoren.",
            dens: "Hvert trin ændrer det niveau, anlægget stopper ved.", L: "", C: "", R: "", pros: "" },
    k: { mean: "Middelenergi", hvl: "Halvværdilag (HVL)", skin: "Huddosis", det: "Signal ved detektoren", con: "Knoglekontrast", eff: "Huddosis pr. signal",
         ratio: "Katodekant / anodekant", cover: "Felt dækket", even: "Forskel hofte / knæ", mas: "mAs", rex: "REX", pat: "Patientdosis", time: "Stoppede ved" },
    f: { mean: "gennemsnitlig fotonenergi", hvl: "mm aluminium, der halverer strålen", rel: "i forhold til udgangspunktet",
         con: "1 cm knogle mod væv", eff: "lavere er bedre", ratio: "strålens styrke ved kanterne", cover: c => c ? "hele feltet" : "anoden skærer af",
         even: "signal ved detektoren, lavere er jævnere", mas: "2,5 mAs ved rigtig indstilling", rex: r => r < 125 ? "for lidt: støj" : r <= 400 ? "i orden" : "for meget dosis",
         pat: "i forhold til rigtig indstilling", time: b => b ? "back-up-tiden" : "kamrene havde nok" },
    lbl: { energy: "energi (keV)", count: "antal fotoner", ref: "udgangspunkt", now: "nu", cathode: "katode", anode: "anode", hip: "hofte", knee: "knæ",
           cutoff: "afskåret", before: "før patienten", after: "til detektoren", enough: "stop", skin: "huddosis", det: "signal", con: "kontrast" },
    dec: ",",
    modelText: `<p><b>Spektret.</b> Bremsestråling efter Kramers: $(kV - E)/E$ fotoner pr. keV. Over 69,5 kV lægges wolframs K-toppe ved 59 og 67 keV til. Strålen dæmpes af anoden selv (regnet som 1 mm aluminium), 1 mm aluminium i røret, det tilføjede aluminium og kobberet: $e^{-\\mu(E)\\,x}$ med dæmpningskoefficienter fra NIST.</p>
<p>Huddosis er den energi, strålen afsætter i det første lag vand. Signal er energien efter 20 cm vand. Knoglekontrast er, hvor meget 1 cm knogle i stedet for væv sænker signalet. HVL er den tykkelse aluminium, der halverer luftkermaen (dosis i luft). Op til 80 kV passer HVL med standardstrålerne; over 100 kV er modellens HVL lidt for lav.</p>
<p><b>Heel-effekten.</b> En foton, der går i vinklen $\\varphi$ mod anodesiden, skal gennem anoden ad en vej, der er proportional med $1/\\sin(\\theta - \\varphi)$, hvor $\\theta$ er anodevinklen. Styrken er $e^{-k/\\sin(\\theta-\\varphi)}$, med $k$ sat, så et felt på 36 cm ved 100 cm og 12° er 45 % stærkere ved katodekanten end ved anodekanten (Bushong). Når $\\varphi \\ge \\theta$, skærer anoden strålen af. Lårbenet er 18 cm tykt ved hoften og 11 cm ved knæet, med $\\mu$ = 0,2 pr. cm.</p>
<p><b>AEC.</b> Thorax PA med lunger (transmission 1), rygsøjle og hjerte (cirka 0,3) og luft ved siden af (3). Hvert kammer måler gennemsnittet under sig. Eksponeringen stopper, når de valgte kamres gennemsnit når niveauet, eller ved back-up-tiden (6 gange den normale tid). Hvert dosistrin er 20 % i modellen; tjek, hvad jeres anlæg bruger. Højere kV giver flere fotoner igennem, $(kV/110)^2$. REX er 250 ved rigtig indstilling og følger dosis til detektoren under lungerne. Billedet har kvantestøj og skaleres som på et DR-anlæg.</p>`,
    groups: [
      ["Spektret", [
        ["Højere kV", "Gå fra 80 til 100 kV. Hvad sker der med spektret og middelenergien?", "Kurven bliver både højere og bredere: flere fotoner, og de stærkeste har mere energi. Middelenergien stiger fra 43 til 49 keV."],
        ["Karakteristisk stråling", "Skru kV ned fra 80 til 65. Hvad sker der med de smalle toppe? Hvorfor?", "De forsvinder under 69,5 kV, fordi elektronerne ikke længere har energi nok til at slå en K-elektron løs i wolfram."],
        ["Flere mAs", "Fordobl mAs. Hvad ændrer sig, og hvad gør ikke?", "Kurven bliver dobbelt så høj, men har samme form. Middelenergi, HVL og kontrast er de samme; huddosis og signal fordobles."],
      ]],
      ["Filtrering", [
        ["Ingen tilføjet filtrering", "Sæt det tilføjede aluminium til 0. Hvad sker der med huddosis og signal?", "Huddosis bliver cirka 1,8 gange så stor, mens signalet kun stiger til cirka 1,15. De svage fotoner giver dosis til huden, men når ikke detektoren."],
        ["Kobber", "Slå 0,1 mm kobber til. Hvad vinder du, og hvad koster det?", "Huddosis pr. signal falder, og middelenergien stiger. Prisen er mindre signal, så mAs skal lidt op, og kontrasten falder en smule."],
      ]],
      ["Heel-effekt", [
        ["Hvor stor?", "Se på udgangspunktet: 12°, 100 cm, 36 cm felt. Hvor meget stærkere er strålen ved katodekanten?", "Cirka 1,45 gange, altså 45 % stærkere, som Bushong beskriver."],
        ["Vend lårbenet", "Vend hoften mod anoden. Hvad sker der med forskellen mellem hofte og knæ?", "Forskellen bliver større: den tykke hofte får nu den svageste del af strålen. Med hoften mod katoden udligner heel-effekten noget af forskellen i tykkelse."],
        ["Lille felt eller lang afstand", "Sæt feltet ned til 20 cm. Prøv så 36 cm felt ved 180 cm SID. Hvad sker der?", "Heel-effekten bliver meget mindre i begge tilfælde: der bruges kun den midterste del af strålen, hvor den er jævn."],
      ]],
      ["AEC", [
        ["Midterkammeret", "Slå sidekamrene fra og midterkammeret til. Hvad sker der med mAs, REX og billedet?", "Midterkammeret ligger over rygsøjlen, hvor kun cirka 30 % kommer igennem. Anlægget bliver ved: mAs og REX bliver cirka 3,3 gange så høje. Billedet ser lige lyst ud."],
        ["Forskudt patient", "Sæt patientforskydningen til 18 %. Hvad måler kamrene nu?", "Det ene kammer står delvis over rygsøjlen og bløddele. Eksponeringen bliver cirka 1,6 gange for lang."],
        ["Protese", "Slå protesen til. Hvad sker der? Hvad kunne du gøre?", "Metallet over højre kammer stopper strålen, så eksponeringen bliver cirka 1,7 gange for lang. Vælg kun venstre kammer, eller indstil manuelt."],
        ["For lille felt", "Sæt feltbredden til 30 %. Hvad sker der?", "Sidekamrene ligger uden for feltet og får næsten ingen stråling. Eksponeringen fortsætter til back-up-tiden, og REX bliver alt for høj."],
        ["Dosistrin", "Sæt dosisniveauet til +2. Hvad sker der med mAs og REX?", "Begge stiger med cirka 44 % (1,2 × 1,2). Kamrene måler stadig; de stopper bare ved et højere niveau."],
      ]],
      ["Fordybelse", [
        ["HVL", "Hvad er HVL ved udgangspunktet? Hvad sker der ved 120 kV og ved 0,2 mm Cu?", "Cirka 2,9 mm Al ved udgangspunktet. Både højere kV og mere filtrering gør strålen hårdere og HVL større."],
        ["Afskæring", "Sæt anodevinklen til 8° og feltet til 36 cm ved 100 cm. Hvad sker der? Hvad hjælper?", "Anoden skærer strålen af mod anodesiden, fordi feltets kant ligger i en større vinkel end anodevinklen. Længere afstand eller mindre felt hjælper."],
        ["kV og AEC", "Gå fra 110 til 125 kV med de rigtige kamre. Hvad sker der med mAs og patientdosis?", "mAs falder, fordi flere fotoner når kamrene, og patientdosis falder lidt. Prisen er lavere kontrast, som i spektrum-delen."],
      ], "deep"],
    ],
  },
  en: {
    title: "The X-ray tube", sub: "The beam before the patient: the tube, the spectrum, the heel effect, filtration and automatic exposure control. Two videos and a simulator.",
    grund: "Basic", deep: "Deeper level", back: "← Learn",
    parts: ["5a The tube and the beam", "5b Automatic exposure control"],
    partNote: "Watch the two parts in order. Each is about five to nine minutes.",
    simTitle: "Simulator: The X-ray tube",
    modes: { spec: "Spectrum and filter", heel: "Heel effect", aec: "AEC" },
    head: { spec: ["The X-ray spectrum", "Where the energy ends up"], heel: ["The tube and the field", "What the detector gets along the femur"],
            aec: ["PA chest on the stand", "The chambers"] },
    note: {
      spec: ["The curve shows how many photons the beam has at each energy. The grey curve is the starting point (80 kV, 10 mAs, 2.5 mm Al in total). The narrow peaks are tungsten's characteristic radiation; they exist only above 69.5 kV. The dashed lines are the mean energy.",
             "The bars compare with the starting point. Skin dose is the energy deposited in the skin. Signal is what reaches the detector through 20 cm of tissue. Contrast is the difference between 1 cm of bone and tissue. Filtration lowers the skin dose much more than the signal."],
      heel: ["The tube seen from the side, with the cathode on the left and the anode on the right. The cyan curve under the field is the strength of the beam: highest towards the cathode side. Towards the anode side the photons have to pass through more of the anode. Red area: the anode cuts the beam off completely.",
             "The femur is thick at the hip and thin at the knee. The grey line is the beam before the patient, the cyan line what gets through to the detector. The flatter the cyan line, the more even the image."],
      aec: ["The image is rescaled as on a DR system, so it is equally bright whatever the dose. The chambers are the small fields: orange is chosen. The cyan frame is the field (the collimation).",
            "The bars show how much radiation each chamber had received when the exposure stopped. The line is the level the system stops at. Only the chosen chambers (orange) count."],
    },
    tasks: "Tasks", answer: "Show answer", of: "of", prev: "Previous task", next: "Next task",
    model: "How the models work", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
    ctl: { mode: "Part", kv: "Kilovoltage", mas: "mAs", al: "Added aluminium", cu: "Copper filter", theta: "Anode angle", sid: "Source-to-image distance (SID)",
           len: "Field length along the tube", hip: "The hip faces the", cathode: "cathode", anode: "anode",
           L: "Left chamber", C: "Middle chamber", R: "Right chamber", on: "On", off: "Off", field: "Field width", shift: "Patient off centre",
           pros: "Prosthesis over the right lung", dens: "Dose level (steps)", reset: "Reset" },
    help: { kv: "The voltage: how energetic the photons can get.", mas: "How many electrons, and so photons.",
            al: "On top of 1 mm inherent filtration in the tube.", cu: "An extra filter that can be switched on and off.",
            theta: "The angle of the anode's sloping face.", sid: "A longer distance: the beam uses only a smaller angle.",
            len: "The length of the field along the cathode–anode axis.", hip: "Put the thick end under the cathode.",
            field: "How wide the field is, as a percentage of the detector.", shift: "The patient is not in the middle of the detector.",
            dens: "Each step changes the level the system stops at.", L: "", C: "", R: "", pros: "" },
    k: { mean: "Mean energy", hvl: "Half-value layer (HVL)", skin: "Skin dose", det: "Signal at the detector", con: "Bone contrast", eff: "Skin dose per signal",
         ratio: "Cathode edge / anode edge", cover: "Field covered", even: "Difference hip / knee", mas: "mAs", rex: "REX", pat: "Patient dose", time: "Stopped by" },
    f: { mean: "average photon energy", hvl: "mm aluminium that halves the beam", rel: "relative to the starting point",
         con: "1 cm of bone against tissue", eff: "lower is better", ratio: "beam strength at the edges", cover: c => c ? "the whole field" : "the anode cuts off",
         even: "signal at the detector, lower is more even", mas: "2.5 mAs at the right setting", rex: r => r < 125 ? "too little: noise" : r <= 400 ? "fine" : "dose too high",
         pat: "relative to the right setting", time: b => b ? "the backup time" : "the chambers had enough" },
    lbl: { energy: "energy (keV)", count: "number of photons", ref: "starting point", now: "now", cathode: "cathode", anode: "anode", hip: "hip", knee: "knee",
           cutoff: "cut off", before: "before the patient", after: "to the detector", enough: "stop", skin: "skin dose", det: "signal", con: "contrast" },
    dec: ".",
    modelText: `<p><b>The spectrum.</b> Bremsstrahlung after Kramers: $(kV - E)/E$ photons per keV. Above 69.5 kV, tungsten's K peaks at 59 and 67 keV are added. The beam is attenuated by the anode itself (counted as 1 mm of aluminium), 1 mm of aluminium in the tube, the added aluminium and the copper: $e^{-\\mu(E)\\,x}$ with attenuation coefficients from NIST.</p>
<p>Skin dose is the energy the beam deposits in the first layer of water. Signal is the energy after 20 cm of water. Bone contrast is how much 1 cm of bone instead of tissue lowers the signal. HVL is the thickness of aluminium that halves the air kerma (the dose in air). Up to 80 kV the HVL matches the standard beams; above 100 kV the model's HVL is a little low.</p>
<p><b>The heel effect.</b> A photon going at the angle $\\varphi$ towards the anode side has to pass through the anode along a path proportional to $1/\\sin(\\theta - \\varphi)$, where $\\theta$ is the anode angle. The strength is $e^{-k/\\sin(\\theta-\\varphi)}$, with $k$ set so a 36 cm field at 100 cm and 12° is 45 % stronger at the cathode edge than at the anode edge (Bushong). When $\\varphi \\ge \\theta$, the anode cuts the beam off. The femur is 18 cm thick at the hip and 11 cm at the knee, with $\\mu$ = 0.2 per cm.</p>
<p><b>AEC.</b> A PA chest with lungs (transmission 1), spine and heart (about 0.3) and air beside the body (3). Each chamber measures the average under it. The exposure stops when the chosen chambers' average reaches the level, or at the backup time (6 times the normal time). Each dose step is 20 % in the model; check what your system uses. Higher kV gives more photons through, $(kV/110)^2$. REX is 250 at the right setting and follows the dose to the detector under the lungs. The image has quantum noise and is rescaled as on a DR system.</p>`,
    groups: [
      ["The spectrum", [
        ["Higher kV", "Go from 80 to 100 kV. What happens to the spectrum and the mean energy?", "The curve gets both taller and wider: more photons, and the strongest have more energy. The mean energy rises from 43 to 49 keV."],
        ["Characteristic radiation", "Turn the kV down from 80 to 65. What happens to the narrow peaks? Why?", "They disappear below 69.5 kV, because the electrons no longer have enough energy to knock a K electron loose in tungsten."],
        ["More mAs", "Double the mAs. What changes, and what does not?", "The curve gets twice as tall but keeps its shape. Mean energy, HVL and contrast stay the same; skin dose and signal double."],
      ]],
      ["Filtration", [
        ["No added filtration", "Set the added aluminium to 0. What happens to the skin dose and the signal?", "The skin dose rises by a factor of about 1.8, while the signal rises only to about 1.15. The weak photons give dose to the skin but do not reach the detector."],
        ["Copper", "Switch on 0.1 mm of copper. What do you gain, and what does it cost?", "The skin dose per signal falls, and the mean energy rises. The price is less signal, so the mAs must go up a little, and the contrast drops slightly."],
      ]],
      ["Heel effect", [
        ["How large?", "Look at the starting point: 12°, 100 cm, 36 cm field. How much stronger is the beam at the cathode edge?", "About 1.45 times, so 45 % stronger, as Bushong describes."],
        ["Turn the femur", "Turn the hip towards the anode. What happens to the difference between hip and knee?", "The difference gets larger: the thick hip now gets the weakest part of the beam. With the hip towards the cathode, the heel effect evens out some of the difference in thickness."],
        ["Small field or long distance", "Set the field to 20 cm. Then try a 36 cm field at 180 cm SID. What happens?", "The heel effect becomes much smaller in both cases: only the middle part of the beam is used, where it is even."],
      ]],
      ["AEC", [
        ["The middle chamber", "Switch the side chambers off and the middle chamber on. What happens to the mAs, REX and the image?", "The middle chamber lies over the spine, where only about 30 % gets through. The system keeps going: mAs and REX become about 3.3 times higher. The image looks equally bright."],
        ["Patient off centre", "Set the patient offset to 18 %. What do the chambers measure now?", "One chamber now sits partly over the spine and soft tissue. The exposure becomes about 1.6 times too long."],
        ["Prosthesis", "Switch the prosthesis on. What happens? What could you do?", "The metal over the right chamber stops the beam, so the exposure becomes about 1.7 times too long. Choose only the left chamber, or set the exposure manually."],
        ["Field too small", "Set the field width to 30 %. What happens?", "The side chambers lie outside the field and get almost no radiation. The exposure goes on until the backup time, and REX becomes far too high."],
        ["Dose steps", "Set the dose level to +2. What happens to the mAs and REX?", "Both rise by about 44 % (1.2 × 1.2). The chambers still measure; they just stop at a higher level."],
      ]],
      ["Deeper level", [
        ["HVL", "What is the HVL at the starting point? What happens at 120 kV and with 0.2 mm Cu?", "About 2.9 mm Al at the starting point. Both higher kV and more filtration make the beam harder and the HVL larger."],
        ["Cutoff", "Set the anode angle to 8° and the field to 36 cm at 100 cm. What happens? What helps?", "The anode cuts the beam off on the anode side, because the edge of the field lies at a larger angle than the anode angle. A longer distance or a smaller field helps."],
        ["kV and AEC", "Go from 110 to 125 kV with the right chambers. What happens to the mAs and the patient dose?", "The mAs falls, because more photons reach the chambers, and the patient dose falls a little. The price is lower contrast, as in the spectrum part."],
      ], "deep"],
    ],
  },
};

// ---- the page (everything below needs a browser) -------------------------------------
if (typeof document !== "undefined") {
const START = { mode: "spec", kv: 80, mas: 10, al: 1.5, cu: 0, theta: 12, sid: 100, len: 36, hip: "cathode",
                L: "on", C: "off", R: "on", field: 100, shift: 0, pros: "off", dens: 0, kvA: 110 };
const S = { lang: "da", level: "grund", part: 0, ...START };
const $ = id => document.getElementById(id);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fmt = (v, d = 1) => v.toFixed(d).replace(".", T[S.lang].dec);
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
function rng(seed) { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }

let M = null;
function compute() {
  if (S.mode === "spec") M = specModel(S);
  else if (S.mode === "heel") M = heelModel();
  else M = aecModel({ ...S, kv: S.kvA });
}

// ---- spectrum mode ----
function drawSpec() {
  const [ctx, W, H] = fit($("main")); if (W < 10) return;
  const L = T[S.lang].lbl, x0 = 40, y0 = H - 28, x1 = W - 10, y1 = 14;
  const ymax = Math.max(Math.max(...SPEC_REF.n) * 1.6, Math.max(...M.n) * 1.05), X = e => x0 + e / 150 * (x1 - x0), Y = v => y0 - Math.min(v / ymax, 1.04) * (y0 - y1);
  line(ctx, [[x0, y1], [x0, y0], [x1, y0]], css("--line"));
  for (const e of [20, 40, 60, 80, 100, 120, 140]) text(ctx, String(e), X(e), y0 + 14, css("--muted"), "center", 10);
  text(ctx, L.energy, x1, y0 - 6, css("--muted"), "right", 11); text(ctx, L.count, x0 + 4, y1 + 4, css("--muted"), "left", 11);
  line(ctx, ES.map((e, i) => [X(e), Y(SPEC_REF.n[i])]), css("--muted"), 1.5);
  line(ctx, ES.map((e, i) => [X(e), Y(M.n[i])]), css("--signal"), 2.2);
  line(ctx, [[X(SPEC_REF.mean), y0], [X(SPEC_REF.mean), y0 - 30]], css("--muted"), 1.2, [4, 3]);
  line(ctx, [[X(M.mean), y0], [X(M.mean), y0 - 30]], css("--amber"), 1.5, [4, 3]);
  line(ctx, [[X(S.kv), y0], [X(S.kv), y0 - 12]], css("--amber"), 2);
  text(ctx, `${S.kv} kV`, X(S.kv), y0 - 16, css("--amber"), "center", 11);
}
function drawSpecBars() {
  const [ctx, W, H] = fit($("side")); if (W < 10) return;
  const L = T[S.lang].lbl, vals = [[L.skin, M.skin / SPEC_REF.skin, css("--hot")], [L.det, M.det / SPEC_REF.det, css("--signal")],
                                   [L.con, M.contrast / SPEC_REF.contrast, css("--amber")]];
  const vmax = Math.max(2, ...vals.map(v => v[1])) * 1.1, bw = W / 3 * 0.5, y0 = H - 24;
  line(ctx, [[0, y0], [W, y0]], css("--line"));
  const yref = y0 - (1 / vmax) * (y0 - 18);
  line(ctx, [[0, yref], [W, yref]], css("--muted"), 1, [4, 4]);
  // only "×1" at the left edge: a longer label ran into the first bar's value; the note below says what 1 is
  text(ctx, "×1", 2, yref - 4, css("--muted"), "left", 10);
  vals.forEach(([lbl, v, col], i) => {
    const cx = W / 3 * (i + 0.5), h = v / vmax * (y0 - 18);
    ctx.fillStyle = col; ctx.globalAlpha = 0.8; ctx.fillRect(cx - bw / 2, y0 - h, bw, h); ctx.globalAlpha = 1;
    text(ctx, `×${fmt(v, 2)}`, cx, y0 - h - 5, css("--fg"), "center", 12);
    text(ctx, lbl, cx, y0 + 15, css("--muted"), "center", 11);
  });
}

// ---- heel mode ----
const FEMUR = u => 18 - 7 * u;            // thigh thickness in cm along the femur, u = 0 at the hip, 1 at the knee
function heelModel() {
  const half = S.len / 2, n = 81, xs = [], I = [], sig = [];
  for (let k = 0; k < n; k++) {
    const x = -half + (k / (n - 1)) * S.len;                         // cm along the field, + towards the anode
    const phi = Math.atan(x / S.sid) * 180 / Math.PI;
    const i = heel(phi, S.theta);
    const u = S.hip === "cathode" ? k / (n - 1) : 1 - k / (n - 1);     // where on the femur this point is
    xs.push(x); I.push(i); sig.push(i * Math.exp(-0.2 * FEMUR(u)));
  }
  const c = heel(0, S.theta);
  const hipSig = S.hip === "cathode" ? sig[0] : sig[n - 1], kneeSig = S.hip === "cathode" ? sig[n - 1] : sig[0];
  return { xs, I: I.map(v => v / c), sig, ratio: I[n - 1] > 0 ? I[0] / I[n - 1] : Infinity, cover: I[n - 1] > 0,
           even: hipSig > 0 && kneeSig > 0 ? kneeSig / hipSig : Infinity };
}
function drawHeel() {
  const [ctx, W, H] = fit($("main")); if (W < 10) return;
  const L = T[S.lang].lbl, cx = W / 2, top = 30, scale = (H - 110) / 180;           // px per cm vertically
  const fy = top + 22, dy = fy + S.sid * scale, half = S.len / 2, hs = (W * 0.42) / 43;   // horizontal px per cm
  // the anode (right) and cathode (left), drawn at the focal spot; the face tilted by the anode angle
  const a = S.theta * Math.PI / 180, fl = 60;      // the anode drawn large, so its tilted face shows
  const fx = cx + 2 + fl * Math.sin(a) / 2;          // the focal spot: the middle of the anode face
  ctx.fillStyle = "#5A6070";
  ctx.beginPath(); ctx.moveTo(cx + 2, fy - fl * Math.cos(a) * 0.5); ctx.lineTo(cx + 2 + fl * Math.sin(a), fy + fl * Math.cos(a) * 0.5);
  ctx.lineTo(cx + 80, fy + fl * Math.cos(a) * 0.5); ctx.lineTo(cx + 80, fy - fl * Math.cos(a) * 0.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = css("--muted"); ctx.fillRect(cx - 46, fy - 8, 22, 16);
  text(ctx, L.cathode, cx - 35, fy - 14, css("--muted"), "center", 11); text(ctx, L.anode, cx + 30, fy - 14 - fl * 0.5, css("--muted"), "center", 11);
  ctx.fillStyle = css("--amber"); ctx.beginPath(); ctx.arc(fx, fy, 3, 0, 7); ctx.fill();
  // the beam edges and, where the anode cuts it, a red wedge
  const cut = Math.tan(a) * S.sid;                                                 // cm from the centre where the anode's shadow begins
  line(ctx, [[fx, fy], [cx - half * hs, dy]], PHOTON, 1.2);
  line(ctx, [[fx, fy], [cx + Math.min(half, cut) * hs, dy]], PHOTON, 1.2);
  if (cut < half) { ctx.fillStyle = "rgba(255,77,109,.35)"; ctx.fillRect(cx + cut * hs, dy - 4, (half - cut) * hs, 8); text(ctx, L.cutoff, cx + half * hs, dy + 16, css("--hot"), "right", 11); }
  line(ctx, [[cx - 0.5 * W * 0.46, dy], [cx + 0.5 * W * 0.46, dy]], css("--signal"), 4);
  text(ctx, `SID ${S.sid} cm`, cx - half * hs - 6, (fy + dy) / 2, css("--muted"), "right", 11);
  // the intensity profile under the field, 1 = the central ray
  const py = H - 14, ph = 70, PY = v => py - (Math.min(Math.max(v, 0.4), 1.2) - 0.4) / 0.8 * ph;   // 0.4 to 1.2 of the central ray
  line(ctx, M.xs.map((x, k) => [cx + x * hs, PY(M.I[k])]), css("--signal"), 2.2);
  line(ctx, [[cx - half * hs, PY(1)], [cx + half * hs, PY(1)]], css("--muted"), 1, [3, 4]);
  text(ctx, "100 %", cx - half * hs - 4, PY(1) + 3, css("--muted"), "right", 10);
  text(ctx, L.cathode, cx - half * hs, py + 0, css("--muted"), "left", 10); text(ctx, L.anode, cx + half * hs, py, css("--muted"), "right", 10);
}
function drawHeelSide() {
  const [ctx, W, H] = fit($("side")); if (W < 10) return;
  const L = T[S.lang].lbl, x0 = 10, x1 = W - 10, y0 = H - 40, y1 = 16, n = M.xs.length;
  // the femur as a band, thick at the hip
  const hipLeft = S.hip === "cathode";
  ctx.fillStyle = "#6B5A55";
  ctx.beginPath();
  for (let k = 0; k < n; k++) { const u = hipLeft ? k / (n - 1) : 1 - k / (n - 1), x = x0 + k / (n - 1) * (x1 - x0); const th = FEMUR(u) * 1.2; k ? ctx.lineTo(x, H - 22 - th) : ctx.moveTo(x, H - 22 - th); }
  for (let k = n - 1; k >= 0; k--) { const u = hipLeft ? k / (n - 1) : 1 - k / (n - 1), x = x0 + k / (n - 1) * (x1 - x0); const th = FEMUR(u) * 1.2; ctx.lineTo(x, H - 22 + th); }
  ctx.closePath(); ctx.fill();
  text(ctx, L.hip, hipLeft ? x0 + 4 : x1 - 4, H - 4, css("--fg"), hipLeft ? "left" : "right", 11);
  text(ctx, L.knee, hipLeft ? x1 - 4 : x0 + 4, H - 4, css("--fg"), hipLeft ? "right" : "left", 11);
  const imax = Math.max(...M.I) * 1.05, smax = Math.max(...M.sig) * 1.1 || 1;
  const yb = H - 60, hh = yb - y1;
  line(ctx, M.I.map((v, k) => [x0 + k / (n - 1) * (x1 - x0), yb - v / imax * hh]), css("--muted"), 1.5);
  line(ctx, M.sig.map((v, k) => [x0 + k / (n - 1) * (x1 - x0), yb - v / smax * hh]), css("--signal"), 2.4);
  text(ctx, L.before, x1, y1 + 2, css("--muted"), "right", 10); text(ctx, L.after, x1, y1 + 16, css("--signal"), "right", 10);
  text(ctx, L.cathode, x0, y1 + 2, css("--muted"), "left", 10);
}

// ---- AEC mode ----
function drawAec() {
  const [ctx, W, H] = fit($("main")); if (W < 10) return;
  const h = H - 10, w = h * NX / NY, ox = (W - w) / 2, oy = 5;
  const off = document.createElement("canvas"); off.width = NX; off.height = NY;
  const octx = off.getContext("2d"), img = octx.createImageData(NX, NY), r = rng(3);
  const g = () => { let s = 0; for (let k = 0; k < 6; k++) s += r(); return (s - 3) / Math.sqrt(0.5); };
  const lung = 300 * M.rex / 250;                                       // photons per pixel under the lung
  for (let k = 0; k < NX * NY; k++) {
    const n = lung * M.t[k] * (S.kvA / 110) ** 0, v = n + Math.sqrt(Math.max(n, 1)) * g();
    const gr = Math.round(Math.min(255, Math.max(0, 220 - 150 * v / Math.max(lung, 1))));   // rescaled: the lung always lands on the same grey
    img.data.set([gr, gr, gr, 255], k * 4);
  }
  octx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(off, ox, oy, w, h);
  ctx.strokeStyle = css("--fg"); ctx.strokeRect(ox, oy, w, h);
  for (const [name, [cx, cy]] of Object.entries(CHAMBERS)) {
    const on = S[name] === "on";
    ctx.strokeStyle = on ? css("--amber") : css("--muted"); ctx.lineWidth = on ? 2.5 : 1.5;
    ctx.strokeRect(ox + (cx - CW / 2) * w, oy + (cy - CH / 2) * h, CW * w, CH * h);
    text(ctx, name, ox + cx * w, oy + (cy - CH / 2) * h - 4, on ? css("--amber") : css("--muted"), "center", 11);
  }
  ctx.lineWidth = 1;
  if (S.field < 100) { ctx.strokeStyle = css("--signal"); ctx.lineWidth = 2; ctx.strokeRect(ox + (0.5 - S.field / 200) * w, oy + 2, S.field / 100 * w, h - 4); ctx.lineWidth = 1; }
}
function drawAecSide() {
  const [ctx, W, H] = fit($("side")); if (W < 10) return;
  const L = T[S.lang].lbl, y0 = H - 22, top = 14, lvl = (1 + STEP) ** S.dens, vmax = Math.max(2.2, lvl * 1.5);
  const Y = v => y0 - Math.min(v, vmax) / vmax * (y0 - top), bw = W / 3 * 0.42;
  ["L", "C", "R"].forEach((c, i) => {
    const cx = W / 3 * (i + 0.5), v = M.reads[c] * M.time, on = S[c] === "on";
    ctx.fillStyle = on ? css("--amber") : css("--muted"); ctx.globalAlpha = on ? 0.85 : 0.4;
    ctx.fillRect(cx - bw / 2, Y(v), bw, y0 - Y(v)); ctx.globalAlpha = 1;
    text(ctx, c, cx, y0 + 15, on ? css("--amber") : css("--muted"), "center", 12);
  });
  line(ctx, [[0, Y(lvl)], [W, Y(lvl)]], css("--amber"), 1.5, [5, 4]);
  text(ctx, L.enough, W - 2, Y(lvl) - 4, css("--amber"), "right", 10);
}

function readouts() {
  const L = T[S.lang], row = (cls, key, value, foot) =>
    `<div class="metric ${cls}"><div class="k">${L.k[key]}</div><div class="v">${value}</div><div class="f">${foot}</div></div>`;
  let h = "";
  if (S.mode === "spec") {
    h = row("ok", "mean", `${fmt(M.mean, 0)} keV`, L.f.mean) + row("", "hvl", `${fmt(M.hvl, 1)} mm Al`, L.f.hvl) +
        row("err", "skin", `×${fmt(M.skin / SPEC_REF.skin, 2)}`, L.f.rel) + row("ok", "det", `×${fmt(M.det / SPEC_REF.det, 2)}`, L.f.rel) +
        row("mag", "con", `${fmt(M.contrast * 100, 0)} %`, L.f.con) +
        row("", "eff", `×${fmt((M.skin / M.det) / (SPEC_REF.skin / SPEC_REF.det), 2)}`, L.f.eff);
  } else if (S.mode === "heel") {
    h = row("mag", "ratio", M.cover ? `×${fmt(M.ratio, 2)}` : "—", L.f.ratio) + row(M.cover ? "ok" : "err", "cover", M.cover ? "✓" : "✗", L.f.cover(M.cover)) +
        row("", "even", isFinite(M.even) ? `×${fmt(M.even, 2)}` : "—", L.f.even);
  } else {
    h = row("mag", "mas", fmt(M.mas, 1), L.f.mas) + row(M.rex < 125 || M.rex > 400 ? "err" : "ok", "rex", String(Math.round(M.rex)), L.f.rex(M.rex)) +
        row(M.patient > 1.3 ? "err" : "", "pat", `×${fmt(M.patient, 2)}`, L.f.pat) + row(M.backup ? "err" : "", "time", "", L.f.time(M.backup));
  }
  $("readout").innerHTML = h;
}

// ---- controls, text, tasks ----------------------------------------------------------
function buildControls() {
  const L = T[S.lang].ctl, box = $("controls"), Hh = T[S.lang].help;
  const help = k => S.level === "grund" && Hh[k] ? `<p class="help">${Hh[k]}</p>` : "";
  const seg = (key, opts, label = L[key]) => `<div class="ctl"><label><span>${label}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${key}" data-v="${val}" aria-pressed="${String(S[key]) === String(val)}">${lbl}</button>`).join("") +
    `</div>${help(key)}</div>`;
  const slider = (k, mn, mx, st, f, label = L[k]) =>
    `<div class="ctl"><label for="s-${k}"><span>${label}</span><span id="o-${k}">${f(S[k])}</span></label>` +
    `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}">${help(k === "kvA" ? "kv" : k)}</div>`;
  const SL = {
    spec: [["kv", 40, 150, 1, v => `${v} kV`], ["mas", 1, 40, 1, v => `${v} mAs`], ["al", 0, 5, 0.5, v => `${fmt(v, 1)} mm`]],
    heel: [["theta", 7, 17, 1, v => `${v}°`], ["sid", 100, 180, 5, v => `${v} cm`], ["len", 18, 43, 1, v => `${v} cm`]],
    aec: [["kvA", 70, 125, 5, v => `${v} kV`], ["field", 20, 100, 5, v => `${v} %`], ["shift", -25, 25, 1, v => `${v} %`], ["dens", -3, 3, 1, v => (v > 0 ? "+" : "") + v]],
  }[S.mode];
  const M_ = T[S.lang].modes;
  let html = seg("mode", [["spec", M_.spec], ["heel", M_.heel], ["aec", M_.aec]]);
  const sl = k => slider(...SL.find(s => s[0] === k), k === "kvA" ? L.kv : L[k]);
  if (S.mode === "spec") html += sl("kv") + sl("mas") + sl("al") + seg("cu", [[0, "0"], [0.1, "0,1 mm".replace(",", T[S.lang].dec)], [0.2, "0,2 mm".replace(",", T[S.lang].dec)], [0.3, "0,3 mm".replace(",", T[S.lang].dec)]]);
  if (S.mode === "heel") html += sl("theta") + sl("sid") + sl("len") + seg("hip", [["cathode", L.cathode], ["anode", L.anode]]);
  if (S.mode === "aec") html += ["L", "C", "R"].map(c => seg(c, [["on", L.on], ["off", L.off]])).join("") + sl("kvA") + sl("field") + sl("shift") +
    seg("pros", [["off", L.off], ["on", L.on]]) + sl("dens");
  box.innerHTML = html + `<div class="ctl"><button class="reset" id="reset">${L.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    const k = b.dataset.k; S[k] = k === "cu" ? +b.dataset.v : b.dataset.v;
    if (k === "mode") buildText();
    buildControls(); update();
  });
  SL.forEach(([k, , , , f]) => {
    const el = $(`s-${k}`);
    el.oninput = () => { S[k] = +el.value; $(`o-${k}`).textContent = f(S[k]); updateSoon(); };
  });
  $("reset").onclick = () => { const m = S.mode; Object.assign(S, START, { mode: m }); buildControls(); update(); };
}
const groups = () => T[S.lang].groups.filter(g => g[2] !== "deep" || S.level === "deep");
let task = 0;
function buildCard() {
  const L = T[S.lang], flat = groups().flatMap(([g, items]) => items.map((it, k) => [g, k + 1, items.length, ...it]));
  task = Math.min(task, flat.length - 1);
  const [g, k, n, h, q, a] = flat[task];
  $("taskcard").innerHTML =
    `<div class="tc-head"><span>${g} · ${k} ${L.of} ${n}</span>` +
    `<span class="seg"><button id="tc-prev" aria-label="${L.prev}">‹</button><button id="tc-next" aria-label="${L.next}">›</button></span></div>` +
    `<h4>${h}</h4><p class="q">${withMath(q)}</p>` +
    `<details class="answer"><summary>${L.answer}</summary><p class="a">${withMath(a)}</p></details>`;
  const go = d => { task = (task + d + flat.length) % flat.length; buildCard(); };
  $("tc-prev").onclick = () => go(-1);
  $("tc-next").onclick = () => go(1);
}
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
  $("model-text").innerHTML = withMath(L.modelText);
  $("task-list").innerHTML = groups().map(([g, items]) =>
    `<h4 class="tgroup">${g}</h4>` + items.map(([h, q, a]) =>
      `<details><summary>${h}</summary><p class="q">${withMath(q)}</p><details class="answer">` +
      `<summary>${L.answer}</summary><p class="a">${withMath(a)}</p></details></details>`).join("")).join("");
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
let pending = false;
function updateSoon() { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; update(); }); } }
function all() { setPressed(); buildText(); buildControls(); update(); }
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
