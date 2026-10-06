import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

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
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODEL_DIR = os.path.join(BASE_DIR, 'model')
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

CSV_PATH = os.path.join(DATA_DIR, 'indian_house_prices.csv')

# City and Locality baseline rates (INR per sq.ft)
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
    "Apartment": 1.0,
    "Independent House": 1.15,
    "Villa": 1.35,
    "Penthouse": 1.45,
    "Studio": 0.90,
}

FURNISHING_FACTORS = {
    "Furnished": 1.12,
    "Semi-Furnished": 1.05,
    "Unfurnished": 1.0,
}

def generate_indian_housing_dataset(n_samples=5000, random_state=42):
    """
    Generates an authentic Indian urban housing dataset covering budget, mid-segment, and luxury homes.
    Each feature (BHK, Bathrooms, Area, Amenities, Parking, Furnishing, Transit, Age) directly and dynamically impacts property price.
    """
    np.random.seed(random_state)
    cities = list(CITY_LOCALITIES.keys())
    prop_types = list(PROPERTY_TYPE_FACTORS.keys())
    furnishings = list(FURNISHING_FACTORS.keys())

    city_weights = [0.25, 0.22, 0.20, 0.12, 0.08, 0.05, 0.04, 0.04]
    city_choices = np.random.choice(cities, size=n_samples, p=city_weights)
    prop_choices = np.random.choice(prop_types, size=n_samples, p=[0.68, 0.12, 0.10, 0.05, 0.05])
    furnish_choices = np.random.choice(furnishings, size=n_samples, p=[0.25, 0.50, 0.25])

    data = []

    for i in range(n_samples):
        city = city_choices[i]
        localities_for_city = list(CITY_LOCALITIES[city].keys())
        locality = np.random.choice(localities_for_city)
        base_rate = CITY_LOCALITIES[city][locality]

        ptype = prop_choices[i]
        furnish = furnish_choices[i]

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
            bhk = np.random.choice([3, 4, 5, 6], p=[0.25, 0.45, 0.20, 0.10])
            area = int(np.random.normal(bhk * 650 + 400, 250))
            area = max(2000, min(5500, area))
            bathrooms = bhk + np.random.choice([0, 1], p=[0.5, 0.5])
            total_floors = np.random.randint(18, 45)
            floor_no = total_floors - np.random.choice([0, 1], p=[0.8, 0.2])
            gated = "Yes"
            parking = np.random.choice([2, 3], p=[0.4, 0.6])
        elif ptype in ["Villa", "Independent House"]:
            bhk = np.random.choice([2, 3, 4, 5], p=[0.15, 0.45, 0.30, 0.10])
            area = int(np.random.normal(bhk * 550 + 300, 200))
            area = max(1100, min(4500, area))
            bathrooms = bhk if np.random.rand() > 0.3 else bhk - 1
            total_floors = np.random.choice([1, 2, 3], p=[0.30, 0.55, 0.15])
            floor_no = 0
            gated = np.random.choice(["Yes", "No"], p=[0.75, 0.25])
            parking = np.random.choice([1, 2, 3], p=[0.35, 0.45, 0.20])
        else: # Standard Apartment (1BHK, 2BHK, 3BHK, 4BHK)
            bhk = np.random.choice([1, 2, 3, 4, 5], p=[0.24, 0.42, 0.24, 0.08, 0.02])
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
                bathrooms = np.random.choice([2, 3], p=[0.35, 0.65])
            elif bhk == 4:
                area = int(np.random.normal(2150, 200))
                area = max(1750, min(3200, area))
                bathrooms = np.random.choice([3, 4], p=[0.3, 0.7])
            else:
                area = int(np.random.normal(3000, 300))
                area = max(2400, min(4500, area))
                bathrooms = np.random.choice([4, 5], p=[0.3, 0.7])

            total_floors = np.random.randint(4, 32)
            floor_no = np.random.randint(1, total_floors + 1)
            gated = np.random.choice(["Yes", "No"], p=[0.85, 0.15])
            parking = np.random.choice([0, 1, 2, 3], p=[0.15, 0.60, 0.20, 0.05])

        prop_age = int(np.random.exponential(scale=4.0))
        prop_age = min(30, prop_age)

        amenities_score = int(np.random.choice([3, 4, 5, 6, 7, 8, 9, 10], p=[0.05, 0.10, 0.15, 0.20, 0.20, 0.15, 0.10, 0.05]))
        metro_dist = round(float(np.random.exponential(scale=2.0) + 0.3), 1)
        metro_dist = min(15.0, metro_dist)

        # Economic rate modifiers
        type_mult = PROPERTY_TYPE_FACTORS[ptype]
        furnish_mult = FURNISHING_FACTORS[furnish]
        
        # Direct BHK and bathroom layout premium (extra rooms require additional interior partitioning and design value)
        bhk_factor = 1.0 + (bhk - 2) * 0.08
        bath_factor = 1.0 + (bathrooms - 2) * 0.04
        
        # Amenities premium (Score 10 gives +20%, Score 2 gives -12%)
        amenities_factor = 1.0 + (amenities_score - 5.0) * 0.04
        
        # Parking factor (+3.5% per parking slot)
        parking_factor = 1.0 + (parking * 0.035)
        
        # Age depreciation (-1% per year)
        age_depreciation = max(0.70, 1.0 - (prop_age * 0.010))
        
        # Metro accessibility factor
        metro_factor = max(0.85, 1.04 - (metro_dist * 0.015))
        
        # Gated society factor (+6%)
        gated_factor = 1.06 if gated == "Yes" else 0.96

        # Floor level factor (higher floors in towers command view premium)
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

        # Target variable in Lakhs
        price_lakhs = round((final_price_inr / 100000.0), 2)
        price_lakhs = max(15.0, price_lakhs)

        # Target leakage feature for audit
        price_per_sqft_leak = round((price_lakhs * 100000.0) / area, 2)

        data.append({
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
            "Price_per_SqFt": price_per_sqft_leak,  # Explicit leakage column to test detection
            "Price_INR_Lakhs": price_lakhs           # Target variable
        })

    df = pd.DataFrame(data)
    df.to_csv(CSV_PATH, index=False)
    print(f"[DATASET] Generated expanded Indian Urban House Price dataset: {CSV_PATH} ({len(df)} samples)", flush=True)
    return df

def train_and_evaluate():
    print("\n[INFO] Starting PropPredict ML Pipeline with Expanded Indian Urban Dataset...", flush=True)

    df = generate_indian_housing_dataset(n_samples=5000, random_state=42)

    # Check and Drop Target Leakage Columns
    leakage_candidates = ["Price_per_SqFt", "price_per_sqft", "Rate_SqFt", "price_per_sq_ft"]
    removed_leakage_features = [col for col in df.columns if col in leakage_candidates]
    print(f"[LEAKAGE AUDIT] Dropped Leakage Columns: {removed_leakage_features}", flush=True)

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

    # Train / Test Split (Strict 80% train / 20% test with seed 42)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"[SPLIT] Train: {len(X_train)} rows | Test: {len(X_test)} rows", flush=True)

    # Preprocessing with ColumnTransformer
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
        ]
    )

    preprocessor.fit(X_train)
    joblib.dump(preprocessor, os.path.join(MODEL_DIR, 'preprocessor.pkl'))
    print("[SUCCESS] Saved preprocessor to model/preprocessor.pkl", flush=True)

    # Multi-Model Benchmark
    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(
            n_estimators=120,
            max_depth=16,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=1
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=180,
            learning_rate=0.08,
            max_depth=6,
            subsample=0.85,
            random_state=42
        )
    }

    metrics = {}
    fitted_pipelines = {}

    print("\n--- Training & Evaluating Models on 20% Holdout Test Set ---")
    for name, model in models.items():
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

        print(f"[{name}] MAE: {mae:.2f} Lakhs | RMSE: {rmse:.2f} Lakhs | R2: {r2:.4f} | MAPE: {mape:.2f}%")

    # Select Best Model based on Lowest RMSE & Highest R2
    best_model_name = max(metrics.keys(), key=lambda m: (metrics[m]["R2"], -metrics[m]["RMSE"]))
    best_pipeline = fitted_pipelines[best_model_name]
    print(f"\n[BEST MODEL SELECTED] {best_model_name} (R2: {metrics[best_model_name]['R2']}, MAPE: {metrics[best_model_name]['MAPE']}%)")

    # Save Best Model Pipeline
    joblib.dump(best_pipeline, os.path.join(MODEL_DIR, 'model.pkl'))
    print(f"[SUCCESS] Saved production pipeline to model/model.pkl", flush=True)

    # Feature Importance for Tree Models
    feature_importance_list = []
    try:
        ohe = preprocessor.named_transformers_['cat']
        cat_feature_names = list(ohe.get_feature_names_out(categorical_features))
        all_encoded_features = numeric_features + cat_feature_names

        if hasattr(best_pipeline.named_steps['regressor'], 'feature_importances_'):
            importances = best_pipeline.named_steps['regressor'].feature_importances_
            feat_imp_df = pd.DataFrame({
                'feature': all_encoded_features,
                'importance': importances
            }).sort_values('importance', ascending=False)

            for _, row in feat_imp_df.head(15).iterrows():
                feature_importance_list.append({
                    "feature": str(row['feature']),
                    "importance": round(float(row['importance']) * 100, 2)
                })
    except Exception as e:
        print(f"[WARN] Feature importance calculation note: {e}")

    with open(os.path.join(MODEL_DIR, 'feature_importance.json'), 'w') as f:
        json.dump(feature_importance_list, f, indent=2)

    # Save Test-Set Actual vs Predicted for Dashboard
    y_test_pred = best_pipeline.predict(X_test)
    eval_df = X_test.copy()
    eval_df['Actual_Price'] = y_test.values
    eval_df['Predicted_Price'] = y_test_pred
    eval_df['Absolute_Error'] = np.abs(eval_df['Actual_Price'] - eval_df['Predicted_Price'])
    eval_df['Percentage_Error'] = (eval_df['Absolute_Error'] / eval_df['Actual_Price']) * 100.0

    eval_samples = []
    for _, row in eval_df.head(25).iterrows():
        eval_samples.append({
            "city": str(row['City']),
            "locality": str(row['Locality']),
            "property_type": str(row['Property_Type']),
            "bhk": int(row['BHK']),
            "bathrooms": int(row['Bathrooms']),
            "area_sqft": int(row['Area_SqFt']),
            "actual_price": round(float(row['Actual_Price']), 2),
            "predicted_price": round(float(row['Predicted_Price']), 2),
            "error_lakhs": round(float(row['Absolute_Error']), 2),
            "error_pct": round(float(row['Percentage_Error']), 2)
        })

    # Price distribution bins
    price_bins = [0, 40, 75, 150, 300, 600, 1200, 2000]
    bin_labels = ["<40L (Budget)", "40L-75L (Affordable)", "75L-1.5Cr (Mid)", "1.5Cr-3Cr (Premium)", "3Cr-6Cr (Luxury)", "6Cr-12Cr (High Luxury)", ">12Cr (Super Luxury)"]
    hist, _ = np.histogram(df[target], bins=price_bins)
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

    # Save Full Metadata
    full_metrics = {
        "dataset_name": "Indian Urban House Price Prediction Dataset",
        "best_model": best_model_name,
        "total_records": len(df),
        "train_records": len(X_train),
        "test_records": len(X_test),
        "target_variable": target,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "removed_leakage_features": removed_leakage_features,
        "models_performance": metrics,
        "cities": list(CITY_LOCALITIES.keys()),
        "city_localities": {c: list(locs.keys()) for c, locs in CITY_LOCALITIES.items()},
        "property_types": list(PROPERTY_TYPE_FACTORS.keys()),
        "furnishing_statuses": list(FURNISHING_FACTORS.keys())
    }

    with open(os.path.join(MODEL_DIR, 'metrics.json'), 'w') as f:
        json.dump(full_metrics, f, indent=2)

    print("\n[SUCCESS] Model training and evaluation complete! Artifacts saved.")

if __name__ == '__main__':
    train_and_evaluate()
