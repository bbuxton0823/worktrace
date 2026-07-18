# ChoreCam capture rig and field protocol (prototype spec)

## Bench-test kit: plug in and use the app today (prices verified 2026-07-17)

The app is plain browser webcam capture, so any driverless UVC camera works on a Mac the moment it is plugged in (macOS has shipped the UVC class driver since 10.4). The app's camera dropdown (appears after the first webcam permission grant) selects the external camera.

**Primary pick, about $80 to $90 total:**

| Item | Price | Why |
|---|---|---|
| OBSBOT Meet SE | $58 | Native USB-C, 33 g, 1080p60 over standard UVC, magnetic mount, ships with C-to-C cable plus C-to-A adapter. The one true small-cheap-USB-C camera verified in stock. Tradeoff: ~78 degree FOV, a bit narrow for two-hand work at brim distance |
| Goliton hat brim clip (GoPro fingers) | $9.95 | Slides onto any cap brim |
| GoPro-fingers to 1/4-20 adapter, 2 pc | $6.88 | Lets a normal camera mount ride the brim clip |
| Adhesive cable clips | $4.99 | Route the cable along the cap and down the collar |

**Wide-FOV alternate (closest to the real Gen 2 spec), about $100:** ELP 100 degree 1080p60 board camera, model ELP-USBFHD08S-LC1100, $69.99. True 60 fps and the right lens, but a bare 38x38 mm PCB with a USB-A plug: add the Syntech USB-A to C adapter 2-pack ($9.99) and velcro or a printed shell for the brim. The Arducam IMX291 160 degree fisheye board ($58.99) is the widest-view option but caps at 30 fps.

**Budget floor, about $55:** NexiGo N60 ($27.99, 110 degree, 1080p30, USB-A) plus the brim clip, thread adapter, and USB adapter.

Discontinued or ruled out: Opal Tadpole (end of life, unavailable), Insta360 Link 2C ($149 and only 79.5 degree), Ray-Ban Meta glasses (3 minute clip cap).

Board-camera assembly notes (Bycha's purchased kit: ELP 100 degree CASED unit, square metal housing, + hat clip + Dual Lock):

- The cased (square housing) unit needs no PCB insulation: mount the housing to the clip directly (Dual Lock or the housing's tripod thread via a GoPro-to-1/4-20 adapter). Bare-board units only: electrical tape on the PCB back first.
- Record the exact model from the received unit's label and USB descriptors before buying more: ELP sells several near-identical titles with different sensors, focus types, and microphones. Treat the mic as present until descriptors prove otherwise and keep audio disabled.
- Set 1920x1080 MJPEG at 30 fps. Do not accept 1080p YUY2 mode, which runs near 6 fps on this camera family.
- Bench-test the exact camera-cable-adapter-phone chain: cold-boot enumeration, reconnect, 20-minute continuous recording for thermal behavior and battery draw. A rigid OTG adapter can lever the phone's USB-C port during movement: switch to a short flexible right-angle OTG pigtail for any worn test.
- The M12 lens is manual focus and usually ships focused near infinity. Twist the lens barrel while watching the app preview until hands are sharp at 40 to 60 cm; a drop of nail polish on the thread locks it.
- Mount under the brim pitched 35 to 45 degrees down. If the image lands upside down, use the app's Rotate 180 button (appears in live mode); the hand tracker runs on the rotated frame so landmarks stay correct.
- The USB-A to C OTG adapter works for plugging into a Mac's USB-C port. On Android phones the camera works only in native UVC apps, not in the browser app (see below).

Compatibility notes that matter:
- Plug the camera directly into the Mac's port. Underpowered USB-C hubs are the single most common reason external webcams fail to appear.
- Two permission layers on macOS: the browser's per-site camera prompt AND System Settings, Privacy and Security, Camera for the browser app itself.
- iPhones cannot host external UVC cameras at all (even USB-C models). USB-C iPads on iPadOS 17+ can, and Safari exposes them to the app. Android browsers cannot see external USB cameras (Chrome closed the request as wontfix), which is exactly why the Gen 2 phone rig requires the native capture app.


Two rig generations, run in sequence. Gen 1 is off the shelf so pilots can start collecting sellable footage immediately. Gen 2 is the integrated hat rig (USB-C camera tethered to a phone app), built and validated while Gen 1 data is already flowing. Prices are approximate 2026 retail and should be re-quoted before buying a fleet.

## Gen 1: pilot kit (off the shelf, per worker)

| Item | Purpose | Est. cost |
|---|---|---|
| GoPro Hero 13 Black | Head camera, 2.7K60 wide FOV | $399 launch, about $429 retail 2026, sale bundles near $300 |
| GoPro head strap mount | Brim-level mounting, pitched down at hands | $25 to $35 |
| 2x spare Enduro batteries + dual charger | Over 2.5 h per battery at 1080p30; lunch swap covers a shift | $80 |
| 512 GB microSD (V30) | 2 to 3 recorded days per card at 2.7K | $45 to $115 |
| Mid-range Android phone (Pixel A-series class) | Companion app: session metadata, labeling, QC, upload | $250 to $350 |
| Phone armband or chest pocket clip | Labeling access with the rig on | $20 |
| 10k mAh PD power bank + cables | Midday top-ups | $35 |
| "Recording in progress" signage + printed consent forms | Consent kit until in-app consent ships | $15 |
| Hard case | Kit integrity between jobs | $30 |

**Total: roughly $780 to $980 per worker.** Amortized over 500 recorded hours, hardware is about $2 per data hour, which is noise next to labor.

Why GoPro for Gen 1, specifically:

- **Embedded IMU telemetry.** GoPro writes gyro and accelerometer streams into the video file (GPMF metadata). Head-motion IMU is exactly what downstream camera-pose and stabilization pipelines want, and it comes free.
- **Multi-camera time sync.** GoPro Labs firmware supports QR-code timecode sync, which is what makes a two or three person staging crew produce genuinely synchronized multi-view episodes.
- **Phone control.** The Open GoPro API (BLE and WiFi) lets the companion app start and stop recording, monitor battery and storage, and pull files, so the Gen 1 workflow already exercises the same app the Gen 2 rig will use.
- Rugged, stabilized, and workers stop noticing it quickly.
- GoPro records on external USB power (belt power bank), though the internal battery does not charge while recording; community guidance caps continuous sessions around 6 hours for heat.

Alternative worth testing side by side: DJI Osmo Action 5 Pro ($349, 146 g) beats GoPro on unplugged endurance (rated 240 minutes at 1080p24 with radios off) and includes 47 GB internal storage, but lacks GoPro's Labs timecode sync and telemetry ecosystem. Ruled out after research: all consumer Meta glasses (Ray-Ban Gen 2, Oakley HSTN) hard-cap clips at 3 minutes; Meta Aria Gen 2 is research-loan only; Vision Pro is $3,699 with a 2 to 2.5 hour battery and enterprise-gated camera access.

## Gen 2: integrated hat rig (the target design, per worker)

| Item | Purpose | Est. cost |
|---|---|---|
| Bump cap (Ergodyne Skullerz class) | Baseball-cap comfort with a rigid shell for mounting | $25 |
| UVC USB camera module, wide lens (ELP or Arducam class, 1080p60) | The camera: board-level, 10 to 20 g, ~120 degree diagonal FOV | $40 to $80 |
| 3D-printed brim mount | Holds the module under the brim, pitched 35 to 45 degrees down | $5 |
| Right-angle USB-C cable + fabric cable clips | Brim, around the shell, collar clip, down to the phone; strain-relieved | $15 |
| Recording witness LED (on the mount, wired to the module) | Everyone present can see when capture is on; a trust feature, not decoration | $3 |
| Android phone (validated model, see caveat) | Runs the capture app; powers the camera over USB-C OTG | $250 to $400 |
| Armband or chest holster | Phone position for labeling taps | $20 |
| 20k mAh PD bank + powered USB-C hub (only if all-day single-phone) | Simultaneous charging and USB host for long shifts | $60 |

**Total: roughly $420 to $610 per worker**, cheaper than Gen 1 and far more integrated.

Design notes:

- **Camera placement**: under the brim, centered, pitched down so hands at working distance (40 to 60 cm) sit center-frame. A ~120 degree diagonal FOV keeps both hands in frame across a wiping or folding envelope without going full fisheye (extreme fisheye complicates downstream use).
- **Power budget**: a 1080p UVC module draws roughly 1 to 2.5 W over the phone's OTG supply. Recording plus USB hosting will not survive a full day on one phone charge; plan a lunch top-up, or the PD-passthrough hub for continuous shifts.
- **The Android UVC caveat (validate before buying a fleet)**: native external-camera support varies by manufacturer. The reliable path is a userspace UVC stack inside the app (libusb/libuvc-based, as used by the established open-source Android USB camera libraries) rather than trusting the OEM camera HAL. Prototype on two or three candidate phone models first.
- **Fallback**: the phone's own camera in a chest mount is a zero-extra-hardware capture mode for testing the app end to end.

## The capture app (spec)

Android first (Kotlin), one screen per step so it works with gloves and wet hands.

1. **Login and job setup**: worker identity, vertical playbook (cleaning, staging, and future verticals as config, not code), site ID.
2. **Consent capture**: in-app signature for property owner or agent and for every crew member on site; the witness LED will not turn on, and recording will not arm, until consent records exist for this session. Consent is stored beside the footage and referenced in the episode manifest.
3. **Rig check**: live preview with on-device hand detection (MediaPipe) driving a hands-visible meter and a hat-angle guide ("tilt down a touch"). This 30-second step is what prevents the industry-standard failure mode: gig-collected footage runs near 50% unusable, and bad framing is the top cause.
4. **Record**: foreground service writing 5-minute H.265 chunk files (crash-safe, resumable). Labeling two ways: big task chips on the phone, or hands-free voice labels where speech is transcribed on-device and the raw audio is immediately discarded (keeps the audio-consent problem out of scope entirely; audio recording stays off by default).
5. **Wrap-up QC**: hands-visible percentage, exposure and blur warnings, per-task segment coverage versus the job's expected tasks. The worker sees their quality score before leaving the site, while a re-shoot costs minutes instead of a repeat visit.
6. **Upload**: WiFi-only background upload with checksums; episode manifest in the `chorecam-episode` schema (see README) linking video chunks, landmark streams, IMU telemetry, labels, and consent records.

The browser prototype in this repo is the working model of steps 3 to 5: open it on a phone and it will run against the phone camera. The Android app is the productized version of the same loop.

## Field capture protocol

- **Framing**: hat-angle calibration at session start via the rig-check meter; target is hands center-frame at working distance.
- **Format**: 2.7K at 60 fps on action cams (the industry-guide sweet spot: half the storage of 4K, dense enough for hand annotation; fast hand motions blur at 30 fps). Roughly 10 to 15 GB per hour at action-cam bitrates; the Gen 2 phone pipeline can encode H.265 leaner.
- **Exposure**: lock manual exposure and color settings and keep them identical across all kits and sessions; training-data guides are emphatic that auto adjustments contaminate the data.
- **Multi-view sync (crews)**: GoPro Labs timecode QR at session start (Gen 1) plus a synchronized open-palm wave at chest height by all crew members, which gives a visual sync event any pipeline can find. Gen 2 phones sync over NTP and timestamp frames at capture.
- **Audio**: off by default. Two-party consent states make audio a liability, and buyers want hands, not conversations. Voice labeling uses on-device transcription only.
- **Session hygiene**: 5-minute chunks, lunch battery swap, end-of-session QC review before leaving the property.
- **Acceptance targets (QC gate for payment)**: at least 85% hands-visible frames, correct exposure, every labeled segment at least 10 seconds, at least one complete task episode per segment. Footage failing the gate does not get sold and does not count toward paid data hours, which aligns worker incentives with the rig check.

## Data logistics

At 10 to 15 GB per hour, a 20-hour pilot is 200 to 300 GB: trivial. A 10-crew operation at 25 hours a week each is roughly 2.5 to 4 TB a week: still comfortable on commodity object storage, with cost dominated by labeling labor, not bytes. Upload reality check: US median fixed upload is about 58 Mbps (roughly 26 GB per hour sustained), so a 6-hour 1080p day uploads overnight but a 4K day does not; plan on 2.7K capture plus card rotation to a local hub for below-median connections. Industry guides also say to budget 10 to 15 percent of program time for privacy processing (face and screen blurring) and expect a 3-hour session to yield 2 to 2.5 usable hours. Raw footage retention policy, blur-before-leaving-device for occupied-home verticals, and consent-file storage sit in the privacy pipeline (see README privacy notes).
