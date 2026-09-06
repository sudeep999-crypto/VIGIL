# VIGIL — Predictive Early-Warning System for PAIMANA

A working prototype built for SIH 2026, Problem Statement 103 (Team BWU Strivex). PAIMANA tracks infrastructure projects across ministries but is purely descriptive — delays are visible only after they happen. VIGIL adds a predictive layer: score every project's delay risk from its data, explain *why* using SHAP, and surface it for early intervention.

## What's actually implemented

This is a real, running pipeline — not mockups. Be honest about scope if asked: **no PAIMANA API access, no live government data, no database** — those are production roadmap, not built.

- **Synthetic dataset** (`backend/synthetic_projects.csv`) — 1,981 synthetic infrastructure projects across 15 ministries, mimicking PAIMANA's structure (budget, timeline, physical progress, reporting behavior, ground-truth `is_delayed` label). *Note: PAIMANA's real portfolio spans 17 ministries; this dataset covers a representative subset of 15.*
- **XGBoost classifier** (`backend/train_model.py`) — 150 trees, max_depth=4, learning_rate=0.1. **Test accuracy 94.0%, ROC-AUC 0.954** (80/20 stratified train/test split, held-out and never trained on).
- **Model inspection** (`backend/inspect_model.py`) — prints hyperparameters and feature importances, renders one real tree from the ensemble as `one_tree.png` for visual proof/Q&A.
- **SHAP explainability + risk briefs** (`backend/compute_predictions.py`) — runs SHAP `TreeExplainer` on every project, precomputes `risk_score`, the top 3 contributing factors (`risk_reasons`, signed impact), and a plain-language one-paragraph summary (`risk_brief`) per project. Output: `predictions.json`.
- **FastAPI backend** (`backend/main.py`) — loads `predictions.json` into memory at startup; nothing computes live. CORS enabled.

## Project structure

```
backend/
├── train_model.py           trains the model → model.pkl, feature_columns.json
├── inspect_model.py          model inspection → one_tree.png
├── compute_predictions.py    SHAP + risk briefs → predictions.json
├── main.py                    FastAPI app (all routes)
├── synthetic_projects.csv
├── model.pkl
├── feature_columns.json
├── predictions.json
└── one_tree.png
```

## Running it

Requires Python 3.10+ and [Graphviz](https://graphviz.org/download/) installed on the system (needed by `inspect_model.py`).

```bash
cd backend
pip install -r requirements.txt
python train_model.py
python inspect_model.py
python compute_predictions.py
uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for an interactive view of every endpoint.

## API reference

| Endpoint | Description |
|---|---|
| `GET /` | Health check — returns status + total projects loaded |
| `GET /projects` | All projects. Filters: `?ministry=X`, `?min_risk=Y` |
| `GET /projects/{id}` | Single project — full detail incl. `risk_reasons` and `risk_brief` |
| `GET /summary` | Ministry-level rollup (avg risk, high-risk count) — feeds the heatmap |
| `GET /alerts?limit=N` | Top-N highest-risk projects (default 10), sorted descending |

## Known, honest limitations

- **Data leakage**: `percent_complete` and `progress_vs_expected` are correlated with the training label, since they were generated with that relationship baked into the synthetic data. Quantified: removing those two features drops the model to **88.7% accuracy / 0.918 ROC-AUC** — still well above chance, showing the model captures real signal beyond the leaky features, but the headline 94% is partly inflated by them.
- **Recall on delayed projects is 0.83** — the model misses roughly 1 in 6 projects that are actually delayed. Precision is strong (0.96) — when it does flag a project, it's usually right.
- **Bimodal risk scores** — scores cluster low or high, with relatively few projects in the 20–80 middle range. This reflects how the synthetic data separates, not a scoring bug.
- **Portfolio value mismatch** — the synthetic dataset's total budget doesn't match PAIMANA's real reported figure. Doesn't affect the model or the demo; not worth chasing an exact match.

## Roadmap to real PAIMANA integration

The pipeline is written against the same project schema PAIMANA already exposes (cost, expenditure, milestones, physical progress). Moving to production would mean replacing the synthetic data generator with a scheduled job pulling from the real PAIMANA/OCMS API, retraining `train_model.py` on real historical data, and adding a database — the model, SHAP explanation, and API layer stay the same.

## Tech stack

Python (FastAPI, XGBoost, SHAP, scikit-learn, pandas) · React + Tailwind frontend (in progress) · Groq-backed chatbot with guardrails (in progress)
