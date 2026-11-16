// Reads an answer the way the digital exam accepts it, and checks it by value.
// Accepted: 4*2, 4·2, 4^2, 4/2, ½, 3,5 or 3.5, 1 1/2 (mixed number), −3, π or pi, √(…) or sqrt(…), 2x, 3(x+1),
// and a unit after a number answer (12 cm², 25 %, 40°), which is ignored. Like the exam, a fraction does not have to
// be reduced and an expression does not have to be in its shortest form: only the value counts.
//
//   Check.answer(text, spec) -> { ok, parsed }      spec: { kind: "num", v, tol } | { kind: "expr", f, vars }
//                                                          | { kind: "test", test(text) }
const Check = (() => {
  const UNI = { "½": "(1/2)", "¼": "(1/4)", "¾": "(3/4)", "⅓": "(1/3)", "⅔": "(2/3)", "⅕": "(1/5)", "⅛": "(1/8)",
                "·": "*", "×": "*", "⋅": "*", "÷": "/", "−": "-", "–": "-", "²": "^2", "³": "^3", "π": "pi", "√": "sqrt" };

  // text -> a cleaned string; numberOnly drops a trailing unit and reads "1 1/2" as a mixed number
  function clean(text, numberOnly) {
    let s = String(text).trim().toLowerCase();
    for (const [a, b] of Object.entries(UNI)) s = s.split(a).join(b);
    if (numberOnly) {
      s = s.replace(/\s*(°|%|grader|procent|[a-zæøå]+(\^?[23])?)\s*$/i, m => /pi|sqrt/.test(m) ? m : "");
      const mixed = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);               // 1 1/2 -> 1 + 1/2
      if (mixed) return `${mixed[1]}(${mixed[2]}+${mixed[3]}/${mixed[4]})`;
      s = s.replace(/(\d)\s+(?=\d{3}\b)/g, "$1");                              // 27 300 -> 27300
    }
    if ((s.match(/\./g) || []).length > 1 && !s.includes(",")) s = s.replace(/\./g, "");   // 27.300.000
    return s.replace(/,/g, ".").replace(/:/g, "/");
  }

  // a small expression parser: numbers, variables, pi, sqrt(), + - * / ^, parentheses, implicit multiplication
  function parse(s) {
    const toks = s.match(/\d+(\.\d+)?|\.\d+|pi|sqrt|[a-zæøå]|[-+*/^()]/g) || [];
    if (toks.join("") !== s.replace(/\s+/g, "")) throw new Error("unknown sign");
    let i = 0;
    const peek = () => toks[i], next = () => toks[i++];
    const startsFactor = t => t !== undefined && (/^[\d.]/.test(t) || /^[a-zæøå]/.test(t) || t === "(");
    function expr() {
      let n = term();
      while (peek() === "+" || peek() === "-") { const op = next(), r = term(), l = n; n = op === "+" ? e => l(e) + r(e) : e => l(e) - r(e); }
      return n;
    }
    function term() {
      let n = unary();
      for (;;) {
        if (peek() === "*" || peek() === "/") { const op = next(), r = unary(), l = n; n = op === "*" ? e => l(e) * r(e) : e => l(e) / r(e); }
        else if (startsFactor(peek())) { const r = power(), l = n; n = e => l(e) * r(e); }      // 2x, 3(x+1), 2pi
        else return n;
      }
    }
    function unary() {
      if (peek() === "-") { next(); const r = unary(); return e => -r(e); }
      if (peek() === "+") { next(); return unary(); }
      return power();
    }
    function power() {
      const b = primary();
      if (peek() === "^") { next(); const x = unary(); return e => Math.pow(b(e), x(e)); }
      return b;
    }
    function primary() {
      const t = next();
      if (t === undefined) throw new Error("ends too early");
      if (/^[\d.]/.test(t)) { const v = parseFloat(t); return () => v; }
      if (t === "pi") return () => Math.PI;
      if (t === "sqrt") { const a = primary(); return e => Math.sqrt(a(e)); }
      if (t === "(") { const n = expr(); if (next() !== ")") throw new Error("missing )"); return n; }
      if (/^[a-zæøå]$/.test(t)) return e => { if (!(t in e)) throw new Error("unknown letter " + t); return e[t]; };
      throw new Error("unexpected " + t);
    }
    const f = expr();
    if (i !== toks.length) throw new Error("extra signs");
    return f;
  }

  const close = (a, b, tol) => isFinite(a) && Math.abs(a - b) <= Math.max(1e-9, tol * Math.abs(b));

  function answer(text, spec) {
    if (!String(text).trim()) return { ok: false, empty: true };
    try {
      if (spec.kind === "test") return { ok: !!spec.test(clean(text, false)) };
      if (spec.kind === "num") {
        const v = parse(clean(text, true))({});
        return { ok: close(v, spec.v, spec.tol ?? 1e-9), value: v };
      }
      // an expression in one or more letters: equal to the right one at several points
      const f = parse(clean(text, false)), vars = spec.vars || ["x"];
      for (const p of [1.7, -2.3, 0.6, 3.1, -0.4]) {
        const env = Object.fromEntries(vars.map((v, k) => [v, p + k * 0.37]));
        if (!close(f(env), spec.f(env), 1e-9)) return { ok: false };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, unread: true };                                      // could not be read: say so, not "wrong"
    }
  }
  return { answer, clean, parse };
})();
if (typeof module !== "undefined") module.exports = Check;
