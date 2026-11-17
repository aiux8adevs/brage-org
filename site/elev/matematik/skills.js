// The topics of the exam part without aids (FP9), each with a task generator at three levels:
// 1 = getting started, 2 = typical exam task, 3 = the harder end of the exam. All numbers are chosen so the task can
// be done with pencil and paper. Every task has a short worked solution.
//
//   SKILLS[i] = { id, area, name, gen(level) -> { q, spec, sol, fig?, hint? } }
//   q, sol and fig are HTML (fractions as stacked spans, figures as inline SVG); spec is read by check.js.
const MathSkills = (() => {
  // the random source: Math.random, or a seeded one so a timed test can be rebuilt exactly after a reload
  let rnd = Math.random;
  const seeded = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const withSeed = (seed, fn) => { rnd = seeded(seed); try { return fn(); } finally { rnd = Math.random; } };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = a => a[Math.floor(rnd() * a.length)];
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const dk = n => {                                                   // Danish number: 1.234,5
    const r = Math.round(n * 1e6) / 1e6, [i, d] = String(Math.abs(r)).split(".");
    return (r < 0 ? "−" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (d ? "," + d : "");
  };
  const show = v => (typeof v === "number" ? dk(v) : v);
  const F = (a, b) => `<span class="fr"><span>${show(a)}</span><span>${show(b)}</span></span>`;   // stacked fraction
  const Fr = (a, b) => { const g = gcd(a, b) * (b < 0 ? -1 : 1); return b / g === 1 ? dk(a / g) : F(a / g, b / g); };
  const num = (v, tol) => ({ kind: "num", v, tol });
  const expr = f => ({ kind: "expr", f, vars: ["x"] });
  const isPrime = n => { if (n < 2) return false; for (let k = 2; k * k <= n; k++) if (n % k === 0) return false; return true; };
  const sgn = n => (n < 0 ? `(${dk(n)})` : dk(n));
  const HINT_FRAC = "Svar som brøk, decimaltal eller blandet tal, fx 3/4, 0,75 eller 1 1/2.";
  const HINT_PI = "Du må skrive π (fx 9π) eller regne med 3,14.";
  const HINT_EXPR = "Skriv et udtryk med x, fx 5x+3.";

  // ---------- figures (inline SVG; colours come from the page's CSS) ----------
  const svg = (w, h, body) => `<svg class="fig" viewBox="0 0 ${w} ${h}" role="img">${body}</svg>`;
  const txt = (x, y, s, cls = "") => `<text x="${x}" y="${y}" class="${cls}">${s}</text>`;
  function triangleFig(angA, angB, labels) {                         // drawn true to the two base angles (degrees)
    const r = d => d * Math.PI / 180, L = 1, t = L * Math.sin(r(angB)) / Math.sin(r(angA + angB));
    const P = [[0, 0], [L, 0], [t * Math.cos(r(angA)), t * Math.sin(r(angA))]];
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]), x0 = Math.min(...xs), w = Math.max(...xs) - x0, h = Math.max(...ys);
    const k = Math.min(220 / w, 120 / h), pts = P.map(([x, y]) => [20 + (x - x0) * k, 150 - y * k]);
    const cx = pts.reduce((a, p) => a + p[0], 0) / 3, cy = pts.reduce((a, p) => a + p[1], 0) / 3;
    return svg(260, 170, `<polygon points="${pts.map(p => p.join(",")).join(" ")}" class="shape"/>` +
      pts.map((p, n) => labels[n] ? txt(p[0] + (cx - p[0]) * 0.3 - 10, p[1] + (cy - p[1]) * 0.3 + 5, labels[n], "lab") : "").join(""));
  }
  function rightTriangleFig(a, b, c) {                                  // legs a (down), b (across), hypotenuse c
    return svg(260, 170, `<polygon points="40,20 40,140 220,140" class="shape"/><rect x="40" y="128" width="12" height="12" class="mark"/>` +
      txt(18, 85, a, "lab") + txt(125, 162, b, "lab") + txt(140, 72, c, "lab"));
  }
  function crossFig(v) {                                                 // two lines crossing at angle v (right side)
    const c = [130, 80], r = 115, a1 = (v / 2) * Math.PI / 180, a2 = -a1;
    const end = (a, sgn) => [c[0] + sgn * r * Math.cos(a), c[1] - sgn * r * Math.sin(a)];
    const [p1, q1, p2, q2] = [end(a1, 1), end(a1, -1), end(a2, 1), end(a2, -1)];
    return svg(260, 160, `<line x1="${q1[0]}" y1="${q1[1]}" x2="${p1[0]}" y2="${p1[1]}" class="line"/><line x1="${q2[0]}" y1="${q2[1]}" x2="${p2[0]}" y2="${p2[1]}" class="line"/>` +
      txt(c[0] + 34, c[1] + 6, `${v}°`, "lab") + txt(c[0] - 5, c[1] - 26, "x", "lab q"));
  }
  function rectFig(w, h, lw, lh) {
    return svg(260, 160, `<rect x="40" y="30" width="180" height="100" class="shape"/>` + txt(118, 150, lw, "lab") + txt(226, 86, lh, "lab"));
  }
  function lShapeFig(W, H, w, h) {                                       // L-shape: W×H with a w×h corner cut away (not to scale)
    return svg(300, 180, `<polygon points="60,25 170,25 170,80 240,80 240,150 60,150" class="shape"/>` +
      txt(95, 18, `${dk(W - w)} cm`, "lab") + txt(130, 172, `${dk(W)} cm`, "lab") + txt(4, 92, `${dk(H)} cm`, "lab") +
      txt(246, 120, `${dk(H - h)} cm`, "lab"));
  }
  function boxFig(mn, q1, md, q3, mx, lo, hi) {
    const X = v => 20 + (v - lo) / (hi - lo) * 220;
    let ticks = "";
    for (let v = lo; v <= hi; v += (hi - lo) / 10) ticks += `<line x1="${X(v)}" y1="112" x2="${X(v)}" y2="118" class="line"/>` + txt(X(v) - 6, 132, dk(v), "tick");
    return svg(260, 140, `<line x1="20" y1="115" x2="240" y2="115" class="line"/>${ticks}` +
      `<line x1="${X(mn)}" y1="60" x2="${X(q1)}" y2="60" class="line"/><line x1="${X(q3)}" y1="60" x2="${X(mx)}" y2="60" class="line"/>` +
      `<rect x="${X(q1)}" y="40" width="${X(q3) - X(q1)}" height="40" class="shape"/><line x1="${X(md)}" y1="40" x2="${X(md)}" y2="80" class="line strong"/>` +
      `<line x1="${X(mn)}" y1="50" x2="${X(mn)}" y2="70" class="line"/><line x1="${X(mx)}" y1="50" x2="${X(mx)}" y2="70" class="line"/>`);
  }

  const S = [];
  const add = (id, area, name, gen) => S.push({ id, area, name, gen });

  // ================= Tal og regnestrategier =================
  add("brok-plus", "tal", "Plus og minus med brøker", lv => {
    if (lv === 1) { const n = ri(3, 9), a = ri(1, n - 2), b = ri(1, n - a - 1);
      return { q: `Udregn ${F(a, n)} + ${F(b, n)}`, spec: num((a + b) / n), hint: HINT_FRAC, traps: [[(a + b) / (2 * n), "Det ligner, at du har lagt nævnerne sammen. Nævneren bliver stående."]], sol: `Samme nævner: læg tællerne sammen. ${F(a + b, n)}` }; }
    if (lv === 2) { const [n, m] = pick([[2, 3], [3, 4], [4, 6], [2, 5], [3, 6], [4, 5], [6, 8]]), a = ri(1, n - 1), b = ri(1, m - 1), minus = rnd() < 0.4 && a / n > b / m;
      const v = minus ? a / n - b / m : a / n + b / m, l = n * m / gcd(n, m);
      return { q: `Udregn ${F(a, n)} ${minus ? "−" : "+"} ${F(b, m)}`, spec: num(v), hint: HINT_FRAC,
        traps: [[minus ? (a - b) / (n - m) : (a + b) / (n + m), "Det ligner, at du har regnet tæller med tæller og nævner med nævner. Gør nævnerne ens først."]],
        sol: `Fællesnævner ${l}: ${F(a * l / n, l)} ${minus ? "−" : "+"} ${F(b * l / m, l)} = ${Fr(Math.round(v * l), l)}` }; }
    const w = ri(1, 3), [n, m] = pick([[2, 3], [3, 4], [4, 6], [2, 5]]), a = ri(1, n - 1), b = ri(1, m - 1), l = n * m / gcd(n, m);
    const v = w + a / n - b / m;
    return { q: `Udregn ${w} ${F(a, n)} − ${F(b, m)}`, spec: num(v), hint: HINT_FRAC,
      sol: `${w} ${F(a, n)} = ${F(w * n + a, n)}. Fællesnævner ${l}: ${F((w * n + a) * l / n, l)} − ${F(b * l / m, l)} = ${Fr(Math.round(v * l), l)}` };
  });
  add("brok-gange", "tal", "Gange og dividere med brøker", lv => {
    if (lv === 1) { const n = pick([2, 3, 4, 5]), a = ri(1, n - 1), k = n * ri(1, 6);
      return { q: `Udregn ${F(a, n)} · ${k}`, spec: num(a * k / n), hint: HINT_FRAC, sol: `${F(a, n)} af ${k}: ${k} : ${n} = ${k / n}, gange ${a} = ${a * k / n}` }; }
    if (lv === 2) { const a = ri(1, 5), n = ri(a + 1, 8), b = ri(1, 5), m = ri(b + 1, 8);
      return { q: `Udregn ${F(a, n)} · ${F(b, m)}`, spec: num(a * b / (n * m)), hint: HINT_FRAC, sol: `Tæller gange tæller og nævner gange nævner: ${F(a * b, n * m)}` }; }
    const a = ri(1, 5), n = ri(a + 1, 8), b = ri(1, 5), m = ri(b + 1, 8);
    return { q: `Udregn ${F(a, n)} : ${F(b, m)}`, spec: num(a / n / (b / m)), hint: HINT_FRAC, traps: [[a * b / (n * m), "Du har ganget brøkerne. Ved division ganger man med den omvendte brøk."]],
      sol: `Dividere med en brøk er at gange med den omvendte: ${F(a, n)} · ${F(m, b)} = ${F(a * m, n * b)}` };
  });
  add("omskriv", "tal", "Brøk, decimaltal og procent", lv => {
    if (lv === 1) { const [a, b] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [1, 10], [3, 10]]);
      return pick([{ q: `Skriv ${F(a, b)} som decimaltal.`, spec: num(a / b), sol: `${a} : ${b} = ${dk(a / b)}` },
                   { q: `Skriv ${F(a, b)} i procent.`, spec: num(100 * a / b), hint: "Skriv tallet, fx 25 eller 25 %.", traps: [[a / b, "Det er decimaltallet. Gang med 100 for at få procent."]], sol: `${F(a, b)} = ${dk(a / b)} = ${dk(100 * a / b)} %` }]); }
    if (lv === 2) { const b = pick([20, 25, 50, 8]), a = ri(1, b - 1);
      return { q: `Skriv ${F(a, b)} i procent.`, spec: num(100 * a / b), hint: "Skriv tallet, fx 35 eller 35 %.", traps: [[a / b, "Det er decimaltallet. Gang med 100 for at få procent."]], sol: `Forlæng til nævner 100 (eller divider): ${dk(100 * a / b)} %` }; }
    const p = pick([5, 12.5, 15, 35, 40, 60, 75, 2.5, 120]);
    return pick([{ q: `Skriv ${dk(p)} % som brøk.`, spec: num(p / 100), hint: HINT_FRAC, sol: `${dk(p)} % = ${F(p, 100)} = ${dk(p / 100)}` },
                 { q: `Skriv ${dk(p)} % som decimaltal.`, spec: num(p / 100), sol: `Divider med 100: ${dk(p / 100)}` }]);
  });
  add("procent", "tal", "Procent", lv => {
    if (lv === 1) { const p = pick([10, 25, 50, 20]), y = p === 25 ? 4 * ri(3, 40) : 10 * ri(2, 30);
      return { q: `Hvad er ${p} % af ${dk(y)}?`, spec: num(p * y / 100), sol: `${p} % = ${Fr(p, 100)}, så ${dk(y)} · ${Fr(p, 100)} = ${dk(p * y / 100)}` }; }
    if (lv === 2) { if (rnd() < 0.5) { const p = pick([5, 15, 30, 35, 45, 60]), y = 20 * ri(2, 25);
        return { q: `Hvad er ${p} % af ${dk(y)}?`, spec: num(p * y / 100), sol: `1 % af ${dk(y)} er ${dk(y / 100)}, så ${p} % er ${dk(p * y / 100)}` }; }
      const whole = pick([20, 40, 50, 80, 200, 25]), part = whole * pick([0.1, 0.2, 0.25, 0.4, 0.75, 0.15]);
      return { q: `Hvor mange procent er ${dk(part)} af ${dk(whole)}?`, spec: num(100 * part / whole), hint: "Skriv tallet, fx 25.", traps: [[part / whole, "Det er decimaltallet. Gang med 100 for at få procent."]], sol: `${F(part, whole)} = ${dk(part / whole)} = ${dk(100 * part / whole)} %` }; }
    if (rnd() < 0.5) { const old = pick([40, 50, 80, 200, 250, 400]), p = pick([10, 20, 25, 50]), up = rnd() < 0.5, nw = old * (1 + (up ? p : -p) / 100);
      return { q: `En pris går fra ${dk(old)} kr. til ${dk(nw)} kr. Hvor mange procent er ${up ? "stigningen" : "faldet"}?`, spec: num(p), hint: "Skriv tallet, fx 20.",
        traps: [[100 * Math.abs(nw - old) / nw, "Du har regnet i forhold til den nye pris. En ændring regnes i forhold til den oprindelige."], [Math.abs(nw - old), "Det er ændringen i kroner. Spørgsmålet er i procent."]],
        sol: `Ændring ${dk(Math.abs(nw - old))} kr. ud af ${dk(old)} kr.: ${F(Math.abs(nw - old), old)} = ${p} %` }; }
    const price = pick([80, 120, 200, 240, 360, 450]), p = pick([10, 20, 25, 30]);
    return { q: `En jakke koster ${dk(price)} kr. Den sættes ned med ${p} %. Hvad koster den nu?`, spec: num(price * (1 - p / 100)), hint: "Svar i kr.", traps: [[price * p / 100, "Det er rabatten. Træk den fra den gamle pris."]],
      sol: `${p} % af ${dk(price)} = ${dk(price * p / 100)} kr. ${dk(price)} − ${dk(price * p / 100)} = ${dk(price * (1 - p / 100))} kr.` };
  });
  add("negative", "tal", "Negative tal", lv => {
    if (lv === 1) { const a = ri(-12, 12), b = ri(-12, 12), op = pick(["+", "−"]);
      return { q: `Udregn ${dk(a)} ${op} ${sgn(b)}`, spec: num(op === "+" ? a + b : a - b), traps: [[-(op === "+" ? a + b : a - b), "Tallet er rigtigt, men fortegnet er forkert."]], sol: `${dk(a)} ${op} ${sgn(b)} = ${dk(op === "+" ? a + b : a - b)}` }; }
    if (lv === 2) { const a = ri(-9, 9) || -3, b = ri(-9, 9) || 4;
      if (rnd() < 0.5) return { q: `Udregn ${dk(a)} · ${sgn(b)}`, spec: num(a * b), traps: [[-a * b, "Tallet er rigtigt, men fortegnet er forkert."]], sol: `Fortegn: ${a * b < 0 ? "minus gange plus giver minus" : "samme fortegn giver plus"}. ${dk(a * b)}` };
      return { q: `Udregn ${dk(a * b)} : ${sgn(b)}`, spec: num(a), sol: `${dk(a * b)} : ${sgn(b)} = ${dk(a)}` }; }
    const a = ri(-6, -1), b = ri(2, 6), c = ri(-5, 5) || 2;
    return { q: `Udregn ${dk(a)} · (${b} − ${sgn(c)}) + ${sgn(c)}`, spec: num(a * (b - c) + c), sol: `Parentesen først: ${b} − ${sgn(c)} = ${b - c}. ${dk(a)} · ${b - c} = ${dk(a * (b - c))}, plus ${sgn(c)} = ${dk(a * (b - c) + c)}` };
  });
  add("hierarki", "tal", "Regnearternes rækkefølge", lv => {
    if (lv === 1) { const a = ri(2, 20), b = ri(2, 9), c = ri(2, 9);
      return { q: `Udregn ${a} + ${b} · ${c}`, spec: num(a + b * c), traps: [[(a + b) * c, "Du har regnet fra venstre mod højre. Gange kommer før plus."]], sol: `Gange før plus: ${b} · ${c} = ${b * c}, plus ${a} = ${a + b * c}` }; }
    if (lv === 2) { const a = ri(2, 9), b = ri(2, 9), c = ri(2, 5), e = ri(2, 6), d = e * ri(2, 6);
      return { q: `Udregn (${a} + ${b}) · ${c} − ${d} : ${e}`, spec: num((a + b) * c - d / e), sol: `Parentes: ${a + b}. Gange og dividere: ${(a + b) * c} og ${d / e}. Til sidst: ${(a + b) * c} − ${d / e} = ${(a + b) * c - d / e}` }; }
    const a = ri(2, 4), b = a === 2 ? pick([3, 4]) : 2, p = a ** b, d = pick([2, a]), c = ri(2, 9), e = ri(5, 9), g = ri(1, 4);
    return { q: `Udregn ${c} + ${a}<sup>${b}</sup> : ${d} − (${e} − ${g})`, spec: num(c + p / d - (e - g)),
      sol: `Parentes: ${e} − ${g} = ${e - g}. Potens: ${a}<sup>${b}</sup> = ${p}. Dividere: ${p} : ${d} = ${p / d}. Til sidst: ${c} + ${p / d} − ${e - g} = ${c + p / d - (e - g)}` };
  });
  add("potens", "tal", "Potenser og kvadratrødder", lv => {
    if (lv === 1) { if (rnd() < 0.5) { const a = ri(2, 12); return { q: `Udregn √${a * a}`, spec: num(a), sol: `${a} · ${a} = ${a * a}, så √${a * a} = ${a}` }; }
      const a = ri(2, 9), n = pick([2, 2, 3]); return { q: `Udregn ${a}<sup>${n}</sup>`, spec: num(a ** n), traps: [[a * n, `${a}<sup>${n}</sup> er ${a} ganget med sig selv ${n} gange, ikke ${a} · ${n}.`]], sol: `${Array(n).fill(a).join(" · ")} = ${a ** n}` }; }
    if (lv === 2) { return pick([
      (() => { const n = ri(3, 7); return { q: `Udregn 2<sup>${n}</sup>`, spec: num(2 ** n), sol: `Fordobl ${n} gange: ${2 ** n}` }; })(),
      (() => { const n = ri(2, 6); return { q: `Skriv 10<sup>${n}</sup> som et tal.`, spec: num(10 ** n), sol: `1 med ${n} nuller: ${dk(10 ** n)}` }; })(),
      (() => { const a = ri(2, 5); return { q: `Udregn (−${a})<sup>2</sup>`, spec: num(a * a), sol: `(−${a}) · (−${a}) = ${a * a}` }; })(),
      (() => { const m = ri(1, 9) + pick([0, 0.2, 0.5]), n = ri(2, 5); return { q: `Skriv ${dk(m)} · 10<sup>${n}</sup> som et tal.`, spec: num(m * 10 ** n), sol: `Flyt kommaet ${n} pladser til højre: ${dk(m * 10 ** n)}` }; })()]); }
    return pick([
      (() => { const a = pick([2, 3, 5, 10]), m = ri(2, 5), n = ri(2, 5); return { q: `${a}<sup>${m}</sup> · ${a}<sup>${n}</sup> = ${a}<sup>?</sup>. Hvad er eksponenten?`, spec: num(m + n), sol: `Samme grundtal: læg eksponenterne sammen, ${m} + ${n} = ${m + n}` }; })(),
      (() => { const n = ri(1, 3); return { q: `Skriv 10<sup>−${n}</sup> som decimaltal.`, spec: num(10 ** -n), sol: `${F(1, 10 ** n)} = ${dk(10 ** -n)}` }; })(),
      (() => { const a = ri(2, 9), b = ri(2, 9); return { q: `Udregn √${a * a} + √${b * b}`, spec: num(a + b), sol: `${a} + ${b} = ${a + b}` }; })(),
      (() => { const v = ri(2, 9) * 1000 + ri(1, 9) * 100; return { q: `${dk(v)} = a · 10<sup>3</sup>. Hvad er a?`, spec: num(v / 1000), sol: `Divider med 1.000: ${dk(v / 1000)}` }; })()]);
  });
  add("forhold", "tal", "Forhold", lv => {
    if (lv === 1) { const a = 1, b = ri(2, 4), t = (a + b) * ri(3, 12);
      return { q: `${t} kr. deles i forholdet ${a} : ${b}. Hvor meget er den største del?`, spec: num(t * b / (a + b)), hint: "Svar i kr.", sol: `${a + b} dele i alt. Én del er ${t / (a + b)} kr., ${b} dele er ${t * b / (a + b)} kr.` }; }
    if (lv === 2) { const p = pick([2, 4]), q = pick([3, 6, 8]), g = 50 * ri(2, 8);
      return { q: `En opskrift til ${p} personer bruger ${g} g mel. Hvor meget mel skal der bruges til ${q} personer?`, spec: num(g * q / p), hint: "Svar i gram.", sol: `${g} : ${p} = ${g / p} g pr. person. ${g / p} · ${q} = ${g * q / p} g` }; }
    const a = ri(2, 4), b = ri(a + 1, 7), k = ri(3, 10);
    return { q: `Drenge og piger i en klub er i forholdet ${a} : ${b}. Der er ${b * k} piger. Hvor mange er der i alt?`, spec: num((a + b) * k), sol: `${b} dele = ${b * k}, så én del er ${k}. I alt ${a + b} dele = ${(a + b) * k}` };
  });
  add("primtal", "tal", "Primtal og faktorer", lv => {
    if (lv === 1) { const ps = [2, 3, 5, 7, 11, 13], n = pick([[2, 3, 5], [2, 2, 7], [3, 3, 5], [2, 5, 7], [2, 3, 11]]).reduce((a, b) => a * b, 1);
      let f = n, big = 1; for (const p of ps) while (f % p === 0) { f /= p; big = p; }
      return { q: `Hvad er den største primfaktor i ${n}?`, spec: num(big), sol: `Del op: ${n} = ${factor(n)}. Den største er ${big}.` }; }
    if (lv === 2 || lv === 3) { const n = lv === 2 ? pick([12, 18, 20, 28, 30, 36, 42, 45, 50]) : pick([60, 72, 84, 90, 96, 126, 150, 180]);
      return { q: `Skriv ${n} som et produkt af primtal.`, hint: "Skriv fx 2*2*3 eller 2^2*3.", ans: factor(n),
        spec: { kind: "test", test: s => { const parts = s.replace(/\s/g, "").split("*"); let prod = 1;
          for (const p of parts) { const m = p.match(/^(\d+)(\^(\d+))?$/); if (!m || !isPrime(+m[1])) return false; prod *= (+m[1]) ** (m[3] ? +m[3] : 1); }
          return prod === n; } },
        sol: `${n} = ${factor(n)}` }; }
  });
  function factor(n) { const out = []; for (let p = 2; n > 1; p++) while (n % p === 0) { out.push(p); n /= p; } return out.join(" · "); }

  // ================= Algebra =================
  add("indsaet", "algebra", "Indsæt i en formel", lv => {
    if (lv === 1) { const a = ri(2, 9), b = ri(1, 15), x = ri(2, 10);
      return { q: `Hvad er ${a}x + ${b}, når x = ${x}?`, spec: num(a * x + b), sol: `${a} · ${x} + ${b} = ${a * x + b}` }; }
    if (lv === 2) { const g = ri(3, 12) * 2, h = ri(2, 10);
      return { q: `Arealet af en trekant er A = ${F("g · h", 2)}. Hvad er A, når g = ${g} og h = ${h}?`, spec: num(g * h / 2), sol: `${g} · ${h} : 2 = ${g * h / 2}` }; }
    const x = -ri(1, 4), a = ri(2, 5);
    return { q: `Hvad er x<sup>2</sup> − ${a}x, når x = ${dk(x)}?`, spec: num(x * x - a * x), sol: `(${dk(x)})<sup>2</sup> − ${a} · (${dk(x)}) = ${x * x} + ${-a * x} = ${x * x - a * x}` };
  });
  add("reducer", "algebra", "Reducér udtryk", lv => {
    if (lv === 1) { const a = ri(2, 9), b = ri(2, 9), c = ri(1, a + b - 1);
      return { q: `Reducér ${a}x + ${b}x − ${c}x`, spec: expr(e => (a + b - c) * e.x), hint: HINT_EXPR, ans: `${a + b - c}x`, sol: `${a} + ${b} − ${c} = ${a + b - c}, så ${a + b - c}x` }; }
    if (lv === 2) { const a = ri(2, 5), b = ri(1, 8), c = ri(1, 6);
      return { q: `Reducér ${a}(x + ${b}) + ${c}x`, spec: expr(e => a * (e.x + b) + c * e.x), hint: HINT_EXPR, ans: `${a + c}x + ${a * b}`, sol: `Gang ind: ${a}x + ${a * b} + ${c}x = ${a + c}x + ${a * b}` }; }
    const a = ri(2, 5), b = ri(1, 5), c = ri(2, 4), d = ri(1, 6);
    return { q: `Reducér ${a}(${2}x − ${b}) − ${c}(x − ${d})`, spec: expr(e => a * (2 * e.x - b) - c * (e.x - d)), hint: HINT_EXPR,
      ans: `${2 * a - c}x ${c * d - a * b < 0 ? "−" : "+"} ${Math.abs(c * d - a * b)}`,
      sol: `${2 * a}x − ${a * b} − ${c}x + ${c * d} = ${2 * a - c}x ${c * d - a * b < 0 ? "−" : "+"} ${Math.abs(c * d - a * b)}` };
  });
  add("ligning", "algebra", "Løs ligninger", lv => {
    if (lv === 1) { const x = ri(2, 12), a = ri(2, 9);
      return pick([{ q: `Løs ligningen x + ${a} = ${x + a}`, spec: num(x), hint: "Skriv tallet x er lig med.", sol: `Træk ${a} fra på begge sider: x = ${x}` },
                   { q: `Løs ligningen ${a}x = ${a * x}`, spec: num(x), hint: "Skriv tallet x er lig med.", sol: `Divider med ${a} på begge sider: x = ${x}` }]); }
    if (lv === 2) { const x = ri(-4, 9), a = ri(3, 7), c = ri(1, a - 1), b = ri(-8, 12), d = (a - c) * x + b;
      return { q: `Løs ligningen ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${c === 1 ? "" : c}x ${d < 0 ? "−" : "+"} ${Math.abs(d)}`, spec: num(x), hint: "Skriv tallet x er lig med.",
        traps: [[-x, "Tjek fortegnet: når et tal flyttes over på den anden side, skifter det fortegn."]],
        sol: `Saml x på venstre side: ${a - c}x = ${d - b}. Divider med ${a - c}: x = ${x}` }; }
    const a = ri(2, 4), b = ri(1, 5), c = ri(1, a - 1), d = ri(1, 9), x = (d + a * b) / (a - c);
    return { q: `Løs ligningen ${a}(x − ${b}) = ${c === 1 ? "" : c}x + ${d}`, spec: num(x), hint: HINT_FRAC,
      sol: `Gang ind: ${a}x − ${a * b} = ${c === 1 ? "" : c}x + ${d}. ${a - c}x = ${d + a * b}. x = ${Fr(d + a * b, a - c)}` };
  });
  add("linfunk", "algebra", "Lineære funktioner", lv => {
    if (lv === 1) { const a = ri(-4, 6) || 2, b = ri(-5, 10), x = ri(1, 6);
      return { q: `f(x) = ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}. Hvad er f(${x})?`, spec: num(a * x + b), sol: `${a} · ${x} ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${a * x + b}` }; }
    if (lv === 2) { const a = ri(-3, 5) || 2, b = ri(-4, 8), x1 = ri(0, 3), x2 = x1 + ri(1, 3);
      return { q: `En ret linje går gennem punkterne (${x1}, ${a * x1 + b}) og (${x2}, ${a * x2 + b}). Hvad er hældningstallet?`, spec: num(a),
        sol: `Hældning = ${F("y₂ − y₁", "x₂ − x₁")} = ${F(a * (x2 - x1), x2 - x1)} = ${a}` }; }
    const a = ri(-3, 5) || 3, b = ri(-6, 9), xs = [0, 1, 2, 3];
    return { q: `Tabellen hører til en lineær funktion. Skriv forskriften.<table class="vt"><tr><th>x</th>${xs.map(x => `<td>${x}</td>`).join("")}</tr><tr><th>y</th>${xs.map(x => `<td>${dk(a * x + b)}</td>`).join("")}</tr></table>`,
      spec: expr(e => a * e.x + b), hint: "Skriv fx 2x+3 (eller y=2x+3 uden y=).", ans: `y = ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}`, sol: `Når x vokser 1, vokser y ${a}: hældning ${a}. Ved x = 0 er y = ${b}. y = ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}` };
  });
  add("vaekst", "algebra", "Vækst", lv => {
    if (lv === 1) { const s = ri(20, 80), d = ri(3, 12), n = ri(3, 8);
      return { q: `En plante er ${s} cm høj og vokser ${d} cm om ugen. Hvor høj er den efter ${n} uger?`, spec: num(s + d * n), hint: "Svar i cm.", sol: `Lineær vækst: ${s} + ${d} · ${n} = ${s + d * n} cm` }; }
    if (lv === 2) { const k = pick([1000, 2000, 500]), p = pick([10, 20]);
      return { q: `${dk(k)} kr. står på en konto med ${p} % rente om året. Hvor mange kroner står der efter 2 år?`, spec: num(k * (1 + p / 100) ** 2), hint: "Svar i kr.",
        sol: `Hvert år ganges med ${dk(1 + p / 100)}: ${dk(k)} · ${dk(1 + p / 100)} · ${dk(1 + p / 100)} = ${dk(k * (1 + p / 100) ** 2)} kr.` }; }
    const p = pick([4, 15, 20, 30, 2.5]), up = rnd() < 0.5;
    return { q: `En størrelse ${up ? "stiger" : "falder"} med ${dk(p)} % om året. Hvad er fremskrivningsfaktoren?`, spec: num(1 + (up ? p : -p) / 100),
      sol: `${up ? "1 + " : "1 − "}${dk(p / 100)} = ${dk(1 + (up ? p : -p) / 100)}` };
  });

  // ================= Geometri og måling =================
  add("vinkler", "geometri", "Vinkler", lv => {
    if (lv === 1) { const A = ri(30, 80), B = ri(30, 150 - A);
      return { q: `I en trekant er to af vinklerne ${A}° og ${B}°. Hvor stor er den tredje vinkel?`, spec: num(180 - A - B), hint: "Svar i grader.", traps: [[A + B, "Det er summen af de to vinkler. Træk den fra 180°."]],
        fig: triangleFig(A, B, [`${A}°`, `${B}°`, "?"]), sol: `Vinkelsummen er 180°: 180 − ${A} − ${B} = ${180 - A - B}°` }; }
    if (lv === 2) { const v = ri(35, 80);
      return pick([{ q: `To linjer krydser hinanden. Hvor stor er vinklen x?`, fig: crossFig(v), spec: num(180 - v), hint: "Svar i grader.", sol: `x og ${v}° ligger ved siden af hinanden på en ret linje (nabovinkler): 180 − ${v} = ${180 - v}°` },
                   { q: `En trekant er ligebenet. Topvinklen er ${2 * v - 60 > 20 ? 2 * v - 60 : 40}°. Hvor stor er hver af grundvinklerne?`, spec: num((180 - (2 * v - 60 > 20 ? 2 * v - 60 : 40)) / 2), hint: "Svar i grader.",
                     sol: `Grundvinklerne er lige store: (180 − ${2 * v - 60 > 20 ? 2 * v - 60 : 40}) : 2 = ${(180 - (2 * v - 60 > 20 ? 2 * v - 60 : 40)) / 2}°` }]); }
    const n = pick([5, 6, 8]);
    return { q: `Hvor stor er vinkelsummen i en ${n}-kant?`, spec: num((n - 2) * 180), hint: "Svar i grader.", sol: `En ${n}-kant kan deles i ${n - 2} trekanter: ${n - 2} · 180 = ${(n - 2) * 180}°` };
  });
  add("areal", "geometri", "Areal og omkreds", lv => {
    if (lv === 1) { const w = ri(3, 15), h = ri(2, 10), area = rnd() < 0.6;
      return { q: `Et rektangel er ${w} cm langt og ${h} cm bredt. Hvad er ${area ? "arealet" : "omkredsen"}?`, fig: rectFig(w, h, `${w} cm`, `${h} cm`),
        spec: num(area ? w * h : 2 * (w + h)), hint: area ? "Svar i cm²." : "Svar i cm.",
        traps: [[area ? 2 * (w + h) : w * h, area ? "Det er omkredsen. Arealet er længde · bredde." : "Det er arealet. Omkredsen er længden hele vejen rundt."], [w + h, "Det er kun to af siderne."]], sol: area ? `${w} · ${h} = ${w * h} cm²` : `2 · (${w} + ${h}) = ${2 * (w + h)} cm` }; }
    if (lv === 2) { const g = ri(4, 14), h = ri(3, 10), tri = rnd() < 0.5;
      return tri ? { traps: [[g * h, "Husk ½: en trekant er halvdelen af et rektangel."]], q: `En trekant har grundlinje ${g} cm og højde ${h} cm. Hvad er arealet?`, fig: triangleFig(ri(40, 75), ri(40, 70), ["", "", ""]), spec: num(g * h / 2), hint: "Svar i cm².", sol: `${F(1, 2)} · ${g} · ${h} = ${dk(g * h / 2)} cm²` }
                 : { q: `Et parallelogram har grundlinje ${g} cm og højde ${h} cm. Hvad er arealet?`, spec: num(g * h), hint: "Svar i cm².", sol: `Grundlinje gange højde: ${g * h} cm²` }; }
    if (rnd() < 0.5) { const W = ri(8, 14), H = ri(6, 10), w = ri(3, W - 3), h = ri(2, H - 3);
      return { q: `Figuren er et rektangel på ${W} cm × ${H} cm, hvor der er skåret et rektangel på ${w} cm × ${h} cm væk i hjørnet. Hvad er arealet?`, fig: lShapeFig(W, H, w, h), spec: num(W * H - w * h), hint: "Svar i cm².",
        sol: `Hele rektanglet minus hjørnet: ${W * H} − ${w * h} = ${W * H - w * h} cm²` }; }
    const a = ri(3, 8), b = a + ri(2, 6), h = 2 * ri(2, 5);
    return { q: `Et trapez har de parallelle sider ${a} cm og ${b} cm og højden ${h} cm. Hvad er arealet?`, spec: num((a + b) * h / 2), hint: "Svar i cm².", sol: `${F(1, 2)} · (${a} + ${b}) · ${h} = ${(a + b) * h / 2} cm²` };
  });
  add("cirkel", "geometri", "Cirkler", lv => {
    if (lv === 1) { const d = 2 * ri(2, 10);
      return { q: `En cirkel har diameteren ${d} cm. Hvad er omkredsen?`, spec: num(Math.PI * d, 0.01), hint: HINT_PI,
        traps: [[Math.PI * d / 2, "Du har brugt radius. Omkredsen er π · diameter."], [Math.PI * d * d / 4, "Det er arealet. Omkredsen er π · d."]], sol: `O = π · d = ${d}π ≈ ${dk(3.14 * d)} cm` }; }
    if (lv === 2) { const r = ri(2, 10);
      return { q: `En cirkel har radius ${r} cm. Hvad er arealet?`, spec: num(Math.PI * r * r, 0.01), hint: HINT_PI,
        traps: [[2 * Math.PI * r, "Det er omkredsen. Arealet er π · r²."], [Math.PI * 2 * r, "Det er omkredsen. Arealet er π · r²."], [Math.PI * 4 * r * r, "Du har brugt diameteren. Arealet er π · r², med radius."]], sol: `A = π · r² = π · ${r * r} = ${r * r}π ≈ ${dk(3.14 * r * r)} cm²` }; }
    const r = 2 * ri(1, 5);
    return { q: `En halvcirkel har diameteren ${2 * r} cm. Hvad er arealet?`, spec: num(Math.PI * r * r / 2, 0.01), hint: HINT_PI, sol: `Radius ${r}: π · ${r * r} : 2 = ${r * r / 2}π ≈ ${dk(3.14 * r * r / 2)} cm²` };
  });
  add("rumfang", "geometri", "Rumfang", lv => {
    if (lv === 1) { const l = ri(2, 10), b = ri(2, 8), h = ri(2, 6);
      return { q: `En kasse er ${l} cm lang, ${b} cm bred og ${h} cm høj. Hvad er rumfanget?`, spec: num(l * b * h), hint: "Svar i cm³.", sol: `${l} · ${b} · ${h} = ${l * b * h} cm³` }; }
    if (lv === 2) { const r = ri(1, 5), h = ri(2, 10);
      return { q: `En cylinder har radius ${r} cm og højde ${h} cm. Hvad er rumfanget?`, spec: num(Math.PI * r * r * h, 0.01), hint: HINT_PI, sol: `V = π · r² · h = π · ${r * r} · ${h} = ${r * r * h}π ≈ ${dk(3.14 * r * r * h)} cm³` }; }
    const l = 10 * ri(2, 6), b = 10 * ri(2, 4), h = 10 * ri(1, 3);
    return { q: `Et akvarium er ${l} cm langt, ${b} cm bredt og ${h} cm højt. Hvor mange liter kan det rumme?`, spec: num(l * b * h / 1000), hint: "Svar i liter.",
      sol: `${l} · ${b} · ${h} = ${dk(l * b * h)} cm³. 1 liter = 1.000 cm³, så ${dk(l * b * h / 1000)} liter` };
  });
  add("pythagoras", "geometri", "Pythagoras", lv => {
    const [a0, b0, c0] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]]);
    if (lv === 1) return { q: `En retvinklet trekant har kateterne ${a0} cm og ${b0} cm. Hvor lang er hypotenusen?`, fig: rightTriangleFig(`${a0}`, `${b0}`, "?"), spec: num(c0), hint: "Svar i cm.",
      traps: [[a0 + b0, "Siderne kan ikke bare lægges sammen. Brug a² + b² = c²."], [c0 * c0, "Det er c². Husk kvadratroden til sidst."]],
      sol: `c² = ${a0}² + ${b0}² = ${a0 * a0} + ${b0 * b0} = ${c0 * c0}, c = √${c0 * c0} = ${c0} cm` };
    if (lv === 2) return { q: `En retvinklet trekant har hypotenusen ${c0} cm og den ene katete ${a0} cm. Hvor lang er den anden katete?`, fig: rightTriangleFig(`${a0}`, "?", `${c0}`), spec: num(b0), hint: "Svar i cm.",
      traps: [[Math.sqrt(c0 * c0 + a0 * a0), "En katete findes med minus: b² = c² − a²."], [c0 - a0, "Siderne kan ikke bare trækkes fra hinanden. Brug b² = c² − a²."]],
      sol: `b² = ${c0}² − ${a0}² = ${c0 * c0} − ${a0 * a0} = ${b0 * b0}, b = ${b0} cm` };
    const x1 = ri(-3, 3), y1 = ri(-3, 3);
    return { q: `Hvor langt er der mellem punkterne (${x1}, ${y1}) og (${x1 + a0}, ${y1 + b0}) i et koordinatsystem?`, spec: num(c0),
      sol: `Forskellene er ${a0} og ${b0}. Afstand = √(${a0 * a0} + ${b0 * b0}) = ${c0}` };
  });
  add("enheder", "geometri", "Enheder", lv => {
    if (lv === 1) return pick([
      (() => { const m = ri(1, 9) + pick([0, 0.5, 0.25]); return { q: `Hvor mange cm er ${dk(m)} m?`, spec: num(m * 100), sol: `1 m = 100 cm: ${dk(m * 100)} cm` }; })(),
      (() => { const g = 50 * ri(3, 60); return { q: `Hvor mange kg er ${dk(g)} g?`, spec: num(g / 1000), sol: `1 kg = 1.000 g: ${dk(g / 1000)} kg` }; })(),
      (() => { const cl = 5 * ri(3, 40); return { q: `Hvor mange liter er ${cl} cl?`, spec: num(cl / 100), sol: `1 liter = 100 cl: ${dk(cl / 100)} liter` }; })()]);
    if (lv === 2) return pick([
      (() => { const a = ri(2, 9); return { q: `Hvor mange cm² er ${a} m²?`, spec: num(a * 10000), traps: [[a * 100, "Ved areal skal der ganges med 100 to gange: 1 m² = 100 · 100 cm²."]], sol: `1 m² = 100 cm · 100 cm = 10.000 cm²: ${dk(a * 10000)} cm²` }; })(),
      (() => { const d = ri(2, 30); return { q: `Hvor mange liter er ${d} dm³?`, spec: num(d), sol: `1 dm³ = 1 liter: ${d} liter` }; })(),
      (() => { const c = 250 * ri(1, 12); return { q: `Hvor mange liter er ${dk(c)} cm³?`, spec: num(c / 1000), sol: `1 liter = 1.000 cm³: ${dk(c / 1000)} liter` }; })()]);
    return pick([
      (() => { const v = 18 * ri(1, 6); return { q: `Hvor mange m/s er ${v} km/t?`, spec: num(v / 3.6), sol: `${v} km/t = ${v * 1000} m på 3.600 s = ${dk(v / 3.6)} m/s` }; })(),
      (() => { const m3 = ri(1, 5) + pick([0, 0.5]); return { q: `Hvor mange liter er ${dk(m3)} m³?`, spec: num(m3 * 1000), sol: `1 m³ = 1.000 liter: ${dk(m3 * 1000)} liter` }; })(),
      (() => { const min = pick([15, 20, 45, 90, 150]); return { q: `Hvor mange timer er ${min} minutter? Skriv som decimaltal.`, spec: num(min / 60), sol: `${min} : 60 = ${dk(min / 60)} timer` }; })()]);
  });
  add("ligedannet", "geometri", "Ligedannede figurer", lv => {
    const a = ri(2, 6), k = pick([2, 3, 1.5, 4]), b = a + ri(1, 4);
    if (lv === 1) return { q: `To trekanter er ligedannede. En side på ${a} cm i den lille svarer til ${dk(a * k)} cm i den store. Hvad er skalafaktoren?`, spec: num(k), sol: `${dk(a * k)} : ${a} = ${dk(k)}` };
    if (lv === 2) return { q: `To trekanter er ligedannede med skalafaktor ${dk(k)} fra lille til stor. En anden side i den lille er ${b} cm. Hvor lang er den tilsvarende side i den store?`, spec: num(b * k), hint: "Svar i cm.", sol: `${b} · ${dk(k)} = ${dk(b * k)} cm` };
    const A = ri(3, 12);
    return { q: `Alle mål i en figur ganges med ${dk(k)}. Den lille figur har arealet ${A} cm². Hvad er arealet af den store?`, spec: num(A * k * k), hint: "Svar i cm².", traps: [[A * k, "Længder ganges med k, men arealer ganges med k²."]], sol: `Arealet ganges med skalafaktoren i anden: ${A} · ${dk(k)}² = ${dk(A * k * k)} cm²` };
  });

  // ================= Statistik og sandsynlighed =================
  add("deskriptorer", "statistik", "Middeltal, median og typetal", lv => {
    if (lv === 1) { const n = 5, xs = Array.from({ length: n }, () => ri(1, 12)), s = xs.reduce((a, b) => a + b, 0), fix = (5 - s % 5) % 5; xs[0] += fix;
      const m = (s + fix) / n;
      return { q: `Find middeltallet af tallene ${xs.join(", ")}.`, spec: num(m), sol: `Summen er ${s + fix}, delt med ${n}: ${dk(m)}` }; }
    if (lv === 2) { const n = pick([6, 8]), xs = Array.from({ length: n }, () => ri(1, 20)), sorted = [...xs].sort((a, b) => a - b), med = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      if (rnd() < 0.6) return { q: `Find medianen af tallene ${xs.join(", ")}.`, spec: num(med), traps: [[(xs[n / 2 - 1] + xs[n / 2]) / 2, "Sortér tallene først. Medianen er den midterste i rækkefølge."]], sol: `Sorteret: ${sorted.join(", ")}. Lige mange tal: gennemsnittet af de to midterste, (${sorted[n / 2 - 1]} + ${sorted[n / 2]}) : 2 = ${dk(med)}` };
      return { q: `Find variationsbredden af tallene ${xs.join(", ")}.`, spec: num(sorted[n - 1] - sorted[0]), sol: `Største minus mindste: ${sorted[n - 1]} − ${sorted[0]} = ${sorted[n - 1] - sorted[0]}` }; }
    const xs = Array.from({ length: 4 }, () => ri(3, 12)), m = ri(6, 10), last = 5 * m - xs.reduce((a, b) => a + b, 0);
    if (last < 0 || last > 30) return MathSkills.byId("deskriptorer").gen(3);
    return { q: `Fem tal har middeltallet ${m}. Fire af dem er ${xs.join(", ")}. Hvad er det femte?`, spec: num(last), sol: `Summen skal være 5 · ${m} = ${5 * m}. ${5 * m} − ${xs.reduce((a, b) => a + b, 0)} = ${last}` };
  });
  add("kvartiler", "statistik", "Kvartiler og boksplot", lv => {
    if (lv === 1) { const mn = ri(0, 3) * 5, q1 = mn + 5 * ri(1, 3), md = q1 + 5 * ri(1, 2), q3 = md + 5 * ri(1, 2), mx = Math.min(q3 + 5 * ri(1, 3), 100);
      const ask = pick([["medianen", md], ["den største værdi", mx], ["nedre kvartil", q1], ["øvre kvartil", q3]]);
      return { q: `Aflæs ${ask[0]} i boksplottet.`, fig: boxFig(mn, q1, md, q3, mx, 0, 50 * Math.ceil(mx / 50)), spec: num(ask[1]), sol: `Boksen går fra nedre til øvre kvartil, stregen i boksen er medianen: ${ask[0]} = ${ask[1]}` }; }
    const n = lv === 2 ? 7 : 11, xs = Array.from({ length: n }, () => ri(1, 30)).sort((a, b) => a - b);
    const lowHalf = xs.slice(0, Math.floor(n / 2)), q1 = lowHalf.length % 2 ? lowHalf[(lowHalf.length - 1) / 2] : (lowHalf[lowHalf.length / 2 - 1] + lowHalf[lowHalf.length / 2]) / 2;
    const shuffled = [...xs].sort(() => rnd() - 0.5);
    return { q: `Find nedre kvartil for tallene ${shuffled.join(", ")}.`, spec: num(q1), sol: `Sorteret: ${xs.join(", ")}. Medianen er ${xs[(n - 1) / 2]}. Nedre kvartil er medianen af tallene under: ${lowHalf.join(", ")} giver ${dk(q1)}` };
  });
  add("sandsynlighed", "statistik", "Sandsynlighed", lv => {
    if (lv === 1) { const k = ri(1, 5);
      return { q: `Du slår med en almindelig terning. Hvad er sandsynligheden for at slå mindst ${7 - k}?`, spec: num(k / 6), hint: HINT_FRAC, sol: `${k} gunstige ud af 6 mulige: ${Fr(k, 6)}` }; }
    if (lv === 2) { const r = ri(2, 6), b = ri(2, 6), g = ri(1, 5), want = pick([["rød", r], ["blå", b], ["grøn", g]]);
      return { q: `I en pose er der ${r} røde, ${b} blå og ${g} grønne kugler. Du trækker én. Hvad er sandsynligheden for, at den er ${want[0]}?`, spec: num(want[1] / (r + b + g)), hint: HINT_FRAC, sol: `${want[1]} ud af ${r + b + g}: ${Fr(want[1], r + b + g)}` }; }
    const s = ri(4, 10), ways = 6 - Math.abs(7 - s);
    return { q: `Du slår med to terninger og lægger øjnene sammen. Hvad er sandsynligheden for at få ${s}?`, spec: num(ways / 36), hint: HINT_FRAC, sol: `36 lige sandsynlige udfald. ${ways} giver summen ${s}: ${Fr(ways, 36)}` };
  });

  const AREAS = { tal: "Tal og regnestrategier", algebra: "Algebra", geometri: "Geometri og måling", statistik: "Statistik og sandsynlighed" };
  const byId = id => S.find(s => s.id === id);
  return { SKILLS: S, AREAS, byId, dk, withSeed };
})();
if (typeof module !== "undefined") module.exports = MathSkills;
