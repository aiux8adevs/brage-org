// Sound meets tissue simulator (ultrasound U2): the model. Nothing is drawn here; tissue.js draws.
// Everything is an own simple model with typical textbook numbers, not data from a scanner.
// Shared by the page and by the number checks in node, so it touches no browser objects.
//
//   impedance           Z = density · speed; at a boundary the share of the sound sent back is
//                       R = ((Z2 − Z1) / (Z2 + Z1))², the rest (1 − R) goes on
//   specular echo       a smooth boundary sends its echo back like a mirror, so the probe only gets it when the
//                       boundary is nearly at right angles to the beam; a rough boundary scatters in all directions
//   scatter             small structures in the tissue send weak echoes in all directions (the grey speckle)
//   attenuation         each tissue takes a number of dB per cm per MHz (absorption and scatter together)
//   refraction          a beam that meets a boundary at an angle bends when the speed changes (Snell's law); from
//                       soft tissue into a faster tissue there is an angle above which nothing gets through
//   the scanner         assumes 1540 m/s and straight lines, and its automatic depth gain takes back the attenuation
//                       of soft tissue (0.5 dB/cm/MHz), so a tissue that attenuates less leaves the area below brighter
const TM = (() => {
  const C = 1540;
  const W = 5, DMAX = 18, DX = 0.04, DZ = 0.01;       // cm: image 5 cm wide, modelled to 18 cm in 0.4 x 0.1 mm cells
  const NX = Math.round(W / DX), NZ = Math.round(DMAX / DZ);
  const NOISE_DB = -70, ALPHA = 0.5, SPEC = 45, REVERB = 12, WIRE_DB = 45;

  // Z in MRayl, c in m/s, a in dB/cm/MHz, bs = scatter level in dB relative to liver
  const MAT = {
    soft:   { Z: 1.65, c: 1540, a: 0.5, bs: 0 },        // liver, and the phantom's tissue-like background
    skin:   { Z: 1.65, c: 1540, a: 0.5, bs: 10 },
    fat:    { Z: 1.38, c: 1450, a: 0.6, bs: -14 },
    muscle: { Z: 1.70, c: 1580, a: 1.0, bs: -8 },
    fluid:  { Z: 1.52, c: 1520, a: 0.0, bs: -60 },      // bile, water: almost no attenuation, nothing scatters
    wall:   { Z: 1.75, c: 1540, a: 0.5, bs: 6 },        // gallbladder and bowel wall (fibrous, a little stiffer)
    bone:   { Z: 7.80, c: 4080, a: 20, bs: 10 },
    air:    { Z: 0.0004, c: 330, a: 1e9, bs: -60 },
  };
  const refl = (m1, m2) => ((MAT[m2].Z - MAT[m1].Z) / (MAT[m2].Z + MAT[m1].Z)) ** 2;
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;

  // ---- the two scenes ----
  // body: right upper abdomen, linear probe across: skin, fat, muscle with a rib, liver with the gallbladder and a
  // loop of bowel with gas
  const BODY = {
    skin: 0.15, fat: 1.65, muscle: 2.6,
    rib: { x: -1.7, z: 2.1, rx: 0.7, rz: 0.4 },
    gb: { x: -0.2, z: 6.0, rx: 1.1, rz: 0.75, wall: 0.1 },
    gas: { x: 1.75, z: 5.0, rx: 0.6, rz: 0.35, wall: 0.15 },
  };
  // phantom: tissue-like background, a 2 cm layer of the chosen material centred at 4 cm (it can be tilted about
  // the middle of the image), and rows of wires at 8 and 12 cm
  const PH = { zc: 4, half: 1, wires: [-1.6, -0.8, 0, 0.8, 1.6], wireZ: [8, 12] };
  const ell = (o, x, z, grow = 0) => ((x - o.x) / (o.rx + grow)) ** 2 + ((z - o.z) / (o.rz + grow)) ** 2;
  const inSlab = (x, z, s) => Math.abs((z - PH.zc - x * Math.tan(rad(s.tilt))) * Math.cos(rad(s.tilt))) < PH.half;

  function mat(x, z, s) {
    if (s.scene === "phantom") return inSlab(x, z, s) ? s.layer : "soft";
    const B = BODY;
    if (z < B.skin) return "skin";
    if (z < B.fat) return "fat";
    if (ell(B.rib, x, z) < 1) return "bone";
    if (z < B.muscle) return "muscle";
    if (ell(B.gb, x, z) < 1) return "fluid";
    if (ell(B.gb, x, z, B.gb.wall) < 1) return "wall";
    if (ell(B.gas, x, z) < 1) return "air";
    if (ell(B.gas, x, z, B.gas.wall) < 1) return "wall";
    return "soft";
  }
  // the boundary's normal as an angle from straight down (radians), and whether it is rough
  function normal(x, z, s) {
    if (s.scene === "phantom") return [-rad(s.tilt), s.surface === "rough"];
    for (const [o, rough] of [[BODY.rib, false], [BODY.gb, false], [BODY.gas, true]]) {
      const e = ell(o, x, z);
      if (e > 0.5 && e < 1.8) {
        const gx = (x - o.x) / o.rx ** 2, gz = (z - o.z) / o.rz ** 2;
        return [Math.abs(gz) < 1e-9 ? Math.sign(gx) * Math.PI / 2 : Math.atan(gx / gz), rough];
      }
    }
    return [0, false];
  }
  // how much of a smooth boundary's echo comes back to the probe at the angle a (radians): dB
  const lobeW = s => rad(2 + 12 / s.f);
  const lobeDb = (a, rough, s) => rough ? -12 : Math.max(-60, -4.343 * (a / lobeW(s)) ** 2);
  // the largest angle at which sound still gets from soft tissue into the layer (null: no such angle)
  const critical = m => MAT[m].c > C ? deg(Math.asin(C / MAT[m].c)) : null;

  // ---- follow the sound down one line ----
  // x0: where the line starts (cm). Calls step(x, z, zd, I, m) for every half cell along the beam (true position,
  // drawn depth, one-way strength in dB, tissue) and echo(zd, db, info) for every boundary (and the copies that
  // bounce between the boundary and the probe). Returns the boundaries found.
  function trace(x0, s, step, echo) {
    const dz = DZ / 2, out = [];
    let x = x0, z = 0, zd = 0, psi = 0, I = 0, m = mat(x0, 0.0001, s);
    if (!s.gel) {                                              // a thin layer of air between the probe and the skin
      const R = refl("soft", "air");
      echo && echo(0.02, SPEC, { gel: true });
      for (let k = 1; k <= 12; k++) echo && echo(0.02 + 0.3 * k, SPEC - 8 * k, { gel: true });
      I += 10 * Math.log10(1 - R);
      out.push({ zd: 0, m1: "air", m2: m, R, T: 1 - R, inc: 0, lobe: 0, total: false, gel: true });
    }
    while (zd < DMAX && z < DMAX) {
      const c = MAT[m].c;
      z += dz * Math.cos(psi); x += dz * Math.sin(psi);
      zd += dz * C / c;
      I -= MAT[m].a * s.f * dz;
      if (I < -150 || (s.stopZ && z > s.stopZ)) break;
      const m2 = mat(x, z, s);
      if (m2 !== m) {
        const [phi, rough] = normal(x, z, s), a = psi - phi, R = refl(m, m2);
        const lobe = lobeDb(Math.abs(a), rough, s);
        const db = R > 1e-6 ? 10 * Math.log10(R) + SPEC + lobe + 2 * I : -200;
        const sn = MAT[m2].c / c * Math.sin(a), total = Math.abs(sn) >= 1;
        const b = { zd, z, x, m1: m, m2, R, T: total ? 0 : 1 - R, inc: deg(Math.abs(a)), lobe, total,
                    refr: total ? null : deg(Math.abs(Math.asin(sn))), Ibefore: I };
        out.push(b);
        echo && echo(zd, db, b);
        if (m2 === "air" && !rough) for (let k = 2; k <= 4; k++) echo && echo(k * zd, db - REVERB * (k - 1), { reverb: k });
        if (m2 === "air" && rough) for (let k = 2; k <= 4; k++) echo && echo(k * zd, db - 6 - REVERB * (k - 1), { reverb: k });
        if (total) { I = -300; break; }
        I += 10 * Math.log10(1 - R);
        // bend the beam, except in bone and air: almost nothing comes through them anyway
        if (!["bone", "air"].includes(m2) && !["bone", "air"].includes(m)) psi = phi + Math.asin(sn);
        m = m2;
        if (I < -150) break;
      }
      step && step(x, z, zd, I, m);
    }
    return out;
  }

  // ---- the numbers ----
  const lambda = s => C / (s.f * 1e6) * 1000;                // mm
  const axial = s => 2 * lambda(s) / 2;                       // mm, a 2-cycle pulse (U1)
  const beam = s => 0.5 + 4 / s.f;                            // mm (U3)
  const penetration = s => 70 / (2 * ALPHA * s.f);            // cm in soft tissue
  // one-way strength along the line at drawn depth zd (dB), compared with plain soft tissue
  function strengthAt(x0, zd, s) {
    let last = 0, reached = false;
    trace(x0, s, (x, z, d, I) => { if (d <= zd) last = I; else reached = true; });
    return reached ? last : -150;                              // the sound never got that far
  }
  function model(s) {
    const bounds = trace(s.x, s);
    const out = { pen: penetration(s), lam: lambda(s), bounds };
    if (s.scene === "phantom") {
      const L = s.layer;
      out.Z = MAT[L].Z; out.R = refl("soft", L);
      out.crit = critical(L);
      // straight through the middle of the layer (x = 0)
      const top = trace(0, s).find(b => b.m2 === L);
      out.inc = s.tilt; out.lobe = lobeDb(rad(s.tilt), s.surface === "rough", s);
      out.total = top ? top.total : false; out.refr = top ? top.refr : null;
      const above = strengthAt(0, 2.5, s), below = strengthAt(0, 6.5, s), ref = -ALPHA * s.f * 4;  // 4 cm of soft tissue
      out.through = below - above - ref;                       // dB lost in the layer and its two boundaries, beyond soft tissue
      out.throughPct = 100 * 10 ** (out.through / 10);
      // where the wires at 8 cm are drawn compared with where they are (refraction), cm
      out.shift = top && !out.total && s.tilt > 0 ? shiftAt(s) : 0;
    }
    // the strongest boundary the chosen line meets, and the difference in sound at 10 cm compared with soft tissue
    const real = bounds.filter(b => !b.gel && b.R > 1e-5);
    out.strong = real.length ? real.reduce((a, b) => (b.R > a.R ? b : a)) : null;
    out.gelR = s.gel ? null : refl("soft", "air");
    const ref10 = s.scene === "phantom" ? -ALPHA * s.f * 10 : null;
    out.at10 = strengthAt(s.x, 10, s);
    out.diff10 = ref10 === null ? out.at10 - bodyRef(s, 10) : out.at10 - ref10;
    return out;
  }
  // the body scene's plain line (through fat, muscle and liver only) at drawn depth zd
  function bodyRef(s, zd) { return strengthAt(0.9, zd, { ...s, gel: true }); }
  // the line that sees the middle wire at 8 cm: how far sideways from it does it start? (refraction, cm)
  function shiftAt(s) {
    const s8 = { ...s, stopZ: PH.wireZ[0] + 0.05 };
    const hit = x0 => { let xt = null; trace(x0, s8, (x, z) => { if (xt === null && z >= PH.wireZ[0]) xt = x; }); return xt; };
    let best = [0, Infinity];
    const look = (a, b, d) => { for (let x0 = a; x0 <= b + 1e-9; x0 += d) { const xt = hit(x0); if (xt !== null && Math.abs(xt) < Math.abs(best[1])) best = [x0, xt]; } };
    look(-1, 1, 0.02);                                          // coarse, then fine around the best
    const c = best[0]; look(c - 0.02, c + 0.02, 0.001);
    return best[1] === Infinity ? 0 : best[0];
  }
  return { C, W, DMAX, DX, DZ, NX, NZ, NOISE_DB, ALPHA, SPEC, WIRE_DB, MAT, BODY, PH,
           refl, mat, normal, lobeDb, critical, trace, lambda, axial, beam, penetration, strengthAt, model, shiftAt };
})();
if (typeof module !== "undefined") module.exports = TM;
