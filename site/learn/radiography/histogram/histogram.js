// ---- text ----------------------------------------------------------------
const T = {
  da: {
    title: "Histogram og vindue",
    sub: "Skru på dosis, indblænding, LUT og vindue, og se hvad der sker med billedet, histogrammet og REX. Knæet er syntetisk, så vi ved præcis, hvad der er i det.",
    grund: "Grund", deep: "Fordybelse",
    image: "Billedet på skærmen", hist: "Histogram og REX",
    synth: "Syntetisk knæ, regnet ud fra en simpel model af stråling og støj.",
    histnote: "Farvestriben under aksen viser, hvilken gråtone hver værdi får på skærmen. Den orange ramme er vinduet.",
    value: "værdi (mere stråling →)", count: "antal pixel",
    bone: "knogle", soft: "bløddel", background: "baggrund", collimation: "uden for indblænding",
    noisy: "for meget støj", ok: "i orden", tooMuch: "for høj dosis",
    krex: "REX (Canon)", kwin: "Vindue",
    zone: { noisy: "Under 125: for meget støj", ok: "125–400: i orden", tooMuch: "Over 400: højere dosis uden bedre billede" },
    di: "DI, med rigtig dosis som mål", clipped: "klippet",
    ctl: {
      dose: "Dosis i forhold til rigtig", coll: "Indblænding", good: "God", poor: "For lidt",
      auto: "Automatisk skalering", on: "Til", off: "Fra", lut: "LUT", linear: "Lineær", s: "S-kurve",
      wl: "Vinduets midte, WL", ww: "Vinduets bredde, WW", clip: "Vis klipning", reset: "Nulstil",
    },
    tasks: "Opgaver",
    list: [
      ["Laveste dosis", "Find den laveste dosis, hvor REX stadig er over 125. Hvordan ser billedet ud lige under grænsen?",
       "×0,7 giver REX omkring 154. Ved ×0,5 falder REX til omkring 110, og billedet bliver tydeligt kornet. Lysheden er den samme hele vejen, så det er REX og støjen, der fortæller, at dosis er for lav."],
      ["For meget dosis", "Sæt dosis til ×2 og derefter ×4. Bliver billedet mørkere? Hvad siger REX?",
       "Nej, billedet er lige lyst, for den automatiske skalering flytter vinduet med. Men REX stiger til omkring 440 og 880. Patienten har fået to og fire gange så meget stråling, uden at billedet er blevet bedre at stille diagnose på. Når for meget stråling ikke kan ses, kan dosis snige sig opad. Det kaldes dose creep."],
      ["Uden skalering", "Slå automatisk skalering fra, og skift dosis op og ned. Hvad sker der nu?",
       "Nu bliver billedet mørkere med mere dosis og lysere med mindre, ligesom med film. Den automatiske skalering er grunden til, at et digitalt billede ser rigtigt ud, selvom dosis var forkert."],
      ["Indblænding", "Sæt dosis til ×1 og indblændingen til \"For lidt\". Hvad sker der med REX og billedet, selvom dosis er den samme?",
       "REX stiger fra 220 til omkring 290, og anatomien bliver lysere. Histogramanalysen tager en del af baggrunden for anatomi, så den regner forkert. Det samme kan ske med metal i feltet."],
      ["LUT", "Skift mellem lineær og S-kurve. Hvor i billedet ser du forskellen tydeligst?",
       "S-kurven giver mere kontrast i midten af værdierne, altså i bløddele og knoglens struktur. I enderne bliver kurven flad, så de lyseste og mørkeste værdier presses sammen. Se farvestriben under histogrammet."],
      ["Vinduet", "Slå \"Vis klipning\" til. Gør vinduet smalt, og flyt det til siden. Hvad sker der?",
       "Et smalt vindue giver høj kontrast, men anatomi uden for vinduet bliver helt hvid eller helt sort. Det er klipning, vist med rødt. Et bredt vindue tager alt med, men kontrasten bliver lav. De rå tal ændres ikke."],
      ["Støj og vindue", "Sæt dosis til ×0,5. Kan du få støjen væk med vinduet?",
       "Nej. Vinduet kan kun flytte rundt på de målte værdier. Et smalt vindue gør endda støjen tydeligere. Støj fra for lav dosis kan kun undgås ved at give nok dosis."],
    ],
    answer: "Vis svar", dec: ",", thou: ".",
    back: "← Læring", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
  },
  en: {
    title: "Histogram and window",
    sub: "Change the dose, collimation, LUT and window, and watch what happens to the image, the histogram and REX. The knee is synthetic, so we know exactly what is in it.",
    grund: "Basic", deep: "Deeper level",
    image: "The image on screen", hist: "Histogram and REX",
    synth: "Synthetic knee, computed from a simple model of radiation and noise.",
    histnote: "The strip under the axis shows the grey level each value gets on screen. The orange frame is the window.",
    value: "value (more radiation →)", count: "number of pixels",
    bone: "bone", soft: "soft tissue", background: "background", collimation: "outside collimation",
    noisy: "too noisy", ok: "fine", tooMuch: "dose too high",
    krex: "REX (Canon)", kwin: "Window",
    zone: { noisy: "Below 125: too much noise", ok: "125–400: fine", tooMuch: "Above 400: more dose, no better image" },
    di: "DI, with the right dose as target", clipped: "clipped",
    ctl: {
      dose: "Dose relative to right", coll: "Collimation", good: "Good", poor: "Too little",
      auto: "Automatic rescaling", on: "On", off: "Off", lut: "LUT", linear: "Linear", s: "S curve",
      wl: "Window centre, WL", ww: "Window width, WW", clip: "Show clipping", reset: "Reset",
    },
    tasks: "Tasks",
    list: [
      ["Lowest dose", "Find the lowest dose at which REX is still above 125. What does the image look like just below the limit?",
       "×0.7 gives REX around 154. At ×0.5 REX drops to around 110, and the image is clearly grainy. The brightness stays the same all the way, so it is REX and the noise that tell you the dose is too low."],
      ["Too much dose", "Set the dose to ×2 and then ×4. Does the image get darker? What does REX say?",
       "No, the image is just as bright, because automatic rescaling moves the window along. But REX rises to around 440 and 880. The patient got two and four times the radiation, and the image is no better for diagnosis. Because too much radiation cannot be seen, the dose can creep upwards. This is called dose creep."],
      ["Without rescaling", "Turn automatic rescaling off, and move the dose up and down. What happens now?",
       "Now the image gets darker with more dose and lighter with less, as with film. Automatic rescaling is why a digital image looks right even when the dose was wrong."],
      ["Collimation", "Set the dose to ×1 and collimation to \"Too little\". What happens to REX and the image, even though the dose is the same?",
       "REX rises from 220 to around 290, and the anatomy gets lighter. The histogram analysis takes part of the background for anatomy, so it gets the sum wrong. Metal in the field can do the same."],
      ["LUT", "Switch between linear and S curve. Where in the image do you see the difference most clearly?",
       "The S curve gives more contrast in the middle of the values, in the soft tissue and the structure of the bone. At the ends the curve is flat, so the lightest and darkest values are squeezed together. Look at the strip under the histogram."],
      ["The window", "Turn on \"Show clipping\". Make the window narrow and move it to one side. What happens?",
       "A narrow window gives high contrast, but anatomy outside the window becomes completely white or completely black. That is clipping, shown in red. A wide window takes everything in, but the contrast is low. The raw numbers do not change."],
      ["Noise and the window", "Set the dose to ×0.5. Can you get rid of the noise with the window?",
       "No. The window can only move the measured values around. A narrow window even makes the noise more visible. Noise from too low a dose can only be avoided by giving enough dose."],
    ],
    answer: "Show answer", dec: ".", thou: ",",
    back: "← Learn", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
  },
};

// ---- the synthetic knee (same model as the video, manim_studio/radiografi/knee.py) ----
// Higher raw value = more radiation reached the detector; the display inverts it.
const N = 200, MAX_VALUE = 16383, DOSE_REF = 7000, GAIN = 9, OUTSIDE = 120, REX_RIGHT = 220, BINS = 82;
const DOSES = [0.25, 0.35, 0.5, 0.7, 1, 1.4, 2, 2.8, 4];

function rng(seed) {             // mulberry32: a small seeded random generator, so the noise is the same every time
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function normals(seed) {         // N*N standard normal numbers (Box-Muller)
  const r = rng(seed), z = new Float32Array(N * N);
  for (let i = 0; i < z.length; i += 2) {
    const a = Math.sqrt(-2 * Math.log(r() + 1e-12)), b = 2 * Math.PI * r();
    z[i] = a * Math.cos(b); if (i + 1 < z.length) z[i + 1] = a * Math.sin(b);
  }
  return z;
}
function blur(a, passes) {       // separable 3-point box blur, wrapping at the edges like numpy's roll
  for (let p = 0; p < passes; p++) {
    const b = new Float32Array(a.length);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
      b[r * N + c] = (a[((r + N - 1) % N) * N + c] + a[r * N + c] + a[((r + 1) % N) * N + c]) / 3;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
      a[r * N + c] = (b[r * N + (c + N - 1) % N] + b[r * N + c] + b[r * N + (c + 1) % N]) / 3;
  }
  return a;
}
const Z = normals(11);
const GEO = {};
function geometry(collimated) {  // path lengths through soft tissue and bone, and the class of each pixel
  if (GEO[collimated]) return GEO[collimated];
  const soft = new Float32Array(N * N), bone = new Float32Array(N * N), cls = new Uint8Array(N * N);
  const tex = blur(normals(5), 2);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const i = r * N + c, v = 1 - 2 * r / (N - 1), u = -1 + 2 * c / (N - 1);
    const halfW = 0.52 + 0.1 * Math.exp(-((v / 0.35) ** 2));
    soft[i] = Math.sqrt(Math.max(0, 1 - (u / halfW) ** 2));
    const fw = 0.17 + 0.2 * Math.exp(-(((v - 0.16) / 0.22) ** 2));
    const femur = v > 0.06 + 0.05 * Math.cos(Math.PI * u / 0.37) && Math.abs(u) < fw;
    const tw = 0.16 + 0.22 * Math.exp(-(((v + 0.13) / 0.2) ** 2));
    const tibia = v < -0.04 && Math.abs(u) < tw;
    const fib = ((u - 0.33) / 0.07) ** 2 + ((v + 0.33) / 0.12) ** 2 < 1 || (Math.abs(u - 0.34) < 0.045 && v < -0.4);
    const pat = ((u + 0.02) / 0.15) ** 2 + ((v - 0.2) / 0.17) ** 2 < 1;
    const isBone = femur || tibia || fib;
    const width = femur ? fw : tibia ? tw : 0.07;
    const rel = Math.min(1, Math.abs(u) / Math.max(width, 1e-3));
    bone[i] = (isBone ? 0.42 + 0.3 * rel ** 6 + 0.4 * tex[i] : 0) + (pat ? 0.2 : 0);
    const field = !collimated || (Math.abs(u) < 0.86 && Math.abs(v) < 0.93);
    cls[i] = !field ? 0 : isBone ? 3 : soft[i] > 0.02 ? 2 : 1;
  }
  blur(soft, 2); blur(bone, 2);
  return (GEO[collimated] = { soft, bone, cls });
}
function rawImage(dose, collimated) {
  const g = geometry(collimated), raw = new Float32Array(N * N);
  for (let i = 0; i < raw.length; i++) {
    const mean = g.cls[i] === 0 ? OUTSIDE * dose : DOSE_REF * dose * Math.exp(-(0.8 * g.soft[i] + 1.2 * g.bone[i]));
    raw[i] = Math.min(MAX_VALUE, Math.max(0, mean + Math.sqrt(GAIN * mean) * Z[i]));
  }
  return { raw, cls: g.cls };
}
const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p / 100 * (sorted.length - 1))))];
function analyse(raw, cls, mistaken) {
  // the values of interest: the anatomy, without background and the area outside the collimation.
  // With too little collimation the analysis mistakes most of the background for anatomy.
  const anat = [], bg = [];
  for (let i = 0; i < raw.length; i++) (cls[i] >= 2 ? anat : cls[i] === 1 ? bg : []).push(raw[i]);
  if (mistaken) { bg.sort((a, b) => a - b); const lim = pct(bg, 70); for (const v of bg) if (v < lim) anat.push(v); }
  anat.sort((a, b) => a - b);
  const lo = pct(anat, 1), hi = pct(anat, 99), pad = 0.12 * (hi - lo);
  return { lo: lo - pad, hi: hi + pad, median: pct(anat, 50) };
}
const REF = analyse(...Object.values(rawImage(1, true)), false);
const rexOf = median => REX_RIGHT * median / REF.median;
const lutS = (n, k = 5.5) => {
  const s = 1 / (1 + Math.exp(-k * (Math.min(1, Math.max(0, n)) - 0.5)));
  const a = 1 / (1 + Math.exp(k / 2)), b = 1 / (1 + Math.exp(-k / 2));
  return (s - a) / (b - a);
};
const lut = n => S.lut === "s" ? lutS(n) : Math.min(1, Math.max(0, n));
const LO_RGB = [10, 12, 18], HI_RGB = [242, 242, 238];
const grey = b => LO_RGB.map((l, k) => Math.round(l + (HI_RGB[k] - l) * Math.min(1, Math.max(0, b))));

// ---- state ------------------------------------------------------------------
const START = { dose: 4, coll: "good", auto: "on", lut: "s", wl: 0, ww: 100, clip: "off" };
const S = { lang: "da", level: "grund", ...START };
let M = null;   // the current model: raw values, classes, window, REX
function compute() {
  const dose = DOSES[S.dose], collimated = S.coll === "good";
  const { raw, cls } = rawImage(dose, collimated);
  const a = analyse(raw, cls, !collimated);
  // without rescaling the window stays where the right dose would put it
  const base = S.auto === "on" ? a : analyse(...Object.values(rawImage(1, collimated)), !collimated);
  const w = base.hi - base.lo, mid = (base.lo + base.hi) / 2 + S.wl / 100 * w, width = w * S.ww / 100;
  M = { raw, cls, lo: mid - width / 2, hi: mid + width / 2, rex: rexOf(a.median), dose };
}
const bright = v => 1 - lut((v - M.lo) / Math.max(M.hi - M.lo, 1));

// ---- drawing ----------------------------------------------------------------
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function fit(cv) {
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [ctx, r.width, r.height];
}
function text(ctx, s, x, y, color, align = "left", size = 12) {
  ctx.fillStyle = color; ctx.font = `${size}px ${css("--body")}`; ctx.textAlign = align; ctx.fillText(s, x, y);
}
const off = document.createElement("canvas"); off.width = off.height = N;
function drawKnee() {
  const [ctx, W, H] = fit(document.getElementById("knee"));
  const octx = off.getContext("2d"), img = octx.createImageData(N, N), hot = [255, 77, 109];
  for (let i = 0; i < N * N; i++) {
    let rgb = grey(bright(M.raw[i]));
    if (S.clip === "on" && M.cls[i] >= 2) {
      const n = (M.raw[i] - M.lo) / Math.max(M.hi - M.lo, 1);
      if (n <= 0 || n >= 1) rgb = rgb.map((c, k) => Math.round(0.45 * c + 0.55 * hot[k]));
    }
    img.data.set([...rgb, 255], i * 4);
  }
  octx.putImageData(img, 0, 0);
  const s = Math.min(W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, (W - s) / 2, (H - s) / 2, s, s);
}
function drawHist() {
  const L = T[S.lang], [ctx, W, H] = fit(document.getElementById("hist"));
  const x0 = 34, x1 = W - 12, top = 26, scaleH = 64, yb = H - scaleH - 34, hh = yb - top;
  const X = v => x0 + (x1 - x0) * v / (MAX_VALUE + 1);
  // counts per bin, and which class dominates each bin
  const counts = new Array(BINS).fill(0), per = [0, 1, 2, 3].map(() => new Array(BINS).fill(0));
  for (let i = 0; i < M.raw.length; i++) {
    const b = Math.min(BINS - 1, Math.floor(M.raw[i] / (MAX_VALUE + 1) * BINS));
    counts[b]++; per[M.cls[i]][b]++;
  }
  const ymax = YMAX, bw = (x1 - x0) / BINS;
  // the window as a band behind the bars
  const a = Math.max(X(M.lo), x0), b = Math.min(X(M.hi), x1);
  ctx.fillStyle = "rgba(245,166,35,0.12)"; ctx.fillRect(a, top - 6, Math.max(b - a, 1), hh + 6);
  ctx.strokeStyle = css("--amber"); ctx.lineWidth = 2; ctx.strokeRect(a, top - 6, Math.max(b - a, 1), hh + 6);
  counts.forEach((n, i) => {
    if (!n) return;
    const h = hh * Math.min(n / ymax, 1);
    ctx.fillStyle = css("--signal"); ctx.globalAlpha = 0.8;
    ctx.fillRect(x0 + i * bw + bw * 0.07, yb - h, bw * 0.86, h);
    ctx.globalAlpha = 1;
    if (n > ymax) {   // cut-off bar: a break mark at the top
      ctx.strokeStyle = css("--panel"); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x0 + i * bw - 3, yb - h + 12); ctx.lineTo(x0 + (i + 1) * bw + 3, yb - h + 6); ctx.stroke();
    }
  });
  // axes, the grey each value becomes, labels
  ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x0, top - 10); ctx.lineTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
  for (let k = 0; k < 160; k++) {
    const v = (k + 0.5) / 160 * MAX_VALUE;
    ctx.fillStyle = `rgb(${grey(bright(v)).join(",")})`;
    ctx.fillRect(x0 + (x1 - x0) * k / 160, yb + 3, (x1 - x0) / 160 + 0.6, 9);
  }
  text(ctx, L.value, x1, yb + 26, css("--muted"), "right", 11);
  ctx.save(); ctx.translate(12, top + hh / 2); ctx.rotate(-Math.PI / 2); text(ctx, L.count, 0, 0, css("--muted"), "center", 11); ctx.restore();
  // peak names
  {
    const keys = ["collimation", "background", "soft", "bone"];
    [3, 2, 1, 0].forEach(c => {
      const vals = []; for (let i = 0; i < M.raw.length; i += 7) if (M.cls[i] === c) vals.push(M.raw[i]);
      if (!vals.length) return;
      vals.sort((p, q) => p - q);
      const v = pct(vals, 50), bin = Math.min(BINS - 1, Math.floor(v / (MAX_VALUE + 1) * BINS));
      const h = hh * Math.min(Math.max(...counts.slice(Math.max(0, bin - 1), bin + 2)) / ymax, 1);
      if (c === 0 && x1 - x0 < 420) return;   // no room on a phone
      if (c === 0) {   // the collimation bar is cut off at the top: name it upright beside the bar
        ctx.save(); ctx.translate(X(v) + bw + 10, yb - 8); ctx.rotate(-Math.PI / 2);
        text(ctx, L[keys[c]], 0, 0, css("--muted"), "left", 11); ctx.restore();
      } else text(ctx, L[keys[c]], X(v), yb - h - 6, css("--muted"), "center", 11);
    });
  }
  // the REX scale: three zones and a marker
  const ys = H - 30, RMAX = 600, R = r => x0 + (x1 - x0) * Math.min(r, RMAX) / RMAX;
  [[0, 125, "--hot"], [125, 400, "--signal"], [400, RMAX, "--hot"]].forEach(([p, q, col]) => {
    ctx.fillStyle = css(col); ctx.globalAlpha = 0.75; ctx.fillRect(R(p), ys, R(q) - R(p), 8); ctx.globalAlpha = 1;
  });
  text(ctx, "REX", x0 - 4, ys + 8, css("--amber"), "right", 11);
  [125, 400].forEach(v => text(ctx, String(v), R(v), ys - 4, css("--muted"), "center", 11));
  [[62, "noisy", "--hot"], [262, "ok", "--signal"], [500, "tooMuch", "--hot"]].forEach(([v, k, col]) =>
    text(ctx, L[k], R(v), ys + 22, css(col), "center", 11));
  const mx = R(M.rex);
  ctx.fillStyle = css("--fg");
  ctx.beginPath(); ctx.moveTo(mx, ys - 2); ctx.lineTo(mx - 6, ys - 12); ctx.lineTo(mx + 6, ys - 12); ctx.closePath(); ctx.fill();
  if (M.rex > RMAX) text(ctx, "→", mx - 10, ys - 4, css("--fg"), "right", 12);
}
let YMAX = 1;
{
  const { raw } = rawImage(1, true), c = new Array(BINS).fill(0);
  for (const v of raw) c[Math.min(BINS - 1, Math.floor(v / (MAX_VALUE + 1) * BINS))]++;
  YMAX = Math.max(...c.slice(2)) * 1.15;   // the collimation peak alone is cut off at the top
}

// ---- readouts ---------------------------------------------------------------
const fmt = (v, d = 0) => {
  const s = v.toFixed(d).split("."), L = T[S.lang];
  return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, L.thou) + (s[1] ? L.dec + s[1] : "");
};
function readouts() {
  const L = T[S.lang], deep = S.level === "deep", set = (id, s) => { document.getElementById(id).textContent = s; };
  const zone = M.rex < 125 ? "noisy" : M.rex <= 400 ? "ok" : "tooMuch";
  set("k-rex", L.krex); set("v-rex", fmt(M.rex));
  document.getElementById("v-rex").className = "v " + (zone === "ok" ? "ok" : "bad");
  document.getElementById("m-rex").className = "metric " + (zone === "ok" ? "ok" : "err");
  const di = 10 * Math.log10(M.rex / REX_RIGHT);
  set("f-rex", L.zone[zone] + (deep ? ` · ${L.di}: ${di >= 0 ? "+" : "−"}${fmt(Math.abs(di), 1)}` : ""));
  set("k-win", L.kwin);
  set("v-win", `WL ${fmt((M.lo + M.hi) / 2)} · WW ${fmt(M.hi - M.lo)}`);
  set("f-win", deep ? "g = (v − (WL − WW/2)) / WW" : "");
}

// ---- controls -----------------------------------------------------------------
const xfmt = v => "×" + String(v).replace(".", T[S.lang].dec);
const SLIDERS = [
  ["dose", 0, DOSES.length - 1, 1, v => xfmt(DOSES[v])],
  ["wl", -50, 50, 5, v => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)} %`],
  ["ww", 20, 300, 10, v => `${v} %`],
];
function buildControls() {
  const L = T[S.lang].ctl, box = document.getElementById("controls");
  const seg = (key, opts) => `<div class="ctl"><label><span>${L[key]}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${key}" data-v="${val}" aria-pressed="${S[key] === val}">${lbl}</button>`).join("") +
    `</div></div>`;
  const slider = ([k, mn, mx, st, f]) =>
    `<div class="ctl"><label for="s-${k}"><span>${L[k]}</span><span id="o-${k}">${f(S[k])}</span></label>` +
    `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}"></div>`;
  box.innerHTML =
    slider(SLIDERS[0]) +
    seg("coll", [["good", L.good], ["poor", L.poor]]) +
    seg("auto", [["on", L.on], ["off", L.off]]) +
    seg("lut", [["linear", L.linear], ["s", L.s]]) +
    slider(SLIDERS[1]) + slider(SLIDERS[2]) +
    seg("clip", [["off", L.off], ["on", L.on]]) +
    `<div class="ctl"><button class="reset" id="reset">${L.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    S[b.dataset.k] = b.dataset.v; buildControls(); update();
  });
  SLIDERS.forEach(([k, , , , f]) => {
    const el = document.getElementById(`s-${k}`);
    el.oninput = () => { S[k] = +el.value; document.getElementById(`o-${k}`).textContent = f(S[k]); update(); };
  });
  document.getElementById("reset").onclick = () => { Object.assign(S, START); buildControls(); update(); };
}
function buildText() {
  const L = T[S.lang];
  document.documentElement.lang = S.lang;
  document.getElementById("t-title").textContent = L.title;
  document.title = L.title + " | Oliver Brage";
  document.getElementById("t-sub").textContent = L.sub;
  document.getElementById("t-back").textContent = L.back;
  document.getElementById("t-back").href = "../../?lang=" + S.lang;
  document.getElementById("t-foot").textContent = L.foot;
  document.getElementById("t-privacy").textContent = L.privacy;
  for (const [id, key] of [["t-image", "image"], ["t-hist", "hist"], ["t-synth", "synth"],
                           ["t-histnote", "histnote"], ["t-tasks", "tasks"]])
    document.getElementById(id).textContent = L[key];
  document.getElementById("lvl-grund").textContent = L.grund;
  document.getElementById("lvl-deep").textContent = L.deep;
  document.getElementById("level-group").setAttribute("aria-label", S.lang === "da" ? "Niveau" : "Level");
  document.getElementById("task-list").innerHTML = L.list.map(([h, q, a]) =>
    `<details><summary>${h}</summary><p class="q">${q}</p><details class="answer">` +
    `<summary>${L.answer}</summary><p class="a">${a}</p></details></details>`).join("");
}
function setPressed() {
  for (const [id, on] of [["lang-da", S.lang === "da"], ["lang-en", S.lang === "en"],
                          ["lvl-grund", S.level === "grund"], ["lvl-deep", S.level === "deep"]])
    document.getElementById(id).setAttribute("aria-pressed", on);
}
function render() { drawKnee(); drawHist(); readouts(); }
function update() { compute(); render(); }
function all() { setPressed(); buildText(); buildControls(); update(); }

document.getElementById("lang-da").onclick = () => { S.lang = "da"; save(); all(); };
document.getElementById("lang-en").onclick = () => { S.lang = "en"; save(); all(); };
document.getElementById("lvl-grund").onclick = () => { S.level = "grund"; save(); all(); };
document.getElementById("lvl-deep").onclick = () => { S.level = "deep"; save(); all(); };
// language and level are kept in the address (?lang=da&level=deep), not in browser storage,
// so a link can open the right version and nothing is stored on the visitor's device
function save() {
  const q = new URLSearchParams(location.search);
  q.set("lang", S.lang); S.level === "deep" ? q.set("level", "deep") : q.delete("level");
  history.replaceState(null, "", "?" + q);
}
{
  const q = new URLSearchParams(location.search), l = q.get("lang");
  S.lang = l === "da" || l === "en" ? l : (navigator.language || "").toLowerCase().startsWith("da") ? "da" : "en";
  if (q.get("level") === "deep") S.level = "deep";
}
window.addEventListener("resize", render);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
all();
