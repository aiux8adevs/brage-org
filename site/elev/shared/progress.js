// Progress for the private learning area, kept as a list of events ("this task, right or wrong, at this time").
// Events are never changed, only added, so two computers can never overwrite each other: syncing is just the union
// of both lists (by event id). The server copy (../api/progress.php, behind the area's password) is the one that
// survives a new computer; localStorage is a copy for speed and for when the network is down. Unsent events wait in
// a queue and go with the next sync.
//
//   await Progress.ready             loaded from this browser, then merged with the server
//   Progress.add({ sub, s, lv, ok, mode, ms })   one answer: subject, skill id, level, right?, mode, time spent
//   Progress.events(sub)             all events for a subject, oldest first
//   Progress.status()                "synced" | "offline" | "waiting"
const Progress = (() => {
  const KEY = "elev.events.v1", QUEUE = "elev.queue.v1";
  const API = new URL("../api/progress.php", document.currentScript.src).href;
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full or blocked: the server copy still counts */ } };
  let all = read(KEY), queue = read(QUEUE), state = "waiting";
  const listeners = [];

  function merge(list) {
    const seen = new Set(all.map(e => e.id));
    let added = 0;
    for (const e of list) if (e && e.id && !seen.has(e.id)) { all.push(e); seen.add(e.id); added++; }
    if (added) { all.sort((a, b) => a.t - b.t); write(KEY, all); }
    return added;
  }
  async function sync() {
    try {
      if (queue.length) {
        const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events: queue }), credentials: "same-origin" });
        // only a real confirmation from the server empties the queue (not, say, a page served instead of the script)
        const ack = r.ok ? await r.json().catch(() => null) : null;
        if (!ack || typeof ack.added !== "number") throw new Error("not saved");
        queue = []; write(QUEUE, queue);
      }
      const r = await fetch(API, { credentials: "same-origin", cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      const body = await r.json();
      if (!Array.isArray(body.events)) throw new Error("no events");
      const changed = merge(body.events);
      state = "synced";
      if (changed) listeners.forEach(f => f());
    } catch {
      state = "offline";
    }
    return state;
  }
  const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  function add(e) {
    const ev = { id: id(), t: Date.now(), ...e };
    merge([ev]);
    queue.push(ev); write(QUEUE, queue);
    sync();
    return ev;
  }
  const ready = sync();
  window.addEventListener("online", sync);
  return { ready, add, sync, events: sub => all.filter(e => e.sub === sub), status: () => state, onChange: f => listeners.push(f) };
})();
