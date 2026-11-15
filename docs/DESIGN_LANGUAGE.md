# CampusFlow Design Language: The Campus Registrar's Office

## 1. Philosophy & Aesthetic Concept
CampusFlow rejects modern generic "SaaS boilerplate" (glowing gradients, frosted glass blur, rounded colorful card grids, emoji decoration, and centered "Welcome back" hero banners). 

Instead, CampusFlow draws from the visual gravitas, authoritative precision, and tactile clarity of the **University Registrar's Office** and the **Industrial Examination Board**:
- **Administrative Gravitas**: Ruled hairline borders, archival proportions, numbered dockets, and stamp-verified statuses.
- **Precision Data Presentation**: Tabular figures in JetBrains Mono, ledger-style KPI strips, and structured dossiers.
- **Physical Document Metaphors**: Admit cards, perforated tears, official seal stamps, and marginalia notes.

---

## 2. Palette & Contrast Matrix

### Core Hues
- **Midnight** (`#0B1F1A` / `#071512`): The ink of archival ledgers. Used for deep dark mode backgrounds and strong light-mode typography.
- **Emerald** (`#0F7B5F` / `#0A5C47`): The institutional seal. Used for primary actions, verified statuses, and affirmative decisions.
- **Champagne Gold** (`#D9B36C` / `#B8924B`): The registrar's wax seal and honors accent. Used sparingly for highlights, current milestones, and badges.
- **Ivory Paper** (`#F7F3EA` / `#FBF9F4`): The textured bond paper base for light mode.

### Contrast & Legibility Rules
- **No gold text on light backgrounds**: Gold (`#D9B36C`) may only be used as a background pill with dark ink text (`#071512`), or as an accent border/glyph.
- **No dark-on-dark in dark mode**: Surfaces in dark mode elevate from `#071512` (canvas) to `#0E241E` (surface) and `#14332B` (elevated). Text is always high-contrast ivory (`#F7F3EA`), secondary sage (`#D2DED9`), or muted leaf (`#9BB4AC`).
- **Select dropdown readability**: All `<select>` and `<option>` elements have explicit dark-mode background (`#0E241E`) and foreground (`#F7F3EA`) tokens.

---

## 3. Typography Trio

1. **Fraunces** (Display Serif):
   - Role: Document headers, student & company names, formal stage titles.
   - Tone: Classical, collegiate, trusted.
2. **DM Sans** (Administrative Sans):
   - Role: Body prose, navigation links, form labels, explanatory instructions.
   - Tone: Crisp, modern, legibly neutral.
3. **JetBrains Mono** (Technical Monospace):
   - Role: Registration numbers, seat IDs, timestamps, percentage scores, monetary figures, status stamps.
   - Tone: Scientific, unyielding precision.

---

## 4. The Banned List
The following patterns are strictly prohibited in CampusFlow:
1. **No Gradients** (except for the brand splash on the single login auth split-panel).
2. **No Glassmorphism / Backdrop Blur**: All containers have solid, opaque archival surfaces with hairline rules (`border-midnight-border` / `border-[#E2D9C8]`).
3. **No Emoji**: Statuses and actions use SVG symbols or textual StampBadges.
4. **No Icon-in-Square Stat Tiles**: Replaced by the ruled `LedgerStrip`.
5. **No Grid of Identical Rounded Cards**: Replaced by asymmetric ledgers, AdmitCards, and Dockets.
6. **No Centered Hero Banners or "Welcome back!" Filler**: Dashboards immediately present pending actions, recent transactions, and upcoming schedules.
7. **No Heavy Shadows**: Replaced by 1px hairline rules and crisp borders.

---

## 5. Signature Component Catalog

### 1. StampBadge (`client/src/components/signature/StampBadge.jsx`)
Simulates an official rubber-ink stamp applied to an administrative document.
- **Visuals**: Uppercase JetBrains Mono, double or single 1.5px border, subtle rotation on hover or resting state (optional -0.5deg), high-contrast tint.
- **Variants**: `success` (OFFERED, ACCEPTED, ONLINE, ELIGIBLE), `warning` (PENDING, SHORTLISTED, FLAGGED), `danger` (REJECTED, WITHDRAWN, OFFLINE), `neutral` (APPLIED, ALLOCATED, DRAFT).

### 2. AdmitCard (`client/src/components/signature/AdmitCard.jsx`)
An authoritative hall-ticket format used for tests, interview slots, and active drive applications.
- **Visuals**: Ruled frame with ticket-stub perforated hairline divider, mono candidate registration code, date & slot timetable, location / lab badge, and QR/barcode glyph.

### 3. JourneyRail (`client/src/components/signature/JourneyRail.jsx`)
Chronological tracking strip replacing generic progress bars.
- **Visuals**: Solid ruled spine with stamped stage markers (COMPLETED, CURRENT, UPCOMING). Highlights offer acceptance and withdrawal actions with institutional weight.

### 4. LedgerStrip (`client/src/components/signature/LedgerStrip.jsx`)
Replaces generic card stat tiles with a single horizontal financial/academic ledger.
- **Visuals**: Segmented row divided by vertical hairlines. Each segment displays a compact mono title, large tabular figure, and delta/trend indicator.

### 5. MarginNote (`client/src/components/signature/MarginNote.jsx`)
Registrar's marginalia commentary providing context, deadlines, and actionable guidance without cluttering the primary flow.
- **Visuals**: Left-ruled border with subtle institutional tint, serif title, concise plain-English advisory text.

### 6. LedgerTable (`client/src/components/signature/LedgerTable.jsx`)
A clean, dense data ledger replacing bubbly generic data tables.
- **Visuals**: Hairline row dividers, mono numerical alignments, stamp badges, row hover highlight, integrated search and sort triggers.

### 7. SeatMap (`client/src/components/signature/SeatMap.jsx`)
Lab floor plan for Exam PCs and Exam Monitoring.
- **Visuals**: Realistic desk glyphs organized into physical lab rows and columns.
- **States**: `free`, `allocated`, `online`, `offline`, `flagged`, `maintenance`.
- **Interactions**: Keyboard arrow navigation (focus ring), hover tooltip, click to inspect dossier and trigger supervisor actions.

### 8. ControlRoomTicker (`client/src/components/signature/ControlRoomTicker.jsx`)
Monospaced live event feed for exam supervisor and kernel telemetry.
- **Visuals**: Ruled terminal rows, timestamps in JetBrains Mono, pause/resume control, StampBadge event categories, smooth slide-in row transition.

### 9. QueueLanes (`client/src/components/signature/QueueLanes.jsx`)
Horizontal resource tracks for lock concurrency and OS simulator telemetry.
- **Visuals**: Resource rail with filled token for the active lock holder and hollow tokens for waiting queue requests.

### 10. Docket (`client/src/components/signature/Docket.jsx`)
A numbered "Needs Attention" queue for admins and recruiters.
- **Visuals**: Numbered items (#01, #02...), category stamp badge, summary line, and immediate single-click action button.

### 11. Dossier (`client/src/components/signature/Dossier.jsx`)
Document slide-over presentation for candidates, companies, and exam PCs.
- **Visuals**: Serif name header, ruled two-column credential ledger, document attachment cards, and formal action row.

### 12. TimelineRule (`client/src/components/signature/TimelineRule.jsx`)
Architectural Gantt chart with hairline tick marks, mono hour/date markers, and crisp schedule bars.

