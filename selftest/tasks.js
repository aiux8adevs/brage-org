// Print a simulator's task list as JSON, read straight from its source: the object T at the top of the file holds the
// tasks per language as groups [name, items, level?], each item [title, question, answer, flags?].
//   node selftest/tasks.js site/learn/radiography/noise/noise.js
// Output: {"da": [{"id": "0:0", "title": ..., "text": ..., "deep": false}, ...], "en": [...]}. The id is "group:item",
// the task's place in the full list; the pages render it as <details data-id> and the self-test links to it.
// Only model.js (if any), the code before T and T itself are run (in a sandbox with no page), so nothing in the simulator starts.
const fs = require("fs"), vm = require("vm");
const src = fs.readFileSync(process.argv[2], "utf8");
const start = src.search(/^const T = \{/m);
if (start < 0) throw new Error("no 'const T = {' in " + process.argv[2]);
const end = src.indexOf("\n};", start);                        // T ends at the first "};" at the start of a line
const code = src.slice(0, end + 3).replace(/^const T = /m, "var T = ");
const box = vm.createContext({ Math, console: { log() {} } });
// some simulators keep their physics in model.js beside them, loaded first by the page; T may use its constants
const model = require("path").join(require("path").dirname(process.argv[2]), "model.js");
if (fs.existsSync(model)) vm.runInContext(fs.readFileSync(model, "utf8").replace(/^const (\w+) =/m, "var $1 ="), box);
vm.runInContext(code, box);
const out = {};
for (const lang of ["da", "en"]) {
  out[lang] = [];
  box.T[lang].groups.forEach(([g, items, lvl], gi) => items.forEach((it, ii) => out[lang].push({
    id: `${gi}:${ii}`, group: g, title: it[0], text: it[1],
    deep: lvl === "deep" || !!(it[3] && it[3].deep) })));
}
process.stdout.write(JSON.stringify(out));
