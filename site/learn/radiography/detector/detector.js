// Detector page (video 1a, "From photon to number"): the video, and a simulator of the chain from
// X-ray photon to number. Language and level live in the address (?lang=da&level=deep), not in storage.
// The model, written out in the "How the model works" box:
//
//   absorbed share      A = 1 − e^(−t/λ)            λ: how deep a 70 kV beam gets into the layer
//   light spread        σ = k · t                    powder spreads the light, needles guide it, selenium has no light
//   fill factor         FF = ((p − 20 µm) / p)²      the electronics take a fixed 20 µm strip of each element
//   sharpness (MTF)     e^(−2π²σ²f²) · sinc(a·f)     a = the sensitive width; the image can show up to 1/(2p)
//   grey levels         2^bits
//   DQE (deep)          A · Swank factor             the noise simulator uses 0.65 for CsI and 0.35 for GOS

const DET = {
  gos: { lam: 400, swank: 0.75, k: 0.5, t0: 250 },     // powder: light spreads to all sides, more the thicker it is
  csi: { lam: 400, swank: 0.84, k: 0.13, t0: 600 },    // needles guide the light down
  se: { lam: 1100, swank: 0.95, k: 0.005, t0: 1000 },  // direct: the field pulls the charge straight down
};
const EDGE = 20;                                   // µm of every element taken by the transistor and lines
const FREQS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6];   // line pairs per mm in the bar phantom
const LP = 4, GAP = 1.2, MARGIN = 1.5;              // line pairs per group, mm between groups and at the ends
const DX = 0.002;                                   // mm: the fine grid the phantom is computed on
const DETECTOR_MM = 430;                            // a 43 cm × 43 cm detector, for the matrix and file size

function model(s) {
  const d = DET[s.det], A = 1 - Math.exp(-s.t / d.lam), sigma = d.k * s.t + (s.det === "se" ? 3 : 0);
  const sens = s.px - EDGE, ff = (sens / s.px) ** 2, nyq = 1000 / (2 * s.px);
  const mtf = f => Math.exp(-2 * Math.PI ** 2 * (sigma / 1000) ** 2 * f * f) * sinc(sens / 1000 * f);
  let limit = 0;
  for (let f = 0.05; f <= nyq + 1e-9; f += 0.01) { if (mtf(f) >= 0.1) limit = f; else break; }
  limit = Math.min(limit, nyq);
  const ref = (1 - Math.exp(-600 / 400)) * ((130 / 150) ** 2) * 150 * 150;    // CsI 600 µm, 150 µm pixel
  const matrix = Math.round(DETECTOR_MM / (s.px / 1000)), bytes = s.bits > 8 ? 2 : 1;
  return { A, sigma, ff, sens, nyq, mtf, limit, byLight: limit < nyq - 0.02, dqe: A * d.swank,
           signal: A * ff * s.px * s.px / ref, levels: 2 ** s.bits, qerr: 100 / 2 ** (s.bits + 1),
           matrix, mb: matrix * matrix * bytes / 1e6, N: 900 * (A * d.swank / 0.65) * (s.px / 150) ** 2 };
}
function sinc(x) { return x === 0 ? 1 : Math.abs(Math.sin(Math.PI * x) / (Math.PI * x)); }

const T = {
  da: {
    title: "Fra foton til tal",
    sub: "Video 1a om det digitale billede: hvordan røntgenfotonen bliver til et tal i en matrix. Og en simulator, hvor du selv vælger detektor, lagtykkelse, pixelstørrelse og bit.",
    grund: "Grund", deep: "Fordybelse", back: "← Læring",
    videoNote: "Fordybelsen tilføjer DQE, selen og mammografi, fill factor som formel, CR-udlæsning, kvantiseringsfejl og Nyquist-frekvens.",
    chapters: "Kapitler",
    list: ["Fra skygge til tal", "Detektoren", "Detektorelementet og fill factor", "Udlæsning",
           "Fra spænding til tal", "Matrix, pixel og opløsning", "Opsummering"],
    simTitle: "Simulator: Fra foton til tal",
    chain: "Kæden, tegnet i målestok", wedge: "Bitdybde: en glat gråkile", phantom: "Linjepar-fantom: det detektoren så",
    prof: "En linje gennem fantomet",
    chainNote: "En røntgenfoton (gul) bliver opfanget i laget. I en indirekte detektor bliver den til lys, som spreder sig på vej ned til dioderne (cyan kegle). I selen bliver den til ladning, som går lige ned. Under laget sidder detektorelementerne. Den cyan del af hvert element er følsom; den grå strimmel er transistor og ledninger, som ikke opfanger noget. Til højre: ét element set fra oven, og det tal, ADC'en laver af det.",
    wedgeNote: "Øverst hele kilen fra sort til hvid. Nederst kun 3 % af kilen, strakt ud over hele bredden, som når du sætter et smalt vindue. Med få bit ser du trin. Skærmen viser kun omkring 256 gråtoner, så forskellen på 12 og 14 bit ses først, når du vinduer smalt.",
    phantomNote: "Blystreger (lyse) med mellemrum, i grupper der bliver tættere mod højre. Tallet under hver gruppe er linjepar pr. mm. Cyan tal: gruppen kan ses. Grå tal: stregerne flyder sammen eller bliver til et forkert mønster. Den orange markering er den grænse, pixelstørrelsen sætter (Nyquist). Fantomet er ganget op, så hver pixel kan ses. Støjen i billedet er kvantestøj fra fotonerne. Modellen har ingen elektronisk støj og ingen spredt stråling.",
    profNote: "Den grå linje er fantomet selv: stregerne og mellemrummene. Den cyan trappe er det, detektoren målte, pixel for pixel, uden støj. Hvor trappen stadig går op og ned med stregerne, kan gruppen ses. Hvor den flader ud, er detaljen væk.",
    tasks: "Opgaver", answer: "Vis svar", of: "af", prev: "Forrige opgave", next: "Næste opgave",
    model: "Sådan virker modellen", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
    ctl: { det: "Detektor", t: "Lagtykkelse", px: "Pixelstørrelse", bits: "Bitdybde", gos: "GOS (pulver)", csi: "CsI (nåle)", se: "Selen (direkte)", reset: "Nulstil" },
    help: { det: "Pulver og nåle laver røntgen om til lys. Selen laver det direkte om til ladning.",
            t: "Et tykt lag fanger flere fotoner. Men i pulver spreder lyset sig mere, jo tykkere laget er.",
            px: "Små pixel viser flere detaljer, men elektronikken fylder relativt mere.",
            bits: "Hvor mange trin ADC'en kan dele signalet i." },
    k: { A: "Fotoner fanget", sigma: "Lysspredning", ff: "Fill factor", signal: "Signal pr. element", res: "Opløsning",
         levels: "Gråtoner", matrix: "Matrix, 43 × 43 cm", nyq: "Nyquist-frekvens", dqe: "DQE (ved 0 lp/mm)", qerr: "Kvantiseringsfejl", mb: "Filstørrelse" },
    f: { A: "af røntgenfotonerne, ved ca. 70 kV", sigma: s => s < 10 ? "ingen lys, ladningen går lige ned" : "lysets spredning til siden (σ)",
         ff: "af elementet er følsomt", signal: "i forhold til CsI, 150 µm", res: light => light ? "begrænset af lysspredningen" : "begrænset af pixelstørrelsen",
         levels: b => `2 opløftet i ${b}`, matrix: "pixel", nyq: "= 1 / (2 · pixelstørrelse)", dqe: "hvor godt detektoren udnytter fotonerne",
         qerr: "højst, af hele skalaen", mb: b => `${b > 8 ? 2 : 1} byte pr. pixel` },
    lp: "lp/mm", nyqLbl: "Nyquist", steps: "trin", whole: "hele kilen", zoom: "3 % af kilen, strakt ud",
    photon: "røntgenfoton", light: "lys", charge: "ladning", layer: "lag", elements: "detektorelementer", top: "ét element oven fra", adc: "ADC",
    dec: ",",
    modelText: `<p>Andelen af røntgenfotonerne, laget fanger: $A = 1 - e^{-t/\\lambda}$, med $\\lambda$ = 400 µm for CsI og GOS og 1100 µm for selen ved en stråle på cirka 70 kV. Selen fanger langt bedre ved de lave energier i mammografi. Mammografidetektorer bruger kun cirka 200 µm selen.</p>
<p>Lysets spredning til siden: $\\sigma = k \\cdot t$, med $k$ = 0,5 for pulver (GOS), 0,13 for nåle (CsI) og næsten 0 for selen, hvor feltet trækker ladningen lige ned.</p>
<p>Fill factor: $FF = ((p - 20)/p)^2$, fordi transistor og ledninger fylder en fast strimmel på 20 µm. 150 µm giver 75 %, 100 µm giver 64 %.</p>
<p>Skarpheden (MTF) er produktet af to dele, én fra lysspredningen og én fra elementets følsomme bredde: $e^{-2\\pi^2\\sigma^2 f^2} \\cdot \\text{sinc}(a f)$. Opløsningen er den højeste frekvens, hvor MTF er mindst 10 %, dog højst Nyquist-frekvensen $1/(2p)$.</p>
<p>Gråtoner: $2^{\\text{bit}}$. Kvantiseringsfejlen er højst et halvt trin. DQE ved 0 lp/mm er $A$ gange en Swank-faktor (0,75 GOS, 0,84 CsI, 0,95 selen), som tager højde for, at ikke alle fotoner giver lige meget lys eller ladning. Ved standardtykkelserne er DQE den samme som i støjsimulatoren (0,65 og 0,35). Modellen er forenklet: i en direkte detektor kan feltet bøje ladningen ind mod elektroden, så dens fill factor reelt er højere.</p>`,
    groups: [
      ["Krystallerne", [
        ["Pulver eller nåle", "Sammenlign GOS (250 µm) og CsI (600 µm). Hvilken fanger flest fotoner? Hvilken er skarpest?",
         "CsI vinder begge dele: den fanger 78 % mod 46 %, og lyset spreder sig mindre (78 µm mod 125 µm), fordi nålene leder det lige ned. Derfor kan CsI-laget gøres tykt uden at blive uskarpt."],
        ["Tykt pulver", "Vælg GOS, og skru laget op til 600 µm, så det er lige så tykt som CsI. Hvad vinder du, og hvad mister du?",
         "Du fanger lige så mange fotoner som CsI, 78 %. Men lyset spreder sig nu 300 µm til siden, og opløsningen falder til cirka 1,1 lp/mm. Tykkelsen er et kompromis i pulver."],
        ["Selen", "Skift til selen. Hvorfor er stregerne så skarpe? Og hvorfor fanger selen færre fotoner end CsI her?",
         "I selen er der intet lys, der kan sprede sig; ladningen går lige ned. Så er det kun pixelstørrelsen, der sætter grænsen. Men ved 70 kV fanger 1000 µm selen kun 60 %. Selen fanger bedst ved lav energi, derfor bruges det især til mammografi."],
      ]],
      ["Fill factor", [
        ["Mindre pixel", "Gå fra 150 til 100 µm. Hvad sker der med fill factor og signalet pr. element?",
         "Fill factor falder fra 75 % til 64 %, fordi elektronikken fylder det samme. Signalet pr. element falder til 0,38, fordi elementet både er mindre og har en mindre følsom del."],
        ["Mammografi", "Vælg selen og 70 µm. Hvad er fill factor? Hvad vinder du?",
         "Kun 51 %. Til gengæld kan detektoren vise op til 7,1 lp/mm, og selen har intet lys, der kan sprede sig. I mammografi er de små detaljer, som mikrokalk, det vigtigste."],
      ]],
      ["Bit", [
        ["1 bit", "Sæt bitdybden til 1. Hvordan ser kilen og fantomet ud?", "To trin: sort eller hvid. Alle gråtonerne er væk."],
        ["8 bit", "Sæt bitdybden til 8, og se på den nederste, strakte kile. Hvad ser du? Prøv 12.",
         "Ved 8 bit er der kun cirka 8 trin i de 3 %, så du ser striber. Ved 12 bit er der cirka 120, og kilen er glat. Derfor bruger DR 12 til 14 bit: billedet skal kunne vindues smalt uden trin."],
        ["Hvor mange gråtoner", "Hvor mange gråtoner giver 12 og 14 bit?", "4096 og 16 384. Hver ekstra bit fordobler antallet."],
      ]],
      ["Pixel og opløsning", [
        ["Store pixel", "Vælg CsI og 200 µm. Hvilke grupper kan ses? Hvad sker der med de tætteste?",
         "Grupperne op til 2,5 lp/mm. De tættere flyder sammen eller bliver til et forkert, grovere mønster: der skal mindst to pixel til et linjepar."],
        ["Hvad sætter grænsen", "Vælg GOS med 600 µm og 100 µm pixel. Er det pixelerne eller lyset, der sætter grænsen?",
         "Lyset. Pixelerne kunne vise 5 lp/mm, men lyset spreder sig så meget, at opløsningen kun bliver cirka 1,1 lp/mm. Små pixel hjælper ikke, hvis laget gør billedet uskarpt."],
        ["Matrix", "Hvor mange pixel har en 43 cm detektor med 150 µm pixel?", "Cirka 2867 × 2867, altså godt 8 millioner pixel."],
      ]],
      ["Formler", [
        ["Fill factor i hånden", "Et element er 150 µm, den følsomme flade 130 µm på hver led. Regn fill factor ud. Hvad hvis elementet er 100 µm?",
         "$FF = 130^2 / 150^2 \\approx 0{,}75$. Ved 100 µm er den følsomme flade 80 µm: $80^2/100^2 = 0{,}64$."],
        ["Nyquist", "Regn Nyquist-frekvensen ud for 100, 150 og 200 µm.", "$f_N = 1/(2p)$: 5, 3,3 og 2,5 lp/mm."],
        ["Kvantiseringsfejl", "Hvor stor er kvantiseringsfejlen højst ved 8 og ved 12 bit, i procent af skalaen?",
         "Et halvt trin: $1/(2 \\cdot 256) \\approx 0{,}2$ % og $1/(2 \\cdot 4096) \\approx 0{,}012$ %. Hver ekstra bit halverer den."],
        ["Filstørrelse", "Hvor meget fylder et billede på 3000 × 3000 pixel med 14 bit?", "14 bit gemmes i 2 byte: $3000 \\cdot 3000 \\cdot 2 = 18$ MB."],
        ["DQE", "Sammenlign DQE for CsI 600 µm og GOS 250 µm. Hvad betyder det for dosis?",
         "0,65 mod 0,35. GOS skal have næsten dobbelt så meget dosis for det samme signal-støj-forhold (samme kvantestøj). Se støjsimulatoren."],
      ], "deep"],
    ],
  },
  en: {
    title: "From photon to number",
    sub: "Video 1a on the digital image: how the X-ray photon becomes a number in a matrix. And a simulator where you choose the detector, layer thickness, pixel size and bits yourself.",
    grund: "Basic", deep: "Deeper level", back: "← Learn",
    videoNote: "The deeper level adds DQE, selenium and mammography, fill factor as a formula, CR readout, quantization error and the Nyquist frequency.",
    chapters: "Chapters",
    list: ["From shadow to numbers", "The detector", "The detector element and fill factor", "Readout",
           "From voltage to numbers", "Matrix, pixel and resolution", "Summary"],
    simTitle: "Simulator: From photon to number",
    chain: "The chain, drawn to scale", wedge: "Bit depth: a smooth grey wedge", phantom: "Line-pair phantom: what the detector saw",
    prof: "A line through the phantom",
    chainNote: "An X-ray photon (yellow) is absorbed in the layer. In an indirect detector it becomes light, which spreads on its way down to the photodiodes (cyan cone). In selenium it becomes charge, which goes straight down. Under the layer sit the detector elements. The cyan part of each element is sensitive; the grey strip is the transistor and the lines, which collect nothing. On the right: one element seen from above, and the number the ADC makes of it.",
    wedgeNote: "At the top, the whole wedge from black to white. Below, only 3 % of the wedge, stretched across the full width, as when you set a narrow window. With few bits you see steps. The screen shows only about 256 grey levels, so the difference between 12 and 14 bits shows only when you window narrowly.",
    phantomNote: "Lead bars (light) with gaps, in groups that get denser to the right. The number under each group is line pairs per mm. Cyan number: the group can be seen. Grey number: the bars blur together or turn into a false pattern. The orange mark is the limit the pixel size sets (Nyquist). The phantom is enlarged so each pixel can be seen. The noise in the image is quantum noise from the photons. The model has no electronic noise and no scatter.",
    profNote: "The grey line is the phantom itself: the bars and the gaps. The cyan staircase is what the detector measured, pixel by pixel, without noise. Where the staircase still goes up and down with the bars, the group can be seen. Where it flattens, the detail is gone.",
    tasks: "Tasks", answer: "Show answer", of: "of", prev: "Previous task", next: "Next task",
    model: "How the model works", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
    ctl: { det: "Detector", t: "Layer thickness", px: "Pixel size", bits: "Bit depth", gos: "GOS (powder)", csi: "CsI (needles)", se: "Selenium (direct)", reset: "Reset" },
    help: { det: "Powder and needles turn X-rays into light. Selenium turns them directly into charge.",
            t: "A thick layer catches more photons. But in powder the light spreads more, the thicker the layer.",
            px: "Small pixels show more detail, but the electronics take up relatively more space.",
            bits: "How many steps the ADC can divide the signal into." },
    k: { A: "Photons caught", sigma: "Light spread", ff: "Fill factor", signal: "Signal per element", res: "Resolution",
         levels: "Grey levels", matrix: "Matrix, 43 × 43 cm", nyq: "Nyquist frequency", dqe: "DQE (at 0 lp/mm)", qerr: "Quantization error", mb: "File size" },
    f: { A: "of the X-ray photons, at about 70 kV", sigma: s => s < 10 ? "no light, the charge goes straight down" : "the light's sideways spread (σ)",
         ff: "of the element is sensitive", signal: "relative to CsI, 150 µm", res: light => light ? "limited by the light spread" : "limited by the pixel size",
         levels: b => `2 to the power of ${b}`, matrix: "pixels", nyq: "= 1 / (2 · pixel size)", dqe: "how well the detector uses the photons",
         qerr: "at most, of the full scale", mb: b => `${b > 8 ? 2 : 1} byte per pixel` },
    lp: "lp/mm", nyqLbl: "Nyquist", steps: "steps", whole: "the whole wedge", zoom: "3 % of the wedge, stretched",
    photon: "X-ray photon", light: "light", charge: "charge", layer: "layer", elements: "detector elements", top: "one element from above", adc: "ADC",
    dec: ".",
    modelText: `<p>The share of the X-ray photons the layer catches: $A = 1 - e^{-t/\\lambda}$, with $\\lambda$ = 400 µm for CsI and GOS and 1100 µm for selenium, for a beam of about 70 kV. Selenium catches far better at the low energies of mammography. Mammography detectors use only about 200 µm of selenium.</p>
<p>The light's sideways spread: $\\sigma = k \\cdot t$, with $k$ = 0.5 for powder (GOS), 0.13 for needles (CsI) and almost 0 for selenium, where the field pulls the charge straight down.</p>
<p>Fill factor: $FF = ((p - 20)/p)^2$, because the transistor and the lines take a fixed 20 µm strip. 150 µm gives 75 %, 100 µm gives 64 %.</p>
<p>The sharpness (MTF) is the product of two parts, one from the light spread and one from the element's sensitive width: $e^{-2\\pi^2\\sigma^2 f^2} \\cdot \\text{sinc}(a f)$. The resolution is the highest frequency where the MTF is at least 10 %, but at most the Nyquist frequency $1/(2p)$.</p>
<p>Grey levels: $2^{\\text{bits}}$. The quantization error is at most half a step. The DQE at 0 lp/mm is $A$ times a Swank factor (0.75 GOS, 0.84 CsI, 0.95 selenium), which accounts for not every photon giving the same amount of light or charge. At the default thicknesses the DQE is the same as in the noise simulator (0.65 and 0.35). The model is simplified: in a direct detector the field can bend the charge towards the electrode, so its real fill factor is higher.</p>`,
    groups: [
      ["The crystals", [
        ["Powder or needles", "Compare GOS (250 µm) and CsI (600 µm). Which catches more photons? Which is sharper?",
         "CsI wins both: it catches 78 % against 46 %, and the light spreads less (78 µm against 125 µm), because the needles guide it straight down. That is why a CsI layer can be thick without getting blurred."],
        ["Thick powder", "Choose GOS and turn the layer up to 600 µm, as thick as CsI. What do you gain, and what do you lose?",
         "You catch as many photons as CsI, 78 %. But the light now spreads 300 µm sideways, and the resolution falls to about 1.1 lp/mm. In powder, thickness is a compromise."],
        ["Selenium", "Switch to selenium. Why are the bars so sharp? And why does selenium catch fewer photons than CsI here?",
         "In selenium there is no light to spread; the charge goes straight down. Then only the pixel size sets the limit. But at 70 kV, 1000 µm of selenium catches only 60 %. Selenium catches best at low energy, which is why it is used mainly in mammography."],
      ]],
      ["Fill factor", [
        ["Smaller pixels", "Go from 150 to 100 µm. What happens to the fill factor and the signal per element?",
         "The fill factor falls from 75 % to 64 %, because the electronics take up the same space. The signal per element falls to 0.38, because the element is both smaller and has a smaller sensitive part."],
        ["Mammography", "Choose selenium and 70 µm. What is the fill factor? What do you gain?",
         "Only 51 %. In return the detector can show up to 7.1 lp/mm, and selenium has no light to spread. In mammography the small details, such as microcalcifications, matter most."],
      ]],
      ["Bits", [
        ["1 bit", "Set the bit depth to 1. What do the wedge and the phantom look like?", "Two steps: black or white. All the grey levels are gone."],
        ["8 bits", "Set the bit depth to 8 and look at the lower, stretched wedge. What do you see? Try 12.",
         "At 8 bits there are only about 8 steps in the 3 %, so you see bands. At 12 bits there are about 120, and the wedge is smooth. That is why DR uses 12 to 14 bits: the image must be windowed narrowly without steps."],
        ["How many grey levels", "How many grey levels do 12 and 14 bits give?", "4096 and 16,384. Each extra bit doubles the number."],
      ]],
      ["Pixel and resolution", [
        ["Large pixels", "Choose CsI and 200 µm. Which groups can be seen? What happens to the densest ones?",
         "The groups up to 2.5 lp/mm. The denser ones blur together or turn into a false, coarser pattern: a line pair needs at least two pixels."],
        ["What sets the limit", "Choose GOS with 600 µm and 100 µm pixels. Is it the pixels or the light that sets the limit?",
         "The light. The pixels could show 5 lp/mm, but the light spreads so much that the resolution is only about 1.1 lp/mm. Small pixels do not help if the layer blurs the image."],
        ["Matrix", "How many pixels does a 43 cm detector with 150 µm pixels have?", "About 2867 × 2867, a little over 8 million pixels."],
      ]],
      ["Formulas", [
        ["Fill factor by hand", "An element is 150 µm, its sensitive area 130 µm each way. Work out the fill factor. What if the element is 100 µm?",
         "$FF = 130^2 / 150^2 \\approx 0.75$. At 100 µm the sensitive area is 80 µm: $80^2/100^2 = 0.64$."],
        ["Nyquist", "Work out the Nyquist frequency for 100, 150 and 200 µm.", "$f_N = 1/(2p)$: 5, 3.3 and 2.5 lp/mm."],
        ["Quantization error", "How large is the quantization error at most at 8 and at 12 bits, as a percentage of the scale?",
         "Half a step: $1/(2 \\cdot 256) \\approx 0.2$ % and $1/(2 \\cdot 4096) \\approx 0.012$ %. Each extra bit halves it."],
        ["File size", "How much space does an image of 3000 × 3000 pixels with 14 bits take?", "14 bits are stored in 2 bytes: $3000 \\cdot 3000 \\cdot 2 = 18$ MB."],
        ["DQE", "Compare the DQE of CsI 600 µm and GOS 250 µm. What does it mean for dose?",
         "0.65 against 0.35. GOS needs almost twice the dose for the same signal-to-noise ratio (same quantum noise). See the noise simulator."],
      ], "deep"],
    ],
  },
};

// ---- the page (everything below needs a browser) -------------------------------------
if (typeof document !== "undefined") {
const START = { det: "csi", t: 600, px: 150, bits: 12 };
const S = { lang: "da", level: "grund", ...START };
let M = model(S);
const $ = id => document.getElementById(id);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fmt = (v, d = 1) => v.toFixed(d).replace(".", T[S.lang].dec);
const int = v => Math.round(v).toLocaleString(S.lang === "da" ? "da-DK" : "en-GB");
function fit(cv) {
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [ctx, r.width, r.height];
}
function text(ctx, s, x, y, color, align = "left", size = 12) {
  ctx.fillStyle = color; ctx.font = `${size}px ${css("--body")}`; ctx.textAlign = align; ctx.fillText(s, x, y);
}
function rng(seed) { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }

// ---- the phantom: bars on a fine grid, blurred by the light, averaged over each element's sensitive part ----
const GROUPS = [];
let LEN = MARGIN;
for (const f of FREQS) { GROUPS.push({ f, x0: LEN, x1: LEN + LP / f }); LEN += LP / f + GAP; }
LEN += MARGIN - GAP;
const FINE = Math.round(LEN / DX);
const TRUE = new Float32Array(FINE);                       // 1 where the radiation passes, 0.3 under a lead bar
for (let i = 0; i < FINE; i++) {
  const x = i * DX, g = GROUPS.find(g => x >= g.x0 && x < g.x1);
  TRUE[i] = g && ((x - g.x0) * g.f) % 1 < 0.5 ? 0.3 : 1;
}
let blurCache = { sigma: -1, v: null };
function blurred(sigma) {
  if (blurCache.sigma === sigma) return blurCache.v;
  const s = sigma / 1000 / DX, r = Math.ceil(3 * s), out = new Float32Array(FINE);
  if (r < 1) out.set(TRUE);
  else {
    const w = []; let sum = 0;
    for (let k = -r; k <= r; k++) { const e = Math.exp(-k * k / (2 * s * s)); w.push(e); sum += e; }
    for (let i = 0; i < FINE; i++) {
      let a = 0;
      for (let k = -r; k <= r; k++) a += w[k + r] * TRUE[Math.min(FINE - 1, Math.max(0, i + k))];
      out[i] = a / sum;
    }
  }
  blurCache = { sigma, v: out };
  return out;
}
let IMG = null;
function makeImage() {
  const b = blurred(M.sigma), pre = new Float64Array(FINE + 1);
  for (let i = 0; i < FINE; i++) pre[i + 1] = pre[i] + b[i];
  const p = S.px / 1000, a = M.sens / 1000, n = Math.floor(LEN / p), rows = Math.max(8, Math.round(5 / p));
  const mean = new Float32Array(n);                         // the noise-free measurement of each column
  for (let k = 0; k < n; k++) {
    const c = (k + 0.5) * p, lo = Math.max(0, Math.round((c - a / 2) / DX)), hi = Math.min(FINE, Math.round((c + a / 2) / DX));
    mean[k] = (pre[hi] - pre[lo]) / Math.max(1, hi - lo);
  }
  const top = M.levels - 1, q = v => Math.round(Math.min(1, Math.max(0, v / 1.15)) * top) / top * 1.15;   // the ADC
  const r = rng(7), gauss = () => { let s = 0; for (let k = 0; k < 6; k++) s += r(); return (s - 3) / Math.sqrt(0.5); };
  const v = new Float32Array(n * rows), N = M.N;
  for (let j = 0; j < rows; j++) for (let k = 0; k < n; k++) v[j * n + k] = q(mean[k] + Math.sqrt(mean[k] / N) * gauss());
  IMG = { n, rows, v, mean: Float32Array.from(mean, q) };
}

function drawPhantom() {
  const [ctx, W, H] = fit($("phantom"));
  if (W < 10) return;
  const { n, rows, v } = IMG, off = document.createElement("canvas"); off.width = n; off.height = rows;
  const octx = off.getContext("2d"), img = octx.createImageData(n, rows);
  for (let k = 0; k < n * rows; k++) {                     // as on the screen: much radiation dark, the lead bars light
    const g = Math.round(Math.min(255, Math.max(0, 40 + (1 - v[k]) / 0.75 * 200)));
    img.data.set([g, g, g, 255], k * 4);
  }
  octx.putImageData(img, 0, 0);
  const ih = H - 34;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, W, ih);
  const L = T[S.lang], X = mm => mm / LEN * W;
  for (const g of GROUPS) {
    const ok = g.f <= M.limit + 1e-6;
    text(ctx, fmt(g.f, g.f % 1 ? 1 : 0), X((g.x0 + g.x1) / 2), ih + 14, ok ? css("--signal") : css("--muted"), "center", 11);
  }
  text(ctx, L.lp, 0, ih + 28, css("--muted"), "left", 10);
  // where the pixel size sets the limit: between the last group under Nyquist and the first over it
  const over = GROUPS.find(g => g.f > M.nyq + 1e-6);
  if (over) {
    const under = GROUPS[GROUPS.indexOf(over) - 1], x = under ? X((under.x1 + over.x0) / 2) : X(over.x0 - GAP / 2);
    ctx.strokeStyle = css("--amber"); ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ih + 4); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
    const right = x > W * 0.6;     // keep the label inside the canvas
    text(ctx, `${L.nyqLbl} ${fmt(M.nyq, 1)} ${L.lp}`, right ? x - 4 : x + 4, ih + 28, css("--amber"), right ? "right" : "left", 11);
  }
}

function drawProf() {
  const [ctx, W, H] = fit($("prof"));
  if (W < 10) return;
  const Y = v => 6 + (1 - (v - 0.3) / 0.7) * (H - 12);
  ctx.strokeStyle = css("--muted"); ctx.globalAlpha = 0.7; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0; x < W; x++) { const y = Y(TRUE[Math.min(FINE - 1, Math.floor(x / W * FINE))]); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke(); ctx.globalAlpha = 1;
  const { n, mean } = IMG, cw = W / (LEN / (S.px / 1000));
  ctx.strokeStyle = css("--signal"); ctx.lineWidth = 1.6; ctx.beginPath();
  for (let k = 0; k < n; k++) { const y = Y(mean[k]); k ? ctx.lineTo(k * cw, y) : ctx.moveTo(0, y); ctx.lineTo((k + 1) * cw, y); }
  ctx.stroke(); ctx.lineWidth = 1;
}

function drawWedge() {
  const [ctx, W, H] = fit($("wedge"));
  if (W < 10) return;
  const L = T[S.lang], top = M.levels - 1, q = v => Math.round(v * top) / top, h = (H - 34) / 2;
  const strip = (y, from, span) => {
    for (let x = 0; x < W; x++) {
      const v = q(from + span * x / (W - 1)), g = Math.round(Math.min(1, Math.max(0, (v - from) / span)) * 255);
      ctx.fillStyle = `rgb(${g},${g},${g})`; ctx.fillRect(x, y, 1.5, h);
    }
  };
  strip(14, 0, 1); strip(34 + h, 0.4, 0.03);
  text(ctx, `${L.whole}: ${int(M.levels)} ${L.steps}`, 0, 10, css("--muted"), "left", 11);
  const inZoom = Math.max(1, Math.round(0.03 * top));
  text(ctx, `${L.zoom}: ${S.bits < 6 ? "1" : "≈ " + int(inZoom)} ${L.steps}`, 0, 30 + h, css("--muted"), "left", 11);
}

function drawChain() {
  const [ctx, W, H] = fit($("chain"));
  if (W < 10) return;
  const L = T[S.lang], d = S.det, left = W * 0.62;
  const k = Math.min((left - 20) / (9 * 200), (H - 70) / 1000);     // px per µm: the same scale across and down
  const lt = S.t * k, ly = 26, x0 = 10, ew = S.px * k, ne = Math.floor((left - 20) / ew), width = ne * ew;
  // the layer
  ctx.fillStyle = d === "se" ? "#3a3f55" : "#2b3550"; ctx.fillRect(x0, ly, width, lt);
  ctx.strokeStyle = css("--line"); ctx.strokeRect(x0, ly, width, lt);
  if (d === "csi") { ctx.strokeStyle = "rgba(230,233,240,.18)"; for (let x = x0 + 3; x < x0 + width; x += 5 * k + 1.2) { ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x, ly + lt); ctx.stroke(); } }
  if (d === "gos") { const r = rng(3); ctx.fillStyle = "rgba(230,233,240,.22)"; for (let i = 0; i < width * lt / 18; i++) ctx.fillRect(x0 + r() * width, ly + r() * lt, 1.4, 1.4); }
  // the photon, absorbed at the depth where most are caught, and the light (or charge) going down
  const cx = x0 + width / 2, zy = ly + Math.min(lt * 0.35, lt - 2), by = ly + lt;
  ctx.strokeStyle = css("--amber"); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, 4); ctx.lineTo(cx, zy); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = css("--amber"); ctx.beginPath(); ctx.arc(cx, zy, 3, 0, 7); ctx.fill();
  text(ctx, L.photon, cx + 8, 14, css("--amber"), "left", 11);
  const spread = Math.max(1, 2 * M.sigma * k);
  ctx.fillStyle = "rgba(94,231,223,.28)"; ctx.beginPath(); ctx.moveTo(cx, zy); ctx.lineTo(cx - spread, by); ctx.lineTo(cx + spread, by); ctx.closePath(); ctx.fill();
  text(ctx, `${d === "se" ? L.charge : L.light}`, cx + spread + 6, by - 6, css("--signal"), "left", 11);
  text(ctx, `${L.layer} ${S.t} µm`, x0 + 4, ly + lt / 2 + 4, css("--fg"), "left", 11);
  // the detector elements: sensitive part and the electronics strip, to the same scale
  const ey = by + 2, eh = Math.max(8, ew * 0.55), e = EDGE * k;
  for (let i = 0; i < ne; i++) {
    const ex = x0 + i * ew;
    ctx.fillStyle = css("--signal"); ctx.globalAlpha = 0.75; ctx.fillRect(ex, ey, ew - e, eh);
    ctx.globalAlpha = 1; ctx.fillStyle = css("--soft"); ctx.fillRect(ex + ew - e, ey, e, eh);
  }
  text(ctx, `${L.elements}, ${S.px} µm`, x0, ey + eh + 14, css("--muted"), "left", 11);
  const sb = ey + eh + 30;       // a scale bar just under the elements
  ctx.strokeStyle = css("--fg"); ctx.beginPath(); ctx.moveTo(x0, sb); ctx.lineTo(x0 + 100 * k, sb); ctx.stroke();
  text(ctx, "100 µm", x0 + 100 * k + 6, sb + 4, css("--muted"), "left", 10);
  // one element from above, enlarged, and the number the ADC makes of it
  const sz = Math.min(W - left - 20, H * 0.48), sx = left + (W - left - sz) / 2, sy = 20, se = sz * EDGE / S.px;
  ctx.fillStyle = css("--soft"); ctx.fillRect(sx, sy, sz, sz);
  ctx.fillStyle = css("--signal"); ctx.globalAlpha = 0.75; ctx.fillRect(sx, sy, sz - se, sz - se); ctx.globalAlpha = 1;
  text(ctx, L.top, sx + sz / 2, 12, css("--muted"), "center", 11);
  text(ctx, `FF ${Math.round(M.ff * 100)} %`, sx + (sz - se) / 2, sy + (sz - se) / 2 + 5, css("--bg"), "center", 13);
  const ay = sy + sz + 22, value = Math.round(0.62 * (M.levels - 1));
  text(ctx, `→ ${L.adc} ${S.bits} bit →`, sx + sz / 2, ay, css("--muted"), "center", 11);
  ctx.font = `500 18px ${css("--mono")}`; ctx.fillStyle = css("--amber"); ctx.textAlign = "center";
  ctx.fillText(int(value), sx + sz / 2, ay + 24);
}

function readouts() {
  const L = T[S.lang], deep = S.level === "deep";
  const row = (cls, key, value, foot) =>
    `<div class="metric ${cls}"><div class="k">${L.k[key]}</div><div class="v">${value}</div><div class="f">${foot}</div></div>`;
  $("readout").innerHTML =
    row("ok", "A", `${Math.round(M.A * 100)} %`, L.f.A) +
    row(M.sigma > 150 ? "err" : "", "sigma", `${Math.round(M.sigma)} µm`, L.f.sigma(M.sigma)) +
    row("mag", "ff", `${Math.round(M.ff * 100)} %`, L.f.ff) +
    row("", "signal", `×${fmt(M.signal, 2)}`, L.f.signal) +
    row(M.byLight ? "err" : "ok", "res", `${fmt(M.limit, 1)} ${L.lp}`, L.f.res(M.byLight)) +
    row("", "levels", int(M.levels), L.f.levels(S.bits)) +
    row("", "matrix", `${int(M.matrix)} × ${int(M.matrix)}`, L.f.matrix) +
    (deep ? row("", "nyq", `${fmt(M.nyq, 1)} ${L.lp}`, L.f.nyq) +
            row("ok", "dqe", fmt(M.dqe, 2), L.f.dqe) +
            row("", "qerr", `${fmt(M.qerr, M.qerr < 0.1 ? 3 : 1)} %`, L.f.qerr) +
            row("", "mb", `${fmt(M.mb, 0)} MB`, L.f.mb(S.bits)) : "");
}

// ---- controls, text, tasks ----------------------------------------------------------
function buildControls() {
  const L = T[S.lang].ctl, box = $("controls");
  const help = k => S.level === "grund" ? `<p class="help">${T[S.lang].help[k]}</p>` : "";
  const seg = (key, opts) => `<div class="ctl"><label><span>${L[key]}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${key}" data-v="${val}" aria-pressed="${String(S[key]) === String(val)}">${lbl}</button>`).join("") +
    `</div>${help(key)}</div>`;
  const slider = (k, mn, mx, st, f) =>
    `<div class="ctl"><label for="s-${k}"><span>${L[k]}</span><span id="o-${k}">${f(S[k])}</span></label>` +
    `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}">${help(k)}</div>`;
  const SL = [["t", 100, 1000, 50, v => `${v} µm`], ["bits", 1, 16, 1, v => `${v} bit`]];
  box.innerHTML = seg("det", [["gos", L.gos], ["csi", L.csi], ["se", L.se]]) + slider(...SL[0]) +
    seg("px", [[70, "70 µm"], [100, "100 µm"], [150, "150 µm"], [200, "200 µm"]]) + slider(...SL[1]) +
    `<div class="ctl"><button class="reset" id="reset">${L.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    const k = b.dataset.k;
    if (k === "det") { S.det = b.dataset.v; S.t = DET[S.det].t0; } else S.px = +b.dataset.v;   // a new detector starts at its usual thickness
    buildControls(); update();
  });
  SL.forEach(([k, , , , f]) => {
    const el = $(`s-${k}`);
    el.oninput = () => { S[k] = +el.value; $(`o-${k}`).textContent = f(S[k]); updateSoon(); };
  });
  $("reset").onclick = () => { Object.assign(S, START); buildControls(); update(); };
}
const groups = () => T[S.lang].groups.map((g, gi) => [g[0], g[1], g[2], gi]).filter(g => g[2] !== "deep" || S.level === "deep");
let task = 0;
// paging the card opens the same task in the list below and closes the one the card showed before (other tasks the
// reader opened stay open; the page does not scroll)
function cardToList(from, to) {
  const at = id => document.querySelector(`#task-list details[data-id="${id}"]`);
  if (from !== to && at(from)) at(from).open = false;
  if (at(to)) at(to).open = true;
}
// opening a task in the list below shows the same task in the card beside the simulator
document.getElementById("task-list").addEventListener("toggle", e => {
  const d = e.target, ids = groups().flatMap(([, items, , gi]) => items.map((_, ii) => gi + ":" + ii)), k = ids.indexOf(d.dataset.id);
  if (d.open && k >= 0) { task = k; buildCard(); }
}, true);
function buildCard() {
  const L = T[S.lang], flat = groups().flatMap(([g, items]) => items.map((it, k) => [g, k + 1, items.length, ...it]));
  task = Math.min(task, flat.length - 1);
  const [g, k, n, h, q, a] = flat[task];
  $("taskcard").innerHTML =
    `<div class="tc-head"><span>${g} · ${k} ${L.of} ${n}</span>` +
    `<span class="seg"><button id="tc-prev" aria-label="${L.prev}">‹</button><button id="tc-next" aria-label="${L.next}">›</button></span></div>` +
    `<h4>${h}</h4><p class="q">${withMath(q)}</p>` +
    `<details class="answer"><summary>${L.answer}</summary><p class="a">${withMath(a)}</p></details>`;
  const go = d => { const ids = groups().flatMap(([, items, , gi]) => items.map((_, ii) => gi + ":" + ii)), from = ids[task];
    task = (task + d + flat.length) % flat.length; buildCard(); cardToList(from, ids[task]); };
  $("tc-prev").onclick = () => go(-1);
  $("tc-next").onclick = () => go(1);
}
function buildText() {
  const L = T[S.lang], set = (id, s) => { $(id).textContent = s; };
  document.documentElement.lang = S.lang;
  document.title = L.title + " | Oliver Brage";
  for (const k of ["title", "sub", "chapters", "chain", "wedge", "phantom", "prof", "tasks", "model", "foot", "privacy"]) set("t-" + k, L[k]);
  for (const k of ["chainNote", "wedgeNote", "phantomNote", "profNote"]) set("t-" + k.toLowerCase(), L[k]);
  set("t-back", L.back); set("t-simtitle", L.simTitle); set("t-videonote", L.videoNote);
  $("t-back").href = "../../?lang=" + S.lang;
  set("lvl-grund", L.grund); set("lvl-deep", L.deep);
  $("level-group").setAttribute("aria-label", S.lang === "da" ? "Niveau" : "Level");
  $("chapter-list").innerHTML = L.list.map(c => `<li>${c}</li>`).join("");
  $("model-text").innerHTML = withMath(L.modelText);
  $("task-list").innerHTML = groups().map(([g, items, , gi]) =>
    `<h4 class="tgroup">${g}</h4>` + items.map(([h, q, a], ii) =>
      `<details data-id="${gi}:${ii}"><summary>${h}</summary><p class="q">${withMath(q)}</p><details class="answer">` +
      `<summary>${L.answer}</summary><p class="a">${withMath(a)}</p></details></details>`).join("")).join("");
  buildCard();
  // the video in the chosen language and level; only reloaded when that choice changes
  const vid = $("vid"), file = `video/detektor_${S.lang}_${S.level === "deep" ? "fordybelse" : "grund"}.mp4`;
  if (vid.getAttribute("src") !== file) { vid.poster = `video/poster_${S.lang}.jpg`; vid.src = file; }
}
function setPressed() {
  for (const [id, on] of [["lang-da", S.lang === "da"], ["lang-en", S.lang === "en"],
                          ["lvl-grund", S.level === "grund"], ["lvl-deep", S.level === "deep"]])
    $(id).setAttribute("aria-pressed", on);
}
function render() { drawChain(); drawWedge(); drawPhantom(); drawProf(); readouts(); }
function update() { M = model(S); makeImage(); render(); }
// while a slider is dragged it fires many events; redraw at most once per screen frame so the thumb keeps up
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
