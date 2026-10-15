"""
PropPredict — Indian Urban House Price Prediction (ML Training Pipeline)

Academic Mini-Project for B.Tech AI & ML (3rd Year)
---------------------------------------------------
This script demonstrates an end-to-end Machine Learning regression pipeline:
1. Procedural generation & documentation of an Indian urban housing dataset (5,000 records)
   modeled after real-estate market benchmark rates across 8 Indian metropolitan cities.
2. Target leakage audit (identifying and dropping derived columns like Price_per_SqFt).
3. Data inspection and summary statistics.
4. Feature selection: 9 numerical features and 5 categorical features.
5. Strict 80/20 train/test holdout split with fixed random_state=42.
6. Scikit-learn Pipeline with ColumnTransformer (StandardScaler + OneHotEncoder).
7. Training and comparison of TWO models:
   - Model 1 (Baseline): Linear Regression
   - Model 2 (Final Candidate): Random Forest Regressor
8. Model evaluation on unseen test set using MAE, RMSE, R2, and MAPE.
9. Selection and serialization of the best model to model.pkl using joblib.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

# Ensure UTF-8 output encoding for console compatibility
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Directory paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODEL_DIR = os.path.join(BASE_DIR, 'model')
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

CSV_PATH = os.path.join(DATA_DIR, 'indian_house_prices.csv')

# -----------------------------------------------------------------------------
# 1. Indian Urban Real Estate Market Benchmarks (Baseline Rate in INR / sq.ft)
# -----------------------------------------------------------------------------
# Note: In India, public registry deed datasets are fragmented across state
# registration departments (e.g. IGR Maharashtra, Bhoomi Karnataka). For this
# academic project, we model realistic price distributions using published real-estate
# market rates (MagicBricks / 99acres micro-market price indices).
CITY_LOCALITIES = {
    "Mumbai": {
        "Kandivali West": 14500,
        "Kandivali East": 13800,
        "Thane West": 10500,
        "Thane (Ghodbunder Rd)": 8800,
        "Bandra West": 42000,
        "Bandra East": 28000,
        "Borivali West": 15500,
        "Malad West": 13500,
        "Goregaon East": 16000,
        "Andheri West": 23000,
        "Andheri East": 18500,
        "Powai": 19500,
        "Worli": 46000,
        "Dadar": 32000,
        "Navi Mumbai (Vashi)": 13500,
        "Navi Mumbai (Kharghar)": 8200
    },
    "Bangalore": {
        "Electronic City": 5800,
        "Sarjapur Road": 7200,
        "Whitefield": 8500,
        "Yelahanka": 6200,
        "Kanakapura Road": 6800,
        "Marathahalli": 7800,
        "BTM Layout": 9500,
        "HSR Layout": 13500,
        "Indiranagar": 19000,
        "Koramangala": 18500,
        "Hebbal": 11500,
        "Bannerghatta Road": 7400
    },
    "Delhi NCR": {
        "Noida Extension (Greater Noida W)": 4800,
        "Noida Sector 137": 6800,
        "Noida Sector 62": 8200,
        "Noida Expressway": 9200,
        "Gurgaon Sector 48 (Sohna Rd)": 9800,
        "Gurgaon Sector 82 (New Gurgaon)": 6500,
        "Gurgaon Cyber City": 18500,
        "Gurgaon Golf Course Rd": 28000,
        "Dwarka (Delhi)": 11500,
        "Janakpuri (Delhi)": 14000,
        "Rohini (Delhi)": 9500,
        "South Extension": 26000
    },
    "Ahmedabad": {
        "Bopal": 4800,
        "South Bopal (SoBo)": 5200,
        "Gota": 4500,
        "Chandkheda": 4200,
        "Nikol": 3800,
        "Vastrapur": 8200,
        "Satellite": 8500,
        "Prahlad Nagar": 9200,
        "SG Highway": 7500,
        "Bodakdev": 9800,
        "Maninagar": 5500
    },
    "Pune": {
        "Hinjewadi": 6800,
        "Wakad": 7800,
        "Hadapsar": 6500,
        "Kharadi": 8500,
        "Baner": 10200,
        "Pimple Saudagar": 7500,
        "Kothrud": 12500,
        "Viman Nagar": 11500,
        "Koregaon Park": 16000,
        "Kalyani Nagar": 14000
    },
    "Hyderabad": {
        "Miyapur": 5200,
        "Kukatpally": 6800,
        "Kondapur": 8200,
        "Gachibowli": 10500,
        "HITEC City": 12000,
        "Madhapur": 11500,
        "Banjara Hills": 22000,
        "Jubilee Hills": 24000
    },
    "Chennai": {
        "Tambaram": 5800,
        "Porur": 6800,
        "OMR IT Corridor": 7200,
        "Velachery": 8800,
        "Anna Nagar": 15500,
        "Adyar": 17500,
        "Boat Club Road": 28000
    },
    "Kolkata": {
        "Rajarhat": 4800,
        "New Town": 6200,
        "Behala": 4500,
        "Salt Lake Sector V": 8500,
        "Ballygunge": 15000,
        "Park Street": 16500
    }
}

PROPERTY_TYPE_FACTORS = {
    "Apartment": 1.00,
    "Independent House": 1.15,
    "Villa": 1.35,
    "Penthouse": 1.45,
    "Studio": 0.90,
}

FURNISHING_FACTORS = {
    "Furnished": 1.12,
    "Semi-Furnished": 1.05,
    "Unfurnished": 1.00,
}

def generate_indian_housing_dataset(n_samples=5000, random_state=42):
    """
    Generates a reproducible, transparent synthetic dataset of 5,000 Indian housing records.
    
    Academic Transparency Note:
    ---------------------------
    - This dataset is procedurally synthesized for educational and research purposes.
    - Each feature (locality base rate, size, BHK, bathrooms, floor, age, amenities, parking,
      metro distance, gated status) dynamically influences the simulated property value.
    - An explicit leakage column `Price_per_SqFt` is generated so students can demonstrate
      how target leakage is detected and removed during the ML pipeline.
    """
    np.random.seed(random_state)
    cities = list(CITY_LOCALITIES.keys())
    prop_types = list(PROPERTY_TYPE_FACTORS.keys())
    furnishings = list(FURNISHING_FACTORS.keys())

    city_weights = [0.25, 0.22, 0.20, 0.12, 0.08, 0.05, 0.04, 0.04]
    city_choices = np.random.choice(cities, size=n_samples, p=city_weights)
    prop_choices = np.random.choice(prop_types, size=n_samples, p=[0.68, 0.12, 0.10, 0.05, 0.05])
    furnish_choices = np.random.choice(furnishings, size=n_samples, p=[0.25, 0.50, 0.25])

    records = []

    for i in range(n_samples):
        city = city_choices[i]
        localities_for_city = list(CITY_LOCALITIES[city].keys())
        locality = np.random.choice(localities_for_city)
        base_rate = CITY_LOCALITIES[city][locality]

        ptype = prop_choices[i]
        furnish = furnish_choices[i]

        # Property layout based on type
        if ptype == "Studio":
            bhk = 1
            area = int(np.random.normal(450, 50))
            area = max(280, min(650, area))
            bathrooms = 1
            total_floors = np.random.randint(4, 25)
            floor_no = np.random.randint(1, total_floors)
            gated = np.random.choice(["Yes", "No"], p=[0.70, 0.30])
            parking = np.random.choice([0, 1], p=[0.75, 0.25])
        elif ptype == "Penthouse":
            bhk = int(np.random.choice([3, 4, 5, 6], p=[0.25, 0.45, 0.20, 0.10]))
            area = int(np.random.normal(bhk * 650 + 400, 250))
            area = max(2000, min(5500, area))
            bathrooms = bhk + int(np.random.choice([0, 1], p=[0.5, 0.5]))
            total_floors = np.random.randint(18, 45)
            floor_no = total_floors - int(np.random.choice([0, 1], p=[0.8, 0.2]))
            gated = "Yes"
            parking = int(np.random.choice([2, 3], p=[0.4, 0.6]))
        elif ptype in ["Villa", "Independent House"]:
            bhk = int(np.random.choice([2, 3, 4, 5], p=[0.15, 0.45, 0.30, 0.10]))
            area = int(np.random.normal(bhk * 550 + 300, 200))
            area = max(1100, min(4500, area))
            bathrooms = bhk if np.random.rand() > 0.3 else max(1, bhk - 1)
            total_floors = int(np.random.choice([1, 2, 3], p=[0.30, 0.55, 0.15]))
            floor_no = 0
            gated = str(np.random.choice(["Yes", "No"], p=[0.75, 0.25]))
            parking = int(np.random.choice([1, 2, 3], p=[0.35, 0.45, 0.20]))
        else:  # Standard Apartment
            bhk = int(np.random.choice([1, 2, 3, 4, 5], p=[0.24, 0.42, 0.24, 0.08, 0.02]))
            if bhk == 1:
                area = int(np.random.normal(550, 60))
                area = max(380, min(800, area))
                bathrooms = 1
            elif bhk == 2:
                area = int(np.random.normal(950, 90))
                area = max(650, min(1350, area))
                bathrooms = 2
            elif bhk == 3:
                area = int(np.random.normal(1450, 140))
                area = max(1150, min(2200, area))
                bathrooms = int(np.random.choice([2, 3], p=[0.35, 0.65]))
            elif bhk == 4:
                area = int(np.random.normal(2150, 200))
                area = max(1750, min(3200, area))
                bathrooms = int(np.random.choice([3, 4], p=[0.3, 0.7]))
            else:
                area = int(np.random.normal(3000, 300))
                area = max(2400, min(4500, area))
                bathrooms = int(np.random.choice([4, 5], p=[0.3, 0.7]))

            total_floors = np.random.randint(4, 32)
            floor_no = np.random.randint(1, total_floors + 1)
            gated = str(np.random.choice(["Yes", "No"], p=[0.85, 0.15]))
            parking = int(np.random.choice([0, 1, 2, 3], p=[0.15, 0.60, 0.20, 0.05]))

        prop_age = int(np.random.exponential(scale=4.0))
        prop_age = min(30, prop_age)

        amenities_score = int(np.random.choice([3, 4, 5, 6, 7, 8, 9, 10], p=[0.05, 0.10, 0.15, 0.20, 0.20, 0.15, 0.10, 0.05]))
        metro_dist = round(float(np.random.exponential(scale=2.0) + 0.3), 1)
        metro_dist = min(15.0, metro_dist)

        # Economic rate adjustments
        type_mult = PROPERTY_TYPE_FACTORS[ptype]
        furnish_mult = FURNISHING_FACTORS[furnish]
        bhk_factor = 1.0 + (bhk - 2) * 0.08
        bath_factor = 1.0 + (bathrooms - 2) * 0.04
        amenities_factor = 1.0 + (amenities_score - 5.0) * 0.04
        parking_factor = 1.0 + (parking * 0.035)
        age_depreciation = max(0.70, 1.0 - (prop_age * 0.010))
        metro_factor = max(0.85, 1.04 - (metro_dist * 0.015))
        gated_factor = 1.06 if gated == "Yes" else 0.96

        if total_floors > 8 and floor_no > 5:
            floor_factor = 1.0 + min(0.08, (floor_no / total_floors) * 0.06)
        else:
            floor_factor = 1.0

        effective_rate_sqft = (
            base_rate * type_mult * furnish_mult * bhk_factor * bath_factor *
            amenities_factor * parking_factor * age_depreciation * 
            metro_factor * gated_factor * floor_factor
        )

        raw_price_inr = effective_rate_sqft * area
        noise = np.random.normal(1.0, 0.02)
        final_price_inr = raw_price_inr * noise

        # Target variable in INR Lakhs (1 Lakh = 100,000 INR)
        price_lakhs = round((final_price_inr / 100000.0), 2)
        price_lakhs = max(15.0, price_lakhs)

        # Target leakage feature for demonstration and audit
        price_per_sqft_leak = round((price_lakhs * 100000.0) / area, 2)

        records.append({
            "City": city,
            "Locality": locality,
            "Property_Type": ptype,
            "BHK": bhk,
            "Bathrooms": bathrooms,
            "Area_SqFt": area,
            "Floor_No": floor_no,
            "Total_Floors": total_floors,
            "Property_Age": prop_age,
            "Furnishing_Status": furnish,
            "Parking_Spaces": parking,
            "Gated_Community": gated,
            "Metro_Distance_KM": metro_dist,
            "Amenities_Score": amenities_score,
            "Price_per_SqFt": price_per_sqft_leak,  # Explicit leakage column (will be dropped)
            "Price_INR_Lakhs": price_lakhs           # Target variable
        })

    df = pd.DataFrame(records)
    df.to_csv(CSV_PATH, index=False)
    print(f"[DATASET] Saved 5,000 records to: {CSV_PATH}", flush=True)
    return df

def train_and_evaluate():
    """
    Executes the clean, simplified machine learning pipeline:
    1. Loads dataset.
    2. Drops target leakage columns.
    3. Splits 80% train / 20% test with random_state=42.
    4. Builds ColumnTransformer (StandardScaler + OneHotEncoder).
    5. Trains Linear Regression (Baseline) and Random Forest Regressor.
    6. Evaluates both models strictly on the unseen test set.
    7. Selects best model and saves pipeline to model/model.pkl.
    """
    print("\n=======================================================", flush=True)
    print("  PropPredict — Machine Learning Training & Evaluation ", flush=True)
    print("=======================================================", flush=True)

    # 1. Load or Generate Dataset
    if os.path.exists(CSV_PATH):
        df = pd.read_csv(CSV_PATH)
        print(f"[LOAD] Loaded existing dataset with {len(df)} rows from {CSV_PATH}", flush=True)
    else:
        df = generate_indian_housing_dataset(n_samples=5000, random_state=42)

    # 2. Target Leakage Audit
    # Target leakage happens when an input column is derived directly from the target.
    # Price_per_SqFt = Total_Price / Area. Including it would trivialize the prediction!
    leakage_columns = [col for col in ["Price_per_SqFt", "price_per_sqft", "Rate_SqFt"] if col in df.columns]
    print(f"[AUDIT] Detected and dropping target leakage columns: {leakage_columns}", flush=True)

    # 3. Define Feature Lists
    numeric_features = [
        "BHK", "Bathrooms", "Area_SqFt", "Floor_No", 
        "Total_Floors", "Property_Age", "Parking_Spaces", 
        "Metro_Distance_KM", "Amenities_Score"
    ]
    categorical_features = [
        "City", "Locality", "Property_Type", "Furnishing_Status", "Gated_Community"
    ]
    target_variable = "Price_INR_Lakhs"

    X = df[numeric_features + categorical_features]
    y = df[target_variable]

    # Save dataset inspection summary for transparency
    inspection_summary = {
        "total_records": len(df),
        "total_columns": len(df.columns),
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "target_variable": target_variable,
        "missing_values": int(df.isnull().sum().sum()),
        "price_min_lakhs": float(df[target_variable].min()),
        "price_max_lakhs": float(df[target_variable].max()),
        "price_mean_lakhs": round(float(df[target_variable].mean()), 2),
        "price_median_lakhs": round(float(df[target_variable].median()), 2),
    }
    with open(os.path.join(MODEL_DIR, 'dataset_inspection.json'), 'w') as f:
        json.dump(inspection_summary, f, indent=2)

    # 4. Train/Test Holdout Split (Strict 80% train / 20% test, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"[SPLIT] 80% Train ({len(X_train)} samples) | 20% Unseen Test ({len(X_test)} samples)", flush=True)

    # 5. Preprocessing Pipeline using ColumnTransformer
    # Fit ONLY on training data to prevent data leakage from test set
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
        ]
    )
    preprocessor.fit(X_train)
    joblib.dump(preprocessor, os.path.join(MODEL_DIR, 'preprocessor.pkl'))

    # 6. Two Regression Algorithms
    # Algorithm 1: Linear Regression (Simple parametric baseline)
    # Algorithm 2: Random Forest Regressor (Non-parametric ensemble of 100 decision trees)
    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(
            n_estimators=100,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=1
        )
    }

    metrics = {}
    fitted_pipelines = {}

    print("\n--- Training and Evaluating Models on Holdout Test Set ---")
    for name, model in models.items():
        # Scikit-learn Pipeline bundles preprocessing and estimator together
        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('regressor', model)
        ])

        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)

        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))
        mape = float(np.mean(np.abs((y_test - y_pred) / y_test)) * 100.0)

        metrics[name] = {
            "MAE": round(mae, 2),
            "RMSE": round(rmse, 2),
            "R2": round(r2, 4),
            "MAPE": round(mape, 2)
        }
        fitted_pipelines[name] = pipeline

        print(f"[{name}] MAE: ₹{mae:.2f}L | RMSE: ₹{rmse:.2f}L | R²: {r2:.4f} | MAPE: {mape:.2f}%")

    # 7. Model Selection
    # Select candidate with highest R² score and lowest RMSE
    best_model_name = max(metrics.keys(), key=lambda m: (metrics[m]["R2"], -metrics[m]["RMSE"]))
    best_pipeline = fitted_pipelines[best_model_name]
    print(f"\n[WINNER] Selected: {best_model_name} (R² = {metrics[best_model_name]['R2']}, MAE = ₹{metrics[best_model_name]['MAE']}L)")

    # 8. Save Production Pipeline
    joblib.dump(best_pipeline, os.path.join(MODEL_DIR, 'model.pkl'))
    print(f"[SAVED] Saved production pipeline to: {os.path.join(MODEL_DIR, 'model.pkl')}", flush=True)

    # 9. Extract Feature Importances from Random Forest
    feature_importance_list = []
    try:
        ohe = preprocessor.named_transformers_['cat']
        cat_feature_names = list(ohe.get_feature_names_out(categorical_features))
        all_encoded_names = numeric_features + cat_feature_names

        rf_model = fitted_pipelines["Random Forest"].named_steps['regressor']
        importances = rf_model.feature_importances_
        imp_df = pd.DataFrame({
            'feature': all_encoded_names,
            'importance': importances
        }).sort_values('importance', ascending=False)

        for _, row in imp_df.head(10).iterrows():
            clean_name = str(row['feature']).replace("cat__", "").replace("num__", "")
            feature_importance_list.append({
                "feature": clean_name,
                "importance": round(float(row['importance']) * 100, 2)
            })
    except Exception as e:
        print(f"[WARN] Feature importance calculation note: {e}")

    with open(os.path.join(MODEL_DIR, 'feature_importance.json'), 'w') as f:
        json.dump(feature_importance_list, f, indent=2)

    # 10. Save Holdout Test Predictions for Visual Dashboard
    y_test_pred = best_pipeline.predict(X_test)
    eval_df = X_test.copy()
    eval_df['Actual_Price'] = y_test.values
    eval_df['Predicted_Price'] = y_test_pred
    eval_df['Error_Lakhs'] = np.abs(eval_df['Actual_Price'] - eval_df['Predicted_Price'])
    eval_df['Error_Pct'] = (eval_df['Error_Lakhs'] / eval_df['Actual_Price']) * 100.0

    eval_samples = []
    for _, row in eval_df.head(20).iterrows():
        eval_samples.append({
            "city": str(row['City']),
            "locality": str(row['Locality']),
            "property_type": str(row['Property_Type']),
            "bhk": int(row['BHK']),
            "bathrooms": int(row['Bathrooms']),
            "area_sqft": int(row['Area_SqFt']),
            "actual_price": round(float(row['Actual_Price']), 2),
            "predicted_price": round(float(row['Predicted_Price']), 2),
            "error_lakhs": round(float(row['Error_Lakhs']), 2),
            "error_pct": round(float(row['Error_Pct']), 2)
        })

    # Price distribution bins for dashboard visualization
    price_bins = [0, 50, 100, 200, 400, 800, 2000]
    bin_labels = ["< 50L (Budget)", "50L - 1Cr (Affordable)", "1Cr - 2Cr (Mid-Segment)", "2Cr - 4Cr (Premium)", "4Cr - 8Cr (Luxury)", "> 8Cr (High Luxury)"]
    hist, _ = np.histogram(df[target_variable], bins=price_bins)
    price_distribution = [{"range": label, "count": int(count)} for label, count in zip(bin_labels, hist)]

    eval_export = {
        "actual_vs_predicted": eval_samples,
        "price_distribution": price_distribution,
        "metrics_comparison": [
            {"model": m, **metrics[m]} for m in metrics
        ]
    }
    with open(os.path.join(MODEL_DIR, 'eval_samples.json'), 'w') as f:
        json.dump(eval_export, f, indent=2)

    # 11. Save Full Metadata JSON
    metadata = {
        "dataset_name": "Indian Urban House Price Prediction Dataset (Procedural Benchmark)",
        "dataset_type": "Synthetic (Modeled on Real Indian Metropolitan Rates)",
        "best_model": best_model_name,
        "total_records": len(df),
        "train_records": len(X_train),
        "test_records": len(X_test),
        "target_variable": target_variable,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "removed_leakage_features": leakage_columns,
        "models_performance": metrics,
        "cities": list(CITY_LOCALITIES.keys()),
        "city_localities": {c: list(locs.keys()) for c, locs in CITY_LOCALITIES.items()},
        "property_types": list(PROPERTY_TYPE_FACTORS.keys()),
        "furnishing_statuses": list(FURNISHING_FACTORS.keys())
    }
    with open(os.path.join(MODEL_DIR, 'metrics.json'), 'w') as f:
        json.dump(metadata, f, indent=2)

    print("\n[COMPLETE] Model training, evaluation and metadata saved successfully!")

if __name__ == '__main__':
    train_and_evaluate()
