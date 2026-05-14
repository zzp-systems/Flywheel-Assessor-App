
<div style="page-break-after: always;"></div>

## Table of Contents
1. [Executive Overview](#1-executive-overview)
2. [Complete Feature Inventory](#2-complete-feature-inventory)
3. [Data Models & JSON Export Schema](#3-data-models--json-export-schema)
4. [Component Architecture & State Management](#4-component-architecture--state-management)
5. [External Dependencies](#5-external-dependencies)
6. [Build & Deployment](#6-build--deployment)
7. [Compliance & Texas-Specific Provisions](#7-compliance--texas-specific-provisions)
8. [Improvement Opportunities & Customization](#8-improvement-opportunities--customization)
9. [Future Roadmap](#9-future-roadmap)

<div style="page-break-after: always;"></div>

<h2 id="1-executive-overview">1. Executive Overview</h2>
The Flywheel Assessor App is an offline-first, mobile-responsive Progressive Web Application (PWA) designed to standardize, accelerate, and defend field operations ("Special Ops") across Flywheel Investors' Texas-based Self-Storage properties. Focused on compliance with the Texas Property Code (Chapter 59), this tool bridges the gap between field inspections and legally defensible documentation.

It leverages a modern tech stack consisting of **React**, **Vite**, **Tailwind CSS**, and **IndexedDB** for seamless offline resilience, with future-ready deployment to **Google Cloud Run**. The app operates under an "Offline-First" paradigm, ensuring field agents can conduct baseline evaluations, photograph assets, and generate legal notices without robust cellular coverage, automatically queuing data locally to be synced the moment network connection returns.

<h2 id="2-complete-feature-inventory">2. Complete Feature Inventory</h2>

### 2.1 Inspection Type Selection
- **Description:** A core dropdown setting the operative context of the report: Move-In Baseline, Mid-Tenancy / Health & Safety, or Move-Out / Turnover.
- **Interaction:** The user selects the inspection type via the header dropdown.
- **Visuals:** Featured in a white card at the top, bordered in light gray. Select elements carry the bold navy styling. A "Mission Brief" button lives nearby.
- **Technical Summary:** Toggling sets `data.type` via `changeType`, automatically adjusting the displayed checklist groups.
- **Metadata Fields:** `type` (Enum).
- **Rationale:** Crucial because procedures differ significantly (legal baseline vs. health/safety vs. lien valuation).

### 2.2 Traffic-Light Compliance Framework
- **Description:** A hierarchical system denoting severity: Red (Critical/Liability), Yellow (Functional/Notice), and Green (Cosmetic/Baseline).
- **Interaction:** One-click toggles cycle through: Pass, Fail, N/A, and None.
- **Visuals:** Color-coded border pulses. Fails trigger an amber/red warning highlight.
- **Technical Summary:** State holds `Record<string, ChecklistItem>`. Changing a status updates `data.items[id].status`.
- **Metadata Fields:** `items[id].tier`, `items[id].status`.
- **Rationale:** Focuses inspector attention appropriately based on legal and functional risk.

### 2.3 Strict Unit Status Logic
- **Description:** Fully automated logic to assign absolute states: UNSAFE, NOT RENT-READY, INSPECTION IN PROGRESS, and RENT-READY.
- **Interaction:** Invisible to the user. Evaluated continuously based on checklist inputs.
- **Visuals:** Displayed at the top of the Forensic Summary in large block letters with a corresponding background (Red for UNSAFE, Green for RENT-READY).
- **Technical Summary:** Computed via boolean flags: any Red fail = UNSAFE, any Yellow fail = NOT RENT-READY.
- **Rationale:** Prevents subjective unit grading and guarantees minimum safety thresholds.

### 2.4 Photo Capture, Linking & Watermarking
- **Description:** Attaches visually verified timestamps and identifiers directly to the uploaded file data to authenticate documentation.
- **Interaction:** User clicks a camera icon on an item, or uses the global add-photo FAB. Selects a picture.
- **Visuals:** Grid-view modal with categorical buckets.
- **Technical Summary:** Uses a hidden `<canvas>` context to overlay `ctx.fillText` strings for device, facility, and ISO string timestamp before saving to `dataUri`.
- **Metadata Fields:** `photos.id`, `photos.linkedItemId`, `photos.watermarkText`.

### 2.5 Photo Evidence Tracker
- **Description:** Bottom-sheet gallery ensuring minimum coverage thresholds are met.
- **Interaction:** Scrollable horizontal layout with embedded bin icons for cleanup.
- **Visuals:** 15 distinct slots visible, updating dynamically. Linked categories show below thumbs.
- **Technical Summary:** Renders `data.photos` array.

### 2.6 Move-Out Delta Report
- **Description:** Synchronizes with Baseline JSONs to calculate what has deteriorated.
- **Interaction:** User clicks "Import Baseline", selects previous JSON. The app merges it and calculates diffs.
- **Visuals:** "DETERIORATED" banners tag the fields in the UI. Repair cost inputs appear inline.
- **Technical Summary:** Merges prior `items` into `baseItems`, matching identifiers. Checks to ensure positive integer values are saved.
- **Rationale:** By showing exact point deterioration, the tool eliminates tenant defense disputes for Texas property lien enforcements and deposit withholding.

### 2.7 Forensic Summary
- **Description:** A comprehensive roll-up of failures, actions, and follow-ups.
- **Interaction:** The user reviews the aggregated list and checks the Follow-Up items.
- **Visuals:** Bottom section of the app.
- **Technical Summary:** Rendered dynamically by filtering `data.items`. 

### 2.8 Document Generator
- **Description:** Creates HTML-based legal templates customized with inspection data.
- **Interaction:** Press "Formal Report" or specific Notice toggles.
- **Visuals:** Split pane UI. Form fields on the left, standard letter preview on the right.
- **Technical Summary:** Injects state contexts into string literal templates (`noticeOfEntryTemplate`, etc.).
- **Rationale:** Generates physical postings for Texas 3-Day Notice routines and lien claims.

### 2.9 Signature Capture
- **Description:** Digital signature acquisition for Tenant and Inspector.
- **Interaction:** Users touch screen to draw or type their name via specialized tabs.
- **Visuals:** Full-screen modal, clean canvas element with Navy accents.
- **Technical Summary:** Captures pointer events, writes ink paths, converts `canvas.toDataURL()` as base64 string.
- **Metadata Fields:** `inspectorSignature`, `tenantSignature`, `tenantName`.

### 2.10 Print / PDF Output
- **Description:** Formats the document for formal 8.5x11 printed output.
- **Interaction:** Triggered via browser print, constrained via CSS.
- **Visuals:** High-contrast serif typographies, devoid of web UI elements. Fits exactly one letter-size page for Notices.
- **Technical Summary:** Employs `@media print` rules overriding display structures (`print:hidden`, `print:block`).

### 2.11 Offline Resilience & Sync Queue
- **Description:** Caches ongoing interactions local-first ensuring zero data loss during dead zones.
- **Interaction:** Background service. App shows "X offline" tags. Upon restoration, uploads trigger.
- **Visuals:** Amber badge in the upper right. Green "Synced" toast on success.
- **Technical Summary:** Persists `InspectionData` payloads to an `offline_queue` in `IndexedDB`. A `window.navigator.onLine` listener attempts auto-sync routines.

### 2.12 Mission Brief Modal
- **Description:** Contextual SOP overlay defining operating guidelines.
- **Interaction:** User clicks the "Mission Brief" button. 
- **Visuals:** Minimalist modal with Amber bullet points dictating procedures.
- **Technical Summary:** Evaluates `data.type` state to display specific operational marching orders.

### 2.13 QR Code Unit Scanner
- **Description:** Rapidly inputs Facility ID.
- **Interaction:** Scans a label at the gate.
- **Technical Summary:** Employs `jsQR` dependency on a live webcam `<video>` feed.

### 2.14 Voice-to-Text for Runner Notes
- **Description:** Microphone toggle translating speech to runner text in the Forensic Summary.
- **Interaction:** Clicks Mic, talks, text populates appended to text area.
- **Visuals:** Red pulsing square icon during recording.
- **Technical Summary:** Leans heavily on the experimental browser `webkitSpeechRecognition` APIs with `onend` and `onresult` event binders.

### 2.15 Backward Compatibility
- **Description:** Handles missing signature or baseline data gracefully on older JSON loads.
- **Technical Summary:** Safely evaluates empty props via default coalescing (e.g., `data.tenantName || 'N/A'`). 

<div style="page-break-after: always;"></div>

<h2 id="3-data-models--json-export-schema">3. Data Models & JSON Export Schema</h2>
The application strictly enforces TypeScript typing for the serialization structure.

### Typescript Interfaces (Abridged)
```typescript
interface InspectionData {
  facility: string;
  unit: string;
  type: InspectionType; // 'Move-In Baseline' | 'Mid-Tenancy' | 'Move-Out'
  status: 'UNSAFE' | 'NOT RENT-READY' | 'INSPECTION IN PROGRESS' | 'RENT-READY';
  timestamp: string;
  inspectorName: string;
  tenantName?: string;
  weather: string;
  items: Record<string, ChecklistItem>;
  photos: Photo[];
  runnerNotes?: string;
  inspectorSignature?: string;
  tenantSignature?: string;
}
```

### Export JSON Schema Example
```json
{
  "facility": "FW-HTX-02",
  "unit": "A40",
  "type": "Move-Out",
  "status": "NOT RENT-READY",
  "timestamp": "2026-05-14T10:00:00.000Z",
  "inspectorName": "Zaphyr",
  "items": {
    "DOOR-01": {
      "id": "DOOR-01",
      "category": "Access & Doors",
      "name": "Roll-Up Door Operation",
      "status": "Fail",
      "tier": "Red",
      "note": "Track bent at mid-rail."
    }
  },
  "deltaItems": {
    "DOOR-01": {
      "itemId": "DOOR-01",
      "statusChanged": true,
      "previousStatus": "Pass",
      "repairCost": 450
    }
  },
  "photos": [],
  "runnerNotes": "Significant structural damage logged.",
  "inspectorSignature": "data:image/png;base64,iVBOR..."
}
```

<h2 id="4-component-architecture--state-management">4. Component Architecture & State Management</h2>
React patterns focus on separation of concerns prioritizing clean, offline-capable render cycles.

- **`App.tsx`**: The top-level application shell. Tracks global offline syncing UI and orchestrates modals.
- **`hooks.ts (useInspection)`**: Global state management brain. Handles `IndexedDB` queues, state dispatching, and synchronization routines independently of the UI.
- **`components/ForensicSummary.tsx`**: Status aggregation dashboard embedding Voice-to-Text hooks.
- **`components/DocumentGenerator.tsx`**: Handles split-pane print layouts for Notices.
- **`components/DetailedChecklistPrint.tsx`**: Print-only element organizing deep checklist reporting.
- **`components/SignatureCapture.tsx`**: Responsive touch-aware Canvas controller logic.

<h2 id="5-external-dependencies">5. External Dependencies</h2>
- **React (18.x) & Vite:** Immediate reactivity and fast module replacement.
- **Tailwind CSS (3.x):** Embedded inline configurations avoiding CSS-in-JS runtimes.
- **lucide-react:** Lightweight, distinct, SVGs for iconography.
- **jsQR:** Pure JS library for interpreting pixel data into QR strings.
- **idb:** A lightweight IndexedDB wrapper providing Promise-based operations.

<h2 id="6-build--deployment">6. Build & Deployment</h2>
- The platform functions as a single containerized front-end via **Google Cloud Run**.
- Employs an Express server with `vite` middleware serving static bundles cleanly on Port 3000.
- Re-routing falls back to `index.html` guaranteeing SPA behavior across deep un-indexed routes.

<h2 id="7-compliance--texas-specific-provisions">7. Compliance & Texas-Specific Provisions</h2>
To address Kevin's explicit concern over defensible action, the tool has specific legal safeguards:
1. **Chapter 59 Liability Mitigation:** Capturing baseline visual evidence against deteriorated thresholds removes arbitrary property-damage interpretations from the tenant, protecting Flywheel from arbitrary court judgments.
2. **Procedural Document Generation:** Automatically formats `Notice of Entry` and `Notice of Claim / Intent to Enforce Landlord's Lien` tailored directly for Texas properties.
3. **Temporal Authentication:** Canvas-level photo watermarking imprints irrefutable geolocation and ISO-timestamp elements into pixels directly.

<h2 id="8-improvement-opportunities--customization">8. Improvement Opportunities & Customization</h2>
Following Zaphyr's discussion with Kevin & Rachel, these automations represent the next natural evolutionary phase for Flywheel's operations:

#### A. Slack / Team Communication Hook
- **What:** Instant alerts to `#maintenance` or `#operations` when a unit fails an `UNSAFE` tier check.
- **Why Align:** Rachel and Kevin both highlighted the need for operations to move swiftly. Sending the \`runnerNotes\` directly to the team via Slack webhook eliminates lag time fetching the report.
- **Integration:** Deploy via Google Cloud Functions parsing the JSON payload.

#### B. Dynamic "Config-File" Branding
- **What:** Relocating the "Flywheel Investors LLC" hard-code text and entity address to an external `flywheel-config.json` repository within the app storage.
- **Why Align:** Makes the application indefinitely scalable as Kevin initiates future facility acquisitions. Document formatting changes instantly per site location simply by changing the context entity.

#### C. Automated Tenant Document Routing
- **What:** Passing the formal legal HTML to an external API to dispatch straight to the tenant's email / SMS on finalizing a state shift.
- **Why Align:** Drastically automates and reinforces Texas Chapter 59 notifications without additional manual PDFs needing attached loops in generic CRMs.
- **Integration:** API callouts directly structured for Twilio (SMS) and SendGrid (Email).

#### D. UI Streamlining
- Increase contrast on Voice-To-Text elements for intense daylight environments.
- Add immediate sync overriding toggles.

<h2 id="9-future-roadmap">9. Future Roadmap</h2>
1. **Immediate Phase:** Hardened testing of indexedDB limits against multi-MB image bloat scenarios, integrating file compressions for weak cellular areas.
2. **Intermediate Phase:** Building the Google Cloud function pipelines mapping the ingested JSON endpoints directly to Zoho CRM for tenant matching.
3. **Advanced Integrations:** Linking the AI Vision capability to assess photos dynamically (via Gemini) to pre-populate checklist statuses before the inspector explicitly evaluates the damage.

