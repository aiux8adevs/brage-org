// The probe and the beam simulator (ultrasound U3): the model. Nothing is drawn here; probe.js draws.
// Everything is an own simple model with typical textbook numbers, not data from a scanner.
// Shared by the page and by the number checks in node, so it touches no browser objects.
//
//   three probes        linear (flat face, parallel lines), curved (convex face, lines fan out from the curve) and
//                       phased (small flat face, the lines are steered out from one point)
//   axial resolution    half the pulse length; the pulse is 2 cycles, so it equals λ = c / f
//   lateral resolution  the two-way beam width: a transmit beam focused at the chosen focus depth(s) and a receive
//                       beam focused at every depth (dynamic receive focus), as in U4; the width at a focus is about
//                       λ · F, with the F-number F = focus depth / aperture
//   slice thickness     the beam's thickness across the image, set by a fixed lens on the probe face; small cysts fill
//                       in with echoes from the tissue beside them where the slice is thicker than the cyst
//   contrast            side lobes put a little of the bright tissue's echo into dark areas
//   frame rate          1 / (lines · focal zones · 2 · depth / c)
//   harmonics           the scanner listens at twice the sent frequency: a narrower beam and fewer side lobes, but
//                       the weaker signal does not reach as deep
const PM = (() => {
  const C = 154000;                                   // cm/s
  const NL = 192;                                     // modelled lines across the image (the field is worked out per line)
  const NOISE_DB = -70, ALPHA = 0.5, WIRE_DB = 22;

  // f: frequency range and start; depth range and start; aperture DAP and the lens's focus and height (cm);
  // the field: width (linear), or angle (curved, phased) and the radius of the face (curved)
  const PROBES = {
    linear: { f: [5, 15, 10], depth: [2, 10, 6], focus: 3, DAP: 1.5, lensF: 1.8, lensH: 0.4, width: 4, lines: 128, dz: 0.005, side: -30 },
    curved: { f: [2, 6, 3.5], depth: [4, 18, 14], focus: 6, DAP: 2.4, lensF: 6, lensH: 1.2, angle: 60, R: 5, lines: 128, dz: 0.01, side: -30 },
    phased: { f: [1.5, 4, 2.5], depth: [4, 18, 14], focus: 6, DAP: 2.0, lensF: 7, lensH: 1.3, angle: 90, lines: 96, dz: 0.01, side: -26 },
  };
  const rad = d => d * Math.PI / 180;

  // ---- the phantom: a resolution test object in soft-tissue-like gel (positions in cm, x across, z down) ----
  const PH = {
    column: { x: -1.5, z: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] },   // one wire each cm
    axial: { x: 1.3, z: [2.5, 3.1, 3.7], gap: [2, 1, 0.5] },                      // pairs one above the other, gap in mm
    lateral: { z: [5, 9, 13], x: [-0.6, 0.25, 1.0], gap: [3, 2, 1] },                   // pairs side by side, gap in mm
    cysts: { z: [1.6, 7, 15], x: [-0.6, 0.25, 1.1], d: [2, 4, 6] },                     // round cysts (spheres), diameter in mm
    contrast: { z: 11, r: 0.5, x: [-0.5, 0.7], db: [-3, 6] },                            // discs (cylinders) a little darker / brighter
  };
  function wires() {
    const out = PH.column.z.map(z => [PH.column.x, z, "column"]);
    PH.axial.z.forEach((z, k) => { const g = PH.axial.gap[k] / 10; out.push([PH.axial.x, z - g / 2, "axial"], [PH.axial.x, z + g / 2, "axial"]); });
    PH.lateral.z.forEach(z => PH.lateral.x.forEach((x, k) => { const g = PH.lateral.gap[k] / 10; out.push([x - g / 2, z, "lateral"], [x + g / 2, z, "lateral"]); }));
    return out;
  }
  const WIRES = wires();

  // ---- the field of view: where line l (0..NL-1) at range r (cm along the line) lies, and back ----
  function geom(s) {
    const P = PROBES[s.probe];
    if (s.probe === "linear") {
      const dx = P.width / NL;
      return { P, pos: (l, r) => [-P.width / 2 + (l + 0.5) * dx, r], spacing: () => dx,
               inv: (x, z) => [(x + P.width / 2) / dx - 0.5, z], half: () => P.width / 2 };
    }
    const th = rad(P.angle), dth = th / NL, R0 = s.probe === "curved" ? P.R : 0;
    const ang = l => -th / 2 + (l + 0.5) * dth;
    return { P, R0, pos: (l, r) => { const a = ang(l); return [(R0 + r) * Math.sin(a), (R0 + r) * Math.cos(a) - R0]; },
             spacing: r => Math.max(0.002, (R0 + r) * dth),
             inv: (x, z) => { const a = Math.atan2(x, z + R0); return [(a + th / 2) / dth - 0.5, Math.hypot(x, z + R0) - R0]; },
             half: z => (R0 + z) * Math.sin(th / 2) };
  }

  // ---- the beam ----
  const lam = s => C / (s.f * 1e6);                                       // cm
  const foci = s => (s.zones === 1 ? [0] : s.zones === 2 ? [-1.5, 1.5] : [-3, 0, 3]).map(o => Math.min(s.depth - 0.5, Math.max(1, s.focus + o)));
  function beam(s) {
    const P = PROBES[s.probe], L = lam(s), zs = foci(s), h = s.harm ? 0.7 : 1;
    const one = (d, z, D) => { const F = Math.max(z / D, 1.5), w0 = L * F, zr = 3.5 * L * F * F; return w0 * Math.sqrt(1 + ((d - z) / zr) ** 2); };
    const wtx = d => Math.min(...zs.map(z => one(d, z, P.DAP)));
    const wrx = d => L * Math.max(d / P.DAP, 2);
    const w = d => h / Math.sqrt(1 / wtx(d) ** 2 + 1 / wrx(d) ** 2);           // two-way lateral width (FWHM), cm
    const e = d => (s.harm ? 0.75 : 1) * one(d, P.lensF, P.lensH);           // slice thickness (FWHM), cm
    const wmin = Math.min(...zs.map(z => wtx(z)));
    const fg = d => Math.max(-6, 10 * Math.log10(wmin / wtx(d)));            // more energy where the sent beam is narrow
    return { L, zs, wtx, wrx, w, e, fg };
  }
  const axial = s => lam(s);                                                 // cm: 2 cycles, half the pulse length
  const side = s => s.harm ? PROBES[s.probe].side - 12 : PROBES[s.probe].side; // dB: side-lobe level
  const attK = s => s.harm ? 1.5 : 1;                                       // sent at f, heard at 2f on the way back
  const penetration = s => -NOISE_DB / (2 * ALPHA * s.f * attK(s));
  const frame = s => 1 / (PROBES[s.probe].lines * s.zones * 2 * s.depth / C);

  // ---- the phantom's own echo level at a point (dB, 0 = the gel's speckle), with the slice thickness e there ----
  const erf = x => { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  function tissue(x, z, e) {
    let amp = 1;                                                            // power share of the gel's echo
    const C2 = PH.contrast;
    C2.x.forEach((cx, k) => { if (Math.hypot(x - cx, z - C2.z) < C2.r) amp *= 10 ** (C2.db[k] / 10); });
    const sg = e / 2.355;
    PH.cysts.z.forEach(cz => PH.cysts.x.forEach((cx, k) => {
      const a = PH.cysts.d[k] / 20, rho = Math.hypot(x - cx, z - cz);
      if (rho >= a) return;
      const hh = Math.sqrt(a * a - rho * rho);                             // half the cyst's size across the slice here
      amp *= 1 - erf(hh / (sg * Math.SQRT2));                                // the slice's share that lies in the cyst
    }));
    return amp;
  }
  // how dark the middle of a cyst looks: the share of the slice that still sees gel, in dB (0 = as the gel)
  const cystFill = (s, k, z) => { const e = beam(s).e(z), a = PH.cysts.d[k] / 20; return 10 * Math.log10(Math.max(1e-6, 1 - erf(a / (e / 2.355 * Math.SQRT2)))); };
  // whether two wires a gap apart are seen as two: the echo between them falls 10 dB under the peaks, so a dark gap shows on the log grey scale
  // (w is the width of the echo's amplitude; its power is √2 narrower, as drawn on the page)
  function resolved(gap, w) {
    const sg = w / Math.SQRT2 / 2.355, g = x => Math.exp(-0.5 * (x / sg) ** 2);
    const mid = 2 * g(gap / 2), peak = Math.max(1 + g(gap), mid);
    return mid <= 0.1 * peak;
  }

  function model(s) {
    const B = beam(s), mz = s.mdepth;
    const P = PROBES[s.probe];
    return {
      lam: B.L, axial: axial(s), w: B.w(mz), e: B.e(mz), wFocus: B.w(B.zs[0]), frame: frame(s), pen: penetration(s),
      side: side(s), foci: B.zs, lines: P.lines,
      latRes: PH.lateral.gap.map(g => resolved(g / 10, B.w(mz))),
      axRes: PH.axial.gap.map(g => resolved(g / 10, axial(s))),
      cyst: PH.cysts.d.map((d, k) => cystFill(s, k, mz)),
      spacing: geom(s).spacing(mz),
    };
  }

  return { C, NL, NOISE_DB, ALPHA, WIRE_DB, PROBES, PH, WIRES, geom, lam, foci, beam, axial, side, attK, penetration, frame,
           tissue, cystFill, resolved, model, erf };
})();
if (typeof module !== "undefined") module.exports = PM;
