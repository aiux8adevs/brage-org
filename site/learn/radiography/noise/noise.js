// Noise simulator: dose (mAs), kV, pixel size, detector and a noise filter, on a contrast-detail phantom.
// The model, written out in the "How the model works" box:
//
//   photons per pixel   N = 900 · (mAs/10) · (kV/70)² · e^(−(μ(kV) − μ(70))·20 cm) · (pixel/150 µm)² · DQE/0.65
//   noise               σ = √N, so SNR = N/σ = √N: double the dose gives only √2 better SNR
//   contrast of a disk  C = C_ref · (70/kV)^0.8,   CNR per pixel = C · √N
//   visible?            Rose: C · √(photons over the disk) ≥ 5
//   REX                 follows the radiation that reached the detector: 220 at 10 mAs, 70 kV
// The image is rescaled like a DR system does, so a low dose looks grainy, not dark.

const DQE = { csi: 0.65, gos: 0.35 };
const SIZES = [4, 2, 1, 0.5];            // disk diameter in mm, columns
const CONTRASTS = [0.08, 0.04, 0.02, 0.01];   // at 70 kV, rows
const FIELD_MM = 60;                     // the phantom is 6 cm across

const T = {
  da: {
    title: "Støj, SNR og CNR", sub: "En simulator til støj: skru på dosis, kV, pixelstørrelse og detektor, og se hvilke detaljer der forsvinder i støjen. Video 2 kommer.",
    simTitle: "Simulator: Støj, SNR og CNR", grund: "Grund", deep: "Fordybelse", back: "← Læring",
    curve: "SNR og dosis", prof: "En linje gennem rækken med 4 % kontrast", image: "Det detektoren så",
    curveNote: "Kurven viser SNR for alle mAs med dine indstillinger, den grå kurve udgangspunktet (10 mAs, 70 kV, 150 µm, CsI). Den orange prik er din mAs. Trappen viser, hvad dobbelt dosis giver: SNR bliver kun 1,41 gange bedre, ikke dobbelt så god. Derfor flader kurven ud.",
    profNote: "Grafen viser én vandret linje gennem fantomet: rækken med 4 % kontrast. Den er markeret med orange i siderne af billedet; hold musen over grafen for at se hele linjen. Jo højere grafen ligger, jo flere fotoner har pixlen fået. Hvor linjen krydser en skive, dæmper skiven strålen, så færre fotoner når igennem, og grafen får et dyk (skiven vises lys i billedet, ligesom knogle). Den tynde cyan linje er hver enkelt pixel. Den hopper op og ned hele vejen, også hvor der ingen skive er: det er støjen. Den tykke hvide linje er den samme måling glattet ud (gennemsnittet af 7 pixel ved siden af hinanden). Her kan du se dykkene. En skive kan kun ses, når dens dyk er tydeligt større end støjens hop.",
    profBg: "baggrund", profDisk: "skive",
    imgNote: "Kontrast-detalje-fantom: skiverne bliver mindre mod højre og svagere nedad. De dæmper strålen og vises lyse, ligesom knogle. Cyan prik: skiven er synlig efter Rose-kriteriet (se tallet under billedet). Orange markering: linjen, som grafen til venstre viser (hold musen over grafen for at se den hele). Billedet skaleres som på et DR-anlæg, så lav dosis ser kornet ud, ikke mørk.",
    tasks: "Opgaver", answer: "Vis svar", of: "af", prev: "Forrige opgave", next: "Næste opgave",
    model: "Sådan virker modellen", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
    ctl: { mas: "mAs", kv: "Kilovolt", px: "Pixelstørrelse", det: "Detektor", filter: "Støjfilter", csi: "CsI (nåle)", gos: "GOS (pulver)",
           on: "Til", off: "Fra", reset: "Nulstil" },
    help: { mas: "Strålemængden. Dosis følger mAs.", kv: "Højere kV: flere fotoner igennem, men mindre kontrast.",
            px: "Større pixel samler flere fotoner, men viser færre detaljer.", det: "Hvor stor en del af fotonerne detektoren udnytter (DQE).",
            filter: "Udglatter støjen, men udvisker også små detaljer." },
    k: { n: "Fotoner pr. pixel", snr: "SNR = √N", cnr: "CNR, skiven med 2 %", dose: "Dosis", rex: "REX", seen: "Synlige skiver" },
    f: { n: "N", snr: "signal i forhold til støj", cnr: "kontrast i forhold til støj, pr. pixel", dose: "i forhold til 10 mAs, 70 kV",
         rex: r => r < 125 ? "for meget støj" : r <= 400 ? "i orden" : "for høj dosis", seen: "af 16 (Rose: CNR over skiven ≥ 5)" },
    curveLbl: { x: "mAs", y: "SNR", double: "dobbelt dosis: SNR × 1,41" },
    dec: ",",
    modelText: `<p>Fotoner pr. pixel: $N = 900 \\cdot (\\text{mAs}/10) \\cdot (kV/70)^2 \\cdot e^{-(\\mu(kV) - \\mu(70)) \\cdot 20} \\cdot (\\text{pixel}/150)^2 \\cdot \\text{DQE}/0{,}65$, med $\\mu = 0{,}2 \\cdot (70/kV)^{0{,}6}$ pr. cm gennem 20 cm væv.</p>
<p>Støjen er $\\sigma = \\sqrt{N}$ (kvantestøj), så $\\text{SNR} = N/\\sigma = \\sqrt{N}$.</p>
<p>Skivernes kontrast er $C = C_{ref} \\cdot (70/kV)^{0{,}8}$ med $C_{ref}$ = 8, 4, 2 og 1 %. $\\text{CNR} = C \\cdot \\sqrt{N}$ pr. pixel.</p>
<p>En skive regnes som synlig, når $C \\cdot \\sqrt{N_{skive}} \\ge 5$, hvor $N_{skive}$ er alle fotoner over skivens areal (Rose-kriteriet), og den er mindst 3 pixel bred (6 med støjfilter).</p>
<p>DQE: CsI 0,65, GOS 0,35. Støjfilteret er et gennemsnit over 3 × 3 pixel. Dosis er $(\\text{mAs}/10) \\cdot (kV/70)^2$. REX følger strålingen ved detektoren.</p>`,
    groups: [
      ["Støj og dosis", [
        ["Halvér dosis", "Gå fra 10 til 5 mAs. Bliver billedet mørkere? Hvad sker der med SNR?", "Lysheden er den samme, fordi systemet skalerer billedet. Men det bliver mere kornet, og SNR falder fra 30 til 21, altså med en faktor √2."],
        ["Dobbelt så god", "Hvor meget skal dosis op, for at SNR bliver dobbelt så stor?", "Fire gange. SNR følger kvadratroden af antallet af fotoner, så 10 mAs skal op på 40."],
        ["Kurven", "Se på kurven. Hvorfor bliver den fladere?", "Fordi SNR = √N. Hver fordobling af dosis giver det samme lille skridt, × 1,41. Den sidste dosis giver mindst ekstra billedkvalitet."],
      ]],
      ["Hvad kan ses?", [
        ["Synlige skiver", "Hvor mange skiver kan du se ved 10 mAs? Passer det med tallet?", "Cirka 10 af 16. De små og svage forsvinder først: de har få fotoner at skille sig ud med."],
        ["Den svageste", "Find den laveste mAs, hvor den store skive med 1 % kontrast stadig kan ses.", "Omkring 5 mAs med CsI. Store, svage detaljer kræver dosis, ikke skarphed."],
      ]],
      ["Detektor og pixel", [
        ["CsI eller GOS", "Skift til GOS ved samme mAs. Hvad sker der? Hvorfor?", "Billedet støjer mere, fordi GOS udnytter færre af fotonerne (lavere DQE). For samme billedkvalitet skal dosis op."],
        ["Større pixel", "Gå fra 150 til 200 µm. Hvad sker der med støj og de mindste skiver?", "Hver pixel samler flere fotoner, så støjen falder. Men de mindste skiver bliver sværere at se, fordi de kun fylder få pixel."],
      ]],
      ["kV og filter", [
        ["Højere kV", "Gå fra 70 til 100 kV ved samme mAs. Hvad sker der med N, kontrast og dosis?", "N stiger meget, fordi flere fotoner kommer igennem, men dosis stiger også. Skivernes kontrast falder. Prøv at skrue ned for mAs, til dosis er tilbage på 1."],
        ["Støjfilter", "Slå støjfilteret til. Hvad vinder du, og hvad mister du?", "Billedet ser roligere ud, men de små skiver bliver udvisket. Et filter kan ikke skabe information, der ikke er målt."],
      ]],
      ["REX", [
        ["For lav dosis", "Find den mAs, hvor REX falder under 125. Hvordan ser billedet ud?", "Omkring 5,7 mAs. Billedet har samme lyshed, men er kornet, og de svage skiver forsvinder. Det er REX, ikke lysheden, der afslører det."],
      ]],
      ["Formler", [
        ["SNR i hånden", "Ved 10 mAs er N = 900. Regn SNR og CNR for skiven med 2 % ud.", "$\\text{SNR} = \\sqrt{900} = 30$, $\\text{CNR} = 0{,}02 \\cdot 30 = 0{,}6$ pr. pixel."],
        ["Rose", "Den store skive er 4 mm i diameter, pixel 150 µm. Hvor mange pixel dækker den, og er skiven med 1 % synlig ved 10 mAs?", "Cirka 560 pixel, altså $560 \\cdot 900 \\approx 500\\,000$ fotoner. $0{,}01 \\cdot \\sqrt{500\\,000} \\approx 7 \\ge 5$: synlig."],
      ], "deep"],
    ],
  },
  en: {
    title: "Noise, SNR and CNR", sub: "A simulator for noise: change dose, kV, pixel size and detector, and see which details disappear in the noise. Video 2 is on the way.",
    simTitle: "Simulator: Noise, SNR and CNR", grund: "Basic", deep: "Deeper level", back: "← Learn",
    curve: "SNR and dose", prof: "A line through the row with 4 % contrast", image: "What the detector saw",
    curveNote: "The curve shows the SNR for every mAs with your settings, the grey curve the starting point (10 mAs, 70 kV, 150 µm, CsI). The orange dot is your mAs. The step shows what double the dose gives: the SNR gets only 1.41 times better, not twice as good. That is why the curve flattens.",
    profNote: "The graph shows one horizontal line through the phantom: the row with 4 % contrast. It is marked in orange at the sides of the image; hover over the graph to see the whole line. The higher the graph, the more photons the pixel received. Where the line crosses a disk, the disk attenuates the beam, so fewer photons get through and the graph dips (the disk shows light in the image, like bone). The thin cyan line is each single pixel. It jumps up and down all the way, also where there is no disk: that is the noise. The thick white line is the same measurement smoothed (the average of 7 neighbouring pixels). Here you can see the dips. A disk can only be seen when its dip is clearly larger than the noise's jumps.",
    profBg: "background", profDisk: "disk",
    imgNote: "Contrast-detail phantom: the disks get smaller to the right and fainter downwards. They attenuate the beam and show light, like bone. Cyan dot: the disk is visible by the Rose criterion (see the number below the image). Orange marks: the line the graph on the left shows (hover over the graph to see all of it). The image is rescaled as on a DR system, so a low dose looks grainy, not dark.",
    tasks: "Tasks", answer: "Show answer", of: "of", prev: "Previous task", next: "Next task",
    model: "How the model works", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
    ctl: { mas: "mAs", kv: "Kilovoltage", px: "Pixel size", det: "Detector", filter: "Noise filter", csi: "CsI (needles)", gos: "GOS (powder)",
           on: "On", off: "Off", reset: "Reset" },
    help: { mas: "The amount of radiation. Dose follows mAs.", kv: "Higher kV: more photons through, but less contrast.",
            px: "A larger pixel collects more photons, but shows less detail.", det: "How large a share of the photons the detector uses (DQE).",
            filter: "Smooths the noise, but also blurs small details." },
    k: { n: "Photons per pixel", snr: "SNR = √N", cnr: "CNR, the 2 % disk", dose: "Dose", rex: "REX", seen: "Visible disks" },
    f: { n: "N", snr: "signal relative to noise", cnr: "contrast relative to noise, per pixel", dose: "relative to 10 mAs, 70 kV",
         rex: r => r < 125 ? "too noisy" : r <= 400 ? "fine" : "dose too high", seen: "of 16 (Rose: CNR over the disk ≥ 5)" },
    curveLbl: { x: "mAs", y: "SNR", double: "double the dose: SNR × 1.41" },
    dec: ".",
    modelText: `<p>Photons per pixel: $N = 900 \\cdot (\\text{mAs}/10) \\cdot (kV/70)^2 \\cdot e^{-(\\mu(kV) - \\mu(70)) \\cdot 20} \\cdot (\\text{pixel}/150)^2 \\cdot \\text{DQE}/0.65$, with $\\mu = 0.2 \\cdot (70/kV)^{0.6}$ per cm through 20 cm of tissue.</p>
<p>The noise is $\\sigma = \\sqrt{N}$ (quantum noise), so $\\text{SNR} = N/\\sigma = \\sqrt{N}$.</p>
<p>The disks' contrast is $C = C_{ref} \\cdot (70/kV)^{0.8}$ with $C_{ref}$ = 8, 4, 2 and 1 %. $\\text{CNR} = C \\cdot \\sqrt{N}$ per pixel.</p>
<p>A disk counts as visible when $C \\cdot \\sqrt{N_{disk}} \\ge 5$, where $N_{disk}$ is all photons over the disk's area (the Rose criterion), and it is at least 3 pixels wide (6 with the noise filter).</p>
<p>DQE: CsI 0.65, GOS 0.35. The noise filter averages 3 × 3 pixels. Dose is $(\\text{mAs}/10) \\cdot (kV/70)^2$. REX follows the radiation at the detector.</p>`,
    groups: [
      ["Noise and dose", [
        ["Halve the dose", "Go from 10 to 5 mAs. Does the image get darker? What happens to the SNR?", "The brightness stays the same, because the system rescales the image. But it gets grainier, and the SNR falls from 30 to 21, a factor of √2."],
        ["Twice as good", "How much must the dose go up for the SNR to double?", "Four times. SNR follows the square root of the number of photons, so 10 mAs must go up to 40."],
        ["The curve", "Look at the curve. Why does it flatten?", "Because SNR = √N. Each doubling of dose gives the same small step, × 1.41. The last dose adds the least image quality."],
      ]],
      ["What can be seen?", [
        ["Visible disks", "How many disks can you see at 10 mAs? Does it match the number?", "About 10 of 16. The small, faint ones disappear first: they have few photons to stand out with."],
        ["The faintest", "Find the lowest mAs at which the large disk with 1 % contrast can still be seen.", "Around 5 mAs with CsI. Large, faint details need dose, not sharpness."],
      ]],
      ["Detector and pixel", [
        ["CsI or GOS", "Switch to GOS at the same mAs. What happens? Why?", "The image is noisier, because GOS uses fewer of the photons (lower DQE). For the same image quality the dose must go up."],
        ["Larger pixel", "Go from 150 to 200 µm. What happens to the noise and the smallest disks?", "Each pixel collects more photons, so the noise falls. But the smallest disks are harder to see, because they cover only a few pixels."],
      ]],
      ["kV and filter", [
        ["Higher kV", "Go from 70 to 100 kV at the same mAs. What happens to N, contrast and dose?", "N rises a lot because more photons get through, but the dose rises too. The disks' contrast falls. Try turning the mAs down until the dose is back at 1."],
        ["Noise filter", "Switch on the noise filter. What do you gain, and what do you lose?", "The image looks calmer, but the small disks are blurred. A filter cannot create information that was never measured."],
      ]],
      ["REX", [
        ["Too low a dose", "Find the mAs where REX falls below 125. What does the image look like?", "Around 5.7 mAs. The image has the same brightness but is grainy, and the faint disks disappear. It is REX, not the brightness, that reveals it."],
      ]],
      ["Formulas", [
        ["SNR by hand", "At 10 mAs, N = 900. Work out the SNR and the CNR for the 2 % disk.", "$\\text{SNR} = \\sqrt{900} = 30$, $\\text{CNR} = 0.02 \\cdot 30 = 0.6$ per pixel."],
        ["Rose", "The large disk is 4 mm across, pixel 150 µm. How many pixels does it cover, and is the 1 % disk visible at 10 mAs?", "About 560 pixels, so $560 \\cdot 900 \\approx 500\\,000$ photons. $0.01 \\cdot \\sqrt{500\\,000} \\approx 7 \\ge 5$: visible."],
      ], "deep"],
    ],
  },
};

// ---- the model ---------------------------------------------------------------------
const mu = kv => 0.2 * Math.pow(70 / kv, 0.6);
function model(s) {
  const trans = Math.exp(-(mu(s.kv) - mu(70)) * 20);
  const exposure = (s.mas / 10) * Math.pow(s.kv / 70, 2) * trans;          // radiation at the detector, relative
  const N = 900 * exposure * Math.pow(s.px / 150, 2) * DQE[s.det] / 0.65;
  const cScale = Math.pow(70 / s.kv, 0.8);
  const pxmm = s.px / 1000;
  let seen = 0;
  const visible = CONTRASTS.map(c0 => SIZES.map(d => {
    const area = Math.PI * (d / 2) ** 2 / (pxmm * pxmm);                    // pixels covered by the disk
    const blurOk = d / pxmm >= (s.filter === "on" ? 6 : 3);                // a disk must span a few pixels; the 3×3 filter needs more
    const ok = c0 * cScale * Math.sqrt(N * area) >= 5 && blurOk;
    if (ok) seen++;
    return ok;
  }));
  return { N, snr: Math.sqrt(N), cScale, cnr: 0.02 * cScale * Math.sqrt(N), dose: (s.mas / 10) * Math.pow(s.kv / 70, 2),
           rex: 220 * exposure, seen, visible };
}

const START = { mas: 10, kv: 70, px: 150, det: "csi", filter: "off" };
const S = { lang: "da", level: "grund", ...START };
let M = model(S);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fmt = (v, d = 1) => v.toFixed(d).replace(".", T[S.lang].dec);
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

// ---- the phantom image: computed once per setting, used by the image and the line profile ----
let IMG = null;
function makeImage() {
  const n = Math.round(FIELD_MM / (S.px / 1000) / 2);       // shown at half the detector resolution, so a pixel is 2 detector pixels
  const pxmm = FIELD_MM / n, r = rng(42), N = M.N * 4;       // 2 × 2 detector pixels per shown pixel
  const gauss = () => { let a = 0; for (let k = 0; k < 6; k++) a += r(); return (a - 3) / Math.sqrt(0.5); };
  const v = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * pxmm, y = (j + 0.5) * pxmm;
    let c = 0;
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const cx = 9 + col * 14, cy = 9 + row * 14, rad = SIZES[col] / 2;
      if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) c = CONTRASTS[row] * M.cScale;
    }
    const mean = N * (1 - c);
    v[j * n + i] = mean + Math.sqrt(N) * gauss();
  }
  if (S.filter === "on") {                                   // 3 × 3 average
    const w = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      let s = 0, k = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const jj = j + dj, ii = i + di;
        if (jj >= 0 && jj < n && ii >= 0 && ii < n) { s += v[jj * n + ii]; k++; }
      }
      w[j * n + i] = s / k;
    }
    v.set(w);
  }
  IMG = { n, v, N, pxmm };
}

let profHover = false;
{
  const prof = document.getElementById("prof");
  for (const [ev, on] of [["mouseenter", true], ["mouseleave", false], ["touchstart", true], ["touchend", false]])
    prof.addEventListener(ev, () => { profHover = on; drawImg(); }, { passive: true });
}
function drawImg() {
  const [ctx, W, H] = fit(document.getElementById("img"));
  if (W < 10) return;
  const { n, v, N } = IMG, off = document.createElement("canvas"); off.width = off.height = n;
  const octx = off.getContext("2d"), img = octx.createImageData(n, n);
  // DR-style rescaling: the background always lands on the same grey, ±4 σ of the true noise spans the scale
  const sd = Math.sqrt(N) * (S.filter === "on" ? 1 / 3 : 1), span = Math.max(4 * sd, 0.12 * N);
  for (let k = 0; k < n * n; k++) {
    const g = Math.round(Math.min(255, Math.max(0, 150 - 120 * (v[k] - N) / span)));
    img.data.set([g, g, g, 255], k * 4);
  }
  octx.putImageData(img, 0, 0);
  const sz = Math.min(W, H), x0 = (W - sz) / 2, y0 = (H - sz) / 2;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, x0, y0, sz, sz);
  // tick the disks counted as visible
  const L = T[S.lang];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    if (!M.visible[row][col]) continue;
    const cx = x0 + (9 + col * 14) / FIELD_MM * sz, cy = y0 + (9 + row * 14) / FIELD_MM * sz + (SIZES[col] / 2 + 2.2) / FIELD_MM * sz;
    ctx.fillStyle = css("--signal"); ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 7); ctx.fill();
  }
  // orange marks at both edges: the row the line profile runs through; the whole line while the graph is hovered
  const ry = y0 + 23 / FIELD_MM * sz;
  ctx.strokeStyle = css("--amber"); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, ry); ctx.lineTo(x0 + 14, ry); ctx.moveTo(x0 + sz - 14, ry); ctx.lineTo(x0 + sz, ry); ctx.stroke();
  if (profHover) {
    ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(x0, ry); ctx.lineTo(x0 + sz, ry); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.lineWidth = 1;
  ctx.font = `11px ${css("--body")}`;
  SIZES.forEach((d, col) => text(ctx, `${fmt(d, d < 1 ? 1 : 0)} mm`, x0 + (9 + col * 14) / FIELD_MM * sz, y0 + sz - 4, "rgba(10,14,24,.9)", "center", 11));
  CONTRASTS.forEach((c, row) => text(ctx, `${Math.round(c * 100)} %`, x0 + 3, y0 + (9 + row * 14) / FIELD_MM * sz + 4, "rgba(10,14,24,.9)", "left", 11));
}

function drawProf() {
  const [ctx, W, H] = fit(document.getElementById("prof"));
  if (W < 10) return;
  const { n, v, N } = IMG, row = Math.round(23 / FIELD_MM * n);   // the 4 % row
  const span = Math.max(5 * Math.sqrt(N), 0.15 * N), mid = H / 2;
  ctx.strokeStyle = css("--line"); ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();
  ctx.strokeStyle = css("--signal"); ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1) * W, y = mid + (N - v[row * n + i]) / span * (H / 2 - 4);   // fewer photons: lower
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  // the same line, averaged over 7 pixels: the disks stand out as dips once the noise is smoothed
  ctx.strokeStyle = css("--fg"); ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 3; i < n - 3; i++) {
    let a = 0; for (let k = -3; k <= 3; k++) a += v[row * n + i + k];
    const x = i / (n - 1) * W, y = mid + (N - a / 7) / span * (H / 2 - 4);
    i === 3 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke(); ctx.lineWidth = 1;
  // where the disks are, and which way is which
  const L = T[S.lang];
  SIZES.forEach((d, col) => text(ctx, `${fmt(d, d < 1 ? 1 : 0)} mm`, (9 + col * 14) / FIELD_MM * W, H - 3, css("--muted"), "center", 10));
  text(ctx, `↑ ${L.profBg}`, 2, 11, css("--muted"), "left", 10);
  text(ctx, `↓ ${L.profDisk}`, 2, H - 14, css("--muted"), "left", 10);
}

function drawCurve() {
  const [ctx, W, H] = fit(document.getElementById("curve"));
  if (W < 10) return;
  const L = T[S.lang].curveLbl, pad = 34, x0 = pad, y0 = H - 24, x1 = W - 10, y1 = 10;
  const per = M.N / S.mas, perRef = 90;                       // photons per pixel per mAs: now, and at the starting point
  const smax = Math.sqrt(Math.max(per, perRef) * 40) * 1.08;
  const X = m => x0 + (m / 40) * (x1 - x0), Y = s => y0 - (s / smax) * (y0 - y1);
  ctx.strokeStyle = css("--line"); ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
  text(ctx, L.x, x1, y0 - 6, css("--muted"), "right", 11); text(ctx, L.y, x0 - 6, y1 + 8, css("--muted"), "right", 11);
  for (const m of [10, 20, 30, 40]) text(ctx, String(m), X(m), y0 + 14, css("--muted"), "center", 10);
  const step = smax > 120 ? 40 : smax > 60 ? 20 : 10;
  for (let v = step; v < smax; v += step) text(ctx, String(v), x0 - 5, Y(v) + 3, css("--muted"), "right", 10);
  // the starting point, in grey, so a change of detector, pixel or kV shows as a different curve
  ctx.strokeStyle = css("--muted"); ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let m = 0.5; m <= 40; m += 0.5) { const p = [X(m), Y(Math.sqrt(perRef * m))]; m === 0.5 ? ctx.moveTo(...p) : ctx.lineTo(...p); }
  ctx.stroke(); ctx.globalAlpha = 1;
  ctx.strokeStyle = css("--signal"); ctx.lineWidth = 2; ctx.beginPath();
  for (let m = 0.5; m <= 40; m += 0.5) { const p = [X(m), Y(Math.sqrt(per * m))]; m === 0.5 ? ctx.moveTo(...p) : ctx.lineTo(...p); }
  ctx.stroke(); ctx.lineWidth = 1;
  // the current setting, and what doubling it would give
  const s = Math.sqrt(per * S.mas), d = Math.min(40, 2 * S.mas), sd = Math.sqrt(per * d);
  ctx.setLineDash([4, 4]); ctx.strokeStyle = css("--amber");
  ctx.beginPath(); ctx.moveTo(X(S.mas), Y(s)); ctx.lineTo(X(d), Y(s)); ctx.lineTo(X(d), Y(sd)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = css("--amber"); ctx.beginPath(); ctx.arc(X(S.mas), Y(s), 5, 0, 7); ctx.fill();
  text(ctx, `SNR ${fmt(s, 0)}`, X(S.mas) - 8, Y(s) - 8, css("--amber"), "right", 11);
  if (2 * S.mas <= 40) text(ctx, L.double, X(d) + 6, (Y(s) + Y(sd)) / 2 + 4, css("--amber"), X(d) > W * 0.6 ? "right" : "left", 11);
}

function readouts() {
  const L = T[S.lang];
  const row = (cls, key, value, foot) =>
    `<div class="metric ${cls}"><div class="k">${L.k[key]}</div><div class="v">${value}</div><div class="f">${foot}</div></div>`;
  document.getElementById("readout").innerHTML =
    row("", "n", Math.round(M.N).toLocaleString(S.lang === "da" ? "da-DK" : "en-GB"), L.f.n) +
    row("ok", "snr", fmt(M.snr, 1), L.f.snr) +
    row("mag", "cnr", fmt(M.cnr, 2), L.f.cnr) +
    row("err", "dose", `×${fmt(M.dose, 2)}`, L.f.dose) +
    row(M.rex < 125 || M.rex > 400 ? "err" : "ok", "rex", String(Math.round(M.rex)), L.f.rex(M.rex)) +
    row("", "seen", `${M.seen}`, L.f.seen);
}

// ---- controls, text, tasks ----------------------------------------------------------
const SLIDERS = [["mas", 1, 40, 0.5, v => `${fmt(v, v % 1 ? 1 : 0)} mAs`], ["kv", 50, 120, 5, v => `${v} kV`]];
function buildControls() {
  const L = T[S.lang].ctl, box = document.getElementById("controls");
  const help = k => S.level === "grund" ? `<p class="help">${T[S.lang].help[k]}</p>` : "";
  const seg = (key, opts) => `<div class="ctl"><label><span>${L[key]}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${key}" data-v="${val}" aria-pressed="${String(S[key]) === String(val)}">${lbl}</button>`).join("") +
    `</div>${help(key)}</div>`;
  const slider = ([k, mn, mx, st, f]) =>
    `<div class="ctl"><label for="s-${k}"><span>${L[k]}</span><span id="o-${k}">${f(S[k])}</span></label>` +
    `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}">${help(k)}</div>`;
  box.innerHTML = slider(SLIDERS[0]) + slider(SLIDERS[1]) +
    seg("px", [[100, "100 µm"], [150, "150 µm"], [200, "200 µm"]]) +
    seg("det", [["csi", L.csi], ["gos", L.gos]]) + seg("filter", [["off", L.off], ["on", L.on]]) +
    `<div class="ctl"><button class="reset" id="reset">${L.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    S[b.dataset.k] = b.dataset.k === "px" ? +b.dataset.v : b.dataset.v; buildControls(); update();
  });
  SLIDERS.forEach(([k, , , , f]) => {
    const el = document.getElementById(`s-${k}`);
    el.oninput = () => { S[k] = +el.value; document.getElementById(`o-${k}`).textContent = f(S[k]); updateSoon(); };
  });
  document.getElementById("reset").onclick = () => { Object.assign(S, START); buildControls(); update(); };
}
const groups = () => T[S.lang].groups.filter(g => g[2] !== "deep" || S.level === "deep");
let task = 0;
function buildCard() {
  const L = T[S.lang], flat = groups().flatMap(([g, items]) => items.map((it, k) => [g, k + 1, items.length, ...it]));
  task = Math.min(task, flat.length - 1);
  const [g, k, n, h, q, a] = flat[task];
  document.getElementById("taskcard").innerHTML =
    `<div class="tc-head"><span>${g} · ${k} ${L.of} ${n}</span>` +
    `<span class="seg"><button id="tc-prev" aria-label="${L.prev}">‹</button><button id="tc-next" aria-label="${L.next}">›</button></span></div>` +
    `<h4>${h}</h4><p class="q">${withMath(q)}</p>` +
    `<details class="answer"><summary>${L.answer}</summary><p class="a">${withMath(a)}</p></details>`;
  const go = d => { task = (task + d + flat.length) % flat.length; buildCard(); };
  document.getElementById("tc-prev").onclick = () => go(-1);
  document.getElementById("tc-next").onclick = () => go(1);
}
function buildText() {
  const L = T[S.lang], set = (id, s) => { document.getElementById(id).textContent = s; };
  document.documentElement.lang = S.lang;
  document.title = L.title + " | Oliver Brage";
  for (const k of ["title", "sub", "curve", "prof", "image", "tasks", "model", "foot", "privacy"]) set("t-" + k, L[k]);
  set("t-back", L.back); set("t-simtitle", L.simTitle); set("t-profnote", L.profNote); set("t-curvenote", L.curveNote); set("t-imgnote", L.imgNote);
  document.getElementById("t-back").href = "../../?lang=" + S.lang;
  set("lvl-grund", L.grund); set("lvl-deep", L.deep);
  document.getElementById("model-text").innerHTML = withMath(L.modelText);
  document.getElementById("task-list").innerHTML = groups().map(([g, items]) =>
    `<h4 class="tgroup">${g}</h4>` + items.map(([h, q, a]) =>
      `<details><summary>${h}</summary><p class="q">${withMath(q)}</p><details class="answer">` +
      `<summary>${L.answer}</summary><p class="a">${withMath(a)}</p></details></details>`).join("")).join("");
  buildCard();
}
function setPressed() {
  for (const [id, on] of [["lang-da", S.lang === "da"], ["lang-en", S.lang === "en"],
                          ["lvl-grund", S.level === "grund"], ["lvl-deep", S.level === "deep"]])
    document.getElementById(id).setAttribute("aria-pressed", on);
}
function render() { drawCurve(); drawProf(); drawImg(); readouts(); }
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
document.getElementById("lang-da").onclick = () => { S.lang = "da"; save(); all(); };
document.getElementById("lang-en").onclick = () => { S.lang = "en"; save(); all(); };
document.getElementById("lvl-grund").onclick = () => { S.level = "grund"; save(); all(); };
document.getElementById("lvl-deep").onclick = () => { S.level = "deep"; save(); all(); };
{
  const q = new URLSearchParams(location.search), l = q.get("lang");
  S.lang = l === "da" || l === "en" ? l : (navigator.language || "").toLowerCase().startsWith("da") ? "da" : "en";
  if (q.get("level") === "deep") S.level = "deep";
}
window.addEventListener("resize", render);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
all();
