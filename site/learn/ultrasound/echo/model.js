// Sound and echo simulator (ultrasound U1): the model. Nothing is drawn here; echo.js draws.
// Everything is an own simple model with typical textbook numbers, not data from a scanner.
// Shared by the page and by the number checks in node, so it touches no browser objects.
//
//   wavelength          λ = c / f, with c = 1540 m/s in soft tissue
//   pulse length        n · λ (n cycles in the pulse); an echo lasts as long as the pulse, and on the screen
//                       that time is spread over half the pulse length (the sound goes down and back),
//                       so two reflectors closer than n · λ / 2 merge (axial resolution)
//   pulse-echo          an echo from depth d comes back after t = 2 d / c; the scanner draws it at c_set · t / 2,
//                       where c_set is the speed the scanner assumes (1540 m/s)
//   fat                 sound is slower in fat (1450 m/s), so everything under a fat layer comes back later
//                       and is drawn too deep
//   attenuation         0.5 dB/cm/MHz one way, so f · d dB there and back; the scanner's automatic depth gain
//                       takes it back and lifts the electronic noise (70 dB under the echo from soft tissue) with it,
//                       up to a ceiling; the noise reaches the echoes at about 70 / f cm (the same rule as U4)
//   frame rate          one line takes 2 · depth / c; 128 lines make a picture
//   grey scale          echo level in dB (log compression); 60 dB from black to white around a fixed mid grey
const EC = (() => {
  const C = 1540, C_FAT = 1450;                      // m/s
  const W = 5, DMAX = 18, DX = 0.04, DZ = 0.01;      // cm: image 5 cm wide, tissue modelled to 18 cm in 0.4 x 0.1 mm cells
  const NX = Math.round(W / DX), NZ = Math.round(DMAX / DZ);
  const LINES = 128, NOISE_DB = -70, ALPHA = 0.5;
  const SKIN = 0.15;

  // the slow layer: subcutaneous fat (abdomen) or a fat-like top layer (phantom), true depths in cm
  const fatLayer = s => s.scene === "belly" ? [SKIN, SKIN + s.fat] : [0, s.fat];

  // one-way travel time in µs to the true depth z (cm)
  function tau(z, s) {
    const [a, b] = fatLayer(s);
    const inFat = Math.max(0, Math.min(z, b) - a);
    return ((z - inFat) / C + inFat / C_FAT) * 1e4;
  }
  // where the scanner draws a true depth, and the true depth behind a drawn depth
  const toDisplay = (z, s) => s.cset * tau(z, s) * 1e-4;
  function toTrue(zd, s) {
    const t = zd / s.cset * 1e4, [a, b] = fatLayer(s);
    const ta = a / C * 1e4, tb = ta + (b - a) / C_FAT * 1e4;
    if (t <= ta) return t * C * 1e-4;
    if (t <= tb) return a + (t - ta) * C_FAT * 1e-4;
    return b + (t - tb) * C * 1e-4;
  }

  // ---- the two scenes ----
  // abdomen (right upper quadrant, linear probe across): skin, fat, muscle, liver with a stone-like calcification,
  // a portal vein branch, a simple cyst and a haemangioma. Positions below the fat move with the fat.
  const belly = s => {
    const fb = SKIN + s.fat;
    return {
      fb,
      calc: { x: 0.9, z: fb + 2.4, R: 0.15 },
      vein: { x: 1.0, z: fb + 5.0, R: 0.55 },
      cyst: { x: -1.2, z: fb + 6.2, R: 0.9 },
      hem: { x: 1.3, z: fb + 9.0, R: 0.6 },
    };
  };
  // phantom: a fat-like top layer, a column of wires every 1 cm, wire pairs (2, 1 and 0.5 mm apart) at 3 and 12 cm,
  // and four cylinders from anechoic to strongly hyperechoic at 7 cm
  const PH = {
    col: -2.1, pairs: [[-1.1, 0.2], [-0.1, 0.1], [0.9, 0.05]], pairZ: [3, 12],
    cyl: [[-1.3, -60, 0.45], [-0.2, -6, 0.45], [0.9, 6, 0.45], [2.0, 15, 0.4]], cylZ: 7,
  };
  const WIRE_DB = 45;

  // echo level of the tissue at (x, z) in dB relative to liver, and what it is
  function tissue(x, z, s) {
    if (s.scene === "phantom") {
      if (z < s.fat) return [-14, "fat"];
      for (const [cx, db, R] of PH.cyl) if ((x - cx) ** 2 + (z - PH.cylZ) ** 2 < R * R) return [db, "cyl"];
      return [0, "bg"];
    }
    const B = belly(s);
    if (z < SKIN) return [10, "skin"];
    if (z < B.fb) {
      for (const k of [0.3, 0.68]) if (Math.abs(z - (SKIN + k * s.fat + 0.06 * Math.sin(1.7 * x + k * 5))) < 0.025) return [0, "fat"];
      return [-14, "fat"];
    }
    if (z < B.fb + 0.8) return [((z - B.fb) % 0.22) < 0.04 ? -2 : -8, "muscle"];
    if (z < B.fb + 0.88) return [8, "capsule"];
    const r = (o) => Math.hypot(x - o.x, z - o.z);
    let db = 0, id = "liver";
    if (r(B.calc) < B.calc.R) return [28, "calc"];
    if (r(B.vein) < B.vein.R - 0.06) { db = -60; id = "vein"; }
    else if (r(B.vein) < B.vein.R) { db = 10; id = "wall"; }
    else if (r(B.cyst) < B.cyst.R - 0.04) { db = -60; id = "cyst"; }
    else if (r(B.cyst) < B.cyst.R) { db = 4; id = "wall"; }
    else if (r(B.hem) < B.hem.R) { db = 10; id = "hem"; }
    // the calcification sends almost nothing on: a shadow under it
    if (z > B.calc.z && Math.abs(x - B.calc.x) < B.calc.R && db > -60) { db -= 25; id = id === "liver" ? "shadow" : id; }
    return [db, id];
  }
  // point reflectors (wires) in the phantom: [x, true depth]
  function wires(s) {
    if (s.scene !== "phantom") return [];
    const out = [];
    for (let k = 1; k <= 17; k++) out.push([PH.col, k]);
    for (const z of PH.pairZ) for (const [x, sep] of PH.pairs) out.push([x, z], [x, z + sep]);
    return out;
  }

  // ---- the numbers ----
  const lambda = s => C / (s.f * 1e6) * 1000;                // mm, in soft tissue
  const pulseLen = s => s.cycles * lambda(s);                 // mm
  const axial = s => pulseLen(s) / 2;                         // mm
  const beam = s => 0.5 + 4 / s.f;                            // mm, the width of the beam (focusing is U3)
  const penetration = s => 70 / (2 * ALPHA * s.f);            // cm: where the lifted noise reaches the echoes
  const lineUs = s => 2 * s.depth / s.cset * 1e4;             // µs per line at the chosen depth
  function model(s) {
    const tl = lineUs(s);
    return {
      lam: lambda(s), spl: pulseLen(s), axial: axial(s), beam: beam(s), pen: penetration(s),
      lineUs: tl, prfMax: 1e6 / tl, fps: 1e6 / (tl * LINES),
      pulseZ: s.cset * s.t * 1e-4,                             // drawn depth the pulse has reached at time t
      echoZ: s.cset * s.t * 1e-4 / 2,                          // drawn depth of the echo arriving at time t
      tMax: tl,
      shift10: toDisplay(10, s) - 10,                          // cm: how wrong a reflector 10 cm deep is drawn
      resolved: PH.pairs.map(([, sep]) => sep * 10 > axial(s)),
    };
  }
  return { C, C_FAT, W, DMAX, DX, DZ, NX, NZ, LINES, NOISE_DB, ALPHA, SKIN, WIRE_DB, PH,
           fatLayer, tau, toDisplay, toTrue, belly, tissue, wires, lambda, pulseLen, axial, beam, penetration, lineUs, model };
})();
if (typeof module !== "undefined") module.exports = EC;
