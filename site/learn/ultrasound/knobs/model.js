// Knobology simulator, the model: a curved-array B-mode image of a right kidney seen through the liver.
// Everything is computed from our own simple model; no real ultrasound images are used.
// Shared by the page (knobs.js) and by the number checks in node, so it touches no browser objects.
//
//   wavelength          λ = c / f, with c = 1540 m/s
//   axial resolution    half the pulse length; the pulse is 2 cycles, so it equals λ
//   beam width          a transmit beam focused at the focus depth, and a receive beam focused at every depth
//                       (dynamic receive focus); the two together give the two-way width
//   attenuation         2 · α · f · d dB there and back (α per tissue: 0.5 dB/cm/MHz in liver)
//   built-in TGC        the machine already adds 0.8 · f · d dB (at most 40 dB); the TGC sliders add or take away
//   noise               electronic noise 70 dB below the liver echo at the skin, so the penetration is ≈ 70 / f cm
//   frame rate          1 / (lines · focal zones · 2 · depth / c)
//   display             log compression: the dynamic range in dB is spread from black to white around a fixed mid grey

const US = (() => {
  const C = 154000;                 // speed of sound in soft tissue, cm/s
  const RC = 5;                     // radius of the curved probe face, cm (an abdominal curved array)
  const DAP = 2.4;                  // active aperture, cm
  const CYCLES = 2;                 // cycles in the pulse
  const ALPHA_LIVER = 0.5;          // dB/cm/MHz, one way
  const NOISE_DB = -70;             // electronic noise, relative to the liver echo at the skin
  const BUILT_IN = 0.8, BUILT_MAX = 40;   // the machine's own depth compensation, dB per cm per MHz, and its ceiling
  const MID = -5;                   // the echo level (dB, after gain) that is shown as mid grey; the dynamic range spreads around it
  const RAYLEIGH = -2.5;            // a speckle pattern's mean in dB lies 2.5 dB under its mean power
  const DEPTH_MAX = 18;

  // tissues: echo level in dB (relative to liver) and attenuation in dB/cm/MHz (one way)
  const TISSUES = {
    skin: [6, 0.6], fat: [-14, 0.6], septum: [2, 0.6], muscle: [-9, 0.7], peritoneum: [10, 0.5],
    liver: [0, ALPHA_LIVER], blood: [-60, 0.15], vwall: [8, 0.5], cortex: [-4, 0.5], pyramid: [-22, 0.5],
    sinus: [7, 0.5], capsule: [10, 0.5], perifat: [1, 0.5], cyst: [-60, 0.002], cystwall: [6, 0.5],
    retro: [-2, 0.5], deepmuscle: [-6, 0.7], diaphragm: [14, 0.5], lung: [-30, 10], bowel: [-1, 0.5],
    bonesurface: [18, 20], bone: [-15, 20],
  };
  const NAMES = Object.keys(TISSUES);
  const T = Object.fromEntries(NAMES.map((n, i) => [n, i]));
  const LEVEL = NAMES.map(n => TISSUES[n][0]), ALPHA = NAMES.map(n => TISSUES[n][1]);

  // ---- the anatomy: x across the image (cm, minus = screen left with the probe held normally), y down from the skin ----
  // Long plane: the probe lies along the body under the right ribs, marker towards the head, so minus x is towards the head.
  // Transverse plane: the probe lies across the body, marker towards the patient's right, so minus x is the patient's right.
  const kid = (x, y, a, b, phi, cyst, hilum) => ({ x, y, a, b, c: Math.cos(phi), s: Math.sin(phi), cyst, hilum });
  const KIDNEY = {
    long: kid(0.6, 8.6, 5.4, 2.3, -0.2, [-3.3, -1.0, 0.8], false),   // cyst: local u, v and radius, in the upper pole's front cortex
    trans: kid(-1.0, 8.8, 2.7, 2.3, -0.3, null, true),              // the hilum opens towards the midline
  };
  const local = (K, x, y) => { const dx = x - K.x, dy = y - K.y; return [dx * K.c + dy * K.s, -dx * K.s + dy * K.c]; };
  const global = (K, u, v) => [K.x + u * K.c - v * K.s, K.y + u * K.s + v * K.c];

  function kidney(K, u, v) {
    const p = Math.hypot(u / K.a, v / K.b);
    if (p > 1) return Math.hypot(u / (K.a + 0.6), v / (K.b + 0.6)) < 1 ? T.perifat : -1;   // the fat around the kidney
    if (K.cyst) {
      const dc = Math.hypot(u - K.cyst[0], v - K.cyst[1]);
      if (dc < K.cyst[2]) return T.cyst;
      if (dc < K.cyst[2] + 0.06) return T.cystwall;
    }
    if (K.hilum && u / K.a > 0.3 && Math.abs(v / K.b) < 0.3) return T.sinus;   // the hilum: no cortex towards the midline
    if (p > 0.975) return T.capsule;
    const psi = Math.atan2(v / K.b, u / K.a);
    const s = 0.42 + 0.06 * Math.sin(5 * psi + 1) + 0.03 * Math.sin(11 * psi);   // the sinus border is uneven
    if (p < s) return T.sinus;
    if (p < 0.74) {                       // the pyramids: wedges with their base out and their tip towards the sinus
      const edge = 0.3 + 0.9 * (0.74 - p) / (0.74 - s);
      if (Math.cos(9 * psi + 0.5) > edge) return T.pyramid;
    }
    return T.cortex;
  }

  function superficial(x, d) {           // the layers under the probe follow its curve, so they use the depth d
    if (d < 0.12) return [T.skin, 0];
    if (d < 1.3) {
      if (Math.abs(d - 0.55 - 0.05 * Math.sin(2 * x)) < 0.025 || Math.abs(d - 0.95 - 0.06 * Math.sin(1.3 * x + 1)) < 0.025) return [T.septum, 0];
      return [T.fat, 0];
    }
    if (d < 2.2) return [T.muscle, 3 * Math.sin(d * 2 * Math.PI / 0.22)];   // fibres: thin bright lines
    if (d < 2.28) return [T.peritoneum, 0];
    return null;
  }

  function longPlane(x, y, d) {
    const sup = superficial(x, d); if (sup) return sup;
    const K = KIDNEY.long, [u, v] = local(K, x, y), k = kidney(K, u, v);
    if (k >= 0) return [k, 0];
    if (y > 12.4 + 0.12 * x) return [T.deepmuscle, 3 * Math.sin(y * 2 * Math.PI / 0.3)];   // the back muscles
    if (x < -3) {                         // the diaphragm, and the lung behind it
      const r = Math.hypot(x + 0.5, y - 7);
      if (r > 7.62) return [T.lung, 0];
      if (r > 7.38) return [T.diaphragm, 0];
    }
    if (Math.abs(u) < K.a + 0.6 && v > 0) return [T.retro, 0];   // behind the kidney: fat, not liver
    const back = 13 - (x + 4) * 10 / 10.5;                          // the liver's back edge, rising to its tip
    if (y < back) {
      if (y > back - 0.08) return [T.peritoneum, 0];
      if (Math.hypot(x + 3.2, y - 4.2) < 0.45) return [T.blood, 0];          // a hepatic vein
      const pv = Math.hypot(x + 1.2, y - 5.3);                                // a portal vein with its bright wall
      if (pv < 0.4) return [T.blood, 0];
      if (pv < 0.52) return [T.vwall, 0];
      return [T.liver, 0];
    }
    return y < 6 ? [T.bowel, 4 * Math.sin(3 * x) * Math.sin(4 * y)] : [T.retro, 0];
  }

  function transPlane(x, y, d) {
    const sup = superficial(x, d); if (sup) return sup;
    const rv = Math.hypot(x - 6.2, y - 13.4);                       // a vertebral body
    if (rv < 2.2) return [rv > 1.95 && y < 13.4 ? T.bonesurface : T.bone, 0];
    if (Math.hypot((x - 3.6) / 1.5, (y - 11) / 1.8) < 1) return [T.deepmuscle, 3 * Math.sin(y * 2 * Math.PI / 0.3)];   // psoas
    const ivc = Math.hypot((x - 4.4) / 1.1, (y - 7.4) / 0.75);     // the inferior vena cava
    if (ivc < 1) return [T.blood, 0];
    if (ivc < 1.08) return [T.vwall, 0];
    { // the renal vein, from the hilum to the vena cava
      const ax = 1.2, ay = 8.05, bx = 3.6, by = 7.55, t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
      if (Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)) < 0.28) return [T.blood, 0];
    }
    const K = KIDNEY.trans, [u, v] = local(K, x, y), k = kidney(K, u, v);
    if (k >= 0) return [k, 0];
    if (y > 11.6 + 0.03 * x * x) return [T.deepmuscle, 3 * Math.sin(y * 2 * Math.PI / 0.3)];
    if (Math.abs(u) < K.a + 0.6 && v > 0) return [T.retro, 0];
    const back = 7.6 - 0.5 * (x + 4);
    if (y < back && x < 3.5) {
      const pv = Math.hypot(x + 3, y - 4.6);
      if (pv < 0.4) return [T.blood, 0];
      if (pv < 0.52) return [T.vwall, 0];
      return [T.liver, 0];
    }
    return y < 6.5 ? [T.bowel, 4 * Math.sin(3 * x) * Math.sin(4 * y)] : [T.retro, 0];
  }
  const anatomy = (plane, x, y, d) => plane === "trans" ? transPlane(x, y, d) : longPlane(x, y, d);

  // where the names go when "Show names" is on: x, y and the name in Danish and English
  function labels(plane) {
    if (plane === "trans") {
      const K = KIDNEY.trans;
      return [[-4.2, 4.0, "Lever", "Liver"], [...global(K, -0.6, 0), "Nyre", "Kidney"], [2.4, 7.25, "Nyrevene", "Renal vein"],
              [4.4, 6.35, "Vena cava", "Vena cava"], [6.2, 10.8, "Hvirvel", "Vertebra"], [6.2, 16.4, "Skygge", "Shadow"],
              [3.6, 11, "Psoas", "Psoas"], [3.4, 4.2, "Tarm", "Bowel"], [0, 0.75, "Fedt", "Fat"], [0, 1.75, "Muskel", "Muscle"]];
    }
    const K = KIDNEY.long, psi = (2 * Math.PI - 0.5) / 9;
    return [[-2.4, 3.4, "Lever", "Liver"], [...global(K, 1.5, -1.9), "Nyrebark", "Cortex"],
            [...global(K, K.a * 0.62 * Math.cos(psi), K.b * 0.62 * Math.sin(psi)), "Pyramide", "Pyramid"],
            [...global(K, 0.4, 0), "Sinus", "Sinus"], [...global(K, K.cyst[0], K.cyst[1]), "Cyste", "Cyst"],
            [-7.2, 9.6, "Diafragma", "Diaphragm"], [0, 0.75, "Fedt", "Fat"], [0, 1.75, "Muskel", "Muscle"],
            [3, 14.2, "Rygmuskel", "Back muscle"], [5.6, 4.2, "Tarm", "Bowel"]];
  }
  // the kidney's front, centre and back on the centre line: used for the readouts and the beam graph
  function kidneySpan(plane) {
    let front = null, back = null;
    for (let y = 2.3; y < DEPTH_MAX; y += 0.01) {
      const k = kidney(KIDNEY[plane], ...local(KIDNEY[plane], 0, y));
      if (k >= 0 && k !== T.perifat) { if (front === null) front = y; back = y; }
    }
    return { front, back, mid: (front + back) / 2 };
  }

  // ---- the beam and the machine ----
  const foci = s => (s.zones === 1 ? [0] : s.zones === 2 ? [-1.5, 1.5] : [-3, 0, 3]).map(o => Math.min(DEPTH_MAX - 0.5, Math.max(1, s.focus + o)));
  function beam(s) {
    const lam = C / (s.f * 1e6), zs = foci(s);
    const wtx = d => Math.min(...zs.map(z => {
      const F = Math.max(z / DAP, 1.5), w0 = lam * F, zr = 3.5 * lam * F * F;   // width at the focus, and how fast it widens
      return w0 * Math.sqrt(1 + ((d - z) / zr) ** 2);
    }));
    const wrx = d => lam * Math.max(d / DAP, 2);
    const w = d => { const a = wtx(d), b = wrx(d); return 1 / Math.sqrt(1 / (a * a) + 1 / (b * b)); };
    const fg = d => Math.max(-4, Math.min(3, 10 * Math.log10(0.2 / wtx(d))));   // more energy where the beam is narrow
    return { lam, zs, wtx, wrx, w, fg };
  }
  const DENSITY = { low: 1, mid: 2, high: 3 };          // lines per degree
  const lines = s => Math.round(DENSITY[s.density] * s.sector);
  const spacing = (s, d) => (RC + d) * (s.sector * Math.PI / 180) / lines(s);   // cm between two lines at depth d
  // the TGC: 8 sliders spread over the depth shown, joined by straight lines
  function tgcAt(s, d) {
    const n = s.tgc.length, pos = d / s.depth * n - 0.5;
    if (pos <= 0) return s.tgc[0];
    if (pos >= n - 1) return s.tgc[n - 1];
    const i = Math.floor(pos), t = pos - i;
    return s.tgc[i] * (1 - t) + s.tgc[i + 1] * t;
  }
  const gainAt = (s, d) => s.gain + Math.min(BUILT_IN * s.f * d, BUILT_MAX) + tgcAt(s, d);
  // what liver tissue at depth d looks like: its echo and the noise in dB after gain, and the grey level (0 black, 1 white)
  function levels(s, d, B = beam(s)) {
    const G = gainAt(s, d), echo = -2 * ALPHA_LIVER * s.f * d + B.fg(d) + RAYLEIGH + G, noise = NOISE_DB + RAYLEIGH + G;
    const both = 10 * Math.log10(10 ** (echo / 10) + 10 ** (noise / 10));
    const grey = v => Math.max(0, Math.min(1, 0.5 + (v - MID) / s.dr));
    return { G, echo, noise, both, grey: grey(both), noiseGrey: grey(noise) };
  }

  function model(s) {
    const B = beam(s), K = kidneySpan(s.plane), L = lines(s);
    const frame = 1 / (L * s.zones * 2 * s.depth / C);
    const lat = Math.max(B.w(K.mid), spacing(s, K.mid));
    return { B, K, L, frame, lam: B.lam, axial: CYCLES * B.lam / 2, beamK: B.w(K.mid), spaceK: spacing(s, K.mid), lat,
             pen: -NOISE_DB / (2 * ALPHA_LIVER * s.f) };
  }

  return { C, RC, DAP, CYCLES, NOISE_DB, BUILT_IN, BUILT_MAX, MID, RAYLEIGH, DEPTH_MAX, T, NAMES, LEVEL, ALPHA, anatomy, labels,
           kidneySpan, beam, lines, spacing, tgcAt, gainAt, levels, model, foci };
})();
if (typeof module !== "undefined") module.exports = US;
