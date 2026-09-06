"""
main.py — VIGIL backend.

Loads predictions.json ONCE at startup and serves it from memory.
No database, no live model calls, no live SHAP computation — everything
was precomputed offline by compute_predictions.py. This means the backend
literally cannot crash from a model error during your demo, because it
never touches the model.

Run: uvicorn main:app --reload --port 8000
Then open http://localhost:8000/docs to see and test every endpoint live —
useful for judges AND for debugging before the frontend is even connected.
"""

import json
from collections import defaultdict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="VIGIL API")

# CORS: without this, your React app (running on a different port, e.g. 5173)
# gets silently blocked by the browser from reading responses from this
# server (running on port 8000). This is the #1 "nothing shows up and
# there's no error" bug for first-time FastAPI+React setups.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # fine for a hackathon demo; would be locked down in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

# load once at startup, kept in memory — this is intentional, not a shortcut.
# reading a JSON file into a dict is instant and can't fail mid-demo the way
# a live DB connection can.
with open("predictions.json") as f:
    PROJECTS = json.load(f)

PROJECTS_BY_ID = {p["project_id"]: p for p in PROJECTS}


@app.get("/")
def root():
    return {"status": "VIGIL API running", "projects_loaded": len(PROJECTS)}


@app.get("/projects")
def list_projects(ministry: str | None = None, min_risk: float | None = None):
    """
    Returns all projects, optionally filtered.
    ?ministry=Power           -> only Power ministry projects
    ?min_risk=65              -> only projects at or above 65% risk
    """
    results = PROJECTS
    if ministry:
        results = [p for p in results if p["ministry"] == ministry]
    if min_risk is not None:
        results = [p for p in results if p["risk_score"] >= min_risk]
    return {"count": len(results), "projects": results}


@app.get("/projects/{project_id}")
def get_project(project_id: str):
    """Single project with full SHAP risk_reasons — this feeds the detail view."""
    project = PROJECTS_BY_ID.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.get("/summary")
def summary():
    """
    Ministry-level rollup for the heatmap: average risk score and count
    per ministry. This is what colors each cell in the heatmap.
    """
    by_ministry = defaultdict(list)
    for p in PROJECTS:
        by_ministry[p["ministry"]].append(p["risk_score"])

    rollup = [
        {
            "ministry": ministry,
            "project_count": len(scores),
            "avg_risk": round(sum(scores) / len(scores), 1),
            "high_risk_count": sum(1 for s in scores if s >= 65),
        }
        for ministry, scores in by_ministry.items()
    ]
    rollup.sort(key=lambda x: x["avg_risk"], reverse=True)

    return {
        "total_projects": len(PROJECTS),
        "total_high_risk": sum(1 for p in PROJECTS if p["risk_score"] >= 65),
        "ministries": rollup,
    }
