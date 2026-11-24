import pandas as pd
import pickle
from pathlib import Path

from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report


# Get the current folder
BASE_DIR = Path(__file__).resolve().parent

# Dataset and model paths
CSV_PATH = BASE_DIR / "mockdata-for-ml-training.csv"
MODEL_PATH = BASE_DIR / "procrastination_model.pkl"


# 1. Load the CSV dataset
data = pd.read_csv(CSV_PATH)

print("Dataset loaded successfully!")
print("Total rows:", len(data))


# 2. Select the four input columns
X = data[
    [
        "active_tasks_count",
        "overdue_tasks_count",
        "high_priority_count",
        "win_streak"
    ]
]

# 3. Select the prediction column
y = data["risk_level"].astype(str).str.strip()


# 4. Split data into training and testing
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# 5. Create Decision Tree model
model = DecisionTreeClassifier(
    max_depth=5,
    random_state=42
)


# 6. Train the model
model.fit(X_train, y_train)

print("\nAI training completed!")


# 7. Test model accuracy
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\nModel Accuracy:", round(accuracy * 100, 2), "%")

print("\nClassification Report:")
print(classification_report(y_test, predictions, zero_division=0))


# 8. Train using all available data
model.fit(X, y)


# 9. Save model using Pickle
with open(MODEL_PATH, "wb") as file:
    pickle.dump(model, file)

print("\nModel successfully saved!")
print("File:", MODEL_PATH)