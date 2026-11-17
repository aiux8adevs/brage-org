// Skrotregn: space scrap falls towards the dog's house on the moon. Every piece of scrap carries a geometry
// figure with numbers on it and a question (area, perimeter, a missing side, an angle, a volume ...). The laser
// only fires when the player types the answer as a number, so nothing can be aimed or guessed: the answer has to
// be worked out, on paper or in the head. All numbers are chosen so that works without a calculator.
//
// One piece, two tries:
//   right at once            -> full points, the row of hits grows
//   first wrong answer       -> the cannon cools for a moment and the rule for the figure is shown ("AREAL = G·H/2")
//   second wrong, or landed  -> a shield is lost, time stands still for a moment, and the whole calculation is
//                               shown in one line, so the mistake teaches something
//
// Two dials adapt to the player without saying so:
//   the maths level (1-5) picks the kinds of questions. It follows the last six pieces: all six right at the
//     first try -> up; three or fewer -> down, and the rule is then shown from the start for a while. 30 % of
//     the pieces come from the level below, so the share of right answers lands around 75-85 %.
//   the pace (0.6-1.6) sets how fast the scrap falls. It follows how much of the fall was left when the right
//     answer came: plenty left -> a little faster; nearly landed -> slower; landed without a try -> much slower.
//     A piece that lands untouched means "too fast", not "too hard", so then only the pace drops.
// Levels: 1 = rectangles and simple angles, 2 = triangle area, Pythagoras, box, 3 = missing leg, parallelogram,
// circles (answers as a number in front of π), L-shapes, 4 = trapezoid, cylinder, prism, similar figures, quadrilateral
// angles, 5 = distance between points, two-step triangles, scaled areas, regular polygons.
//
// A run is six waves (3, 3, 4, 4, 4 pieces and a boss with three questions): 5-10 minutes.
(() => {
  const canvas = document.getElementById("game");
  const g = Pixel.screen(canvas, 320, 180), { ctx, W, H } = g;
  const C = { sky: "#070b16", text: "#f2f6f0", dim: "#8ea3a8", ink: "#05090e", warn: "#ffcf5a", bad: "#ff6b5e", good: "#7cf2b2", cyan: "#5ad1ff",
              pink: "#ff7ac6", plate: "#1a2633", plateEdge: "#3b5063", line: "#cfe6ff", moon: "#39424f", moonHi: "#4b5666", moonLo: "#2b323d" };
  const GAME = "skrotregn";
  const LANES = [52, 160, 268], TOP = 38, LAND = 116;             // lane centres, where a piece is fully in view, where it lands
  const WAVE = [3, 3, 4, 4, 4, 1], WAVES = WAVE.length, BOSS_HP = 3, SHIELDS = 5;
  const GUN = [26, 152];
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = list => list[rnd(0, list.length - 1)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const TOUCH = matchMedia("(pointer: coarse)").matches;          // a phone or tablet: the hints name the buttons, not the keys
  const typing = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);   // keys typed in a field are not game keys

  const CRIES = ["AV MIN MØTRIK!", "RUST I FRED", "FEJL 404", "BIP ... BOP", "JEG VAR NÆSTEN LANDET", "IKKE BOLTENE!", "SKROT TIL SKROT", "PIV!"];
  const LOST = ["HUNDEHUSET FIK NYT TAG. AF SKROT", "HUNDEN FLYTTER IND HOS NABOEN", "MÅNEN ER NU EN GENBRUGSPLADS"];
  const WON = ["HUNDEN LOGRER I VÆGTLØS TILSTAND", "IKKE EN SKRUE RAMTE HUNDEHUSET", "SKROTTET KRÆVER OMKAMP"];

  // ---------- the questions ----------
  // Each maker returns the figure (kind + labels l), the short tag on the piece, the full question, the answer (always a
  // whole number), the rule shown after the first mistake and the calculation shown after the second.
  const TRI = [[3, 4, 5], [6, 8, 10], [5, 12, 13]], TRI5 = [[9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25]];
  const ISO = [[5, 6, 4], [5, 8, 3], [10, 12, 8], [10, 16, 6], [13, 10, 12], [13, 24, 5], [17, 16, 15]];   // side, base, height
  const NGON = { 5: "FEMKANT", 6: "SEKSKANT", 8: "OTTEKANT", 10: "TIKANT" };
  const PI = " SKRIV TALLET FORAN π";
  const circle = () => { const r = rnd(2, 9), d = Math.random() < 0.4; return { r, d, l: [d ? `D=${2 * r}` : `R=${r}`], pre: d ? `R = ${2 * r}/2 = ${r}, ` : "" }; };
  const Q = [
    { lv: 1, t: 8, f() { const w = rnd(4, 9), h = rnd(2, w - 1);
      return { kind: "rect", l: [w, h], tag: "AREAL?", ask: "HVAD ER REKTANGLETS AREAL?", ans: w * h, hint: "AREAL = LÆNGDE · BREDDE", calc: `AREAL = ${w}·${h} = ${w * h}` }; } },
    { lv: 1, t: 9, f() { const w = rnd(4, 12), h = rnd(2, w - 1);
      return { kind: "rect", l: [w, h], tag: "OMKREDS?", ask: "HVAD ER REKTANGLETS OMKREDS?", ans: 2 * (w + h), hint: "OMKREDS = 2·(LÆNGDE + BREDDE)", calc: `OMKREDS = 2·(${w}+${h}) = 2·${w + h} = ${2 * (w + h)}` }; } },
    { lv: 1, t: 10, f() { const a = 5 * rnd(6, 16), b = 5 * rnd(6, Math.min(16, 31 - a / 5));
      return { kind: "ang", l: [a + "°", b + "°", "?"], tag: "VINKEL?", ask: "HVOR STOR ER DEN SIDSTE VINKEL?", ans: 180 - a - b, hint: "VINKLERNE I EN TREKANT GIVER 180° TILSAMMEN", calc: `180-${a}-${b} = ${180 - a - b}°` }; } },
    { lv: 1, t: 8, f() { const a = 5 * rnd(5, 31);
      return { kind: "line", l: [a + "°", "?"], tag: "VINKEL?", ask: "HVOR STOR ER VINKLEN VED SIDEN AF?", ans: 180 - a, hint: "TO VINKLER PÅ EN RET LINJE GIVER 180° TILSAMMEN", calc: `180-${a} = ${180 - a}°` }; } },

    { lv: 2, t: 12, f() { let gr = rnd(4, 12), h = rnd(3, 9); if (gr * h % 2) gr++;
      return { kind: "trih", l: [gr, h], tag: "AREAL?", ask: "HVAD ER TREKANTENS AREAL?", ans: gr * h / 2, hint: "AREAL AF TREKANT = GRUNDLINJE · HØJDE / 2", calc: `AREAL = ${gr}·${h}/2 = ${gr * h}/2 = ${gr * h / 2}` }; } },
    { lv: 2, t: 16, f() { const [a, b, c] = pick(TRI);
      return { kind: "rtri", l: [b, a, "X"], tag: "X?", ask: "HVOR LANG ER DEN LÆNGSTE SIDE X?", ans: c, hint: "PYTHAGORAS: A² + B² = C²", calc: `X² = ${a}²+${b}² = ${a * a}+${b * b} = ${c * c}, X = √${c * c} = ${c}` }; } },
    { lv: 2, t: 12, f() { const l = rnd(3, 6), b = rnd(2, 5), h = rnd(2, 5);
      return { kind: "box", l: [l, b, h], tag: "RUMFANG?", ask: "HVAD ER KASSENS RUMFANG?", ans: l * b * h, hint: "RUMFANG AF KASSE = LÆNGDE · BREDDE · HØJDE", calc: `RUMFANG = ${l}·${b}·${h} = ${l * b}·${h} = ${l * b * h}` }; } },
    { lv: 2, t: 9, f() { const a = rnd(4, 14) * 5 + pick([0, 0, 2, 3]);
      return { kind: "ang", l: [a + "°", 90, "?"], tag: "VINKEL?", ask: "HVOR STOR ER DEN SIDSTE VINKEL?", ans: 90 - a, hint: "RETVINKLET TREKANT: DE TO ANDRE VINKLER GIVER 90°", calc: `180-90-${a} = ${90 - a}°` }; } },

    { lv: 3, t: 18, f() { const [a, b, c] = pick(TRI), s = Math.random() < 0.5;
      return { kind: "rtri", l: s ? ["X", a, c] : [b, "X", c], tag: "X?", ask: "HVOR LANG ER SIDEN X?", ans: s ? b : a, hint: "PYTHAGORAS: KATETE² = HYPOTENUSE² - KATETE²",
               calc: `X² = ${c}²-${s ? a : b}² = ${c * c}-${(s ? a : b) ** 2} = ${(s ? b : a) ** 2}, X = √${(s ? b : a) ** 2} = ${s ? b : a}` }; } },
    { lv: 3, t: 12, f() { const gr = rnd(5, 12), h = rnd(3, 8);
      return { kind: "para", l: [gr, h, h + rnd(1, 3)], tag: "AREAL?", ask: "HVAD ER PARALLELOGRAMMETS AREAL?", ans: gr * h, hint: "AREAL = GRUNDLINJE · HØJDE (IKKE DEN SKRÅ SIDE)", calc: `AREAL = ${gr}·${h} = ${gr * h}` }; } },
    { lv: 3, t: 10, f() { const c = circle();
      return { kind: "circ", l: c.l, tag: "OMKREDS=?·π", ask: "CIRKLENS OMKREDS?" + PI, ans: 2 * c.r, pi: true, hint: "OMKREDS = 2·π·R  (ELLER π·D)", calc: `OMKREDS = 2·π·${c.r} = ${2 * c.r}·π` }; } },
    { lv: 3, t: 12, f() { const c = circle();
      return { kind: "circ", l: c.l, tag: "AREAL=?·π", ask: "CIRKLENS AREAL?" + PI, ans: c.r * c.r, pi: true, hint: "AREAL AF CIRKEL = π·R²", calc: `${c.pre}AREAL = π·${c.r}² = ${c.r * c.r}·π` }; } },
    { lv: 3, t: 20, f() { const w = rnd(6, 10), h = rnd(5, 8), a = rnd(2, w - 2), b = rnd(2, h - 2);
      return { kind: "ell", l: [w, h, a, b], tag: "AREAL?", ask: "HVAD ER FIGURENS AREAL?", ans: a * h + (w - a) * b, hint: "DEL FIGUREN I TO REKTANGLER, OG LÆG AREALERNE SAMMEN",
               calc: `${a}·${h} + (${w}-${a})·${b} = ${a * h}+${(w - a) * b} = ${a * h + (w - a) * b}` }; } },
    { lv: 3, t: 12, f() { const top = 2 * rnd(10, 50);
      return { kind: "ang", l: ["?", "?", top + "°"], iso: true, tag: "VINKEL?", ask: "LIGEBENET: HVOR STOR ER EN AF DE NEDERSTE VINKLER?", ans: (180 - top) / 2, hint: "LIGEBENET: DE TO NEDERSTE VINKLER ER LIGE STORE",
               calc: `(180-${top})/2 = ${180 - top}/2 = ${(180 - top) / 2}°` }; } },

    { lv: 4, t: 16, f() { let a = rnd(3, 8), b = a + rnd(2, 6), h = rnd(3, 8); if ((a + b) * h % 2) b++;
      return { kind: "trap", l: [a, b, h], tag: "AREAL?", ask: "HVAD ER TRAPEZETS AREAL?", ans: (a + b) * h / 2, hint: "AREAL AF TRAPEZ = (A+B)/2 · H", calc: `AREAL = (${a}+${b})·${h}/2 = ${a + b}·${h}/2 = ${(a + b) * h / 2}` }; } },
    { lv: 4, t: 16, f() { const r = rnd(2, 5), h = rnd(2, 10), d = Math.random() < 0.3;
      return { kind: "cyl", l: [d ? `D=${2 * r}` : `R=${r}`, `H=${h}`], tag: "RUMFANG=?·π", ask: "CYLINDERENS RUMFANG?" + PI, ans: r * r * h, pi: true, hint: "RUMFANG AF CYLINDER = π·R²·H",
               calc: `${d ? `R = ${r}, ` : ""}RUMFANG = π·${r}²·${h} = π·${r * r}·${h} = ${r * r * h}·π` }; } },
    { lv: 4, t: 18, f() { let gr = rnd(3, 8), h = rnd(2, 6), l = rnd(3, 10); if (gr * h % 2) gr++;
      return { kind: "prism", l: [`G=${gr}`, `H=${h}`, `L=${l}`], tag: "RUMFANG?", ask: "HVAD ER PRISMETS RUMFANG?", ans: gr * h / 2 * l, hint: "RUMFANG AF PRISME = GRUNDFLADE · LÆNGDE", calc: `GRUNDFLADE = ${gr}·${h}/2 = ${gr * h / 2}, RUMFANG = ${gr * h / 2}·${l} = ${gr * h / 2 * l}` }; } },
    { lv: 4, t: 16, f() { const a = rnd(2, 5), b = rnd(a + 1, 8), k = rnd(2, 4);
      return { kind: "sim", l: [a, b, a * k, "X"], tag: "X?", ask: "TREKANTERNE ER LIGEDANNEDE. HVOR LANG ER X?", ans: b * k, hint: "SKALAFAKTOR = STOR SIDE / DEN TILSVARENDE LILLE SIDE", calc: `FAKTOR = ${a * k}/${a} = ${k}, X = ${b}·${k} = ${b * k}` }; } },
    { lv: 4, t: 14, f() { const a = 5 * rnd(14, 22), b = 5 * rnd(14, 22), c = 5 * rnd(14, 22);
      return { kind: "quad", l: [a + "°", b + "°", c + "°", "?"], tag: "VINKEL?", ask: "HVOR STOR ER FIRKANTENS SIDSTE VINKEL?", ans: 360 - a - b - c, hint: "VINKLERNE I EN FIRKANT GIVER 360° TILSAMMEN", calc: `360-${a}-${b}-${c} = 360-${a + b + c} = ${360 - a - b - c}°` }; } },
    { lv: 4, t: 16, f() { const w = rnd(6, 12), h = rnd(5, 9), a = rnd(2, w - 2), b = rnd(2, h - 2);
      return { kind: "ell", l: [w, h, a, b], tag: "OMKREDS?", ask: "HVAD ER FIGURENS OMKREDS?", ans: 2 * (w + h), hint: "DE KORTE SIDER I HAKKET SVARER TIL RESTEN AF REKTANGLET", calc: `SAMME OMKREDS SOM REKTANGLET: 2·(${w}+${h}) = ${2 * (w + h)}` }; } },

    { lv: 5, t: 22, f() { const [a, b, c] = pick(TRI5), m = rnd(0, 2);
      return m === 0 ? { kind: "rtri", l: [b, a, "X"], tag: "X?", ask: "HVOR LANG ER DEN LÆNGSTE SIDE X?", ans: c, hint: "PYTHAGORAS: A² + B² = C²", calc: `X² = ${a}²+${b}² = ${a * a}+${b * b} = ${c * c}, X = √${c * c} = ${c}` }
        : { kind: "rtri", l: m === 1 ? ["X", a, c] : [b, "X", c], tag: "X?", ask: "HVOR LANG ER SIDEN X?", ans: m === 1 ? b : a, hint: "PYTHAGORAS: KATETE² = HYPOTENUSE² - KATETE²",
            calc: `X² = ${c}²-${m === 1 ? a : b}² = ${c * c}-${(m === 1 ? a : b) ** 2} = ${(m === 1 ? b : a) ** 2}, X = ${m === 1 ? b : a}` }; } },
    { lv: 5, t: 22, f() { const [a, b, c] = pick(TRI.concat([[9, 12, 15], [8, 15, 17]])), x = rnd(0, 4), y = rnd(0, 4);
      return { kind: "coord", l: [`A(${x},${y})`, `B(${x + b},${y + a})`], tag: "AFSTAND?", ask: "HVOR LANGT ER DER FRA A TIL B?", ans: c, hint: "FORSKELLEN I X OG I Y ER KATETERNE: BRUG PYTHAGORAS",
               calc: `X: ${x + b}-${x} = ${b}, Y: ${y + a}-${y} = ${a}, √(${b * b}+${a * a}) = √${c * c} = ${c}` }; } },
    { lv: 5, t: 26, f() { const [s, b, h] = pick(ISO);
      return { kind: "iso", l: [s, b], tag: "AREAL?", ask: "HVAD ER DEN LIGEBENEDE TREKANTS AREAL?", ans: b * h / 2, hint: "HØJDEN DELER GRUNDLINJEN I TO: FIND HØJDEN MED PYTHAGORAS",
               calc: `H² = ${s}²-${b / 2}² = ${h * h}, H = ${h}, AREAL = ${b}·${h}/2 = ${b * h / 2}` }; } },
    { lv: 5, t: 14, f() { const a = rnd(2, 9), k = rnd(2, 5);
      return { kind: "scale", l: [`A=${a}`, `SIDER ×${k}`], tag: "AREAL?", ask: `ALLE SIDER BLIVER ${k} GANGE SÅ LANGE. NYT AREAL?`, ans: a * k * k, hint: "AREALET VOKSER MED FAKTOR · FAKTOR", calc: `AREAL = ${a}·${k}² = ${a}·${k * k} = ${a * k * k}` }; } },
    { lv: 5, t: 22, f() { const n = pick([5, 6, 8, 10]);
      return { kind: "poly", n, l: [], tag: "VINKEL?", ask: `REGULÆR ${NGON[n]}: HVOR STOR ER EN VINKEL?`, ans: (n - 2) * 180 / n, hint: "VINKELSUM = (ANTAL KANTER - 2)·180°. DEL MED ANTALLET",
               calc: `(${n}-2)·180 = ${(n - 2) * 180}, ${(n - 2) * 180}/${n} = ${(n - 2) * 180 / n}°` }; } },
    { lv: 5, t: 20, f() { const r = rnd(2, 5), h = rnd(3, 9);
      return { kind: "cyl", l: [`D=${2 * r}`, `H=${h}`], tag: "RUMFANG=?·π", ask: "CYLINDERENS RUMFANG?" + PI, ans: r * r * h, pi: true, hint: "RUMFANG AF CYLINDER = π·R²·H. HUSK: R ER DEN HALVE DIAMETER",
               calc: `R = ${2 * r}/2 = ${r}, RUMFANG = π·${r}²·${h} = ${r * r * h}·π` }; } },
  ];
  // a new question: mostly from the player's level, now and then from the level below; never the kind just seen
  function question(lv, exact) {
    const from = !exact && lv > 1 && Math.random() < 0.3 ? lv - 1 : lv, pool = Q.filter(q => q.lv === from);
    let m, q;
    for (let tries = 0; tries < 8; tries++) { m = pick(pool); q = m.f(); if (!S.recent.includes(q.kind + q.tag)) break; }
    S.recent.push(q.kind + q.tag); if (S.recent.length > 3) S.recent.shift();
    return Object.assign(q, { lv: from, t: m.t });
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
  const STARS = Array.from({ length: 46 }, () => ({ x: Math.random() * W, y: Math.random() * 150, v: Math.random() < 0.3 ? 9 : 3 }));
  function newRun() {
    S = { phase: "title", lv: Leader.friend() ? 2 : savedLevel(), pace: 1, help: false, wave: 0, left: 0, spawnT: 0, pieces: [], target: null, typed: "",
          shields: SHIELDS, score: 0, streak: 0, best: 0, fx: [], shake: 0, flash: 0, lock: 0, freeze: 0, gapT: 0, time: 0, clock: 0, taught: false,
          note: { text: "", colour: C.warn, t: 0 }, last: [], recent: [], waveLost: 0, stats: { first: 0, second: 0, lost: 0 }, wag: 0, aim: -1, won: false, line: "", calc: "" };
  }
  const note = (text, colour = C.warn, t = 3) => { S.note = { text, colour, t }; };
  // effects: floating texts (pushed apart so they do not pile up), dots, spinning shards, rings and laser beams
  function say(text, x, y, colour = C.text, t = 1.3) {
    const w = Pixel.width(text) / 2 + 2;
    for (const f of S.fx) if (f.kind === "text" && Math.abs(f.x - x) < 50 && f.y <= y + 3 && f.y > y - 30) f.y -= 7;
    S.fx.push({ kind: "text", text, x: clamp(x, w, W - w), y: Math.max(y, 22), vy: -9, colour, t, t0: t });
  }
  function burst(x, y, colour, n = 22, power = 1) {
    for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, v = (20 + Math.random() * 80) * power, t = 0.4 + Math.random() * 0.5;
      S.fx.push({ kind: "dot", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 15, colour: Math.random() < 0.3 ? "#ffffff" : colour, t, t0: t }); }
    for (let k = 0; k < n / 3; k++) { const a = Math.random() * 6.283, v = (25 + Math.random() * 45) * power, t = 0.7 + Math.random() * 0.5;
      S.fx.push({ kind: "shard", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, r: Math.random() * 6.283, vr: (Math.random() - 0.5) * 14, len: 3 + Math.random() * 5, colour: C.plateEdge, t, t0: t }); }
    S.fx.push({ kind: "ring", x, y, r: 4, vr: 90 * power, colour, t: 0.35, t0: 0.35 });
  }
  const beam = (x, y, colour) => S.fx.push({ kind: "beam", x, y, colour, t: 0.18, t0: 0.18 });

  // ---------- waves and pieces ----------
  const fallTime = q => (10 + q.t * 1.6) / S.pace;                 // seconds from fully in view to landing
  const lowest = () => S.pieces.reduce((a, p) => !a || p.y > a.y ? p : a, null);
  const target = () => S.pieces.includes(S.target) ? S.target : (S.target = lowest());
  function startWave() {
    S.wave++; S.phase = "wave"; S.left = WAVE[S.wave - 1]; S.spawnT = 0.6; S.waveLost = 0; S.time = 0;
    if (S.wave === WAVES) { note("ALARM: MODERSKROTTET! TRE SKJOLDE, TRE SPØRGSMÅL", C.bad, 4); Pixel.sfx("boom"); S.shake = 0.5; }
    else if (S.taught) note(`BØLGE ${S.wave}`, C.warn, 1.6);
  }
  function arm(p, q) { p.q = q; p.tries = 0; p.hint = S.help; p.vy = Math.max(LAND - Math.max(p.y, TOP), 50) / fallTime(q); }
  function spawn() {
    const boss = S.wave === WAVES, free = [0, 1, 2].filter(k => !S.pieces.some(p => p.lane === k));
    const lane = boss ? 1 : pick(free);
    const p = { lane, x: LANES[lane], y: -30, boss, hp: boss ? BOSS_HP : 1, hit: 0, wob: Math.random() * 6 };
    arm(p, question(S.lv, boss));
    if (boss) p.vy *= 0.8;
    S.pieces.push(p); S.left--; S.spawnT = fallTime(p.q) * 0.45;
  }
  // the maths dial: the last six pieces, counted as right only when the first answer was right
  function record(ok) {
    S.last.push(ok ? 1 : 0); if (S.last.length > 6) S.last.shift();
    if (S.last.length < 6) { if (S.last.length >= 3 && !S.last.includes(1)) S.help = true; return; }   // a rough start: show the rules
    const right = S.last.reduce((a, b) => a + b, 0), old = S.lv;
    if (right === 6) { S.lv = Math.min(5, S.lv + 1); S.help = false; S.last = []; }
    else if (right <= 3) { S.lv = Math.max(1, S.lv - 1); S.help = true; S.last = []; }
    else if (right >= 5) S.help = false;
    if (S.lv !== old) log({ sub: "spil", s: GAME, lv: S.lv, ok: S.lv > old, mode: "niveau", ms: 0 });
  }
  const setPace = f => { S.pace = clamp(S.pace * f, 0.6, 1.6); };
  const left = p => clamp(1 - (p.y - TOP) / (LAND - TOP), 0, 1);     // the share of the fall still to go

  function fire() {
    const p = target();
    if (S.phase !== "wave" || !p || S.lock > 0) return;
    if (!S.typed) { Pixel.sfx("tick"); return; }
    const val = parseInt(S.typed, 10); S.typed = ""; S.taught = true;
    S.aim = Math.atan2(p.y - GUN[1], p.x - GUN[0]);
    if (val === p.q.ans) return destroy(p);
    p.tries++; p.hit = 0.3; S.streak = 0; S.shake = Math.max(S.shake, 0.15);
    beam(p.x, p.y, C.bad); Pixel.sfx("miss");
    if (p.tries >= 2) return fail(p, false);
    p.hint = true; S.lock = 0.8;
    say(`${val}? NIKS`, p.x, p.y - 32, C.bad);
    note("ET FORSØG TILBAGE. SE REGLEN HER, OG REGN IGEN", C.bad, 2);
  }
  function destroy(p) {
    const first = p.tries === 0, f = left(p), q = p.q;
    if (first) { S.streak++; S.best = Math.max(S.best, S.streak); S.stats.first++; } else S.stats.second++;
    const pts = Math.round(10 * q.lv * (first ? 1 : 0.5) * (1 + 0.2 * Math.min(S.streak, 5))) + (first ? Math.round(6 * q.lv * f) : 0);
    S.score += pts; record(first);
    if (first) setPace(f > 0.55 ? 1.06 : f < 0.2 ? 0.93 : 1); else setPace(0.97);
    beam(p.x, p.y, C.cyan); S.wag = 1; S.note.t = Math.min(S.note.t, 0.3);
    say(`+${pts}`, p.x, p.y - 30, C.good);
    p.hp--;
    if (p.hp > 0) {                                                 // the boss: one shield down, knocked back, next question
      burst(p.x, p.y + 20, C.pink, 26, 1.2); S.shake = 0.35; S.flash = 0.25; Pixel.sfx("boom");
      say("SKJOLD NEDE!", p.x, p.y - 40, C.pink);
      p.y = Math.max(TOP, p.y - 34); arm(p, question(S.lv, true)); p.vy *= 0.8;
      return;
    }
    S.pieces.splice(S.pieces.indexOf(p), 1);
    if (p.boss) { for (let k = 0; k < 5; k++) burst(p.x + rnd(-50, 50), p.y + rnd(-20, 20), pick([C.pink, C.warn, C.cyan]), 26, 1.5); S.shake = 0.8; S.flash = 0.5; Pixel.sfx("boom"); Pixel.sfx("win"); S.score += 50 * q.lv; say("MODERSKROTTET ER SKROT!", p.x, p.y - 44, C.warn, 2.5); }
    else { burst(p.x, p.y, first ? C.cyan : C.warn); S.shake = Math.max(S.shake, 0.22); S.flash = 0.12; Pixel.sfx(S.streak >= 3 ? "bonus" : "hit"); Pixel.sfx("pop");
      if (Math.random() < 0.5) say(pick(CRIES), p.x, p.y - 20, C.dim);
      if (S.streak >= 3 && first) say(`${S.streak} I TRÆK!`, p.x, p.y - 42, C.warn); }
  }
  // a piece is lost: after two wrong answers, or because it landed. A shield goes, and the calculation is shown.
  function fail(p, landed) {
    const q = p.q;
    S.shields--; S.waveLost++; S.streak = 0; S.stats.lost++; S.typed = "";
    // the dials: landed without any answer -> only the pace drops (unless it is already at the slowest)
    if (!landed || p.tries > 0 || S.pace <= 0.61) record(false);
    setPace(landed ? (p.tries > 0 ? 0.9 : 0.82) : 0.96);
    burst(p.x, p.y, C.bad, 26, 1.2); S.shake = 0.5; S.flash = 0.2; Pixel.sfx("boom"); Pixel.sfx("lose");
    say(landed ? "BUM! SKJOLD -1" : "SKJOLD -1", p.x, p.y - 30, C.bad, 1.8);
    note(q.calc, C.good, 6); S.calc = q.calc; S.freeze = 3.2;
    if (p.boss) { p.y = TOP; arm(p, question(S.lv, true)); p.vy *= 0.8; }     // the boss stays until its shields are gone
    else S.pieces.splice(S.pieces.indexOf(p), 1);
    if (S.shields <= 0) over(false);
  }
  function endWave() {
    const clean = S.waveLost === 0;
    log({ sub: "spil", s: GAME, lv: S.lv, ok: clean, mode: "bolge", ms: Math.round(S.time * 1000) });
    if (S.wave === WAVES) return over(true);
    if (clean) { S.score += 20 * S.lv; if (S.shields < SHIELDS) { S.shields++; say("SKJOLD +1", 160, 70, C.good, 1.8); } Pixel.sfx("bonus"); }
    if (S.note.t < 1) note(clean ? `BØLGE ${S.wave} RYDDET UDEN TAB: +${20 * S.lv}` : `BØLGE ${S.wave} RYDDET`, C.warn, 2.2);
    S.phase = "gap"; S.gapT = Math.max(2.4, S.freeze + 1.5);
  }
  function over(won) {
    if (S.phase === "over") return;
    S.phase = "over"; S.won = won; S.pieces = []; S.freeze = 0;
    if (won) S.score += 30 * S.shields;
    S.line = pick(won ? WON : LOST);
    Pixel.sfx(won ? "win" : "lose");
    log({ sub: "spil", s: GAME, lv: S.lv, ok: won, mode: "run", ms: S.score });
    Leader.offer(GAME, S.score, document.getElementById("top"));
  }

  // ---------- input: digits are typed anywhere on the page, or pressed on the buttons under the game ----------
  function go() {                                                    // the big button, Enter and the space bar
    if (S.phase === "over") { if (Leader.asking()) return; newRun(); Leader.render(document.getElementById("top"), GAME); }
    if (S.phase === "title") { startWave(); Pixel.sfx("click"); return; }
    fire();
  }
  function key(k) {
    if (S.phase !== "wave") return;
    if (k === "del") S.typed = S.typed.slice(0, -1);
    else if (S.typed.length < 4) S.typed = (S.typed === "0" ? "" : S.typed) + k;
    Pixel.sfx("tick");
  }
  function swap(dir) {                                               // aim at the next piece to the right or left
    if (S.phase !== "wave" || S.pieces.length < 2) return;
    const order = S.pieces.slice().sort((a, b) => a.x - b.x), i = order.indexOf(target());
    S.target = order[(i + dir + order.length) % order.length]; Pixel.sfx("click");
  }
  addEventListener("keydown", e => {
    if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) key(e.key);
    else if (e.key === "Backspace" || e.key === "Delete") { key("del"); e.preventDefault(); }
    else if (e.key === "Enter" || e.key === " ") { go(); e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "Tab" && !e.shiftKey) { if (S.phase === "wave") e.preventDefault(); swap(1); }
    else if (e.key === "ArrowLeft" || e.key === "Tab") { if (S.phase === "wave") e.preventDefault(); swap(-1); }
    else if (e.key === "Escape") S.typed = "";
  });
  g.onClick((x, y) => {
    if (S.phase !== "wave") { go(); return; }
    const p = S.pieces.find(p => Math.abs(x - p.x) < (p.boss ? 70 : 38) && Math.abs(y - p.y) < 30);
    if (p && p !== S.target) { S.target = p; Pixel.sfx("click"); }
  });
  const goBtn = document.getElementById("fire");
  goBtn.onclick = () => { go(); goBtn.blur(); };
  for (const b of document.querySelectorAll(".keys [data-k]")) b.onclick = () => { key(b.dataset.k); b.blur(); };
  document.getElementById("next").onclick = e => { swap(1); e.target.blur(); };
  document.getElementById("mute").onclick = e => { Pixel.muted = !Pixel.muted; e.target.textContent = Pixel.muted ? "Lyd: fra" : "Lyd: til"; e.target.blur(); };

  // ---------- update ----------
  function update(dt) {
    S.clock += dt;
    for (const s of STARS) { s.y += s.v * dt; if (s.y > 150) { s.y = 0; s.x = Math.random() * W; } }
    for (const f of S.fx) { f.t -= dt;
      if (f.kind === "dot" || f.kind === "shard") { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 90 * dt; if (f.r !== undefined) f.r += f.vr * dt; }
      else if (f.kind === "ring") f.r += f.vr * dt;
      else if (f.kind === "text") { f.y += f.vy * dt; f.vy *= 0.96; } }
    S.fx = S.fx.filter(f => f.t > 0);
    S.shake = Math.max(0, S.shake - dt); S.flash = Math.max(0, S.flash - dt); S.lock = Math.max(0, S.lock - dt);
    S.wag = Math.max(0, S.wag - dt); S.note.t -= dt;
    if (S.phase === "gap") { S.freeze = Math.max(0, S.freeze - dt); S.gapT -= dt; if (S.gapT <= 0) startWave(); return; }
    if (S.phase !== "wave") return;
    S.time += dt;
    for (const p of S.pieces) p.hit = Math.max(0, p.hit - dt);
    if (S.freeze > 0) { S.freeze -= dt; return; }                    // time stands still while a calculation is shown
    // the next piece comes when the one before is well on its way; at most two at a time, three when the pace is high
    if (S.pieces.length === 0) S.spawnT = Math.min(S.spawnT, 0.8);  // an empty sky is filled again quickly
    S.spawnT -= dt;
    if (S.left > 0 && S.spawnT <= 0 && S.pieces.length < (S.pace >= 1.2 && S.wave >= 3 ? 3 : 2)) spawn();
    for (const p of S.pieces.slice()) {
      p.y += (p.y < TOP ? 70 : p.vy) * dt;                           // flies in quickly, then falls at its own speed
      if (p.y >= LAND) fail(p, true);
      if (S.phase !== "wave") return;
    }
    if (S.left === 0 && S.pieces.length === 0) endWave();
  }

  // ---------- drawing ----------
  const px = (x, y, w, h, colour) => { ctx.fillStyle = colour; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  function path(pts, close, dash) {
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x + 0.5, y + 0.5) : ctx.moveTo(x + 0.5, y + 0.5));
    if (close) ctx.closePath();
    ctx.setLineDash(dash ? [2, 2] : []); ctx.stroke(); ctx.setLineDash([]);
  }
  // a label on a figure: the unknown is yellow, the given numbers white
  const lab = (v, x, y, align = "center") => Pixel.text(ctx, v, x, y, /[X?]/.test(String(v)) && !/=/.test(String(v)) ? C.warn : C.text, 1, align);
  const corner = (x, y) => path([[x - 3, y], [x - 3, y - 3], [x, y - 3]]);     // the right-angle mark at a bottom right corner
  // the figures are sketches, not to scale: the numbers are what counts (as in the exam)
  const FIG = {
    rect(l) { path([[-16, -16], [12, -16], [12, 4], [-16, 4]], true); lab(l[0], -2, 7); lab(l[1], 15, -8, "left"); },
    rtri(l) { path([[-16, 4], [12, 4], [12, -16]], true); corner(12, 4); lab(l[0], -3, 7); lab(l[1], 15, -8, "left"); lab(l[2], -6, -13, "right"); },
    trih(l) { path([[-18, 4], [16, 4], [4, -16]], true); path([[4, -15], [4, 4]], false, true); corner(4, 4); lab(l[0], -1, 7); lab(l[1], 7, -7, "left"); },
    ang(l, q) {
      if (l[1] === 90) { path([[-16, 4], [12, 4], [12, -16]], true); corner(12, 4); lab(l[0], -17, 7); lab(l[2], 15, -18, "left"); return; }
      const top = q.iso ? 0 : 3;
      path([[-16, 4], [16, 4], [top, -15]], true);
      if (q.iso) { path([[-10, -6], [-7, -4]]); path([[10, -6], [7, -4]]); }          // marks: these two sides are equal
      lab(l[0], -16, 7); lab(l[1], 16, 7); lab(l[2], top, -22);
    },
    line(l) { path([[-22, 2], [22, 2]]); path([[0, 2], [8, -17]]); lab(l[0], -11, -6); lab(l[1], 14, -6); },
    para(l) { path([[-18, 4], [8, 4], [16, -14], [-10, -14]], true); path([[-10, -13], [-10, 4]], false, true); lab(l[0], -5, 7); lab(l[1], -7, -7, "left"); lab(l[2], 16, -4, "left"); },
    trap(l) { path([[-18, 4], [16, 4], [8, -13], [-8, -13]], true); path([[-8, -12], [-8, 4]], false, true); lab(l[0], 0, -20); lab(l[1], -1, 7); lab(l[2], -5, -7, "left"); },
    circ(l, q) { ctx.beginPath(); ctx.arc(-6.5, -5.5, 11, 0, 6.283); ctx.stroke(); px(-7, -6, 1, 1, C.line);
      path(/^D/.test(l[0]) ? [[-17, -6], [4, -6]] : [[-7, -6], [4, -6]]); lab(l[0], 8, -8, "left"); },
    ell(l) { const nx = -18 + Math.round(32 * l[2] / l[0]), ny = 4 - Math.round(20 * l[3] / l[1]);            // the notch sits roughly where the numbers say
      path([[-18, -16], [nx, -16], [nx, ny], [14, ny], [14, 4], [-18, 4]], true); lab(l[0], -2, 7); lab(l[1], -21, -8, "right"); lab(l[2], (nx - 18) / 2, -23); lab(l[3], 17, (ny + 4) / 2 - 2, "left"); },
    box(l) { path([[-16, -8], [6, -8], [6, 4], [-16, 4]], true); path([[-16, -8], [-8, -16], [14, -16], [14, -4], [6, 4]]); path([[6, -8], [14, -16]]);
      lab(l[0], -5, 7); lab(l[1], 13, 1, "left"); lab(l[2], -19, -4, "right"); },
    cyl(l) { for (const y of [-14, 2]) { ctx.beginPath(); ctx.ellipse(-7.5, y + 0.5, 11, 3, 0, 0, 6.283); ctx.stroke(); }
      path([[-19, -14], [-19, 2]]); path([[3, -14], [3, 2]]); path(/^D/.test(l[0]) ? [[-18, -14], [3, -14]] : [[-8, -14], [3, -14]]);
      lab(l[0], 7, -18, "left"); lab(l[1], 7, -7, "left"); },
    prism(l) { path([[-22, 4], [-6, 4], [-14, -8]], true); path([[-6, 4], [10, -4], [2, -16], [-14, -8]]); path([[-14, -7], [-14, 4]], false, true);
      lab(l[0], -14, 7); lab(l[1], -24, -6, "right"); lab(l[2], 8, 2, "left"); },
    sim(l) { path([[-24, 4], [-12, 4], [-12, -6]], true); path([[0, 4], [18, 4], [18, -12]], true); lab(l[0], -18, 7); lab(l[1], -10, -4, "left"); lab(l[2], 9, 7); lab(l[3], 21, -7, "left"); },
    coord(l) { path([[-14, 0], [12, 0], [12, -13]], false, true); path([[-14, 0], [12, -13]]); px(-15, -1, 3, 3, C.warn); px(11, -14, 3, 3, C.warn); lab(l[0], -10, 5); lab(l[1], 8, -22); },
    quad(l) { path([[-16, 3], [14, 3], [9, -13], [-11, -11]], true); lab(l[0], -17, 7); lab(l[1], 17, 7); lab(l[2], 16, -21); lab(l[3], -16, -19); },
    poly(l, q) { const n = q.n, pts = Array.from({ length: n }, (_, k) => { const a = -Math.PI / 2 + (k + 0.5) * 6.283 / n; return [Math.round(Math.cos(a) * 13), Math.round(-6 + Math.sin(a) * 13)]; });
      path(pts, true); lab("?", Math.round(pts[n - 1][0] * 0.5), Math.round(-6 + (pts[n - 1][1] + 6) * 0.5) - 2); lab(`${n} ENS SIDER`, 0, 9); },
    scale(l) { path([[-26, -4], [-14, -4], [-14, 4], [-26, 4]], true); path([[-4, -16], [22, -16], [22, 4], [-4, 4]], true); lab(l[0], -20, -11); lab("?", 9, -8); lab(l[1], 2, 8); },
    iso(l) { path([[-14, 4], [14, 4], [0, -16]], true); path([[-9, -5], [-6, -3]]); path([[9, -5], [6, -3]]); lab(l[0], -11, -12, "right"); lab(l[0], 11, -12, "left"); lab(l[1], 0, 7); },
  };
  function pieceSprite(p, aimed) {
    const x = Math.round(p.x + Math.sin(S.clock * 1.3 + p.wob) * 1.5), y = Math.round(p.y), red = p.hit > 0;
    ctx.save(); ctx.translate(x, y);
    if (p.boss) {                                                   // the mother ship: wings, lights for its shields, a grumpy face
      px(-78, -18, 156, 30, "#2a1f3a"); px(-70, -24, 140, 6, "#3a2b52"); px(-84, -10, 6, 14, C.pink); px(78, -10, 6, 14, C.pink);
      for (let k = 0; k < BOSS_HP; k++) px(-66 + k * 9, -22, 6, 3, k < p.hp ? C.pink : "#1a1326");
      px(48, -12, 5, 5, C.bad); px(62, -12, 5, 5, C.bad); px(49, 0, 17, 2, C.bad);
      Pixel.text(ctx, "MODER-", -72, -8, "#8a76b0"); Pixel.text(ctx, "SKROT", -72, 1, "#8a76b0");
      const fl = Math.floor(S.clock * 12) % 2; px(-60, -30 - fl * 2, 8, 6 + fl * 2, C.warn); px(52, -30 - fl * 2, 8, 6 + fl * 2, C.warn);
    }
    // the scrap plate: bent corners, rivets, a small flame on top while it falls
    px(-36, -26, 72, 51, red ? "#5a1f24" : C.plateEdge); px(-35, -25, 70, 49, red ? "#3a1418" : C.plate);
    px(-36, -26, 3, 2, C.sky); px(34, 23, 2, 2, C.sky); px(-33, -23, 1, 1, C.plateEdge); px(32, -23, 1, 1, C.plateEdge); px(-33, 21, 1, 1, C.plateEdge);
    if (!p.boss && S.freeze <= 0) { const fl = Math.floor(S.clock * 14 + p.wob) % 3; px(-3, -30 - fl, 6, 4 + fl, C.warn); px(-1, -32 - fl, 2, 3, C.bad); }
    ctx.strokeStyle = C.line; ctx.lineWidth = 1;
    FIG[p.q.kind](p.q.l, p.q);
    const tw = Pixel.width(p.q.tag);
    px(-tw / 2 - 2, 15, tw + 4, 8, aimed ? C.warn : "#2a3a4a"); Pixel.text(ctx, p.q.tag, 0, 17, aimed ? C.ink : C.dim, 1, "center");
    if (aimed) {                                                    // the aim: yellow brackets that pulse
      const o = 38 + Math.round(Math.sin(S.clock * 6)), v = 28;
      ctx.strokeStyle = C.warn;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) path([[sx * o, sy * (v - 6)], [sx * o, sy * v], [sx * (o - 6), sy * v]]);
    }
    // how far it has left to fall: a thin bar that turns red near the ground
    const f = left(p); px(-34, 26, 68, 1, C.ink); px(-34, 26, Math.round(68 * f), 1, f < 0.25 ? C.bad : f < 0.5 ? C.warn : C.good);
    ctx.restore();
  }
  function dog(x, y) {                                               // the dog in a space helmet; it hops when a piece is shot down
    const hop = S.wag > 0 ? -Math.round(Math.abs(Math.sin(S.wag * 12)) * 3) : 0, tail = S.wag > 0 && Math.floor(S.clock * 16) % 2;
    px(x, y + hop, 14, 7, "#b07a45"); px(x + 10, y - 5 + hop, 8, 7, "#b07a45"); px(x + 15, y - 6 + hop, 3, 3, "#7a4f2a"); px(x + 16, y - 2 + hop, 1, 1, C.ink);
    px(x + 1, y + 7 + hop, 2, 3, "#7a4f2a"); px(x + 11, y + 7 + hop, 2, 3, "#7a4f2a"); px(x - 2, y - (tail ? 3 : 0) + hop, 2, 3, "#7a4f2a");
    ctx.strokeStyle = "rgba(160,220,255,.7)"; ctx.strokeRect(x + 8.5, y - 7.5 + hop, 11, 10);
    if (S.wag > 0.4) Pixel.text(ctx, "VUF!", x + 6, y - 15 + hop, C.warn, 1, "center");
  }
  let btnText = "", btnOff = null;
  function draw() {
    const aimed = S.phase === "wave" ? target() : null;
    ctx.save();
    if (S.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 10 * Math.min(S.shake, 0.5)), Math.round((Math.random() - 0.5) * 10 * Math.min(S.shake, 0.5)));
    px(-6, -6, W + 12, H + 12, C.sky);
    for (const s of STARS) px(s.x, s.y, 1, 1, s.v > 5 ? "#c9d6ff" : "#5a6688");
    // the earth far away, and the moon's surface with craters, the cannon and the dog's house
    ctx.fillStyle = "#1d4f7a"; ctx.beginPath(); ctx.arc(292, 30, 13, 0, 6.283); ctx.fill(); px(285, 23, 8, 5, "#2f8a5a"); px(293, 31, 7, 6, "#2f8a5a"); px(288, 36, 4, 2, "#2f8a5a");
    px(-6, 152, W + 12, 40, C.moon); px(-6, 152, W + 12, 1, C.moonHi);
    for (const [cx, cy, w] of [[70, 175, 12], [118, 156, 7], [214, 176, 10], [250, 157, 6], [8, 172, 9]]) { px(cx, cy, w, 2, C.moonLo); px(cx + 1, cy + 2, w - 2, 1, C.moonHi); }
    px(284, 142, 28, 16, "#8a4b3a"); px(282, 138, 32, 5, "#b0604a"); px(286, 135, 24, 3, "#b0604a"); px(293, 148, 10, 10, C.ink);
    Pixel.text(ctx, "VAKS", 298, 144, "#e6c9a8", 1, "center");
    dog(262, 160);
    // shields over the house: one small arc per shield left
    ctx.strokeStyle = S.shields <= 1 ? C.bad : "rgba(90,209,255,.55)";
    for (let k = 0; k < S.shields; k++) { ctx.beginPath(); ctx.arc(298.5, 152.5, 24 + k * 3, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
    // the cannon turns towards what it aims at
    if (aimed) S.aim = Math.atan2(aimed.y - GUN[1], aimed.x - GUN[0]);
    px(GUN[0] - 9, GUN[1] + 2, 18, 8, "#56606a"); px(GUN[0] - 6, GUN[1] - 3, 12, 6, "#6d7882");
    ctx.strokeStyle = S.lock > 0 ? C.bad : "#c9d1d6"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(GUN[0], GUN[1]);
    ctx.lineTo(GUN[0] + Math.cos(S.aim) * 11, GUN[1] + Math.sin(S.aim) * 11); ctx.stroke(); ctx.lineWidth = 1;
    for (const p of S.pieces) if (p !== aimed) pieceSprite(p, false);
    if (aimed) pieceSprite(aimed, true);
    for (const f of S.fx) {
      const a = Math.max(0, f.t / f.t0); ctx.globalAlpha = Math.min(1, a * 2);
      if (f.kind === "dot") px(f.x, f.y, 2, 2, f.colour);
      else if (f.kind === "shard") { ctx.strokeStyle = f.colour; ctx.beginPath(); ctx.moveTo(f.x - Math.cos(f.r) * f.len, f.y - Math.sin(f.r) * f.len); ctx.lineTo(f.x + Math.cos(f.r) * f.len, f.y + Math.sin(f.r) * f.len); ctx.stroke(); }
      else if (f.kind === "ring") { ctx.strokeStyle = f.colour; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.stroke(); }
      else if (f.kind === "beam") { ctx.strokeStyle = f.colour; ctx.lineWidth = 1 + Math.round(4 * a); ctx.beginPath(); ctx.moveTo(GUN[0], GUN[1]); ctx.lineTo(f.x, f.y); ctx.stroke();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(GUN[0], GUN[1]); ctx.lineTo(f.x, f.y); ctx.stroke(); }
      else { const w = Pixel.width(f.text); px(f.x - w / 2 - 2, f.y - 2, w + 4, 9, "rgba(5,9,14,.75)"); Pixel.text(ctx, f.text, Math.round(f.x), Math.round(f.y), f.colour, 1, "center"); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (S.flash > 0) px(0, 0, W, H, `rgba(255,255,255,${Math.min(0.5, S.flash)})`);
    // top bar
    px(0, 0, W, 10, "rgba(5,9,14,.88)");
    Pixel.text(ctx, S.wave === WAVES ? "BOSS" : `BØLGE ${Math.max(1, S.wave)}/${WAVES}`, 3, 3, S.wave === WAVES ? C.pink : C.text);
    Pixel.text(ctx, "SKJOLD", 62, 3, S.shields <= 1 ? C.bad : C.text);
    for (let k = 0; k < SHIELDS; k++) px(90 + k * 6, 3, 4, 5, k < S.shields ? (S.shields <= 1 ? C.bad : C.cyan) : "#24303c");
    if (S.streak >= 2) Pixel.text(ctx, `${S.streak} I TRÆK`, 160, 3, C.warn, 1, "center");
    Pixel.text(ctx, `POINT ${S.score}`, W - 3, 3, C.good, 1, "right");
    // the line above the ground: the calculation after a miss, the rule after a first mistake, or the first-step hint
    let line = "", colour = C.warn;
    if (S.note.t > 0 && S.phase !== "over") { line = S.note.text; colour = S.note.colour; }
    else if (aimed && aimed.hint) { line = "REGEL: " + aimed.q.hint; colour = C.cyan; }
    else if (S.phase === "wave" && !S.taught && aimed) line = `REGN SVARET UD · SKRIV TALLET · TRYK ${TOUCH ? "SKYD" : "ENTER"}`;
    if (line) { const w = Pixel.width(line); px(W / 2 - w / 2 - 4, 142, w + 8, 10, "rgba(5,9,14,.92)"); Pixel.text(ctx, line, W / 2, 145, colour, 1, "center"); }
    // the console on the ground: the question for the piece aimed at, and what has been typed so far
    if (S.phase === "wave" || S.phase === "gap") {
      px(44, 155, 208, 23, "rgba(5,9,14,.8)");
      if (aimed) {
        Pixel.text(ctx, aimed.q.ask, 148, 157, C.text, 1, "center");
        if (S.lock > 0) Pixel.text(ctx, "KANONEN KØLER", 148, 166, C.bad, 2, "center");
        else {                                                      // "SVAR: 24" with a blinking cursor, and the unit after it
          const head = `SVAR: ${S.typed}`, unit = aimed.q.pi ? "·π" : aimed.q.tag === "VINKEL?" ? "°" : "";
          const x0 = 148 - Math.floor((Pixel.width(head, 2) + 10 + (unit ? Pixel.width(unit, 2) + 2 : 0)) / 2), x1 = x0 + Pixel.width(head, 2) + 2;
          Pixel.text(ctx, head, x0, 166, C.warn, 2);
          if (Math.floor(S.clock * 3) % 2) px(x1, 174, 6, 2, C.warn);
          if (unit) Pixel.text(ctx, unit, x1 + 10, 166, C.dim, 2);
        }
      } else Pixel.text(ctx, S.phase === "gap" ? "NÆSTE BØLGE ER PÅ VEJ ..." : "RADAREN SØGER ...", 148, 164, C.dim, 1, "center");
    }
    if (S.phase === "title") {
      px(40, 26, 240, 108, "rgba(5,9,14,.92)");
      Pixel.text(ctx, "SKROTREGN", W / 2, 36, C.warn, 3, "center");
      Pixel.text(ctx, "RUMSKROT FALDER MOD VAKS' HUNDEHUS PÅ MÅNEN.", W / 2, 60, C.text, 1, "center");
      Pixel.text(ctx, "LASEREN SKYDER KUN, NÅR DU HAR REGNET RIGTIGT.", W / 2, 69, C.text, 1, "center");
      Pixel.text(ctx, "1. REGN FIGURENS SVAR UD (BRUG PAPIR)", W / 2, 84, C.cyan, 1, "center");
      Pixel.text(ctx, TOUCH ? "2. SKRIV TALLET MED KNAPPERNE" : "2. SKRIV TALLET MED TALTASTERNE", W / 2, 93, C.cyan, 1, "center");
      Pixel.text(ctx, TOUCH ? "3. TRYK SKYD" : "3. TRYK ENTER FOR AT SKYDE", W / 2, 102, C.cyan, 1, "center");
      if (Math.floor(S.clock * 2) % 2) Pixel.text(ctx, TOUCH ? "TRYK START" : "START: ENTER ELLER MELLEMRUM", W / 2, 120, C.good, 1, "center");
    }
    if (S.phase === "over") {
      px(36, 30, 248, 116, "rgba(5,9,14,.95)");
      const n = S.stats.first + S.stats.second + S.stats.lost;
      Pixel.text(ctx, S.won ? "SEJR! MÅNEN ER RYDDET" : "HUNDEHUSET ER RAMT", W / 2, 40, S.won ? C.good : C.bad, 2, "center");
      Pixel.text(ctx, S.line, W / 2, 58, C.dim, 1, "center");
      Pixel.text(ctx, `BØLGER: ${S.won ? WAVES : S.wave - 1} AF ${WAVES}`, W / 2, 73, C.text, 1, "center");
      Pixel.text(ctx, `RIGTIGE I FØRSTE FORSØG: ${S.stats.first} AF ${n} (${n ? Math.round(100 * S.stats.first / n) : 0} %)`, W / 2, 83, C.text, 1, "center");
      Pixel.text(ctx, `LÆNGSTE RÆKKE: ${S.best} I TRÆK`, W / 2, 93, C.text, 1, "center");
      Pixel.text(ctx, `POINT: ${S.score}`, W / 2, 106, C.good, 2, "center");
      if (S.calc) Pixel.text(ctx, "SIDST: " + S.calc, W / 2, 123, C.cyan, 1, "center");
      Pixel.text(ctx, Leader.asking() ? "NY PLADS PÅ TOPLISTEN: SKRIV ET KALDENAVN UNDER SPILLET" : TOUCH ? "TRYK SPIL IGEN" : "SPIL IGEN: ENTER ELLER MELLEMRUM", W / 2, 135, C.warn, 1, "center");
    }
    // the button under the canvas follows the phase (only touched when something changes)
    const t = S.phase === "over" ? "Spil igen" : S.phase === "title" ? "Start" : "Skyd", off = S.phase === "gap";
    if (t !== btnText) goBtn.textContent = btnText = t;
    if (off !== btnOff) goBtn.disabled = btnOff = off;
  }

  newRun();
  Progress.ready.then(() => { if (S.phase === "title" && !Leader.friend()) S.lv = savedLevel(); });
  Leader.render(document.getElementById("top"), GAME);
  // ticking "a friend is playing" before the first wave starts the run over at the friend's level
  document.getElementById("friend").addEventListener("change", () => { if (S.phase === "title") newRun(); });
  Pixel.loop(update, draw);
})();
