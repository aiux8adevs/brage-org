// Støvsugerkrigen: robot vacuums with numbers on their backs drive towards the snack bowl. A shot with a prime that
// divides the number splits it (84 -> 42); at 1 the robot falls apart. A prime that does not divide bounces off and
// locks the gun for a moment. Between waves you place cannons that divide by their own prime on their own.
// The maths is the action: every shot and every cannon placement is a prime factorisation.
//
// Two dials adapt to the player after every wave, without saying so:
//   the maths level (1-5) picks the numbers and follows how many shots were right:
//     >= 88 % right and no leaks -> up (two such waves in a row -> +2); < 65 % right -> down. Below 75 % the
//     factors of the robot you point at are shown as a hint.
//   the pace (0.65-1.6) sets how fast the robots drive and follows the leaks:
//     no leaks -> a little faster; leaks -> slower, more so the more that leaked. Leaks with good accuracy mean
//     "too fast", not "too hard", so then only the pace drops. Inside a wave every leak also slows the robots
//     still driving by 10 % (up to four times), so one bad moment does not empty the whole bowl.
// Mid-wave emergency brake: at 3 lives or fewer the gaps between the robots still to come grow by 30 %, and the
// factor hint is switched on.
// Levels pick the numbers: 1 = 2 and 3 up to 24, 2 = + 5 up to 50, 3 = + 7 up to 100, 4 = three or more factors
// up to 150, 5 = up to 200. 30 % of the numbers lean on the prime the player hits least often.
//
// Balance: the cannons are slow on purpose (one bite every CANNON_CD seconds) and cost more each time, and the
// waves grow, so the player's own shots are needed all the way to wave 10.
(() => {
  const canvas = document.getElementById("game");
  const g = Pixel.screen(canvas, 320, 180), { ctx, W, H, mouse } = g;
  const C = { floor: "#1b2a33", tile: "#21333e", rug: "#3a2f4a", rugEdge: "#4b3d60", text: "#f2f6f0", dim: "#8ea3a8", ink: "#0b1217",
              warn: "#ffcf5a", bad: "#ff6b5e", good: "#7cf2b2", gold: "#ffd34a", 2: "#5ad1ff", 3: "#ffd34a", 5: "#ff7ac6", 7: "#7cf2b2" };
  const PRIMES = [2, 3, 5, 7];
  const PATH = [[-16, 40], [120, 40], [120, 138], [222, 138], [222, 62], [300, 62]];
  const BOWL = [304, 62], GUN = [300, 96];
  const SLOTS = [[70, 66], [152, 70], [94, 112], [172, 110], [252, 98], [256, 34]];
  const RANGE = 40, WAVES = 10;
  const CANNON_CD = 2.8, SHOT_CD = 0.3, LOCK = 1.5;
  const BOSS = [144, 600, 2520, 7560, 7560], GOLD = [48, 96, 360, 720, 1260];     // by maths level
  const SEG = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
  const LEN = SEG.reduce((a, b) => a + b, 0);
  function along(d) {                                           // the point at distance d along the path
    for (let i = 0; i < SEG.length; i++) {
      if (d <= SEG[i]) { const f = d / SEG[i], a = PATH[i], b = PATH[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
      d -= SEG[i];
    }
    return PATH[PATH.length - 1];
  }
  const factors = n => { const f = []; for (const p of PRIMES) while (n % p === 0) { f.push(p); n /= p; } return n === 1 ? f : null; };
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = list => list[rnd(0, list.length - 1)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const typing = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);   // keys typed in a field are not game keys

  // what a robot says when it falls apart, and what the end screen says
  const CRIES = ["POF!", "ATJU!", "AV MIN POSE!", "FEJL 404", "JEG GJORDE JO BARE RENT", "BIP ... BOP", "LAVT BATTERI", "IKKE FILTERET!"];
  const LOST = ["HUNDEN SOV FRA DET HELE", "ROBOTTERNE SIGER TAK FOR MAD", "GULVET ER TIL GENGÆLD RENT"];
  const WON = ["HUNDEN VÅGNEDE IKKE EN GANG", "INGEN KRUMMER GIK TABT", "ROBOTTERNE KRÆVER OMKAMP"];

  // ---------- level from earlier runs (shared progress), else 1 ----------
  const GAME = "stoevsuger";
  // a friend's run is not logged in the pupil's progress (see shared/leader.js), and starts at level 2
  const log = e => { if (!Leader.friend()) Progress.add(e); };
  function savedLevel() {
    const ev = Progress.events("spil").filter(e => e.s === GAME && e.mode === "niveau");
    return ev.length ? clamp(ev[ev.length - 1].lv, 1, 5) : 1;
  }

  // ---------- numbers for a wave ----------
  const POOL = [null, { p: [2, 3], max: 24, minF: 1 }, { p: [2, 3, 5], max: 50, minF: 2 }, { p: [2, 3, 5, 7], max: 100, minF: 2 },
                { p: [2, 3, 5, 7], max: 150, minF: 3 }, { p: [2, 3, 5, 7], max: 200, minF: 3 }];
  function number(lv, must) {
    const P = POOL[lv];
    for (let tries = 0; tries < 200; tries++) {
      let n = must || 1, f = must ? 1 : 0;
      const want = rnd(P.minF, P.minF + 2);
      while (f < want) { const p = pick(P.p); if (n * p > P.max) break; n *= p; f++; }
      if (n >= 4 && f >= P.minF && n <= P.max) return n;
    }
    return P.p[0] * P.p[P.p.length - 1];
  }
  // 8 robots in wave 1, 14 in wave 10; fewer when the pace dial is below 1, so a slow player also gets shorter waves
  const waveSize = wave => Math.max(6, Math.round((8 + (wave - 1) * 0.7) * Math.min(1, S ? S.pace : 1)));
  function waveNumbers(lv, weak, wave) {
    return Array.from({ length: waveSize(wave) }, () => number(lv, Math.random() < 0.3 && POOL[lv].p.includes(weak) ? weak : 0));
  }

  // ---------- game state ----------
  let S;
  function newRun() {
    S = { lv: Leader.friend() ? 2 : savedLevel(), pace: 1, score: 0, wave: 0, lives: 10, coins: 60, phase: "prep", robots: [], shots: [], fx: [],
          cannons: SLOTS.map(() => 0), cd: SLOTS.map(() => 0), next: null, sel: null, cool: 0, lock: 0, help: false, upStreak: 0, golden: false,
          streak: 0, best: 0, shake: 0, aim: -Math.PI / 2, taught: false,
          stats: { right: 0, wrong: 0 }, perPrime: Object.fromEntries(PRIMES.map(p => [p, [0, 0]])), msg: "SÆT EN KANON I EN KURV, OG START BØLGEN", msgT: 99, dogWake: 0 };
    S.next = waveNumbers(S.lv, weakest(), 1);
  }
  function weakest() {
    let best = 2, low = 2;
    for (const p of PRIMES) { const [r, n] = S ? S.perPrime[p] : [0, 0]; const acc = n ? r / n : 0.5; if (acc < low) { low = acc; best = p; } }
    return best;
  }
  // a floating text; texts already hanging at the same spot are pushed up, so quick shots do not pile into a blur
  function say(text, x, y, colour = C.text, t = 1.2) {
    const w = Pixel.width(text) / 2 + 2;
    for (const f of S.fx) if (f.kind === "text" && Math.abs(f.x - x) < 44 && f.y <= y + 3 && f.y > y - 30) f.y -= 7;
    S.fx.push({ kind: "text", text, x: clamp(x, w, W - w), y, colour, t, t0: t });
  }
  function dust(x, y, colour, n = 10) { for (let k = 0; k < n; k++) S.fx.push({ kind: "dot", x, y, vx: (Math.random() - .5) * 70, vy: (Math.random() - .8) * 70, colour, t: .6, t0: .6 }); }
  const price = () => 40 + 20 * S.cannons.filter(Boolean).length;          // every cannon costs 20 more than the last
  const divides = p => S.next.filter(n => n % p === 0).length;             // how many of the coming numbers a prime divides

  function startWave() {
    if (S.phase !== "prep") return;
    S.wave++; S.phase = "wave"; S.leaks = 0; S.waveRight = 0; S.waveWrong = 0; S.time = 0; S.sel = null;
    const speed = 18 * S.pace * (1 + 0.015 * (S.wave - 1)), gap = 1.9;
    const list = S.next.map(n => ({ n }));
    if (S.golden) list.splice(rnd(2, list.length - 1), 0, { n: GOLD[S.lv - 1], gold: true });
    if (S.wave === WAVES) list.push({ n: BOSS[S.lv - 1], boss: true });
    S.robots = list.map((o, k) => {
      const tw = Pixel.width(o.n, 2);                                       // bigger numbers ride on wider robots
      return { n: o.n, start: o.n, d: -k * gap * speed, speed: o.boss ? speed * 0.6 : o.gold ? speed * 1.25 : speed,
               w: o.boss ? Math.max(32, tw + 8) : Math.max(18, tw + 6), h: o.boss ? 24 : 16, boss: !!o.boss, gold: !!o.gold, blink: Math.random() * 2, hit: 0 };
    });
    S.count = list.length;
    S.expected = (LEN + (list.length - 1) * gap * speed) / speed;
    S.golden = false; S.braked = false; S.cd = SLOTS.map(() => 0.5);
    S.msg = S.wave === WAVES ? "BOSS: INDUSTRISTØVSUGEREN!" : !S.taught ? "PEG PÅ EN ROBOT, OG TRYK ET PRIMTAL DER GÅR OP I TALLET" : `BØLGE ${S.wave}`;
    S.msgT = S.taught ? 2 : 99;
    Pixel.sfx("click");
  }
  function endWave() {
    const n = S.waveRight + S.waveWrong, acc = n ? S.waveRight / n : 1, leakShare = S.leaks / S.count;
    const old = S.lv;
    if (S.leaks === 0) { S.score += 20 * old; S.coins += 10; }
    // the maths dial follows the accuracy of the player's own shots (a wave the cannons won alone changes nothing)
    if (n >= 6 && acc >= 0.88 && S.leaks === 0) { S.upStreak++; S.lv = Math.min(5, S.lv + (S.upStreak >= 2 ? 2 : 1)); if (S.upStreak >= 2) S.upStreak = 0; S.help = false; }
    else if (n >= 4 && acc < 0.65 || leakShare >= 0.25 && (acc < 0.8 || S.pace <= 0.66)) { S.upStreak = 0; S.lv = Math.max(1, S.lv - 1); S.help = true; }
    else { S.upStreak = 0; S.help = n >= 4 && acc < 0.75 || leakShare >= 0.25; }
    // the action dial follows the leaks
    if (S.leaks === 0) S.pace = Math.min(1.6, S.pace + 0.07);
    else S.pace = Math.max(0.65, S.pace - clamp(0.6 * leakShare, 0.05, 0.3));
    if (S.time < S.expected * 0.7 && S.leaks === 0) S.golden = true;      // cleared fast: a golden robot next time
    log({ sub: "spil", s: GAME, lv: old, ok: S.leaks === 0, mode: "bolge", ms: Math.round(S.time * 1000) });
    if (S.lv !== old) log({ sub: "spil", s: GAME, lv: S.lv, ok: S.lv > old, mode: "niveau", ms: 0 });
    if (S.wave >= WAVES) return finish(true);
    S.phase = "prep"; S.next = waveNumbers(S.lv, weakest(), S.wave + 1); S.shots = [];   // made after the dials moved
    S.msg = S.leaks ? `${S.leaks} SLAP IGENNEM. PASSER KANONERNE TIL TALLENE?` : S.golden ? "HURTIGT! EN GYLDEN ROBOT ER PÅ VEJ" : "BØLGEN ER KLARET: +10 MØNTER"; S.msgT = 99;
    Pixel.sfx("win");
  }
  function finish(won) {
    S.phase = "over"; S.won = won; S.line = pick(won ? WON : LOST);
    if (won) S.score += S.coins + 10 * S.lives * S.lv;                    // unused coins and saved snacks count
    log({ sub: "spil", s: GAME, lv: S.lv, ok: won, mode: "run", ms: S.score });
    Leader.offer(GAME, S.score, document.getElementById("top"));
    Pixel.sfx(won ? "win" : "lose");
  }

  // ---------- shooting ----------
  // the number a robot will have once the shots already in the air have landed; lets the player fire 2, 2, 3 in a row
  function virt(r) { let n = r.n; for (const s of S.shots) if (s.r === r && n % s.p === 0) n /= s.p; return n; }
  const alive = r => r.d >= 0 && r.n > 1 && virt(r) > 1;
  function nearest(x, y, reach) {
    let best = null, bd = reach;
    for (const r of S.robots) { if (!alive(r)) continue; const [rx, ry] = along(r.d), d = Math.hypot(rx - x, ry - y) - (r.boss ? 8 : 0); if (d < bd) { bd = d; best = r; } }
    return best;
  }
  // the robot a shot goes to: the one under the mouse, else the one last tapped (touch screens have no hover)
  function target() {
    const hover = mouse.type !== "touch" && mouse.inside ? nearest(mouse.x, mouse.y, 18) : null;
    if (hover) return hover;
    return S.sel && S.robots.includes(S.sel) && alive(S.sel) ? S.sel : null;
  }
  function shoot(p) {
    if (S.phase !== "wave" || S.cool > 0 || S.lock > 0) return;
    const r = target();
    if (!r) {                                                    // nothing aimed at; say so, unless the robot there is already done for
      const doomed = S.robots.some(o => { const [ox, oy] = along(o.d); return Math.hypot(ox - mouse.x, oy - mouse.y) < 18; });
      if (!doomed) say("PEG PÅ EN ROBOT", clamp(mouse.x, 40, W - 40), clamp(mouse.y, 30, H - 20) - 8, C.dim, .8);
      return;
    }
    const [x, y] = along(r.d);
    S.aim = Math.atan2(y - GUN[1], x - GUN[0]);
    S.shots.push({ x: GUN[0], y: GUN[1], r, p, ok: virt(r) % p === 0 });
    S.cool = SHOT_CD; Pixel.sfx("zap");
  }
  function pop(r, x, y, colour, byPlayer) {
    S.coins += r.gold ? 25 : r.boss ? 30 : byPlayer ? 5 : 2;
    dust(x, y, colour, r.boss ? 40 : 14); dust(x, y, "#c9d1d6", 6);
    say(r.boss ? "KA-BOOM!" : r.gold ? "+25 MØNTER" : pick(CRIES), x, y - 14, r.gold ? C.gold : colour, 1.4);
    if (r.boss) { S.score += 50 * S.lv; S.shake = .5; Pixel.sfx("boom"); } else Pixel.sfx("pop");
  }
  function land(s) {
    const r = s.r, [x, y] = along(r.d), top = y - r.h / 2 - 5;   // where the text about this shot starts
    if (r.n % s.p === 0) {
      S.perPrime[s.p][0]++; S.perPrime[s.p][1]++; S.stats.right++; S.waveRight++; S.streak++; S.best = Math.max(S.best, S.streak);
      const was = r.n; r.n /= s.p; r.hit = .25; dust(x, y, C[s.p], 6);
      S.score += (5 + Math.min(S.streak - 1, 5)) * S.lv;                  // points weigh more at higher levels and in a streak
      say(`${was}:${s.p}=${r.n}`, x, top - (r.n === 1 ? 9 : 0), C[s.p]);   // the division just made, always shown
      if (S.streak % 5 === 0) say(`${S.streak} I TRÆK!`, GUN[0] - 20, GUN[1] + 22, C.good, 1.4);
      if (!S.taught) { S.taught = true; S.msgT = 0; }
      if (r.n === 1) pop(r, x, y, C[s.p], true); else Pixel.sfx("hit");
    } else if (s.ok) {
      say("KANONEN KOM FØRST", x, top, C.dim, .9);                      // right when fired, but a cannon took that factor: no penalty
    } else {
      S.perPrime[s.p][1]++; S.stats.wrong++; S.waveWrong++; S.lock = LOCK; S.streak = 0;
      say(`${s.p} GÅR IKKE OP I ${r.n}`, x, top, C.bad, 1.6); Pixel.sfx("miss");
    }
  }

  // ---------- controls ----------
  const go = () => { if (S.phase === "prep") startWave(); else if (S.phase === "over") { newRun(); Leader.render(document.getElementById("top"), GAME); } };
  addEventListener("keydown", e => {
    if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (["2", "3", "5", "7"].includes(e.key)) { if (!e.repeat) shoot(+e.key); e.preventDefault(); }
    if (e.key === " " || e.key === "Enter") { if (!e.repeat) go(); e.preventDefault(); }
  });
  document.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { shoot(+b.dataset.p); b.blur(); });
  const goBtn = document.getElementById("go");
  goBtn.onclick = () => { go(); goBtn.blur(); };
  document.getElementById("mute").onclick = e => { Pixel.muted = !Pixel.muted; e.target.textContent = Pixel.muted ? "Lyd: fra" : "Lyd: til"; e.target.blur(); };
  const slotAt = (x, y) => SLOTS.findIndex(([sx, sy]) => Math.abs(sx - x) < 10 && Math.abs(sy - y) < 10);
  g.onClick((x, y) => {
    if (S.phase === "prep") {                                   // click a basket: empty -> 2 -> 3 -> 5 -> 7 -> empty
      const k = slotAt(x, y);
      if (k < 0) return;
      const cur = S.cannons[k], [sx, sy] = SLOTS[k];
      if (cur === 0) { if (S.coins < price()) { say(`FOR FÅ MØNTER (${price()})`, sx, sy - 14, C.bad); Pixel.sfx("miss"); return; } S.coins -= price(); S.cannons[k] = 2; }
      else if (cur === 7) { S.cannons[k] = 0; S.coins += price(); say("SOLGT", sx, sy - 14, C.gold); }   // price() is now what the last one cost
      else S.cannons[k] = PRIMES[PRIMES.indexOf(cur) + 1];
      if (S.cannons[k]) say(`${S.cannons[k]} GÅR OP I ${divides(S.cannons[k])} AF ${S.next.length}`, sx, sy - 14, C[S.cannons[k]], 1.6);
      Pixel.sfx("click");
      return;
    }
    if (S.phase === "wave") S.sel = nearest(x, y, 18);          // tap a robot to lock the aim on it
  });

  // ---------- update ----------
  function update(dt) {
    for (const f of S.fx) { f.t -= dt; if (f.kind === "dot") { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 120 * dt; } else f.y -= 8 * dt; }
    S.fx = S.fx.filter(f => f.t > 0);
    if (S.msgT < 99) S.msgT -= dt;
    S.dogWake = Math.max(0, S.dogWake - dt); S.shake = Math.max(0, S.shake - dt);
    if (S.phase !== "wave") return;
    S.time += dt; S.cool = Math.max(0, S.cool - dt); S.lock = Math.max(0, S.lock - dt);
    if (S.lives <= 3 && !S.braked) { S.braked = true; S.help = true; for (const r of S.robots) if (r.d < 0) r.d *= 1.3; }   // emergency brake
    for (const r of S.robots) {
      if (r.n <= 1) continue;
      r.d += r.speed * dt; r.blink += dt; r.hit = Math.max(0, r.hit - dt);
      if (r.d >= LEN) { r.n = 0; S.lives -= r.boss ? 3 : 1; S.leaks++; S.dogWake = 1.5; S.shake = .3; S.streak = 0;
        if (S.leaks <= 4) for (const o of S.robots) o.speed *= 0.9;        // every leak slows the rest of this wave a little
        say(r.boss ? "NOM NOM NOM NOM" : "NOM NOM", BOWL[0] - 20, BOWL[1] - 14, C.warn); Pixel.sfx("lose"); }
    }
    // cannons: each bites the robot furthest along that its prime divides
    for (let k = 0; k < SLOTS.length; k++) {
      const p = S.cannons[k]; if (!p) continue;
      S.cd[k] -= dt;
      if (S.cd[k] > 0) continue;
      let best = null;
      for (const r of S.robots) { if (r.n <= 1 || r.d < 0) continue; const [x, y] = along(r.d);
        if (Math.hypot(x - SLOTS[k][0], y - SLOTS[k][1]) <= RANGE && r.n % p === 0 && (!best || r.d > best.d)) best = r; }
      if (best) { S.cd[k] = CANNON_CD; const [x, y] = along(best.d); best.n /= p; best.hit = .2; dust(x, y, C[p], 5);
        S.fx.push({ kind: "zap", x1: SLOTS[k][0], y1: SLOTS[k][1], x2: x, y2: y, colour: C[p], t: .2, t0: .2 });
        if (best.n === 1) pop(best, x, y, C[p], false); else Pixel.sfx("tick"); }
    }
    for (const s of S.shots) {
      if (s.r.n <= 1) { s.done = true; continue; }
      const [tx, ty] = along(s.r.d), d = Math.hypot(tx - s.x, ty - s.y), v = 420 * dt;
      if (d <= v) { s.done = true; land(s); } else { s.x += (tx - s.x) / d * v; s.y += (ty - s.y) / d * v; }
    }
    S.shots = S.shots.filter(s => !s.done);
    S.robots = S.robots.filter(r => r.n > 1);
    if (S.lives <= 0) { S.lives = 0; return finish(false); }
    if (!S.robots.length) endWave();
  }

  // ---------- drawing ----------
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  // text with a dark edge, so it can be read on top of anything
  function label(s, x, y, colour, align = "center") { Pixel.text(ctx, s, x + 1, y + 1, C.ink, 1, align); Pixel.text(ctx, s, x, y, colour, 1, align); }
  function robotSprite(r) {
    const [cx, cy] = along(r.d), x = Math.round(cx - r.w / 2), y = Math.round(cy - r.h / 2);
    const body = r.hit > 0 ? "#fff" : r.gold ? C.gold : r.boss ? "#9aa3ad" : "#c9d1d6";
    px(x + 1, y + 3, r.w, r.h, "rgba(5,10,14,.6)");                           // shadow
    px(x + 2, y, r.w - 4, r.h, body); px(x, y + 2, r.w, r.h - 4, body);       // a rounded body
    px(x + 1, y + 1, r.w - 2, r.h - 2, body);
    px(x + 3, y + r.h - 2, r.w - 6, 1, "#5f6a72");                            // bumper stripe
    if (r.boss) { px(x + 3, y + 2, r.w - 6, 1, "#5f6a72"); px(x + 2, y + 4, 3, 2, C.warn); }
    if (Math.floor(r.blink * 2) % 2) px(x + r.w - 4, y + 1, 2, 2, C.bad);     // blinking LED
    Pixel.text(ctx, r.n, Math.round(cx) + 1, Math.round(cy) - 5, C.ink, 2, "center");
    return [cx, cy];
  }
  const biting = k => S.phase === "wave" && S.cd[k] > CANNON_CD - .2;       // a cannon flashes right after its bite
  function cannonSprite(k, hover) {
    const [x, y] = SLOTS[k], p = S.cannons[k];
    if (!p) { px(x - 6, y - 6, 12, 12, hover ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.06)"); px(x - 1, y - 4, 2, 8, C.dim); px(x - 4, y - 1, 8, 2, C.dim); return; }
    px(x - 7, y - 7, 14, 14, C[p]); px(x - 6, y - 6, 12, 12, biting(k) ? C[p] : "#24323c");
    Pixel.text(ctx, p, x + 1, y - 5, biting(k) ? C.ink : C[p], 2, "center");
  }
  function ring(k, alpha) { ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.beginPath(); ctx.arc(SLOTS[k][0], SLOTS[k][1], RANGE, 0, 7); ctx.stroke(); }
  let goText = "", goOff = null;
  function draw() {
    ctx.save();
    if (S.shake > 0) ctx.translate(rnd(-2, 2), rnd(-2, 2));
    for (let y = -16; y < H + 16; y += 16) for (let x = -16; x < W + 16; x += 16) px(x, y, 16, 16, (x + y) / 16 % 2 ? C.floor : C.tile);
    for (let i = 0; i < PATH.length - 1; i++) {                    // the rug the robots follow
      const [a, b] = [PATH[i], PATH[i + 1]];
      px(Math.min(a[0], b[0]) - 11, Math.min(a[1], b[1]) - 11, Math.abs(b[0] - a[0]) + 22, Math.abs(b[1] - a[1]) + 22, C.rugEdge);
    }
    for (let i = 0; i < PATH.length - 1; i++) { const [a, b] = [PATH[i], PATH[i + 1]];
      px(Math.min(a[0], b[0]) - 9, Math.min(a[1], b[1]) - 9, Math.abs(b[0] - a[0]) + 18, Math.abs(b[1] - a[1]) + 18, C.rug); }
    // the bowl, the gun and a sleeping dog
    px(BOWL[0] - 9, BOWL[1] - 4, 16, 9, "#d9534f"); px(BOWL[0] - 7, BOWL[1] - 6, 12, 3, S.lives > 0 ? "#f0ad4e" : "#7a2f2c");
    px(GUN[0] - 6, GUN[1] - 5, 12, 10, "#56606a"); px(GUN[0] - 4, GUN[1] - 3, 8, 6, "#6d7882");
    ctx.strokeStyle = S.lock > 0 ? C.bad : "#c9d1d6"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(GUN[0], GUN[1]);
    ctx.lineTo(GUN[0] + Math.cos(S.aim) * 9, GUN[1] + Math.sin(S.aim) * 9); ctx.stroke(); ctx.lineWidth = 1;
    px(286, 152, 18, 9, "#b07a45"); px(298, 148, 8, 7, "#b07a45"); px(303, 147, 3, 3, "#7a4f2a"); px(287, 157, 3, 4, "#7a4f2a");
    Pixel.text(ctx, S.dogWake > 0 ? "VUF?" : (Math.floor(performance.now() / 700) % 2 ? "Z" : "Z Z"), 294, 139, C.dim);
    const hoverSlot = S.phase === "prep" && mouse.inside ? slotAt(mouse.x, mouse.y) : -1;
    for (let k = 0; k < SLOTS.length; k++) if (S.cannons[k] && (S.phase === "prep" || S.help)) ring(k, .1);
    if (hoverSlot >= 0) ring(hoverSlot, .3);
    for (let k = 0; k < SLOTS.length; k++) cannonSprite(k, k === hoverSlot);
    const tgt = S.phase === "wave" ? target() : null;
    for (let i = S.robots.length - 1; i >= 0; i--) {               // the front robot is drawn last, on top
      const r = S.robots[i]; if (r.d < -10 || r.n <= 1) continue;
      const [x, y] = robotSprite(r);
      if (r === tgt) { ctx.strokeStyle = C.warn; ctx.strokeRect(Math.round(x - r.w / 2 - 2) + .5, Math.round(y - r.h / 2 - 2) + .5, r.w + 3, r.h + 3); }
    }
    if (S.help && tgt) {                                           // the hint when the maths is hard: the factors of the robot aimed at
      const f = factors(tgt.n), [x, y] = along(tgt.d);
      if (f) { const s = `${tgt.n}=${f.join("·")}`, w = Pixel.width(s), lx = clamp(x, w / 2 + 3, W - w / 2 - 3);
        px(lx - w / 2 - 2, y + tgt.h / 2 + 3, w + 4, 9, C.ink); Pixel.text(ctx, s, lx, y + tgt.h / 2 + 5, C.warn, 1, "center"); }
    }
    for (const s of S.shots) { px(s.x - 2, s.y - 2, 5, 5, C.ink); px(s.x - 1, s.y - 1, 3, 3, C[s.p]); }
    for (const f of S.fx) {
      ctx.globalAlpha = Math.min(1, Math.max(0, f.t / f.t0) * 2);
      if (f.kind === "dot") px(f.x, f.y, 2, 2, f.colour);
      else if (f.kind === "zap") { ctx.strokeStyle = f.colour; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); }
      else label(f.text, Math.round(f.x), Math.round(f.y), f.colour);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // top bar
    px(0, 0, W, 10, "rgba(5,10,14,.85)");
    Pixel.text(ctx, `BØLGE ${Math.min(S.wave + (S.phase === "prep" ? 1 : 0), WAVES)}/${WAVES}`, 3, 3, C.text);
    Pixel.text(ctx, `LIV ${S.lives}`, 72, 3, S.lives <= 3 ? C.bad : C.text);
    Pixel.text(ctx, `MØNTER ${S.coins}`, 112, 3, C.gold);
    if (S.streak >= 3) Pixel.text(ctx, `${S.streak} I TRÆK`, 176, 3, C[2]);
    Pixel.text(ctx, `POINT ${S.score}`, W - 3, 3, C.good, 1, "right");
    if (S.lock > 0) { px(GUN[0] - 9, GUN[1] + 8, 18, 3, C.ink); px(GUN[0] - 8, GUN[1] + 9, Math.round(16 * S.lock / LOCK), 1, C.bad); label("LÅST", GUN[0], GUN[1] + 13, C.bad); }
    if (S.phase === "prep") {
      px(0, H - 22, W, 22, "rgba(5,10,14,.9)");
      Pixel.text(ctx, "NÆSTE: " + S.next.join(" ") + (S.wave + 1 === WAVES ? " + BOSS" : ""), 3, H - 19, C.text);
      const k = hoverSlot, p = k >= 0 ? S.cannons[k] : 0;
      const tip = k < 0 ? `KLIK EN KURV: KANON (${price()} MØNTER). KLIK IGEN: SKIFT PRIMTAL. START: MELLEMRUM`
        : p ? `${p} GÅR OP I ${divides(p)} AF DE ${S.next.length} TAL. KLIK: ${p === 7 ? "SÆLG KANONEN" : "SKIFT TIL " + PRIMES[PRIMES.indexOf(p) + 1]}`
        : `EN KANON HER KOSTER ${price()} MØNTER. DEN DELER SELV MED SIT PRIMTAL`;
      Pixel.text(ctx, tip, 3, H - 10, k < 0 ? C.dim : C.warn);
    }
    if (S.msgT > 0 && S.phase !== "over") { const m = S.msg, y = S.phase === "prep" ? H - 35 : 13; px(W / 2 - Pixel.width(m) / 2 - 4, y, Pixel.width(m) + 8, 10, "rgba(5,10,14,.85)"); Pixel.text(ctx, m, W / 2, y + 3, C.warn, 1, "center"); }
    if (S.phase === "over") {
      px(36, 34, 248, 114, "rgba(5,10,14,.94)");
      const n = S.stats.right + S.stats.wrong;
      Pixel.text(ctx, S.won ? "SEJR! SKÅLEN ER REDDET" : "SNACKSENE ER VÆK", W / 2, 44, S.won ? C.good : C.bad, 2, "center");
      Pixel.text(ctx, S.line, W / 2, 62, C.dim, 1, "center");
      Pixel.text(ctx, `BØLGER: ${S.won ? WAVES : S.wave - 1} AF ${WAVES}`, W / 2, 78, C.text, 1, "center");
      Pixel.text(ctx, `RIGTIGE SKUD: ${S.stats.right} AF ${n} (${n ? Math.round(100 * S.stats.right / n) : 0} %)`, W / 2, 89, C.text, 1, "center");
      Pixel.text(ctx, `LÆNGSTE RÆKKE: ${S.best} I TRÆK`, W / 2, 100, C.text, 1, "center");
      Pixel.text(ctx, `POINT: ${S.score}`, W / 2, 114, C.good, 2, "center");
      Pixel.text(ctx, Leader.asking() ? "NY PLADS PÅ TOPLISTEN: SKRIV ET KALDENAVN UNDER SPILLET" : "SPIL IGEN: MELLEMRUM", W / 2, 134, C.warn, 1, "center");
    }
    // the button under the canvas follows the phase (only touched when something changes)
    const t = S.phase === "over" ? "Spil igen" : "Start bølge", off = S.phase === "wave";
    if (t !== goText) goBtn.textContent = goText = t;
    if (off !== goOff) goBtn.disabled = goOff = off;
  }

  Progress.ready.then(() => { if (S.phase === "prep" && S.wave === 0 && !Leader.friend()) { S.lv = savedLevel(); S.next = waveNumbers(S.lv, weakest(), 1); } });
  newRun();
  Leader.render(document.getElementById("top"), GAME);
  // ticking "a friend is playing" before the first wave starts the run over at the friend's level
  document.getElementById("friend").addEventListener("change", () => { if (S.wave === 0) newRun(); });
  Pixel.loop(update, draw);
})();
