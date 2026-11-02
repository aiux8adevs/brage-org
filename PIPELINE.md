# Pipeline: what is built, what waits for review, what is live

Updated whenever something changes status. Nothing goes online before the owner has approved it.
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

## Waiting for the owner's review
| # | Element | Where | Notes |
|---|---|---|---|
| 3 | Video 3c Andre veje (4) | radiografi/3c-andre-veje | listen: c2_raster (heard "reststof") |
| 4 | Video 4 Skarphed (4) | radiografi/4-skarphed | your fixes: magnification per end, zoom marker, title |
| 7 | Six [tjek] numbers | manim-studio storyboards/spredt_straaling_raster/03_draft.md | Bucky 2–6, 25–45 lines/cm, >10 cm and >60 kV, ... |
| 8 | Danish TTS, 3a | 3a da | s1_opslug (heard "Knorren"); s3_tre re-taken, now "300 mod 250" |
| 9 | ML folder grouping | manim-studio organize_media.py, CATALOG | my guess at course order |

## Open decisions
- How "Brage" should sound: episode uses "Brah-eh"; samples Brah-eh / Braa-uh / Brawa in manim-studio media/podcast/prove/brage/ for the owner to pick.
- ML section: which videos are your own explanations and which build directly on Le Wagon material
  (olf01 shows the challenge's own code, reboot is built on their airbnb challenge). Check before publishing.
- Uncommitted ML code in manim-studio (rl, transformers, ensemble, time_series, mlops, nlp_classic,
  nevi theory videos, their storyboards and tests): commit from the session that made it, or ask me.

## On approval, publishing means
`./sync_videos.sh` (+ move the page from `drafts` to `live` in it), the topic's tabs in
`site/learn/topic.js` (draftTabs to tabs), and a targeted upload of that page (not the whole site:
`deploy.sh` would also upload drafts).

## In production (deadline)
- Note for the 3c review: c2 says the scattered photons "land at random, and that gives noise". Check it against the teaching rule that noise and scatter are kept apart.

## In production
- Podcasts 1a, 1b, 2, 3b, 3c, 4 (English, SoulX): scripts written and reviewed twice each; audio generating. Draft tabs on every topic page (?draft=1#podcast).
- 3c video re-rendered with fog / quantum noise from the scattered photons: waiting for the owner's review.

## Not started / later
- UV5 Røntgenrøret: heel effect, filtration, AEC (video + simulator).
- Podcasts 3b (Ben expert) and 3c (Amy expert), once 3a is approved.
- Possibly warmer host voices designed with Qwen3-TTS.
- ML section on the site (English, one level).
