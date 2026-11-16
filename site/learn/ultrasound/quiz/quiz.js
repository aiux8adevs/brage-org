// Ultrasound self-test, all topics on one page. The questions and concepts are in ../selftest-data.js (shared with
// the "Test yourself" tab on each topic page); the test itself is ../../selftest.js. Each topic gets its own result
// box, whose links open the topic page at the right moment of the video (#video:<seconds>) or at the task
// (#task:<title>). Runs in the browser only: nothing is saved or sent; a reload starts over.
const TEXT = {
  da: { title: "Test dig selv | Ultralyd | Oliver Brage", skip: "Spring til indhold", eyebrow: "Ultralyd · selvtest", h1: "Test dig selv", back: "← Ultralyd",
        lead: "Seks spørgsmål pr. emne, i klinisk sprog. Efter hvert emne ser du, hvad du med fordel kan se i videoen eller prøve i simulatoren igen. De samme spørgsmål findes under fanen Test dig selv på hvert emne.",
        all: "Alle", open: "Til emnet →", rights: "Alle rettigheder forbeholdes.", privacy: "Privatliv", profile: "Profil", projects: "Projekter", learn: "Læring" },
  en: { title: "Test yourself | Ultrasound | Oliver Brage", skip: "Skip to content", eyebrow: "Ultrasound · self-test", h1: "Test yourself", back: "← Ultrasound",
        lead: "Six questions per topic, in clinical language. After each topic you see what is worth watching in the video or trying in the simulator again. The same questions are under the Test yourself tab on each topic.",
        all: "All", open: "To the topic →", rights: "All rights reserved.", privacy: "Privacy", profile: "Profile", projects: "Projects", learn: "Learn" },
};

let LANG = "da", ONLY = "";
const TIMES = {};                                    // topic path -> its video/times.json, once loaded
const TESTS = {};                                    // topic n -> the mounted test (kept across redraws, so answers stay)
const $ = id => document.getElementById(id);
const lang = () => LANG;

function link(g) {
  return (c, kind) => {
    const page = `../${g.path}/?lang=${LANG}`;
    if (kind === "task") return page + "#task:" + encodeURIComponent(c.task[LANG === "da" ? 0 : 1]);
    const t = TIMES[g.path]?.[`${LANG}_grund`]?.[c.line];
    return t === undefined ? null : page + "#video:" + t;
  };
}
function build() {
  const t = TEXT[LANG];
  $("quiz").innerHTML = "";
  for (const g of US_QUIZ) {
    const wrap = document.createElement("div");
    wrap.className = "gl-group"; wrap.dataset.n = g.n;
    wrap.innerHTML = `<h3><small>${g.n}</small><span class="gt"></span> · <a class="go"></a></h3><div class="st"></div>`;
    $("quiz").append(wrap);
    TESTS[g.n] = SelfTest.mount(wrap.querySelector(".st"), { lang, concepts: US_CONCEPTS[g.n], qs: g.qs, link: link(g) });
    fetch(`../${g.path}/video/times.json`).then(r => r.ok ? r.json() : null).then(j => { TIMES[g.path] = j; TESTS[g.n].draw(); }).catch(() => {});
  }
  redraw();
}
function redraw() {
  const t = TEXT[LANG];
  document.querySelectorAll("#quiz > .gl-group").forEach(w => {
    const g = US_QUIZ.find(x => x.n === w.dataset.n);
    w.hidden = !!ONLY && ONLY !== g.n;
    w.querySelector(".gt").textContent = g[LANG];
    const a = w.querySelector("a.go"); a.textContent = t.open; a.href = `../${g.path}/?lang=${LANG}`;
    TESTS[g.n].draw();
  });
}
function drawChips() {
  const t = TEXT[LANG];
  $("chips").innerHTML = [["", t.all], ...US_QUIZ.map(g => [g.n, g.n])].map(([k, s]) =>
    `<button class="chip" data-k="${k}" aria-pressed="${ONLY === k}">${s}</button>`).join(" ");
  $("chips").querySelectorAll("button").forEach(b => { b.onclick = () => { ONLY = b.dataset.k; drawChips(); redraw(); }; });
}
function apply(lang) {
  LANG = lang;
  const t = TEXT[lang];
  document.documentElement.lang = lang;
  document.title = t.title;
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t[el.dataset.t]; });
  document.querySelectorAll(".lang-switch button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  $("back").href = "../?lang=" + lang;
  drawChips(); redraw();
  const q = new URLSearchParams(location.search); q.set("lang", lang);
  history.replaceState(null, "", "?" + q);
}
function pickLang() {
  const l = new URLSearchParams(location.search).get("lang");
  if (l === "da" || l === "en") return l;
  return (navigator.language || "").toLowerCase().startsWith("da") ? "da" : "en";
}
document.querySelectorAll(".lang-switch button").forEach(b => { b.onclick = () => apply(b.dataset.lang); });
{ const t = new URLSearchParams(location.search).get("topic"); if (US_QUIZ.some(g => g.n === t)) ONLY = t; }
LANG = pickLang();
build();
apply(LANG);
