"""
train_model.py — trains an XGBoost classifier to predict project delay risk.

Target: is_delayed (0/1)
Features: budget, timeline, progress, reporting behaviour, ministry, sector
(ministry/sector are one-hot encoded — trees need numeric input)

Run: python train_model.py
Output: model.pkl, feature_columns.json, and printed train/test accuracy +
feature importance so you can explain both in Q&A.
"""

import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
from xgboost import XGBClassifier

df = pd.read_csv("synthetic_projects.csv")

# engineer one derived feature: how far into the timeline vs how much is done
# this is exactly the kind of feature you should be able to explain — it's
# schedule pressure, not a raw column PAIMANA hands you
df["schedule_pressure"] = df["months_elapsed"] / df["planned_duration_months"]
df["progress_vs_expected"] = df["percent_complete"] - (df["schedule_pressure"] * 100)

feature_cols_numeric = [
    "budget_allocated_cr",
    "budget_utilized_pct",
    "planned_duration_months",
    "months_elapsed",
    "percent_complete",
    "reporting_delay_days",
    "last_report_gap_days",
    "schedule_pressure",
    "progress_vs_expected",
]

# one-hot encode ministry + sector — this turns categories into 0/1 columns
df_encoded = pd.get_dummies(df, columns=["ministry", "sector"], prefix=["min", "sec"])
feature_cols = feature_cols_numeric + [
    c for c in df_encoded.columns if c.startswith("min_") or c.startswith("sec_")
]

X = df_encoded[feature_cols]
y = df_encoded["is_delayed"]

# 80/20 split — model only ever trains on the 80%, test set is held out
# and never touched during training. This is what "not overfitting" means
# in practice, and exactly what to say if a judge asks.
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = XGBClassifier(
    n_estimators=150,      # number of boosting rounds (trees in the chain)
    max_depth=4,            # shallow trees — limits overfitting on small data
    learning_rate=0.1,      # how much each tree corrects the previous ones
    eval_metric="logloss",
    random_state=42,
)
model.fit(X_train, y_train)

train_preds = model.predict(X_train)
test_preds = model.predict(X_test)
test_probs = model.predict_proba(X_test)[:, 1]

print("=== Train/test split ===")
print(f"Train size: {len(X_train)}  |  Test size: {len(X_test)}")

print("\n=== Accuracy ===")
print(f"Train accuracy: {accuracy_score(y_train, train_preds):.3f}")
print(f"Test accuracy:  {accuracy_score(y_test, test_preds):.3f}")
print(f"Test ROC-AUC:   {roc_auc_score(y_test, test_probs):.3f}")

print("\n=== Test set classification report ===")
print(classification_report(y_test, test_preds, target_names=["on_track", "delayed"]))

print("\n=== Top 10 features by importance ===")
importances = pd.Series(model.feature_importances_, index=feature_cols)
print(importances.sort_values(ascending=False).head(10).to_string())

# save model + the exact feature column order (needed later to score new rows)
joblib.dump(model, "model.pkl")
with open("feature_columns.json", "w") as f:
    json.dump(feature_cols, f)

print("\nSaved model.pkl and feature_columns.json")
