import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'model')
DATA_DIR = os.path.join(BASE_DIR, 'data')

def run_evaluation():
    print("[EVAL] Running Strict Test-Set Model Evaluation (Holdout 20%)...", flush=True)
    model_path = os.path.join(MODEL_DIR, 'model.pkl')
    data_path = os.path.join(DATA_DIR, 'indian_house_prices.csv')

    if not os.path.exists(model_path) or not os.path.exists(data_path):
        print("[ERROR] Model or dataset missing. Run train.py first.", flush=True)
        return

    pipeline = joblib.load(model_path)
    df = pd.read_csv(data_path)

    numeric_features = [
        "BHK", "Bathrooms", "Area_SqFt", "Floor_No", 
        "Total_Floors", "Property_Age", "Parking_Spaces", 
        "Metro_Distance_KM", "Amenities_Score"
    ]
    categorical_features = [
        "City", "Locality", "Property_Type", "Furnishing_Status", "Gated_Community"
    ]
    target = "Price_INR_Lakhs"

    all_features = numeric_features + categorical_features
    X = df[all_features]
    y = df[target]

    # Reproduce EXACT identical 80/20 train/test split with fixed random_state=42
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    # Predict ONLY on unseen test set X_test
    y_pred = pipeline.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100

    print("\n" + "="*50)
    print("     TEST SET MODEL EVALUATION REPORT (X_test)   ")
    print("="*50)
    print(f"Total Dataset Records     : {len(df)}")
    print(f"Training Samples (80%)    : {len(X_train)}")
    print(f"Held-out Test Set (20%)   : {len(X_test)}")
    print(f"Target Variable           : Price_INR_Lakhs")
    print(f"Mean Absolute Error (MAE) : {mae:.2f} Lakhs")
    print(f"Root Mean Squared (RMSE)  : {rmse:.2f} Lakhs")
    print(f"R-squared Score (R2)      : {r2:.4f}")
    print(f"Mean Abs Percentage (MAPE): {mape:.2f}%")
    print("="*50 + "\n")

if __name__ == '__main__':
    run_evaluation()
