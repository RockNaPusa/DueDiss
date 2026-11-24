from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pickle
from pathlib import Path

app = Flask(__name__)

# Enable CORS
CORS(app)

# Locate the trained model
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "procrastination_model.pkl"

# Load trained AI model
with open(MODEL_PATH, "rb") as file:
    model = pickle.load(file)

# Required input fields
FEATURES = [
    "active_tasks_count",
    "overdue_tasks_count",
    "high_priority_count",
    "win_streak"
]


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "running",
        "service": "DueDiss ML API"
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "error": "A JSON object is required"
            }), 400

        # Check required fields
        missing = [
            feature for feature in FEATURES
            if feature not in data
        ]

        if missing:
            return jsonify({
                "error": "Missing required fields",
                "missing_fields": missing
            }), 400

        # Prepare input data
        input_data = pd.DataFrame(
            [[data[feature] for feature in FEATURES]],
            columns=FEATURES
        )

        # Validate numeric values
        for feature in FEATURES:
            input_data[feature] = pd.to_numeric(
                input_data[feature],
                errors="raise"
            )

        # Predict risk level
        prediction = model.predict(input_data)[0]

        risk = str(prediction).strip().capitalize()

        # Return exact response required by backend
        return jsonify({
            "risk": risk
        })

    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid input values"
        }), 400

    except Exception:
        app.logger.exception("Prediction failed")
        return jsonify({
            "error": "Prediction failed"
        }), 500


if __name__ == "__main__":
    print("Starting DueDiss ML API...")
    app.run(host="0.0.0.0", port=5001, debug=False)
