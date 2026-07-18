# WorkTrace Prototype

WorkTrace is a working application prototype for turning authorized professional physical work into traceable robotics training-data packages. The first program focuses on staging and destaging vacant homes. The application also explores adjacent verticals, worker and partner compensation, pilot economics, buyer packaging, equipment, and funding readiness.

This repository is a prototype. It does not currently record an external USB camera, process real worker data, upload media, or issue real payments.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Validation:

```bash
npm run build
npm test
npm run lint
```

## Demo explainer video

The narrated 1080p prototype walkthrough is at [public/demo/worktrace-demo-explainer.mp4](public/demo/worktrace-demo-explainer.mp4). Captions are provided at [public/demo/worktrace-explainer.vtt](public/demo/worktrace-explainer.vtt).

To rebuild it from the current application screenshots and narration:

```bash
video/render-explainer.sh
```

The video uses rendered prototype screens. It does not show real workers, real property footage, or actual USB-camera capture. The included voiceover was generated with ElevenLabs using the Jarnathan professional voice and the `eleven_multilingual_v2` model. No ElevenLabs API key is stored in this repository. Any reuse of the generated voiceover remains subject to the applicable ElevenLabs account terms.

## Demonstrated workflow

1. Open the authorized demo job, Cedar House 014.
2. Start a sample capture with audio disabled.
3. Add a task marker, such as `Place` or `Correct alignment`.
4. Exercise the worker-controlled privacy pause.
5. Finish the sample session.
6. Verify the prototype annotations.
7. Exclude the segment containing an address label.
8. Approve the episode.
9. Generate the buyer sample package.

The buyer package is a UI demonstration. It represents the expected files and release controls, not a completed robotics dataset.

## Main application sections

- Operations: active staging program, rights status, job progress, and prototype decision gates
- Capture + QA: simulated first-person feed, task markers, privacy pause, review, exclusion, approval, and package generation
- Field kit: equipment list, Android-first USB-C architecture, mobile setup flow, and capture procedure
- Verticals: directional comparison of staging, hospitality, assembly, warehouse, retail, laundry, detailing, maintenance, and care work
- International: task-country matching, one-country rollout gates, fair-pay controls, and region-first data handling for Mexico, Colombia, India, the Philippines, and Vietnam
- Business model: compensation-model comparison and interactive accepted-hour economics
- Sales + funding: buyer offer ladder, VC-readiness gates, and capital sequence

## Recommended prototype equipment

The equipment plan is specified in [Field Capture Playbook](docs/FIELD_CAPTURE_PLAYBOOK.md). The selected bench kit uses the equipment already purchased and totals approximately $45 to $58 before shipping and tax:

- one [ELP 1080P USB camera module with a 100 degree wide-angle lens](https://www.amazon.com/s?k=ELP+1080P+USB+Camera+Module+100+degree+wide+angle), reported at $22 to $35;
- one USB-C OTG data adapter, reported at $6;
- one GoPro hat clip mount, reported at $9;
- one roll of 3M Dual Lock, reported at $8;
- one existing USB-C Android phone and rigid baseball cap.

The Amazon product phrase covers several similar ELP variants. The closest current match found was [ASIN B00K9ZVB04](https://www.amazon.com/dp/B00K9ZVB04), but the received unit's order ASIN or board label is still needed for exact identification. Record the model, sensor, board size, focus type, video formats, and microphone status before testing. Start with 1920 by 1080 MJPEG at 30 fps when that mode is available. Do not use 1080p YUY2 on the likely model family because it is limited to about 6 fps. Sharpness and hand coverage at 40, 60, 80, and 100 cm must pass before buying another unit.

Before anyone wears it for work, add a ventilated enclosure or nonconductive backplate, short safety tether, and cable strain relief. Attach the Dual Lock to the enclosure or backplate, not directly to the exposed circuit board. The GoPro hat clip is not a certified breakaway safety mount.

The current web prototype still simulates the USB connection and cannot record the camera. A native Android USB-host and UVC capture component is the next required software milestone. UVC does not guarantee compatibility with every Android phone, so this remains a phone-specific bench test.

The expected full one-worker range is approximately $940 to $2,250 when purchasing a dedicated phone, powered cable kit, static room camera, calibration materials, and a more durable mount. This is a planning estimate, not a quote.

The base design uses:

- an Android phone with USB host support, 256 GB storage, a modern IMU, and strong battery life;
- a UVC fixed-focus camera recording 1080p at 30 fps with an 85 to 100 degree field of view;
- a low-profile breakaway brim mount and protected camera enclosure;
- a right-angle USB-C data cable routed inside clothing;
- a powered USB-C hub with power-delivery passthrough and a battery pack;
- a static room camera on a compact tripod;
- a calibration board, time-sync light, lens cover, and visible recording indicator.

The exact camera and phone must be tested as a pair before buying multiple kits. Android exposes USB host APIs and can expose external cameras, but support still depends on the device hardware and camera implementation. Apple explicitly documents UVC external cameras for USB-C iPad. A reliable iPhone UVC path is not assumed in this prototype.

## Operating recommendation

Start with a staging-company partner subsidy and a separate worker stipend:

- the normal customer continues paying for the staging service;
- the staging company receives compensation for setup, scheduling, upload, and administration;
- each participating worker receives a clear additive stipend;
- a worker can decline recording without losing normal assignments;
- quality bonuses are calculated at the job level, not from accepted minutes alone.

Free service in exchange for property data rights can be tested later as a limited acquisition campaign. It should not be the default because the data revenue must then cover the entire service, logistics, review, equipment, and worker compensation.

## International collection recommendation

Prove the task specification and buyer value in a controlled United States pilot before collecting internationally. Then replicate one task family with one audited partner in one country. Mexico is the first international candidate for staging and property workflows. Colombia is a strong nearshore option for hospitality and property turnover. India is the preferred Asia capture candidate for controlled service and household-like work. Use the Philippines first for annotation and QA while local counsel confirms how current body-worn-camera privacy guidance applies to the proposed capture model. Vietnam is a stronger match for furniture, garment, kitting, packaging, and other industrial tasks.

International expansion should improve task and environment coverage, not depend on paying workers as little as possible. The operating model pays the normal local skilled-work rate, paid setup and training, a separate recording premium, reimbursed costs, and an upside-only job-level quality bonus. Raw footage remains in a restricted regional vault until country-specific privacy, labor, site-rights, and cross-border-transfer review permits a narrower derivative to leave.

See [International Collection Strategy](docs/INTERNATIONAL_COLLECTION_STRATEGY.md) for the proposed partner structure, rollout gates, and country-task hypotheses. It is an operating draft, not legal advice.

## Funding recommendation

The next financing target is a customer-funded specification sprint, not an institutional VC round. Consider pre-seed capital only after two buyer commitments, an authorized collection partner, tested rights, known accepted-hour economics, and a buyer-defined model evaluation. Larger venture funding makes more sense after measured model value, repeat revenue, and a reusable data advantage are visible.

## Current limitations

- The first-person and static-camera feeds are rendered sample scenes.
- USB-C camera connection is simulated in the web interface.
- No native Android application has been built or hardware-tested yet.
- Hand and object annotations are labeled prototype suggestions.
- Pricing, equipment costs, collection yield, insurance, legal terms, and buyer demand remain planning assumptions.
- The Cloudflare workers.dev URL is a public prototype deployment. It is not a production service or custom-domain launch.

## Technical references

- [Android USB host overview](https://developer.android.com/develop/connectivity/usb/host)
- [Android camera enumeration](https://developer.android.com/media/camera/camera2/camera-enumeration)
- [Android external USB cameras](https://source.android.com/docs/core/camera/external-usb-cameras)
- [ELP camera Amazon search](https://www.amazon.com/s?k=ELP+1080P+USB+Camera+Module+100+degree+wide+angle)
- [Closest current Amazon match, ASIN B00K9ZVB04](https://www.amazon.com/dp/B00K9ZVB04)
- [Likely ELP H100 family](https://www.elpcctv.com/elp-full-hd-1080p-usb-camera-module-cmos-ov2710-sensor-2mp-with-no-distortion-lens-100-degree-p-626.html)
- [Apple external cameras on iPadOS](https://developer.apple.com/videos/play/wwdc2023/10106/)
- [Luxonis OAK-D Lite](https://docs.luxonis.com/hardware/products/OAK-D%20Lite)
- [OSHA ergonomics](https://www.osha.gov/ergonomics/)
- [Stanford BEHAVIOR-1K](https://behavior.stanford.edu/index.html)
