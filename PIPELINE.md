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

## Waiting for the owner's review
| # | Element | Where | Notes |
|---|---|---|---|
| 3 | Video 3c Andre veje (4) | radiografi/3c-andre-veje | listen: c2_raster (heard "reststof") |
| 7 | Six [tjek] numbers | manim-studio storyboards/spredt_straaling_raster/03_draft.md | Bucky 2–6, 25–45 lines/cm, >10 cm and >60 kV, ... |
| 8 | Danish TTS, 3a | 3a da | s1_opslug (heard "Knorren"); s3_tre re-taken, now "300 mod 250" |
| 9 | ML folder grouping | manim-studio organize_media.py, CATALOG | my guess at course order |
| 10 | Podcasts 3b, 3c (EN) | each topic page ?draft=1#podcast; radiografi/<topic>/podcast_en.mp3 | 6–9 min each, all chunks pass Whisper |
| 11 | UV5 Røntgenrøret: videos 5a + 5b (4 each) + PDFs | tube/?draft=1 (synced to site/, local only) | rendered 2026-11-13, audio QA passed. 5b da listen by ear: a4_rex (Whisper heard "vaks"), a3_placering ("AI" for AEC), a4_1b, a5_F_kv. Same spelling of REX/AEC as the approved 1b |
| 12 | UV5 simulator (spectrum/filter, heel, AEC; 13 tasks + 3 deeper) | tube/?draft=1#simulator | no JS errors, phone OK; ref label overlap fixed 2026-11-13. Fewer tasks than the ~18–20 target |

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

**Staging (agreed, not built):** `brage.org/staging/` behind Apache Basic Auth in `.htaccess`: one shared password,
generic user name "preview" (no personal names in server logs), password file outside public_html, `X-Robots-Tag: noindex`,
no cookies. Only to stop students looking early; approval itself happens in Claude sessions, not on the site.
Go live = move from staging/ to learn/. Needs changes to publish.rules (keep `- /learn/*/`), maybe deploy.sh and
.htaccess.

**Coordination between sessions on this repo (agreed 2026-11-13):** each session commits only its own paths
(`git add <paths>`, never `-A`); re-read PIPELINE.md before editing and keep to your own section; message the other
session before touching publish.rules, deploy.sh, .htaccess, learn/topic.js or learn/index.html, and before any
`./deploy.sh --go`.

## Not started / later
- Possibly warmer host voices designed with Qwen3-TTS.
- ML section on the site (English, one level).
