// A small LaTeX-to-MathML converter for the formulas in the tasks. Browsers draw MathML themselves,
// so no maths library is needed. It knows only what the tasks use: \frac, \sqrt, powers and indices,
// \left( \right), \text{}, \quad, a few symbols and functions, numbers (with a decimal point or comma) and names.
// In a text, $...$ becomes an inline formula and $$...$$ a formula on its own line.
const TEX_SYMBOLS = { cdot: "·", times: "×", approx: "≈", propto: "∝", le: "≤", ge: "≥", to: "→", pm: "±" };
const TEX_LETTERS = { theta: "θ", mu: "μ", sigma: "σ", Delta: "Δ" };
const TEX_FUNCS = ["log", "cos", "sin", "tan"];

function tex(src) {
  let i = 0, fn = false;                  // fn: the last element was a function name such as log
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const space = () => { while (src[i] === " ") i++; };
  function atom() {                       // one element: a group, a command, a number, a name or an operator
    space();
    const c = src[i];
    if (c === "{") { i++; const r = row("}"); i++; return `<mrow>${r}</mrow>`; }
    if (c === "\\") {
      i++;
      let name = "";
      while (/[a-zA-Z]/.test(src[i] || "")) name += src[i++];
      if (!name) { const ch = src[i++]; return ch === "," ? '<mspace width="0.17em"/>' : `<mo>${esc(ch)}</mo>`; }
      if (name === "frac") return `<mfrac>${atom()}${atom()}</mfrac>`;
      if (name === "sqrt") return `<msqrt>${atom()}</msqrt>`;
      if (name === "left" || name === "right") { space(); return `<mo>${esc(src[i++])}</mo>`; }
      if (name === "text") { i++; let t = ""; while (src[i] !== "}") t += src[i++]; i++; return `<mtext>${esc(t)}</mtext>`; }
      if (name === "quad") return '<mspace width="1em"/>';
      if (name in TEX_SYMBOLS) return `<mo>${TEX_SYMBOLS[name]}</mo>`;
      if (name in TEX_LETTERS) return `<mi>${TEX_LETTERS[name]}</mi>`;
      if (TEX_FUNCS.includes(name)) { fn = true; return `<mi>${name}</mi>`; }
      return `<mi>${esc(name)}</mi>`;
    }
    if (/[0-9]/.test(c)) {                 // 0,5 and 0.5 are both one number
      let n = "";
      while (/[0-9]/.test(src[i] || "") || (/[.,]/.test(src[i] || "") && /[0-9]/.test(src[i + 1] || ""))) n += src[i++];
      return `<mn>${n}</mn>`;
    }
    if (/[a-zA-Z]/.test(c)) {              // a run of letters is one name: SID, OID, EI
      let n = "";
      while (/[a-zA-Z]/.test(src[i] || "")) n += src[i++];
      return `<mi>${n}</mi>`;
    }
    i++;
    return `<mo>${esc(c === "-" ? "−" : c)}</mo>`;
  }
  function row(end) {                     // elements until the closing brace, each with its index and power
    let out = "";
    for (space(); i < src.length && src[i] !== end; space()) {
      fn = false;
      let base = atom(), sub = null, sup = null;
      const isFn = fn;
      for (space(); src[i] === "_" || src[i] === "^"; space()) {
        const k = src[i++];
        if (k === "_") sub = atom(); else sup = atom();
      }
      out += sub && sup ? `<msubsup>${base}${sub}${sup}</msubsup>` : sub ? `<msub>${base}${sub}</msub>`
           : sup ? `<msup>${base}${sup}</msup>` : base;
      if (isFn) out += '<mspace width="0.17em"/>';   // a little room between log and what follows
    }
    return out;
  }
  return row(undefined);
}

// a text with $...$ and $$...$$ formulas, as HTML
const withMath = s => s
  .replace(/\$\$([^$]+)\$\$/g, (_, m) => `<math display="block">${tex(m)}</math>`)
  .replace(/\$([^$]+)\$/g, (_, m) => `<math>${tex(m)}</math>`);
