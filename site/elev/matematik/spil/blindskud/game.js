// Blindskud: a tank duel in thick fog. The dog's tank stands on a map with a coordinate grid; the scrap robots'
// tank is hidden in the fog and is only known as numbers on the radar. The player works out the distance, types
// it, and fires: the shell flies exactly that far, in the right direction. Only the exact distance hits.
//
// Why guessing does not work:
//   - the enemy is never drawn before it is hit (or has won the stage), so there is nothing to aim at or measure
//   - a miss only says "for kort" or "for langt", never by how much
//   - two shells per stage: after the second miss the enemy fires back and the armour loses a plate
//   - from level 3 the radar does not even give the enemy's position directly: it has to be worked out first
//     (a move, a midpoint, a mirror image), and the distance to the point that IS shown is always a wrong answer
//
// One stage, two shells:
//   hit at once                -> full points, the row of hits grows
//   first miss                 -> "for kort"/"for langt", and the rule for the stage is shown
//   second miss, or too late   -> the enemy fires back, a plate goes, time stands still, the fog lifts over the
//                                 enemy, and the calculation is shown with the triangle drawn on the map
//
// Two dials adapt to the player without saying so (the same rules as in Spejllaser):
//   the maths level (1-5) picks the kinds of stages. It follows the last five stages: all five hit with the first
//     shell -> up; three or fewer -> down, and the rule is then shown from the start for a while. 30 % of the
//     stages come from the level below.
//   the pace (0.6-1.6) sets how long the enemy takes to aim. Plenty of time left at a hit -> a little faster;
//     nearly too late -> slower; too late without a shot -> much slower (that means "too fast", not "too hard",
//     so then only the pace drops).
// Levels: 1 = same row or column (a difference, also across zero), 2 = Pythagoras with small triples and positive
// numbers, 3 = negative coordinates, an enemy that has moved, an easy midpoint, 4 = mirror image in an axis,
// midpoint with Pythagoras, 5 = mirror image in a line like x = 2, the midpoint backwards, and large triples
// that are easiest when the triangle is reduced first.
//
// Every distance is a whole number: the legs come from Pythagorean triples, so pencil and paper are enough.
// A run is eight stages; the last one is the command tank, which flees after the first hit and has to be hit
// again: 5-10 minutes.
(() => {
  const canvas = document.getElementById("game");
  const g = Pixel.screen(canvas, 320, 180), { ctx, W, H } = g;
  const C = { sky: "#060d10", text: "#f2f6f0", dim: "#8ea3a8", ink: "#05090e", warn: "#ffcf5a", bad: "#ff6b5e", good: "#7cf2b2", cyan: "#5ad1ff", pink: "#ff7ac6",
              ground: "#0b1712", faint: "#12241c", strong: "#1c3d2e", axis: "#3c8a63", num: "#58b888", radar: "#5cff9a",
              own: "#7fcf5e", ownD: "#2f5c2a", ownT: "#c4f0a0", foe: "#e0604f", foeD: "#6a2620", foeT: "#ffb0a0" };
  const GAME = "blindskud";
  const STAGES = 8, ARMOUR = 3, REVEAL = 8;
  const MAP = { x: 4, y: 13, w: 208, h: 144 };                    // the map; the radar console is to the right of it
  const CON = { x: 216, w: 100 };                                 // the console's text column
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = list => list[rnd(0, list.length - 1)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const TOUCH = matchMedia("(pointer: coarse)").matches;          // a phone or tablet: the hints name the buttons, not the keys
  const typing = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);   // keys typed in a field are not game keys
  const FIRE = TOUCH ? "SKYD" : "ENTER";

  const LOST = ["KAMPVOGNEN ER NU ET FUGLEBAD", "VAKS GÅR HJEM GENNEM TÅGEN", "DER VAR VIST EN REGNEFEJL I TÅRNET"];
  const WON = ["RADAREN ER TOM. GODT REGNET!", "TÅGEN LETTER, OG MARKEN ER JERES", "VAKS LOGRER MED HELE KAMPVOGNEN"];
  const CHEERS = ["FULDTRÆFFER!", "LIGE I TÅRNET!", "BLINDT, MEN PRÆCIST!", "DEN SAD!", "TÅGEN FIK ET HUL"];
  const WRECK = ["ROBOTTERNE HEJSER DET HVIDE FLAG", "ROBOTTEN: 'HVORDAN KUNNE DE SE OS?'", "DEN KAMPVOGN SKAL PÅ VÆRKSTED", "ROBOTTERNE GÅR HJEM OG LADER OP"];
  const MISSED = ["KUN TÅGEN BLEV RAMT", "EN ROEMARK FIK ET NYT HUL", "EN KO KIGGER FORNÆRMET PÅ DIG", "ET FUGLESKRÆMSEL MISTEDE HATTEN"];
  const CHAT = ["VAKS: 'VUF! JEG KAN IKKE SE EN DYT. GIV MIG ET TAL!'", "KØREREN SPISER MADPAKKE. DU REGNER.", "RADAREN BIPPER. TÅGEN SIGER INGENTING.", "LADEREN: 'GRANATEN ER KLAR, CHEF.'", "VAKS SNUSER. DET LUGTER AF RUSTEN ROBOT."];

  // ---------- the maps ----------
  // A view is a way to show the coordinate system on the map: u screen pixels per unit, the origin at (ox, oy), and
  // the coordinates a tank may stand on. q1 shows the first quadrant only; the two others have the origin in the middle.
  const VIEWS = {
    q1: { name: "q1", u: 12, ox: 18, oy: 147, x: [0, 16], y: [0, 11] },
    small: { name: "small", u: 12, ox: 108, oy: 85, x: [-8, 8], y: [-5, 5] },
    large: { name: "large", u: 6, ox: 108, oy: 85, x: [-16, 16], y: [-11, 11] },
  };
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
  const same = (p, q) => p[0] === q[0] && p[1] === q[1];
  const inV = (v, p) => p[0] >= v.x[0] && p[0] <= v.x[1] && p[1] >= v.y[0] && p[1] <= v.y[1];
  const rp = v => [rnd(v.x[0], v.x[1]), rnd(v.y[0], v.y[1])];
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const scr = (v, p) => [v.ox + p[0] * v.u, v.oy - p[1] * v.u];      // from coordinates to the screen
  const pt = p => `(${p[0]},${p[1]})`;
  const par = n => n < 0 ? `(${n})` : `${n}`;                       // a negative number in brackets, as in 5-(-3)
  const sg = n => n < 0 ? `${n}` : `+${n}`;

  // ---------- the stages ----------
  // Pythagorean triples: the two legs and the distance. T1 is for the first meeting with Pythagoras, T2 adds the
  // other small ones, T3 the ones for the large map, T4 are multiples that are easiest when reduced first.
  const T1 = [[3, 4, 5], [6, 8, 10]];
  const T2 = [...T1, [5, 12, 13], [9, 12, 15], [8, 15, 17]];
  const T3 = [[6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [15, 20, 25], [7, 24, 25], [10, 24, 26]];
  const T4 = [[18, 24, 30], [21, 28, 35], [16, 30, 34], [15, 20, 25], [7, 24, 25], [10, 24, 26]];
  const straight = (lo, hi) => { const d = rnd(lo, hi); return [[d, 0, d]]; };   // same row or column: the "triple" d, 0, d
  // the two tanks: the enemy stands a triple's two legs away from the player, in any of the eight directions
  function duel(view, triples, opt = {}) {
    for (let k = 0; k < 400; k++) {
      const [a, b, c] = pick(triples), s = () => pick([-1, 1]);
      const v = Math.random() < 0.5 ? [a * s() || 0, b * s() || 0] : [b * s() || 0, a * s() || 0];
      const P = opt.P || (opt.origin ? [0, 0] : rp(view)), E = add(P, v);
      if (!inV(view, E)) continue;
      // cross: the difference has to go across zero (from a negative number to a positive one) at least once
      if (opt.cross && !(P[0] * E[0] < 0 || P[1] * E[1] < 0)) continue;
      return { view, P, E, ans: c };
    }
    return null;
  }
  const PYT = "PYTHAGORAS: AFSTAND² = VANDRET² + LODRET²";
  // the last step, the same in every stage: the differences in x and y, and Pythagoras if both are there
  function distLine(P, E) {
    const dx = Math.abs(P[0] - E[0]), dy = Math.abs(P[1] - E[1]), c = Math.round(dist(P, E));
    const diff = (a, b) => `${Math.max(a, b)}-${par(Math.min(a, b))} = ${Math.abs(a - b)}`;
    if (!dy) return `SAMME Y, SÅ AFSTANDEN ER FORSKELLEN I X: ${diff(P[0], E[0])}`;
    if (!dx) return `SAMME X, SÅ AFSTANDEN ER FORSKELLEN I Y: ${diff(P[1], E[1])}`;
    return `VANDRET: ${diff(P[0], E[0])} · LODRET: ${diff(P[1], E[1])} · √(${dx * dx}+${dy * dy}) = √${c * c} = ${c}`;
  }
  const lastHint = (P, E) => P[0] === E[0] || P[1] === E[1] ? "SÅ ER AFSTANDEN FORSKELLEN MELLEM TALLENE" : "SÅ " + PYT;
  const moveText = m => [m[0] && `${Math.abs(m[0])} TIL ${m[0] > 0 ? "HØJRE" : "VENSTRE"}`, m[1] && `${Math.abs(m[1])} ${m[1] > 0 ? "OP" : "NED"}`].filter(Boolean).join(" OG ");
  const red = t => ({ t, c: C.foeT }), plain = t => ({ t, c: C.text });
  // Each maker returns one part of a stage, or null if the numbers did not fit this time:
  //   view, P, E, ans   the map, the player's tank, the enemy (hidden) and the distance between them
  //   lines             what the radar console says: [{ t, c }]
  //   marks             points shown on the map: { p, label, type } with type "mast", "seen" or "ghost"
  //   axis              a mirror line to draw: { dir: "x", k } is the line x = k, { dir: "y", k } the line y = k
  //   hint              the rule(s), shown after a first miss or when the player needs help
  //   calc              the calculation, one line per step
  //   t                 seconds the enemy needs to aim at pace 1
  const direct = (kind, t, d, neg) => d && { kind, t, ...d, lines: [red("FJENDE " + pt(d.E))], marks: [],
    hint: d.P[1] === d.E[1] ? ["I STÅR PÅ SAMME VANDRETTE LINJE: FIND FORSKELLEN MELLEM X-TALLENE"].concat(neg ? ["FRA ET NEGATIVT TAL TIL ET POSITIVT GÅR DU FORBI 0"] : [])
        : d.P[0] === d.E[0] ? ["I STÅR PÅ SAMME LODRETTE LINJE: FIND FORSKELLEN MELLEM Y-TALLENE"].concat(neg ? ["FRA ET NEGATIVT TAL TIL ET POSITIVT GÅR DU FORBI 0"] : [])
        : ["TEGN EN RETVINKLET TREKANT: FIND VANDRET OG LODRET AFSTAND", PYT],
    calc: [distLine(d.P, d.E)] };
  // the enemy was seen in one place and has driven on since
  function moved(kind, t, d, far) {
    if (!d) return null;
    const m = [pick([-1, 1]) * rnd(2, far), pick([-1, 1]) * rnd(2, far)], E0 = [d.E[0] - m[0], d.E[1] - m[1]];
    return { kind, t, ...d, lines: [plain("FJENDEN BLEV SET I"), red(pt(E0)), plain("DEREFTER KØRTE DEN"), red(moveText(m))], marks: [{ p: E0, label: "SET", type: "seen" }],
      hint: ["FLYT FØRST FJENDEN: HØJRE/VENSTRE ÆNDRER X, OP/NED ÆNDRER Y", lastHint(d.P, d.E)],
      calc: [`FJENDEN KØRTE: X = ${E0[0]}${sg(m[0])} = ${d.E[0]} · Y = ${E0[1]}${sg(m[1])} = ${d.E[1]} · DEN STÅR I ${pt(d.E)}`, distLine(d.P, d.E)] };
  }
  // the enemy stands exactly midway between two radio masts
  function midway(kind, t, d) {
    if (!d) return null;
    const v = [pick([-1, 1]) * rnd(1, 5), pick([-1, 1]) * rnd(1, 5)], A = [d.E[0] - v[0], d.E[1] - v[1]], B = add(d.E, v);
    return { kind, t, ...d, lines: [plain("FJENDEN STÅR PRÆCIS"), plain("MIDT MELLEM A OG B"), red("A " + pt(A)), red("B " + pt(B))], marks: [{ p: A, label: "A", type: "mast" }, { p: B, label: "B", type: "mast" }],
      hint: ["MIDTPUNKT: LÆG DE TO X-TAL SAMMEN OG DEL MED 2. SAMME MED Y", lastHint(d.P, d.E)],
      calc: [`MIDT: X = (${A[0]}+${par(B[0])})/2 = ${d.E[0]} · Y = (${A[1]}+${par(B[1])})/2 = ${d.E[1]} · FJENDEN: ${pt(d.E)}`, distLine(d.P, d.E)] };
  }
  // the radar shows the enemy's mirror image: in an axis (k = 0) or in a line like x = 2
  function mirrored(kind, t, d, line) {
    if (!d) return null;
    const dir = pick(["x", "y"]), i = dir === "x" ? 0 : 1, k = line ? pick([-1, 1]) * rnd(1, 4) : 0;
    if (d.E[i] === k) return null;                                  // on the mirror line: its image is the point itself
    const G = d.E.slice(); G[i] = 2 * k - d.E[i];
    const n = Math.abs(G[i] - k), where = line ? `LINJEN ${dir.toUpperCase()} = ${k}` : `${dir === "x" ? "Y" : "X"}-AKSEN`;
    return { kind, t, ...d, axis: { dir, k }, lines: [plain("RADAREN ER SNYDT! DEN"), plain("VISER FJENDEN SPEJLET"), plain(`I ${where}:`), red("SPEJLBILLEDE " + pt(G))], marks: [{ p: G, label: "SPEJLBILLEDE", type: "ghost" }],
      hint: [line ? `SPEJLING I ${where}: LIGE LANGT FRA LINJEN PÅ DEN ANDEN SIDE` : `SPEJLING I ${where}: ${dir === "x" ? "X" : "Y"} SKIFTER FORTEGN, ${dir === "x" ? "Y" : "X"} ER DEN SAMME`, lastHint(d.P, d.E)],
      calc: [line ? `SPEJLING I ${dir.toUpperCase()} = ${k}: ${G[i]} ER ${n} FRA LINJEN · ${k}${d.E[i] > k ? "+" : "-"}${n} = ${d.E[i]} · FJENDEN: ${pt(d.E)}`
                  : `SPEJLING I ${where}: ${dir === "x" ? "X" : "Y"} SKIFTER FORTEGN · ${pt(G)} BLIVER TIL ${pt(d.E)}`, distLine(d.P, d.E)] };
  }
  // the midpoint backwards: a mast stands exactly midway between a transmitter and the enemy
  function beyond(kind, t, d) {
    if (!d) return null;
    const v = [rnd(-4, 4), rnd(-4, 4)];
    if (Math.abs(v[0]) + Math.abs(v[1]) < 3) return null;
    const M = [d.E[0] - v[0], d.E[1] - v[1]], Sn = [M[0] - v[0], M[1] - v[1]];
    return { kind, t, ...d, lines: [plain("M STÅR PRÆCIS MIDT"), plain("MELLEM SENDER S"), plain("OG FJENDEN"), red("S " + pt(Sn)), red("M " + pt(M))], marks: [{ p: Sn, label: "S", type: "mast" }, { p: M, label: "M", type: "mast" }],
      hint: ["GÅ FRA S TIL M. GÅ SÅ SAMME SKRIDT EN GANG TIL: DER STÅR FJENDEN", lastHint(d.P, d.E)],
      calc: [`FRA S TIL M: X ${sg(v[0])}, Y ${sg(v[1])} · SAMME SKRIDT IGEN FRA M: ${pt(M)} BLIVER TIL ${pt(d.E)}`, distLine(d.P, d.E)] };
  }
  const KINDS = [
    // ----- level 1: same row or column -----
    { lv: 1, kind: "lige", f: () => direct("lige", 28, duel(VIEWS.q1, straight(2, 14))) },
    { lv: 1, kind: "lige-", f: () => direct("lige-", 32, duel(VIEWS.small, straight(3, 14), { cross: true }), true) },
    // ----- level 2: Pythagoras with small triples -----
    { lv: 2, kind: "pyt0", f: () => direct("pyt0", 42, duel(VIEWS.large, T2, { origin: true })) },
    { lv: 2, kind: "pyt1", f: () => direct("pyt1", 50, duel(VIEWS.q1, T2)) },
    // ----- level 3: negative coordinates, a move, an easy midpoint -----
    { lv: 3, kind: "pyt-", f: () => direct("pyt-", 60, duel(VIEWS.large, T3, { cross: true })) },
    { lv: 3, kind: "flyt", f: () => moved("flyt", 70, duel(VIEWS.large, T2), 6) },
    { lv: 3, kind: "midt", f: () => midway("midt", 70, duel(VIEWS.large, Math.random() < 0.5 ? straight(4, 18) : T1)) },
    // ----- level 4: a mirror image in an axis, midpoint and move with larger triples -----
    { lv: 4, kind: "spejl", f: () => mirrored("spejl", 75, duel(VIEWS.large, T3), false) },
    { lv: 4, kind: "midt2", f: () => midway("midt2", 85, duel(VIEWS.large, T3)) },
    { lv: 4, kind: "flyt2", f: () => moved("flyt2", 80, duel(VIEWS.large, T3, { cross: true }), 9) },
    // ----- level 5: a mirror image in another line, the midpoint backwards, large triples -----
    { lv: 5, kind: "linje", f: () => mirrored("linje", 95, duel(VIEWS.large, T3), true) },
    { lv: 5, kind: "omvendt", f: () => beyond("omvendt", 95, duel(VIEWS.large, T3)) },
    { lv: 5, kind: "stor", f: () => direct("stor", 80, duel(VIEWS.large, T4, { cross: true })) },
  ];
  // A part is only used when it can be read and cannot be solved by a shortcut:
  //   every shown point is on the map, away from the player's tank and from the other points
  //   no shown point is the enemy itself, and the distance to a shown point is never the answer
  //   every text fits its place on the screen
  function sound(p) {
    if (!p) return false;
    const pts = [p.P, ...p.marks.map(m => m.p)];
    for (const m of p.marks) if (!inV(p.view, m.p) || same(m.p, p.E) || Math.abs(dist(p.P, m.p) - p.ans) < 0.01) return false;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (dist(pts[i], pts[j]) * p.view.u < 16) return false;
    return p.lines.every(l => Pixel.width(l.t) <= CON.w) && p.calc.every(l => Pixel.width(l) <= W - 8) && p.hint.every(l => Pixel.width("REGEL: " + l) <= W - 8);
  }
  function makePart(entry) {
    for (let k = 0; k < 300; k++) { const p = entry.f(); if (sound(p)) return Object.assign(p, { lv: entry.lv, told: false }); }
    return Object.assign(direct("pyt1", 50, duel(VIEWS.q1, T1)), { lv: 2, told: false });      // never happened in the play-tests
  }
  // the command tank's second part: it flees from where it was hit to a new place, and that distance is a new answer
  function flee(first, lv) {
    const big = first.view.name === "large", sets = lv <= 1 ? [straight(2, 14)] : lv === 2 || !big ? [T2, T1] : [T3, T2];
    for (const triples of [...sets, straight(2, 14), straight(2, 6)]) for (let k = 0; k < 60; k++) {
      const d = duel(first.view, triples, { P: first.P });
      if (!d || d.ans === first.ans || dist(d.E, first.E) * first.view.u < 16) continue;
      const m = [d.E[0] - first.E[0], d.E[1] - first.E[1]];
      const p = { kind: "flugt", t: lv <= 1 ? 35 : lv === 2 ? 55 : 70, ...d, lv, told: false,
        lines: [plain("DEN FLYGTER FRA"), red(pt(first.E)), plain("DEN KØRER"), red(moveText(m))], marks: [{ p: first.E, label: "RAMT", type: "seen" }],
        hint: ["FLYT FØRST FJENDEN: HØJRE/VENSTRE ÆNDRER X, OP/NED ÆNDRER Y", lastHint(d.P, d.E)],
        calc: [`FJENDEN KØRTE: X = ${first.E[0]}${sg(m[0])} = ${d.E[0]} · Y = ${first.E[1]}${sg(m[1])} = ${d.E[1]} · DEN STÅR I ${pt(d.E)}`, distLine(d.P, d.E)] };
      if (sound(p)) return p;
    }
    return null;
  }
  // a stage for a level: 30 % come from the level below, and the same kind does not come twice in a row.
  // The last stage of a run is the command tank: two parts, the second one a flight.
  function makeStage(lv, boss, lastKind) {
    for (let k = 0; k < 50; k++) {
      const use = !boss && lv > 1 && Math.random() < 0.3 ? lv - 1 : lv;
      let list = KINDS.filter(q => q.lv === use && q.kind !== lastKind); if (!list.length) list = KINDS.filter(q => q.lv === use);
      const first = makePart(pick(list)), parts = [first];
      if (boss) { const second = flee(first, lv); if (!second) continue; parts.push(second); }
      return { lv: first.lv, parts, boss };
    }
    return { lv, parts: [makePart(KINDS[0])], boss };
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
  const FOG = Array.from({ length: 18 }, () => ({ x: Math.random() * MAP.w, y: Math.random() * MAP.h, w: 30 + Math.random() * 45, h: 9 + Math.random() * 14, v: 2 + Math.random() * 6, a: 0.05 + Math.random() * 0.07 }));
  function newRun() {
    S = { phase: "title", lv: Leader.friend() ? 2 : savedLevel(), pace: 1, help: false, n: 0, stage: null, pi: 0, val: "", left: 0, tries: 0, phaseT: 0,
          armour: ARMOUR, score: 0, streak: 0, best: 0, fx: [], shake: 0, flash: 0, time: 0, clock: 0, taught: false, note: { text: "", colour: C.warn, t: 0 },
          last: [], lastKind: "", stats: { first: 0, second: 0, lost: 0 }, won: false, line: "", calc: [], done: 0, chat: "",
          ang: 0, recoil: 0, shell: null, back: null, craters: [], clear: [], shown: false, wreck: false, hurt: 0, missed: false, late: false, smoke: 0 };
  }
  const part = () => S.stage ? S.stage.parts[S.pi] : null;
  const ownAt = () => scr(part().view, part().P), foeAt = () => scr(part().view, part().E);
  const note = (text, colour = C.warn, t = 3) => { S.note = { text, colour, t }; };
  // effects: floating texts (pushed apart so they do not pile up), dots, spinning shards, rings and smoke
  function say(text, x, y, colour = C.text, t = 1.3) {
    const w = Pixel.width(text) / 2 + 2;
    for (const f of S.fx) if (f.kind === "text" && Math.abs(f.x - x) < 60 && f.y <= y + 3 && f.y > y - 30) f.y -= 8;
    S.fx.push({ kind: "text", text, x: clamp(x, w, W - w), y: clamp(y, 22, 150), vy: -9, colour, t, t0: t });
  }
  function burst(x, y, colour, n = 22, power = 1) {
    for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, v = (20 + Math.random() * 80) * power, t = 0.4 + Math.random() * 0.5;
      S.fx.push({ kind: "dot", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, colour: Math.random() < 0.3 ? "#ffffff" : colour, t, t0: t }); }
    for (let k = 0; k < n / 3; k++) { const a = Math.random() * 6.283, v = (25 + Math.random() * 45) * power, t = 0.7 + Math.random() * 0.5;
      S.fx.push({ kind: "shard", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.283, vr: (Math.random() - 0.5) * 14, len: 2 + Math.random() * 3, colour: "#b4c4d0", t, t0: t }); }
    S.fx.push({ kind: "ring", x, y, r: 4, vr: 90 * power, colour, t: 0.35, t0: 0.35 });
  }
  const puff = (x, y, colour = "rgba(150,160,165,.6)") => S.fx.push({ kind: "smoke", x: x + rnd(-2, 2), y, vx: rnd(-4, 4), vy: -10 - Math.random() * 8, colour, t: 1.1, t0: 1.1 });

  // ---------- stages ----------
  function setPart() {
    const p = part(); p.T = p.t / S.pace;
    S.left = p.T; S.tries = 0; S.val = ""; S.shell = null; S.back = null; S.shown = false; S.wreck = false; S.missed = false; S.late = false; S.phase = "aim";
    S.craters = []; S.chat = pick(CHAT);
  }
  function startStage() {
    S.n++; S.stage = makeStage(S.lv, S.n === STAGES, S.lastKind); S.pi = 0; S.clear = []; S.time = 0;
    S.lastKind = S.stage.parts[0].kind;
    setPart();
    if (S.n === STAGES) { note("SIDSTE MÅL: KOMMANDOVOGNEN. DEN SKAL RAMMES TO GANGE", C.pink, 3.5); Pixel.sfx("bonus"); }
    else if (S.taught) { note(`MÅL ${S.n}: NY FJENDE I TÅGEN`, C.warn, 1.6); Pixel.sfx("tick"); }
  }
  // the maths dial: the last five stages, counted as right only when every shell hit
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
    const d = parseInt(S.val, 10), p = part(), [x, y] = ownAt(), [ex, ey] = foeAt();
    if (!d) { Pixel.sfx("tick"); note("SKRIV AFSTANDEN FØRST", C.warn, 1.5); return; }
    S.taught = true; S.note.t = 0;
    S.ang = Math.atan2(ey - y, ex - x); S.recoil = 0.25; S.shake = 0.12;
    const to = [x + Math.cos(S.ang) * d * p.view.u, y + Math.sin(S.ang) * d * p.view.u];
    S.shell = { from: [x, y], to, d, f: 0, T: clamp(0.45 + d * 0.03, 0.5, 1.3), back: false };
    S.phase = "fly";
    burst(x + Math.cos(S.ang) * 9, y + Math.sin(S.ang) * 9, C.warn, 8, 0.5); Pixel.sfx("pop");
  }
  function land() {
    const sh = S.shell, p = part(); S.shell = null;
    if (sh.d === p.ans) return hit();
    const [x, y] = sh.to, on = x > MAP.x + 3 && x < MAP.x + MAP.w - 3 && y > MAP.y + 3 && y < MAP.y + MAP.h - 3, short = sh.d < p.ans;
    const tx = clamp(x, MAP.x + 30, MAP.x + MAP.w - 30), ty = clamp(y, MAP.y + 22, MAP.y + MAP.h - 12);
    S.tries++; S.streak = 0; S.missed = true; S.shake = 0.25;
    if (on) { S.craters.push([x, y]); burst(x, y, "#8a98a0", 14, 0.7); for (let k = 0; k < 4; k++) puff(x, y); }
    say(short ? "FOR KORT!" : "FOR LANGT!", tx, ty - 12, C.bad, 1.8);
    say(on ? pick(MISSED) : "LANGT UD OVER KORTET", tx, ty - 3, C.dim, 1.8);
    Pixel.sfx("miss"); Pixel.sfx("pop");
    if (S.tries >= 2) return fireBack(false);
    S.phase = "miss"; S.phaseT = 1.3; S.short = short;
  }
  function afterMiss() {
    part().told = true; S.val = ""; S.phase = "aim";
    note(`${S.short ? "FOR KORT" : "FOR LANGT"}. ET SKUD TILBAGE, SÅ SKYDER FJENDEN. SE REGLEN HER`, C.bad, 3);
  }
  function hit() {
    const [x, y] = foeAt(), p = part();
    S.clear.push({ x, y, r: 3, R: 26 }); S.shown = true; S.shake = 0.4; S.flash = 0.22;
    burst(x, y, C.warn, 34, 1.3); burst(x, y, C.bad, 16, 0.8); Pixel.sfx("boom");
    if (S.pi < S.stage.parts.length - 1) {                            // the command tank: hit once, it flees into the fog
      S.phase = "flee"; S.phaseT = 2;
      say("RAMT! MEN DEN KØRER ENDNU", x, y - 16, C.warn, 1.8); Pixel.sfx("hit");
      return;
    }
    const first = !S.missed, f = clamp(S.left / p.T, 0, 1);
    if (first) { S.streak++; S.best = Math.max(S.best, S.streak); S.stats.first++; } else S.stats.second++;
    const size = S.stage.boss ? 1.5 : 1;                             // two parts count for more than one
    const pts = Math.round(10 * S.stage.lv * size * (first ? 1 : 0.5) * (1 + 0.2 * Math.min(S.streak, 5))) + (first ? Math.round(6 * S.stage.lv * f) : 0) + (S.stage.boss ? 50 * S.lv : 0);
    S.score += pts; record(first);
    if (first) setPace(f > 0.5 ? 1.07 : f < 0.15 ? 0.93 : 1); else setPace(0.97);
    log({ sub: "spil", s: GAME, lv: S.stage.lv, ok: first, mode: "bane", ms: Math.round(S.time * 1000) });
    S.wreck = true; S.phase = "win"; S.phaseT = 2.3;
    say(`+${pts}`, x, y - 22, C.good, 1.8);
    say(S.streak >= 3 && first ? `${S.streak} I TRÆK!` : pick(CHEERS), x, y - 13, C.warn, 1.8);
    note(pick(WRECK), C.good, 2.3);
    Pixel.sfx(S.streak >= 3 ? "bonus" : "win");
  }
  function nextPart() {
    S.pi++; S.clear = []; setPart();
    note("KOMMANDOVOGNEN FLYGTEDE. FIND DEN IGEN, OG SKYD EN GANG TIL", C.pink, 3.5);
  }
  // the enemy answers: after two misses, or when it has finished aiming
  function fireBack(late) {
    S.phase = "back"; S.late = late; S.back = { t: 0, fired: false };
  }
  // the stage is lost: a plate goes, the fog lifts over the enemy, and the calculation is shown
  function lose() {
    const [x, y] = ownAt(), [ex, ey] = foeAt(), late = S.late;
    S.armour--; S.streak = 0; S.stats.lost++;
    // the dials: too late without any shot -> only the pace drops (unless it is already at the slowest)
    if (!late || S.missed || S.pace <= 0.61) record(false);
    setPace(late ? (S.missed ? 0.9 : 0.8) : 0.97);
    log({ sub: "spil", s: GAME, lv: S.stage.lv, ok: false, mode: "bane", ms: Math.round(S.time * 1000) });
    S.calc = part().calc; S.shown = true; S.clear.push({ x: ex, y: ey, r: 3, R: 20 });
    S.phase = "reveal"; S.phaseT = REVEAL; S.hurt = 1.2;
    S.shake = 0.5; S.flash = 0.2; burst(x, y, C.bad, 28, 1.2); Pixel.sfx("boom"); Pixel.sfx("lose");
    say(late ? "FJENDEN NÅEDE AT SIGTE! PANSER -1" : "FJENDEN SKØD IGEN! PANSER -1", clamp(x, 80, 140), y - 16, C.bad, 2.4);
  }
  function next() {
    if (S.armour <= 0) return over(false);
    if (S.n >= STAGES) return over(true);
    startStage();
  }
  function over(won) {
    if (S.phase === "over") return;
    S.phase = "over"; S.won = won; S.done = S.stats.first + S.stats.second + S.stats.lost; S.shell = null; S.back = null;
    if (won) S.score += 30 * S.armour;
    S.line = pick(won ? WON : LOST);
    Pixel.sfx(won ? "win" : "lose");
    log({ sub: "spil", s: GAME, lv: S.lv, ok: won, mode: "run", ms: S.score });
    Leader.offer(GAME, S.score, document.getElementById("top"));
  }

  // ---------- input: digits are typed anywhere on the page, or pressed on the buttons under the game ----------
  function go() {                                                    // the big button, Enter and the space bar
    if (S.phase === "over") { if (Leader.asking()) return; newRun(); Leader.render(document.getElementById("top"), GAME); }
    if (S.phase === "title") { startStage(); Pixel.sfx("click"); return; }
    if (S.phase === "reveal") { if (S.phaseT < REVEAL - 1.5) S.phaseT = 0; return; }      // read on: not in the first moment, so a late key press does not skip it
    if (S.phase === "aim") fire();
  }
  function key(k) {
    if (S.phase !== "aim") return;
    if (k === "del") S.val = S.val.slice(0, -1);
    else if (S.val.length < 3) S.val = (S.val === "0" ? "" : S.val) + k;
    Pixel.sfx("tick");
  }
  addEventListener("keydown", e => {
    if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) key(e.key);
    else if (e.key === "Backspace" || e.key === "Delete") { key("del"); e.preventDefault(); }
    else if (e.key === "Enter" || e.key === " ") { if (!e.repeat) go(); e.preventDefault(); }
    else if (e.key === "Escape" && S.phase === "aim") S.val = "";
  });
  g.onClick(() => { if (S.phase === "title" || S.phase === "over" || S.phase === "reveal") go(); });
  const goBtn = document.getElementById("fire");
  goBtn.onclick = () => { go(); goBtn.blur(); };
  for (const b of document.querySelectorAll(".keys [data-k]")) b.onclick = () => { key(b.dataset.k); b.blur(); };
  document.getElementById("mute").onclick = e => { Pixel.muted = !Pixel.muted; e.target.textContent = Pixel.muted ? "Lyd: fra" : "Lyd: til"; e.target.blur(); };

  // ---------- update ----------
  function update(dt) {
    S.clock += dt;
    for (const b of FOG) { b.x += b.v * dt; if (b.x > MAP.w) { b.x = -b.w; b.y = Math.random() * MAP.h; } }
    for (const f of S.fx) { f.t -= dt;
      if (f.kind === "dot" || f.kind === "shard" || f.kind === "smoke") { f.x += f.vx * dt; f.y += f.vy * dt; if (f.kind !== "smoke") { f.vx *= 0.96; f.vy *= 0.96; } if (f.r !== undefined) f.r += f.vr * dt; }
      else if (f.kind === "ring") f.r += f.vr * dt;
      else if (f.kind === "text") { f.y += f.vy * dt; f.vy *= 0.96; } }
    S.fx = S.fx.filter(f => f.t > 0);
    for (const c of S.clear) c.r = Math.min(c.R, c.r + 60 * dt);
    S.shake = Math.max(0, S.shake - dt); S.flash = Math.max(0, S.flash - dt); S.recoil = Math.max(0, S.recoil - dt); S.hurt = Math.max(0, S.hurt - dt); S.note.t -= dt;
    if (S.wreck || S.hurt > 0) { S.smoke -= dt; if (S.smoke <= 0) { S.smoke = 0.12; const [x, y] = S.wreck ? foeAt() : ownAt(); puff(x, y - 3, S.wreck ? "rgba(90,96,100,.7)" : "rgba(200,120,90,.6)"); } }
    if (S.phase === "aim") {                                         // the enemy only aims while the player is working
      const p = part();
      S.time += dt; S.left -= dt;
      if (!p.warned && S.left < p.T * 0.25) { p.warned = true; Pixel.sfx("miss"); if (S.note.t <= 0) note("FJENDEN HAR NÆSTEN SIGTET IND!", C.bad, 1.8); }
      if (S.left <= 0) fireBack(true);
    } else if (S.phase === "fly") {
      const sh = S.shell; sh.f += dt / sh.T;
      if (sh.f >= 1) land();
    } else if (S.phase === "miss") {
      S.phaseT -= dt; if (S.phaseT <= 0) afterMiss();
    } else if (S.phase === "back") {                                 // a flash in the fog, then the enemy's shell comes flying
      const b = S.back, [x, y] = ownAt(), [ex, ey] = foeAt(); b.t += dt;
      if (!b.fired && b.t >= (S.late ? 0.3 : 1.1)) { b.fired = true; S.ang = Math.atan2(ey - y, ex - x);
        S.shell = { from: [ex, ey], to: [x, y], d: 0, f: 0, T: 0.6, back: true }; burst(ex, ey, C.bad, 8, 0.5); Pixel.sfx("pop"); }
      if (S.shell) { S.shell.f += dt / S.shell.T; if (S.shell.f >= 1) { S.shell = null; lose(); } }
    } else if (S.phase === "flee") {
      S.phaseT -= dt; if (S.phaseT <= 0) nextPart();
    } else if (S.phase === "win" || S.phase === "reveal") {
      S.phaseT -= dt; if (S.phaseT <= 0) next();
    }
  }

  // ---------- drawing ----------
  const px = (x, y, w, h, colour) => { ctx.fillStyle = colour; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  function line(p, q, dash) {
    ctx.beginPath(); ctx.moveTo(Math.round(p[0]) + 0.5, Math.round(p[1]) + 0.5); ctx.lineTo(Math.round(q[0]) + 0.5, Math.round(q[1]) + 0.5);
    ctx.setLineDash(dash ? [2, 2] : []); ctx.stroke(); ctx.setLineDash([]);
  }
  // a text on the map, on a dark plate so it can be read where it lies over a line; kept inside the map
  function label(text, x, y, colour, plate = "rgba(5,9,14,.85)") {
    const w = Pixel.width(text);
    x = clamp(Math.round(x), MAP.x + w / 2 + 2, MAP.x + MAP.w - w / 2 - 2); y = clamp(Math.round(y), MAP.y + 5, MAP.y + MAP.h - 5);
    px(x - w / 2 - 1, y - 4, w + 2, 8, plate); Pixel.text(ctx, text, x, y - 3, colour, 1, "center");
  }
  // the coordinate grid of a view, drawn once and kept: a line per unit, a stronger one per five, the axes, the numbers
  const GRIDS = {};
  function grid(v) {
    if (GRIDS[v.name]) return GRIDS[v.name];
    const c = document.createElement("canvas"); c.width = MAP.w; c.height = MAP.h;
    const x = c.getContext("2d"), ox = v.ox - MAP.x, oy = v.oy - MAP.y, each = v.u >= 12 ? 1 : 5;
    const bar = (X, Y, w, h, colour) => { x.fillStyle = colour; x.fillRect(X, Y, w, h); };
    const tone = n => n === 0 ? C.axis : n % 5 === 0 ? C.strong : C.faint;
    bar(0, 0, MAP.w, MAP.h, C.ground);
    for (const pass of [1, 5, 0]) {                                  // faint lines first, the axes last and on top
      for (let n = -Math.ceil(ox / v.u); ox + n * v.u < MAP.w; n++) if (pass === 0 ? n === 0 : pass === 5 ? n && n % 5 === 0 : n % 5 !== 0) bar(ox + n * v.u, 0, 1, MAP.h, tone(n));
      for (let n = -Math.ceil((MAP.h - oy) / v.u); oy - n * v.u >= 0; n++) if (pass === 0 ? n === 0 : pass === 5 ? n && n % 5 === 0 : n % 5 !== 0) bar(0, oy - n * v.u, MAP.w, 1, tone(n));
    }
    for (let n = v.x[0]; n <= v.x[1]; n++) if (n && n % each === 0) Pixel.text(x, n, ox + n * v.u + 1, oy + 3, C.num, 1, "center");
    for (let n = v.y[0]; n <= v.y[1]; n++) if (n && n % each === 0) Pixel.text(x, n, ox - 2, oy - n * v.u - 2, C.num, 1, "right");
    Pixel.text(x, "X", MAP.w - 5, oy - 8, C.num); Pixel.text(x, "Y", ox + 4, 2, C.num);
    return (GRIDS[v.name] = c);
  }
  // a tank seen from above: tracks, hull, turret and a gun that points along ang
  function tank(x, y, ang, body, dark, light, back = 0) {
    x = Math.round(x); y = Math.round(y);
    px(x - 5, y - 4, 11, 2, dark); px(x - 5, y + 3, 11, 2, dark); px(x - 4, y - 2, 9, 5, body);
    const tx = x - Math.cos(ang) * back, ty = y - Math.sin(ang) * back;
    ctx.strokeStyle = light; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx + 0.5, ty + 0.5); ctx.lineTo(tx + 0.5 + Math.cos(ang) * 9, ty + 0.5 + Math.sin(ang) * 9); ctx.stroke(); ctx.lineWidth = 1;
    px(tx - 2, ty - 2, 5, 5, dark); px(tx - 1, ty - 1, 3, 3, light);
  }
  function drawMarks(p) {
    const blink = Math.floor(S.clock * 3) % 2;
    if (p.axis) {                                                    // the mirror line
      const a = p.axis.dir === "x" ? [scr(p.view, [p.axis.k, 0])[0], MAP.y] : [MAP.x, scr(p.view, [0, p.axis.k])[1]];
      const b = p.axis.dir === "x" ? [a[0], MAP.y + MAP.h] : [MAP.x + MAP.w, a[1]];
      ctx.strokeStyle = C.pink; line(a, b, true);
      if (p.axis.dir === "x") label(p.axis.k ? `SPEJL: X = ${p.axis.k}` : "SPEJL", a[0], MAP.y + 12, C.pink); else label(p.axis.k ? `SPEJL: Y = ${p.axis.k}` : "SPEJL", MAP.x + MAP.w - 26, a[1], C.pink);
    }
    for (const m of p.marks) {
      const [x, y] = scr(p.view, m.p);
      if (m.type === "mast") { px(x, y - 6, 1, 7, "#c9d1d6"); px(x - 1, y, 3, 1, "#8a96a0"); px(x - 2, y - 4, 5, 1, "#8a96a0"); px(x - 1, y - 7, 3, 2, blink ? C.warn : "#8a6a20"); px(x, y, 1, 1, C.warn); }
      else if (m.type === "seen") { ctx.strokeStyle = C.foeT; line([x - 3, y - 3], [x + 3, y + 3]); line([x - 3, y + 3], [x + 3, y - 3]); }
      else { ctx.globalAlpha = 0.35 + 0.25 * Math.sin(S.clock * 9); tank(x, y, Math.PI, C.cyan, "#2a5a78", "#c8f0ff"); ctx.globalAlpha = 1; }
      label(m.label, x + (m.type === "mast" ? 6 : 0), y + (m.type === "mast" ? -7 : y - 12 < MAP.y + 8 ? 11 : -10), m.type === "ghost" ? C.cyan : m.type === "mast" ? C.warn : C.foeT);
    }
  }
  // after a lost stage: the right-angled triangle between the two tanks, with the lengths of its sides
  function drawTriangle(p) {
    const A = scr(p.view, p.P), B = scr(p.view, p.E), K = [B[0], A[1]], dx = Math.abs(p.P[0] - p.E[0]), dy = Math.abs(p.P[1] - p.E[1]);
    ctx.strokeStyle = C.cyan; if (dx && dy) { line(A, K); line(K, B); const s = Math.sign(A[0] - K[0]) * 4, t = Math.sign(B[1] - K[1]) * 4; line([K[0] + s, K[1]], [K[0] + s, K[1] + t]); line([K[0], K[1] + t], [K[0] + s, K[1] + t]); }
    ctx.strokeStyle = C.good; line(A, B, dx && dy);
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    if (dx && dy) {
      label(dx, (A[0] + K[0]) / 2, A[1] + (B[1] < A[1] ? 7 : -7), C.cyan); label(dy, K[0] + (A[0] < K[0] ? 8 : -8), (K[1] + B[1]) / 2, C.cyan);
      const l = Math.hypot(mid[0] - K[0], mid[1] - K[1]) || 1; label(p.ans, mid[0] + (mid[0] - K[0]) / l * 9, mid[1] + (mid[1] - K[1]) / l * 9, C.good);
    } else label(p.ans, mid[0] + (dx ? 0 : 9), mid[1] - (dx ? 8 : 0), C.good);
  }
  function drawMap(p) {
    const [x, y] = scr(p.view, p.P), [ex, ey] = scr(p.view, p.E);
    ctx.save(); ctx.beginPath(); ctx.rect(MAP.x, MAP.y, MAP.w, MAP.h); ctx.clip();
    ctx.drawImage(grid(p.view), MAP.x, MAP.y);
    for (const [cx, cy] of S.craters) { px(cx - 3, cy - 1, 7, 3, "#050b08"); px(cx - 1, cy - 3, 3, 7, "#050b08"); px(cx - 1, cy - 1, 3, 3, "#1e2a24"); }
    drawMarks(p);
    // the radar's sweep, turning round the player's tank
    const a = S.clock * 1.5;
    for (let k = 0; k < 5; k++) { ctx.strokeStyle = `rgba(92,255,154,${0.22 - k * 0.045})`; ctx.beginPath(); ctx.moveTo(x + 0.5, y + 0.5); ctx.lineTo(x + Math.cos(a - k * 0.045) * 260, y + Math.sin(a - k * 0.045) * 260); ctx.stroke(); }
    // the fog: slow, flat clouds over a thin haze
    px(MAP.x, MAP.y, MAP.w, MAP.h, "rgba(150,170,185,.06)");
    for (const b of FOG) { ctx.fillStyle = `rgba(170,190,205,${b.a})`; ctx.fillRect(Math.round(MAP.x + b.x), Math.round(MAP.y + b.y), Math.round(b.w), Math.round(b.h)); ctx.fillRect(Math.round(MAP.x + b.x + 7), Math.round(MAP.y + b.y - 4), Math.round(b.w - 16), Math.round(b.h + 8)); }
    // where a shell has blown the fog away, and what stood there
    for (const c of S.clear) { ctx.fillStyle = "rgba(11,23,18,.93)"; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 6.283); ctx.fill(); ctx.strokeStyle = "rgba(170,190,205,.25)"; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 6.283); ctx.stroke(); }
    if (S.phase === "reveal") drawTriangle(p);
    if (S.shown) {
      const toMe = Math.atan2(y - ey, x - ex);
      if (S.phase === "flee") {                                      // the command tank drives off and fades into the fog
        const q = S.stage.parts[S.pi + 1], [nx, ny] = scr(q.view, q.E), f = clamp(1 - S.phaseT / 2, 0, 1), go = Math.max(0, f - 0.35) / 0.65;
        ctx.globalAlpha = 1 - go; tank(ex + (nx - ex) * go * 0.6, ey + (ny - ey) * go * 0.6, toMe, C.foe, C.foeD, C.foeT); ctx.globalAlpha = 1;
      } else if (S.wreck) {                                          // a wreck: black hull, the turret knocked off, a white flag
        tank(ex, ey, toMe + 0.9, "#3a3432", "#1c1716", "#5a5350", -3);
        px(ex + 5, ey - 11, 1, 9, "#d8dde0"); px(ex + 6, ey - 11 + Math.floor(S.clock * 5) % 2, 5, 3, "#ffffff");
      } else tank(ex, ey, toMe, C.foe, C.foeD, C.foeT);
      if (S.phase === "reveal") label("FJENDE " + pt(p.E), ex, ey + (ey - 14 < MAP.y + 8 ? 12 : -11), C.foeT);
    }
    if (S.back && !S.back.fired && Math.floor(S.clock * 14) % 2) { ctx.fillStyle = "rgba(255,107,94,.5)"; ctx.beginPath(); ctx.arc(ex, ey, 4 + S.back.t * 3, 0, 6.283); ctx.fill(); }
    // the player's tank: hit, it flickers red for a moment
    const hurt = S.hurt > 0 && Math.floor(S.clock * 12) % 2;
    tank(x, y, S.ang, hurt ? C.bad : C.own, hurt ? "#6a2620" : C.ownD, C.ownT, S.recoil > 0 ? 2 : 0);
    if (S.shell) {                                                   // the shell: it rises and falls on its way, with a shadow on the ground
      const sh = S.shell, f = clamp(sh.f, 0, 1), sx = sh.from[0] + (sh.to[0] - sh.from[0]) * f, sy = sh.from[1] + (sh.to[1] - sh.from[1]) * f, h = Math.sin(f * Math.PI) * Math.min(12, Math.hypot(sh.to[0] - sh.from[0], sh.to[1] - sh.from[1]) * 0.12);
      px(sx - 1, sy, 2, 2, "rgba(0,0,0,.55)"); px(sx - 1, sy - 1 - h, 3, 3, sh.back ? C.bad : "#ffffff"); px(sx, sy - h, 1, 1, sh.back ? "#ffffff" : C.warn);
      const bx = sh.from[0] + (sh.to[0] - sh.from[0]) * Math.max(0, f - 0.06), by = sh.from[1] + (sh.to[1] - sh.from[1]) * Math.max(0, f - 0.06); px(bx, by - h, 1, 1, "rgba(255,207,90,.7)");
    }
    ctx.restore();
    ctx.strokeStyle = "#1f4a3c"; ctx.strokeRect(MAP.x - 0.5, MAP.y - 0.5, MAP.w + 1, MAP.h + 1);
    label("DIG", x, y + (y - 12 < MAP.y + 8 ? 11 : -10), C.ownT);
  }
  // the radar console to the right of the map: the positions, the distance being typed, the shells and the enemy's aim
  function drawConsole(p) {
    const x = CON.x, aim = S.phase === "aim", lost = S.phase === "reveal";
    Pixel.text(ctx, "RADAR", x, 15, C.radar); px(x + 24, 16, 3, 3, Math.floor(S.clock * 2) % 2 ? C.radar : "#1c5a3a");
    if (S.stage.boss) Pixel.text(ctx, "KOMMANDOVOGN", x + CON.w, 15, C.pink, 1, "right");
    Pixel.text(ctx, "DIG " + pt(p.P), x, 25, C.ownT);
    p.lines.forEach((l, i) => Pixel.text(ctx, l.t, x, 35 + i * 8, l.c));
    if (lost) Pixel.text(ctx, "FJENDEN STOD I " + pt(p.E), x, 35 + p.lines.length * 8 + 2, C.good);
    // the distance: what has been typed so far, or the right answer after a lost stage
    const colour = lost ? C.cyan : S.phase === "win" || S.phase === "flee" ? C.good : S.phase === "miss" || S.phase === "back" ? C.bad : C.warn;
    Pixel.text(ctx, lost ? "RIGTIG AFSTAND" : "AFSTAND TIL FJENDEN", x, 92, lost ? C.cyan : C.dim);
    px(x, 100, 62, 18, aim ? colour : "#2a3a4a"); px(x + 1, 101, 60, 16, C.ink);
    const t = lost ? String(p.ans) : S.val; Pixel.text(ctx, t, x + 5, 104, colour, 2);
    if (aim && Math.floor(S.clock * 3) % 2) px(x + 5 + (t ? Pixel.width(t, 2) + 2 : 0), 114, 6, 2, colour);
    // the shells that are left for this stage
    for (let k = 0; k < 2; k++) { const on = k < 2 - S.tries, sx = x + 70 + k * 12; px(sx, 103, 5, 11, on ? C.warn : "#24303c"); px(sx + 1, 101, 3, 2, on ? "#ffe9a8" : "#24303c"); px(sx, 111, 5, 1, on ? "#8a6a20" : "#24303c"); }
    Pixel.text(ctx, "SKUD", x + 70, 118, C.dim);
    // the enemy's aim: when the bar is full, it fires
    if (!lost) {
      const f = 1 - clamp(S.left / p.T, 0, 1), c = f > 0.75 ? C.bad : f > 0.5 ? C.warn : C.dim;
      Pixel.text(ctx, "FJENDEN SIGTER", x, 130, c); px(x, 138, CON.w, 5, "#16222c"); px(x, 138, Math.round(CON.w * f), 5, c); px(x + CON.w - 1, 136, 1, 9, C.bad);
    } else {
      Pixel.text(ctx, "LÆS UDREGNINGEN", x, 130, C.dim);
      if (S.phaseT < REVEAL - 1.5) Pixel.text(ctx, TOUCH ? "TRYK VIDERE" : "ENTER: VIDERE", x, 139, Math.floor(S.clock * 2) % 2 ? C.warn : C.dim);
    }
  }
  let btnText = "", btnOff = null;
  function draw() {
    const p = part(), play = p && S.phase !== "title" && S.phase !== "over";
    ctx.save();
    if (S.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 10 * Math.min(S.shake, 0.5)), Math.round((Math.random() - 0.5) * 10 * Math.min(S.shake, 0.5)));
    px(-6, -6, W + 12, H + 12, C.sky);
    if (play) { drawMap(p); drawConsole(p); }
    else {                                                           // behind the title and the end screen: an empty map in the fog
      ctx.drawImage(grid(VIEWS.large), MAP.x, MAP.y);
      for (const b of FOG) { ctx.fillStyle = `rgba(170,190,205,${b.a})`; ctx.fillRect(Math.round(MAP.x + b.x), Math.round(MAP.y + b.y), Math.round(Math.min(b.w, MAP.w - b.x)), Math.round(b.h)); }
    }
    for (const f of S.fx) {
      const a = Math.max(0, f.t / f.t0); ctx.globalAlpha = Math.min(1, a * 2);
      if (f.kind === "dot") px(f.x, f.y, 2, 2, f.colour);
      else if (f.kind === "smoke") { const s = 2 + Math.round((1 - a) * 3); px(f.x - s / 2, f.y - s / 2, s, s, f.colour); }
      else if (f.kind === "shard") { ctx.strokeStyle = f.colour; ctx.beginPath(); ctx.moveTo(f.x - Math.cos(f.r) * f.len, f.y - Math.sin(f.r) * f.len); ctx.lineTo(f.x + Math.cos(f.r) * f.len, f.y + Math.sin(f.r) * f.len); ctx.stroke(); }
      else if (f.kind === "ring") { ctx.strokeStyle = f.colour; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.stroke(); }
      else { const w = Pixel.width(f.text); px(f.x - w / 2 - 2, f.y - 2, w + 4, 9, "rgba(5,9,14,.8)"); Pixel.text(ctx, f.text, Math.round(f.x), Math.round(f.y), f.colour, 1, "center"); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (S.flash > 0) px(0, 0, W, H, `rgba(255,255,255,${Math.min(0.5, S.flash)})`);
    // top bar: the stage, the armour, the row of hits and the points
    px(0, 0, W, 10, "rgba(5,9,14,.9)");
    Pixel.text(ctx, S.n === STAGES ? "SIDSTE MÅL" : `MÅL ${Math.max(1, S.n)}/${STAGES}`, 3, 3, S.n === STAGES ? C.pink : C.text);
    Pixel.text(ctx, "PANSER", 62, 3, S.armour <= 1 ? C.bad : C.text);
    for (let k = 0; k < ARMOUR; k++) px(92 + k * 6, 3, 4, 5, k < S.armour ? (S.armour <= 1 ? C.bad : C.cyan) : "#24303c");
    if (S.streak >= 2) Pixel.text(ctx, `${S.streak} I TRÆK`, 160, 3, C.warn, 1, "center");
    Pixel.text(ctx, `POINT ${S.score}`, W - 3, 3, C.good, 1, "right");
    // the two lines under the map: the calculation after a lost stage, a message, the rule, the first-step hint, or the crew
    if (play) {
      let rows = [];
      const rule = p.hint.map((h, i) => [(i ? "" : "REGEL: ") + h, C.cyan]);
      if (S.phase === "reveal") rows = S.calc.map(l => [l, C.good]);
      else if (S.note.t > 0) rows = [[S.note.text, S.note.colour]].concat(S.phase === "aim" && (p.told || S.help) ? [rule[0]] : []);
      else if (S.phase === "aim" && (p.told || S.help)) rows = rule;
      else if (S.phase === "aim" && !S.taught) rows = [[`REGN AFSTANDEN FRA DIG TIL FJENDEN UD · SKRIV TALLET · TRYK ${FIRE}`, C.warn], ["FØRSTE SKRIDT: " + p.hint[0], C.cyan]];
      else if (S.phase === "aim") rows = [[S.chat, C.dim]];
      else if (S.phase === "fly") rows = [["GRANATEN ER I LUFTEN ...", C.dim]];
      else if (S.phase === "back") rows = [[S.late ? "FJENDEN HAR SIGTET IND ..." : "TO SKUD FORBI. NU SKYDER FJENDEN ...", C.bad]];
      px(0, 158, W, 22, "rgba(5,9,14,.92)"); px(0, 158, W, 1, "#1f4a3c");
      // a line too wide for the screen drops its label ("FØRSTE SKRIDT: ", "REGEL: "); the colour still says what it is
      rows = rows.map(([t, c]) => [Pixel.width(t) > W - 6 ? t.replace(/^(FØRSTE SKRIDT|REGEL): /, "") : t, c]);
      rows.forEach(([t, c], i) => Pixel.text(ctx, t, W / 2, (rows.length === 1 ? 166 : 162) + i * 9, c, 1, "center"));
    }
    if (S.phase === "title") {
      px(24, 20, 272, 128, "rgba(5,9,14,.93)");
      Pixel.text(ctx, "BLINDSKUD", W / 2, 28, C.radar, 3, "center");
      Pixel.text(ctx, "TÆT TÅGE. SKROTROBOTTERNES KAMPVOGN ER ET STED DERUDE,", W / 2, 51, C.text, 1, "center");
      Pixel.text(ctx, "OG VAKS KAN KUN SE DEN SOM TAL PÅ RADAREN.", W / 2, 60, C.text, 1, "center");
      Pixel.text(ctx, "1. REGN AFSTANDEN FRA DIG TIL FJENDEN UD (BRUG PAPIR)", W / 2, 75, C.warn, 1, "center");
      Pixel.text(ctx, TOUCH ? "2. SKRIV TALLET MED KNAPPERNE" : "2. SKRIV TALLET MED TALTASTERNE", W / 2, 84, C.warn, 1, "center");
      Pixel.text(ctx, `3. TRYK ${FIRE}: GRANATEN FLYVER PRÆCIS SÅ LANGT`, W / 2, 93, C.warn, 1, "center");
      Pixel.text(ctx, "ET SKUD FORBI SIGER KUN 'FOR KORT' ELLER 'FOR LANGT'.", W / 2, 107, C.dim, 1, "center");
      Pixel.text(ctx, "TO SKUD FORBI, OG FJENDEN SKYDER IGEN.", W / 2, 116, C.dim, 1, "center");
      if (Math.floor(S.clock * 2) % 2) Pixel.text(ctx, TOUCH ? "TRYK START" : "START: ENTER ELLER MELLEMRUM", W / 2, 132, C.good, 1, "center");
    }
    if (S.phase === "over") {
      px(2, 22, 316, 132, "rgba(5,9,14,.95)");
      Pixel.text(ctx, S.won ? "TÅGEN ER RYDDET!" : "KAMPVOGNEN ER UDE", W / 2, 30, S.won ? C.good : C.bad, 2, "center");
      Pixel.text(ctx, S.line, W / 2, 48, C.dim, 1, "center");
      Pixel.text(ctx, `MÅL: ${S.done} AF ${STAGES}`, W / 2, 62, C.text, 1, "center");
      Pixel.text(ctx, `RAMT MED FØRSTE SKUD: ${S.stats.first} AF ${S.done} (${S.done ? Math.round(100 * S.stats.first / S.done) : 0} %)`, W / 2, 71, C.text, 1, "center");
      Pixel.text(ctx, `LÆNGSTE RÆKKE: ${S.best} I TRÆK`, W / 2, 80, C.text, 1, "center");
      Pixel.text(ctx, `POINT: ${S.score}`, W / 2, 93, C.good, 2, "center");
      S.calc.forEach((l, i) => Pixel.text(ctx, l, W / 2, 112 + i * 9, C.cyan, 1, "center"));
      Pixel.text(ctx, Leader.asking() ? "NY PLADS PÅ TOPLISTEN: SKRIV ET KALDENAVN UNDER SPILLET" : TOUCH ? "TRYK SPIL IGEN" : "SPIL IGEN: ENTER ELLER MELLEMRUM", W / 2, 138, C.warn, 1, "center");
    }
    // the button under the canvas follows the phase (only touched when something changes)
    const t = S.phase === "over" ? "Spil igen" : S.phase === "title" ? "Start" : S.phase === "reveal" ? "Videre" : "Skyd";
    const off = S.phase === "fly" || S.phase === "miss" || S.phase === "back" || S.phase === "flee" || S.phase === "win";
    if (t !== btnText) goBtn.textContent = btnText = t;
    if (off !== btnOff) goBtn.disabled = btnOff = off;
  }

  newRun();
  Progress.ready.then(() => { if (S.phase === "title" && !Leader.friend()) S.lv = savedLevel(); });
  Leader.render(document.getElementById("top"), GAME);
  // ticking "a friend is playing" before the first stage starts the run over at the friend's level
  document.getElementById("friend").addEventListener("change", () => { if (S.phase === "title") newRun(); });
  Pixel.loop(update, draw);
})();
