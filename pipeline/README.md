# Offline processing pipeline

Ported from the egodata-venture build (same project, parallel system) on 2026-07-17. This is the layer that turns a raw captured video into a sellable episode, complementing the browser prototype in `public/`:

1. `hand_tracking.py`: MediaPipe 21-landmark extraction over a video file, writes a per-frame parquet. Requires the `hand_landmarker.task` model file (download from the MediaPipe model zoo; not committed to keep the repo lean).
2. `narration_transcribe.py`: transcribes the worker's spoken narration to time-coded text (the voice-labeling path from HARDWARE.md).
3. `task_segmenter.py`: maps narration segments to a `verb(object)` task taxonomy via keyword rules and merges consecutive labels. Prototype-grade; production swaps in a model fine-tuned on Ego4D or EPIC-KITCHENS.
4. `qa_metrics.py`: the acceptance gate. Hand visibility at least 70 percent of frames, labeled-task coverage at least 60 percent of duration; exit code 0 or 1 so CI and the poller can enforce it.
5. `lerobot_export.py`: exports videos/, data/parquet with a flat 2x21x3 `observation.state` vector per frame, and meta jsonl manifests in the LeRobot convention.
6. `pipeline.py` and `pipeline_poller.py`: orchestration; the poller consumes the ingest backend's manifest queue.
7. `make_sample_video.py` and `test_pipeline.py`: synthetic scripted-hand fixture so the whole pipeline is testable in CI without a human operator.

Dependencies: `opencv-python`, `mediapipe`, `pandas`, `pyarrow` (see each file's imports). The `verb(object)` taxonomy here and the vertical playbook taxonomy in `public/app.js` should converge in one shared file; that unification is the first cleanup task.
