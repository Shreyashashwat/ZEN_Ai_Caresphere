import sys
import json
import joblib
import pandas as pd
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "adherence_model.pkl")
model = joblib.load(MODEL_PATH)

try:
    raw_input = sys.stdin.readline().strip()
    input_data = json.loads(raw_input) if raw_input else {
        "hour": 14,
        "dayOfWeek": 3,
        "delay": 5
    }
except Exception:
    input_data = {"hour": 14, "dayOfWeek": 3, "delay": 5}

# Build DataFrame with SAME feature names as training
X = pd.DataFrame([{
    "hour": input_data["hour"],
    "dayOfWeek": input_data["dayOfWeek"],
    "delay": max(0, input_data["delay"])  # safety clamp
}])

prob = model.predict_proba(X)[0][1]

print(float(prob))
