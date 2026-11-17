// Spejllaser: scrap is on its way to the dog's tower on the moon, and the tower's cannon has no power. The power
// comes from a laser that has to run through a field of mirrors and rails to a crystal. Some mirrors have a dial
// with a letter (A, B): the dial must be set to exactly the angle the letter marks in the drawing. The player works
// the angles out from the ones written on the drawing, types them, and switches the laser on. The beam then runs
// through the field: a right dial lets it pass, a wrong one burns it off at that mirror.
//
// Why guessing does not work:
//   - nothing is shown before the laser is on: no aim line, no preview, no "warmer/colder"
//   - the drawing is a sketch, as in the exam: every angle is drawn 5-11 degrees wrong on purpose, and the answer
//     has to be right to the degree
//   - two tries per board; the burnt-off beam leaves in a random direction, so it tells nothing about the miss
//
// One board, two tries:
//   right at once             -> full points, the row of hits grows, the cannon shoots the scrap down
//   first wrong dial          -> the dials the beam got past are locked as right, and the rule for the burnt one is shown
//   second wrong, or too late -> the tower loses a shield, time stands still, and the whole reasoning is shown in one line
//
// Two dials adapt to the player without saying so:
//   the maths level (1-5) picks the kinds of drawings. It follows the last five boards: all five right at the first
//     try -> up; three or fewer -> down, and the rule is then shown from the start for a while. 30 % of the boards
//     come from the level below. Tried on simulated pupils, weak to strong, that gives 75-80 % right first tries.
//   the pace (0.6-1.6) sets how long the scrap takes to arrive. Plenty of time left at a right answer -> a little
//     faster; nearly too late -> slower; too late without a try -> much slower (that means "too fast", not "too
//     hard", so then only the pace drops).
// Levels: 1 = one rule (supplementary, vertical, triangle sum), 2 = two steps (three angles on a line, exterior
// angle, isosceles), 3 = parallel rails (corresponding angles) and quadrilaterals, 4 = three steps (parallels with a
// second rule, crossing lines with a triangle), 5 = four steps and numbers that are not multiples of five.
//
// A run is nine boards; the last one has two mirror fields in a row: 5-10 minutes.
(() => {
  const canvas = document.getElementById("game");
  const g = Pixel.screen(canvas, 320, 180), { ctx, W, H } = g;
  const C = { sky: "#070b16", text: "#f2f6f0", dim: "#8ea3a8", ink: "#05090e", warn: "#ffcf5a", bad: "#ff6b5e", good: "#7cf2b2", cyan: "#5ad1ff",
              pink: "#ff7ac6", rail: "#b4c4d0", way: "#5f93b3", fibre: "#7a63b8", moon: "#39424f", moonHi: "#4b5666", moonLo: "#2b323d" };
  const GAME = "spejllaser";
  const BOARDS = 9, SHIELDS = 3, REVEAL = 6;
  const AREA = { x: 6, y: 16, w: 308, h: 124 };                   // where the drawing goes: under the top bar, over the hint line
  const TOWER = [305, 141];                                       // the tip of the tower's cannon
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = list => list[rnd(0, list.length - 1)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const TOUCH = matchMedia("(pointer: coarse)").matches;          // a phone or tablet: the hints name the buttons, not the keys
  const typing = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);   // keys typed in a field are not game keys

  const LOST = ["TÅRNET ER NU EN DEL AF SKROTBUNKEN", "VAKS FLYTTER NED I KÆLDEREN", "KANONEN FIK ALDRIG STRØM NOK"];
  const WON = ["VAKS LOGRER, OG TÅRNET LYSER", "IKKE EN SKRUE NÅEDE TÅRNET", "SPEJLENE ER STADIG VARME"];
  const CHEERS = ["LIGE I KRYSTALLEN!", "FULD STRØM!", "SPEJLBLANKT!", "ZAP!", "SKROTTET ER STØV"];

  // ---------- geometry helpers ----------
  // Angles are in degrees, counted the way they look on the screen: 0 = to the right, 90 = straight up.
  const rad = d => d * Math.PI / 180;
  const cot = d => 1 / Math.tan(rad(d));
  const pol = (p, a, len) => [p[0] + len * Math.cos(rad(a)), p[1] - len * Math.sin(rad(a))];
  // where the ray from p (heading a) meets the ray from q (heading b); t and s are the distances along the two rays
  function meet(p, a, q, b) {
    const u = [Math.cos(rad(a)), -Math.sin(rad(a))], v = [Math.cos(rad(b)), -Math.sin(rad(b))], x = u[0] * v[1] - u[1] * v[0];
    const t = ((q[0] - p[0]) * v[1] - (q[1] - p[1]) * v[0]) / x, s = ((q[0] - p[0]) * u[1] - (q[1] - p[1]) * u[0]) / x;
    return { p: [p[0] + u[0] * t, p[1] + u[1] * t], t, s };
  }
  // The drawing is a sketch: an angle is drawn 5-11 degrees off (and kept inside lo..hi, so the figure stays easy to
  // read). SKETCH is only ever 0 in the play-test, which then measures the drawn angles against the numbers.
  let SKETCH = 1;
  const sk = (a, lo = 28, hi = 152) => SKETCH ? clamp(a + pick([-1, 1]) * rnd(5, 11), lo, hi) : a;
  const deg = a => a + "°";
  const five = (lo, hi) => { let a; do a = 5 * rnd(lo / 5, hi / 5); while (a === 90); return a; };    // a multiple of 5, never a right angle
  const odd = () => pick([0, 0, 2, 3]);                           // now and then a number that is not a multiple of 5

  // ---------- the drawings ----------
  // Each maker returns one mirror field:
  //   P      named points, in the maker's own units (fitted to the screen later)
  //   path   the laser's way, from the emitter to the crystal
  //   rails  other lines: [from, to] or [from, to, "dash"] for an extension of a line
  //   marks  angles: { at, a, b } is the angle at point `at` between the directions to a and b, with t (a text),
  //          right (a right-angle mark) or dial (the number of the dial that sits there)
  //   ticks  sides marked as equal, chev: points with the "parallel" arrows
  //   dials  { at, ans, hint, calc }: the point on the laser's way, the answer, the rule and the reasoning. calc gets
  //          the dial's own letter and the letters of all dials in the field.
  //   t      seconds a pupil gets at pace 1
  const R = {
    nabo: "NABOVINKLER: TO VINKLER PÅ EN RET LINJE GIVER 180° TILSAMMEN",
    top: "TOPVINKLER (LIGE OVER FOR HINANDEN I ET KRYDS) ER LIGE STORE",
    tri: "VINKLERNE I EN TREKANT GIVER 180° TILSAMMEN",
    ret: "RETVINKLET TREKANT: DE TO ANDRE VINKLER GIVER 90° TILSAMMEN",
    line: "VINKLERNE PÅ DEN ENE SIDE AF EN RET LINJE GIVER 180° TILSAMMEN",
    ext: "FIND DEN TREDJE VINKEL I TREKANTEN. BRUG SÅ NABOVINKLEN",
    ext2: "FIND FØRST NABOVINKLEN INDE I TREKANTEN. SÅ VINKELSUMMEN 180°",
    iso: "LIGEBENET TREKANT: DE TO VINKLER VED GRUNDLINJEN ER LIGE STORE",
    par: "PARALLELLE SKINNER: ENSLIGGENDE VINKLER ER LIGE STORE",
    par2: "ENSLIGGENDE VINKLER ER LIGE STORE. BRUG SÅ TOPVINKEL ELLER NABOVINKEL",
    quad: "VINKLERNE I EN FIRKANT GIVER 360° TILSAMMEN",
    quad2: "FIND FØRST NABOVINKLEN INDE I FIRKANTEN. VINKELSUMMEN ER 360°",
    chain: "FIND TREKANTENS TO VINKLER MED TOPVINKEL OG NABOVINKEL. SÅ 180°",
    bow: "DE TO TREKANTER HAR EN TOPVINKEL TIL FÆLLES I KRYDSET",
  };
  // a triangle with the laser going up one side and down the other; `right` puts a right angle at the far corner
  function triangle(right) {
    const a = right ? 5 * rnd(4, 14) + odd() : 5 * rnd(6, 17), c = right ? 90 : 5 * rnd(6, Math.min(17, (150 - a) / 5)), x = 180 - a - c;
    const da = sk(a, 28, right ? 62 : 70), dc = right ? 90 : sk(c, 28, 70), A = [0, 0], Cc = [140, 0];
    return { t: 30, P: { A, C: Cc, B: meet(A, da, Cc, 180 - dc).p }, rails: [["A", "C"]], path: ["A", "B", "C"],
      marks: [{ at: "A", a: "C", b: "B", t: deg(a) }, right ? { at: "C", a: "A", b: "B", right: true } : { at: "C", a: "A", b: "B", t: deg(c) }, { at: "B", a: "A", b: "C", dial: 0 }],
      dials: [{ at: "B", ans: x, hint: right ? R.ret : R.tri, calc: n => `${n} = 180-${a}-${c} = ${x}°` }] };
  }
  // a quadrilateral; mode "right" gives one right angle, "ext" gives one corner as the angle outside, "both" both
  function quad(mode) {
    for (let k = 0; k < 200; k++) {
      const o = mode === "both" ? () => rnd(-2, 2) : () => 0, ext = mode === "ext" || mode === "both";
      const a = mode === "right" || mode === "both" ? 90 : 5 * rnd(13, 24), b = 5 * rnd(13, 25) + o(), d = 5 * rnd(12, 23) + o(), c = 360 - a - b - d;
      if (c < 55 || c > 135) continue;
      for (const n of SKETCH ? [1, 0] : [0]) {                    // first as a sketch; drawn true to the numbers if the sketch folds over
        const s = v => v + n * pick([-1, 1]) * rnd(4, 8), da = a === 90 ? 90 : s(a), db = s(b), dd = s(d), dc = 360 - da - db - dd;
        const A = [0, 0], D = [130, 0], B = pol(A, da, 75), m = meet(B, da + db - 180, D, 180 - dd);
        if (m.t < 30 || m.s < 30 || dc < 45 || dc > 145) continue;
        const at = pick(["B", "C"]), x = at === "B" ? b : c, o2 = at === "B" ? c : b, e = 180 - d;
        const given = (p, q, r, v) => p === at ? { at: p, a: q, b: r, dial: 0 } : { at: p, a: q, b: r, t: deg(v) };
        return { t: mode === "both" ? 80 : ext ? 62 : 50, P: { A, B, C: m.p, D, E: [185, 0] }, rails: ext ? [["A", "D"], ["D", "E", "dash"]] : [["A", "D"]], path: ["A", "B", "C", "D"],
          marks: [a === 90 ? { at: "A", a: "D", b: "B", right: true } : { at: "A", a: "D", b: "B", t: deg(a) }, given("B", "A", "C", b), given("C", "B", "D", c),
                  ext ? { at: "D", a: "E", b: "C", t: deg(e) } : { at: "D", a: "A", b: "C", t: deg(d) }],
          dials: [{ at, ans: x, hint: ext ? R.quad2 : R.quad, calc: ext ? n => `NABOVINKEL: 180-${e} = ${d}°. ${n} = 360-${a}-${o2}-${d} = ${x}°`
                                                                         : n => `${n} = 360-${a}-${o2}-${d} = 360-${a + o2 + d} = ${x}°` }] };
      }
    }
  }
  // crossing lines with a triangle: a vertical angle, a supplementary angle and the angle sum
  function chain(any) {
    const m = any ? rnd(30, 60) : 5 * rnd(6, 12), e = any ? rnd(m + 30, 150) : 5 * rnd((m + 30) / 5, 30), y = 180 - e, x = e - m;
    const dm = sk(m, 28, 60), de = SKETCH ? clamp(sk(e), dm + 28, 150) : e, M = [60, 0], Cc = [170, 0], B = meet(M, dm, Cc, de).p;
    return { t: any ? 75 : 65, P: { S: [0, 0], M, C: Cc, E: [230, 0], R: pol(M, dm + 180, 50), B, T: pol(B, 25, 45) }, rails: [["R", "M"], ["M", "B"], ["C", "E", "dash"]], path: ["S", "M", "C", "B", "T"],
      marks: [{ at: "M", a: "S", b: "R", t: deg(m) }, { at: "C", a: "E", b: "B", t: deg(e) }, { at: "B", a: "M", b: "C", dial: 0 }],
      dials: [{ at: "B", ans: x, hint: R.chain, calc: n => `TOPVINKEL: ${m}°. NABOVINKEL: 180-${e} = ${y}°. ${n} = 180-${m}-${y} = ${x}°` }] };
  }
  const Q = [
    // ----- level 1: one rule -----
    { lv: 1, small: true, kind: "nabo", f() { const a = five(30, 150), M = [90, 0];
      return { t: 26, P: { S: [0, 0], M, E: [170, 0], T: pol(M, sk(a), 80) }, rails: [["M", "E", "dash"]], path: ["S", "M", "T"],
        marks: [{ at: "M", a: "E", b: "T", t: deg(a) }, { at: "M", a: "S", b: "T", dial: 0 }],
        dials: [{ at: "M", ans: 180 - a, hint: R.nabo, calc: n => `NABOVINKLER: ${n} = 180-${a} = ${180 - a}°` }] }; } },
    { lv: 1, small: true, kind: "kryds", f() { const a = five(30, 150), d = sk(a), M = [80, 0], top = Math.random() < 0.5;
      return { t: 26, P: { S: [0, 0], M, E: [160, 0], T: pol(M, d, 75), U: pol(M, d + 180, 75) }, rails: [["M", "E"], ["M", "U"]], path: ["S", "M", "T"],
        marks: [{ at: "M", a: "S", b: "U", t: deg(a) }, { at: "M", a: top ? "E" : "S", b: "T", dial: 0 }],
        dials: [top ? { at: "M", ans: a, hint: R.top, calc: n => `TOPVINKLER ER LIGE STORE: ${n} = ${a}°` }
                    : { at: "M", ans: 180 - a, hint: R.nabo, calc: n => `NABOVINKLER: ${n} = 180-${a} = ${180 - a}°` }] }; } },
    { lv: 1, small: true, kind: "tri", f: () => triangle(false) },
    { lv: 1, small: true, kind: "ret", f: () => triangle(true) },

    // ----- level 2: two steps -----
    { lv: 2, small: true, kind: "linje", f() { const v = pick(["mid", "side", "right"]), M = [90, 0];
      const a = v === "right" ? rnd(20, 70) : 5 * rnd(5, 13) + odd(), c = v === "right" ? 90 - a : 5 * rnd(5, 13) + odd(), b = 180 - a - c;
      const da = sk(a, 25, v === "right" ? 65 : 70), dc = v === "right" ? 90 - da : sk(c, 25, 70);
      const marks = [{ at: "M", a: "R1", b: "S", t: deg(a) }];
      if (v === "mid") marks.push({ at: "M", a: "T", b: "R2", t: deg(c) }, { at: "M", a: "S", b: "T", dial: 0 });
      else marks.push(v === "right" ? { at: "M", a: "S", b: "T", right: true } : { at: "M", a: "S", b: "T", t: deg(b) }, { at: "M", a: "T", b: "R2", dial: 0 });
      return { t: 36, P: { R1: [0, 0], M, R2: [180, 0], S: pol(M, 180 - da, 85), T: pol(M, dc, 85) }, rails: [["R1", "R2"]], path: ["S", "M", "T"], marks,
        dials: [{ at: "M", ans: v === "mid" ? b : c, hint: R.line, calc: v === "mid" ? n => `${n} = 180-${a}-${c} = ${b}°` : v === "right" ? n => `RET VINKEL: ${n} = 180-90-${a} = ${c}°` : n => `${n} = 180-${a}-${b} = ${c}°` }] }; } },
    { lv: 2, small: true, kind: "udv", f() { let a, b; do { a = 5 * rnd(6, 14) + odd(); b = 5 * rnd(6, 14) + odd(); } while (a + b > 145);
      const y = 180 - a - b, e = a + b, da = sk(a, 28, 62), db = sk(b, 28, 62), A = [0, 0], Cc = [110, 0], P = { A, C: Cc, E: [185, 0], B: meet(A, da, Cc, da + db).p };
      return Math.random() < 0.5
        ? { t: 40, P, rails: [["A", "B"], ["C", "E", "dash"]], path: ["A", "C", "B"],
            marks: [{ at: "A", a: "C", b: "B", t: deg(a) }, { at: "B", a: "A", b: "C", t: deg(b) }, { at: "C", a: "E", b: "B", dial: 0 }],
            dials: [{ at: "C", ans: e, hint: R.ext, calc: n => `I TREKANTEN: 180-${a}-${b} = ${y}°. NABOVINKEL: ${n} = 180-${y} = ${e}°` }] }
        : { t: 40, P, rails: [["A", "C"], ["C", "E", "dash"]], path: ["A", "B", "C"],
            marks: [{ at: "A", a: "C", b: "B", t: deg(a) }, { at: "C", a: "E", b: "B", t: deg(e) }, { at: "B", a: "A", b: "C", dial: 0 }],
            dials: [{ at: "B", ans: b, hint: R.ext2, calc: n => `NABOVINKEL: 180-${e} = ${y}°. I TREKANTEN: ${n} = 180-${a}-${y} = ${b}°` }] }; } },
    { lv: 2, small: true, kind: "ligeb", f() { const top = Math.random() < 0.5, t = 2 * rnd(15, 55), b = top ? (180 - t) / 2 : rnd(30, 72), x = top ? b : 180 - 2 * b, db = sk(b, 35, 70);
      return { t: 40, P: { A: [0, 0], C: [130, 0], B: [65, -65 * Math.tan(rad(db))] }, rails: [["A", "C"]], path: ["A", "B", "C"], ticks: [["A", "B"], ["B", "C"]],
        marks: top ? [{ at: "B", a: "A", b: "C", t: deg(t) }, { at: "A", a: "C", b: "B", dial: 0 }] : [{ at: "C", a: "A", b: "B", t: deg(b) }, { at: "B", a: "A", b: "C", dial: 0 }],
        dials: [{ at: top ? "A" : "B", ans: x, hint: R.iso, calc: top ? n => `LIGEBENET: ${n} = (180-${t})/2 = ${180 - t}/2 = ${x}°` : n => `LIGEBENET: BEGGE GRUNDVINKLER ER ${b}°. ${n} = 180-2·${b} = ${x}°` }] }; } },

    // ----- level 3: parallel rails and quadrilaterals -----
    { lv: 3, kind: "par", f() { const x = five(35, 145), dx = sk(x, 40, 140), v = pick(["corr", "alt", "co", "co2"]), g = 180 - x;
      const Qq = [0, 70], P = pol(Qq, dx, 70 / Math.sin(rad(dx))), x0 = Math.min(P[0], 0) - 50, x1 = Math.max(P[0], 0) + 75;
      const mark = { corr: { a: "R1", b: "S", t: deg(x) }, alt: { a: "L1", b: "Q", t: deg(x) }, co: { a: "R1", b: "Q", t: deg(g) }, co2: { a: "L1", b: "S", t: deg(g) } }[v];
      return { t: v === "corr" ? 40 : 50, P: { S: pol(Qq, dx, 70 / Math.sin(rad(dx)) + 40), P, Q: Qq, T: [x1, 70], L1: [x0, 0], R1: [x1, 0], L2: [x0, 70], c1: [x0 + 12, 0], c2: [x0 + 12, 70] },
        rails: [["L1", "R1"], ["L2", "Q"]], chev: ["c1", "c2"], path: ["S", "P", "Q", "T"], marks: [Object.assign({ at: "P" }, mark), { at: "Q", a: "P", b: "T", dial: 0 }],
        dials: [{ at: "Q", ans: x, hint: v === "corr" ? R.par : R.par2, calc: v === "corr" ? n => `ENSLIGGENDE VINKLER ER LIGE STORE: ${n} = ${x}°` : v === "alt" ? n => `TOPVINKEL: ${x}°. ENSLIGGENDE: ${n} = ${x}°`
          : n => `NABOVINKEL: 180-${g} = ${x}°. ENSLIGGENDE: ${n} = ${x}°` }] }; } },
    { lv: 3, kind: "zig", f() { const a = 5 * rnd(7, 15), c = 5 * rnd(7, 15), x = 180 - a - c, da = sk(a, 32, 70), dc = sk(c, 32, 70), up = Math.random() < 0.5;
      const Q2 = [70 * cot(da), 0], Q3 = [Q2[0] + 70 * cot(dc), 70];
      return { t: 60, P: { Q1: [0, 70], Q2, Q3, T: [Q3[0] + 60, 70], L1: [-30, 0], R1: [Q3[0] + 50, 0], L2: [-30, 70], c1: [-18, 0], c2: [-18, 70] },
        rails: [["L1", "R1"], ["L2", "Q3"]], chev: ["c1", "c2"], path: ["Q1", "Q2", "Q3", "T"],
        marks: [up ? { at: "Q2", a: "L1", b: "Q1", t: deg(a) } : { at: "Q1", a: "Q3", b: "Q2", t: deg(a) }, { at: "Q2", a: "R1", b: "Q3", t: deg(c) }, { at: "Q2", a: "Q1", b: "Q3", dial: 0 }, { at: "Q3", a: "Q1", b: "Q2", dial: 1 }],
        dials: [{ at: "Q2", ans: x, hint: up ? R.line : "FIND FØRST DEN ANDEN SKIVE. BRUG SÅ VINKELSUMMEN I TREKANTEN",
                  calc: up ? n => `RET LINJE VED DEN ØVERSTE SKINNE: ${n} = 180-${a}-${c} = ${x}°` : (n, N) => `${N[1]} = ${c}°. I TREKANTEN: ${n} = 180-${a}-${c} = ${x}°` },
                { at: "Q3", ans: c, hint: R.par2, calc: n => `ENSLIGGENDE + TOPVINKEL: ${n} = ${c}°` }] }; } },
    { lv: 3, kind: "partri", f() { const u = 5 * rnd(8, 15), t = 5 * rnd(6, 14), v = 180 - u - t, du = sk(u, 38, 72), dt = sk(t, 30, 70), dv = 180 - du - dt;
      const K = [95 * cot(du), 0], V2 = [K[0] + 95 * cot(dv), 95], U1 = [K[0] - 45 * cot(du), 45], U2 = [K[0] + 45 * cot(dv), 45];
      return { t: 50, P: { V1: [0, 95], K, V2, U1, U2, T: [V2[0] + 55, 95], a1: [U1[0] - 30, 45], a2: [U2[0] + 30, 45], b1: [-28, 95], c1: [U1[0] - 18, 45], c2: [-15, 95] },
        rails: [["a1", "a2"], ["b1", "V2"]], chev: ["c1", "c2"], path: ["V1", "K", "V2", "T"],
        marks: [{ at: "U1", a: "U2", b: "K", t: deg(u) }, { at: "K", a: "V1", b: "V2", t: deg(t) }, { at: "V2", a: "V1", b: "K", dial: 0 }],
        dials: [{ at: "V2", ans: v, hint: "ENSLIGGENDE VINKLER ER LIGE STORE. BRUG SÅ VINKELSUMMEN I TREKANTEN", calc: n => `ENSLIGGENDE: ${u}° VED DEN NEDERSTE SKINNE. ${n} = 180-${t}-${u} = ${v}°` }] }; } },
    { lv: 3, small: true, kind: "firkant", f: () => quad(pick(["plain", "plain", "right"])) },

    // ----- level 4: three steps -----
    { lv: 4, small: true, kind: "firkant", f: () => quad("ext") },
    { lv: 4, kind: "trapez", f() { const a = 5 * rnd(8, 16), d = 5 * rnd(8, 16), e = 180 - d, da = sk(a, 35, 75), dd = sk(d, 35, 75);
      const Q2 = [70 * cot(da), 0], Q3 = [Q2[0] + 60, 0], Q4 = [Q3[0] + 70 * cot(dd), 70];
      return { t: 62, P: { Q1: [0, 70], Q2, Q3, Q4, T: [Q4[0] + 60, 70], L1: [-30, 0], R1: [Q4[0] + 40, 0], L2: [-30, 70], c1: [-18, 0], c2: [-18, 70] },
        rails: [["L1", "Q2"], ["Q3", "R1"], ["L2", "Q4"]], chev: ["c1", "c2"], path: ["Q1", "Q2", "Q3", "Q4", "T"],
        marks: [{ at: "Q1", a: "Q4", b: "Q2", t: deg(a) }, { at: "Q4", a: "T", b: "Q3", t: deg(e) }, { at: "Q2", a: "Q1", b: "Q3", dial: 0 }, { at: "Q3", a: "Q2", b: "Q4", dial: 1 }],
        dials: [{ at: "Q2", ans: 180 - a, hint: R.par2, calc: n => `ENSLIGGENDE: ${a}° VED DEN ØVERSTE SKINNE. NABOVINKEL: ${n} = 180-${a} = ${180 - a}°` },
                { at: "Q3", ans: e, hint: R.par2, calc: n => `ENSLIGGENDE + TOPVINKEL: ${n} = ${e}°` }] }; } },
    { lv: 4, kind: "kaede", f: () => chain(false) },

    // ----- level 5: four steps, and numbers that are not multiples of five -----
    { lv: 5, kind: "sloejfe", f() {
      for (;;) { const a = rnd(40, 75), b = rnd(40, 75), m = 180 - a - b; if (m < 40 || m > 90) continue;
        const c = rnd(35, 150 - m), x = 180 - m - c;
        for (const n of SKETCH ? [1, 0] : [0]) { const s = v => v + n * pick([-1, 1]) * rnd(5, 9), da = s(a), db = s(b), dm = 180 - da - db, dc = s(c), dx = 180 - dm - dc;
          if (Math.min(da, db, dm, dc, dx) < 27) continue;
          const M = [0, 0], f = dm / 2, k = 85 / Math.max(Math.sin(rad(da)), Math.sin(rad(db))), k2 = 85 / Math.max(Math.sin(rad(dx)), Math.sin(rad(dc)));
          return { t: 80, P: { A: pol(M, 180 - f, k * Math.sin(rad(db))), B: pol(M, 180 + f, k * Math.sin(rad(da))), C: pol(M, f, k2 * Math.sin(rad(dx))), D: pol(M, -f, k2 * Math.sin(rad(dc))) },
            rails: [["B", "C"], ["A", "B"]], path: ["A", "D", "C"],
            marks: [{ at: "A", a: "B", b: "D", t: deg(a) }, { at: "B", a: "A", b: "C", t: deg(b) }, { at: "C", a: "B", b: "D", t: deg(c) }, { at: "D", a: "A", b: "C", dial: 0 }],
            dials: [{ at: "D", ans: x, hint: R.bow, calc: n => `I KRYDSET: 180-${a}-${b} = ${m}° (TOPVINKEL). ${n} = 180-${m}-${c} = ${x}°` }] }; } } } },
    { lv: 5, kind: "parligeb", f() { const gv = rnd(35, 72), dg = sk(gv, 35, 68), Q2 = [70 * cot(dg), 0], Q3 = [2 * Q2[0], 70];
      return { t: 80, P: { Q1: [0, 70], Q2, Q3, T: [Q3[0] + 60, 70], L1: [-30, 0], R1: [Q3[0] + 40, 0], L2: [-30, 70], c1: [-18, 0], c2: [-18, 70] },
        rails: [["L1", "R1"], ["L2", "Q3"]], chev: ["c1", "c2"], ticks: [["Q1", "Q2"], ["Q2", "Q3"]], path: ["Q1", "Q2", "Q3", "T"],
        marks: [{ at: "Q2", a: "L1", b: "Q1", t: deg(gv) }, { at: "Q2", a: "Q1", b: "Q3", dial: 0 }, { at: "Q3", a: "T", b: "Q2", dial: 1 }],
        dials: [{ at: "Q2", ans: 180 - 2 * gv, hint: "ENSLIGGENDE + TOPVINKEL GIVER GRUNDVINKLEN. TREKANTEN ER LIGEBENET", calc: n => `GRUNDVINKLERNE ER ${gv}° (ENSLIGGENDE + TOPVINKEL). ${n} = 180-2·${gv} = ${180 - 2 * gv}°` },
                { at: "Q3", ans: 180 - gv, hint: "FIND GRUNDVINKLEN I DEN LIGEBENEDE TREKANT. BRUG SÅ NABOVINKLEN", calc: n => `GRUNDVINKLEN ER ${gv}°. NABOVINKEL: ${n} = 180-${gv} = ${180 - gv}°` }] }; } },
    { lv: 5, small: true, kind: "firkant", f: () => quad("both") },
    { lv: 5, kind: "kaede", f: () => chain(true) },
  ];

  // ---------- from a drawing to the screen ----------
  // The drawing is scaled to fit its box (angles keep their size) and is now and then turned upside down. For every
  // angle mark the arc and the place of its text (on the line that halves the angle) are worked out once.
  function fit(f, box) {
    const pts = Object.values(f.P), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min((box.w - 34) / Math.max(1, x1 - x0), (box.h - 30) / Math.max(1, y1 - y0), 1.15), flip = Math.random() < 0.5 ? -1 : 1;
    f.Q = {};
    for (const k in f.P) f.Q[k] = [Math.round(box.x + box.w / 2 + (f.P[k][0] - (x0 + x1) / 2) * s), Math.round(box.y + box.h / 2 + flip * (f.P[k][1] - (y0 + y1) / 2) * s)];
    for (const m of f.marks) {
      const V = f.Q[m.at], p = f.Q[m.a], q = f.Q[m.b], a1 = Math.atan2(p[1] - V[1], p[0] - V[0]);
      let d = Math.atan2(q[1] - V[1], q[0] - V[0]) - a1;
      while (d > Math.PI) d -= 2 * Math.PI; while (d <= -Math.PI) d += 2 * Math.PI;
      const far = clamp(8 / Math.sin(Math.abs(d) / 2) + 3, 13, 26), mid = a1 + d / 2;
      Object.assign(m, { a1, d, lx: clamp(Math.round(V[0] + Math.cos(mid) * far), 9, W - 9), ly: clamp(Math.round(V[1] + Math.sin(mid) * far), 20, 135) });
    }
  }
  // one drawing from the level; `small` asks for one that can share the screen with another. Never the kind just seen.
  function choose(lv, small) {
    let pool = Q.filter(q => (small ? q.lv <= lv && q.lv >= lv - 1 && q.small : q.lv === lv));
    const fresh = pool.filter(q => !S.recent.includes(q.kind)); if (fresh.length) pool = fresh;
    const q = pick(pool);
    S.recent.push(q.kind); if (S.recent.length > 2) S.recent.shift();
    return Object.assign(q.f(), { kind: q.kind, lv: q.lv });
  }
  // A board: one drawing, or two in a row joined by a light fibre (always two on the last board). The single drawing
  // comes from the player's level, now and then from the level below; a pair is made of two easier drawings.
  function makeBoard(lv, last) {
    const two = last || (lv >= 2 && Math.random() < 0.25);
    const from = !two && lv > 1 && Math.random() < 0.3 ? lv - 1 : lv;
    const figs = two ? [choose(Math.max(1, lv - 1), true), choose(Math.max(1, lv - 2), true)] : [choose(from, false)];
    if (two && Math.random() < 0.5) figs.reverse();
    const half = (AREA.w - 8) / 2;
    figs.forEach((f, i) => fit(f, two ? { x: AREA.x + i * (half + 8), y: AREA.y, w: half, h: AREA.h } : AREA));
    const B = { figs, lv: from, dials: [], beam: [], T: 0, par: figs.some(f => f.chev) };
    figs.forEach((f, i) => {
      if (i) {                                                    // the fibre between two drawings: across, up or down, across
        const p = B.beam[B.beam.length - 1].p, q = f.Q[f.path[0]], mx = AREA.x + half + 4;
        B.fibre = [p, [mx, p[1]], [mx, q[1]], q];
        B.beam.push({ p: [mx, p[1]] }, { p: [mx, q[1]] });
      }
      const own = f.dials.map(d => Object.assign({ val: "", state: "open", told: false, fig: f, pos: f.Q[d.at] }, d));
      own.sort((a, b) => f.path.indexOf(a.at) - f.path.indexOf(b.at));
      f.path.forEach((name, k) => {
        const dl = own.find(d => d.at === name), a = f.Q[f.path[k - 1]], b = f.Q[name], c = f.Q[f.path[k + 1]];
        // a mirror stands wherever the laser's way bends (not where it just crosses a rail)
        const bend = !!(a && c && Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) > 40);
        B.beam.push({ p: b, dial: dl, bend });
      });
      f.own = own; B.dials.push(...own); B.T += f.t;
    });
    B.dials.forEach((d, i) => { d.n = "AB"[i]; });
    for (const f of figs) { const N = f.own.map(d => d.n); for (const d of f.own) d.line = d.calc(d.n, N); for (const m of f.marks) if (m.dial !== undefined) m.ref = f.dials.map(d => f.own.find(o => o.at === d.at && o.ans === d.ans))[m.dial]; }
    if (two) B.T *= 0.9;
    B.cum = [0]; for (let i = 1; i < B.beam.length; i++) B.cum.push(B.cum[i - 1] + Math.hypot(B.beam[i].p[0] - B.beam[i - 1].p[0], B.beam[i].p[1] - B.beam[i - 1].p[1]));
    return B;
  }

  // ---------- level from earlier runs (shared progress), else 1 ----------
  // a friend's run is not logged in the pupil's progress (see shared/leader.js), and starts at level 2
  const log = e => { if (!Leader.friend()) Progress.add(e); };
  function savedLevel() {
    const ev = Progress.events("spil").filter(e => e.s === GAME && e.mode === "niveau");
    return ev.length ? clamp(ev[ev.length - 1].lv, 1, 5) : 1;
  }

  // ---------- game state ----------
  let S;
  const STARS = Array.from({ length: 46 }, () => ({ x: Math.random() * W, y: Math.random() * 150, v: Math.random() < 0.3 ? 7 : 2 }));
  function newRun() {
    S = { phase: "title", lv: Leader.friend() ? 2 : savedLevel(), pace: 1, help: false, n: 0, board: null, sel: 0, left: 0, tries: 0, phaseT: 0, beam: null, stray: null,
          shields: SHIELDS, score: 0, streak: 0, best: 0, fx: [], shake: 0, flash: 0, time: 0, clock: 0, taught: false, note: { text: "", colour: C.warn, t: 0 },
          last: [], recent: [], stats: { first: 0, second: 0, lost: 0 }, wag: 0, won: false, line: "", calc: "", done: 0 };
  }
  const note = (text, colour = C.warn, t = 3) => { S.note = { text, colour, t }; };
  // effects: floating texts (pushed apart so they do not pile up), dots, spinning shards, rings and the cannon's shot
  function say(text, x, y, colour = C.text, t = 1.3) {
    const w = Pixel.width(text) / 2 + 2;
    for (const f of S.fx) if (f.kind === "text" && Math.abs(f.x - x) < 50 && f.y <= y + 3 && f.y > y - 30) f.y -= 7;
    S.fx.push({ kind: "text", text, x: clamp(x, w, W - w), y: Math.max(y, 22), vy: -9, colour, t, t0: t });
  }
  function burst(x, y, colour, n = 22, power = 1) {
    for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, v = (20 + Math.random() * 80) * power, t = 0.4 + Math.random() * 0.5;
      S.fx.push({ kind: "dot", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 15, colour: Math.random() < 0.3 ? "#ffffff" : colour, t, t0: t }); }
    for (let k = 0; k < n / 3; k++) { const a = Math.random() * 6.283, v = (25 + Math.random() * 45) * power, t = 0.7 + Math.random() * 0.5;
      S.fx.push({ kind: "shard", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, r: Math.random() * 6.283, vr: (Math.random() - 0.5) * 14, len: 2 + Math.random() * 4, colour: C.rail, t, t0: t }); }
    S.fx.push({ kind: "ring", x, y, r: 4, vr: 90 * power, colour, t: 0.35, t0: 0.35 });
  }
  const ring = (x, y, colour) => S.fx.push({ kind: "ring", x, y, r: 3, vr: 50, colour, t: 0.3, t0: 0.3 });

  // ---------- boards ----------
  const dials = () => S.board ? S.board.dials : [];
  const open = () => dials().filter(d => d.state === "open");
  const scrapX = () => 8 + (1 - clamp(S.left / S.board.T, 0, 1)) * (W - 24);   // where the scrap is on its way to the tower
  function startBoard() {
    S.n++; S.board = makeBoard(S.lv, S.n === BOARDS); S.board.T /= S.pace;
    S.left = S.board.T; S.tries = 0; S.sel = 0; S.beam = null; S.stray = null; S.time = 0; S.phase = "board";
    if (S.n === BOARDS) { note("SIDSTE BANE: TO SPEJLFELTER EFTER HINANDEN", C.pink, 3); Pixel.sfx("bonus"); }
    else if (S.taught) note(`BANE ${S.n}`, C.warn, 1.4);
  }
  // the maths dial: the last five boards, counted as right only when the first try was right
  function record(ok) {
    S.last.push(ok ? 1 : 0); if (S.last.length > 5) S.last.shift();
    if (S.last.length < 5) { if (S.last.length >= 3 && !S.last.includes(1)) S.help = true; return; }   // a rough start: show the rules
    const right = S.last.reduce((a, b) => a + b, 0), old = S.lv;
    if (right === 5) { S.lv = Math.min(5, S.lv + 1); S.help = false; S.last = []; }
    else if (right <= 3) { S.lv = Math.max(1, S.lv - 1); S.help = true; S.last = []; }
    else S.help = false;
    if (S.lv !== old) log({ sub: "spil", s: GAME, lv: S.lv, ok: S.lv > old, mode: "niveau", ms: 0 });
  }
  const setPace = f => { S.pace = clamp(S.pace * f, 0.6, 1.6); };

  function fire() {
    S.taught = true; S.phase = "fire"; S.beam = { d: 0, next: 0 }; S.stray = null; S.note.t = 0;
    Pixel.sfx("zap");
  }
  // the beam has run through every mirror and reached the crystal
  function win() {
    const B = S.board, first = S.tries === 0, f = clamp(S.left / B.T, 0, 1), end = B.beam[B.beam.length - 1].p, sx = scrapX();
    if (first) { S.streak++; S.best = Math.max(S.best, S.streak); S.stats.first++; } else S.stats.second++;
    const size = 1 + 0.5 * (B.dials.length - 1);                  // two dials count for more than one
    const pts = Math.round(10 * B.lv * size * (first ? 1 : 0.5) * (1 + 0.2 * Math.min(S.streak, 5))) + (first ? Math.round(6 * B.lv * f) : 0) + (S.n === BOARDS ? 50 * S.lv : 0);
    S.score += pts; record(first);
    if (first) setPace(f > 0.5 ? 1.07 : f < 0.15 ? 0.93 : 1); else setPace(0.97);
    log({ sub: "spil", s: GAME, lv: B.lv, ok: first, mode: "bane", ms: Math.round(S.time * 1000) });
    S.phase = "win"; S.phaseT = 1.9; S.wag = 1.2; S.shake = 0.3; S.flash = 0.2;
    burst(end[0], end[1], C.pink, 18); burst(sx, 12, C.warn, 30, 1.3);
    S.fx.push({ kind: "shot", x: sx, y: 12, t: 0.45, t0: 0.45 });
    say(`+${pts}`, end[0], end[1] - 14, C.good, 1.6);
    say(S.streak >= 3 && first ? `${S.streak} I TRÆK!` : pick(CHEERS), 160, 60, C.warn, 1.6);
    Pixel.sfx("boom"); Pixel.sfx(S.streak >= 3 ? "bonus" : "win");
  }
  // a dial was wrong: the beam leaves the mirror in some other direction and burns out
  function burn(dl) {
    S.tries++; S.streak = 0; dl.state = "burnt"; S.failed = dl;
    S.stray = { x: dl.pos[0], y: dl.pos[1], a: Math.random() * 6.283, len: 0 };
    S.phase = "burn"; S.phaseT = 1; S.shake = 0.3;
    burst(dl.pos[0], dl.pos[1], C.bad, 20); say(`${dl.val}°? NIKS`, dl.pos[0], dl.pos[1] - 16, C.bad);
    Pixel.sfx("miss"); Pixel.sfx("pop");
  }
  function afterBurn() {
    const dl = S.failed;
    if (S.tries >= 2) return lose(dl, false);
    dl.state = "open"; dl.val = ""; dl.told = true; S.sel = dials().indexOf(dl); S.beam = null; S.stray = null; S.phase = "board";
    note(`SPEJL ${dl.n} BRÆNDTE AF. ET FORSØG TILBAGE: SE REGLEN HER`, C.bad, 2.4);
  }
  // the board is lost: two wrong tries, or the scrap arrived. A shield goes, and the reasoning is shown.
  function lose(dl, late) {
    const B = S.board;
    S.shields--; S.streak = 0; S.stats.lost++;
    // the dials: too late without any try -> only the pace drops (unless it is already at the slowest)
    if (!late || S.tries > 0 || S.pace <= 0.61) record(false);
    setPace(late ? (S.tries > 0 ? 0.9 : 0.8) : 0.97);
    log({ sub: "spil", s: GAME, lv: B.lv, ok: false, mode: "bane", ms: Math.round(S.time * 1000) });
    for (const d of B.dials) if (d.state !== "ok") { d.val = String(d.ans); d.state = "shown"; }
    S.calc = dl.line; S.beam = null; S.stray = null; S.phase = "reveal"; S.phaseT = REVEAL;
    S.shake = 0.5; S.flash = 0.2; burst(TOWER[0], TOWER[1] + 6, C.bad, 26, 1.2); Pixel.sfx("boom"); Pixel.sfx("lose");
    say(late ? "SKROTTET RAMTE! SKJOLD -1" : "INGEN STRØM! SKJOLD -1", 250, 120, C.bad, 2.2);
  }
  function nextBoard() {
    if (S.shields <= 0) return over(false);
    if (S.n >= BOARDS) return over(true);
    startBoard();
  }
  function over(won) {
    if (S.phase === "over") return;
    S.phase = "over"; S.won = won; S.done = S.stats.first + S.stats.second + S.stats.lost; S.beam = null; S.stray = null;
    if (won) S.score += 30 * S.shields;
    S.line = pick(won ? WON : LOST);
    Pixel.sfx(won ? "win" : "lose");
    log({ sub: "spil", s: GAME, lv: S.lv, ok: won, mode: "run", ms: S.score });
    Leader.offer(GAME, S.score, document.getElementById("top"));
  }

  // ---------- input: digits are typed anywhere on the page, or pressed on the buttons under the game ----------
  function go() {                                                    // the big button, Enter and the space bar
    if (S.phase === "over") { if (Leader.asking()) return; newRun(); Leader.render(document.getElementById("top"), GAME); }
    if (S.phase === "title") { startBoard(); Pixel.sfx("click"); return; }
    if (S.phase === "reveal") { if (S.phaseT < REVEAL - 1.5) S.phaseT = 0; return; }      // read on: not in the first moment, so a late key press does not skip it
    if (S.phase !== "board") return;
    const cur = dials()[S.sel], empty = open().filter(d => !d.val);
    if (!empty.length) return fire();
    if (cur.state === "open" && !cur.val) { Pixel.sfx("tick"); note(`SKRIV VINKEL ${cur.n} FØRST`, C.warn, 1.5); return; }
    S.sel = dials().indexOf(empty[0]); Pixel.sfx("click");            // on to the dial that still has no number
  }
  function key(k) {
    const d = dials()[S.sel];
    if (S.phase !== "board" || !d || d.state !== "open") return;
    if (k === "del") d.val = d.val.slice(0, -1);
    else if (d.val.length < 3) d.val = (d.val === "0" ? "" : d.val) + k;
    Pixel.sfx("tick");
  }
  function swap(dir) {                                               // on to the next dial that can still be set
    const o = open();
    if (S.phase !== "board" || o.length < 2) return;
    S.sel = dials().indexOf(o[(o.indexOf(dials()[S.sel]) + dir + o.length) % o.length]); Pixel.sfx("click");
  }
  const slot = i => { const n = dials().length, w = 58, x = 160 - (n * w + (n - 1) * 8) / 2 + i * (w + 8); return [x, 163, w, 14]; };
  addEventListener("keydown", e => {
    if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) key(e.key);
    else if (e.key === "Backspace" || e.key === "Delete") { key("del"); e.preventDefault(); }
    else if (e.key === "Enter" || e.key === " ") { go(); e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "Tab" && !e.shiftKey) { if (S.phase === "board") e.preventDefault(); swap(1); }
    else if (e.key === "ArrowLeft" || e.key === "Tab") { if (S.phase === "board") e.preventDefault(); swap(-1); }
    else if (e.key === "Escape") { const d = dials()[S.sel]; if (S.phase === "board" && d && d.state === "open") d.val = ""; }
  });
  g.onClick((x, y) => {
    if (S.phase !== "board") { if (S.phase !== "fire" && S.phase !== "burn" && S.phase !== "win") go(); return; }
    const hit = dials().findIndex((d, i) => { const [sx, sy, sw, sh] = slot(i), m = d.fig.marks.find(k => k.ref === d);
      return d.state === "open" && (Math.hypot(x - d.pos[0], y - d.pos[1]) < 11 || Math.hypot(x - m.lx, y - m.ly) < 11 || (x >= sx && x <= sx + sw && y >= sy && y <= sy + sh)); });
    if (hit >= 0 && hit !== S.sel) { S.sel = hit; Pixel.sfx("click"); }
  });
  const goBtn = document.getElementById("fire");
  goBtn.onclick = () => { go(); goBtn.blur(); };
  for (const b of document.querySelectorAll(".keys [data-k]")) b.onclick = () => { key(b.dataset.k); b.blur(); };
  document.getElementById("next").onclick = e => { swap(1); e.target.blur(); };
  document.getElementById("mute").onclick = e => { Pixel.muted = !Pixel.muted; e.target.textContent = Pixel.muted ? "Lyd: fra" : "Lyd: til"; e.target.blur(); };

  // ---------- update ----------
  function update(dt) {
    S.clock += dt;
    for (const s of STARS) { s.x -= s.v * dt; if (s.x < 0) { s.x = W; s.y = Math.random() * 150; } }
    for (const f of S.fx) { f.t -= dt;
      if (f.kind === "dot" || f.kind === "shard") { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 90 * dt; if (f.r !== undefined) f.r += f.vr * dt; }
      else if (f.kind === "ring") f.r += f.vr * dt;
      else if (f.kind === "text") { f.y += f.vy * dt; f.vy *= 0.96; } }
    S.fx = S.fx.filter(f => f.t > 0);
    S.shake = Math.max(0, S.shake - dt); S.flash = Math.max(0, S.flash - dt); S.wag = Math.max(0, S.wag - dt); S.note.t -= dt;
    if (S.phase === "board") {                                       // the scrap only moves while the player is working
      S.time += dt; S.left -= dt;
      if (!S.board.warned && S.left < S.board.T * 0.25) { S.board.warned = true; Pixel.sfx("miss"); if (S.note.t <= 0) note("SKROTTET ER TÆT PÅ TÅRNET!", C.bad, 1.6); }
      if (S.left <= 0) lose(open()[0] || dials()[0], true);
    } else if (S.phase === "fire") {                                 // the beam runs along its way and tries every dial it comes to
      const B = S.board, b = S.beam;
      b.d += 240 * dt;
      while (S.phase === "fire" && b.next < B.beam.length && b.d >= B.cum[b.next]) {
        const at = B.beam[b.next], dl = at.dial;
        if (dl && dl.state !== "ok") {
          if (parseInt(dl.val, 10) === dl.ans) { dl.state = "ok"; ring(at.p[0], at.p[1], C.good); Pixel.sfx("hit"); }
          else { b.d = B.cum[b.next]; burn(dl); break; }
        } else if (at.bend) Pixel.sfx("tick");
        b.next++;
      }
      if (S.phase === "fire" && b.next >= B.beam.length) win();
    } else if (S.phase === "burn") {
      S.stray.len = Math.min(46, S.stray.len + 260 * dt);
      S.phaseT -= dt; if (S.phaseT <= 0) afterBurn();
    } else if (S.phase === "win" || S.phase === "reveal") {
      S.phaseT -= dt; if (S.phaseT <= 0) nextBoard();
    }
  }

  // ---------- drawing ----------
  const px = (x, y, w, h, colour) => { ctx.fillStyle = colour; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  function line(p, q, dash) {
    ctx.beginPath(); ctx.moveTo(p[0] + 0.5, p[1] + 0.5); ctx.lineTo(q[0] + 0.5, q[1] + 0.5);
    ctx.setLineDash(dash ? [2, 2] : []); ctx.stroke(); ctx.setLineDash([]);
  }
  // a text on the drawing, on a dark plate so it can be read where it lies over a line
  function label(text, x, y, colour, plate = "rgba(7,11,22,.8)") {
    const w = Pixel.width(text); px(x - w / 2 - 1, y - 4, w + 2, 8, plate); Pixel.text(ctx, text, x, y - 3, colour, 1, "center");
  }
  const STATE = { open: C.warn, ok: C.good, burnt: C.bad, shown: C.cyan };
  function drawFig(f) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.rail; for (const [a, b, kind] of f.rails) line(f.Q[a], f.Q[b], kind === "dash");
    ctx.strokeStyle = C.way; for (let i = 1; i < f.path.length; i++) line(f.Q[f.path[i - 1]], f.Q[f.path[i]]);
    ctx.strokeStyle = C.text;
    for (const [a, b] of f.ticks || []) {                           // equal sides: a short stroke across the middle of each
      const p = f.Q[a], q = f.Q[b], l = Math.hypot(q[0] - p[0], q[1] - p[1]), n = [-(q[1] - p[1]) / l * 3, (q[0] - p[0]) / l * 3], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      line([m[0] - n[0], m[1] - n[1]], [m[0] + n[0], m[1] + n[1]]);
    }
    ctx.strokeStyle = C.warn;
    for (const c of f.chev || []) { const [x, y] = f.Q[c]; for (const o of [0, 4]) { line([x + o - 3, y - 3], [x + o, y]); line([x + o, y], [x + o - 3, y + 3]); } }
    for (const m of f.marks) {
      const V = f.Q[m.at], d = m.ref, colour = d ? STATE[d.state] : C.dim;
      ctx.strokeStyle = colour;
      if (m.right) {                                                // a right angle: a small square in the corner
        const u = [Math.cos(m.a1) * 5, Math.sin(m.a1) * 5], v = [Math.cos(m.a1 + m.d) * 5, Math.sin(m.a1 + m.d) * 5];
        ctx.strokeStyle = C.text; line([V[0] + u[0], V[1] + u[1]], [V[0] + u[0] + v[0], V[1] + u[1] + v[1]]); line([V[0] + v[0], V[1] + v[1]], [V[0] + u[0] + v[0], V[1] + u[1] + v[1]]);
        continue;
      }
      ctx.beginPath(); ctx.arc(V[0] + 0.5, V[1] + 0.5, d ? 8 : 7, m.a1, m.a1 + m.d, m.d < 0); ctx.stroke();
      if (!d) label(m.t, m.lx, m.ly, C.text);
      else if (d.state === "open" || d.state === "burnt") {         // the dial's letter; the one being typed in pulses
        const on = S.phase === "board" && dials()[S.sel] === d;
        px(m.lx - 4, m.ly - 5, 9, 10, colour);
        label(d.n, m.lx, m.ly, on ? C.ink : colour, on ? (Math.floor(S.clock * 3) % 2 ? C.warn : "#c9a23f") : C.ink);
      } else label(`${d.n}=${d.val}°`, clamp(m.lx, 16, W - 16), m.ly, colour);
    }
  }
  // the things the beam meets: the emitter, a mirror at every bend, a dial ring around the mirrors that can be set, the crystal
  function drawNodes(B) {
    B.beam.forEach((at, i) => {
      const [x, y] = at.p, last = i === B.beam.length - 1;
      if (i === 0) { px(x - 3, y - 3, 7, 7, "#56606a"); px(x - 2, y - 2, 5, 5, "#8a96a0"); px(x - 1, y - 1, 3, 3, S.beam ? "#ffffff" : C.cyan); }
      else if (last) { const lit = S.phase === "win", c = lit ? "#ffffff" : C.pink; px(x - 1, y - 4, 3, 9, c); px(x - 3, y - 2, 7, 5, c); px(x - 1, y - 1, 3, 3, lit ? C.pink : "#ffd0ea");
        if (lit) { ctx.strokeStyle = C.pink; ctx.beginPath(); ctx.arc(x + 0.5, y + 0.5, 6 + Math.floor(S.clock * 10) % 3, 0, 6.283); ctx.stroke(); } }
      else if (at.bend || at.dial) { px(x - 1, y - 2, 3, 5, "#dfe6ea"); px(x - 2, y - 1, 5, 3, "#dfe6ea"); px(x, y, 1, 1, "#56606a"); }
      if (at.dial) {
        const d = at.dial, on = S.phase === "board" && dials()[S.sel] === d;
        ctx.strokeStyle = STATE[d.state]; ctx.beginPath(); ctx.arc(x + 0.5, y + 0.5, on ? 4 + Math.floor(S.clock * 4) % 2 : 4, 0, 6.283); ctx.stroke();
      }
    });
  }
  // the beam so far: a wide glow with a white core
  function drawBeam(B) {
    const way = () => { ctx.beginPath(); ctx.moveTo(B.beam[0].p[0] + 0.5, B.beam[0].p[1] + 0.5);
      for (let i = 1; i < B.beam.length; i++) { const p = B.beam[i - 1].p, q = B.beam[i].p, l = B.cum[i] - B.cum[i - 1], f = clamp((S.beam.d - B.cum[i - 1]) / (l || 1), 0, 1);
        if (f <= 0) break; ctx.lineTo(p[0] + (q[0] - p[0]) * f + 0.5, p[1] + (q[1] - p[1]) * f + 0.5); }
      ctx.stroke(); };
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(90,209,255,.35)"; ctx.lineWidth = 5 + Math.floor(S.clock * 20) % 2 * 2; way();
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; way();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1; way();
    if (S.stray) { const s = S.stray, q = [s.x + Math.cos(s.a) * s.len, s.y + Math.sin(s.a) * s.len];
      ctx.strokeStyle = "rgba(255,107,94,.5)"; ctx.lineWidth = 5; line([s.x, s.y], q); ctx.strokeStyle = C.warn; ctx.lineWidth = 1; line([s.x, s.y], q);
      if (Math.floor(S.clock * 20) % 2) px(q[0] - 1, q[1] - 1, 3, 3, "#ffffff"); }
    ctx.lineWidth = 1; ctx.lineCap = "butt"; ctx.lineJoin = "miter";
  }
  function dog(x, y) {                                               // the dog in a space helmet; it hops when the cannon fires
    const hop = S.wag > 0 ? -Math.round(Math.abs(Math.sin(S.wag * 12)) * 3) : 0, tail = S.wag > 0 && Math.floor(S.clock * 16) % 2;
    px(x, y + hop, 14, 7, "#b07a45"); px(x + 10, y - 5 + hop, 8, 7, "#b07a45"); px(x + 15, y - 6 + hop, 3, 3, "#7a4f2a"); px(x + 16, y - 2 + hop, 1, 1, C.ink);
    px(x + 1, y + 7 + hop, 2, 3, "#7a4f2a"); px(x + 11, y + 7 + hop, 2, 3, "#7a4f2a"); px(x - 2, y - (tail ? 3 : 0) + hop, 2, 3, "#7a4f2a");
    ctx.strokeStyle = "rgba(160,220,255,.7)"; ctx.strokeRect(x + 8.5, y - 7.5 + hop, 11, 10);
    if (S.wag > 0.4) Pixel.text(ctx, "VUF!", x + 8, y - 15 + hop, C.warn, 1, "center");
  }
  let btnText = "", btnOff = null;
  function draw() {
    const B = S.board, play = B && S.phase !== "title" && S.phase !== "over", cur = dials()[S.sel];
    ctx.save();
    if (S.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 10 * Math.min(S.shake, 0.5)), Math.round((Math.random() - 0.5) * 10 * Math.min(S.shake, 0.5)));
    px(-6, -6, W + 12, H + 12, C.sky);
    for (const s of STARS) px(s.x, s.y, 1, 1, s.v > 5 ? "#c9d6ff" : "#5a6688");
    // the moon's surface, the tower with its cannon and shields, and the dog
    px(-6, 152, W + 12, 40, C.moon); px(-6, 152, W + 12, 1, C.moonHi);
    for (const [cx, cy, w] of [[40, 175, 12], [270, 156, 7], [280, 176, 10], [8, 156, 6]]) { px(cx, cy, w, 2, C.moonLo); px(cx + 1, cy + 2, w - 2, 1, C.moonHi); }
    px(298, 150, 15, 30, "#6b5a7a"); px(296, 146, 19, 4, "#8a769c"); px(298, 150, 15, 1, "#4a3d56"); px(303, 158, 5, 7, C.ink); px(304, 159, 3, 2, S.phase === "win" ? C.pink : "#3a2b52");
    px(303, 141, 5, 5, "#c9d1d6"); px(304, 139, 3, 2, S.phase === "win" ? "#ffffff" : "#8a96a0");
    ctx.strokeStyle = S.shields <= 1 ? C.bad : "rgba(90,209,255,.55)";
    for (let k = 0; k < S.shields; k++) { ctx.beginPath(); ctx.arc(305.5, 160.5, 17 + k * 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    dog(8, 164);
    if (play) {
      Pixel.text(ctx, "SKITSE: MÅL IKKE PÅ SKÆRMEN", W - 4, 17, "#56687a", 1, "right");
      if (B.par) { ctx.strokeStyle = C.warn; for (const o of [0, 4]) { line([4 + o, 16], [7 + o, 19]); line([7 + o, 19], [4 + o, 22]); } Pixel.text(ctx, "= PARALLELLE SKINNER", 16, 17, C.dim); }
      if (B.fibre) { ctx.strokeStyle = C.fibre; for (let i = 1; i < B.fibre.length; i++) line(B.fibre[i - 1], B.fibre[i], true); }
      B.figs.forEach(drawFig);
      if (S.beam) drawBeam(B);
      drawNodes(B);
    }
    for (const f of S.fx) {
      const a = Math.max(0, f.t / f.t0); ctx.globalAlpha = Math.min(1, a * 2);
      if (f.kind === "dot") px(f.x, f.y, 2, 2, f.colour);
      else if (f.kind === "shard") { ctx.strokeStyle = f.colour; ctx.beginPath(); ctx.moveTo(f.x - Math.cos(f.r) * f.len, f.y - Math.sin(f.r) * f.len); ctx.lineTo(f.x + Math.cos(f.r) * f.len, f.y + Math.sin(f.r) * f.len); ctx.stroke(); }
      else if (f.kind === "ring") { ctx.strokeStyle = f.colour; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.stroke(); }
      else if (f.kind === "shot") { ctx.strokeStyle = C.pink; ctx.lineWidth = 2 + Math.round(6 * a); line(TOWER, [f.x, f.y]); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1 + Math.round(2 * a); line(TOWER, [f.x, f.y]); ctx.lineWidth = 1; }
      else { const w = Pixel.width(f.text); px(f.x - w / 2 - 2, f.y - 2, w + 4, 9, "rgba(5,9,14,.75)"); Pixel.text(ctx, f.text, Math.round(f.x), Math.round(f.y), f.colour, 1, "center"); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (S.flash > 0) px(0, 0, W, H, `rgba(255,255,255,${Math.min(0.5, S.flash)})`);
    // top bar, and under it the scrap on its way to the tower: when it gets all the way to the right, time is up
    px(0, 0, W, 10, "rgba(5,9,14,.88)");
    Pixel.text(ctx, S.n === BOARDS ? "SIDSTE BANE" : `BANE ${Math.max(1, S.n)}/${BOARDS}`, 3, 3, S.n === BOARDS ? C.pink : C.text);
    Pixel.text(ctx, "SKJOLD", 62, 3, S.shields <= 1 ? C.bad : C.text);
    for (let k = 0; k < SHIELDS; k++) px(90 + k * 6, 3, 4, 5, k < S.shields ? (S.shields <= 1 ? C.bad : C.cyan) : "#24303c");
    if (S.streak >= 2) Pixel.text(ctx, `${S.streak} I TRÆK`, 160, 3, C.warn, 1, "center");
    Pixel.text(ctx, `POINT ${S.score}`, W - 3, 3, C.good, 1, "right");
    px(0, 10, W, 5, "rgba(5,9,14,.6)"); px(4, 12, W - 16, 1, "#24303c"); px(W - 11, 10, 7, 5, "#6b5a7a"); px(W - 9, 11, 3, 3, C.pink);
    if (play && S.phase !== "win" && S.phase !== "reveal") {
      const f = clamp(S.left / B.T, 0, 1), x = Math.round(scrapX()), c = f < 0.25 ? C.bad : f < 0.5 ? C.warn : C.dim, fl = Math.floor(S.clock * 12) % 2;
      px(4, 12, x - 4, 1, c); px(x - 3, 10, 6, 5, "#56606a"); px(x - 2, 11, 4, 3, c); px(x - 5 - fl, 12, 2, 1, C.warn);
    }
    // the line above the ground: the reasoning after a lost board, the rule after a first mistake, or the first-step hint
    let text = "", colour = C.warn;
    if (S.phase === "reveal") { text = S.calc; colour = C.good; }
    else if (S.note.t > 0 && S.phase !== "over") { text = S.note.text; colour = S.note.colour; }
    else if (S.phase === "board" && cur && (cur.told || S.help)) { text = "REGEL: " + cur.hint; colour = C.cyan; }
    else if (S.phase === "board" && !S.taught) text = `REGN VINKEL ${cur.n} UD · SKRIV TALLET · TRYK ${TOUCH ? "TÆND" : "ENTER"}`;
    if (text) { const w = Pixel.width(text); px(W / 2 - w / 2 - 4, 142, w + 8, 10, "rgba(5,9,14,.92)"); Pixel.text(ctx, text, W / 2, 145, colour, 1, "center"); }
    // the console on the ground: one field per dial, with what has been typed so far
    if (play) {
      const n = B.dials.length, x0 = slot(0)[0], x1 = slot(n - 1)[0] + 58;
      px(x0 - 6, 154, x1 - x0 + 12, 25, "rgba(5,9,14,.82)");
      const head = S.phase === "reveal" ? (S.phaseT < REVEAL - 1.5 ? `LÆS UDREGNINGEN · ${TOUCH ? "TRYK FOR AT GÅ VIDERE" : "ENTER FOR AT GÅ VIDERE"}` : "LÆS UDREGNINGEN")
        : S.phase === "fire" ? "LASEREN ER TÆNDT ..." : S.phase === "win" ? "KANONEN FIK STRØM!" : S.phase === "burn" ? "STRÅLEN BRÆNDTE AF" : open().some(d => !d.val) ? "STIL DREJESKIVEN: VINKLEN I GRADER" : `ALT ER STILLET · TRYK ${TOUCH ? "TÆND" : "ENTER"}`;
      label(head, 160, 159, S.phase === "burn" ? C.bad : S.phase === "win" ? C.good : C.dim, "rgba(5,9,14,.82)");
      B.dials.forEach((d, i) => {
        const [x, y, w, h] = slot(i), on = S.phase === "board" && cur === d, colour = STATE[d.state];
        px(x, y, w, h, on ? colour : "#2a3a4a"); px(x + 1, y + 1, w - 2, h - 2, C.ink);
        const t = `${d.n}:${d.val}`; Pixel.text(ctx, t, x + 4, y + 2, colour, 2);
        const tx = x + 4 + Pixel.width(t, 2) + 2;
        if (on && Math.floor(S.clock * 3) % 2) px(tx, y + 10, 6, 2, colour);
        if (d.val) Pixel.text(ctx, "°", tx, y + 2, colour, 2);
      });
    }
    if (S.phase === "title") {
      px(34, 22, 252, 118, "rgba(5,9,14,.92)");
      Pixel.text(ctx, "SPEJLLASER", W / 2, 30, C.cyan, 3, "center");
      Pixel.text(ctx, "SKROT ER PÅ VEJ MOD VAKS' TÅRN, OG KANONEN MANGLER STRØM.", W / 2, 53, C.text, 1, "center");
      Pixel.text(ctx, "LED LASEREN GENNEM SPEJLENE HEN TIL KRYSTALLEN.", W / 2, 62, C.text, 1, "center");
      Pixel.text(ctx, "1. REGN VINKLEN VED HVER DREJESKIVE UD (BRUG PAPIR)", W / 2, 77, C.warn, 1, "center");
      Pixel.text(ctx, TOUCH ? "2. SKRIV TALLET MED KNAPPERNE" : "2. SKRIV TALLET MED TALTASTERNE", W / 2, 86, C.warn, 1, "center");
      Pixel.text(ctx, TOUCH ? "3. TRYK TÆND, OG SE STRÅLEN LØBE" : "3. TRYK ENTER, OG SE STRÅLEN LØBE", W / 2, 95, C.warn, 1, "center");
      Pixel.text(ctx, "TEGNINGEN ER EN SKITSE. DU KAN IKKE MÅLE ELLER GÆTTE.", W / 2, 109, C.dim, 1, "center");
      if (Math.floor(S.clock * 2) % 2) Pixel.text(ctx, TOUCH ? "TRYK START" : "START: ENTER ELLER MELLEMRUM", W / 2, 125, C.good, 1, "center");
    }
    if (S.phase === "over") {
      px(4, 28, 312, 118, "rgba(5,9,14,.95)");
      Pixel.text(ctx, S.won ? "TÅRNET HOLDT STAND!" : "TÅRNET ER FALDET", W / 2, 38, S.won ? C.good : C.bad, 2, "center");
      Pixel.text(ctx, S.line, W / 2, 56, C.dim, 1, "center");
      Pixel.text(ctx, `BANER: ${S.done} AF ${BOARDS}`, W / 2, 71, C.text, 1, "center");
      Pixel.text(ctx, `RIGTIGE I FØRSTE FORSØG: ${S.stats.first} AF ${S.done} (${S.done ? Math.round(100 * S.stats.first / S.done) : 0} %)`, W / 2, 81, C.text, 1, "center");
      Pixel.text(ctx, `LÆNGSTE RÆKKE: ${S.best} I TRÆK`, W / 2, 91, C.text, 1, "center");
      Pixel.text(ctx, `POINT: ${S.score}`, W / 2, 104, C.good, 2, "center");
      if (S.calc) Pixel.text(ctx, S.calc, W / 2, 121, C.cyan, 1, "center");
      Pixel.text(ctx, Leader.asking() ? "NY PLADS PÅ TOPLISTEN: SKRIV ET KALDENAVN UNDER SPILLET" : TOUCH ? "TRYK SPIL IGEN" : "SPIL IGEN: ENTER ELLER MELLEMRUM", W / 2, 134, C.warn, 1, "center");
    }
    // the button under the canvas follows the phase (only touched when something changes)
    const t = S.phase === "over" ? "Spil igen" : S.phase === "title" ? "Start" : S.phase === "reveal" ? "Videre" : S.phase === "board" && open().some(d => !d.val) && cur.val ? "Næste skive" : "Tænd";
    const off = S.phase === "fire" || S.phase === "burn" || S.phase === "win";
    if (t !== btnText) goBtn.textContent = btnText = t;
    if (off !== btnOff) goBtn.disabled = btnOff = off;
  }

  newRun();
  Progress.ready.then(() => { if (S.phase === "title" && !Leader.friend()) S.lv = savedLevel(); });
  Leader.render(document.getElementById("top"), GAME);
  // ticking "a friend is playing" before the first board starts the run over at the friend's level
  document.getElementById("friend").addEventListener("change", () => { if (S.phase === "title") newRun(); });
  Pixel.loop(update, draw);
})();
