// Ultrasound topic pages: adds the tabs Video / Simulator / Glossary and PDF around the simulator page.
// The page's own script stays as it is; this one reads its language (<html lang>) and level (the
// "deeper" button) and follows them. The video files live in the page's video/ folder, copied there by
// sync_videos.sh: <name>_<da|en>_<grund|fordybelse>.mp4, poster_<da|en>.jpg and <name>_<da|en>.pdf,
// where <name> is the body's data-video attribute.
(() => {
  const name = document.body.dataset.video;
  if (!name) return;
  const W = {
    da: { video: "Video", simulator: "Simulator og opgaver", handout: "Ordkort og PDF",
          note: "Videoen følger sproget og niveauet (grund eller fordybelse) øverst på siden. Stemmen er syntetisk.",
          pdf: "Ordkort og transskription (PDF)", pdfOther: "Engelsk udgave (PDF)",
          pdfNote: "Det hele, der bliver sagt i videoen, plus en dansk-engelsk ordliste." },
    en: { video: "Video", simulator: "Simulator and tasks", handout: "Glossary and PDF",
          note: "The video follows the language and the level (basic or deeper) at the top of the page. The voice is synthetic.",
          pdf: "Glossary and transcript (PDF)", pdfOther: "Danish version (PDF)",
          pdfNote: "Everything said in the video, plus a Danish-English glossary." },
  };
  const TABS = ["video", "simulator", "handout"];
  const el = (tag, attrs = {}) => Object.assign(document.createElement(tag), attrs);

  // ---- build: tabs after the header, the simulator page wrapped in its own tab ----
  const header = document.querySelector(".wrap > header"), footer = document.querySelector(".wrap > footer");
  const nav = el("nav", { className: "tabs", id: "tabs" });
  const sim = el("div"); sim.dataset.tab = "simulator";
  while (header.nextElementSibling && header.nextElementSibling !== footer) sim.append(header.nextElementSibling);
  const vbox = el("div"); vbox.dataset.tab = "video";
  const section = el("section", { className: "video" });
  const vid = el("video", { controls: true, preload: "none", playsInline: true });
  const vnote = el("p", { className: "note" });
  section.append(vid, vnote); vbox.append(section);
  const hbox = el("section", { className: "box", id: "handout-box" }); hbox.dataset.tab = "handout";
  header.after(nav, vbox, sim, hbox);

  const lang = () => (document.documentElement.lang === "da" ? "da" : "en");
  const deep = () => document.getElementById("lvl-deep")?.getAttribute("aria-pressed") === "true";

  // ---- show one tab; the simulator sizes its canvases to what is visible, so it gets a resize ----
  function show(tab) {
    if (!TABS.includes(tab)) tab = "video";
    for (const box of [vbox, sim, hbox]) box.hidden = box.dataset.tab !== tab;
    nav.querySelectorAll("a").forEach(a => a.setAttribute("aria-current", a.dataset.go === tab ? "page" : "false"));
    if (tab !== "video") vid.pause();
    window.dispatchEvent(new Event("resize"));
  }

  // ---- texts and files for the current language and level ----
  function draw() {
    const L = lang(), T = W[L], other = L === "da" ? "en" : "da";
    nav.setAttribute("aria-label", L === "da" ? "Indhold" : "Contents");
    nav.innerHTML = TABS.map((t, i) => `<a href="#${t}" data-go="${t}"><span>${i + 1}</span> ${T[t]}</a>`).join("");
    vnote.textContent = T.note;
    const file = `video/${name}_${L}_${deep() ? "fordybelse" : "grund"}.mp4`;
    if (vid.getAttribute("src") !== file) { vid.poster = `video/poster_${L}.jpg`; vid.src = file; }
    hbox.innerHTML = `<p><a class="pdf" href="video/${name}_${L}.pdf">${T.pdf}</a> · ` +
      `<a href="video/${name}_${other}.pdf">${T.pdfOther}</a></p><p class="note">${T.pdfNote}</p>`;
    show(location.hash.slice(1));
  }

  draw();
  // the page's script changes <html lang> and the level buttons; follow both
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  const lvl = document.getElementById("lvl-deep");
  if (lvl) new MutationObserver(draw).observe(lvl, { attributes: true, attributeFilter: ["aria-pressed"] });
  window.addEventListener("hashchange", () => show(location.hash.slice(1)));
})();
