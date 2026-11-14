// Artefact simulator (ultrasound U5), the model. Our own simplified scenes; no real ultrasound images are used.
// Shared by the page (artefacts.js) and by the number checks in node, so it touches no browser objects.
//
// The image is built like the knobology simulator's: tissue echo levels times fixed random scatterers, blurred by the
// beam and the pulse, attenuated on the way down and up, plus electronic noise. On top of that come the artefacts:
//   shadow / enhancement   from the attenuation itself (stone, gas, bone: much; fluid: almost none)
//   edge shadow            where the beam grazes the wall of a round fluid structure, sound is refracted and spread
//                          away; modelled as extra loss (3 dB/cm/MHz) in wall cells the beam hits at a grazing angle
//   reverberation          a strong reflector at depth d0 sends echoes back and forth to the probe: copies at 2·d0, 3·d0 …,
//                          each bounce 10 dB weaker (20 dB with harmonic imaging)
//   comet tail             inside a needle the sound bounces between its walls: closely spaced echoes under the shaft
//   mirror image           behind the diaphragm the beam is reflected back into the liver; the echoes are drawn along
//                          the straight line, so the liver appears again behind the diaphragm
//   side lobes             weak extra beams 0.2 rad to the side (convex probe only), 28 dB weaker (45 dB with
//                          harmonic imaging); a strong reflector beside a fluid space leaves grey haze in it
//   slice thickness        the beam is several mm thick across the image; a small cyst fills only part of it, so
//                          tissue beside it is averaged in and the cyst turns grey
//   anisotropy             a tendon's fibres reflect like a mirror: tilted away from 90°, its echo falls fast
//   needle visibility      the shaft is a mirror too: the steeper the needle, the less sound comes back

const AR = (() => {
  const C = 154000;                    // speed of sound in soft tissue, cm/s
  const NOISE_DB = -70;                // electronic noise relative to the liver echo at the skin
  const BUILT_IN = 0.8, BUILT_MAX = 40, MID = -5, DR = 60, RAYLEIGH = -2.5;
  const FLUID = -60;
  const EDGE_ALPHA = 3;                // extra loss where the beam grazes a fluid wall, dB/cm/MHz
  const BOUNCE = 10, BOUNCE_HARM = 20; // dB lost per reverberation round trip
  const SIDE = -28, SIDE_HARM = -45;   // side-lobe level, dB
  const NEEDLE_GAP = 0.08;             // the needle's inner diameter, cm: the comet tail's spacing
  const LIVER = [0, 0.5], LIVER_FAT = [8, 0.9];   // level dB and attenuation for normal and fatty liver
  const CORTEX = -4;

  // ---- the two scenes: probe, frequency and grid ----
  const SCENES = {
    abdomen: { kind: "convex", f: 3.5, depth: 16, rc: 5, half: 35 * Math.PI / 180, dth: 0.0015, nhalf: 427, dd: 0.02,
               dap: 2.4, focus: 6, elev: [0.4, 7, 3], lines: 140 },
    surface: { kind: "linear", f: 10, depth: 4, width: 4, dx: 0.01, dd: 0.005, dap: 1.0, focus: 1.5, elev: [0.1, 1.5, 0.7], lines: 200 },
  };
  for (const P of Object.values(SCENES)) {
    P.nr = Math.round(P.depth / P.dd);
    P.nc = P.kind === "convex" ? 2 * P.nhalf + 1 : Math.round(P.width / P.dx);
  }
  // the beam for column j: where it starts at the skin, and its direction
  function ray(P, j) {
    if (P.kind === "convex") { const t = (j - P.nhalf) * P.dth, s = Math.sin(t), c = Math.cos(t); return [P.rc * s, P.rc * c - P.rc, s, c]; }
    return [-P.width / 2 + (j + 0.5) * P.dx, 0, 0, 1];
  }
  const colWidth = (P, d) => P.kind === "convex" ? (P.rc + d) * P.dth : P.dx;     // cm between grid columns at depth d
  const elev = (P, d) => P.elev[0] * Math.sqrt(1 + ((d - P.elev[1]) / P.elev[2]) ** 2);   // slice thickness, cm
  // two-way beam width (same model as the knobology simulator), narrower with harmonic imaging
  function beamWidth(P, harm) {
    const lam = C / (P.f * 1e6), F = Math.max(P.focus / P.dap, 1.5), w0 = lam * F, zr = 3.5 * lam * F * F;
    return d => {
      const a = w0 * Math.sqrt(1 + ((d - P.focus) / zr) ** 2), b = lam * Math.max(d / P.dap, 2);
      return (harm ? 0.7 : 1) / Math.sqrt(1 / (a * a) + 1 / (b * b));
    };
  }

  // ---- shapes ----
  // a round fluid structure with the slice thickness taken into account. Returns null outside its wall.
  // in: level and attenuation of the tissue it sits in; e: slice thickness here; D: the beam's direction
  function fluidRound(px, py, cx, cy, r, rElev, e, inside, D, out) {
    const dx = px - cx, dy = py - cy, dist = Math.hypot(dx, dy), wall = 0.06;
    if (dist > r + wall) return false;
    if (dist > r) {                                   // the wall; grazing beams lose sound here (edge shadow)
      const g = Math.abs((dx * D[0] + dy * D[1]) / dist);
      out[0] = 6; out[1] = g < 0.3 ? EDGE_ALPHA : inside[1]; out[2] = 0; out[3] = 0; out[4] = g < 0.3 ? 1 : 0;
      return true;
    }
    // inside: how much of the slice the fluid fills along the elevation direction
    const chord = 2 * rElev * Math.sqrt(1 - (dist / r) ** 2), f = Math.min(1, chord / e);
    out[0] = 10 * Math.log10((1 - f) * 10 ** (inside[0] / 10) + f * 10 ** (FLUID / 10));
    out[1] = (1 - f) * inside[1] + f * 0.002; out[2] = 0; out[3] = 0; out[4] = 0;
    return true;
  }
  // a kidney (the knobology simulator's shape, simplified): only its outer layers matter here
  function kidneyLevel(u, v, a, b) {
    const p = Math.hypot(u / a, v / b);
    if (p > 1) return Math.hypot(u / (a + 0.5), v / (b + 0.5)) < 1 ? 3 : null;      // perirenal fat
    if (p > 0.975) return 10;                                                       // capsule
    const psi = Math.atan2(v / b, u / a);
    if (Math.hypot(u / (a - 2), v / (b - 1.4)) - 0.1 * Math.sin(5 * psi) < 1) return 7;   // sinus fat
    const pc = Math.hypot(u / (a - 0.7), v / (b - 0.7));
    if (pc < 1 && Math.cos(9 * psi + 0.5) > 0.4) return -12;                        // pyramids
    return CORTEX;
  }

  // ---- the abdomen: liver, gallbladder, diaphragm, the top of the right kidney; cyst, stone and bowel gas can move ----
  const GB = { x: 1.6, y: 5.4, a: 2.8, b: 1.4, phi: -0.3, el: 1.6 };
  GB.c = Math.cos(GB.phi); GB.s = Math.sin(GB.phi);
  const KID = { x: 4.2, y: 11.0, a: 5.0, b: 2.3, phi: -0.2 };
  const DIA = { x: -0.5, y: 7.2, r: 7.5, xmax: -3 };
  // out: [level dB, attenuation, coherent level dB (0 = none), reverberation kind (1 gas, 2 needle), edge cell]
  function superficial(x, d, out) {
    if (d < 0.12) { out[0] = 6; out[1] = 0.6; return true; }
    if (d < 1.3) {
      out[0] = Math.abs(d - 0.55 - 0.05 * Math.sin(2 * x)) < 0.025 || Math.abs(d - 0.95 - 0.06 * Math.sin(1.3 * x + 1)) < 0.025 ? 2 : -14;
      out[1] = 0.6; return true;
    }
    if (d < 2.2) { out[0] = -9 + 3 * Math.sin(d * 2 * Math.PI / 0.22); out[1] = 0.7; return true; }
    if (d < 2.28) { out[0] = 10; out[1] = 0.5; return true; }
    return false;
  }
  function abdomenDeep(s, x, y, d, D, out) {
    out[2] = 0; out[3] = 0; out[4] = 0;
    const liver = s.fatty ? LIVER_FAT : LIVER, P = SCENES.abdomen;
    if (s.gas) {                                     // a pocket of bowel gas: a mirror-bright surface, nothing behind it
      const dx = x - s.gasX, dy = y - s.gasY, dist = Math.hypot(dx, dy), r = 0.8;
      if (dist < r) {
        const facing = (dx * D[0] + dy * D[1]) / dist < 0;
        if (facing && dist > r - 0.06) { out[0] = 20; out[1] = 100; out[2] = 30; out[3] = 1; return; }
        out[0] = -30; out[1] = 100; return;
      }
    }
    if (s.stone) {                                   // a stone: bright front surface, then almost total loss
      const dx = x - s.stoneX, dy = y - s.stoneY, dist = Math.hypot(dx, dy), r = 0.45;
      if (dist < r) {
        const facing = (dx * D[0] + dy * D[1]) / dist < 0;
        if (facing && dist > r - 0.08) { out[0] = 20; out[1] = 30; out[2] = 22; return; }
        out[0] = -20; out[1] = 30; return;
      }
    }
    if (s.cyst && fluidRound(x, y, s.cystX, s.cystY, s.cystR, s.cystR, elev(P, d), liver, D, out)) return;
    { // the gallbladder: an ellipse of bile with a thin bright wall
      const dx = x - GB.x, dy = y - GB.y, u = dx * GB.c + dy * GB.s, v = -dx * GB.s + dy * GB.c, p = Math.hypot(u / GB.a, v / GB.b);
      if (p < 1 + 0.05 / GB.b) {
        if (p >= 1) {
          let nu = u / (GB.a * GB.a), nv = v / (GB.b * GB.b); const nl = Math.hypot(nu, nv); nu /= nl; nv /= nl;
          const nx = nu * GB.c - nv * GB.s, ny = nu * GB.s + nv * GB.c, g = Math.abs(nx * D[0] + ny * D[1]);
          out[0] = 6; out[1] = g < 0.3 ? EDGE_ALPHA : 0.5; out[4] = g < 0.3 ? 1 : 0; return;
        }
        const chord = 2 * GB.el * Math.sqrt(1 - p * p), f = Math.min(1, chord / elev(P, d));
        out[0] = 10 * Math.log10((1 - f) * 10 ** (liver[0] / 10) + f * 10 ** (FLUID / 10)); out[1] = (1 - f) * liver[1] + f * 0.002; return;
      }
    }
    if (y > 13.6 + 0.1 * x) { out[0] = -6 + 3 * Math.sin(y * 2 * Math.PI / 0.3); out[1] = 0.7; return; }   // back muscles
    { // the top of the right kidney, behind the liver: liver against cortex shows how bright the liver is
      const dx = x - KID.x, dy = y - KID.y, c = Math.cos(KID.phi), sn = Math.sin(KID.phi);
      const k = kidneyLevel(dx * c + dy * sn, -dx * sn + dy * c, KID.a, KID.b);
      if (k !== null) { out[0] = k; out[1] = 0.5; return; }
    }
    if (Math.hypot(x + 3.4, y - 4.0) < 0.4) { out[0] = FLUID; out[1] = 0.15; return; }        // a hepatic vein
    const pv = Math.hypot(x + 1.0, y - 9.6);                                                  // a portal vein, bright wall
    if (pv < 0.45) { out[0] = FLUID; out[1] = 0.15; return; }
    if (pv < 0.57) { out[0] = 8; out[1] = 0.5; return; }
    out[0] = liver[0]; out[1] = liver[1];
  }
  // the diaphragm: where a beam leaves the circle on the head side, it is reflected back into the liver
  function diaphragmHit(o) {
    const ox = o[0] - DIA.x, oy = o[1] - DIA.y, b = ox * o[2] + oy * o[3], c = ox * ox + oy * oy - DIA.r * DIA.r;
    const t = -b + Math.sqrt(b * b - c);                    // the probe is inside the circle: the far crossing
    const px = o[0] + t * o[2], py = o[1] + t * o[3];
    if (px > DIA.xmax) return null;
    const nx = (px - DIA.x) / DIA.r, ny = (py - DIA.y) / DIA.r, dn = o[2] * nx + o[3] * ny;
    return { t, px, py, rx: o[2] - 2 * dn * nx, ry: o[3] - 2 * dn * ny };
  }

  // ---- the surface scene: skin, fat, a tendon, muscle and bone, with a needle and a small cyst ----
  function tendonLevel(angle) { return 8 + 20 * Math.log10(Math.max(Math.exp(-((angle / 6) ** 2)), 10 ** (-24 / 20))); }
  function needleLevel(beta) { return 30 + 20 * Math.log10(Math.max(Math.exp(-((beta / 14) ** 2)), 10 ** (-40 / 20))); }
  // the needle comes in from the right: its tip stays where it is aimed, and the angle sets where it enters the skin
  const needleTip = s => [s.needleX, s.needleY];
  const needleEntry = s => [s.needleX + s.needleY / Math.tan(s.needleA * Math.PI / 180), 0];
  function surfaceAt(s, x, y, d, D, out) {
    out[2] = 0; out[3] = 0; out[4] = 0;
    if (s.needle) {                                      // the shaft: distance to the segment from entry to tip
      const [tx, ty] = needleTip(s), [ex, ey] = needleEntry(s), vx = tx - ex, vy = ty - ey, L2 = vx * vx + vy * vy;
      const t = Math.max(0, Math.min(1, ((x - ex) * vx + (y - ey) * vy) / L2)), dist = Math.hypot(x - ex - t * vx, y - ey - t * vy);
      if (dist < 0.04) {
        const tip = Math.hypot(x - tx, y - ty) < 0.1;
        out[0] = 10; out[1] = 5; out[2] = Math.max(needleLevel(s.needleA), tip ? 15 : -99); out[3] = 2; return;
      }
    }
    if (y < 0.08) { out[0] = 6; out[1] = 0.6; return; }
    if (y < 0.42) { out[0] = Math.abs(y - 0.25 - 0.03 * Math.sin(3 * x)) < 0.012 ? 2 : -14; out[1] = 0.6; return; }
    { // the tendon: fibres along its length; it tapers into the muscle at the middle of the image
      const ta = s.tendonA * Math.PI / 180, yc = 0.66 + Math.tan(ta) * (x + 2), half = 0.2 * Math.min(1, Math.max(0, (0.6 - x) / 0.8));
      const dy = (y - yc) * Math.cos(ta);
      if (half > 0 && Math.abs(dy) < half + 0.02) {
        if (Math.abs(dy) >= half) { out[0] = 4; out[1] = 0.6; return; }                         // paratenon
        out[0] = tendonLevel(s.tendonA) + 4 * Math.cos(dy * 2 * Math.PI / 0.05); out[1] = 0.8; return;   // fibrils
      }
    }
    const yb = 3.0 + 0.06 * x * x;                       // the bone's surface
    if (y > yb) { const surf = y < yb + 0.06; out[0] = surf ? 20 : -20; out[1] = 20; out[2] = surf ? 15 : 0; return; }
    const muscle = [((-x * 0.42 + y * 0.9) / 0.4 % 1 + 1) % 1 < 0.08 ? 4 : -10, 0.7];   // muscle with bright pennate septa
    if (s.cyst && fluidRound(x, y, s.cystX, s.cystY, s.cystR, s.cystR, elev(SCENES.surface, d), muscle, D, out)) return;
    out[0] = muscle[0]; out[1] = muscle[1];
  }

  // ---- the map on the grid: level, attenuation, coherent level and the first strong reflector per column ----
  function buildMap(s) {
    const P = SCENES[s.scene], N = P.nr * P.nc, amp = new Float32Array(N), alpha = new Float32Array(N), spec = new Float32Array(N);
    const edge = new Uint8Array(N), rev = [], mirror = [], out = [0, 0, 0, 0, 0], tmp = [0, 0, 0, 0, 0];
    for (let j = 0; j < P.nc; j++) {
      const o = ray(P, j), D = [o[2], o[3]];
      const hit = s.scene === "abdomen" ? diaphragmHit(o) : null;
      let first = null;
      for (let i = 0; i < P.nr; i++) {
        const d = (i + 0.5) * P.dd, x = o[0] + d * o[2], y = o[1] + d * o[3], k = i * P.nc + j;
        if (s.scene === "abdomen") {
          if (!superficial(x, d, out)) {
            out[2] = 0; out[3] = 0; out[4] = 0;
            if (hit && d > hit.t - 0.12) {
              if (d < hit.t + 0.12) { out[0] = 14; out[1] = 0.5; out[2] = 8; }         // the diaphragm: a bright line
              else {                                      // behind it: the liver again, reached by the reflected beam
                const q = d - hit.t, qx = hit.px + q * hit.rx, qy = hit.py + q * hit.ry;
                abdomenDeep(s, qx, qy, d, [hit.rx, hit.ry], tmp);
                out[0] = tmp[0] - 4; out[1] = tmp[1]; out[2] = tmp[2] ? tmp[2] - 4 : 0;
              }
            } else abdomenDeep(s, x, y, d, D, out);
          } else { out[2] = 0; out[3] = 0; out[4] = 0; }
        } else surfaceAt(s, x, y, d, D, out);
        amp[k] = 10 ** (out[0] / 20); alpha[k] = out[1]; spec[k] = out[2] ? 10 ** (out[2] / 20) : 0; edge[k] = out[4];
        if (out[3] && !first) first = { i, kind: out[3], a: spec[k] };
      }
      rev.push(first); mirror.push(!!hit);
    }
    return { P, amp, alpha, spec, edge, rev, mirror };
  }

  // ---- numbers for the readouts and the tasks ----
  const fillFraction = (P, r, d) => Math.min(1, 2 * r / elev(P, d));        // at the cyst's centre
  function cystLevel(s) {                                                    // echo level at the centre of the cyst, dB
    const P = SCENES[s.scene], f = fillFraction(P, s.cystR, cystDepth(s)), around = s.scene === "abdomen" ? (s.fatty ? LIVER_FAT : LIVER)[0] : -10;
    return 10 * Math.log10((1 - f) * 10 ** (around / 10) + f * 10 ** (FLUID / 10));
  }
  function cystDepth(s) {
    const P = SCENES[s.scene];
    return P.kind === "convex" ? Math.hypot(s.cystX, s.cystY + P.rc) - P.rc : s.cystY;
  }
  function gasDepth(s) { const P = SCENES.abdomen; return Math.hypot(s.gasX, s.gasY + P.rc) - P.rc - 0.8; }   // its front surface on the line through its centre
  const stoneLoss = s => 2 * 30 * SCENES.abdomen.f * 0.9;                    // dB through the whole stone and back
  function model(s) {
    const P = SCENES[s.scene], lam = C / (P.f * 1e6);
    const m = { P, lam, cystDepth: cystDepth(s), slice: elev(P, cystDepth(s)), fill: fillFraction(P, s.cystR, cystDepth(s)),
                cystLevel: cystLevel(s), side: s.harm ? SIDE_HARM : SIDE, bounce: s.harm ? BOUNCE_HARM : BOUNCE,
                pen: -(NOISE_DB + (s.harm ? 6 : 0)) / (2 * 0.5 * P.f) };
    if (s.scene === "abdomen") {
      const liver = s.fatty ? LIVER_FAT : LIVER;
      Object.assign(m, { gasDepth: gasDepth(s), stoneLoss: stoneLoss(s), hepatorenal: liver[0] - CORTEX, liverAlpha: liver[1] });
    } else {
      Object.assign(m, { tendon: tendonLevel(s.tendonA) - tendonLevel(0), needle: needleLevel(s.needleA), gap: NEEDLE_GAP, tip: needleTip(s) });
    }
    return m;
  }
  // where the names go: x, y, Danish, English
  function labels(s) {
    if (s.scene === "abdomen") {
      const l = [[-2.6, 3.6, "Lever", "Liver"], [GB.x - 1.6, GB.y - 0.1, "Galdeblære", "Gallbladder"], [-6.2, 4.6, "Diafragma", "Diaphragm"],
                 [-6.4, 10.4, "Spejlbillede", "Mirror image"], [KID.x + 1, KID.y - 0.6, "Nyre", "Kidney"], [0, 0.75, "Fedt", "Fat"], [0, 1.75, "Muskel", "Muscle"]];
      if (s.cyst) l.push([s.cystX, s.cystY - s.cystR - 0.45, "Cyste", "Cyst"]);
      if (s.stone) l.push([s.stoneX + 1.0, s.stoneY + 0.3, "Sten", "Stone"]);
      if (s.gas) l.push([s.gasX, s.gasY - 1.2, "Tarmgas", "Bowel gas"]);
      return l;
    }
    const l = [[-1.2, 0.25, "Fedt", "Fat"], [-1.3, 0.66 + Math.tan(s.tendonA * Math.PI / 180) * 0.7, "Sene", "Tendon"],
               [-0.3, 2.3, "Muskel", "Muscle"], [-1.2, 3.25, "Knogle", "Bone"], [0.6, 3.75, "Skygge", "Shadow"]];
    if (s.cyst) l.push([s.cystX, s.cystY - s.cystR - 0.18, "Cyste", "Cyst"]);
    if (s.needle) { const [tx, ty] = needleTip(s); l.push([tx + 0.1, ty - 0.22, "Kanylespids", "Needle tip"]); }
    return l;
  }
  // outlines of what is really there, for "Show what is real"
  function truth(s) {
    if (s.scene === "abdomen") {
      const t = [{ type: "ellipse", x: GB.x, y: GB.y, a: GB.a, b: GB.b, phi: GB.phi }, { type: "arc", x: DIA.x, y: DIA.y, r: DIA.r, xmax: DIA.xmax }];
      if (s.cyst) t.push({ type: "circle", x: s.cystX, y: s.cystY, r: s.cystR });
      if (s.stone) t.push({ type: "circle", x: s.stoneX, y: s.stoneY, r: 0.45 });
      if (s.gas) t.push({ type: "circle", x: s.gasX, y: s.gasY, r: 0.8 });
      return t;
    }
    const t = [];
    if (s.cyst) t.push({ type: "circle", x: s.cystX, y: s.cystY, r: s.cystR });
    if (s.needle) { const [tx, ty] = needleTip(s), [ex, ey] = needleEntry(s); t.push({ type: "line", x0: ex, y0: ey, x1: tx, y1: ty }); }
    return t;
  }

  return { C, NOISE_DB, BUILT_IN, BUILT_MAX, MID, DR, RAYLEIGH, SIDE, SIDE_HARM, BOUNCE, BOUNCE_HARM, NEEDLE_GAP, EDGE_ALPHA, SCENES, GB, DIA, KID,
           ray, colWidth, elev, beamWidth, buildMap, model, labels, truth, needleTip, tendonLevel, needleLevel, fillFraction, needleEntry };
})();
if (typeof module !== "undefined") module.exports = AR;
