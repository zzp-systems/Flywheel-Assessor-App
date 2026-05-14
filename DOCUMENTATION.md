# Flywheel Assessor App — Technical & Functional Reference

## 1. Application Overview

**Purpose of the App:**
The Flywheel Assessor App is a specialized, mobile-first web application designed for self-storage facility inspections by Flywheel Investors in Texas. It provides a structured, traffic-light framework (Red, Yellow, Green tiers) for assessing unit conditions across different inspection lifecycle events (Move-In, Mid-Tenancy, and Move-Out). The application generates comprehensive forensic summaries, tracks photo evidence with watermarks, calculates damage delta reports for move-outs, and handles offline environments seamlessly via local storage syncing.

**Technology Stack:**
- **Frontend Framework:** React 18+ (using functional components and Hooks)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Offline Storage:** IndexedDB (native browser API)
- **Service Worker:** Native Service Worker API (Cache API for assets)

**Design Philosophy:**
The app employs a **Bold & Energetic** design language. It uses strong brand colors (Navy, Red, Amber, Green) with heavy typography (Space Grotesk for display, Inter for body) and clear, high-contrast structural borders to create a robust, "field-ready" tool. The mobile-first layout ensures ease of use with one hand on small devices, while being fully offline-capable for facilities with poor network connectivity.

---

## 2. Features & Functional Modules

### Inspection Type Selection
The app adapts entirely to the selected mode:
- **Move-In Baseline:** Evaluates all Red, Yellow, and Green tier items to establish the baseline condition of the unit before a tenant moves in.
- **Mid-Tenancy / Health & Safety (3-Day Notice Req.):** Focuses specifically on Red (Life Safety) and major Yellow (Habitability) items to ensure compliance and identify severe violations.
- **Move-Out / Turnover:** Evaluates all items to determine what maintenance is required to make the unit rent-ready again, unlocking the Delta Report module.

### Traffic-Light Compliance Framework
Items are strictly categorized by severity:
- **🔴 Red Light (Life Safety):** Critical issues like fire sprinklers, exposed wiring, and structural damage. If any Red item fails, the unit is immediately deemed UNSAFE. Management notification is required.
- **🟡 Yellow Light (Condition & Habitability):** Structural and functional issues like door alignment, hasp condition, and leaks. Fails here render the unit NOT RENT-READY. Documentation is a heavy focus.
- **🟢 Green Light (Rent-Ready Visuals):** Cleanliness and cosmetic baseline items. Sweepouts, minor scuffs, etc. 

### Dynamic Checklist Rendering
Checklist items dynamically load based on the `InspectionType`. Each item offers three toggle buttons: **Pass**, **Fail**, and **N/A**. If 'Fail' is selected, the list item expands to display a mandatory "Note" field.

### Unit Status Logic
The overall inspection status is determined automatically by the checklist state:
1. **INSPECTION IN PROGRESS:** If *any* item is left in the "Pending" state.
2. **UNSAFE — DO NOT RENT:** If *any* Red tier item is marked "Fail".
3. **NOT RENT-READY:** If all Red items pass (or N/A), but *any* Yellow tier item is marked "Fail".
4. **RENT-READY:** If *all* items are marked "Pass" or "N/A" (applicable to the inspection type) and nothing is Pending or Failed.

### Photo Capture & Linking
When the user taps "Add Photo", the device's native file chooser opens (allowing both Camera and Gallery).
- **Linking Modal:** Upon selecting an image, a full-screen modal prompts the user to select the specific checklist item the photo corresponds to. The items are neatly grouped by Red, Yellow, and Green tiers.
- **Submission:** The user must tap "Link Photo" to process the image.

### Photo Watermarking
A background `<canvas>` element generates a non-destructive watermark on the selected photo before saving it. Set in the bottom-right corner with a dark semi-transparent overlay and white text:
- Line 1: Facility Name
- Line 2: Unit Number
- Line 3: Building/Floor
- Line 4: Timestamp (Locale string)

### Photo Evidence Tracker
A robust grid displaying thumbnail previews of watermarked photos.
- **Count Indicator:** Shows progression (e.g., `4 / 15 Minimum`).
- **Required Shots:** Lists standard demanded shots (e.g., Exterior front, Unit door).
- **Labels:** The selected linked checklist item and unit number are rendered beneath each thumbnail.
- **Removal:** Each photo features a red "X" to delete it from state.

### Move-Out Delta Report (Repair Validation)
When the inspection type is "Move-Out", a Delta Report section appears.
- **Import:** Users import a JSON file from a previous "Move-In Baseline" inspection.
- **Comparison:** The app compares the Move-In item statuses against Move-Out statuses. Any item that went from 'Pass' to 'Fail' is flagged as **Deteriorated**.
- **Repair Cost Validation:** Evaluators can input monetary claim estimates for deteriorated items. Input fields strictly ensure numeric, positive values (throwing inline UI payload warnings otherwise) to reliably calculate the total expected chargeback or repair claim.

### Forensic Summary
A high-level overview generated progressively:
1. **Status Banner:** Auto-calculated compliance flag (Unsafe, Not Rent-Ready, etc.).
2. **Failed Items Log:** Lists every failed item alongside its respective notes.
3. **Runner Notes:** A generic text area for site context and oddities.
4. **Manager Follow-Up:** Basic to-do tracklist (e.g., "Schedule Maintenance Vendor").

### JSON Output
Clicking "Copy JSON" or "Export JSON File" serializes the entire inspection state into a strictly-typed payload, including photo Base64 data with watermarks and attached metadata. See section 4 for the exact standard.

### Print View
Using CSS `@media print`, printing generates a clean, formal document. 
- **Hidden in Print:** Buttons, inputs, empty photo upload triggers, and interactive widgets.
- **Shown in Print:** Data outputs, notes, checklist Pass/Fail/N/A text labels, and the forensic breakdown.
- **Header/Footer:** Flywheel Investors Title, Inspector details, Auto-Timestamp, and a footer referencing "Texas Property Code Chapter 59".

### Offline Support
- **Service Worker (`sw.js`):** Intercepts fetch requests and caches `index.html`, JS bundles, CSS, and fonts ensuring zero-latency offline loading.
- **IndexedDB (`FlywheelInspectionDB`):** The custom React Hook `useInspection` writes live changes to IndexedDB.
- **Syncing:** Upon network restoration, an event listener synchronizes IndexedDB back to standard lifecycle mechanisms and alerts the user with a "Syncing to Cloud..." toast notification.

---

## 3. Component Architecture

The app uses standard functional React components and a central custom hook for state isolation.

- **`App.tsx`**: The main scaffolding and UI shell. Organizes headers, footers, print classes, and overall layout logic. Also houses the top-level Inspection Details form (Facility, Unit, etc.).
- **`hooks.ts`**: Contains `useInspection`, the central state engine. Manages `InspectionData`, IndexedDB reads/writes, online/offline status listeners, Delta cost calculators, and photo addition logic with watermarking.
- **`components/ChecklistView.tsx`**: Renders the dynamic list of items by tier. Handles the status toggles and failure notes.
- **`components/ForensicSummary.tsx`**: Calculates the RENT-READY vs UNSAFE statuses and lists failed items. Contains the Runner Notes and Manager Follow-Up checkboxes.
- **`components/PhotoTracker.tsx`**: Handles the file input trigger, the Linking Modal, the Canvas watermarking process, and rendering the photo grid.
- **`components/DeltaReport.tsx`**: Accessible only in "Move-Out". Handles JSON import parsing and the repair cost input components with strict validation mechanisms.
- **`components/JsonOutput.tsx`**: Provides the plain-text textarea to copy the JSON object and the trigger for downloading an `.json` format file.

**State Flow:** Data flows down from the `useInspection` hook into the functional components via props. Modifiers are passed as callback functions (`updateField`, `addPhoto`, etc.).

---

## 4. Data Models & Metadata Schemas

### Inspection Object
Top-level JSON output structure:

```json
{
  "id": "x8f2kd",
  "date": "2025-01-15T10:30:00Z",
  "type": "Move-Out",
  "facilityName": "Austin South Peak",
  "unitNumber": "A105",
  "building": "Bldg 1",
  "unitType": "Climate-Controlled",
  "inspectorName": "John Doe",
  "weather": "85°F Sunny",
  "items": {
    "red-fire-sprinkler": {
      "id": "red-fire-sprinkler",
      "tier": "Red",
      "text": "Fire Sprinkler / Alarm Status",
      "status": "Fail",
      "note": "Sprinkler head blocked by boxes."
    }
  },
  "photos": [
    {
      "id": "p_1j4l8k",
      "dataUri": "data:image/jpeg;base64,...",
      "caption": "",
      "timestamp": "2025-01-15T10:35:12Z",
      "linkedItemId": "red-fire-sprinkler",
      "facilityName": "Austin South Peak",
      "unitNumber": "A105",
      "buildingFloor": "Bldg 1"
    }
  ],
  "deltaItems": {
    "red-fire-sprinkler": {
      "id": "red-fire-sprinkler",
      "tier": "Red",
      "text": "Fire Sprinkler / Alarm Status",
      "status": "Fail",
      "note": "Sprinkler head blocked by boxes.",
      "baselineStatus": "Pass",
      "isDeteriorated": true,
      "repairCostEstimate": 150.00
    }
  },
  "runnerNotes": "Heavy tenant debris left behind.",
  "managerFollowUp": {
    "Schedule Maintenance Vendor": false,
    "Review Move-In Baseline JSON": true
  }
}
```

### TypeScript Interfaces (from `src/types.ts`)

```typescript
export type InspectionType = 'Move-In Baseline' | 'Mid-Tenancy' | 'Move-Out';
export type Status = 'Pending' | 'Pass' | 'Fail' | 'N/A';
export type Tier = 'Red' | 'Yellow' | 'Green';

export interface ChecklistItem {
  id: string;
  tier: Tier;
  text: string;
  status: Status;
  note?: string;
}

export interface PhotoData {
  id: string;
  dataUri: string;
  caption: string;
  timestamp: string;
  linkedItemId?: string;
  facilityName?: string;
  unitNumber?: string;
  buildingFloor?: string;
}

export interface DeltaItem extends ChecklistItem {
  baselineStatus: Status;
  isDeteriorated: boolean;
  repairCostEstimate?: number;
}

export interface InspectionData {
  id: string;
  date: string;
  type: InspectionType;
  facilityName: string;
  unitNumber: string;
  building: string;
  unitType: string;
  inspectorName: string;
  weather: string;
  items: Record<string, ChecklistItem>;
  photos: PhotoData[];
  deltaItems?: Record<string, DeltaItem>;
  runnerNotes: string;
  managerFollowUp: Record<string, boolean>;
}
```

---

## 5. Key Logic Flows

### Performing a Move-In Inspection
1. User loads the app, inputs Facility and Unit details.
2. Selects "Move-In Baseline".
3. Reviews all checklist items natively generated by the system, toggling them to Pass/Fail/N/A.
4. Completes all required photos.
5. Verifies the status banner asserts "RENT-READY".
6. Exports JSON file representing the Move-In condition.

### Performing a Mid-Tenancy Health & Safety Inspection
1. User filters the type to "Mid-Tenancy".
2. The checklist prunes Green items, heavily emphasizing Red and Yellow.
3. If structural anomalies exist, the inspector flags 'Fail' and notes the issue.
4. App sets the overall flag to "NOT RENT-READY" signaling maintenance intervention.

### Performing a Move-Out Inspection with Delta Report
1. Inspector selects "Move-Out Assessment".
2. Toggles items against the current unit state.
3. Upon finalizing checks, the user navigates down to the **Move-Out Delta Report**.
4. The user clicks "Import Baseline JSON" and loads the file previously captured during the Move-In.
5. The system performs a diff operation: any "Pass" item from Move-In that is now "Fail" in Move-Out alerts as *Deteriorated*.
6. The user manually inputs local repair costs under the generated breakdown.

### Adding a Photo, Linking & Watermarking
1. Tap "Add Photo" -> Native File explorer presents (Camera/Gallery).
2. Tapping capture/select renders the **Linking Modal** referencing `ChecklistView` tiers. 
3. User selects the related `ChecklistItem` matching the forensic failure. 
4. User clicks "Link Photo". App passes the raw photo to `<canvas>`.
5. `<canvas>` overlays global state attributes (Facility/Unit/Building/ISO Timestamp).
6. Resultant canvas object flattens into compressed Base64 Data URI and persists securely.

### Exporting and Printing the Report
- **Exporting:** User generates JSON string mapped explicitly to `InspectionData`. Saves as `<facility>-<unit>-<date>.json`.
- **Printing:** User clicks the top-right Print icon. The browser print-spooler suppresses background input states leaving a PDF-ready, static layout.

### Using the App Offline
1. A facility has no Wi-Fi. The Service Worker loads the complete React DOM locally without a network request.
2. State modifications silently commit via IndexedDB transaction to `FlywheelInspectionDB`. 
3. App UI prominently displays "Offline Mode (Saving Locally)" indicator.
4. When mobile cell reception restores, a global listener hooks into online events, rendering a green "Syncing to Cloud" bar. Process resumes.

---

## 6. External Dependencies

There are minimal dependencies purposefully curated to maintain a fast offline cache:
- **Tailwind CSS (`tailwindcss` + `@tailwindcss/vite`):** Post-processor driving utility stylings.
- **React (`react`, `react-dom`):** UI rendering engine.
- **Lucide React (`lucide-react`):** SVG Icon-pack powering `Camera`, `Printer`, `WifiOff`, `FileDown` etc.

No external charting libraries (Recharts) or data-processing networks (Axios) are utilized to preserve maximum sandboxed reliability.

---

## 7. Styling & Theming

**Brand Foundations:**
- **Primary Fonts:** 
  - `Space Grotesk` (Headers, Titles, Displays). Creates a technical, futuristic, authoritative look.
  - `Inter` (Body, Form Labels, Text). Highly legible for field devices.
- **Color Pallets:**
  - `brand-navy` (`#0F1C2E` / `#2A5185`): Flywheel core brand tones representing authority in financial audits.
  - `brand-amber` (`#F59E0B`): Energetic highlight signaling warnings.
  - `brand-red` (`#DC2626`): Unsafe condition alert tone.
  - `brand-green` (`#059669`): Rent-Ready success tone.
- **CSS Variable Injections (`src/index.css`)**:
  Used to lock the theme parameters across Tailwind utility classes natively. Allows usage like `bg-brand-navy`.

**Interaction Methods:**
Significant emphasis is placed on immediate active UI feedback. Checkboxes animate scale, photo deletions have hover-pulse events, and Unsafe/Red items animate a red `animate-pulse` specifically on "Pending" to guide the user's eye to immediate life-safety checklists.

---

## 8. Build & Deployment

**Build Approach:**
Constructed using Vite under a standard ESM-Node pipeline. 
- Running `npm run build` compiles static assets inside `/dist`.
- Service Worker `sw.js` naturally replicates `dist/` caching references.

**Deployment Constraints (Cloud Run / Static Hosting):**
Because the system employs a purely Single-Page Application (SPA) logic constraint with *no proprietary backend server calls*, the `/dist` package can be trivially exported and hosted completely natively as a static site.
- **Google Cloud Run:** Served over lightweight NGINX containers mapping traffic exclusively to port `3000`. 
- **Offline Reliability:** Service workers bind strictly to `https://` protocol architectures guaranteeing IndexedDB secure-context sandboxing properties automatically when deployed to standard platforms.
