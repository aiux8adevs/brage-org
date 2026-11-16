// Self-test, shared by the radiography and ultrasound topic pages and the ultrasound test page.
// A few multiple-choice questions; each question belongs to a concept, and each concept points to the part of the
// video that explains it and to the simulator task that practises it. After each answer the result box shows which
// concepts went wrong, with a link to the video at that moment and to the task.
// Privacy: the answers live in this page's memory only. Nothing is saved on the device (no cookies, no storage) and
// nothing is sent anywhere; closing or reloading the page forgets them.
//
//   SelfTest.mount(box, { lang, concepts, qs, link, title })
//     concepts  { id: { da, en, line, task, tname: [da, en] } }  line: narration key, task: task id, tname: its title
//     qs        [{ c: concept id, a: right option, da: [question, [options], why], en: [...] }]
//     link      (concept, kind) => href or null; kind "video" or "task" (the page knows its video times)
//     title     optional heading above the questions
const SelfTest = (() => {
  const W = {
    da: { intro: "Svar på spørgsmålene. Efter hvert svar ser du en forklaring, og nederst hvad du med fordel kan se eller prøve igen.",
          privacy: "Dine svar bliver kun i denne fane. Intet gemmes på din enhed, og intet sendes nogen steder.",
          right: "Rigtigt.", wrong: "Ikke helt.", result: "Dit resultat", none: "Svar på et spørgsmål for at se dit resultat.",
          score: (r, n, t) => `${r} rigtige af ${n} besvarede (${t} i alt).`, good: "Sidder godt", weak: "Se igen",
          video: "Se videoen fra", task: "Prøv opgaven", restart: "Start forfra", all: "Alle rigtige indtil nu. Godt gået." },
    en: { intro: "Answer the questions. After each answer you see an explanation, and at the bottom what is worth watching or trying again.",
          privacy: "Your answers stay in this tab only. Nothing is saved on your device, and nothing is sent anywhere.",
          right: "Right.", wrong: "Not quite.", result: "Your result", none: "Answer a question to see your result.",
          score: (r, n, t) => `${r} right of ${n} answered (${t} in all).`, good: "Solid", weak: "Look again",
          video: "Watch the video from", task: "Try the task", restart: "Start over", all: "All right so far. Well done." },
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function mount(box, opt) {
    const ans = {};                                   // question index -> chosen option (memory only)
    function draw() {
      const L = opt.lang(), T = W[L];
      const qs = opt.qs.map((q, i) => {
        const [text, opts, why] = q[L], chosen = ans[i], done = chosen !== undefined;
        return `<div class="st-q"><h4><small>${i + 1}</small>${esc(text)}</h4><div class="st-opts">` +
          opts.map((o, k) => `<button class="st-opt${done && k === q.a ? " right" : ""}${done && k === chosen && k !== q.a ? " wrong" : ""}"` +
            ` data-i="${i}" data-k="${k}"${done ? " disabled" : ""}>${esc(o)}</button>`).join("") + `</div>` +
          (done ? `<p class="st-why"><b>${chosen === q.a ? T.right : T.wrong}</b> ${esc(why)}</p>` : "") + `</div>`;
      }).join("");
      box.innerHTML = (opt.title ? `<h3 class="st-title">${esc(opt.title(L))}</h3>` : "") +
        `<p class="st-intro">${T.intro}</p><p class="st-privacy">${T.privacy}</p>${qs}<div class="st-result" aria-live="polite">${result(L)}</div>`;
      box.querySelectorAll("button.st-opt").forEach(b => { b.onclick = () => { ans[+b.dataset.i] = +b.dataset.k; draw(); }; });
      const r = box.querySelector(".st-restart");
      if (r) r.onclick = () => { for (const k in ans) delete ans[k]; draw(); box.scrollIntoView({ block: "start" }); };
    }
    // per concept: how many asked, answered, right; the weak ones get links back to the video and the task
    function result(L) {
      const T = W[L], per = {};
      let n = 0, r = 0;
      opt.qs.forEach((q, i) => {
        const p = per[q.c] || (per[q.c] = { n: 0, r: 0 });
        if (ans[i] === undefined) return;
        n++; p.n++;
        if (ans[i] === q.a) { r++; p.r++; }
      });
      if (!n) return `<h3>${T.result}</h3><p class="st-none">${T.none}</p>`;
      const rows = Object.entries(per).filter(([, p]) => p.n).map(([id, p]) => {
        const c = opt.concepts[id], weak = p.r < p.n;
        const v = weak && opt.link(c, "video"), t = weak && opt.link(c, "task");
        return `<li class="${weak ? "weak" : "good"}"><span class="st-c">${esc(c[L])}</span> <span class="st-n">${p.r}/${p.n}</span> ` +
          `<span class="st-tag">${weak ? T.weak : T.good}</span>` +
          (v ? ` <a class="st-go" href="${v}">▶ ${T.video} ${clock(+v.match(/[:@]([\d.]+)$/)[1])}</a>` : "") +
          (t ? ` <a class="st-go" href="${t}">${T.task}: ${esc(c.tname[L === "da" ? 0 : 1])}</a>` : "") + `</li>`;
      });
      const allRight = r === n;
      return `<h3>${T.result}</h3><p>${T.score(r, n, opt.qs.length)}${allRight ? " " + T.all : ""}</p>` +
        `<ul class="st-list">${rows.join("")}</ul><button class="st-restart">${T.restart}</button>`;
    }
    draw();
    return { draw };
  }

  // "m:ss" for a time in seconds
  const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  return { mount, clock };
})();
