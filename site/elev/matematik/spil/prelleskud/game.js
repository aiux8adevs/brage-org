// Prelleskud: a tank fights cardboard-box tanks hiding behind walls. You set the gun's angle in degrees and fire a
// tennis ball that bounces off walls: the angle in equals the angle out. The enemies are placed so the straight shot
// is blocked, so you must bank the ball. While you aim and after each shot the angle at every bounce is written on
// the screen, on both sides of the bounce, so the rule can be seen every time.
//
// Angles: 0° points right, 90° up, 180° left, 270° down (counter-clockwise, as in maths).
// Adapting (after every stage, invisible): the aim line shows less of the path as the level rises
//   1: the path through two bounces, 2: through one bounce, 3: up to the first wall, 4: a 40 px stub, 5: a 20 px stub
// and the shots needed get harder (0–1 bounces at level 1, two bounces at level 5).
// <= 1.5 balls per enemy -> level up; > 2.5 balls per enemy or a lost stage -> level down.
// A lost stage shows a shot that would have worked, with its angle, before the next stage starts.
//
// Points: 100 x level per box, + 50 x level for every bounce the ball made first, doubled for each further box the
// same ball goes through, and 25 x level for every ball left when the stage is cleared.
(() => {
  const canvas = document.getElementById("game");
  const g = Pixel.screen(canvas, 320, 180), { ctx, W, H, mouse } = g;
  const C = { ground: "#2b3a2c", ground2: "#304132", wall: "#8a8f98", wallTop: "#b7bcc4", text: "#f2f6f0", dim: "#9fb0a2", ink: "#0b1217",
              warn: "#ffcf5a", bad: "#ff6b5e", good: "#7cf2b2", ball: "#d8f25a", tank: "#5aa0ff", box: "#c9a26b", boxDark: "#9b7a4c", cat: "#4a4a52" };
  const ARENA = { x0: 6, y0: 14, x1: 314, y1: 174 };
  const R = 2, SPEED = 150, MAXB = 3, STAGES = 8;
  const GAME = "prelleskud";
  // a friend's run is not logged in the pupil's progress (see shared/leader.js), and starts at level 2
  const log = e => { if (!Leader.friend()) Progress.add(e); };
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = list => list[rnd(0, list.length - 1)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const typing = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);   // keys typed in a field are not game keys

  const MISS = ["ØV", "NÆSTEN", "DEN VAR TÆT PÅ", "KATTENE GRINER", "VÆGGEN TOG DEN", "PRØV EN ANDEN VINKEL"];
  const CATS = ["MJAV!", "HVÆS!", "MIN KASSE!", "FRÆKT!", "JEG SLADRER!"];
  const LOST = ["KATTENE BEHOLDER KASSERNE", "KATTENE HOLDER FEST I AFTEN", "BOLDENE LIGGER NU UNDER SOFAEN"];
  const WON = ["KATTENE MÅ FINDE NYE KASSER", "IKKE EN KASSE STÅR TILBAGE", "KATTENE PLANLÆGGER HÆVN"];

  // ---------- walls: the arena border plus blocks; every wall is axis-aligned ----------
  function rects(st) {
    return [{ x: ARENA.x0 - 6, y: ARENA.y0 - 6, w: ARENA.x1 - ARENA.x0 + 12, h: 6 }, { x: ARENA.x0 - 6, y: ARENA.y1, w: ARENA.x1 - ARENA.x0 + 12, h: 6 },
            { x: ARENA.x0 - 6, y: ARENA.y0, w: 6, h: ARENA.y1 - ARENA.y0 }, { x: ARENA.x1, y: ARENA.y0, w: 6, h: ARENA.y1 - ARENA.y0 }, ...st.blocks];
  }
  const inside = (x, y, r, pad = 0) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;

  // follow a ball from (x, y) at angle a; returns the path points and the bounces (point + which way the wall runs).
  // When the path ends at a wall, `wall` tells how the ball met it, so the angle in can be shown there too.
  function trace(st, x, y, a, maxBounces, maxLen = 2000) {
    let vx = Math.cos(rad(a)), vy = -Math.sin(rad(a)), len = 0;
    const pts = [[x, y]], bounces = [], walls = rects(st);
    while (len < maxLen) {
      const nx = x + vx * 0.5, ny = y + vy * 0.5;
      const hit = walls.find(r => inside(nx, ny, r, R));
      if (hit) {
        const fromSide = !inside(x, ny, hit, R);                 // moving into it sideways: a vertical wall
        if (bounces.length >= maxBounces) { pts.push([x, y]); return { pts, bounces, end: [x, y], stopped: true, wall: { x, y, vertical: fromSide, vx, vy } }; }
        if (fromSide) vx = -vx; else vy = -vy;
        bounces.push({ x, y, vertical: fromSide, vx, vy });
        pts.push([x, y]);
        continue;
      }
      x = nx; y = ny; len += 0.5;
    }
    pts.push([x, y]); return { pts, bounces, end: [x, y] };
  }
  // the first point where a ball on this path comes within dist of (px, py)
  function passes(path, px, py, dist) {
    for (let i = 0; i < path.pts.length - 1; i++) {
      const [ax, ay] = path.pts[i], [bx, by] = path.pts[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
      const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / (L * L)));
      if (Math.hypot(ax + t * (bx - ax) - px, ay + t * (by - ay) - py) < dist) return { seg: i };
    }
    return null;
  }

  // ---------- a stage: the tank, blocks and 1–3 enemies, each reachable by a planned shot ----------
  const NEED = [null, [0, 1], [1, 1], [1, 1], [1, 2], [2, 2]];
  function makeStage(lv) {
    for (let attempt = 0; attempt < 400; attempt++) {
      const st = { tank: [rnd(26, 90), rnd(42, 146)], blocks: [], enemies: [] };
      const nBlocks = rnd(1, 3);
      for (let k = 0; k < nBlocks; k++) {
        const vert = Math.random() < 0.5, w = vert ? 8 : rnd(30, 70), h = vert ? rnd(30, 70) : 8;
        const b = { x: rnd(110, 280 - w), y: rnd(26, 160 - h), w, h };
        if (!inside(st.tank[0], st.tank[1], b, 16)) st.blocks.push(b);
      }
      const want = Math.min(3, 1 + Math.floor(Math.random() * (lv >= 3 ? 3 : 2)));
      for (let e = 0; e < want * 6 && st.enemies.length < want; e++) {
        const [lo, hi] = NEED[lv], need = rnd(lo, hi);
        let a = rnd(1, 71) * 5; if (a % 90 < 15 || a % 90 > 75) continue;          // no shots along the axes
        const path = trace(st, st.tank[0], st.tank[1], a, need, 900);
        if (path.bounces.length < need) continue;
        // a point on the leg after the last planned bounce
        const leg = path.pts.slice(-2), f = 0.35 + Math.random() * 0.4;
        const ex = leg[0][0] + (leg[1][0] - leg[0][0]) * f, ey = leg[0][1] + (leg[1][1] - leg[0][1]) * f;
        if (ex < 20 || ex > 300 || ey < 26 || ey > 164) continue;
        if (Math.hypot(ex - st.tank[0], ey - st.tank[1]) < 50) continue;
        if (rects(st).some(r => inside(ex, ey, r, 8)) || st.enemies.some(o => Math.hypot(o.x - ex, o.y - ey) < 22)) continue;
        // with a bounce needed, the straight shot must be blocked: add a block in the middle if it is not
        let added = false;
        if (need > 0) {
          const direct = trace(st, st.tank[0], st.tank[1], deg(Math.atan2(-(ey - st.tank[1]), ex - st.tank[0])), 0, Math.hypot(ex - st.tank[0], ey - st.tank[1]));
          if (!direct.stopped) {
            const mx = (ex + st.tank[0]) / 2, my = (ey + st.tank[1]) / 2, vert = Math.abs(ex - st.tank[0]) > Math.abs(ey - st.tank[1]);
            const b = vert ? { x: mx - 4, y: my - 18, w: 8, h: 36 } : { x: mx - 18, y: my - 4, w: 36, h: 8 };
            const trial = { ...st, blocks: [...st.blocks, b] };
            const again = trace(trial, st.tank[0], st.tank[1], a, need, 900);
            if (!passes(again, ex, ey, 4) || inside(st.tank[0], st.tank[1], b, 12) || inside(ex, ey, b, 10)) continue;
            st.blocks.push(b); added = true;
          }
        }
        // all earlier enemies must still be reachable with their own planned shots
        if (!st.enemies.every(o => passes(trace(st, st.tank[0], st.tank[1], o.a, o.need, 900), o.x, o.y, 4))) { if (added) st.blocks.pop(); continue; }
        if (!passes(trace(st, st.tank[0], st.tank[1], a, need, 900), ex, ey, 4)) { if (added) st.blocks.pop(); continue; }
        st.enemies.push({ x: ex, y: ey, a, need, alive: true, pop: 0 });
      }
      if (st.enemies.length) return st;
    }
    return { tank: [40, 100], blocks: [{ x: 150, y: 60, w: 8, h: 60 }], enemies: [{ x: 260, y: 100, a: 30, need: 1, alive: true, pop: 0 }] };
  }

  // ---------- state ----------
  function savedLevel() { const ev = Progress.events("spil").filter(e => e.s === GAME && e.mode === "niveau"); return ev.length ? clamp(ev[ev.length - 1].lv, 1, 5) : 1; }
  let S;
  function newRun() {
    S = { lv: Leader.friend() ? 2 : savedLevel(), stage: 0, lives: 3, angle: 45, fx: [], ball: null, last: null, phase: "aim", score: 0,
          shots: 0, boxes: 0, bestTrick: 0, shake: 0, taught: false, view: null, solution: null };
    nextStage();
  }
  function nextStage() {
    S.stage++; S.st = makeStage(S.lv); S.balls = S.st.enemies.length + 2; S.used = 0; S.last = null; S.phase = "aim"; S.view = null; S.solution = null;
    S.pigeon = Math.random() < 0.4 ? { x: -10, y: rnd(150, 168), vx: 14, vy: 0 } : null;
    const n = S.st.enemies.length;
    S.msg = `BANE ${S.stage}: ${n} ${n === 1 ? "PAPKASSE" : "PAPKASSER"}, ${S.balls} BOLDE`; S.msgT = 2.5;
    sync();
  }
  function stageOver(won) {
    const per = S.used / S.st.enemies.length, old = S.lv;
    if (won && per <= 1.5) S.lv = Math.min(5, S.lv + 1);
    else if (!won || per > 2.5) S.lv = Math.max(1, S.lv - 1);
    log({ sub: "spil", s: GAME, lv: old, ok: won, mode: "bane", ms: S.used });
    if (S.lv !== old) log({ sub: "spil", s: GAME, lv: S.lv, ok: S.lv > old, mode: "niveau", ms: 0 });
    if (won) { const bonus = 25 * old * S.balls; S.score += bonus; if (bonus) say(`+${bonus} FOR ${S.balls} ${S.balls === 1 ? "BOLD" : "BOLDE"} TILOVERS`, W / 2, 34, C.good, 1.6); Pixel.sfx("win"); }
    else {
      S.lives--; Pixel.sfx("lose");
      // show a shot that would have worked on a box still standing
      const e = S.st.enemies.find(o => o.alive), [tx, ty] = S.st.tank;
      const path = trace(S.st, tx, ty, e.a, e.need, 900), hit = passes(path, e.x, e.y, 6);
      S.solution = { pts: path.pts.slice(0, (hit ? hit.seg : 0) + 1).concat([[e.x, e.y]]), bounces: path.bounces.slice(0, hit ? hit.seg : 0), a: e.a };
    }
    if (S.lives <= 0 || S.stage >= STAGES) {
      S.phase = "over"; S.won = S.lives > 0; S.line = pick(S.won ? WON : LOST);
      log({ sub: "spil", s: GAME, lv: S.lv, ok: S.won, mode: "run", ms: S.score });
      Leader.offer(GAME, S.score, document.getElementById("top")); return;
    }
    S.phase = "between"; S.betweenT = won ? 1.8 : 4;
    S.msg = won ? "BANEN ER RYDDET" : `IKKE FLERE BOLDE. ${S.solution.a}° HAVDE RAMT`; S.msgT = S.betweenT;
  }
  const say = (text, x, y, colour = C.text, t = 1.2) => { const w = Pixel.width(text) / 2 + 2; S.fx.push({ kind: "text", text, x: clamp(x, ARENA.x0 + w, ARENA.x1 - w), y: Math.max(y, ARENA.y0 + 2), colour, t, t0: t }); };
  const burst = (x, y, n, colours, power = 80) => { for (let q = 0; q < n; q++) S.fx.push({ kind: "dot", x, y, vx: (Math.random() - .5) * power, vy: -Math.random() * power * .9, colour: colours[q % colours.length], t: .8, t0: .8 }); };

  // ---------- controls ----------
  const input = document.getElementById("angle");
  function setAngle(a) { S.angle = ((Math.round(a) % 360) + 360) % 360; sync(); }
  function sync() { if (document.activeElement !== input) input.value = S.angle; }
  function fire() {
    if (S.phase !== "aim" || S.balls <= 0) return;
    S.balls--; S.used++; S.shots++; S.taught = true;
    const a = rad(S.angle);
    S.ball = { x: S.st.tank[0] + Math.cos(a) * 8, y: S.st.tank[1] - Math.sin(a) * 8, vx: Math.cos(a), vy: -Math.sin(a), bounces: [], pts: [[S.st.tank[0], S.st.tank[1]]], t: 0, hits: 0 };
    S.phase = "flying"; S.recoil = .12; Pixel.sfx("zap");
  }
  const again = () => { newRun(); Leader.render(document.getElementById("top"), GAME); };
  addEventListener("keydown", e => {
    if (e.target === input) { if (e.key === "Enter") { setAngle(+input.value || 0); input.blur(); fire(); } return; }
    if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "ArrowLeft") { setAngle(S.angle + (e.shiftKey ? 1 : 5)); e.preventDefault(); }
    if (e.key === "ArrowRight") { setAngle(S.angle - (e.shiftKey ? 1 : 5)); e.preventDefault(); }
    if (e.key === "ArrowUp") { setAngle(S.angle + 1); e.preventDefault(); }
    if (e.key === "ArrowDown") { setAngle(S.angle - 1); e.preventDefault(); }
    if (e.key === " " || e.key === "Enter") { if (!e.repeat) { if (S.phase === "over") again(); else fire(); } e.preventDefault(); }
  });
  input.addEventListener("change", () => setAngle(+input.value || 0));
  g.onWheel(d => setAngle(S.angle - d));
  const aimAt = (x, y) => { if (S.phase === "aim" && Math.hypot(x - S.st.tank[0], y - S.st.tank[1]) > 4) setAngle(deg(Math.atan2(-(y - S.st.tank[1]), x - S.st.tank[0]))); };
  g.onClick(aimAt);                                              // click to aim, or hold the button down and drag
  const fireBtn = document.getElementById("fire");
  fireBtn.onclick = () => { if (S.phase === "over") again(); else fire(); fireBtn.blur(); };
  document.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { setAngle(S.angle + +b.dataset.d); b.blur(); });
  document.getElementById("mute").onclick = e => { Pixel.muted = !Pixel.muted; e.target.textContent = Pixel.muted ? "Lyd: fra" : "Lyd: til"; e.target.blur(); };

  // ---------- update ----------
  function update(dt) {
    for (const f of S.fx) { f.t -= dt;
      if (f.kind === "dot") { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 90 * dt; }
      else if (f.kind === "cat") { f.x += f.vx * dt; f.y += f.vy * dt; }
      else f.y -= 6 * dt; }
    S.fx = S.fx.filter(f => f.t > 0);
    if (S.msgT > 0) S.msgT -= dt;
    S.shake = Math.max(0, S.shake - dt); S.recoil = Math.max(0, (S.recoil || 0) - dt);
    for (const e of S.st.enemies) if (e.pop > 0) e.pop -= dt;
    if (S.pigeon) { S.pigeon.x += S.pigeon.vx * dt; S.pigeon.y += S.pigeon.vy * dt; if (S.pigeon.x > W + 10 || S.pigeon.y < -10) S.pigeon = null; }
    if (S.phase === "aim" && mouse.down && mouse.inside) aimAt(mouse.x, mouse.y);
    if (S.phase === "between") { S.betweenT -= dt; if (S.betweenT <= 0) nextStage(); return; }
    if (S.phase !== "flying") return;
    const b = S.ball, walls = rects(S.st);
    b.t += dt;
    for (let k = 0; k < SPEED * dt / 0.5; k++) {
      const nx = b.x + b.vx * 0.5, ny = b.y + b.vy * 0.5, hit = walls.find(r => inside(nx, ny, r, R));
      if (hit) {
        if (b.bounces.length >= MAXB) { b.dead = true; burst(b.x, b.y, 5, [C.ball], 40); break; }
        const vertical = !inside(b.x, ny, hit, R);
        if (vertical) b.vx = -b.vx; else b.vy = -b.vy;
        b.bounces.push({ x: b.x, y: b.y, vertical, vx: b.vx, vy: b.vy }); b.pts.push([b.x, b.y]);
        burst(b.x, b.y, 3, ["#fff"], 30); Pixel.sfx("click");
        continue;
      }
      b.x = nx; b.y = ny;
      // the ball goes straight through a cardboard box, so one ball can take several
      for (const e of S.st.enemies) if (e.alive && Math.abs(b.x - e.x) < 7 && Math.abs(b.y - e.y) < 7) {
        e.alive = false; e.pop = 1; b.hits++; S.boxes++; S.shake = .2;
        const n = b.bounces.length, pts = (100 + 50 * n) * S.lv * b.hits;
        S.score += pts; S.bestTrick = Math.max(S.bestTrick, pts);
        say(pick(CATS), e.x, e.y - 12, C.warn);
        say(`+${pts}` + (b.hits > 1 ? " DOBBELT!" : n >= 2 ? " TRICKSKUD!" : ""), e.x, e.y - 20, C.good, 1.6);
        burst(e.x, e.y, 14, [C.box, C.boxDark]);
        const dir = e.x < W / 2 ? 1 : -1;                           // the cat leaves in a hurry
        S.fx.push({ kind: "cat", x: e.x, y: e.y, vx: dir * 70, vy: (Math.random() - .5) * 20, t: 4, t0: 4 });
        Pixel.sfx(b.hits > 1 || n >= 2 ? "bonus" : "pop");
      }
      const p = S.pigeon;
      if (p && !p.hit && Math.abs(b.x - p.x) < 5 && Math.abs(b.y - p.y) < 5) {
        p.hit = true; p.vx = 50; p.vy = -70; S.balls++;
        say("GRU! +1 BOLD", p.x, p.y - 8, C.good, 1.6); burst(p.x, p.y, 6, ["#dde", "#9aa"], 50); Pixel.sfx("bonus");
      }
    }
    if (b.t > 8) b.dead = true;
    if (b.dead) {
      b.pts.push([b.x, b.y]); S.last = b; S.ball = null; S.view = null;
      const left = S.st.enemies.filter(e => e.alive).length;
      if (!left) return stageOver(true);
      if (S.balls <= 0) return stageOver(false);
      if (!b.hits) say(pick(MISS), S.st.tank[0], S.st.tank[1] - 26, C.dim);
      S.phase = "aim";
    }
  }

  // ---------- drawing ----------
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  function label(s, x, y, colour, align = "center", size = 1) { Pixel.text(ctx, s, x + 1, y + 1, C.ink, size, align); Pixel.text(ctx, s, x, y, colour, size, align); }
  function line(pts, colour, dash) {
    ctx.strokeStyle = colour; ctx.setLineDash(dash || []); ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + .5, y + .5) : ctx.moveTo(x + .5, y + .5))); ctx.stroke(); ctx.setLineDash([]);
  }
  // the angle between the ball's path and the wall, as a number
  const wallAngle = bn => Math.round(deg(bn.vertical ? Math.atan2(Math.abs(bn.vx), Math.abs(bn.vy)) : Math.atan2(Math.abs(bn.vy), Math.abs(bn.vx))));
  // at a bounce: that angle written on both sides (in and out); `inOnly` for a path that stops at the wall
  function bounceAngles(bn, colour = C.warn, inOnly = false) {
    const s = `${wallAngle(bn)}°`;
    if (bn.vertical) {
      // which side of the wall the ball is on, and whether it travels up or down, decides where "in" and "out" are
      const side = inOnly ? (bn.vx > 0 ? -1 : 1) : (bn.vx > 0 ? 1 : -1), al = side > 0 ? "left" : "right", down = bn.vy > 0;
      const x = clamp(bn.x + side * 4, ARENA.x0 + 2, ARENA.x1 - 2);
      if (!inOnly || down) label(s, x, clamp(bn.y - 11, ARENA.y0 + 1, ARENA.y1 - 6), colour, al);
      if (!inOnly || !down) label(s, x, clamp(bn.y + 6, ARENA.y0 + 1, ARENA.y1 - 6), colour, al);
    } else {
      const side = inOnly ? (bn.vy > 0 ? -1 : 1) : (bn.vy > 0 ? 1 : -1), right = bn.vx > 0;
      const y = clamp(bn.y + side * 7 - 2, ARENA.y0 + 1, ARENA.y1 - 6);
      if (!inOnly || right) label(s, clamp(bn.x - 14, ARENA.x0 + 8, ARENA.x1 - 8), y, colour);
      if (!inOnly || !right) label(s, clamp(bn.x + 14, ARENA.x0 + 8, ARENA.x1 - 8), y, colour);
    }
  }
  // the aim line: how much of the path it shows depends on the level. Worked out again only when something changes.
  function preview() {
    const key = `${S.stage}.${S.lv}.${S.angle}`;
    if (S.view && S.view.key === key) return S.view;
    const [x0, y0] = S.st.tank, lv = S.lv;
    const path = lv <= 3 ? trace(S.st, x0, y0, S.angle, [0, 2, 1, 0][lv], 700) : trace(S.st, x0, y0, S.angle, 0, lv === 4 ? 40 : 20);
    return S.view = { key, path };
  }
  function draw() {
    ctx.save();
    if (S.shake > 0) ctx.translate(rnd(-1, 1), rnd(-1, 1));
    for (let y = 0; y < H; y += 10) for (let x = 0; x < W; x += 10) px(x, y, 10, 10, (x + y) / 10 % 2 ? C.ground : C.ground2);
    for (const r of rects(S.st)) { px(r.x, r.y, r.w, r.h, C.wall); px(r.x, r.y, r.w, 2, C.wallTop); }
    // the last shot stays as a faint line to adjust from; its angles are hidden while a new ball is in the air
    if (S.last) { line(S.last.pts, "rgba(255,255,255,.3)"); if (S.phase !== "flying") S.last.bounces.forEach(bn => bounceAngles(bn, "#c9b98a")); }
    if (S.phase === "aim") {
      const { path } = preview();
      line(path.pts.concat([path.end]), "rgba(216,242,90,.8)", [3, 3]);
      path.bounces.forEach(bn => bounceAngles(bn));
      if (S.lv === 3 && path.wall) bounceAngles(path.wall, C.warn, true);     // level 3: the angle in is given, the angle out is yours to work out
    }
    if (S.solution) { line(S.solution.pts, C.good, [2, 2]); S.solution.bounces.forEach(bn => bounceAngles(bn, C.good)); }
    if (S.ball) { line(S.ball.pts.concat([[S.ball.x, S.ball.y]]), "rgba(216,242,90,.45)"); S.ball.bounces.forEach(bn => bounceAngles(bn)); }
    // enemies: cardboard boxes with a cat peeking out
    for (const e of S.st.enemies) {
      if (e.alive) { px(e.x - 6, e.y - 5, 12, 10, C.box); px(e.x - 6, e.y - 5, 12, 2, C.boxDark); px(e.x - 3, e.y - 8, 2, 3, C.cat); px(e.x + 1, e.y - 8, 2, 3, C.cat);
        px(e.x + 4, e.y - 2, 6, 2, "#6b5537"); px(e.x - 2, e.y, 1, 1, "#222"); px(e.x + 1, e.y, 1, 1, "#222"); }
      else { px(e.x - 8, e.y + 2, 16, 3, C.boxDark); px(e.x - 7, e.y + 1, 14, 1, C.box); }     // a flattened box stays behind
    }
    if (S.pigeon) { const { x, y } = S.pigeon, bob = Math.floor(x / 3) % 2; px(x - 3, y - 3, 6, 4, "#9aa"); px(x + 2, y - 5 + bob, 3, 3, "#9aa"); px(x + 5, y - 4 + bob, 1, 1, C.warn); px(x - 1, y + 1, 1, 2, C.warn); }
    // the tank and its protractor
    const [tx, ty] = S.st.tank, a = rad(S.angle);
    ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.beginPath(); ctx.arc(tx, ty, 14, 0, 7); ctx.stroke();
    for (let d = 0; d < 360; d += 15) { const r1 = d % 90 ? 13 : 11; ctx.beginPath(); ctx.moveTo(tx + Math.cos(rad(d)) * r1, ty - Math.sin(rad(d)) * r1); ctx.lineTo(tx + Math.cos(rad(d)) * 15, ty - Math.sin(rad(d)) * 15); ctx.stroke(); }
    if (S.lv <= 2) { Pixel.text(ctx, "0", tx + 18, ty - 2, C.dim); Pixel.text(ctx, "90", tx, ty - 23, C.dim, 1, "center"); Pixel.text(ctx, "180", tx - 18, ty - 2, C.dim, 1, "right"); Pixel.text(ctx, "270", tx, ty + 18, C.dim, 1, "center"); }
    px(tx - 6, ty - 5, 12, 10, C.tank); px(tx - 7, ty - 6, 14, 2, "#2f5fa8"); px(tx - 7, ty + 4, 14, 2, "#2f5fa8");
    const gl = S.recoil > 0 ? 6 : 9;                                 // the gun kicks back when it fires
    ctx.strokeStyle = "#d6e6ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(a) * gl, ty - Math.sin(a) * gl); ctx.stroke(); ctx.lineWidth = 1;
    if (S.phase === "aim") {                                         // the angle, large, behind the gun
      const s = `${S.angle}°`, w = Pixel.width(s, 2), lx = clamp(tx - Math.cos(a) * 34, ARENA.x0 + w / 2 + 3, ARENA.x1 - w / 2 - 3), ly = clamp(ty + Math.sin(a) * 30 - 5, ARENA.y0 + 3, ARENA.y1 - 13);
      px(lx - w / 2 - 2, ly - 2, w + 4, 14, "rgba(5,10,14,.8)"); Pixel.text(ctx, s, lx, ly, C.warn, 2, "center");
    }
    if (S.ball) { px(S.ball.x - 2, S.ball.y - 2, 4, 4, C.ball); px(S.ball.x - 1, S.ball.y - 2, 1, 1, "#fff"); }
    for (const f of S.fx) { ctx.globalAlpha = Math.min(1, Math.max(0, f.t / f.t0) * 2);
      if (f.kind === "dot") px(f.x, f.y, 2, 2, f.colour);
      else if (f.kind === "cat") { const hop = Math.floor(f.x / 4) % 2, d = Math.sign(f.vx);   // a small cat running off
        px(f.x - 3, f.y - 2 - hop, 6, 3, C.cat); px(f.x + d * 3 - 1, f.y - 4 - hop, 3, 3, C.cat); px(f.x - d * 4, f.y - 4 - hop, 1, 3, C.cat); px(f.x - 2, f.y + 1 - hop, 1, 1 + hop, C.cat); px(f.x + 2, f.y + 1 - hop, 1, 1 + hop, C.cat); }
      else label(f.text, Math.round(f.x), Math.round(f.y), f.colour);
      ctx.globalAlpha = 1; }
    ctx.restore();
    // top bar
    px(0, 0, W, 10, "rgba(5,10,14,.85)");
    Pixel.text(ctx, `BANE ${S.stage}/${STAGES}`, 3, 3, C.text);
    Pixel.text(ctx, `BOLDE`, 70, 3, S.balls <= 1 ? C.bad : C.text);
    for (let k = 0; k < S.balls; k++) px(94 + k * 6, 3, 4, 4, C.ball);
    Pixel.text(ctx, `LIV`, 150, 3, S.lives <= 1 ? C.bad : C.text);
    for (let k = 0; k < S.lives; k++) px(165 + k * 7, 3, 5, 5, C.tank);
    Pixel.text(ctx, `POINT ${S.score}`, W - 3, 3, C.good, 1, "right");
    if (S.msgT > 0 && S.phase !== "over") { const m = S.msg; px(W / 2 - Pixel.width(m) / 2 - 4, 16, Pixel.width(m) + 8, 10, "rgba(5,10,14,.85)"); Pixel.text(ctx, m, W / 2, 19, C.warn, 1, "center"); }
    if (!S.taught && S.phase === "aim") {                            // first stage, before the first shot: how to play
      const m = "SIGT: KLIK ELLER TRÆK MED MUSEN, ELLER BRUG PILETASTERNE. SKYD: MELLEMRUM";
      px(0, H - 11, W, 11, "rgba(5,10,14,.9)"); Pixel.text(ctx, m, W / 2, H - 8, C.text, 1, "center");
    }
    if (S.phase === "over") {
      px(40, 36, 240, 110, "rgba(5,10,14,.94)");
      Pixel.text(ctx, S.won ? "ALLE BANER KLARET!" : "KAMPVOGNEN ER TRÆT", W / 2, 46, S.won ? C.good : C.bad, 2, "center");
      Pixel.text(ctx, S.line, W / 2, 64, C.dim, 1, "center");
      Pixel.text(ctx, `BANER: ${S.won ? STAGES : S.stage - 1} AF ${STAGES}`, W / 2, 79, C.text, 1, "center");
      Pixel.text(ctx, `KASSER: ${S.boxes} MED ${S.shots} BOLDE`, W / 2, 90, C.text, 1, "center");
      Pixel.text(ctx, `BEDSTE SKUD: ${S.bestTrick} POINT`, W / 2, 101, C.text, 1, "center");
      Pixel.text(ctx, `POINT: ${S.score}`, W / 2, 114, C.good, 2, "center");
      Pixel.text(ctx, Leader.asking() ? "NY PLADS PÅ TOPLISTEN: SKRIV ET KALDENAVN UNDER SPILLET" : "SPIL IGEN: MELLEMRUM", W / 2, 134, C.warn, 1, "center");
    }
    const t = S.phase === "over" ? "Spil igen" : "Skyd";
    if (fireBtn.textContent !== t) fireBtn.textContent = t;
  }

  newRun();
  Leader.render(document.getElementById("top"), GAME);
  // ticking "a friend is playing" before the first shot starts the run over at the friend's level
  document.getElementById("friend").addEventListener("change", () => { if (S.stage === 1 && S.shots === 0) newRun(); });
  Progress.ready.then(() => { if (S.stage === 1 && S.used === 0 && !Leader.friend() && S.lv !== savedLevel()) { S.stage = 0; S.lv = savedLevel(); nextStage(); } });
  Pixel.loop(update, draw);
})();
