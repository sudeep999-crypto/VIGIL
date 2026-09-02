# VIGIL — Predictive Early-Warning System for PAIMANA

A working prototype of the solution proposed for **SIH26103** (Use case on
web-based integrated project-monitoring platform, Theme: Smart Automation).

VIGIL scores every infrastructure project 0–100 for cost/schedule risk using
a trained XGBoost model, explains *why* each score was given using SHAP
feature attribution, and surfaces the highest-risk projects as auto-generated
plain-language alert briefs on a live dashboard.

## What's actually implemented

This is a real, running application — not mockups:

- **Synthetic PAIMANA-like dataset** (`backend/data_gen.py`) — 180
  infrastructure projects across 10 ministries / 10 sectors, with realistic
  correlated risk patterns (progress lag, cost overrun, schedule slippage).
  Real PAIMANA data requires government portal access, so this generator
  produces data with the same shape and failure signatures so the rest of
  the pipeline behaves exactly as it would on the live feed.
- **Feature engineering + XGBoost regressor** (`backend/model.py`) — trains
  in under a second on startup, predicts a continuous 0–100 risk score.
- **SHAP explainability** — every project's score comes with its top 4
  contributing factors and their direction (increases / reduces risk).
- **Auto-generated risk briefs** — plain-language one-paragraph summaries
  per project, the way an IPMD officer would want to read them.
- **FastAPI backend** (`backend/app.py`) — REST API for projects, project
  detail, portfolio stats, and alerts.
- **Dashboard frontend** (`backend/static/`) — vanilla HTML/CSS/JS (no
  build step required) with a ministry × sector risk heatmap, filterable
  project table, alert-brief rail, and a slide-in detail panel with a risk
  gauge and SHAP driver bars.

## Project structure

```
vigil-project/
├── README.md
└── backend/
    ├── app.py              FastAPI app + all API routes
    ├── data_gen.py         Synthetic PAIMANA-like project generator
    ├── model.py             Feature engineering, XGBoost training, SHAP
    ├── requirements.txt
    └── static/
        ├── index.html       Dashboard markup
        ├── styles.css       Dashboard styling
        └── app.js           Dashboard logic (fetch, render, filter, drawer)
```

## Running it

Requires Python 3.10+.

```bash
cd vigil-project/backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Then open **http://localhost:8000** in a browser. That's it — the FastAPI
app serves both the API and the dashboard, so there's no separate frontend
server or build step.

On startup the app generates the synthetic dataset and trains the XGBoost
model in-process (a couple of seconds); no external database or data files
are required.

### API reference

| Endpoint | Description |
|---|---|
| `GET /api/health` | Liveness check |
| `GET /api/projects` | List all projects with risk scores. Filters: `ministry`, `sector`, `risk`, `q` (name search) |
| `GET /api/projects/{id}` | Full project detail: SHAP explanation + auto-generated brief |
| `GET /api/stats` | Portfolio totals, risk-level counts, ministry×sector heatmap |
| `GET /api/alerts?limit=N` | Top-N highest-risk projects as alert briefs |

Example:

```bash
curl http://localhost:8000/api/projects?risk=Critical
curl http://localhost:8000/api/alerts?limit=5
```

## From prototype to the real PAIMANA integration

This prototype swaps only one thing to become the production system: the
data source. Everything downstream — feature engineering, the XGBoost
model, SHAP explanations, brief generation, and the dashboard — is written
against the same project schema PAIMANA already exposes (cost, expenditure,
milestones, physical progress), so `data_gen.py` would be replaced by a
scheduled Airflow job pulling from the PAIMANA/OCMS API into PostgreSQL, and
`model.py`'s training routine would run on that real historical data instead
of the synthetic generator. No other component changes.

## Tech stack

Python (FastAPI, XGBoost, SHAP, scikit-learn, pandas) · vanilla HTML/CSS/JS
dashboard (IBM Plex Sans/Mono, no framework or build step needed for this
prototype — the pitch's target production stack is React + Tailwind, per the
technical approach slide).
