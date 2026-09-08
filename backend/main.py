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
import re
from collections import defaultdict

from dotenv import load_dotenv
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq

# --- LLM chat assistant setup -------------------------------------------
# load_dotenv() reads a .env file (if present) into environment variables.
env_file = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_file):
    load_dotenv(env_file)
else:
    load_dotenv()

# Guarded so a missing GROQ_API_KEY can never crash the app at startup —
# the /chat endpoint degrades to its fallback message instead.
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

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
pred_path = os.path.join(os.path.dirname(__file__), "predictions.json")
with open(pred_path if os.path.exists(pred_path) else "predictions.json") as f:
    PROJECTS = json.load(f)

PROJECTS_BY_ID = {p["project_id"]: p for p in PROJECTS}


def build_summary_block() -> dict:
    """
    Builds a compact summary block from in-memory PROJECTS data containing:
    - total_projects, total_high_risk, avg_risk_score overall
    - per-ministry breakdown: project_count, avg_risk, high_risk_count for all 15 ministries
    - top 10 highest-risk projects (project_id, project_name, ministry, risk_score)
    """
    by_ministry = defaultdict(list)
    for p in PROJECTS:
        by_ministry[p["ministry"]].append(p["risk_score"])

    ministries_rollup = [
        {
            "ministry": m,
            "project_count": len(scores),
            "avg_risk": round(sum(scores) / len(scores), 1),
            "high_risk_count": sum(1 for s in scores if s >= 65),
        }
        for m, scores in by_ministry.items()
    ]
    ministries_rollup.sort(key=lambda x: x["avg_risk"], reverse=True)

    all_scores = [p["risk_score"] for p in PROJECTS]
    overall_avg = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0.0

    top_10 = sorted(PROJECTS, key=lambda p: p["risk_score"], reverse=True)[:10]
    top_10_list = [
        {
            "project_id": p["project_id"],
            "project_name": p["project_name"],
            "ministry": p["ministry"],
            "risk_score": p["risk_score"],
        }
        for p in top_10
    ]

    return {
        "total_projects": len(PROJECTS),
        "total_high_risk": sum(1 for p in PROJECTS if p["risk_score"] >= 65),
        "avg_risk_score": overall_avg,
        "ministries": ministries_rollup,
        "top_10_highest_risk": top_10_list,
    }


def build_system_prompt(question: str) -> str:
    """
    Constructs a strict system prompt containing static model facts,
    the live in-memory dataset summary, and any specific project record
    referenced by project ID in the user query.
    """
    summary_block = build_summary_block()

    prompt_parts = [
        "You are VIGIL's project assistant. You only answer questions about this "
        "specific project: VIGIL, a predictive delay-risk early warning system for infrastructure "
        "monitoring built for SIH 2026.\n",
        "STATIC PROJECT FACTS:",
        "- Model: XGBoost classifier with 150 trees and max_depth=4. Test accuracy is 94.0% and ROC-AUC is 0.954; however, with data-leakage features removed, accuracy drops to 88.7% and ROC-AUC to 0.918.",
        "- Recall on delayed projects is 0.83; precision is 0.96.",
        "- Dataset: 1,981 synthetic infrastructure projects across 15 ministries.",
        "- Explainability: SHAP TreeExplainer, providing the top-3 reasons per project with signed impact.\n",
        "DATASET SUMMARY (from VIGIL's verified in-memory project registry):",
        json.dumps(summary_block, indent=2) + "\n",
    ]

    # Look up specific project(s) by ID pattern if present in the question
    matches = re.findall(r"(?i)\bPRJ[-_ ]?(\d+)\b", question)
    if matches:
        found_projects = []
        missing_ids = []
        for num in matches:
            pid = f"PRJ-{num.zfill(5)}"
            if pid in PROJECTS_BY_ID:
                if PROJECTS_BY_ID[pid] not in found_projects:
                    found_projects.append(PROJECTS_BY_ID[pid])
            else:
                if pid not in missing_ids:
                    missing_ids.append(pid)

        if found_projects:
            prompt_parts.append(
                "SPECIFIC PROJECT RECORD(S) MATCHED FROM QUERY:\n"
                + json.dumps(found_projects, indent=2) + "\n"
            )
        if missing_ids:
            missing_str = ", ".join(missing_ids)
            prompt_parts.append(
                f"NOTE: The following project ID(s) were requested but DO NOT exist in VIGIL: {missing_str}. "
                "Explicitly state that these project IDs were not found in the VIGIL system.\n"
            )

    prompt_parts.append(
        "RULES:\n"
        "- If asked anything NOT about the VIGIL project, respond exactly: \"I can only answer questions about the VIGIL project.\"\n"
        "- You must ONLY answer using real data present in this context. Never invent, extrapolate, or estimate any number or fact that is not explicitly given.\n"
        "- If a question asks for information not covered by this context (such as an unknown project ID, or data VIGIL does not track), state clearly that you do not have that information rather than guessing."
    )

    return "\n".join(prompt_parts)


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
    openai/gpt-oss-20b. The system prompt dynamically injects verified
    in-memory project facts, summary metrics, and specific project records
    so it can't hallucinate metrics during the demo.
    Any Groq failure (network, rate limit, bad key) returns a friendly
    fallback instead of a 500, so the demo never crashes.
    """
    if client is None:
        return {
            "answer": "Sorry, I'm having trouble answering right now — "
            "please check the dashboard directly for project details."
        }
    try:
        system_prompt = build_system_prompt(question)
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            temperature=0.2,
        )
        return {"answer": completion.choices[0].message.content}
    except Exception:
        return {
            "answer": "Sorry, I'm having trouble answering right now — "
            "please check the dashboard directly for project details."
        }
