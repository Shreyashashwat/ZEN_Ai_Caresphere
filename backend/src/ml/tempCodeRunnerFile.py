import sys, json
import joblib
import numpy as np

# Load trained model
model = joblib.load("src/ml/adherence_model.pkl")

# Read JSON input from stdin
input_data = json.loads(sys.stdin.read())

hour = input_data["hour"]
dayOfWeek = input_data["dayOfWeek"]
delay = input_data["delay"]

# Make prediction
X = np.array([[hour, dayOfWeek, delay]])
prob = model.predict_proba(X)[0][1]

# Send back result
print(prob)
