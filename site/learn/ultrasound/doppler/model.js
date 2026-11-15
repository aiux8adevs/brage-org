// Doppler and safety simulator (ultrasound U6): the model. Nothing is drawn here; doppler.js draws.
// Everything is an own simple model with typical textbook numbers, not data from a scanner.
//   - Two scenes in the groin with a linear probe: the common femoral artery and vein along their length
//     (colour, power and spectral Doppler), and across (B-mode compression for DVT, colour and power).
//   - Flow: a fixed waveform in time (artery: triphasic, vein: phasic with breathing) times a velocity profile
//     across the lumen. A stenosis narrows the artery; the speed rises by the area ratio (continuity).
//   - Doppler: the shift is f = 2 f0 v cos(theta) / c. Colour shows the speed along the beam, wrapped into the
//     range the pulse rate can measure (aliasing). The spectrum is a histogram of the shifts in the gate.
//   - Safety: MI and TI from the output power, the mode and the pulse rate (simple scaling, see doppler.js text).
const DP = (() => {
  const C = 154000;                                    // speed of sound, cm/s
  const W = 4, D = 4, NX = 200, NZ = 200;              // image: 4 cm wide, 4 cm deep, 0.2 mm cells
  const rad = d => d * Math.PI / 180;
  const g = (t, m, s) => Math.exp(-0.5 * ((t - m) / s) ** 2);

  // ---- flow in time ----
  // common femoral artery, centre-line speed in cm/s over one heartbeat (1 s): fast systole, short reverse, small forward
  const artery = t => { const u = ((t % 1) + 1) % 1; return 100 * g(u, 0.12, 0.04) - 22 * g(u, 0.28, 0.045) + 10 * g(u, 0.42, 0.05); };
  // common femoral vein: towards the heart, slower when breathing in (one breath per 4 s)
  const vein = t => 16 + 6 * Math.sin(2 * Math.PI * t / 4);
  const WINDOW = 4;                                    // the spectrum shows 4 s

  // ---- geometry ----
  // long: vessels run across the image, tilted by the heel-toe angle (positive = deeper to the right).
  // The head is on the left (marker to the head), so the artery flows right (to the feet) and the vein left (to the heart).
  const LONG = { a: { z: 1.6, R: 0.32, dir: +1 }, v: { z: 2.65, R: 0.45, dir: -1 } };
  const STEN = { s: -0.3, w: 0.16, k: 0.4 };           // stenosis centre along the artery, width (cm), narrowing of the radius
  // trans (right groin, patient's right on the left of the screen): artery lateral (left), vein medial (right)
  const TRANS = { a: { x: -0.55, z: 1.7, R: 0.32 }, v: { x: 0.5, z: 1.95, R: 0.5 }, angle: 70 };

  // vein height under pressure p (0-100 %): a normal vein is flat at 45 %, a fresh clot does not give, an old one a little
  function veinShape(s) {
    const p = s.press / 100, R0 = TRANS.v.R;
    if (s.clot === "fresh") return { R: R0 * 1.15, h: 1 - 0.04 * p };
    if (s.clot === "old") return { R: R0 * 0.85, h: 1 - 0.3 * p };
    return { R: R0, h: Math.max(0, 1 - p / 0.45) };
  }
  function geom(s) {
    if (s.scene === "long") {
      const phi = rad(s.tilt), cs = Math.cos(phi), sn = Math.sin(phi);
      return { scene: "long", cs, sn, phi };
    }
    const p = s.press / 100, vs = veinShape(s), shift = 0.25 * p;      // pressing pushes everything a little up
    return { scene: "trans", p, shift, fat: 0.55 * (1 - 0.3 * p),
      a: { x: TRANS.a.x, R: TRANS.a.R, h: 1 - 0.08 * p, zb: TRANS.a.z + TRANS.a.R - shift },
      v: { x: TRANS.v.x, R: vs.R, h: vs.h, zb: TRANS.v.z + TRANS.v.R - shift } };
  }

  // where a point is relative to a vessel. Returns null outside the lumen, or the vessel id, the normalised
  // distance from the centre (0-1), the speed factor along the vessel and the turbulence there.
  function lumen(x, z, G, s) {
    if (G.scene === "long") {
      for (const id of ["a", "v"]) {
        const V = LONG[id], sx = x * G.cs + (z - V.z) * G.sn, n = -x * G.sn + (z - V.z) * G.cs;
        let R = V.R, off = 0, mult = 1, turb = 0, plug = 0;
        if (id === "a" && s.sten) {
          const b = g(sx, STEN.s, STEN.w);
          R = V.R * (1 - STEN.k * b); off = V.R - R;                       // the plaque sits on the near wall
          mult = (V.R / R) ** 2; plug = b;
          turb = sx > STEN.s ? 0.35 * g(sx, STEN.s + 0.45, 0.3) : 0;
        }
        const rn = Math.abs(n - off) / R;
        if (rn < 1) return { id, rn, mult, turb, plug, dir: V.dir, sx };
        if (id === "a" && s.sten && V.R - R > 0.01 && n > -V.R && n < off - R) return { id: "plaque", rn: 1 };
        if (Math.abs(Math.abs(n) - V.R) < 0.045 && !(id === "a" && s.sten && Math.abs(n - off) < R)) return { id: "wall" + id, rn: 1 };
      }
      return null;
    }
    for (const id of ["a", "v"]) {
      const V = G[id], b = Math.max(V.R * V.h, 0.004), a = V.R * (1 + 0.35 * (1 - V.h)), zc = V.zb - b;
      const rn = Math.hypot((x - V.x) / a, (z - zc) / b);
      if (rn < 1 && V.h > 0.03) return { id, rn, mult: 1, turb: 0, plug: 0, dir: id === "a" ? 1 : -1 };
      const wall = Math.hypot((x - V.x) / (a + 0.06), (z - zc) / (b + 0.06));
      if (wall < 1) return { id: "wall" + id, rn: 1 };
    }
    return null;
  }

  // echo level of the tissue in dB (0 = muscle-like grey), without speckle
  function tissue(x, z, G, s) {
    const L = lumen(x, z, G, s);
    if (L) {
      if (L.id === "plaque") return 20;
      if (L.id === "walla") return 16;
      if (L.id === "wallv") return s.clot === "old" ? 16 : 12;
      if (L.id === "v" && s.clot === "fresh") return -21 + 3 * Math.sin(9 * x + 5 * z);
      if (L.id === "v" && s.clot === "old") return -9 + 4 * Math.sin(14 * x - 9 * z);
      return -55;                                                          // blood: black
    }
    const fat = G.scene === "trans" ? G.fat : 0.6;
    if (z < 0.12) return 8;                                                // skin
    if (z < fat) return -9 + 9 * g(Math.sin(5 * x + 3 * Math.sin(2 * x)) + 6 * (z - fat / 2), 0, 0.12);   // fat with septa
    if (z < fat + 0.06) return 10;                                         // fascia
    // muscle: fibres along the vessels, bright bands every few millimetres
    const tilt = G.scene === "long" ? G.sn / G.cs : 0;
    return -4 + 7 * g(Math.sin(18 * (z - x * tilt) + 1.3 * Math.sin(1.7 * x)), 1, 0.25);
  }

  // speed (cm/s) of the blood at a point at time t, and its part along the beam towards the probe (positive = towards)
  function flow(x, z, G, s, t) {
    const L = lumen(x, z, G, s);
    if (!L || (L.id !== "a" && L.id !== "v")) return null;
    if (L.id === "v" && s.clot !== "none") return null;                    // a clot that fills the vein: no flow
    const base = L.id === "a" ? artery(t) : vein(t);
    const prof = (1 - L.plug) * (1 - L.rn * L.rn) + L.plug * (1 - L.rn ** 6);
    const v = base * L.mult * prof;
    let cosb;                                                              // cosine between flow and the line to the probe
    if (G.scene === "long") {
      const beta = rad(s.steer);
      // flow direction (dir * cos phi, dir * sin phi); beam into the tissue (sin beta, cos beta)
      cosb = -L.dir * (G.cs * Math.sin(beta) + G.sn * Math.cos(beta));
    } else cosb = L.dir * Math.cos(rad(TRANS.angle));
    return { id: L.id, v, toward: v * cosb, cosb, turb: L.turb };
  }

  // the Doppler angle between beam and artery (degrees); 90 = across
  function angle(s) {
    if (s.scene === "trans") return TRANS.angle;
    return 90 - Math.abs(s.tilt + s.steer);
  }
  const nyq = s => C * s.prf / (4 * s.f0 * 1e6);                           // highest speed along the beam before aliasing, cm/s
  const shift = (s, toward) => 2 * s.f0 * 1e6 * toward / C;                // Doppler shift in Hz
  const wallV = s => s.wf * C / (2 * s.f0 * 1e6);                          // wall filter as a speed along the beam, cm/s
  // what the scanner measures along the beam: wrapped into [-(1-b), (1+b)) * nyquist
  function wrap(v, s) {
    const n = nyq(s), lo = -(1 - s.base) * n, span = 2 * n;
    return lo + ((((v - lo) % span) + span) % span);
  }

  // the gate: a short piece of the beam line through (gx, gz)
  function gatePoints(s, k = 15) {
    const beta = rad(s.steer), out = [];
    for (let i = 0; i < k; i++) {
      const u = (i / (k - 1) - 0.5) * s.gate / 10;
      out.push([s.gx + u * Math.sin(beta), s.gz + u * Math.cos(beta)]);
    }
    return out;
  }
  // deterministic noise
  const hash = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };

  // the spectrum: nt time columns over the window, nb frequency bins over one pulse rate (so wrap = aliasing)
  function spectrum(s, nt = 400, nb = 160) {
    const G = geom(s), pts = gatePoints(s), out = new Float32Array(nt * nb);
    const fmin = -(1 - s.base) * s.prf / 2, df = s.prf / nb, wf = s.wf;
    for (let ti = 0; ti < nt; ti++) {
      const t = ti / nt * WINDOW;
      pts.forEach(([x, z], k) => {
        const F = flow(x, z, G, s, t);
        if (!F) return;
        const jitter = F.turb ? F.turb * (hash(ti, k) * 2 - 1) * Math.abs(F.v) : 0;
        const f = shift(s, F.toward + jitter * F.cosb), sig = 25 + 0.05 * Math.abs(shift(s, F.v));   // aperture broadening grows with speed
        const n = Math.ceil(3 * sig / df);
        const c0 = Math.floor((f - fmin) / df);
        for (let j = -n; j <= n; j++) {
          const fb = fmin + (c0 + j + 0.5) * df;
          const w = Math.exp(-0.5 * ((fb - f) / sig) ** 2);
          const bin = (((c0 + j) % nb) + nb) % nb;
          out[ti * nb + bin] += w;
        }
      });
      // wall filter: nothing under wf Hz survives (after wrapping too, like on a scanner)
      for (let b = 0; b < nb; b++) { const fb = fmin + (b + 0.5) * df; if (Math.abs(fb) < wf) out[ti * nb + b] = 0; }
    }
    return { data: out, nt, nb, fmin, df };
  }

  // peak speed in the gate over the window: the true one, and what the scanner shows after angle correction
  function peak(s) {
    const G = geom(s), pts = gatePoints(s, 9);
    let vTrue = 0, towardPk = 0, fPk = 0;
    for (let i = 0; i < 200; i++) {
      const t = i / 200 * WINDOW;
      for (const [x, z] of pts) {
        const F = flow(x, z, G, s, t);
        if (!F) continue;
        if (Math.abs(F.v) > Math.abs(vTrue)) vTrue = F.v;
        if (Math.abs(F.toward) > Math.abs(towardPk)) towardPk = F.toward;
      }
    }
    fPk = shift(s, towardPk);
    const shown = Math.abs(towardPk) / Math.cos(rad(s.corr));
    const n = nyq(s), aliased = towardPk > (1 + s.base) * n || towardPk < -(1 - s.base) * n;
    return { vTrue: Math.abs(vTrue), shown, fPk, aliased, toward: towardPk };
  }

  // safety indices. At full power and 5 MHz, 4 kHz: B-mode MI 1.2 TI 0.4; colour/power MI 1.0 TI 0.6; spectral MI 0.8 TI 1.0.
  // MI follows the pressure (amplitude, 20 log) and 1/sqrt(f); TI follows the power (10 log) and, in Doppler, the pulse rate.
  const BASE = { b: [1.2, 0.4], color: [1.0, 0.6], power: [1.0, 0.6], spec: [0.8, 1.0] };
  function safety(s) {
    const [mi0, ti0] = BASE[s.mode], dop = s.mode !== "b";
    const mi = mi0 * 10 ** (s.out / 20) * (dop ? Math.sqrt(5 / s.f0) : 1);
    const ti = ti0 * 10 ** (s.out / 10) * (dop ? s.prf / 4000 : 1);
    return { mi, ti };
  }

  function model(s) {
    const G = geom(s);
    const out = { G, angle: angle(s), nyq: nyq(s), wallV: wallV(s), ...safety(s) };
    if (s.scene === "long") out.peak = peak(s);
    else {
      out.veinH = G.v.h; out.artH = G.a.h;
      out.veinArea = Math.PI * G.v.R * G.v.R * G.v.h * (1 + 0.35 * (1 - G.v.h)) * 100;   // mm2
    }
    return out;
  }

  return { C, W, D, NX, NZ, WINDOW, LONG, TRANS, STEN, artery, vein, geom, lumen, tissue, flow, angle, nyq, shift, wallV, wrap,
           gatePoints, spectrum, peak, safety, model, hash, rad };
})();
