// Progress for the private learning area, kept per user as a list of events ("this task, right or wrong, at this
// time"). Events are never changed, only added, so two computers can never overwrite each other: syncing is just
// the union of both lists (by event id).
//
// Every family member has their own login to the area. The server (../api/progress.php) keeps one file per login
// and says who is logged in; this browser keeps a copy per user, so two people on one computer never mix answers.
// New answers are saved here at once and sent to the server in the background; unsent ones wait in a queue and go
// with the next sync. Progress.renderStatus(el) shows "Gemt online kl. …" or what is still waiting, with a button.
// The shared guest login "gaest" (for classmates) is never stored on the server: a guest's answers stay here.
//
//   await Progress.ready             loaded from this browser, then merged with the server
//   Progress.add({ sub, s, lv, ok, mode, ms })   one event: subject, skill or game id, level, right?, mode, ms
//   Progress.events(sub)             all events for a subject, oldest first
const Progress = (() => {
  const API = new URL("../api/progress.php", document.currentScript.src).href;
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full or blocked: the server copy still counts */ } };
  const K = u => ({ ev: `elev.events.v2.${u}`, q: `elev.queue.v2.${u}`, saved: `elev.saved.v2.${u}` });
  let user = get("elev.user.v2", "") || "ukendt";                     // the last user seen in this browser
  let all = get(K(user).ev, []), queue = get(K(user).q, []), state = "waiting", busy = null, guest = get("elev.guest.v2", false);
  const listeners = [];
  const tell = () => listeners.forEach(f => { try { f(); } catch { /* a listener must not stop the others */ } });

  function merge(list) {
    const seen = new Set(all.map(e => e.id));
    let added = 0;
    for (const e of list) if (e && e.id && !seen.has(e.id)) { all.push(e); seen.add(e.id); added++; }
    if (added) { all.sort((a, b) => a.t - b.t); put(K(user).ev, all); }
    return added;
  }
  // the server says who is logged in; answers given before we knew (first visit, offline) go to that user
  function becomeUser(u) {
    if (u === user) return;
    const carry = user === "ukendt" ? { ev: all, q: queue } : { ev: [], q: [] };
    user = u; put("elev.user.v2", u);
    all = get(K(u).ev, []); queue = get(K(u).q, []);
    merge(carry.ev); queue.push(...carry.q); put(K(u).q, queue);
    if (carry.ev.length) { localStorage.removeItem(K("ukendt").ev); localStorage.removeItem(K("ukendt").q); }
  }
  async function syncOnce() {
    try {
      const r = await fetch(API, { credentials: "same-origin", cache: "no-store" });
      const body = r.ok ? await r.json().catch(() => null) : null;
      if (!body || !Array.isArray(body.events) || !body.user) throw new Error("no answer");
      becomeUser(body.user);
      guest = !!body.guest; put("elev.guest.v2", guest);
      if (guest) { queue = []; put(K(user).q, queue); }       // a guest's answers stay in this browser only
      const changed = merge(body.events);
      if (queue.length) {
        const sending = queue.slice();
        const p = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events: sending }), credentials: "same-origin" });
        // only a real confirmation from the server empties the queue (not, say, a page served instead of the script)
        const ack = p.ok ? await p.json().catch(() => null) : null;
        if (!ack || typeof ack.added !== "number" || ack.user !== user) throw new Error("not saved");
        const sent = new Set(sending.map(e => e.id));
        queue = queue.filter(e => !sent.has(e.id)); put(K(user).q, queue);
      }
      put(K(user).saved, Date.now());
      state = queue.length ? "pending" : "synced";
      if (changed) tell();
    } catch {
      state = queue.length ? "offline" : "offline-clean";
    }
    tell();
    return state;
  }
  const sync = () => (busy = busy || syncOnce().finally(() => { busy = null; }));
  const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  function add(e) {
    const ev = { id: id(), t: Date.now(), ...e };
    merge([ev]);
    if (guest) { tell(); return ev; }
    queue.push(ev); put(K(user).q, queue);
    state = "pending"; tell();
    sync();
    return ev;
  }
  // a status line with a "save now" button, kept up to date
  function renderStatus(el) {
    const draw = () => {
      const t = get(K(user).saved, 0), clock = t ? new Date(t).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" }) : null;
      if (guest) { el.innerHTML = `<span class="okc">Gæst: gemmes kun på denne computer.</span>`; return; }
      const txt = queue.length ? `${queue.length} svar er kun gemt på denne computer${state === "offline" ? " (ingen forbindelse lige nu)" : ""}.`
        : clock ? `Gemt online kl. ${clock}.` : "Ikke gemt online endnu.";
      el.innerHTML = `<span class="${queue.length ? "warn" : "okc"}">${txt}</span> <button type="button" class="btn small">Gem nu</button>`;
      el.querySelector("button").onclick = () => { el.querySelector("span").textContent = "Gemmer…"; sync(); };
    };
    listeners.push(draw); draw();
  }
  const ready = sync();
  window.addEventListener("online", sync);
  setInterval(() => { if (queue.length) sync(); }, 60000);            // try again every minute while something waits
  return { ready, add, sync, renderStatus, events: sub => all.filter(e => e.sub === sub), user: () => user,
           status: () => state, onChange: f => listeners.push(f) };
})();
