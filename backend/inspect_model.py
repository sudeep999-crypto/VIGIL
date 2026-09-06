"""
inspect_model.py — opens model.pkl and shows what's inside, for demo/Q&A.

Run: python inspect_model.py
Produces: one_tree.png (a real tree from the model, viewable/showable)
"""

import json
import joblib
from xgboost import plot_tree
import matplotlib.pyplot as plt

model = joblib.load("model.pkl")
with open("feature_columns.json") as f:
    feature_cols = json.load(f)

print("=== Model type ===")
print(type(model).__name__, "(XGBoost gradient-boosted trees)")

print("\n=== Key hyperparameters (what you tuned) ===")
params = model.get_params()
for k in ["n_estimators", "max_depth", "learning_rate", "eval_metric"]:
    print(f"  {k}: {params[k]}")

print(f"\n=== Total trees in the model: {model.n_estimators} ===")
print(f"=== Total input features: {len(feature_cols)} ===")

print("\n=== Top 5 most important features ===")
import pandas as pd
importances = pd.Series(model.feature_importances_, index=feature_cols)
print(importances.sort_values(ascending=False).head(5).to_string())

# render ONE actual tree from the model as an image — this is the single
# most convincing thing you can show a judge: "here is literally one of
# the 150 trees, here is the actual split logic it learned"
fig, ax = plt.subplots(figsize=(20, 10))
plot_tree(model, num_trees=0, ax=ax)
plt.tight_layout()
plt.savefig("one_tree.png", dpi=150)
print("\nSaved one_tree.png — a real tree from the model, for visual proof")
