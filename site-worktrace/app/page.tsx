"use client";

import { useEffect, useMemo, useState } from "react";
import ShaderField from "./ShaderField";

type CaptureStatus = "Ready" | "Recording" | "Privacy pause" | "Review ready";

type Vertical = {
  id: string;
  name: string;
  tier: string;
  summary: string;
  value: string;
  constraint: string;
  score: number;
  tasks: string[];
};

type Region = {
  id: string;
  country: string;
  phase: string;
  lane: string;
  fit: string;
  advantage: string;
  control: string;
  tasks: string[];
};

const chapterLinks = [
  ["trace", "Episode"],
  ["rights", "Rights"],
  ["rig", "Rig"],
  ["product", "Product"],
  ["verticals", "Markets"],
  ["economics", "Economics"],
];

const traceSteps = [
  { number: "01", title: "Authorize", detail: "Worker, site, task, and purpose are agreed before the camera starts." },
  { number: "02", title: "Capture", detail: "First-person RGB, phone IMU, calibration, and task marks share one clock." },
  { number: "03", title: "Protect", detail: "A physical pause and frame exclusion keep private details out of the release path." },
  { number: "04", title: "Understand", detail: "Human QA confirms hands, objects, contacts, state changes, and corrections." },
  { number: "05", title: "Evaluate", detail: "The buyer receives a traceable episode against a written acceptance test." },
];

const demoSegments = [
  { time: "00:00 to 00:07", task: "Cart route", object: "equipment cart", state: "hallway → living room", status: "Verified" },
  { time: "00:07 to 00:19", task: "Carry small object", object: "table lamp", state: "cart → hand", status: "Suggested" },
  { time: "00:19 to 00:27", task: "Place", object: "table lamp", state: "hand → side table", status: "Suggested" },
  { time: "00:27 to 00:34", task: "Correct alignment", object: "table lamp", state: "offset → centered", status: "Suggested" },
  { time: "00:34 to 00:37", task: "Restricted detail", object: "address label", state: "visible → exclude", status: "Privacy flag" },
];

const rightsGates = [
  ["opt-in", "Separate worker opt-in", "Consent is not bundled into the ordinary work assignment."],
  ["premium", "Normal pay plus recording premium", "The worker receives normal skilled-work pay and an additive recording premium."],
  ["refusal", "Refusal without penalty", "Declining capture does not cost a worker the underlying assignment."],
  ["pause", "Worker-controlled privacy pause", "A visible physical control stops recording without supervisor approval."],
  ["sensors", "Audio and precise GPS off", "Collect the minimum signals required for the defined robotics task."],
  ["surveillance", "No productivity leaderboard", "The dataset is not repurposed for individual worker surveillance."],
];

const starterEquipment = [
  { item: "ELP 1080P 100 degree UVC camera", price: "$22 to $35", detail: "The purchased board camera. Record the exact ASIN and printed model before testing because similarly titled ELP modules vary." },
  { item: "USB-C OTG adapter", price: "$6", detail: "Converts the supplied USB-A camera cable to USB-C. It must carry data, and the Android phone must support USB host mode." },
  { item: "GoPro hat clip mount", price: "$9", detail: "Clips to a rigid cap brim and provides camera angle adjustment. It is not a certified breakaway safety mount." },
  { item: "3M Dual Lock tape", price: "$8", detail: "Attach a protected backplate or enclosure to the clip. Never adhere an exposed camera circuit board directly to the mount." },
];

const fieldSteps = [
  ["Connect", "Enumerate the UVC camera and confirm 1920 × 1080 MJPEG at 30 fps."],
  ["Fit check", "Verify clear vision, cable strain relief, a safety tether, and immediate removal."],
  ["Calibrate", "Record the lens board, room reference, and a five-second sync light."],
  ["Authorize", "Confirm site rights, worker opt-in, audio off, and the named task limits."],
  ["Capture", "Start the episode, mark tasks, and pause immediately for privacy or safety."],
  ["Close out", "Review flags, encrypt locally, and upload only through a trusted connection."],
];

const productLayers = [
  ["rgb", "RGB", "Synchronized first-person source media"],
  ["hands", "Hands", "Left and right trajectories with visibility confidence"],
  ["objects", "Objects", "Object identity, pose, and relationship to the workspace"],
  ["contact", "Contact", "Grasp, carry, place, release, and tool contact events"],
  ["state", "State", "Before, after, and intermediate object state"],
  ["correction", "Correction", "Failure, retry, and successful recovery"],
  ["rights", "Rights", "Consent scope, permitted use, retention, and lineage"],
  ["qa", "QA", "Reviewer decisions, confidence, and acceptance-test result"],
];

const verticals: Vertical[] = [
  { id: "staging", name: "Vacant-home staging", tier: "Primary wedge", summary: "Carrying, assembly, placement, and spatial correction in controlled empty homes.", value: "Clear before-and-after states, concentrated partners, low resident exposure.", constraint: "Bulky objects create lifting risk and camera occlusion.", score: 23, tasks: ["Carry", "Assemble", "Place", "Arrange", "Correct"] },
  { id: "assembly", name: "Furniture assembly", tier: "Strong second", summary: "Dense bimanual tool use, part sequencing, fastening, and recovery.", value: "High-value hand-object interaction with measurable completion states.", constraint: "Narrow product families can create brand-specific overfitting.", score: 22, tasks: ["Sort", "Align", "Fasten", "Inspect", "Recover"] },
  { id: "hospitality", name: "Hotel turnover", tier: "Strong second", summary: "Repeatable room resets across linens, restocking, inspection, and light cleaning.", value: "Standardized layouts and recurring access through one operator.", constraint: "Guest artifacts and access windows require strict controls.", score: 21, tasks: ["Make bed", "Restock", "Inspect", "Reset"] },
  { id: "laundry", name: "Commercial laundry", tier: "Explore next", summary: "Manipulation of deformable textiles in a controlled facility.", value: "Robotics-relevant sorting, folding, stacking, and bundling.", constraint: "Heat, machinery, and repetitive strain need safety design.", score: 21, tasks: ["Sort", "Load", "Fold", "Stack"] },
  { id: "retail", name: "Retail replenishment", tier: "Explore next", summary: "Shelf restocking, facing, inventory checks, and package handling.", value: "Repeatable placement against visible planogram goals.", constraint: "Faces, traffic, and overnight schedules complicate collection.", score: 17, tasks: ["Restock", "Face", "Scan", "Correct"] },
  { id: "warehouse", name: "Warehouse kitting", tier: "Buyer-led pilot", summary: "Pick, sort, scan, kit, replenish, and manage exceptions.", value: "Strong robot relevance in structured environments.", constraint: "Site access and established automation vendors raise competition.", score: 18, tasks: ["Pick", "Kit", "Scan", "Replenish"] },
  { id: "detailing", name: "Vehicle detailing", tier: "Explore next", summary: "Tool changes, surface work, cable handling, and inspection.", value: "Repeatable procedures across varied geometries and materials.", constraint: "Chemicals, wet surfaces, and identifiers require controls.", score: 18, tasks: ["Vacuum", "Change tool", "Inspect"] },
  { id: "maintenance", name: "Property maintenance", tier: "Later custom", summary: "Inspect, diagnose, replace parts, and verify repairs.", value: "Valuable skilled-work demonstrations and recovery behaviors.", constraint: "Electrical systems, ladders, variability, and liability are substantial.", score: 16, tasks: ["Inspect", "Diagnose", "Repair", "Verify"] },
  { id: "care", name: "In-home care", tier: "Do not start", summary: "Potentially useful assistance behaviors with an extreme rights burden.", value: "Important long-term research, outside this prototype roadmap.", constraint: "Vulnerable people, health information, intimacy, and consent.", score: 9, tasks: ["Excluded"] },
];

const regions: Region[] = [
  { id: "mexico", country: "Mexico", phase: "First international candidate", lane: "Nearshore property work", fit: "Staging, furniture assembly, retail replenishment, and warehouse kitting.", advantage: "Travel and time-zone overlap make supervision and buyer review practical for a United States team.", control: "Keep identifiable raw video in a Mexico-controlled vault until consent, site rights, and transfer conditions are confirmed.", tasks: ["Staging", "Assembly", "Retail"] },
  { id: "colombia", country: "Colombia", phase: "Strong LATAM candidate", lane: "Service and turnover work", fit: "Hospitality turnover, furnished-rental reset, retail, and Spanish-language QA.", advantage: "Time-zone alignment supports active field supervision and annotation feedback.", control: "Use country-specific notices and contracts, document processor roles, and restrict identifiable raw footage regionally.", tasks: ["Hospitality", "Turnover", "QA"] },
  { id: "india", country: "India", phase: "First Asia capture candidate", lane: "Controlled task breadth", fit: "Assembly, hospitality, warehouse, and mock-site household workflows.", advantage: "Large service networks can provide task variety and experienced data operations.", control: "Use plain-language local notices, named purposes, withdrawal support, and current local counsel before transfer.", tasks: ["Assembly", "Hospitality", "Warehouse"] },
  { id: "philippines", country: "Philippines", phase: "QA first, capture with counsel", lane: "Quality and hospitality", fit: "English-language QA, then carefully scoped hotel, laundry, and property-reset pilots.", advantage: "Mature service organizations can simplify training, support, and review loops.", control: "Start with QA. Any capture pilot needs a privacy impact assessment, deletion policy, and written review of body-camera rules.", tasks: ["QA", "Hospitality", "Laundry"] },
  { id: "vietnam", country: "Vietnam", phase: "Later specialist market", lane: "Industrial manipulation", fit: "Furniture, factory kitting, garment handling, packaging, and warehouse work.", advantage: "Manufacturing ecosystems create dense, repeatable bimanual tasks for industrial robotics.", control: "Begin with non-identifying industrial scenes and complete current local privacy and transfer analysis before collection.", tasks: ["Furniture", "Kitting", "Packaging"] },
];

const compensationModels = [
  { id: "partner", name: "Partner subsidy + worker stipend", label: "Recommended first", description: "The customer pays the normal service bill. WorkTrace compensates the partner for schedule impact and every participating worker receives an additive opt-in stipend.", costs: [15, 30, 75, 35] },
  { id: "direct", name: "Direct capture crew", label: "Controlled research", description: "A dedicated crew performs specified tasks in a warehouse, model unit, or other controlled environment.", costs: [52, 5, 75, 35] },
  { id: "free", name: "Free service for data rights", label: "Limited experiment", description: "The property receives a free or discounted service. Workers still receive full wages and a separate recording premium. This is expensive and can pressure consent if designed poorly.", costs: [78, 45, 75, 35] },
  { id: "buyer", name: "Buyer-funded custom collection", label: "Best revenue proof", description: "A robotics buyer prepays a specification sprint and pilot. Collection partners and workers are paid from contracted revenue.", costs: [15, 10, 75, 25] },
];

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function runTransition(update: () => void) {
  const transitionDocument = document as Document & { startViewTransition?: (callback: () => void) => unknown };
  if (transitionDocument.startViewTransition) transitionDocument.startViewTransition(update);
  else update();
}

export default function Home() {
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>("Ready");
  const [captureSeconds, setCaptureSeconds] = useState(0);
  const [marker, setMarker] = useState("Carry small object");
  const [privacyResolved, setPrivacyResolved] = useState(false);
  const [annotationsVerified, setAnnotationsVerified] = useState(false);
  const [packageGenerated, setPackageGenerated] = useState(false);
  const [rights, setRights] = useState(() => Object.fromEntries(rightsGates.map(([id]) => [id, true])));
  const [cameraConnected, setCameraConnected] = useState(false);
  const [fieldStep, setFieldStep] = useState(0);
  const [layers, setLayers] = useState(() => Object.fromEntries(productLayers.map(([id]) => [id, true])));
  const [verticalId, setVerticalId] = useState("staging");
  const [regionId, setRegionId] = useState("mexico");
  const [modelId, setModelId] = useState("partner");
  const [rawHours, setRawHours] = useState(100);
  const [yieldRate, setYieldRate] = useState(70);
  const [margin, setMargin] = useState(50);
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    if (captureStatus !== "Recording") return;
    const timer = window.setInterval(() => setCaptureSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [captureStatus]);

  useEffect(() => {
    if (!showExplainer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowExplainer(false);
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [showExplainer]);

  const rightsReady = Object.values(rights).every(Boolean);
  const activeVertical = verticals.find((item) => item.id === verticalId) ?? verticals[0];
  const activeRegion = regions.find((item) => item.id === regionId) ?? regions[0];
  const activeModel = compensationModels.find((item) => item.id === modelId) ?? compensationModels[0];
  const economics = useMemo(() => {
    const acceptedHours = rawHours * (yieldRate / 100);
    const rawCost = activeModel.costs[0] + activeModel.costs[1] + activeModel.costs[3];
    const totalCost = rawHours * rawCost + acceptedHours * activeModel.costs[2];
    const costPerAccepted = totalCost / Math.max(acceptedHours, 1);
    const targetPrice = costPerAccepted / Math.max(1 - margin / 100, 0.05);
    return { acceptedHours, totalCost, costPerAccepted, targetPrice };
  }, [activeModel, margin, rawHours, yieldRate]);

  const openExplainer = () => runTransition(() => setShowExplainer(true));
  const closeExplainer = () => runTransition(() => setShowExplainer(false));

  return (
    <main>
      <ShaderField />
      <div className="scroll-progress" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#top" aria-label="WorkTrace home">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>WORKTRACE</span>
          <small>PROTO/01</small>
        </a>
        <nav aria-label="Experience chapters">
          {chapterLinks.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </nav>
        <button className="header-action" onClick={openExplainer} data-testid="watch-explainer">Watch film <span>↗</span></button>
      </header>

      <section className="hero shell" id="top">
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow-row">
            <span className="status-pill"><i /> WORKING PROTOTYPE</span>
            <span>PHYSICAL INTELLIGENCE / 2026</span>
          </div>
          <p className="hero-kicker">THE WORLD IS ALREADY TEACHING ROBOTS.</p>
          <h1>Turn physical work into <em>traceable</em> robotics data.</h1>
          <p className="hero-deck">An operating model for authorized professional tasks, synchronized capture, human-reviewed semantics, worker rights, and a buyer evaluation that travels with every episode.</p>
          <div className="hero-actions">
            <a className="button primary" href="#trace">Follow one episode <span>↓</span></a>
            <button className="button ghost" onClick={openExplainer}>Watch the 2-minute explainer <span>▶</span></button>
          </div>
          <p className="prototype-note">Illustrative demo data only. No real workers, homes, or customer operations are shown.</p>
        </div>

        <div className="hero-instrument" aria-label="Illustration of raw motion becoming structured robotics data">
          <div className="instrument-head"><span>TRACE COMPILER</span><span>SIMULATION / 014</span></div>
          <div className="instrument-field">
            <div className="raw-label">RAW MOTION</div>
            <div className="compiled-label">SEMANTIC EVENTS</div>
            <div className="hand-path path-left"><i /><i /><i /><i /></div>
            <div className="hand-path path-right"><i /><i /><i /></div>
            <div className="compile-plane" />
            <div className="semantic-lattice">{Array.from({ length: 35 }, (_, index) => <i key={index} />)}</div>
            <span className="event-label event-one">GRASP / .98</span>
            <span className="event-label event-two">CARRY / .94</span>
            <span className="event-label event-three">PLACE / .97</span>
          </div>
          <div className="instrument-foot"><span><i className="dot clay" /> LEFT HAND</span><span><i className="dot sky" /> RIGHT HAND</span><span><i className="dot lime" /> ACCEPTED</span></div>
        </div>

        <div className="hero-index" aria-hidden="true"><span>01</span><i /><span>09</span></div>
      </section>

      <section className="thesis shell reveal-section" aria-labelledby="thesis-title">
        <div className="section-number">00 / THESIS</div>
        <div>
          <h2 id="thesis-title">Video shows what happened. A trace explains <em>how the world changed.</em></h2>
          <p>Robotics teams need more than clips. They need action, state, failure, correction, outcome, calibration, and permission in a form they can inspect.</p>
        </div>
        <div className="signal-stack">
          {["ACTION", "STATE", "CONTACT", "CORRECTION", "OUTCOME", "RIGHTS"].map((item, index) => <span key={item} style={{ "--signal-index": index } as React.CSSProperties}>{item}<i /></span>)}
        </div>
      </section>

      <section className="trace-section" id="trace" data-testid="mobile-capture-prototype">
        <div className="section-intro shell">
          <div className="section-number">01 / ONE EPISODE</div>
          <div><p className="overline">FROM AUTHORIZATION TO ACCEPTANCE</p><h2>Follow Cedar House 014.</h2></div>
          <p>Vacant-home staging turns an empty room into a bounded robotics problem with visible before-and-after state.</p>
        </div>

        <div className="episode-layout shell">
          <div className="episode-sticky">
            <div className={`capture-rig status-${captureStatus.toLowerCase().replace(" ", "-")}`}>
              <div className="capture-toolbar">
                <div><span className="record-light" /><strong>{captureStatus.toUpperCase()}</strong></div>
                <span>CAM/ELP-01</span><span>{formatTime(captureSeconds)}</span><span>1080P / 30</span>
              </div>
              <div className="room-feed">
                <div className="room-grid" />
                <div className="room-wall wall-a" /><div className="room-wall wall-b" />
                <div className="room-table"><i /><i /></div>
                <div className="room-lamp"><i /><i /></div>
                <div className="object-box"><span>LAMP / 0.96</span></div>
                <div className="virtual-hand hand-a"><i /><i /><i /></div>
                <div className="virtual-hand hand-b"><i /><i /><i /></div>
                <div className="scan-line" />
                {captureStatus === "Privacy pause" && <div className="privacy-mask"><span>CAPTURE PAUSED</span><strong>Worker privacy control</strong></div>}
                <div className="feed-caption"><span>CEDAR HOUSE 014</span><span>VACANT-HOME STAGING</span></div>
              </div>
              <div className="capture-controls">
                <button data-testid="start-capture" onClick={() => { setCaptureStatus("Recording"); setCaptureSeconds(0); setPackageGenerated(false); }}><i className="control-record" /> Start episode</button>
                <button onClick={() => setCaptureStatus(captureStatus === "Privacy pause" ? "Recording" : "Privacy pause")}><i className="control-pause" /> {captureStatus === "Privacy pause" ? "Resume" : "Privacy pause"}</button>
                <button onClick={() => setCaptureStatus("Review ready")}><i className="control-stop" /> Finish</button>
              </div>
            </div>

            <div className="episode-job-card">
              <div><span>ACTIVE DEMO JOB</span><strong>Cedar House 014</strong></div>
              <div><span>TASK FAMILY</span><strong>Vacant-home staging</strong></div>
              <div><span>SENSORS</span><strong>RGB + phone IMU</strong></div>
              <div><span>AUDIO / GPS</span><strong>OFF / OFF</strong></div>
            </div>
          </div>

          <div className="episode-story">
            {traceSteps.map((step, index) => (
              <article className="trace-step reveal-section" key={step.title}>
                <span>{step.number}</span><div><p>{step.title}</p><h3>{step.detail}</h3></div>
                <div className="step-node" aria-hidden="true"><i style={{ "--step": index } as React.CSSProperties} /></div>
              </article>
            ))}

            <article className="annotation-console">
              <div className="console-head"><span>EPISODE TIMELINE</span><span>5 SEGMENTS / 1 FLAG</span></div>
              <div className="marker-select">
                <label htmlFor="marker">Add task marker</label>
                <select id="marker" value={marker} onChange={(event) => setMarker(event.target.value)}>
                  {["Unload", "Carry small object", "Place", "Assemble", "Arrange", "Correct alignment", "Destage"].map((item) => <option key={item}>{item}</option>)}
                </select>
                <button onClick={() => setAnnotationsVerified(false)}>Mark at {formatTime(captureSeconds)}</button>
              </div>
              <div className="segment-table">
                {demoSegments.map((segment) => (
                  <div key={segment.time} className={segment.status === "Privacy flag" ? "flagged" : ""}>
                    <span>{segment.time}</span><strong>{segment.task}</strong><span>{segment.object}</span><span>{segment.state}</span><b>{segment.status}</b>
                  </div>
                ))}
              </div>
              <div className="review-actions">
                <button className={privacyResolved ? "complete" : ""} data-testid="exclude-privacy" onClick={() => setPrivacyResolved(true)}>{privacyResolved ? "✓ Restricted frames excluded" : "Exclude privacy flag"}</button>
                <button className={annotationsVerified ? "complete" : ""} onClick={() => setAnnotationsVerified(true)}>{annotationsVerified ? "✓ Annotations verified" : "Verify annotations"}</button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="rights-section" id="rights">
        <div className="rights-glow" aria-hidden="true" />
        <div className="section-intro shell light-copy">
          <div className="section-number">02 / RIGHTS MANIFEST</div>
          <div><p className="overline">PERMISSION IS A DATA ATTRIBUTE</p><h2>No authorization, no episode.</h2></div>
          <p>Every released file inherits the same worker, site, purpose, retention, and transfer rules as its source.</p>
        </div>
        <div className="rights-grid shell">
          <div className="packet-visual" aria-label="Illustration of a data packet passing six rights gates">
            <div className={`packet-cube ${rightsReady ? "released" : "blocked"}`}><i /><i /><i /><span>WT<br />014</span></div>
            <div className="packet-line"><i /><i /><i /><i /><i /><i /></div>
            <div className="release-state"><span>{rightsReady ? "RELEASE PATH OPEN" : "RELEASE BLOCKED"}</span><strong>{Object.values(rights).filter(Boolean).length} / 6 GATES</strong></div>
          </div>
          <div className="gate-list">
            {rightsGates.map(([id, title, detail], index) => (
              <button key={id} className={rights[id] ? "gate active" : "gate"} onClick={() => setRights((current) => ({ ...current, [id]: !current[id] }))} aria-pressed={rights[id]}>
                <span>{String(index + 1).padStart(2, "0")}</span><i>{rights[id] ? "✓" : "×"}</i><div><strong>{title}</strong><small>{detail}</small></div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rig-section shell" id="rig">
        <div className="section-intro">
          <div className="section-number">03 / FIELD RIG</div>
          <div><p className="overline">BENCH TEST FIRST</p><h2>A $45 to $58 core kit.</h2></div>
          <p>Start with the hardware already purchased, validate the exact camera-phone pairing, then harden the mount before any worn test.</p>
        </div>
        <div className="rig-layout">
          <div className="rig-exploded" data-testid="starter-equipment-kit">
            <div className="rig-cable" aria-hidden="true" />
            <div className="rig-part camera-part"><span>01</span><div className="camera-board"><i /><i /><i /><i /><b /></div><strong>ELP UVC CAMERA</strong><small>100° / 1080P</small></div>
            <div className="rig-part adapter-part"><span>02</span><div className="adapter-shape"><i /></div><strong>USB-C OTG</strong><small>DATA + HOST MODE</small></div>
            <div className="rig-part mount-part"><span>03</span><div className="mount-shape"><i /><i /></div><strong>HAT CLIP</strong><small>PROTECTED BACKPLATE</small></div>
            <div className="rig-part phone-part"><span>04</span><div className="phone-shape"><i>UVC<br />READY</i></div><strong>ANDROID PHONE</strong><small>LOCAL ENCRYPTION</small></div>
            <div className="rig-total"><span>CORE HARDWARE</span><strong>$45<span>–</span>$58</strong><small>with an existing phone and cap</small></div>
          </div>
          <div className="kit-list">
            {starterEquipment.map((item, index) => <article key={item.item}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item.item}</h3><p>{item.detail}</p></div><strong>{item.price}</strong></article>)}
            <div className="safety-callout"><strong>Before it goes on a person</strong><p>Use a ventilated rounded enclosure or nonconductive backplate, strain relief, a short safety tether, and cable routing down the back of the cap and inside clothing, never around the neck. Use a flexible OTG pigtail for a worn test.</p></div>
          </div>
        </div>

        <div className="mobile-setup">
          <div className="setup-phone">
            <div className="phone-speaker" />
            <div className="phone-ui">
              <div className="phone-status"><span>9:41</span><span>WORKTRACE FIELD</span><i /></div>
              <div className={`device-orb ${cameraConnected ? "connected" : ""}`}><i /><span>{cameraConnected ? "UVC CONNECTED" : "NO CAMERA"}</span></div>
              <div className="phone-step"><small>STEP {fieldStep + 1} OF {fieldSteps.length}</small><strong>{fieldSteps[fieldStep][0]}</strong><p>{fieldSteps[fieldStep][1]}</p></div>
              <div className="phone-progress">{fieldSteps.map(([label], index) => <i key={label} className={index <= fieldStep ? "active" : ""} />)}</div>
              <button onClick={() => { if (!cameraConnected) setCameraConnected(true); else setFieldStep((value) => Math.min(value + 1, fieldSteps.length - 1)); }}>
                {!cameraConnected ? "Simulate UVC connection" : fieldStep === fieldSteps.length - 1 ? "Ready for sample capture" : "Complete step"}<span>→</span>
              </button>
            </div>
          </div>
          <div className="setup-copy">
            <p className="overline">ANDROID CAPTURE COMPANION</p>
            <h3>The interface is mapped. The hardware bridge is next.</h3>
            <p>This web prototype simulates USB capture. A native Android UVC recorder is the next milestone. The first bench test should prove enumeration, stable MJPEG recording, timestamps, thermal behavior, and phone battery draw.</p>
            <div className="step-chips">{fieldSteps.map(([label], index) => <button key={label} className={fieldStep === index ? "active" : ""} onClick={() => setFieldStep(index)}><span>{index + 1}</span>{label}</button>)}</div>
            <details><summary>After the bench test: full pilot kit</summary><p>Budget roughly $940 to $2,250 for a dedicated Android phone, safer enclosure and mount, power and cable kit, static room camera, calibration materials, cases, spares, and field support. Validate exact parts before purchase.</p></details>
            <div className="source-row"><a href="https://www.amazon.com/s?k=ELP+1080P+USB+Camera+Module+100+degree+wide+angle" target="_blank" rel="noreferrer">Amazon phrase search ↗</a><a href="https://www.elpcctv.com/elp-full-hd-1080p-usb-camera-module-cmos-ov2710-sensor-2mp-with-no-distortion-lens-100-degree-p-626.html" target="_blank" rel="noreferrer">Likely ELP H100 family ↗</a></div>
          </div>
        </div>
      </section>

      <section className="product-section" id="product">
        <div className="section-intro shell light-copy">
          <div className="section-number">04 / BUYER PRODUCT</div>
          <div><p className="overline">NOT FOOTAGE</p><h2>An evaluated episode.</h2></div>
          <p>Turn layers on and off to see what separates a video archive from a robotics-ready data product.</p>
        </div>
        <div className="product-lab shell">
          <div className="layer-panel">
            {productLayers.map(([id, title, detail]) => <button key={id} className={layers[id] ? "active" : ""} onClick={() => setLayers((current) => ({ ...current, [id]: !current[id] }))} aria-pressed={layers[id]}><i>{layers[id] ? "●" : "○"}</i><span><strong>{title}</strong><small>{detail}</small></span></button>)}
          </div>
          <div className="data-cube-stage">
            <div className="layer-count"><strong>{Object.values(layers).filter(Boolean).length}</strong><span>/ 8 ACTIVE LAYERS</span></div>
            <div className="data-cube">
              <div className="cube-face cube-front"><span>EPISODE</span><strong>WT-STG-014</strong><small>37.4 SEC / 5 SEGMENTS</small></div>
              <div className="cube-face cube-side" /><div className="cube-face cube-top" />
              {Object.entries(layers).map(([id, active], index) => active && <i key={id} className="cube-layer" style={{ "--layer": index } as React.CSSProperties} />)}
            </div>
            <div className="cube-legend"><span>MEDIA</span><span>SEMANTICS</span><span>RIGHTS</span><span>EVALUATION</span></div>
          </div>
          <div className="package-panel">
            <p className="overline">RELEASE PACKAGE</p>
            {["episode.mp4 + imu.parquet", "annotations.json", "calibration.json", "rights-manifest.json", "data-card.md", "evaluation-report.json"].map((file) => <div key={file}><i />{file}<span>{packageGenerated ? "SEALED" : "PENDING"}</span></div>)}
            <button data-testid="generate-package" disabled={!privacyResolved || !annotationsVerified || !rightsReady} onClick={() => setPackageGenerated(true)}>{packageGenerated ? "✓ Buyer package generated" : "Generate buyer package"}<span>→</span></button>
            {!packageGenerated && <small>{!privacyResolved || !annotationsVerified ? "Resolve privacy and annotation review in Episode 01." : !rightsReady ? "All six rights gates must be present." : "Ready to generate illustrative package."}</small>}
          </div>
        </div>
        <div className="acceptance-test shell"><span>WRITTEN ACCEPTANCE TEST / EXAMPLE</span><p>Can the buyer retrieve every successful lamp placement with synchronized hand trajectories, object state before and after, correction events, calibration, reviewer confidence, and reusable rights?</p><strong>{packageGenerated ? "PASS / DEMO" : "AWAITING PACKAGE"}</strong></div>
      </section>

      <section className="verticals-section shell" id="verticals">
        <div className="section-intro">
          <div className="section-number">05 / EXPANSION</div>
          <div><p className="overline">START NARROW, GENERALIZE CAREFULLY</p><h2>Staging is the wedge.</h2></div>
          <p>Select a task family. The interface changes state using the browser View Transition API when supported.</p>
        </div>
        <div className="constellation-layout">
          <div className="constellation" aria-label="Potential field-work verticals">
            <div className="constellation-rings"><i /><i /><i /></div>
            {verticals.map((vertical, index) => <button key={vertical.id} className={`${vertical.id === verticalId ? "active" : ""} node-${index + 1}`} onClick={() => runTransition(() => setVerticalId(vertical.id))}><span>{vertical.name}</span><i /></button>)}
          </div>
          <article className={`vertical-card ${activeVertical.id === "care" ? "excluded" : ""}`}>
            <div className="vertical-card-head"><span>{activeVertical.tier}</span><strong>{activeVertical.score}<small>/25</small></strong></div>
            <h3>{activeVertical.name}</h3><p className="vertical-summary">{activeVertical.summary}</p>
            <div className="score-meter"><i style={{ width: `${activeVertical.score * 4}%` }} /></div>
            <dl><div><dt>Why it matters</dt><dd>{activeVertical.value}</dd></div><div><dt>Primary constraint</dt><dd>{activeVertical.constraint}</dd></div></dl>
            <div className="task-tags">{activeVertical.tasks.map((task) => <span key={task}>{task}</span>)}</div>
          </article>
        </div>
      </section>

      <section className="regions-section" id="regions" data-testid="view-regions">
        <div className="section-intro shell light-copy">
          <div className="section-number">06 / INTERNATIONAL</div>
          <div><p className="overline">QUALITY PARITY BEFORE GEOGRAPHY</p><h2>Match the task to the market.</h2></div>
          <p>Never build the model on wage arbitrage. Use normal skilled-work pay plus a recording premium, equivalent safeguards, local control, and measured quality parity.</p>
        </div>
        <div className="region-explorer shell">
          <div className="globe-stage" aria-hidden="true">
            <div className="globe"><i /><i /><i /><i /></div>
            <div className="globe-path path-a" /><div className="globe-path path-b" />
            <span className="globe-origin">US PROOF</span><span className="globe-destination">{activeRegion.country.toUpperCase()}</span>
          </div>
          <div className="region-interface">
            <div className="region-tabs">{regions.map((region) => <button key={region.id} data-testid={`region-${region.id}`} className={region.id === regionId ? "active" : ""} onClick={() => runTransition(() => setRegionId(region.id))}>{region.country}</button>)}</div>
            <article>
              <div><span>{activeRegion.phase}</span><strong>{activeRegion.lane}</strong></div>
              <h3>{activeRegion.country}</h3>
              <dl><div><dt>Task-market fit</dt><dd>{activeRegion.fit}</dd></div><div><dt>Operating advantage</dt><dd>{activeRegion.advantage}</dd></div><div><dt>Regional control</dt><dd>{activeRegion.control}</dd></div></dl>
              <div className="task-tags">{activeRegion.tasks.map((task) => <span key={task}>{task}</span>)}</div>
            </article>
          </div>
        </div>
        <div className="rollout-sequence shell">
          {["United States proof", "One-country replication", "Measured quality parity", "Second market", "Repeat-purchase network"].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong>{index < 4 && <i />}</div>)}
        </div>
        <div className="regional-flow shell"><div><span>01</span><strong>Restricted local raw vault</strong></div><i>→</i><div><span>02</span><strong>Local redaction and QA</strong></div><i>→</i><div><span>03</span><strong>Transfer only if cleared</strong></div><i>→</i><div><span>04</span><strong>Buyer-approved derivative</strong></div></div>
      </section>

      <section className="economics-section shell" id="economics" data-testid="economics-calculator">
        <div className="section-intro">
          <div className="section-number">07 / ECONOMICS</div>
          <div><p className="overline">CONSENT-CENTERED OPERATIONS</p><h2>Subsidize access. Pay the worker.</h2></div>
          <p>Do not make free service the foundation. The cleanest first model combines normal customer payment, a partner subsidy, and a direct worker recording stipend.</p>
        </div>
        <div className="model-selector">
          {compensationModels.map((model) => <button key={model.id} className={model.id === modelId ? "active" : ""} onClick={() => setModelId(model.id)}><span>{model.label}</span><strong>{model.name}</strong></button>)}
        </div>
        <div className="economics-lab">
          <div className="model-copy"><span>{activeModel.label}</span><h3>{activeModel.name}</h3><p>{activeModel.description}</p><div className="cost-key"><span>Worker + field / raw hour <strong>${activeModel.costs[0] + activeModel.costs[1] + activeModel.costs[3]}</strong></span><span>Human QA / accepted hour <strong>${activeModel.costs[2]}</strong></span></div></div>
          <div className="sliders">
            <label>Raw capture hours <strong>{rawHours} h</strong><span className="range-control"><button type="button" aria-label="Decrease raw capture hours" onClick={() => setRawHours((value) => Math.max(10, value - 10))}>−</button><input type="range" min="10" max="500" step="10" value={rawHours} onInput={(event) => setRawHours(Number(event.currentTarget.value))} /><button type="button" aria-label="Increase raw capture hours" data-testid="increase-raw-hours" onClick={() => setRawHours((value) => Math.min(500, value + 10))}>+</button></span></label>
            <label>Accepted yield <strong>{yieldRate}%</strong><span className="range-control"><button type="button" aria-label="Decrease accepted yield" onClick={() => setYieldRate((value) => Math.max(30, value - 5))}>−</button><input type="range" min="30" max="95" step="5" value={yieldRate} onInput={(event) => setYieldRate(Number(event.currentTarget.value))} /><button type="button" aria-label="Increase accepted yield" onClick={() => setYieldRate((value) => Math.min(95, value + 5))}>+</button></span></label>
            <label>Target gross margin <strong>{margin}%</strong><span className="range-control"><button type="button" aria-label="Decrease target gross margin" onClick={() => setMargin((value) => Math.max(20, value - 5))}>−</button><input type="range" min="20" max="75" step="5" value={margin} onInput={(event) => setMargin(Number(event.currentTarget.value))} /><button type="button" aria-label="Increase target gross margin" onClick={() => setMargin((value) => Math.min(75, value + 5))}>+</button></span></label>
          </div>
          <div className="economic-output"><div><span>ACCEPTED HOURS</span><strong>{economics.acceptedHours.toFixed(1)}</strong></div><div><span>PROGRAM COST</span><strong>${Math.round(economics.totalCost).toLocaleString()}</strong></div><div><span>COST / ACCEPTED HOUR</span><strong>${Math.round(economics.costPerAccepted)}</strong></div><div className="accent"><span>TARGET PRICE / HOUR</span><strong>${Math.round(economics.targetPrice)}</strong></div><small>Illustrative planning model only. Buyer value should be measured against a task-specific robotics evaluation, not hours alone.</small></div>
        </div>
      </section>

      <section className="capital-section">
        <div className="section-intro shell light-copy">
          <div className="section-number">08 / SALES + CAPITAL</div>
          <div><p className="overline">EARN THE RIGHT TO SCALE</p><h2>The next money should be customer money.</h2></div>
          <p>Venture capital can accelerate a proven data engine. It should not finance an open-ended collection effort before buyers define value.</p>
        </div>
        <div className="capital-grid shell">
          <div className="readiness-dial"><div><span>VC READINESS</span><strong>2<small>/7</small></strong><i /></div><p>Two gates can be demonstrated in this prototype: a defined wedge and a concrete collection system. Buyer demand, data quality, model lift, unit economics, repeat purchase, and legal scalability still need evidence.</p></div>
          <div className="offer-ladder">
            {[['01', 'Specification sprint', 'Define task, ontology, rights, and acceptance test.'], ['02', 'Design-partner pilot', 'Collect a small buyer-defined sample in one controlled task.'], ['03', 'Evaluated task pack', 'Deliver accepted episodes and a measured buyer report.'], ['04', 'Custom program', 'Expand only after repeat purchase and model value.']].map(([number, title, detail]) => <article key={number}><span>{number}</span><div><strong>{title}</strong><p>{detail}</p></div></article>)}
          </div>
        </div>
        <div className="capital-sequence shell"><div><span>NOW</span><strong>Customer-funded proof</strong></div><i>→</i><div><span>AFTER COMMITMENTS</span><strong>Angel or pre-seed</strong></div><i>→</i><div><span>AFTER REPEAT PURCHASE</span><strong>Institutional seed</strong></div></div>
      </section>

      <section className="closing shell">
        <div className="closing-mark" aria-hidden="true"><i /><i /><i /><span>W</span></div>
        <p className="overline">A PROTOTYPE FOR PHYSICAL INTELLIGENCE</p>
        <h2>Start with one task.<br />Prove one trace.</h2>
        <p>Build the smallest authorized episode that a robotics buyer can evaluate, then let evidence decide where the network goes next.</p>
        <div className="role-paths">
          <a href="#product"><span>ROBOTICS BUYER</span><strong>Define an acceptance test</strong><i>↗</i></a>
          <a href="#rig"><span>FIELD OPERATOR</span><strong>Test one authorized crew</strong><i>↗</i></a>
          <a href="#economics"><span>INVESTOR</span><strong>Review the proof gates</strong><i>↗</i></a>
        </div>
        <button className="button primary closing-button" onClick={openExplainer}>Watch the prototype explainer <span>▶</span></button>
      </section>

      <footer className="site-footer shell"><a className="brand" href="#top"><span className="brand-mark"><i /><i /><i /></span><span>WORKTRACE</span></a><p>Physical work → authorized trace → evaluated robotics data</p><span>PROTOTYPE / JULY 2026</span></footer>

      {showExplainer && (
        <div className="video-modal" role="dialog" aria-modal="true" aria-labelledby="video-title" onMouseDown={(event) => { if (event.target === event.currentTarget) closeExplainer(); }}>
          <div className="video-dialog">
            <div className="video-head"><div><span>WORKTRACE / PROTOTYPE FILM</span><h2 id="video-title">From physical work to robotics data</h2></div><button onClick={closeExplainer} aria-label="Close explainer">×</button></div>
            <video controls poster="/demo/worktrace-demo-poster.jpg" data-testid="explainer-video">
              <source src="/demo/worktrace-demo-explainer.mp4" type="video/mp4" />
              <track kind="captions" src="/demo/worktrace-explainer.vtt" srcLang="en" label="English" default />
            </video>
            <p>This two-minute explainer shows the earlier dashboard prototype. The experience on this page is the expanded July 2026 concept.</p>
          </div>
        </div>
      )}
    </main>
  );
}
