# Field Capture Playbook

This document specifies the first WorkTrace field prototype for professional staging and destaging in authorized vacant properties. It is an operating draft, not legal, employment, safety, insurance, or engineering approval.

## 1. Capture architecture

The base kit records a first-person RGB stream from a lightweight brim-mounted camera connected by USB-C to a dedicated Android phone. The phone remains in a secured belt pouch or pocket and records phone IMU data, task markers, and session metadata. A separate static room camera records whole-body motion and object placement when furniture blocks the first-person view.

```text
Brim-mounted UVC camera
          |
        USB-C
          |
Android field app + phone IMU
          |
Encrypted local session
          |
Trusted Wi-Fi upload after worker closeout
          |
Restricted vault, privacy review, annotation, and QA
```

## 2. Equipment list

### Lowest-cost bench kit

The first bench test uses the equipment already purchased. Prices in this table are the reported Amazon ranges, not independently verified quotes:

| Item | Why it is in the bench kit | Current planning price |
| --- | --- | ---: |
| [ELP 1080P USB camera module, 100 degree wide-angle](https://www.amazon.com/s?k=ELP+1080P+USB+Camera+Module+100+degree+wide+angle) | Small UVC board camera with a USB-A cable. ELP sells several similarly titled models, so record the exact model, sensor, board dimensions, focus type, supported formats, and microphone status from the received unit. | $22 to $35 |
| USB-C OTG data adapter | Converts the camera cable's USB-A plug to USB-C. It must support data, not charging only, and the phone must support USB host or OTG mode. | $6 |
| GoPro hat clip mount | Clips to a rigid baseball-cap brim and allows angle adjustment. It is not a certified breakaway safety mount. | $9 |
| 3M Dual Lock tape | Creates a removable connection between the mount plate and a protected camera enclosure or nonconductive backplate. Do not apply it directly to the exposed circuit board. | $8 per roll |
| Existing Android phone and cap | Reuse a USB-C Android phone and a rigid cap for the bench test. Do not buy a dedicated phone until the pair passes. | $0 |

Reported purchased core-kit total: approximately $45 to $58 before shipping and tax.

Before wearing the camera during work, add a ventilated rounded enclosure or nonconductive backplate, a short safety tether, and cable strain relief. Allow approximately $5 to $15 for these parts if they are not already available. Apply Dual Lock to the enclosure or backplate, not the camera board. Route the cable down the back of the cap and inside clothing, never around the neck.

The Amazon title is not a unique model identifier. The closest current match found during research was [Amazon ASIN B00K9ZVB04](https://www.amazon.com/dp/B00K9ZVB04), but the order ASIN or a photograph of the received board label is required before calling it the exact unit. Comparable ELP 100 degree UVC modules include different sensors, 32 mm and 38 mm board formats, fixed or autofocus lenses, H.264 or MJPEG support, and optional microphones. Treat audio as present until the exact model label and USB descriptors prove otherwise. Keep audio disabled in the application and exported manifest.

UVC and USB OTG do not mean the camera works on every Android phone. The phone must support USB host mode, provide enough power, expose or permit access to the external camera, and run an application with a compatible UVC capture layer. The WorkTrace web prototype does not record this camera. It simulates the setup and capture workflow. The physical kit becomes usable only after the native Android USB-host and UVC recorder milestone in Section 4.

Start the received ELP unit at 1920 by 1080 MJPEG and 30 fps when that mode is exposed. Do not negotiate 1920 by 1080 YUY2, which is limited to about 6 fps on the likely ELP model family. Test sharpness and hand coverage at 40, 60, 80, and 100 cm. Do not order more cameras unless normal staging movements remain sharp, both hands stay in frame, and the received model passes the phone and stability tests below.

Inspect the $6 OTG adapter before a worn test. A rigid adapter can act as a lever on the phone's USB-C port while the worker bends or walks. Use it for the bench test, then switch to a short flexible right-angle OTG data pigtail if the rigid connection moves or protrudes.

### Full one-worker pilot kit

After the bench pairing passes, add the dedicated phone, field power, static room view, calibration materials, and a durable safety-reviewed mount:

| Item | Minimum prototype specification | Purpose | Planning estimate |
| --- | --- | --- | ---: |
| Dedicated Android phone | USB host, 256 GB, modern IMU, strong battery, Wi-Fi 6 | Field app, recording, timestamps, IMU, encryption, upload | $400 to $800 |
| First-person RGB camera | UVC, 1080p30, fixed focus, 85 to 100 degree field of view, USB-C, audio disabled | Hands and active work area | $80 to $250 |
| Mount and enclosure | Low-profile brim clip, quick breakaway, 10 to 20 degree adjustment, rounded enclosure | Stable view without affecting vision | $50 to $150 |
| USB-C power and cable kit | Right-angle data cable, strain relief, powered hub with PD passthrough, 10,000 mAh battery | Reliable connection and longer sessions | $100 to $220 |
| Static room camera and tripod | 1080p or 4K, locked exposure, wide view, stable compact tripod | Whole-body movement and placement | $250 to $650 |
| Calibration and privacy kit | Printed lens board, room reference tags, sync light, lens cover, visible indicator, case | Calibration, synchronization, privacy control | $60 to $180 |

Expected full pilot-kit total: approximately $940 to $2,250.

Optional calibrated subset:

- stereo or depth camera;
- integrated camera IMU;
- wrist IMUs;
- room scan before and after staging;
- rigid calibration target and repeatable camera mount.

An OAK-D Lite is one current depth and IMU candidate. It is not selected equipment until its Android compatibility, power draw, heat, worker comfort, mounting, and frame stability pass testing.

## 3. Camera selection test

Do not select a camera from a spec sheet alone. Test the exact camera, cable, hub, power bank, phone model, operating-system version, and application build together.

The bench test must verify:

1. The phone enumerates the camera after cold boot and reconnect.
2. The lens keeps both hands and the manipulated object sharp at 40, 60, and 100 cm.
3. The application records 1920 by 1080 MJPEG input at 30 fps for 30 minutes without a disconnect, overheating, or unacceptable dropped frames.
4. The application produces H.264 output around 8 to 12 Mbps, approximately 3.6 to 5.4 GB per hour, and starts a new file every five minutes without losing timestamps.
5. The camera reconnects after the screen locks, the USB cable is removed, and the phone restarts.
6. Timestamps remain monotonic through screen lock, task markers, file segments, and privacy pauses.
7. Phone and camera temperatures remain within manufacturer limits.
8. A 60-minute battery test establishes whether a powered hub is required before the longer four-hour test.
9. Exposure and white balance are stable through normal indoor lighting changes.
10. The mount does not block vision, create pressure points, or change normal movement.
11. The cable cannot form a loop around the neck or catch on doors, furniture, tools, or equipment.

## 4. Native Android application milestone

The web application demonstrates the workflow but does not record a USB camera. The first native Android prototype should implement:

- USB attachment discovery and explicit user permission;
- Camera2 external-camera discovery when the phone exposes the UVC device;
- a vetted UVC fallback only after security, licensing, and device testing;
- H.264 or HEVC video recording at 1080p30;
- phone IMU logging at a stable configured rate;
- a shared monotonic session clock;
- task-marker buttons and a hardware-button shortcut;
- worker-controlled privacy pause and delete-last-segment controls;
- audio disabled in both application configuration and the exported manifest;
- encrypted local storage, checksums, resumable upload, and upload receipt;
- visible remaining storage, battery, temperature, and frame-drop warnings;
- an export-safe site alias that never exposes the property address to buyer files.

Choose the Android camera or UVC dependency only after the target phone and camera are fixed. That dependency requires separate security and licensing review.

## 5. Property setup

Complete these checks before equipment enters the property:

1. Confirm written site authorization, allowed sensors, date, rooms, purpose, retention, and downstream license.
2. Confirm every participant has opted in under the current worker notice.
3. Record only adults. Remove visitors, contractors, owners, agents, and unapproved crew from the capture area.
4. Assign a random site alias. Keep the exact address, access code, alarm information, listing schedule, and contact information outside the export system.
5. Cover or remove lockbox codes, alarm panels, paperwork, labels, mirrors, photographs, screens, medication, calendars, and identifying documents.
6. Define the allowed task and object classes. Exclude ladders, stair carries, mattresses, sofas, fragile high-value items, weapons, and unsafe loads from the base prototype.

## 6. Wearable setup

1. Inspect the cap, enclosure, clip, quick release, cable, and lens.
2. Mount the camera near the center of the brim, slightly above the dominant-eye line.
3. Set an initial downward angle between 10 and 20 degrees.
4. Route the cable toward the back of the brim, down the clothing, and into the belt pouch. Never route a cable around the neck.
5. Leave a small service loop at the camera and phone, secured with strain relief. Do not leave a free loop that can catch.
6. Ask the worker to look left, right, up, and down, bend, reach, and perform a representative safe carry.
7. If the mount changes vision, balance, comfort, hearing, or safe movement, stop and use a chest or static-camera configuration.
8. Do not drill, cut, glue, or otherwise modify protective headwear. Use only manufacturer-approved accessories when protective headwear is required.

## 7. Camera and room calibration

At the beginning of every site:

1. Record the camera identifier, lens identifier, application version, mount profile, and resolution.
2. Fill the frame with the printed calibration board from several distances and angles.
3. Record a short room reference with known-size markers.
4. Place the static camera high enough to see the task area without creating a trip hazard.
5. Show a five-second visual sync light to both cameras.
6. Perform a test placement while the reviewer checks hand visibility, object visibility, framing, focus, exposure, and timestamps.

## 8. Episode capture

Each episode should represent one coherent task or tightly related task sequence.

1. Select the program, site alias, room, task, object class, weight class, and team-assist state.
2. Confirm the application shows the correct external camera and `Audio off`.
3. Start the episode before the worker approaches the object.
4. Use task markers for unload, carry, place, assemble, arrange, correct, and destage.
5. Capture failures and natural corrections. Do not ask the worker to repeat unsafe failures.
6. Use the privacy pause whenever an unexpected person, document, address, screen, or restricted object appears.
7. Use the safety stop whenever the camera, cable, task, environment, or load changes safe work.
8. End the episode after the worker reaches a stable outcome and clears the task area.

## 9. Worker closeout

Before upload, the worker must be able to:

- review the episode list and task markers;
- mark a segment for deletion without explaining why;
- confirm any privacy pauses;
- report discomfort, heat, cable problems, camera movement, unsafe conditions, or near misses;
- confirm paid setup, capture, privacy, upload, and review time;
- close the session before a manager can begin upload.

## 10. Ingest and release checks

The ingest system should:

1. Verify checksums and expected files.
2. Preserve the encrypted original in a restricted raw vault.
3. Detect faces, screens, documents, addresses, reflections, tattoos, and restricted objects.
4. Exclude any bystander or child footage rather than relying only on blur.
5. Calculate frame drops, duplicate frames, blur, exposure, hand visibility, object visibility, and synchronization.
6. Route every externally deliverable episode through human privacy and annotation review.
7. Freeze the accepted media, annotations, calibration, rights manifest, exclusion log, data card, and loader test as one versioned release.

## 11. First hardware prototype plan

Week 1:

- inventory the received ELP model, USB-C OTG adapter, GoPro hat clip, Dual Lock, Android test phone, and cap;
- add a protected backplate or enclosure, short safety tether, and cable strain relief before a worn test;
- test enumeration, close focus, hand coverage, 30-minute stability, screen lock, reconnect, and a 60-minute battery run;
- buy a second camera candidate or powered hub only if the first pairing exposes a specific failure;
- run the longer four-hour test only after the short acceptance gates pass.

Week 2:

- run ten controlled sessions with three to five experienced stagers in a warehouse or mock apartment;
- test worker comfort, privacy pause, task markers, calibration, upload, and review;
- reject or redesign any configuration that changes safe work.

Weeks 3 and 4:

- collect approximately 20 accepted hours at the controlled site;
- deliver a 30-minute privacy-cleared buyer sample with the rights and QA package;
- enter vacant properties only after buyer acceptance criteria, worker feedback, insurance, site authorization, and legal review are complete.

## 12. Technical sources

- [Amazon search for the selected ELP camera phrase](https://www.amazon.com/s?k=ELP+1080P+USB+Camera+Module+100+degree+wide+angle)
- [Closest current Amazon camera match, ASIN B00K9ZVB04](https://www.amazon.com/dp/B00K9ZVB04)
- [Likely ELP-USBFHD01M-H100 family specifications](https://www.elpcctv.com/elp-full-hd-1080p-usb-camera-module-cmos-ov2710-sensor-2mp-with-no-distortion-lens-100-degree-p-626.html)
- [Android USB host overview](https://developer.android.com/develop/connectivity/usb/host)
- [Android USB host and accessory overview](https://developer.android.com/develop/connectivity/usb)
- [Android external camera enumeration](https://developer.android.com/media/camera/camera2/camera-enumeration)
- [Android Open Source Project external USB cameras](https://source.android.com/docs/core/camera/external-usb-cameras)
- [Android CameraDevice external hardware level](https://developer.android.com/reference/android/hardware/camera2/CameraDevice)
- [Apple external UVC cameras on iPadOS](https://developer.apple.com/videos/play/wwdc2023/10106/)
- [Luxonis OAK-D Lite specifications](https://docs.luxonis.com/hardware/products/OAK-D%20Lite)
- [OSHA ergonomics](https://www.osha.gov/ergonomics/)
