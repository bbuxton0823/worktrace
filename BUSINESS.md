# ChoreCam business outline

Research date: 2026-07-17. Built from a 10-agent web research sweep (buyers, competitors, technical pipeline, hardware, legal, unit economics, staging industry, verticals, go-to-market precedents, deal structures, funding landscape). Every load-bearing claim below carries a source link. This document describes a prototype-stage concept, not an operating business.

## One-line thesis

Instrument service-business crews (home stagers, turnover cleaners, hotel housekeepers) with head-mounted cameras, capture consented egocentric video of real manual work, annotate it with hand pose and task labels, and sell rights-cleared episodes to robotics companies training manipulation foundation models.

## The headline finding: validated, and crowded

The research's most important result cuts both ways.

**Validated.** This exact category exists and is growing fast. Robotics companies already spend more than $100M per year buying real-world training data ([MIT Technology Review, April 2026](https://www.technologyreview.com/2026/04/01/1134863/humanoid-data-training-gig-economy-2026-breakthrough-technology/)), which named the humanoid-data gig economy a 2026 breakthrough technology. Bessemer projects industry robotics-data costs above $3B over the next two years ([BVP](https://www.bvp.com/atlas/bessemer-predicts-robotics-and-physical-ai)).

**Crowded.** The generic version of this idea is already operated at scale by funded companies:

| Company | Model | Scale | Contributor pay | Capital |
|---|---|---|---|---|
| [micro1](https://sacra.com/c/micro1/) | Gig workers, head-mounted iPhones, 50+ countries | Tens of thousands of hours; ~$300M ARR | ~$15/hr (Nigeria) | $35M Series A at $500M |
| [Scale AI Physical AI](https://scale.com/physical-ai) | SF lab + "Scale Harness" robotless egocentric platform, residential at-home collection | 100,000+ production hours | n/a | Meta invested $14.3B in Scale |
| [Mecka AI](https://www.upstartsmedia.com/p/mecka-ai-robotics-data-startup) | Consumer app quests + hardware rigs; 1X as customer | 30,000+ hours at seed; claims $100M run rate | n/a | $8M seed then $60M Series A |
| [Shift / MicroAGI](https://www.fastcompany.com/91564760/shift-free-house-cleaning-data-privacy?partner=rss) | Free house cleaning in NYC, camera-wearing cleaners; also $20/hr self-record | Launched May 2026 | Service subsidy or $20/hr | n/a |
| [Human Archive](https://techcrunch.com/2026/05/26/human-archive-taps-into-indias-services-startups-to-collect-data-for-physical-ai/) | Instruments Indian home-services and hotel gig workers: camera caps, wrist cams, gloves, mocap | 1,000+ active headsets | $1/hr base | $8.2M (YC, Wing) |
| [Instawork](https://finance.yahoo.com/sectors/technology/articles/instawork-robotics-lab-debuts-instacore-101500095.html) | Five-camera wearable on real gig shifts (kitchens, warehouses, hotels) | 20,000+ workers certified | ~$40/hr observed | Public co, Robotics Lab 2026 |
| [DoorDash Tasks](https://techcrunch.com/2026/03/19/doordash-launches-a-new-tasks-app-that-pays-couriers-to-submit-videos-to-train-ai/) | 8M Dashers film chores on demand | 2M+ tasks completed | Per-task | Public co |
| [XDOF](https://techcrunch.com/2026/06/17/collecting-robot-training-data-is-dirty-unglamorous-work-some-ai-labs-are-already-paying-xdof-to-do-it/) | Teleop + egocentric pyramid for frontier labs | ~20 paying customers | n/a | $70M (Thrive, a16z, Lux) |
| [Build AI](https://huggingface.co/datasets/builddotai/Egocentric-100K) | Factory-worker head cams; open-sourced 100k hours (Apache 2.0, 256p) | 100k+ open hours, ~1M reported | n/a | ~$15M seed |
| [Objectways](https://techxplore.com/news/2026-06-indian-workers-ai-robots-jobs.html) | Indian workers, head-mounted GoPros | ~90 4-minute videos/worker/day | ~$2.60/hr | Services firm |

Consequence: **undifferentiated egocentric chore video is a commodity with a collapsing price.** Teleop data fell from ~$340/hr (early 2024) to ~$118/hr (March 2026) ([SVRC](https://www.roboticscenter.ai/state-of-robotics-2026)); the offshore floor for head-cam chore video is $2.60 to $15 per hour of labor. A US generalist entrant loses that race. The business case must rest entirely on the differentiated version below.

## Demand side: who buys, with evidence

- **Physical Intelligence**: $600M Series B at $5.6B explicitly to "collect more data" ([The Robot Report](https://www.therobotreport.com/physical-intelligence-raises-600m-advance-robot-foundation-models/)); named Scale customer; pi-0.5's scaling study found ~100 distinct training environments approached in-distribution cleaning performance, direct evidence that environment diversity is the scarce input ([PI blog](https://www.pi.website/blog/pi05)).
- **Figure**: Series C above $1B at $39B with "data collection of human video" a named use of funds ([Figure](https://www.figure.ai/news/series-c)); Project Go-Big builds a pretraining set from "100% egocentric human video" in Brookfield's 100,000+ residential units ([Figure](https://www.figure.ai/news/project-go-big)).
- **Skild AI**: $1.4B raise; thesis is learning from egocentric headcam footage and YouTube, fine-tuning with under 1 hour of robot data ([Skild](https://www.skild.ai/blogs/learning-by-watching)). A natural buyer for curated egocentric video.
- **Generalist AI**: GEN-0 trained on 270,000+ hours growing 10,000 hours/week, sourced partly from "multiple data foundry partners" ([Generalist](https://generalistai.com/blog/nov-04-2025-GEN-0)): direct evidence labs buy external collection.
- **Tesla**: pivoted Optimus training from mocap suits ($25 to $48/hr operators) to helmet-and-backpack camera rigs recording household tasks ([eWeek](https://www.eweek.com/news/tesla-optimus-robot-training/)).
- **1X**: NEO home robot is "a data collection play" per its CEO; 1X also buys from Mecka.
- **NVIDIA GR00T**: trains on human video at the base of its data pyramid ([arXiv](https://arxiv.org/abs/2503.14734)).
- **Apple**: built EgoDex (829 hours, Vision Pro, full hand tracking) because "there is no Internet-scale corpus for dexterous manipulation" ([arXiv](https://arxiv.org/abs/2505.11709)).

Buyer concentration is real: perhaps 5 to 10 funded labs constitute most demand, and some (Boston Dynamics, TRI) still list egocentric human data as future work.

## What the product actually is (annotations, not footage)

Raw video is nearly free (Build AI open-sourced 100k hours; GR00T extracts its own latent actions from unannotated video). What buyers pay for, per the technical sweep:

1. **World-frame camera pose per frame** (SLAM), calibrated intrinsics.
2. **3D hand pose with confidence scores** (post-hoc via WiLoR/HaMeR plus egocentric SLAM like HaWoR when the rig is a plain camera; native when using sensor-rich devices).
3. **Task segmentation with natural-language labels** per episode (the exact thing the ChoreCam prototype demonstrates).
4. **Delivery in LeRobot v3, RLDS, or EgoDex-style HDF5+MP4** ([format reference](https://huggingface.co/blog/lerobot-datasets-v3), [EgoDex schema](https://github.com/apple/ml-egodex)).
5. **Provenance and consent documentation**: buyers now demand structured provenance files, lawful-collection warranties, and indemnification ([licensing memo](https://terms.law/insights/ai-training-data-licensing-usable-agreement.html)). Apple's EgoDex is CC-BY-NC-ND (non-commercial), leaving the best public hand-tracked egocentric data legally unusable for products: a verified market opening for rights-cleared equivalents.

## Differentiation: the five edges worth building

1. **Vertical B2B access instead of gig recruiting.** Sign service companies, not individuals. Staging firms average ~$480 profit per vacant job ([RESA 2023](https://staging-akademie.de/wp-content/uploads/2024/06/State-of-the-Home-Staging-Industry-Report.pdf)), so a $100 to $300 per-install data royalty is material. One hotel or STR-turnover contract instruments dozens of workers. No incumbent is structured this way except Human Archive (India) and Instawork (horizontal marketplace).
2. **Vacant-property consent.** Staged homes, STR turnovers, and hotel rooms between guests remove the bystander and personal-belongings problem that plagues gig collection (micro1 workers literally cannot keep their kids out of frame). Video-only recording with all present parties consenting is broadly lawful; audio stays off.
3. **Synchronized multi-view crews.** A 2 to 3 person staging crew wearing timecode-synced cameras produces multi-view episodes of the same manipulation events. Investors already reward multimodal sync (Human Archive's differentiator); nobody does multi-view in-home.
4. **The deformable-and-furniture task mix.** Bed making, linen work, laundry, furniture carries and assembly are repeatedly cited as the hard, data-starved frontier (pi-0 laundry demos, Dyna's napkin folding, hotel analyses calling bed making beyond current robots, FurnitureBench's entire public corpus being 219.6 hours that a few staging crews exceed monthly).
5. **QC as the moat.** Reported usable-footage rates split sharply by operating model: unmanaged gig collection runs near 50 percent usable ([Objectways quote via RNZ](https://www.rnz.co.nz/news/world/591611/how-filming-your-chores-could-train-the-android-butlers-of-the-future)), while Objectways' own managed studio operation scraps only 10 to 15 percent ([AP profile](https://techxplore.com/news/2025-11-ai-robots-human-real-world.html)). Managed capture with a rig-check gate gets studio-grade yield from field collection; that yield gap is the moat.

## Unit economics (sourced anchors)

| Layer | Number | Source |
|---|---|---|
| US cleaner median wage | $17.07/hr (Care.com posted rates $17.50 to $26.75) | BLS via O*NET; Care.com |
| US robotics data-collection wages | Tesla $25.25 to $48/hr; PI $25/hr; Figure $30 to $33/hr | job postings |
| Offshore collection floor | $2.60/hr (India) to $15/hr (Nigeria) | Al Jazeera; MIT Tech Review |
| Consumer-app per-footage-hour pay | $6.60 to $25 | WIRED test |
| Teleop sell price | $340/hr (2024) falling to $118/hr (2026) | SVRC |
| Outsourced demo projects | $8k to $15k per 500 episodes (~$16 to $30/episode) | SVRC |
| Adjacent AI-video licensing | $1 to $4/minute ($60 to $240/hr equivalent) | Troveo market coverage |
| Exclusivity premium | +200% over non-exclusive (one published marketplace) | Robotics Center |
| All-in collection cost guide | $10 to $30/hr (compensation + equipment) | Claru guide |

Working model for the differentiated product: pay crew members a $5 to $10/hr premium over their $17 to $27 base, amortize a ~$500 to $900 kit over 500+ hours (~$2/hr), spend a few dollars per hour on QC and labeling (VLM-assisted first pass at cents per episode, human verification on top), and land at roughly $30 to $45 fully loaded per approved hour. Target sell price for hand-tracked, task-segmented, multi-view, rights-cleared episodes: $50 to $150 per approved hour (below the teleop benchmark, far above commodity footage), with exclusive commissions at a multiple. The margin survives only if buyers accept the quality-and-rights premium; if they treat it as commodity footage, the model fails. That is the central bet, and it should be tested with a design partner before any scale spending.

## Legal and privacy posture

- **Audio off, always.** Nine states require all-party consent for audio; on-device voice-label transcription with immediate audio discard keeps this out of scope.
- **No bathrooms or bedrooms in occupied homes**, regardless of consent; vacant-property verticals largely sidestep this (a staged bedroom with no residents is furniture, not a private space, but keep the policy conservative).
- **Biometrics are the sharp edge.** Illinois BIPA carries $1,000/$5,000 statutory damages with a private right of action; the 2024 Martell ruling helps (data must be capable of identifying someone), and SB 2979 capped per-person recovery and blessed e-signature releases, so signed worker releases plus a documented no-identification hand-tracking pipeline is the posture. Washington's My Health My Data Act explicitly covers hand imagery with a private right of action: get worker releases everywhere, and treat WA carefully. Texas exempts AI-training biometric use outright.
- **Provenance is a sales asset.** Per-session consent records referenced in every episode manifest (already in the prototype schema) map directly onto what buyer contracts now demand.
- **The failure mode is downstream, not at capture.** The iRobot/Scale leak (consented capture, gig annotators posted intimate images), FTC Ring/Alexa actions (with algorithmic disgorgement: models trained on unlawful data can be ordered destroyed), and Apple's $95M Siri settlement all blew up in handling, not consent. Vetted or in-house annotation with audit trails is a requirement, not a nicety. The Bot Company getting sued after covertly testing robots in Airbnbs shows the reputational cliff, and is free marketing for a consent-first alternative.

## The case against (skeptic synthesis)

Written from the gathered evidence, strongest first:

1. **Commoditization is fast and visible.** Teleop prices fell 60% in two years; DoorDash's 8M Dashers and micro1's global gig fleet can flood generic chore video; Build AI gives 100k hours away free. *Mitigation: sell annotations, coverage, multi-view, and rights, never raw hours; stay in verticals gig fleets cannot enter (vacant listed homes, hotel floors).* 
2. **The biggest buyers self-supply.** Figure locked up Brookfield's entire portfolio; Tesla, 1X, and PI run in-house collection. *Mitigation: sell to the next tier (Skild, Generalist, Dyna, NVIDIA ecosystem, international labs) and to labs whose thesis is video-first but who lack ops.* 
3. **Buyer concentration.** 5 to 10 labs dominate spend; one platform-shift (world models needing 10x less data, per Bessemer's V-JEPA 2 note) shrinks the market. *Mitigation: keep fixed costs near zero (the B2B royalty model does this), diversify into adjacent buyers (sim companies, benchmark publishers, insurers).* 
4. **Raw-video self-labeling.** GR00T-style latent-action extraction means unannotated video competes with free YouTube. *Mitigation: same as 1; the pipeline exists to produce exactly the signals labs cannot synthesize (true 3D hand pose, world-frame camera pose, verified task labels).* 
5. **Privacy scandal risk is existential.** One leak ends the company and salts the vertical. *Mitigation: vacant-first strategy, audio-off, blur pipeline, vetted annotators, audit trails, deletion SLAs.* 
6. **Labor optics.** "Workers training their own replacements" is now a standing press angle. *Mitigation: honest framing, real premiums, and revenue share; the DPA opt-in norm is the industry's direction anyway.*

Net read: the generic version of this business is already lost to incumbents and offshore floors, but the verticalized, consent-clean, multi-view version attacks a gap none of the funded players occupies, in the exact task families (deformables, furniture, room turnover) buyers cite as data-starved.

## Offshore arm (researched 2026-07-17: Vietnam, Philippines, India, Mexico, Colombia)

A second research sweep evaluated offshore collection. Three structural findings frame it:

- **Geography matters less than expected for pretraining, more for fine-tuning.** PI's pi-0.5 and NVIDIA's EgoScale scaling law (20,854 hours of human egocentric video, task completion more than doubling from 1k to 20k hours) reward environment count and task diversity, with no stated geographic requirement. But trade press confirms "some customers prioritize data from specific markets, particularly the United States, where early adoption of humanoid robots is expected" ([humanoid.guide](https://humanoid.guide/human-video-data-emerges-as-key-to-training-humanoid-robots/)). So offshore supplies the volume tier; US vertical data holds the premium tier. Published footage prices ($15 to $50/hr annotated retail, $1 to $10/hr wholesale) carry no geographic multiplier: the arbitrage accrues to the collector as margin.
- **The hotel-standardization thesis has named support.** Zerith's founder: hotels are "an ideal standard scenario leading to homes, with clear demands and reusable data" ([analysis](https://www.1950.ai/post/the-future-of-hotel-service-inside-the-rapid-rise-of-autonomous-housekeeping-robots-in-asia-and-bey)); RLWRLD is already filming Lotte Hotel Seoul housekeeping staff with head, chest, and hand cameras ([Euronews](https://www.euronews.com/next/2026/05/14/inside-the-korean-hotel-training-humanoid-robots-with-cameras-on-workers-hands)). Chain-hotel rooms are standardized enough that offshore hospitality collection substitutes for US collection in that vertical.
- **The operating model that works is managed and consented.** The studio/BPO model (employed workers, inline QC) produced 85 to 90 percent usable yield; the deployment that collapsed (Egolab at Pearl Global factories: workers deceived about purpose, compensated with a single drink, responded by sabotaging recordings and striking) failed on consent, not economics ([openDemocracy](https://www.opendemocracy.net/india-factory-workers-train-ai-head-camera-resistance-robot-replacements/)). Karya proves ethical pay works as a model (roughly 20x Indian minimum wage, worker data ownership with resale royalties, and its founder links pay directly to data quality). No buyer yet requires fair-wage sourcing, so it remains a differentiator rather than table stakes.

Country verdict:

| Country | Saturation | Legal friction | Labor cost | Verdict |
|---|---|---|---|---|
| Philippines | Thin (world-class BPO, almost no egocentric collection) | Low (biometrics not statutorily sensitive; accountability-model transfers; fines capped ~PHP 5M; NPC camera circular requires per-property notices) | Housekeepers ~$260 to $275/month | **First choice: hospitality vertical arm.** TESDA housekeeping workforce, English ops layer, hotel standardization makes the data US-equivalent |
| Colombia | None found | Medium at capture (biometrics sensitive, prior express authorization required), near zero at export (US is on the SIC adequacy whitelist) | ~$500/month formal floor with mandatory social security | **Second: nearshore home/staging arm.** US time zones, Medellin/Bogota BPO talent, Hogaru-style cleaning platforms as partners; formalization cost strengthens the ethics story |
| Mexico | None found | Moderate-high and maximally uncertain (2025 law, INAI abolished, no implementing regulations yet, express written signed consent for an open-ended sensitive category) | Highest of the five (~$18/day minimum) | **Hold until implementing regulations land**, then reconsider for nearshore |
| India | Extreme (10+ named operators, price war, rates down ~30% in H1 2026, worker backlash coverage) | Lightest until May 2027 (no biometric category, enforcement holiday, default-open transfers), then hard cliff | Studio workers ~$3/hr | **Collection: no. Annotation and QC labor: yes** (iMerit-class talent, uncontroversial) |
| Vietnam | Moderate (DataX Power, Build AI factory networks) | Highest, arguably disqualifying (biometrics, personal images, AND behavioral-monitoring data all sensitive; cross-border dossiers filed with the Ministry of Public Security; data-sale prohibition with fines up to 10x revenue) | ~$1 to $5/hr | **Out.** The data-sale prohibition sits directly against the business model |

Offshore economics: worker pay at 2 to 3x local market (roughly $3 to $8/hr depending on country) plus managed-studio QC lands all-in cost near $8 to $18 per approved hour against the same $15 to $50/hr sell prices, and the collection sells most cleanly through a managed-service layer (Encord already resells Objectways collection to PI and Dyna) rather than raw clip marketplaces.

Adopted from the WorkTrace parallel build (2026-07-17):

- **Regional raw vault.** Identifiable raw footage stays in a country-controlled vault; redaction and QA run locally; only privacy-cleared derivatives (task segments, hand and object tracks, state labels, telemetry) cross borders by default. Raw identifiable video exports only when specifically authorized, contractually controlled, and lawful. This operationalizes the per-country legal analysis above.
- **Quality parity before geography.** Offshore arms use normal skilled-work pay plus a recording premium, equivalent safeguards, and measured quality parity against the US arm before scaling. The model is never wage arbitrage.
- **Philippines diligence gate.** The WorkTrace research flags NPC Circular 2025-01 as potentially imposing body-worn-camera retention and reuse rules; obtain Philippine counsel's reading before relying on reusable capture there. Annotation and QA work can start immediately either way; the hotel capture pilot proceeds once counsel clears it.
- **Two product tiers.** The economics above describe the episode tier (hand pose, task segments, consent provenance). The WorkTrace build models a deeper evaluated-trace tier (adds object identity and pose, contact events, before and after state, correction and recovery, reviewer confidence, and a written acceptance test) at roughly $189 cost and $379 target price per accepted hour. The trace tier is the premium roadmap once the episode tier has buyers.

## Go-to-market and funding

1. **Now (cost: near zero).** Prototype (done), spec sheet from the EgoDex/LeRobot schema, and outreach to 5 to 10 labs for one design partner. The Mecka-1X pattern (a named lab design partner at seed) is the single strongest signal investors rewarded.
2. **Pilot (angel or partner-funded, $50k to $150k).** One staging or STR-turnover crew, two synced cameras, 20+ hours, full annotation pipeline, a 5-hour polished sample. Open-source 2 to 5 hours in LeRobot format for credibility (the Build AI playbook), sell the rest.
3. **Raise only after a paid pilot or LOI.** The category is demonstrably fundable ($8M seeds for Mecka and Human Archive through $70M for XDOF; active investors include a16z, Thrive, Lux, Khosla, Wing, Framework, Neo, YC), but every pitch will face "why you versus Scale, micro1, Mecka": the answer must be evidence of vertical access and quality economics, not a plan.

## Sources

Key sources are linked inline above. Full research transcripts with all findings and URLs live in the session workflow journals (10 research agents, ~160 verified claims, July 17, 2026).
