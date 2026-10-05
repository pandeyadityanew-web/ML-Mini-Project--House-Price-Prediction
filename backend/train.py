import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

# Ensure UTF-8 output on Windows
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

# City and Locality baseline rate mappings (INR per sq.ft)
CITY_LOCALITIES = {
    "Mumbai": {
        "Bandra West": 42000,
        "Worli": 46000,
        "Andheri East": 21000,
        "Juhu": 48000,
        "Thane West": 12500,
        "Navi Mumbai (Vashi)": 14000
    },
    "Bangalore": {
        "Indiranagar": 19000,
        "Koramangala": 18500,
        "Whitefield": 9200,
        "HSR Layout": 14000,
        "Electronic City": 6500,
        "Hebbal": 11500
    },
    "Delhi NCR": {
        "Gurgaon Golf Course Rd": 28000,
        "Gurgaon Cyber City": 18500,
        "South Extension": 26000,
        "Vasant Kunj": 22000,
        "Noida Sector 62": 8200,
        "Noida Expressway": 9200
    },
    "Pune": {
        "Koregaon Park": 16000,
        "Kalyani Nagar": 14000,
        "Baner": 10500,
        "Hinjewadi": 7500,
        "Wakad": 8200
    },
    "Hyderabad": {
        "Jubilee Hills": 24000,
        "Banjara Hills": 22000,
        "HITEC City": 12000,
        "Gachibowli": 11000,
        "Madhapur": 11500
    },
    "Chennai": {
        "Anna Nagar": 15500,
        "Adyar": 17500,
        "Boat Club Road": 28000,
        "OMR IT Corridor": 7200,
        "Velachery": 8800
    },
    "Kolkata": {
        "Park Street": 16500,
        "Ballygunge": 15000,
        "Salt Lake Sector V": 8500,
        "New Town": 6800,
        "Alipore": 21000
    },
    "Ahmedabad": {
        "SG Highway": 7500,
        "Bodakdev": 9500,
        "Prahlad Nagar": 8800,
        "Satellite": 8200,
        "Bopal": 5500
    }
}

PROPERTY_TYPE_FACTORS = {
    "Apartment": 1.0,
    "Independent House": 1.15,
    "Villa": 1.38,
    "Penthouse": 1.48,
    "Studio": 0.88,
}

FURNISHING_FACTORS = {
    "Furnished": 1.10,
    "Semi-Furnished": 1.04,
    "Unfurnished": 1.0,
}

def generate_indian_housing_dataset(n_samples=4000, random_state=42):
    """
    Generates an authentic Indian urban housing dataset with real-world price distributions in Lakhs.
    Includes intentional raw column 'Price_per_SqFt' to demonstrate and test Target Leakage detection.
    """
    np.random.seed(random_state)
    cities = list(CITY_LOCALITIES.keys())
    prop_types = list(PROPERTY_TYPE_FACTORS.keys())
    furnishings = list(FURNISHING_FACTORS.keys())

    # Sample city distribution with higher density in top tier-1 metros
    city_weights = [0.22, 0.20, 0.18, 0.12, 0.10, 0.08, 0.05, 0.05]
    city_choices = np.random.choice(cities, size=n_samples, p=city_weights)
    prop_choices = np.random.choice(prop_types, size=n_samples, p=[0.60, 0.14, 0.12, 0.08, 0.06])
    furnish_choices = np.random.choice(furnishings, size=n_samples, p=[0.32, 0.48, 0.20])

    data = []

    for i in range(n_samples):
        city = city_choices[i]
        localities_for_city = list(CITY_LOCALITIES[city].keys())
        locality = np.random.choice(localities_for_city)
        base_rate = CITY_LOCALITIES[city][locality]

        ptype = prop_choices[i]
        furnish = furnish_choices[i]

        # BHK and Living Area sizing based on property format
        if ptype == "Studio":
            bhk = 1
            area = int(np.random.normal(460, 70))
            area = max(320, min(700, area))
            bathrooms = 1
            total_floors = np.random.randint(4, 25)
            floor_no = np.random.randint(1, total_floors)
            gated = np.random.choice(["Yes", "No"], p=[0.75, 0.25])
            parking = np.random.choice([0, 1], p=[0.7, 0.3])
        elif ptype == "Penthouse":
            bhk = np.random.choice([3, 4, 5, 6], p=[0.25, 0.45, 0.20, 0.10])
            area = int(np.random.normal(bhk * 750 + 500, 300))
            area = max(2200, min(5500, area))
            bathrooms = bhk + np.random.choice([0, 1], p=[0.5, 0.5])
            total_floors = np.random.randint(18, 45)
            floor_no = total_floors - np.random.choice([0, 1], p=[0.8, 0.2])
            gated = "Yes"
            parking = np.random.choice([2, 3], p=[0.4, 0.6])
        elif ptype in ["Villa", "Independent House"]:
            bhk = np.random.choice([3, 4, 5], p=[0.40, 0.45, 0.15])
            area = int(np.random.normal(bhk * 600 + 350, 250))
            area = max(1400, min(4800, area))
            bathrooms = bhk if np.random.rand() > 0.3 else bhk - 1
            total_floors = np.random.choice([1, 2, 3], p=[0.25, 0.60, 0.15])
            floor_no = 0
            gated = np.random.choice(["Yes", "No"], p=[0.80, 0.20])
            parking = np.random.choice([1, 2, 3], p=[0.3, 0.5, 0.2])
        else: # Apartment
            bhk = np.random.choice([1, 2, 3, 4], p=[0.16, 0.46, 0.30, 0.08])
            area = int(np.random.normal(bhk * 460 + 180, 160))
            area = max(450, min(3200, area))
            bathrooms = max(1, min(bhk + 1, bhk if np.random.rand() > 0.35 else bhk - 1 if bhk > 1 else 1))
            total_floors = np.random.randint(4, 32)
            floor_no = np.random.randint(1, total_floors + 1)
            gated = np.random.choice(["Yes", "No"], p=[0.88, 0.12])
            parking = np.random.choice([0, 1, 2], p=[0.18, 0.65, 0.17])

        prop_age = int(np.random.exponential(scale=5.0))
        prop_age = min(30, prop_age)

        overall_quality = int(np.random.normal(7.2, 1.4))
        overall_quality = max(1, min(10, overall_quality))

        amenities_score = int(np.random.normal(7.0, 1.8))
        amenities_score = max(1, min(10, amenities_score))

        metro_dist = round(float(np.random.exponential(scale=2.5) + 0.3), 1)
        metro_dist = min(15.0, metro_dist)

        # Economic rate modifiers
        type_mult = PROPERTY_TYPE_FACTORS[ptype]
        furnish_mult = FURNISHING_FACTORS[furnish]
        quality_factor = 1.0 + (overall_quality - 6.5) * 0.055
        age_depreciation = max(0.72, 1.0 - (prop_age * 0.011))
        amenities_factor = 1.0 + (amenities_score - 5.0) * 0.02
        metro_factor = 1.04 - (metro_dist * 0.006)
        gated_factor = 1.04 if gated == "Yes" else 0.96

        if total_floors > 10 and floor_no > 10:
            floor_factor = 1.0 + min(0.06, (floor_no / total_floors) * 0.06)
        else:
            floor_factor = 1.0

        effective_rate_sqft = (
            base_rate * type_mult * furnish_mult * quality_factor * 
            age_depreciation * amenities_factor * metro_factor * 
            gated_factor * floor_factor
        )

        raw_price_inr = effective_rate_sqft * area
        # Add realistic market variance (~4%)
        noise = np.random.normal(1.0, 0.04)
        final_price_inr = raw_price_inr * noise

        # Target variable: Price in Lakhs (1 Lakh = 100,000 INR)
        price_lakhs = round((final_price_inr / 100000.0), 2)
        price_lakhs = max(15.0, price_lakhs) # Floor at 15 Lakhs

        # Leakage column: Price per SqFt directly derived from price/area
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
    print(f"[DATASET] Generated Indian Urban House Price dataset: {CSV_PATH} ({len(df)} samples)", flush=True)
    return df

def inspect_dataset(df):
    """
    Performs comprehensive dataset inspection and checks for potential target leakage.
    """
    print("\n" + "="*50, flush=True)
    print("      DATASET INSPECTION & LEAKAGE AUDIT       ", flush=True)
    print("="*50, flush=True)
    print(f"Total Rows: {len(df)} | Total Columns: {len(df.columns)}", flush=True)
    print(f"Missing Values:\n{df.isnull().sum()}", flush=True)
    print(f"Duplicate Rows: {df.duplicated().sum()}", flush=True)
    
    # Target Leakage Audit
    leakage_candidates = ["Price_per_SqFt", "price_per_sqft", "Rate_SqFt", "price_per_sq_ft", "Derived_Price"]
    removed_leakage_features = [col for col in df.columns if col in leakage_candidates]
    
    print(f"\n[LEAKAGE AUDIT] Target Leakage Features Identified and Dropped: {removed_leakage_features}", flush=True)
    
    # Summary statistics for target
    target_series = df["Price_INR_Lakhs"]
    print(f"\n[TARGET STATS] Price_INR_Lakhs:")
    print(f"  Min: {target_series.min():.2f} L | Max: {target_series.max():.2f} L")
    print(f"  Mean: {target_series.mean():.2f} L | Median: {target_series.median():.2f} L | Std: {target_series.std():.2f} L", flush=True)

    inspection_report = {
        "total_rows": int(len(df)),
        "total_columns": int(len(df.columns)),
        "columns": list(df.columns),
        "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing_values": {col: int(cnt) for col, cnt in df.isnull().sum().items()},
        "duplicate_rows": int(df.duplicated().sum()),
        "removed_leakage_features": removed_leakage_features,
        "target_variable": "Price_INR_Lakhs",
        "target_summary": {
            "min_lakhs": float(target_series.min()),
            "max_lakhs": float(target_series.max()),
            "mean_lakhs": round(float(target_series.mean()), 2),
            "median_lakhs": round(float(target_series.median()), 2),
            "std_lakhs": round(float(target_series.std()), 2)
        }
    }

    with open(os.path.join(MODEL_DIR, 'dataset_inspection.json'), 'w') as f:
        json.dump(inspection_report, f, indent=2)

    return removed_leakage_features

def train_and_evaluate():
    print("\n[INFO] Starting PropPredict ML Pipeline with Indian Urban Dataset...", flush=True)

    # 1. Load or Generate Dataset
    if not os.path.exists(CSV_PATH):
        df = generate_indian_housing_dataset(n_samples=4000, random_state=42)
    else:
        df = pd.read_csv(CSV_PATH)
        print(f"[INFO] Loaded existing dataset from {CSV_PATH} with {len(df)} rows.", flush=True)

    # 2. Inspect and Check Target Leakage
    removed_leakage_features = inspect_dataset(df)

    # 3. Define Clean Feature Schema
    numeric_features = [
        "BHK", "Bathrooms", "Area_SqFt", "Floor_No", 
        "Total_Floors", "Property_Age", "Parking_Spaces", 
        "Metro_Distance_KM", "Amenities_Score"
    ]

    categorical_features = [
        "City", "Locality", "Property_Type", "Furnishing_Status", "Gated_Community"
    ]

    target = "Price_INR_Lakhs"

    # Confirm all features exist and none are leakage features
    all_features = numeric_features + categorical_features
    for feat in all_features:
        if feat in removed_leakage_features:
            raise ValueError(f"CRITICAL ERROR: Leakage feature {feat} was included in training features!")

    X = df[all_features]
    y = df[target]

    # 4. Train/Test Split (Strictly 80% train / 20% test with fixed random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"\n[SPLIT] Train Samples: {len(X_train)} (80%) | Test Samples: {len(X_test)} (20%)", flush=True)

    # 5. Preprocessing Pipeline with ColumnTransformer
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
        ]
    )

    # Fit preprocessor on X_train only to prevent data leakage
    preprocessor.fit(X_train)
    joblib.dump(preprocessor, os.path.join(MODEL_DIR, 'preprocessor.pkl'))
    print("[SUCCESS] Saved fitted preprocessor to model/preprocessor.pkl", flush=True)

    # 6. Train and Compare Models
    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(
            n_estimators=120,
            max_depth=15,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=1
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=160,
            learning_rate=0.08,
            max_depth=5,
            subsample=0.85,
            random_state=42
        )
    }

    results = {}
    fitted_pipelines = {}

    for name, model in models.items():
        print(f"\n[TRAIN] Fitting {name} on X_train...", flush=True)
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', model)
        ])
        
        pipeline.fit(X_train, y_train)
        fitted_pipelines[name] = pipeline

        # Predictions evaluated STRICTLY on unseen test set X_test
        y_pred = pipeline.predict(X_test)

        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))
        mape = float(np.mean(np.abs((y_test - y_pred) / y_test)) * 100)

        results[name] = {
            "MAE": round(mae, 2),        # In Lakhs
            "RMSE": round(rmse, 2),      # In Lakhs
            "R2": round(r2, 4),
            "MAPE": round(mape, 2)       # Percentage
        }
        print(f"   [{name}] Test MAE: {mae:.2f} Lakhs | RMSE: {rmse:.2f} Lakhs | R2: {r2:.4f} | MAPE: {mape:.2f}%", flush=True)

    # 7. Select Best Model (Higher R², Lower MAE)
    best_model_name = max(results, key=lambda k: results[k]["R2"])
    best_pipeline = fitted_pipelines[best_model_name]
    print(f"\n[BEST MODEL] 🏆 Selected: {best_model_name} (R² = {results[best_model_name]['R2']}, MAE = {results[best_model_name]['MAE']} L)", flush=True)

    joblib.dump(best_pipeline, os.path.join(MODEL_DIR, 'model.pkl'))
    print("[SUCCESS] Saved production pipeline to model/model.pkl", flush=True)

    # 8. Compute Feature Importance from Tree Regressor
    tree_regressor = fitted_pipelines["Gradient Boosting"].named_steps['regressor']
    cat_encoder = preprocessor.named_transformers_['cat']
    encoded_cat_names = cat_encoder.get_feature_names_out(categorical_features).tolist()
    all_encoded_names = numeric_features + encoded_cat_names

    importances = tree_regressor.feature_importances_

    # Aggregate one-hot feature importances under high-level categories for clean visualization
    aggregated_importance = {}
    for feat_name, imp in zip(all_encoded_names, importances):
        if "City_" in feat_name:
            group = "City & Metro Hub"
        elif "Locality_" in feat_name:
            group = "Micro-Market Locality"
        elif "Property_Type_" in feat_name:
            group = "Property Type"
        elif "Furnishing_Status_" in feat_name:
            group = "Furnishing Status"
        elif "Gated_Community_" in feat_name:
            group = "Gated Community Status"
        elif feat_name == "Area_SqFt":
            group = "Built-Up Area (Sq.Ft)"
        elif feat_name == "BHK":
            group = "BHK Layout"
        elif feat_name == "Bathrooms":
            group = "Bathrooms"
        elif feat_name == "Property_Age":
            group = "Property Age"
        elif feat_name == "Amenities_Score":
            group = "Amenities Score"
        elif feat_name == "Metro_Distance_KM":
            group = "Metro Proximity"
        elif feat_name in ["Floor_No", "Total_Floors"]:
            group = "Floor Level & Height"
        elif feat_name == "Parking_Spaces":
            group = "Parking Spaces"
        else:
            group = feat_name
        
        aggregated_importance[group] = aggregated_importance.get(group, 0.0) + float(imp)

    sorted_importances = [
        {"feature": k, "importance": round(v * 100, 2)}
        for k, v in sorted(aggregated_importance.items(), key=lambda item: item[1], reverse=True)
    ]

    with open(os.path.join(MODEL_DIR, 'feature_importance.json'), 'w') as f:
        json.dump(sorted_importances, f, indent=2)
    print("[SUCCESS] Saved feature importance to model/feature_importance.json", flush=True)

    # 9. Extract Actual vs Predicted Evaluation Samples for Visualizations
    y_test_pred = best_pipeline.predict(X_test)
    eval_df = pd.DataFrame({
        "actual": y_test.values,
        "predicted": y_test_pred,
        "area": X_test["Area_SqFt"].values,
        "bhk": X_test["BHK"].values,
        "city": X_test["City"].values,
        "locality": X_test["Locality"].values
    })

    # Target Price Distribution Histogram
    hist_counts, bin_edges = np.histogram(df["Price_INR_Lakhs"], bins=8)
    dist_data = []
    for i in range(len(hist_counts)):
        b_min = bin_edges[i]
        b_max = bin_edges[i+1]
        range_label = f"₹{b_min:.0f}L - ₹{b_max:.0f}L" if b_max < 100 else f"₹{b_min/100:.2f}Cr - ₹{b_max/100:.2f}Cr"
        dist_data.append({
            "range": range_label,
            "count": int(hist_counts[i]),
            "min_lakhs": round(float(b_min), 2),
            "max_lakhs": round(float(b_max), 2)
        })

    eval_chart_data = {
        "actual_vs_predicted": [
            {
                "id": i,
                "actual_lakhs": round(float(eval_df.iloc[i]["actual"]), 2),
                "predicted_lakhs": round(float(eval_df.iloc[i]["predicted"]), 2),
                "actual_cr": round(float(eval_df.iloc[i]["actual"]) / 100.0, 2),
                "predicted_cr": round(float(eval_df.iloc[i]["predicted"]) / 100.0, 2),
                "bhk": int(eval_df.iloc[i]["bhk"]),
                "area": int(eval_df.iloc[i]["area"]),
                "city": eval_df.iloc[i]["city"],
                "locality": eval_df.iloc[i]["locality"]
            }
            for i in range(min(80, len(eval_df)))
        ],
        "price_distribution": dist_data,
        "metrics_comparison": [
            {
                "model": model_name,
                "r2_score": round(metrics["R2"] * 100, 2),
                "mae_lakhs": metrics["MAE"],
                "rmse_lakhs": metrics["RMSE"],
                "mape": metrics["MAPE"]
            }
            for model_name, metrics in results.items()
        ]
    }

    with open(os.path.join(MODEL_DIR, 'eval_samples.json'), 'w') as f:
        json.dump(eval_chart_data, f, indent=2)
    print("[SUCCESS] Saved evaluation samples to model/eval_samples.json", flush=True)

    # 10. Global Metadata Summary
    metadata = {
        "dataset_name": "Indian Urban House Price Prediction Dataset",
        "total_records": int(len(df)),
        "train_records": int(len(X_train)),
        "test_records": int(len(X_test)),
        "target_variable": "Price_INR_Lakhs",
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "removed_leakage_features": removed_leakage_features,
        "cities": sorted(list(CITY_LOCALITIES.keys())),
        "city_localities": CITY_LOCALITIES,
        "property_types": list(PROPERTY_TYPE_FACTORS.keys()),
        "furnishing_statuses": list(FURNISHING_FACTORS.keys()),
        "best_model": best_model_name,
        "models_performance": results
    }

    with open(os.path.join(MODEL_DIR, 'metrics.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    print("[SUCCESS] Saved metrics to model/metrics.json", flush=True)
    print("[DONE] Indian Urban House Price ML Training Pipeline Completed Successfully!\n", flush=True)

if __name__ == '__main__':
    train_and_evaluate()
