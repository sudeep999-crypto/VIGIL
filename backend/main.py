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
import os
from collections import defaultdict

from dotenv import load_dotenv
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq

# --- LLM chat assistant setup -------------------------------------------
# load_dotenv() reads a .env file (if present) into environment variables,
# so GROQ_API_KEY can live outside the code. Create a .env file next to
# main.py containing:  GROQ_API_KEY=gsk_...
load_dotenv()
# Guarded so a missing GROQ_API_KEY can never crash the app at startup —
# the /chat endpoint degrades to its fallback message instead.
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

SYSTEM_PROMPT = """\
You are VIGIL's project assistant. You only answer questions about this \
specific project: VIGIL, a predictive delay-risk system for infrastructure \
monitoring built for SIH 2026.

You may ONLY use these facts:
- Model: XGBoost classifier with 150 trees and max_depth=4. Test accuracy \
is 94.0% and ROC-AUC is 0.954; however, with data-leakage features removed, \
accuracy drops to 88.7% and ROC-AUC to 0.918.
- Recall on delayed projects is 0.83; precision is 0.96.
- Dataset: 1,981 synthetic infrastructure projects across 15 ministries.
- Explainability: SHAP TreeExplainer, providing the top-3 reasons per \
project with signed impact.

Rules:
- If asked anything NOT about this project, respond exactly: \
"I can only answer questions about the VIGIL project."
- Never invent numbers not listed above.
"""

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


@app.get("/alerts")
def alerts(limit: int = 10):
    """
    Top risk alerts: the highest-risk projects, sorted by risk_score
    descending. ?limit=25 -> the 25 riskiest projects (default 10).
    """
    top = sorted(PROJECTS, key=lambda p: p["risk_score"], reverse=True)
    selected = [
        {
            "project_id": p["project_id"],
            "project_name": p["project_name"],
            "ministry": p["ministry"],
            "sector": p["sector"],
            "risk_score": p["risk_score"],
            "risk_brief": p["risk_brief"],
        }
        for p in top[: max(0, limit)]
    ]
    return {"count": len(selected), "alerts": selected}


@app.post("/chat")
def chat(question: str = Body(..., embed=True)):
    """
    Natural-language Q&A about the VIGIL project itself, backed by Groq's
    openai/gpt-oss-20b. The system prompt pins the assistant to verified
    project facts so it can't hallucinate metrics during the demo.
    Any Groq failure (network, rate limit, bad key) returns a friendly
    fallback instead of a 500, so the demo never crashes.
    """
    if client is None:
        return {
            "answer": "Sorry, I'm having trouble answering right now — "
            "please check the dashboard directly for project details."
        }
    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": question},
            ],
            temperature=0.3,
        )
        return {"answer": completion.choices[0].message.content}
    except Exception:
        return {
            "answer": "Sorry, I'm having trouble answering right now — "
            "please check the dashboard directly for project details."
        }
