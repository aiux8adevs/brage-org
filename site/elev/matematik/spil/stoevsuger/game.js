// Støvsugerkrigen: robot vacuums with numbers on their backs drive towards the snack bowl. A shot with a prime that
// divides the number splits it (84 -> 42); at 1 the robot falls apart. A prime that does not divide bounces off and
// locks the gun for a moment. Between waves you place cannons that divide by their own prime on their own.
// The maths is the action: every shot and every cannon placement is a prime factorisation.
//
// Adapting to the player (after every wave, invisible): no leaks and >= 85 % of shots right -> level up (two waves in
// a row -> +2); >= 25 % leaked or < 60 % right -> level down, the next wave 15 % slower, and hovering a robot shows
// its factors. Mid-wave emergency brake: at 3 lives or fewer the gaps between robots grow by 30 %.
// Levels pick the numbers: 1 = 2 and 3 up to 24, 2 = + 5 up to 50, 3 = + 7 up to 100, 4 = three or more factors
// up to 150, 5 = up to 200. 30 % of the numbers lean on the prime the player hits least often.
(() => {
  const canvas = document.getElementById("game");
  const g = Pixel.screen(canvas, 320, 180), { ctx, W, H, mouse } = g;
  const C = { floor: "#1b2a33", tile: "#21333e", rug: "#3a2f4a", rugEdge: "#4b3d60", text: "#f2f6f0", dim: "#8ea3a8",
              warn: "#ffcf5a", bad: "#ff6b5e", good: "#7cf2b2", gold: "#ffd34a", 2: "#5ad1ff", 3: "#ffd34a", 5: "#ff7ac6", 7: "#7cf2b2" };
  const PRIMES = [2, 3, 5, 7];
  const PATH = [[-12, 40], [120, 40], [120, 138], [222, 138], [222, 62], [300, 62]];
  const BOWL = [304, 62], GUN = [300, 92];
  const SLOTS = [[70, 64], [150, 70], [96, 112], [172, 112], [250, 96], [256, 34]];
  const RANGE = 40, WAVES = 10, PER_WAVE = 8;
  const SEG = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
  const LEN = SEG.reduce((a, b) => a + b, 0);
  function along(d) {                                           // the point at distance d along the path
    for (let i = 0; i < SEG.length; i++) {
      if (d <= SEG[i]) { const f = d / SEG[i], a = PATH[i], b = PATH[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
      d -= SEG[i];
    }
    return PATH[PATH.length - 1];
  }
  const factors = n => { const f = []; for (const p of [2, 3, 5, 7]) while (n % p === 0) { f.push(p); n /= p; } return n === 1 ? f : null; };
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  // ---------- level from earlier runs (shared progress), else 1 ----------
  const GAME = "stoevsuger";
  function savedLevel() {
    const ev = Progress.events("spil").filter(e => e.s === GAME && e.mode === "niveau");
    return ev.length ? ev[ev.length - 1].lv : 1;
  }

  // ---------- numbers for a wave ----------
  const POOL = [null, { p: [2, 3], max: 24, minF: 1 }, { p: [2, 3, 5], max: 50, minF: 2 }, { p: [2, 3, 5, 7], max: 100, minF: 2 },
                { p: [2, 3, 5, 7], max: 150, minF: 3 }, { p: [2, 3, 5, 7], max: 200, minF: 3 }];
  function number(lv, must) {
    const P = POOL[lv];
    for (let tries = 0; tries < 200; tries++) {
      let n = must || 1, f = must ? 1 : 0;
      const want = rnd(P.minF, P.minF + 2);
      while (f < want) { const p = P.p[rnd(0, P.p.length - 1)]; if (n * p > P.max) break; n *= p; f++; }
      if (n >= 4 && f >= P.minF && n <= P.max) return n;
    }
    return P.p[0] * P.p[P.p.length - 1];
  }
  function waveNumbers(lv, weak) {
    return Array.from({ length: PER_WAVE }, () => number(lv, Math.random() < 0.3 && POOL[lv].p.includes(weak) ? weak : 0));
  }

  // ---------- game state ----------
  let S;
  function newRun() {
    S = { lv: savedLevel(), wave: 0, lives: 10, coins: 80, phase: "prep", robots: [], shots: [], fx: [], cannons: SLOTS.map(() => 0),
          next: null, sel: null, cool: 0, lock: 0, help: false, upStreak: 0, slow: 1, golden: false,
          stats: { right: 0, wrong: 0 }, perPrime: Object.fromEntries(PRIMES.map(p => [p, [0, 0]])), msg: "Placer kanoner, og start bølgen", msgT: 99, dogWake: 0 };
    S.next = waveNumbers(S.lv, weakest());
  }
  function weakest() {
    let best = 2, low = 2;
    for (const p of PRIMES) { const [r, n] = S ? S.perPrime[p] : [0, 0]; const acc = n ? r / n : 0.5; if (acc < low) { low = acc; best = p; } }
    return best;
  }
  function say(text, x, y, colour = C.text, t = 1.2) { S.fx.push({ kind: "text", text, x, y, colour, t, t0: t }); }
  function dust(x, y, colour) { for (let k = 0; k < 10; k++) S.fx.push({ kind: "dot", x, y, vx: (Math.random() - .5) * 60, vy: (Math.random() - .8) * 60, colour, t: .6, t0: .6 }); }

  function startWave() {
    if (S.phase !== "prep") return;
    S.wave++; S.phase = "wave"; S.leaks = 0; S.waveRight = 0; S.waveWrong = 0; S.time = 0;
    const speed = (16 + 1.5 * S.lv) * S.slow, gap = 1.7;
    const nums = S.next.slice();
    if (S.wave === WAVES) nums.push([144, 600, 2520, 7560, 7560][S.lv - 1]);               // the boss
    if (S.golden) nums.splice(rnd(1, nums.length - 1), 0, [48, 96, 360, 720, 1260][S.lv - 1]);
    S.robots = nums.map((n, k) => {
      const boss = S.wave === WAVES && k === nums.length - 1, gold = S.golden && !boss && n === [48, 96, 360, 720, 1260][S.lv - 1];
      return { n, start: n, d: -k * gap * speed, speed: boss ? speed * 0.6 : speed, r: boss ? 10 : 6, boss, gold, blink: Math.random() * 2, hit: 0 };
    });
    S.expected = (LEN + (nums.length - 1) * gap * speed) / speed;
    S.golden = false; S.slow = 1; S.braked = false;
    S.msg = S.wave === WAVES ? "BOSS: INDUSTRISTØVSUGEREN!" : `Bølge ${S.wave}`; S.msgT = 2;
    Pixel.sfx("click");
  }
  function endWave() {
    const n = S.waveRight + S.waveWrong, acc = n ? S.waveRight / n : 1, leakShare = S.leaks / PER_WAVE;
    const old = S.lv;
    if (S.leaks === 0 && acc >= 0.85) { S.upStreak++; S.lv = Math.min(5, S.lv + (S.upStreak >= 2 ? 2 : 1)); if (S.upStreak >= 2) S.upStreak = 0; S.help = false; }
    else if (leakShare >= 0.25 || acc < 0.6) { S.upStreak = 0; S.lv = Math.max(1, S.lv - 1); S.slow = 0.85; S.help = true; }
    else S.upStreak = 0;
    if (S.time < S.expected * 0.6) S.golden = true;                       // cleared fast: a golden robot next time
    Progress.add({ sub: "spil", s: GAME, lv: old, ok: S.leaks === 0, mode: "bolge", ms: Math.round(S.time * 1000) });
    if (S.lv !== old) Progress.add({ sub: "spil", s: GAME, lv: S.lv, ok: S.lv > old, mode: "niveau", ms: 0 });
    if (S.wave >= WAVES) return finish(true);
    S.phase = "prep"; S.next = waveNumbers(S.lv, weakest());
    S.msg = S.leaks ? `${S.leaks} slap igennem. Flyt kanonerne?` : (S.golden ? "Hurtigt! En gylden robot er på vej" : "Bølgen er klaret"); S.msgT = 99;
    Pixel.sfx("win");
  }
  function finish(won) {
    S.phase = "over"; S.won = won;
    Progress.add({ sub: "spil", s: GAME, lv: S.lv, ok: won, mode: "run", ms: 0 });
    Pixel.sfx(won ? "win" : "lose");
  }

  // ---------- shooting ----------
  function target() {
    if (S.sel && S.robots.includes(S.sel) && S.sel.n > 1) return S.sel;
    let best = null, bd = 18;
    for (const r of S.robots) { if (r.d < 0 || r.n <= 1) continue; const [x, y] = along(r.d), d = Math.hypot(x - mouse.x, y - mouse.y); if (d < bd) { bd = d; best = r; } }
    return best;
  }
  function shoot(p) {
    if (S.phase !== "wave" || S.cool > 0 || S.lock > 0) return;
    const r = target(); if (!r) { say("Peg på en robot", mouse.x, mouse.y - 8, C.dim, .8); return; }
    S.shots.push({ x: GUN[0], y: GUN[1], r, p, t: 0 });
    S.cool = 0.8; Pixel.sfx("zap");
  }
  function land(s) {
    const r = s.r, [x, y] = along(r.d), ok = r.n % s.p === 0;
    S.perPrime[s.p][1]++;
    if (ok) {
      S.perPrime[s.p][0]++; S.stats.right++; S.waveRight++;
      r.n /= s.p; r.hit = .25; dust(x, y, C[s.p]);
      say(r.n === 1 ? "POF!" : Math.random() < .3 ? "ATJU!" : `${r.n * s.p}:${s.p}=${r.n}`, x, y - 12, C[s.p]);
      if (r.n === 1) { S.coins += r.gold ? 30 : 10; Pixel.sfx("pop"); } else Pixel.sfx("hit");
    } else {
      S.stats.wrong++; S.waveWrong++; S.lock = 1.5;
      say(`${s.p} GÅR IKKE OP I ${r.n}`, x, y - 12, C.bad, 1.4); Pixel.sfx("miss");
    }
  }

  // ---------- controls ----------
  addEventListener("keydown", e => {
    if (["2", "3", "5", "7"].includes(e.key)) { shoot(+e.key); e.preventDefault(); }
    if (e.key === " " || e.key === "Enter") { if (S.phase === "prep") startWave(); else if (S.phase === "over") newRun(); e.preventDefault(); }
  });
  document.querySelectorAll("[data-p]").forEach(b => b.onclick = () => shoot(+b.dataset.p));
  document.getElementById("go").onclick = () => { if (S.phase === "prep") startWave(); else if (S.phase === "over") newRun(); };
  document.getElementById("mute").onclick = e => { Pixel.muted = !Pixel.muted; e.target.textContent = Pixel.muted ? "Lyd: fra" : "Lyd: til"; };
  g.onClick((x, y) => {
    if (S.phase === "prep") {                                   // click a basket: empty -> 2 -> 3 -> 5 -> 7 -> empty
      const k = SLOTS.findIndex(([sx, sy]) => Math.hypot(sx - x, sy - y) < 10);
      if (k < 0) return;
      const cur = S.cannons[k];
      if (cur === 0) { if (S.coins < 40) { say("FOR FÅ MØNTER (40)", x, y - 12, C.bad); return; } S.coins -= 40; S.cannons[k] = 2; }
      else if (cur === 7) { S.cannons[k] = 0; S.coins += 40; }
      else S.cannons[k] = PRIMES[PRIMES.indexOf(cur) + 1];
      Pixel.sfx("click");
      return;
    }
    if (S.phase === "wave") {                                   // touch: tap a robot to lock the aim on it
      let best = null, bd = 14;
      for (const r of S.robots) { if (r.d < 0 || r.n <= 1) continue; const [rx, ry] = along(r.d), d = Math.hypot(rx - x, ry - y); if (d < bd) { bd = d; best = r; } }
      S.sel = best;
    }
  });

  // ---------- update ----------
  function update(dt) {
    for (const f of S.fx) { f.t -= dt; if (f.kind === "dot") { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 120 * dt; } else f.y -= 8 * dt; }
    S.fx = S.fx.filter(f => f.t > 0);
    if (S.msgT < 99) S.msgT -= dt;
    S.dogWake = Math.max(0, S.dogWake - dt);
    if (S.phase !== "wave") return;
    S.time += dt; S.cool = Math.max(0, S.cool - dt); S.lock = Math.max(0, S.lock - dt);
    if (S.lives <= 3 && !S.braked) { S.braked = true; for (const r of S.robots) if (r.d < 0) r.d *= 1.3; }   // emergency brake
    for (const r of S.robots) {
      if (r.n <= 1) continue;
      r.d += r.speed * dt; r.blink += dt; r.hit = Math.max(0, r.hit - dt);
      if (r.d >= LEN) { r.n = 0; S.lives--; S.leaks++; S.dogWake = 1.5; say("NOM NOM", BOWL[0] - 14, BOWL[1] - 14, C.warn); Pixel.sfx("lose"); }
    }
    // cannons: each bites the robot furthest along that its prime divides
    for (let k = 0; k < SLOTS.length; k++) {
      const p = S.cannons[k]; if (!p) continue;
      S.cd = S.cd || {}; S.cd[k] = (S.cd[k] || 0) - dt;
      if (S.cd[k] > 0) continue;
      let best = null;
      for (const r of S.robots) { if (r.n <= 1 || r.d < 0) continue; const [x, y] = along(r.d);
        if (Math.hypot(x - SLOTS[k][0], y - SLOTS[k][1]) <= RANGE && r.n % p === 0 && (!best || r.d > best.d)) best = r; }
      if (best) { S.cd[k] = 1.2; const [x, y] = along(best.d); best.n /= p; best.hit = .2; dust(x, y, C[p]);
        S.fx.push({ kind: "zap", x1: SLOTS[k][0], y1: SLOTS[k][1], x2: x, y2: y, colour: C[p], t: .15, t0: .15 });
        if (best.n === 1) { S.coins += best.gold ? 30 : 10; say("POF!", x, y - 10, C[p]); Pixel.sfx("pop"); } }
    }
    for (const s of S.shots) {
      if (s.r.n <= 1) { s.done = true; continue; }
      const [tx, ty] = along(s.r.d), d = Math.hypot(tx - s.x, ty - s.y), v = 260 * dt;
      if (d <= v) { s.done = true; land(s); } else { s.x += (tx - s.x) / d * v; s.y += (ty - s.y) / d * v; }
    }
    S.shots = S.shots.filter(s => !s.done);
    S.robots = S.robots.filter(r => r.n > 1 || r.n === 1 && false);
    if (S.lives <= 0) return finish(false);
    if (!S.robots.length && !S.shots.length) endWave();
  }

  // ---------- drawing ----------
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  function robotSprite(r) {
    const [x, y] = along(r.d), R = r.r, body = r.gold ? C.gold : r.boss ? "#9aa3ad" : "#c9d1d6";
    ctx.fillStyle = "#0b1217"; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y) + 2, R, 0, 7); ctx.fill();
    ctx.fillStyle = r.hit > 0 ? "#fff" : body; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), R, 0, 7); ctx.fill();
    px(x - R + 2, y + R - 3, R * 2 - 4, 1, "#5f6a72");             // bumper stripe at the front edge
    if (Math.floor(r.blink * 2) % 2) px(x + R - 4, y - R + 2, 2, 2, C.bad);   // blinking LED
    Pixel.text(ctx, r.n, x, y - 2, "#0b1217", 1, "center");
    return [x, y];
  }
  function cannonSprite(k) {
    const [x, y] = SLOTS[k], p = S.cannons[k];
    px(x - 6, y - 6, 12, 12, p ? "#24323c" : "rgba(255,255,255,.06)");
    if (!p) { px(x - 1, y - 4, 2, 8, C.dim); px(x - 4, y - 1, 8, 2, C.dim); return; }
    px(x - 6, y - 6, 12, 12, C[p]); px(x - 5, y - 5, 10, 10, "#24323c");
    Pixel.text(ctx, p, x, y - 2, C[p], 1, "center");
  }
  function draw() {
    for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) px(x, y, 16, 16, (x + y) / 16 % 2 ? C.floor : C.tile);
    for (let i = 0; i < PATH.length - 1; i++) {                    // the rug the robots follow
      const [a, b] = [PATH[i], PATH[i + 1]];
      px(Math.min(a[0], b[0]) - 7, Math.min(a[1], b[1]) - 7, Math.abs(b[0] - a[0]) + 14, Math.abs(b[1] - a[1]) + 14, C.rugEdge);
    }
    for (let i = 0; i < PATH.length - 1; i++) { const [a, b] = [PATH[i], PATH[i + 1]];
      px(Math.min(a[0], b[0]) - 5, Math.min(a[1], b[1]) - 5, Math.abs(b[0] - a[0]) + 10, Math.abs(b[1] - a[1]) + 10, C.rug); }
    // the bowl, the gun and a sleeping dog
    px(BOWL[0] - 8, BOWL[1] - 3, 14, 7, "#d9534f"); px(BOWL[0] - 6, BOWL[1] - 5, 10, 3, "#f0ad4e");
    px(GUN[0] - 5, GUN[1] - 4, 10, 8, "#56606a"); px(GUN[0] - 1, GUN[1] - 9, 3, 6, S.lock > 0 ? C.bad : "#c9d1d6");
    px(286, 150, 18, 9, "#b07a45"); px(298, 146, 8, 7, "#b07a45"); px(303, 145, 3, 3, "#7a4f2a"); px(287, 155, 3, 4, "#7a4f2a");
    Pixel.text(ctx, S.dogWake > 0 ? "VUF?" : (Math.floor(performance.now() / 700) % 2 ? "Z" : "Z Z"), 296, 136, C.dim);
    if (S.phase === "prep" || S.help) for (let k = 0; k < SLOTS.length; k++) if (S.cannons[k]) {
      ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.arc(SLOTS[k][0], SLOTS[k][1], RANGE, 0, 7); ctx.stroke(); }
    for (let k = 0; k < SLOTS.length; k++) cannonSprite(k);
    const tgt = S.phase === "wave" ? target() : null;
    for (const r of S.robots) if (r.d >= -6 && r.n > 1) {
      const [x, y] = robotSprite(r);
      if (r === tgt) { ctx.strokeStyle = C.warn; ctx.strokeRect(Math.round(x - r.r - 2) + .5, Math.round(y - r.r - 2) + .5, r.r * 2 + 4, r.r * 2 + 4); }
      if (S.help && r === tgt) { const f = factors(r.n); if (f) { const s = `${r.n}=${f.join("·")}`; px(x - Pixel.width(s) / 2 - 2, y - r.r - 12, Pixel.width(s) + 4, 8, "#0b1217"); Pixel.text(ctx, s, x, y - r.r - 10, C.warn, 1, "center"); } }
    }
    for (const s of S.shots) px(s.x - 2, s.y - 2, 4, 4, C[s.p]);
    for (const f of S.fx) {
      ctx.globalAlpha = Math.max(0, f.t / f.t0);
      if (f.kind === "dot") px(f.x, f.y, 2, 2, f.colour);
      else if (f.kind === "zap") { ctx.strokeStyle = f.colour; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); }
      else Pixel.text(ctx, f.text, f.x, f.y, f.colour, 1, "center");
      ctx.globalAlpha = 1;
    }
    // top bar
    px(0, 0, W, 10, "rgba(5,10,14,.85)");
    Pixel.text(ctx, `BØLGE ${Math.min(S.wave + (S.phase === "prep" ? 1 : 0), WAVES)}/${WAVES}`, 3, 3, C.text);
    Pixel.text(ctx, `LIV ${S.lives}`, 110, 3, S.lives <= 3 ? C.bad : C.text);
    Pixel.text(ctx, `MØNTER ${S.coins}`, 160, 3, C.gold);
    if (S.lock > 0) Pixel.text(ctx, "LÅST", W - 3, 3, C.bad, 1, "right");
    if (S.phase === "prep") {
      px(0, H - 22, W, 22, "rgba(5,10,14,.9)");
      Pixel.text(ctx, "NÆSTE BØLGE: " + S.next.join(" ") + (S.wave + 1 === WAVES ? " + BOSS" : ""), 3, H - 19, C.text);
      Pixel.text(ctx, "KLIK EN KURV FOR AT SÆTTE EN KANON (40). START: MELLEMRUM", 3, H - 10, C.dim);
    }
    if (S.msgT > 0 && S.phase !== "over") { const m = S.msg; px(W / 2 - Pixel.width(m) / 2 - 4, 14, Pixel.width(m) + 8, 10, "rgba(5,10,14,.85)"); Pixel.text(ctx, m, W / 2, 17, C.warn, 1, "center"); }
    if (S.phase === "over") {
      px(40, 40, 240, 100, "rgba(5,10,14,.94)");
      const n = S.stats.right + S.stats.wrong;
      Pixel.text(ctx, S.won ? "SEJR! SKÅLEN ER REDDET" : "SNACKSENE ER VÆK", W / 2, 52, S.won ? C.good : C.bad, 2, "center");
      Pixel.text(ctx, `BØLGER: ${S.won ? WAVES : S.wave - 1} AF ${WAVES}`, W / 2, 80, C.text, 1, "center");
      Pixel.text(ctx, `TRÆFSIKKERHED: ${n ? Math.round(100 * S.stats.right / n) : 0} %`, W / 2, 92, C.text, 1, "center");
      Pixel.text(ctx, "SPIL IGEN: MELLEMRUM", W / 2, 120, C.warn, 1, "center");
    }
    document.getElementById("go").textContent = S.phase === "over" ? "Spil igen" : "Start bølge";
    document.getElementById("go").disabled = S.phase === "wave";
  }

  Progress.ready.then(() => { if (S.phase === "prep" && S.wave === 0) { S.lv = savedLevel(); S.next = waveNumbers(S.lv, weakest()); } });
  newRun();
  Pixel.loop(update, draw);
})();
