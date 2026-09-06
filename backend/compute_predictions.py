"""
compute_predictions.py — scores every project and computes SHAP explanations.

This runs ONCE, offline, before your demo. Output is a static JSON file.
FastAPI never re-runs the model or SHAP live — it just reads this file.
That's the whole point: nothing can break live if nothing computes live.

Run: python compute_predictions.py
Output: predictions.json
"""

import json
import joblib
import shap
import pandas as pd

model = joblib.load("model.pkl")
with open("feature_columns.json") as f:
    feature_cols = json.load(f)

df = pd.read_csv("synthetic_projects.csv")

# recreate the same engineered features used in training — must match exactly
df["schedule_pressure"] = df["months_elapsed"] / df["planned_duration_months"]
df["progress_vs_expected"] = df["percent_complete"] - (df["schedule_pressure"] * 100)

df_encoded = pd.get_dummies(df, columns=["ministry", "sector"], prefix=["min", "sec"])
# ensure every column the model expects exists, even if a category didn't
# appear after encoding (fill missing dummy columns with 0)
for col in feature_cols:
    if col not in df_encoded.columns:
        df_encoded[col] = 0
X = df_encoded[feature_cols]

# risk score = model's predicted probability of delay, as a percentage
risk_scores = model.predict_proba(X)[:, 1]

# SHAP: TreeExplainer is the fast, exact explainer for tree models like XGBoost
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)  # one row of values per project

# human-readable labels for the top numeric features (skip one-hot ministry/
# sector columns here — we handle those separately below)
FEATURE_LABELS = {
    "budget_allocated_cr": "Budget allocated",
    "budget_utilized_pct": "Budget utilization pace",
    "planned_duration_months": "Planned project duration",
    "months_elapsed": "Time elapsed",
    "percent_complete": "Physical progress",
    "reporting_delay_days": "Reporting delay",
    "last_report_gap_days": "Last report gap",
    "schedule_pressure": "Schedule pressure",
    "progress_vs_expected": "Progress vs schedule expectation",
}

results = []
for i, row in df.iterrows():
    project_shap = shap_values[i]
    # pair each feature with its SHAP value for this one project
    contributions = list(zip(feature_cols, project_shap))
    # sort by absolute impact, take top 3 — these are the "reasons" shown in the UI
    top3 = sorted(contributions, key=lambda x: abs(x[1]), reverse=True)[:3]

    reasons = []
    for feat_name, shap_val in top3:
        if feat_name in FEATURE_LABELS:
            label = FEATURE_LABELS[feat_name]
        elif feat_name.startswith("min_"):
            label = f"Ministry: {feat_name[4:]}"
        elif feat_name.startswith("sec_"):
            label = f"Sector: {feat_name[4:]}"
        else:
            label = feat_name
        reasons.append({"feature": label, "impact": round(float(shap_val), 4)})

    results.append({
        "project_id": row["project_id"],
        "project_name": row["project_name"],
        "ministry": row["ministry"],
        "sector": row["sector"],
        "budget_allocated_cr": row["budget_allocated_cr"],
        "percent_complete": row["percent_complete"],
        "months_elapsed": row["months_elapsed"],
        "planned_duration_months": row["planned_duration_months"],
        "risk_score": round(float(risk_scores[i]) * 100, 1),  # as a % for the UI
        "risk_reasons": reasons,
    })

with open("predictions.json", "w") as f:
    json.dump(results, f, indent=2)

high_risk = sum(1 for r in results if r["risk_score"] > 65)
print(f"Scored {len(results)} projects -> predictions.json")
print(f"High risk (>65%): {high_risk}")
print("\nSample project:")
print(json.dumps(results[0], indent=2))
