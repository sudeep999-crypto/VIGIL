\---

name: vigil-design-system

description: Strict UI/UX design principles, aesthetic rules, and data constraints for the VIGIL dashboard frontend.

\---



\# VIGIL Design System \& Constraints



\## 1. Core Design Philosophy

\* Aesthetic: Linear/Vercel-inspired control room. Serious, trustworthy, and data-dense.

\* Restraint: Empty space is a feature. Do not fill whitespace with unnecessary borders, panels, or decorations.

\* No Consumer Fluff: No purple gradients, no oversized rounded cards, no cartoonish illustrations, no emoji icons.



\## 2. Color Palette (Strict Dark Mode)

\* Background: Near-black (`#0a0a0a`).

\* Surface/Cards: Slightly lighter (`#131313`).

\* Borders: 1px subtle gray (`#2a2a2a`). Absolutely NO drop shadows.

\* Primary Text: Off-white (`#e8e8e8`).

\* Secondary Text: Muted gray (`#888888`).

\* Accent Color: Electric blue (`#3b82f6`) — reserved ONLY for interactive elements (buttons, active states).

\* Risk Gradient: Green (`#22c55e`) -> Amber (`#eab308`) -> Red (`#ef4444`). Used strictly for heatmap tiles, risk score badges, and gauges.



\## 3. Typography

\* Base Font: Clean sans-serif (Inter or system UI).

\* Numbers: You MUST use tabular/monospace numerals (`font-mono` or `tabular-nums`) for ALL stats, risk scores, and project IDs.



\## 4. The Liquid Glass Rule

\* Data is Solid: Heatmap tiles, Stat Cards, Project Table, and SHAP bars MUST remain fully solid and opaque.

\* Overlays are Glass: Apply a liquid glassmorphism effect (`backdrop-filter: blur()`, semi-transparent background) ONLY to floating overlays.

\* Chat Bar: Persistent bar fixed to the bottom of the viewport (`position: fixed`, `bottom-0`), centered horizontally (`max-w-3xl mx-auto`). Apply the liquid glass effect here. Give main layout sufficient bottom padding.



\## 5. Motion \& Micro-interactions

\* Library: Use `framer-motion`.

\* Constraints: Motion must be functional, not decorative. NO page-load splash screens.

\* Approved Animations:

&#x20; \* Subtle hover scale on Heatmap tiles.

&#x20; \* Fast number count-up for top Stat Cards on mount.

&#x20; \* Quick slide-in transition for Project Detail panel.

&#x20; \* Horizontal SHAP bars animating from 0 to value.



\## 6. Data Integrity \& Anti-Hallucination

\* The Contract: Frontend MUST strictly map to `backend/API\_CONTRACT.md`.

\* No Invented UI: Omit "Export" buttons, "Classification Level 1" footers, "Monte Carlo Simulation" panels, and "National Cohort Ranks".

\* SHAP Labels: Use the exact feature strings returned by `/projects/{id}` API. Do not invent narrative labels.

