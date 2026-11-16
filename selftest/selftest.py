#!/usr/bin/env python3
"""Keep the self-tests on the topic pages in step with the videos and the simulators.

The questions live in site/learn/<track>/selftest.json, one entry per topic page. Each question belongs to a concept,
and each concept points to a narrated line in the video (where "watch the video from here" jumps to) and to a
simulator task (where "try the task" opens). The links are by key, never by time or title:

  line  "a2_kopier"  the line's start in each of the four video versions is measured at every sync
                     (manim-studio's line_times_page.py writes video/times*.json), so a re-render moves the link along
  task  "3:1"        the task's place in the simulator's list (group:item), rendered as <details data-id>; null when
                     no task practises the concept (the result then shows only the video link)

Two fingerprints say what a concept was written against:
  fp   the narration of the line's chapter (also from times*.json); a fix to the narration changes it
  tfp  the task's title and text; a reworded or moved task changes it (tname, the title shown on the link, is copied
       from the simulator by accept)
When either changes, check fails and names the questions to review; accept stores the new fingerprints after review.

  python3 selftest/selftest.py check                       everything; exit 1 on a problem (run by deploy.sh)
  python3 selftest/selftest.py accept <track> <page> [concept ...]   store the current fingerprints (all concepts if none)
  python3 selftest/selftest.py skeleton <track> <page>     chapters, lines, tasks and goals, to write new questions from
  python3 selftest/selftest.py coverage                    learning outcomes and chapters without questions
"""

import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEARN = ROOT / "site" / "learn"
GOALS = json.loads((ROOT / "selftest" / "goals.json").read_text())
MANIM = Path.home() / "projects" / "manim-studio"
VERSIONS = ("da_grund", "da_fordybelse", "en_grund", "en_fordybelse")
LENGTH = (6, 8)                       # questions per page: long enough to cover the outcomes, short enough to be done
SKIP_CHAPTERS = {"Opsummering", "Summary"}   # chapters that only repeat, no question needed


def data_path(track):
    return LEARN / track / "selftest.json"


def load(track):
    return json.loads(data_path(track).read_text())


def times_path(track, page, file):
    # radiography pages can have several videos (times_<file>.json); an ultrasound page has one (times.json)
    name = f"times_{file}.json" if track == "radiography" else "times.json"
    return LEARN / track / page / "video" / name


def tasks(track, page):
    """{id: {"da": task, "en": task}} read from the simulator's source by tasks.js."""
    out = subprocess.run(["node", str(ROOT / "selftest" / "tasks.js"), str(LEARN / track / page / f"{page}.js")],
                         capture_output=True, text=True, check=True).stdout
    lists = json.loads(out)
    return {t["id"]: {"da": t, "en": e} for t, e in zip(lists["da"], lists["en"])}


def task_fp(t):
    s = "\n".join(f"{t[L]['title']}\n{t[L]['text']}" for L in ("da", "en"))
    return hashlib.sha1(s.encode()).hexdigest()[:8]


def chapter(line):
    return line.split("_")[0]


def dump(track, data):
    """Write the JSON with one concept per line and each question on three lines, so diffs stay readable."""
    j = lambda x: json.dumps(x, ensure_ascii=False)
    out = ["{", f'  "_about": {j(data["_about"])},', '  "pages": {']
    pages = list(data["pages"].items())
    for pi, (name, p) in enumerate(pages):
        out.append(f"    {j(name)}: {{")
        for k, v in p.items():
            if k not in ("concepts", "qs"):
                out.append(f"      {j(k)}: {j(v)},")
        out.append('      "concepts": {')
        cs = list(p["concepts"].items())
        out += [f"        {j(cid)}: {j(c)}{',' if i < len(cs) - 1 else ''}" for i, (cid, c) in enumerate(cs)]
        out += ["      },", '      "qs": [']
        for i, q in enumerate(p["qs"]):
            head = {k: v for k, v in q.items() if k not in ("da", "en")}
            out.append(f"        {j(head)[:-1]},")
            out.append(f'         "da": {j(q["da"])},')
            out.append(f'         "en": {j(q["en"])}}}{"," if i < len(p["qs"]) - 1 else ""}')
        out += ["      ]", f"    }}{',' if pi < len(pages) - 1 else ''}"]
    out += ["  }", "}", ""]
    data_path(track).write_text("\n".join(out))


def check_page(track, page, p, tk, goals):
    """Return (errors, warnings) for one page."""
    err, warn = [], []
    times = {}
    for cid, c in p["concepts"].items():
        where = f"{track}/{page} concept '{cid}'"
        f = times_path(track, page, c["file"])
        if f not in times:
            times[f] = json.loads(f.read_text()) if f.exists() else None
        t = times[f]
        if t is None:
            err.append(f"{where}: no {f.relative_to(ROOT)} (run ./sync_videos.sh)")
            continue
        missing = [v for v in VERSIONS if c["line"] not in t.get(v, {})]
        if missing:
            err.append(f"{where}: the line {c['line']} is not in the video ({', '.join(missing)})")
        now = t.get("fp", {}).get(chapter(c["line"]))
        if not c.get("fp"):
            err.append(f"{where}: no fingerprint yet (selftest.py accept {track} {page} {cid})")
        elif now != c["fp"]:
            qs = [i + 1 for i, q in enumerate(p["qs"]) if q["c"] == cid]
            err.append(f"{where}: the narration of chapter {chapter(c['line'])} has changed. Check question(s) {qs} "
                       f"against the video, then: selftest.py accept {track} {page} {cid}")
        task = tk.get(c.get("task") or "")
        if c.get("task") is None:
            pass                                      # no task practises this concept: the result shows only the video link
        elif task is None:
            err.append(f"{where}: the simulator has no task {c.get('task')!r}")
        else:
            if not c.get("tfp"):
                err.append(f"{where}: no task fingerprint yet (selftest.py accept {track} {page} {cid})")
            elif task_fp(task) != c["tfp"]:
                err.append(f"{where}: the task {c['task']} is now \"{task['da']['title']}\" and has changed. "
                           f"Check that it still fits, then: selftest.py accept {track} {page} {cid}")
            if task["da"]["deep"]:
                warn.append(f"{where}: the task {c['task']} only shows at the deeper level")
    for i, q in enumerate(p["qs"]):
        where = f"{track}/{page} question {i + 1}"
        if q["c"] not in p["concepts"]:
            err.append(f"{where}: unknown concept {q['c']!r}")
        if len(q["da"][1]) != len(q["en"][1]) or not 0 <= q["a"] < len(q["da"][1]):
            err.append(f"{where}: the options do not match (a={q['a']}, {len(q['da'][1])} da, {len(q['en'][1])} en)")
        if not q.get("goals"):
            err.append(f"{where}: no learning outcome")
        for g in q.get("goals", []):
            if g not in goals:
                err.append(f"{where}: unknown learning outcome {g!r}")
    used = {q["c"] for q in p["qs"]}
    warn += [f"{track}/{page} concept '{c}' has no question" for c in p["concepts"] if c not in used]
    if not LENGTH[0] <= len(p["qs"]) <= LENGTH[1]:
        warn.append(f"{track}/{page}: {len(p['qs'])} questions (aim for {LENGTH[0]}–{LENGTH[1]})")
    return err, warn


def check():
    err, warn = [], []
    for track in ("radiography", "ultrasound"):
        data, goals = load(track), GOALS[track]["goals"]
        for page, p in data["pages"].items():
            e, w = check_page(track, page, p, tasks(track, page), goals)
            err += e
            warn += w
    for w in warn:
        print("note: ", w)
    for e in err:
        print("ERROR:", e)
    print(f"self-test check: {len(err)} error(s), {len(warn)} note(s)")
    return 1 if err else 0


def accept(track, page, ids):
    data = load(track)
    p, tk = data["pages"][page], tasks(track, page)
    for cid in ids or list(p["concepts"]):
        c = p["concepts"][cid]
        t = json.loads(times_path(track, page, c["file"]).read_text())
        c["fp"] = t["fp"][chapter(c["line"])]
        if c.get("task") is None:                     # a concept with no task: video link only
            c["task"] = c["tfp"] = c["tname"] = None
            print(f"{cid}: line {c['line']} (fp {c['fp']}), no task")
            continue
        c["tfp"] = task_fp(tk[c["task"]])
        c["tname"] = [tk[c["task"]]["da"]["title"], tk[c["task"]]["en"]["title"]]   # shown on the "try the task" link
        print(f"{cid}: line {c['line']} (fp {c['fp']}), task {c['task']} \"{tk[c['task']]['da']['title']}\" (tfp {c['tfp']})")
    dump(track, data)


def narration(module):
    sys.path.insert(0, str(MANIM / "src"))
    import importlib
    return {L: importlib.import_module(f"manim_studio.radiografi.{module}_{L}") for L in ("da", "en")}


def skeleton(track, page):
    """Everything needed to write questions for a page, and concept stubs for the chapters that have none."""
    data = load(track)
    p = data["pages"].setdefault(page, {"concepts": {}, "qs": []})
    tk = tasks(track, page)
    goals = {g: v for g, v in GOALS[track]["goals"].items() if page in v["pages"]}
    print(f"# {track}/{page}\n\n## Learning outcomes taught here")
    for g, v in goals.items():
        n = sum(g in q.get("goals", []) for q in p["qs"])
        print(f"- {g} ({n} question(s)): {v['da']}")
    asked = {chapter(p["concepts"][q["c"]]["line"]) for q in p["qs"] if q["c"] in p["concepts"]}
    stubs = {}
    for module in p.get("videos", []):
        m = narration(module)
        t = json.loads(times_path(track, page, module).read_text())
        print(f"\n## Video {module}")
        for ch, title in m["da"].CHAPTERS.items():
            mark = "has questions" if ch in asked else "NO QUESTION" if title not in SKIP_CHAPTERS else "summary"
            print(f"\n### {ch} {title} [{mark}]")
            keys = [k for k in m["da"].LINES if chapter(k) == ch]
            for k in keys:
                print(f"- {k}{' (deeper only)' if '_F_' in k else ''}: {m['da'].LINES[k]}")
            if mark == "NO QUESTION" and keys:
                line = next((k for k in keys if "_F_" not in k), keys[0])
                stubs[ch] = {"da": title, "en": m["en"].CHAPTERS[ch], "file": module, "line": line,
                             "fp": t["fp"][ch], "task": "", "tfp": ""}
    print("\n## Simulator tasks (id: title, deeper-only marked)")
    for i, t in tk.items():
        print(f"- {i}: {t['da']['title']}{' (deeper)' if t['da']['deep'] else ''}: {t['da']['text'][:110]}")
    print("\n## Concept stubs for chapters without questions (fill in task, then accept)")
    print(json.dumps(stubs, ensure_ascii=False, indent=1))


def coverage():
    for track in ("radiography", "ultrasound"):
        data, goals = load(track), GOALS[track]
        print(f"\n# {track} ({goals['source']})")
        for g, v in goals["goals"].items():
            per = {page: sum(g in q.get("goals", []) for q in p["qs"]) for page, p in data["pages"].items()}
            n = sum(per.values())
            where = ", ".join(f"{k} {c}" for k, c in per.items() if c)
            state = "practical (lab)" if v.get("practical") else "NOT COVERED" if not n else f"{n}: {where}"
            note = "" if v["pages"] or v.get("practical") else "  (no video teaches it yet)"
            print(f"- {g:11} {state}{note}")


if __name__ == "__main__":
    cmd, *args = sys.argv[1:] or ["check"]
    if cmd == "check":
        sys.exit(check())
    elif cmd == "accept":
        accept(args[0], args[1], args[2:])
    elif cmd == "skeleton":
        skeleton(args[0], args[1])
    elif cmd == "coverage":
        coverage()
    else:
        sys.exit(__doc__)
