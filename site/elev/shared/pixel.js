// A tiny kit for the pixel-style games: a low-resolution canvas scaled up sharply, an own 3×5 pixel font,
// a fixed-step game loop, mouse and touch in game coordinates, and small beeps made with Web Audio (no sound files).
//
//   const g = Pixel.screen(canvas, 320, 180)      -> { ctx, W, H, mouse: {x, y, down}, onClick(fn) }
//   Pixel.text(ctx, "HEJ 42", x, y, colour, size = 1, align = "left")
//   Pixel.loop(update(dt), draw())                 update at 60 steps a second, draw every frame
//   Pixel.sfx("hit" | "miss" | "pop" | "zap" | "lose" | "win")   short sounds; Pixel.muted toggles them
const Pixel = (() => {
  // ---- the font: each glyph is 3 wide and 5 high, rows top to bottom as 3-bit numbers ----
  const G = {
    "0": [7, 5, 5, 5, 7], "1": [2, 6, 2, 2, 7], "2": [7, 1, 7, 4, 7], "3": [7, 1, 3, 1, 7], "4": [5, 5, 7, 1, 1],
    "5": [7, 4, 7, 1, 7], "6": [7, 4, 7, 5, 7], "7": [7, 1, 2, 2, 2], "8": [7, 5, 7, 5, 7], "9": [7, 5, 7, 1, 7],
    A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4],
    G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7],
    M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5], O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4], Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5],
    S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7], V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5],
    Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7], "Æ": [3, 6, 7, 6, 7], "Ø": [3, 5, 7, 5, 6], "Å": [2, 0, 7, 5, 5],
    ":": [0, 2, 0, 2, 0], ".": [0, 0, 0, 0, 2], ",": [0, 0, 0, 2, 4], "!": [2, 2, 2, 0, 2], "?": [6, 1, 2, 0, 2],
    "-": [0, 0, 7, 0, 0], "+": [0, 2, 7, 2, 0], "·": [0, 0, 2, 0, 0], "×": [0, 5, 2, 5, 0], "/": [1, 1, 2, 4, 4],
    "%": [5, 1, 2, 4, 5], "°": [7, 5, 7, 0, 0], "(": [1, 2, 2, 2, 1], ")": [4, 2, 2, 2, 4], "=": [0, 7, 0, 7, 0],
    "<": [1, 2, 4, 2, 1], ">": [4, 2, 1, 2, 4], "'": [2, 2, 0, 0, 0], " ": [0, 0, 0, 0, 0],
  };
  const width = (s, size = 1) => String(s).length * 4 * size - size;
  function text(ctx, s, x, y, colour, size = 1, align = "left") {
    s = String(s).toUpperCase();
    if (align === "center") x -= Math.floor(width(s, size) / 2); else if (align === "right") x -= width(s, size);
    ctx.fillStyle = colour;
    for (const ch of s) {
      const g = G[ch] || G["?"];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r] & (4 >> c)) ctx.fillRect(Math.round(x + c * size), Math.round(y + r * size), size, size);
      x += 4 * size;
    }
  }

  // ---- screen: the canvas has the game's own small size; CSS scales it up without smoothing ----
  function screen(canvas, W, H) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const mouse = { x: -99, y: -99, down: false, inside: false };
    const toGame = e => { const r = canvas.getBoundingClientRect(), p = e.touches ? e.touches[0] || e.changedTouches[0] : e;
      return [(p.clientX - r.left) / r.width * W, (p.clientY - r.top) / r.height * H]; };
    const clicks = [];
    canvas.addEventListener("pointermove", e => { [mouse.x, mouse.y] = toGame(e); mouse.inside = true; });
    canvas.addEventListener("pointerleave", () => { mouse.inside = false; });
    canvas.addEventListener("pointerdown", e => { [mouse.x, mouse.y] = toGame(e); mouse.down = true; clicks.forEach(f => f(mouse.x, mouse.y, e)); });
    window.addEventListener("pointerup", () => { mouse.down = false; });
    canvas.addEventListener("wheel", e => { wheel.forEach(f => f(Math.sign(e.deltaY), e)); e.preventDefault(); }, { passive: false });
    const wheel = [];
    return { ctx, W, H, mouse, onClick: f => clicks.push(f), onWheel: f => wheel.push(f) };
  }

  // ---- loop: fixed 60 Hz steps, so the game behaves the same on fast and slow laptops ----
  function loop(update, draw) {
    let last = performance.now(), acc = 0, running = true;
    const step = 1 / 60;
    function frame(now) {
      if (!running) return;
      acc += Math.min(0.25, (now - last) / 1000); last = now;
      while (acc >= step) { update(step); acc -= step; }
      draw();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return { stop: () => { running = false; } };
  }

  // ---- sounds: a few blips; nothing plays before the first click (browsers require that anyway) ----
  let ac = null;
  const api = { muted: false };
  const SFX = { hit: [[660, .06, "square"], [990, .06, "square"]], miss: [[180, .12, "sawtooth"]], pop: [[300, .05, "square"], [140, .1, "triangle"]],
                zap: [[880, .04, "square"]], lose: [[300, .15, "triangle"], [200, .2, "triangle"], [120, .3, "triangle"]],
                win: [[523, .1, "square"], [659, .1, "square"], [784, .2, "square"]], click: [[440, .03, "square"]] };
  function sfx(name) {
    if (api.muted || !SFX[name]) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      let t = ac.currentTime;
      for (const [f, d, type] of SFX[name]) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d); t += d;
      }
    } catch { /* no sound available: play on silently */ }
  }
  return Object.assign(api, { screen, text, width, loop, sfx });
})();
