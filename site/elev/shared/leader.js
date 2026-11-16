// Top list for a game, kept only on this computer (localStorage): nothing about the players leaves the machine.
// After a run the player types a nickname (no real names, the page says so) and the score goes on the list.
// "En ven spiller" (a friend is playing): that run is not logged in the logged-in pupil's progress, so a friend on
// his computer does not change his levels; the friend still goes on the top list. The nickname is remembered for
// the pupil only, so a friend neither gets his name filled in nor replaces it.
//
//   Leader.render(el, game)          draw the top 10 for a game into el
//   Leader.offer(game, score, el)    after a run: ask for a nickname and save the score
//   Leader.friend()                  true while the "a friend is playing" box is ticked
//   Leader.asking()                  true while the nickname form is open (the game then tells the player to look there)
const Leader = (() => {
  const key = g => `elev.top.v1.${g}`;
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: the list just is not kept */ } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const clean = s => String(s).toUpperCase().replace(/[^A-ZÆØÅ0-9 ]/g, "").trim().slice(0, 12);
  const box = document.getElementById("friend");
  const friend = () => !!(box && box.checked);
  // let go of the box after a click, so the next press on the space bar starts the game instead of unticking it
  if (box) box.addEventListener("change", () => box.blur());
  let asking = false;
  function render(el, game, mark) {
    asking = false;
    const list = get(key(game), []);
    el.innerHTML = `<h2>Topliste</h2>` + (list.length
      ? `<ol class="toplist">${list.map((r, i) => `<li class="${i === mark ? "new" : ""}"><span>${esc(r.n)}</span><b>${r.s}</b><small>${new Date(r.t).toLocaleDateString("da-DK")}</small></li>`).join("")}</ol>`
      : `<p class="muted">Ingen point endnu. Spil en runde.</p>`) +
      `<p class="note">Listen ligger kun på denne computer. Brug et kaldenavn, ikke dit rigtige navn.</p>`;
  }
  function offer(game, score, el) {
    const list = get(key(game), []);
    if (score <= 0 || (list.length >= 10 && score <= list[list.length - 1].s)) { render(el, game); return; }
    el.innerHTML = `<h2>Ny plads på toplisten: ${score} point</h2><form class="nick"><input maxlength="12" placeholder="Kaldenavn" aria-label="Kaldenavn" value="${esc(friend() ? "" : get("elev.nick.v1", ""))}">` +
      `<button class="btn primary">Gem</button></form><p class="note">Brug et kaldenavn, ikke dit rigtige navn. Listen ligger kun på denne computer.</p>`;
    const form = el.querySelector("form"), inp = form.querySelector("input");
    asking = true;
    inp.focus({ preventScroll: true });
    el.scrollIntoView({ block: "nearest" });                  // bring the form into view without throwing the game off the screen
    form.onsubmit = e => {
      e.preventDefault();
      const n = clean(inp.value) || "ANONYM";
      if (!friend()) put("elev.nick.v1", n);
      list.push({ n, s: score, t: Date.now() });
      list.sort((a, b) => b.s - a.s || a.t - b.t);
      const kept = list.slice(0, 10), mark = kept.findIndex(r => r.n === n && r.s === score);
      put(key(game), kept);
      render(el, game, mark);
    };
  }
  return { render, offer, friend, asking: () => asking };
})();
