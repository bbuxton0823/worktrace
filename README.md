# WorkTrace

Turn authorized physical work into traceable robotics data. This is the master repository, combined on 2026-07-17 from the best parts of three parallel prototype builds of the same idea:

- **chorecam-prototype** (Claude Code build): the browser capture app with live MediaPipe hand tracking, the WebGL landing experience, the narrated explainer film, the sourced business research, and the deployment pipeline. Deployed at https://chorecam.buxtonbycha.workers.dev (the ChoreCam name predates the WorkTrace naming decision; the deployed prototype still carries it).
- **egodata-venture** (parallel build): the offline processing pipeline, FastAPI ingest backend, Flutter capture app, and the real-person demo footage used in the film.
- **worktrace-prototype** (parallel build): the trace ontology, rights gates, field capture playbook, international collection strategy, the interactive trace-console site, and the investor deck.

Everything here is a prototype. Nothing is in production.

## Map

| Path | What it is | Origin |
|---|---|---|
| `public/` | Browser capture app (`app.html`), WebGL landing (`index.html`), explainer film (103 s, real POV footage, Rachel narration) | chorecam + egodata footage |
| `pipeline/` | Offline processing: hand tracking to parquet, task segmentation, QA acceptance gate (70 percent hand coverage, 60 percent label coverage), LeRobot-style export, capture verification harness, CI fixture | egodata |
| `backend/` | FastAPI ingest: presigned R2/S3 upload URLs, shared-secret auth, manifest queue, tests, Docker | egodata |
| `capture-app/` | Flutter reference implementation of the phone capture app | egodata |
| `site-worktrace/` | The interactive WorkTrace trace-console site (Next.js on Cloudflare Workers), deployed separately at worktrace-prototype-dev.buxtonbycha.workers.dev | worktrace |
| `docs/` | Field capture playbook (bench tests, MJPEG trap, safety) and international collection strategy (per-country law, regional raw vault) | worktrace |
| `deck/` | Investor deck (19 slides: the WorkTrace deck plus a traction slide) and the episode-tier financial model | worktrace + chorecam |
| `BUSINESS.md` | Deep research synthesis: market, competitors, unit economics, legal, offshore | chorecam |
| `HARDWARE.md` | Rig spec: bench kit (cased ELP under a cap brim on a GoPro clip), Gen 1 GoPro kit, Gen 2 phone rig, field protocol | chorecam + worktrace playbook |

## The episode contract

Every released episode is a package, not a file: `episode.mp4 + imu.parquet`, `annotations.json`, `calibration.json`, `rights-manifest.json`, `data-card.md`, `evaluation-report.json`. Six rights gates block release if any fails: separate worker opt-in, normal pay plus a recording premium, refusal without penalty, a worker-controlled privacy pause, minimum signals (audio and precise GPS off), and no reuse for individual worker surveillance. Every delivery is judged against a written buyer acceptance test.

## Running things

- Browser app and landing: `cd public && python3 -m http.server 4188`, or `npx wrangler deploy` (config in `wrangler.jsonc`, serves the chorecam worker).
- Pipeline: see `pipeline/README.md` (needs `opencv-python`, `mediapipe`, `pandas`, `pyarrow`, and the MediaPipe `hand_landmarker.task` model file).
- Backend: `cd backend && docker compose up`, or `uvicorn main:app`.
- Trace-console site: `cd site-worktrace && npm install && npm run dev`.

## Naming

Decided 2026-07-18: the brand is WorkTrace, displayed as the WORKTR▲CE wordmark (solid triangle as the A: the camera's field-of-view cone, and delta for change of state). The typed name stays plain WorkTrace everywhere a human types it. Canonical URL: https://worktrace.buxtonbycha.workers.dev, with the original chorecam worker serving the same site so old links keep working. The film is `public/worktrace-explainer.mp4` (the earlier ChoreCam-branded cuts remain for history).
