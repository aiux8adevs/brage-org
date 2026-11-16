# Pipeline: what is built, what waits for review, what is live

Updated whenever something changes status. Nothing goes online before the owner has approved it.

**Ground rule: privacy by design.** The site is built and run on privacy-by-design principles as far
as possible: collect nothing that is not needed, no cookies, tracking or third-party resources, data
kept within the EU/EEA, and privacy-friendly defaults. New features and changes are checked against
this before they go online.
Media lives in `~/projects/manim-studio/media/brage-org/<section>/<topic>/`
(from Windows: `\\wsl$\Ubuntu\home\aiux8\projects\manim-studio\media\brage-org\`).
Local test of drafts: `cd ~/projects/obrage-site/site && python3 -m http.server 8765`, then add `?draft=1`.

## Live on brage.org
| Element | Since |
|---|---|
| 1a Fra foton til tal: video (4 versions) | 2026-11-01, outro without tool credit 2026-11-02 |
| 1b Fra tal til billede: video (4) + simulator | 2026-11-01, outro without tool credit 2026-11-02 |
| 4 Skarphed: simulator | before 2026-11-01 |
| 3 Spredt stråling: simulator (air gap fixed) | 2026-11-02 |
| 3a Spredt stråling: video (4) + PDF | 2026-11-02 |
| 3a Spredt stråling: podcast (EN, 9:20) | 2026-11-02 |
| 3b Rasteret: video (4) + PDF | 2026-11-02 |
| 2 Støj: simulator | 2026-11-02 |
| 2 Støj: video (4) + PDF | 2026-11-02 |
| 1a Fra foton til tal: simulator | 2026-11-02 |
| Spredt stråling: compression task in the simulator | 2026-11-02 |
| 1a and 1b: podcasts (EN) | 2026-11-02 |
| 2 Støj: podcast (EN) | 2026-11-02 |
| 4 Skarphed: podcast (EN) | 2026-11-02 |
| 4 Skarphed: video (4) + PDF | 2026-11-02 |
| 5 Røntgenrøret: simulator (reworked, 19 tasks + formula group); page shows the simulator tab only | 2026-11-13 |
| 2 Støj: simulator, reworked version (ed956be) | 2026-11-13 |

## Waiting for the owner's review
| # | Element | Where | Notes |
|---|---|---|---|
| 3 | Video 3c Andre veje (4) | radiografi/3c-andre-veje | listen: c2_raster (heard "reststof") |
| 7 | Six [tjek] numbers | manim-studio storyboards/spredt_straaling_raster/03_draft.md | Bucky 2–6, 25–45 lines/cm, >10 cm and >60 kV, ... |
| 8 | Danish TTS, 3a | 3a da | s1_opslug (heard "Knorren"); s3_tre re-taken, now "300 mod 250" |
| 9 | ML folder grouping | manim-studio organize_media.py, CATALOG | my guess at course order |
| 10 | Podcasts 3b, 3c (EN) | each topic page ?draft=1#podcast; radiografi/<topic>/podcast_en.mp3 | 6–9 min each, all chunks pass Whisper |
| 11 | UV5 Røntgenrøret: videos 5a + 5b (4 each) + PDFs (simulator already live) | tube/?draft=1 (synced to site/, local only) | rendered 2026-11-13, audio QA passed. 5b da listen by ear: a4_rex (Whisper heard "vaks"), a3_placering ("AI" for AEC), a4_1b, a5_F_kv. Same spelling of REX/AEC as the approved 1b |

## Open decisions
- How "Brage" should sound: episode uses "Brah-eh"; samples Brah-eh / Braa-uh / Brawa in manim-studio media/podcast/prove/brage/ for the owner to pick.
- ML section: which videos are your own explanations and which build directly on Le Wagon material
  (olf01 shows the challenge's own code, reboot is built on their airbnb challenge). Check before publishing.
- Uncommitted ML code in manim-studio (rl, transformers, ensemble, time_series, mlops, nlp_classic,
  nevi theory videos, their storyboards and tests): commit from the session that made it, or ask me.

## On approval, publishing means
`./sync_videos.sh` (+ move the page from `drafts` to `live` in it, and add `:podcast` for an approved
podcast), the files and page added to the whitelist in `publish.rules`, the topic's tabs in
`site/learn/topic.js` (draftTabs to tabs), and then `./deploy.sh` (dry run) and `./deploy.sh --go`. `publish.rules` keeps drafts
and unapproved media local, and `--checksum` skips files whose contents have not changed.

## In production (deadline)
- Note for the 3c review: c2 now says the scattered photons "bring their own quantum noise" (checked 2026-11-13); confirm when you listen.

## In production
- 3c video re-rendered with fog / quantum noise from the scattered photons: waiting for the owner's review.

## Ultrasound module, 5th semester (plan approved 2026-11-13, not started)
**Purpose:** the site *replaces* the physics teaching. About 12 lessons in all, at most 3 for physics; the students
learn the physics on their own here so class time goes to clinical scanning and diagnostics. So it must cover
everything in the current 49 slides, plus Doppler and safety (in the learning outcomes, missing from slides and videos),
and check understanding itself (no teacher present).

**Today's material (context only, nothing copied in):** 49 slides; hands-on exercise (21 points, kidney, knobology);
5 pages of terms from Gibbs, Cole & Sassano; six English YouTube videos (What is Sound, Basic US Physics for EM,
Sinai Ultrasound Basics, Ultrasound Podcast physics, Clarius 1 and 2). Gaps in all of them: aliasing/PRF, angle
correction, TI/MI, and links from physics to the students' own examinations (aorta, DVT, kidneys, liver and biliary tract).

**Topics** (same format as radiography: video DA/EN × 2 levels, simulator with ~18–20 tasks, PDF):
| # | Topic | Content | Simulator |
|---|---|---|---|
| U1 | Lyd og ekko | sound, frequency/wavelength, 1540 m/s, pulse-echo, grey scale, echogenicity with tissue examples | pulse-echo: time → depth |
| U2 | Lyd møder væv | impedance, reflection, scatter/speckle, refraction, absorption, attenuation, divergence | layered phantom: frequency vs depth |
| U3 | Proben og strålen | piezo, probe types, field of view, focusing, beam profile, resolution (axial, lateral, slice thickness, contrast, temporal), harmonics | beam width, focus, frame rate |
| U4 | Knapper og orientering | gain, TGC, depth, zoom, sector width, frequency, dynamic range, line density, focus; indicator, scan planes | virtual kidney following hands-on points 5, 8–16 |
| U5 | Artefakter i klinikken | reverberation/comet tail, shadow, enhancement, edge shadow, mirror, side lobe, speckle, anisotropy, slice thickness, each linked to stone, cyst, fatty liver, needle, tendon | artefact lab: place cyst/stone/gas/needle |
| U6 | Doppler og sikkerhed | Doppler effect, angle (<60°), colour/power/spectral, scale/PRF, aliasing, wall filter; compression is the primary DVT test; TI/MI, ALARA, probe hygiene | vessel + compression + TI/MI readout |

Plus: own glossary (own wording, not the book's) and a self-test quiz per topic, run in the browser only, nothing stored.
**Build order:** U4 and U5 first (most use in the lab and for diagnostics), then U6, U1–U3.
**Rules:** own simulated images only (no real US images: licence and consent); YouTube videos as plain links at most,
never embedded (third-party resources break privacy by design). Pages under site/learn/ultrasound/, kept local by the
learn whitelist until staging exists.

**Staging (live 2026-11-13):** folders are protected where they live (no separate /staging/ path, so relative
links stay valid). A staged folder has its own `.htaccess` with Apache Basic Auth: user "preview", one shared password
chosen by the owner, password file `/var/www/brage.org/.htpasswd-staging` (outside public_html, untouched by
`--delete`), `noindex`, `no-store`, no cookies. Only to stop students looking early; approval happens in Claude
sessions, not on the site. Staged folders are listed in `staged.list`; `deploy.sh` aborts if one lacks its
`.htaccess` and checks for 401 after `--go`. Go live = delete the folder's `.htaccess`, remove its line from
`staged.list`, link it from the learn page. Now staged: `learn/ultrasound/` (overview page, all six simulators U1–U6, videos for U1–U6, glossary and self-test, behind the password).

**Ultrasound progress:**
| Element | Status | Where | Notes |
|---|---|---|---|
| Overview page U1–U6 | on staging (password), not public | learn/ultrasound/ | U4 is the only active card; the rest say "on the way" |
| U1 Lyd og ekko: simulator | built 2026-11-15 on the owner's "ja" (U1 simulator + video, staging allowed); on staging (password), waiting for review | learn/ultrasound/echo/ | own model; linear probe, two scenes (liver with fat, muscle, calcification + shadow, vein, cyst, haemangioma; phantom with wire column, wire pairs 2/1/0.5 mm, four cylinders); pulse travelling down and echo coming up over time, A-line graph, pulse shape at fixed scale; frequency, cycles (2/3/5), depth, fat layer (1450 m/s), scanner speed (deeper level); penetration 70/f as U4; 18 tasks + 2 deeper, no formula tasks |
| U2 Lyd møder væv: simulator | built 2026-11-15 on the owner's "næste emne, simulator og video" (read as yes to the U2 restatement); on staging (password), waiting for review | learn/ultrasound/tissue/ | own model; each line followed down as a beam: impedance reflection R at boundaries, specular echo with angle lobe (narrower at higher f) vs rough −12 dB, attenuation per tissue (soft 0.5, fat 0.6, muscle 1.0, fluid 0, bone 20 dB/cm/MHz), Snell refraction with total reflection (bone 22°), reverberation copies at air, gel on/off; body scene (fat, muscle, rib, liver, gallbladder, bowel gas) and phantom (2 cm layer: fat/muscle/fluid/bone/air, tilt 0–30°, smooth/rough, wires at 8 and 12 cm); graph of one-way strength against depth with soft-tissue reference and noise limit; 18 tasks + 2 deeper, no formula tasks |
| U2 video (DA/EN × 2) and PDF | rendered 2026-11-15, waiting for the owner's review | manim-studio media/brage-org/ultralyd/u2-vaev/ | 4 versions (DA 5:13/6:01, EN 5:48/6:38) + 2 PDFs; formulas only at the deeper level (R from impedances); images are stills from the U2 simulator; audio QA passed. Listen by ear (DA): v4_forst, v3_galde, v2_tarm, v2_gel ("gel" heard as "gæld"), v3_skraa. [tjek] items 1–5 in storyboards/ultralyd_tissue/01_draft.md. Not on the site yet: no video tab |
| U3 Proben og strålen: simulator | built 2026-11-15 on the owner's "Ja" to the U3 restatement (simulator + video, staging allowed); on staging (password), waiting for review | learn/ultrasound/probe/ | own model; linear/curved/phased probe on a resolution phantom (wire column, axial pairs 2/1/0.5 mm, lateral pairs 3/2/1 mm at 5/9/13 cm, cysts 2/4/6 mm at 1.6/7/15 cm, ±dB contrast discs at 11 cm); field worked out along each probe's lines and scan converted; transmit focus with 1–3 zones + dynamic receive focus (as U4), fixed elevation lens per probe (cysts fill in), side-lobe haze, harmonics (narrower beam, −12 dB side lobes, reach ×2/3); magnifier 2.6 cm; graph of lateral width, slice thickness and axial resolution against depth; 'seen as two' = 10 dB dip; 17 tasks + 2 deeper, no formula tasks |
| U3 video (DA/EN × 2) and PDF | rendered 2026-11-15, waiting for the owner's review | manim-studio media/brage-org/ultralyd/u3-proben/ | 4 versions (DA 6:05/6:35, EN 6:44/7:21) + 2 PDFs; formulas only at the deeper level (width ≈ λF, frame-rate formula); images are stills from the U3 simulator; audio QA passed. Listen by ear (DA): p4_lin, p4_cyster, p3_flyt (Whisper heard "storen" for "strålen"), p6_effekt, p3_soejle ("trådet"). [tjek] items 1–5 in storyboards/ultralyd_probe/01_draft.md. Not on the site yet: no video tab |
| U4 Knapper og orientering: simulator | approved by the owner 2026-11-14; on staging (password), not public | learn/ultrasound/knobs/ | own B-mode model (model.js), long + transverse kidney, 20 tasks + 3 deeper (formula group removed 2026-11-15); tasks are general knobology (owner chose this over the hands-on points, adjust later) |
| U4 video (DA/EN × 2) and PDF | rendered 2026-11-14, waiting for the owner's review | manim-studio media/brage-org/ultralyd/u4-knapper/ | 4 versions (DA 5:47/7:15, EN 6:31/8:05) + 2 PDFs; audio QA passed. Listen by ear (DA): k1_hilus, k1_billede, k2_F_tal, k4_F_ind, k2_gain/k2_regel ("gain" said as "gejn"). Storyboard decisions a/b approved; podcast decided later with the whole package. [tjek] items 1–4 still open. Not on the site yet: the knobs page has no video tab |
| U5 Artefakter i klinikken: simulator | waiting for the owner's review (built 2026-11-14); on staging since 2026-11-15 | learn/ultrasound/artefacts/ | own model; two scenes (abdomen convex, surface linear); shadow, enhancement, reverberation, comet tail, mirror, edge shadow, side lobes (abdomen only), harmonic imaging, slice thickness, fatty liver, anisotropy, needle angle; 20 tasks + 2 deeper (formula group removed 2026-11-15); overview card active; local only |
| U6 Doppler og sikkerhed: simulator | built 2026-11-15 overnight on the owner's go ("næste emne, simulator og video ... læg online undervejs"); on staging (password), waiting for review | learn/ultrasound/doppler/ | own model; groin, linear probe; long scene (CFA + CFV: colour, power, spectral, steer, heel-toe, angle correction, PRF, baseline, wall filter, Doppler frequency, stenosis) and across scene (compression for DVT, fresh/older clot); MI/TI from output, mode, PRF; 25 tasks + 1 deeper (formula group removed 2026-11-15). [tjek] safety wording (BMUS TI 0.7 foetus, MI 0.7 contrast), probe hygiene wording, CFV medial on the right of the screen |
| U1 video (DA/EN × 2) and PDF | rendered 2026-11-15, waiting for the owner's review | manim-studio media/brage-org/ultralyd/u1-ekko/ | 4 versions (DA 5:14/6:05, EN 5:37/6:27) + 2 PDFs; no formulas (also deeper); images are stills from the U1 simulator; audio QA passed. Listen by ear (DA): e2_fedt, e3_skarp, e1_linje, e3_valg ("sene"), e5_prov ("hæmangiomet"). [tjek] items 1–5 in storyboards/ultralyd_echo/01_draft.md. Not on the site yet: no video tab |
| U6 video (DA/EN × 2) and PDF | rendered 2026-11-15 overnight, waiting for the owner's review | manim-studio media/brage-org/ultralyd/u6-doppler/ | 4 versions (DA 6:18/7:40, EN 7:05/8:38) + 2 PDFs; images are stills from the U6 simulator; audio QA passed (EN deeper: 10 s caption hold after d3_F_bred, reading time, as in U4). Listen by ear (DA): d2_F_nyq, d5_mode, d5_hyg, d1_styr, d0_blod ("doppler" and "trombe" are often misheard by Whisper but may be fine). [tjek] items 1–5 in storyboards/ultralyd_doppler/01_draft.md. Not on the site yet: no video tab |
| Ultrasound video tabs | online on staging 2026-11-16 on the owner's "vil du lægge video online ... stadig under staging beskyttelse med kodeord" | learn/ultrasound/usvideo.js + .css | tabs Video / Simulator / Glossary and PDF / Test yourself on U1–U6; the video follows the page's language and level; previous / next links on all six pages (U6 → self-test). Files copied by sync_videos.sh (ultrasound block, always synced: the folder is staged). Stills scripts now open the simulators with #simulator |
| Ultrasound glossary | built 2026-11-16 on the owner's "byg blot ultralydssporet så komplet som uligt med hvad vi har nu"; on staging, waiting for review | learn/ultrasound/glossary/ | 53 terms in 6 groups, DA/EN, own short explanations, search in both languages, filter per topic. [tjek] U1/U4 say "billedfrekvens", U3 says "billedhastighed": pick one |
| Ultrasound self-test | built 2026-11-16; fourth tab on every topic page (owner: "ja, ingen lagring på enheden"); reworked 2026-11-16 to cover the learning outcomes (owner: "ja det er rigtigt forstået"); on staging, waiting for review | learn/ultrasound/selftest.json, learn/selftest.js, quiz/ | 6–8 questions per topic (43), each tagged with the learning outcomes it covers (selftest/goals.json, study programme 5.4); the result lists weak concepts with "▶ watch the video from m:ss" and "try the task". Answers in memory only: no cookies, no storage, nothing sent. The quiz/ page uses the same data. See "Self-tests" below |
| Radiography self-test | built 2026-11-16, reworked to the learning outcomes; reviewed and validated by the owner 2026-11-16 ("jeg har gennemgået spørgsmål og valideret"); live on brage.org 2026-11-16 | learn/radiography/selftest.json, topic.js | 7–8 questions per page (47). Video links only for videos the page shows: questions on 3c (scatter) and 5a/5b (tube) show only the task link until those videos are approved. Not covered: artefacts (no video), organ programs only via b5_protokol |
| U5 video (DA/EN × 2) and PDF | rendered 2026-11-16 on the owner's "byg blot ultralydssporet så komplet som uligt med hvad vi har nu"; on staging, waiting for review | manim-studio media/brage-org/ultralyd/u5-artefakter/ | 4 versions (DA 6:31/6:57, EN 7:18/7:49) + 2 PDFs; formulas only at the deeper level (d_n = n·d_0, f = 2r/e); images are stills from the U5 simulator; audio QA passed. Listen by ear (DA): a6_sene ("svagere" heard as "sværere"), a2_kopier, a5_snit, a0_billede, a6_spids. [tjek] items 1–5 in storyboards/ultralyd_artefakter/01_draft.md |

Owner answers 2026-11-14: pyramids −12 dB ok, penetration 70/f ok, kidney 8.7 cm ok, no aorta ok.
Penetration rule 70/f cm (a teaching simplification); read zoom only (write zoom described in a task); frame-rate
numbers from 1/2/3 lines per degree. Deploying uploads to the staged folder only (behind the password).

**Coordination between sessions on this repo (agreed 2026-11-13):** each session commits only its own paths
(`git add <paths>`, never `-A`); re-read PIPELINE.md before editing and keep to your own section; message the other
session before touching publish.rules, deploy.sh, .htaccess, learn/topic.js or learn/index.html, and before any
`./deploy.sh --go`.

## Self-tests: how they stay in step with the videos and simulators (2026-11-16)
Every topic page ends with a self-test. The questions are in `site/learn/<track>/selftest.json`; each question has a
concept, and each concept points to a narrated **line key** (e.g. `a2_kopier`) and a simulator **task id** (`group:item`,
rendered as `<details data-id>`), never to a time or a title. `selftest/selftest.py` keeps them honest:

- `./sync_videos.sh` measures where every line starts in all four versions (manim-studio `line_times_page.py`, clip
  cross-correlation) and stores a fingerprint of each chapter's narration in `video/times*.json`. A re-render therefore
  moves the "watch from m:ss" links by itself.
- `python3 selftest/selftest.py check` (run at the end of sync and at the start of `deploy.sh`, which stops on an error)
  fails when a line or task is gone, and when the narration of a chapter or the text of a task has changed since the
  question was written. It names the questions to re-read; after review, `selftest.py accept <track> <page> <concept>`
  stores the new fingerprints. Example: rewording `n4_kv` (see below) will flag noise question 4.
- New topic: `selftest.py skeleton <track> <page>` prints the page's learning outcomes, every chapter with its lines (marked
  with or without questions), the simulator's tasks with ids, and concept stubs. Write the questions (DA/EN, one or more
  outcomes each, aim for 6–8, prefer "you see X, what do you do"), then `accept` fills in fingerprints and task titles.
- `selftest.py coverage` lists the learning outcomes and how many questions cover each; `goals.json` has the outcomes
  (shortened from the study programmes) and which pages teach them.
- In the simulators, opening a task in the list also shows it in the task card beside the simulator (all 12, 2026-11-16).

## Private learning area: maths for 9th-grade exam (decided 2026-11-16; step 1 built)
**Purpose:** a private area on brage.org for one pupil (the owner's son, 8th grade, about halfway through the year),
preparing for the written maths exam FP9 in early May 2028. Basis: the ministry's exam guide (Oct 2025) and the new
subject plan for maths (second draft June 2026; the final plan applies from 1 Aug 2027, so his exam follows it; recheck
the plan and the exam rules in Aug 2027).

**Owner's decisions (2026-11-16):**
1. Behind its own password on brage.org, **no name anywhere** (not in URLs, text, files or commits).
2. His class uses GeoGebra; he also does tasks on Skoledu. Textbook system and current topics: the owner will ask.
3. Progress must survive a change of computer: GDPR is less critical here (one known user, the owner's own server),
   but progress must not disappear. The folder structure must allow more subjects later.
4. Start with a diagnostic test and a trainer for the exam part without aids. Add **real games** that are fun in
   themselves (not quiz-with-praise), as a supplement to the structure, for geometry, rules of arithmetic and anything
   else that suits.

**Structure (proposed, to be confirmed):** `site/elev/` = the area (own .htaccess, own password file
`/var/www/brage.org/.htpasswd-elev`, created by the owner on the server), `site/elev/<subject>/` per subject
(`matematik/` first), shared code in `site/elev/shared/`. Progress: a small PHP endpoint behind the same password writes
JSON to a folder outside public_html (`/var/www/brage.org/elevdata/`), with a copy in the browser; the server copy wins
on a new computer. Server checked: PHP 8.5, writable home outside public_html.

**Order:** (1) diagnostic + trainer "uden hjælpemidler" for 8th-grade topics; (2) games and explore pages
(functions/growth, geometry, statistics/probability) with self-tests; (3) trainer "med hjælpemidler" (context tasks,
written reasoning, GeoGebra guides) in 9th grade; (4) timed mock exams and open problems, spring 2028.
Old exam sets on prøvebanken.dk are linked, never copied; all tasks on the site are our own.

**Built 2026-11-16 (step 1, commit 0ea279f, deployed behind /elev/, 401):** front page with subjects; maths trainer
for the part without aids: 24 topics x 3 levels (task generators, 28,800 generated tasks checked), answers read in the
exam's notation and checked by value (check.js), worked solution per task, diagnostic (one task per topic), adaptive
practice (3 right in a row up, 2 wrong down; weak and long-unseen topics first), timed 60-min test that survives a
reload (seeded tasks). Progress: append-only events, browser copy + elev/api/progress.php (tested on the server with
PHP CLI: adds, ignores duplicates, drops invalid events, data folder 0700). Waiting: the owner creates
/var/www/brage.org/.htpasswd-elev; the owner asks the school about textbook system and current topics.

**Built 2026-11-16 (step 2, commit 5b02d50, deployed, 401):** owner "Ja til alt": progress per login (one Basic Auth
user per family member, elevdata/<user>.json, browser copy per user, header "Gemt online kl. …" + save-now button;
tested on the server with PHP CLI incl. a header-only login and a path trick). Games in pixel style (owner: not
everything about dogs; likes low-poly or pixel games), shared kit shared/pixel.js (own 3×5 font, fixed-step loop,
Web Audio blips): Støvsugerkrigen (primes split numbered robot vacuums; Fable's adaptation rule) and Prelleskud (tank
bank shots by angle in degrees; aim line shortens with level; bounce angles drawn after each shot; 750 generated
stages all solvable, none with an open straight shot). Login test with the owner waits for the password file
(owner: "så laver vi login i morgen").

**Step 3 (2026-11-16):** guest login "gaest" never stored online, local top 10 per game with nicknames, "En ven
spiller" box keeps a friend's run out of the pupil's progress (dc6ab7a). Then Fable reviewed and fixed both games on
the owner's "Lad fable reviewe og rette spillet til" (commit after dc6ab7a): Prelleskud lives bug, nickname box
stealing game keys, readable robot numbers, cannons no longer win alone, separate maths and pace dials, aim shows
bounce angles, lost stages show a hitting angle, new point scale (old local top-list entries end at the bottom).
Fable's next ideas: left-hand keys, 11/13 robots or endless mode for strong players, Prelleskud slanted walls and a
typed-angle bonus shot, portrait phones.

**Game ideas (Fable, 2026-11-16, on the owner's "Vil du bede fable se på muligheder"):** nine concepts with a shared
adaptation rule (separate dials for maths and action, aim for 75–85 % success, invisible adjustment, 70 % at level and
30 % on the weakest topic). Fable's ranking: (1) vacuum-robot tower defense where dogs bite numbers apart by prime
factors, (2) dog-on-a-leash garden puzzle (Pythagoras, coordinates, circle), (3) arena roguelike where the weapon is a
chain of operations (order of operations), (4) dog tanks with bank shots (angles). Also: vertical shooter with
operation gates, laser-pointer lines (y = ax + b), cargo-plane balance (equations), treat machine (probability), dog
show statistics (weakest). Gaps: area/volume, units. Owner to choose.

**Earlier game ideas (Claude)** (own designs in known genres, no copies of existing games):
- Card battler with operation cards (+7, ×2, ², √, ÷3, negatives, fractions): hit the enemy's number exactly in few
  moves; new cards and bosses with rules between fights. Trains order of operations, powers, fractions, mental maths.
- Angle golf on a coordinate grid: aim by angle, bank shots by reflection, set the power by distance (Pythagoras);
  later holes with similar triangles and shadows.
- Function artillery: shoot over hills with y = ax + b (later exponential), against the computer.
- Prime factory: numbers on conveyor belts, machines that divide; orders for prime factors, reduced fractions, squares.
- Kiosk tycoon: buy, mark up in %, discounts, VAT, loans with interest; weather data to forecast sales.
- Fair or not? Design a dice game, simulate thousands of rounds, find the house edge.

## Not started / later
- When videos 5a/5b go live: tube tabs back to video/simulator/handout/selftest in topic.js, add video/times_roer5a.json and times_aec5b.json to publish.rules (self-test links), add tube media to publish.rules and live list in sync_videos.sh, and change the tube subtitle in tube.js ("Simulatoren er klar; to videoer er på vej").
- Noise video, line n4_kv (DA+EN): reword so it does not sound as if CNR falls with kV; the trade-off shows at the same detector dose (REX). Owner said yes 2026-11-13; do with the next video round.
- Possibly warmer host voices designed with Qwen3-TTS.
- ML section on the site (English, one level).


**Formula tasks dropped (owner 2026-11-15):** "jeg tror overordnet vi skal droppe formelopgaverne .... det er ikke det de bruger deres tid på i klinik". Formula groups removed from U4, U5 and U6; U1 made without. Owner answer 2026-11-15: "formler må gerne være der i video": formula lines in the videos stay.
