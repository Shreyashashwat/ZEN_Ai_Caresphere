from sklearn.ensemble import RandomForestClassifier
import pandas as pd, joblib, json, sys, os

data = json.load(sys.stdin) if not sys.stdin.isatty() else []  # only read if from Node
df = pd.DataFrame(data)

if df.empty:
    print("No training data found. Using small dummy dataset for test.")
    df = pd.DataFrame({
        "hour": [8, 12, 20],
        "dayOfWeek": [1, 3, 6],
        "delay": [10, 5, 15],
        "status": [0, 1, 0]
    })

X = df[["hour", "dayOfWeek", "delay"]].fillna(0)
y = df["status"]

# ✅ Reduce number of trees for faster training
model = RandomForestClassifier(n_estimators=20, random_state=42, n_jobs=-1)
model.fit(X, y)

# Save to the same folder
MODEL_PATH = os.path.join(os.path.dirname(__file__), "adherence_model.pkl")
joblib.dump(model, MODEL_PATH)

print("Model trained and saved to" ,MODEL_PATH)
