"""
PropPredict — Flask REST API Server
-----------------------------------
Serves predictions and model metadata for the House Price Prediction web application.
Loads the trained Scikit-learn Pipeline (model.pkl) into memory at startup.
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'model')
DATA_DIR = os.path.join(BASE_DIR, 'data')

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(MODEL_DIR, 'model.pkl')
METRICS_PATH = os.path.join(MODEL_DIR, 'metrics.json')
EVAL_PATH = os.path.join(MODEL_DIR, 'eval_samples.json')
FEAT_IMP_PATH = os.path.join(MODEL_DIR, 'feature_importance.json')
INSPECT_PATH = os.path.join(MODEL_DIR, 'dataset_inspection.json')

model_pipeline = None
metrics_data = {}
eval_data = {}
feature_importance_data = []
inspection_data = {}

def load_artifacts():
    global model_pipeline, metrics_data, eval_data, feature_importance_data, inspection_data
    if os.path.exists(MODEL_PATH):
        model_pipeline = joblib.load(MODEL_PATH)
        print("[BACKEND] Successfully loaded production Pipeline (model.pkl).", flush=True)
    else:
        print("[WARN] model.pkl not found! Please run train.py first.", flush=True)

    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, 'r') as f:
            metrics_data = json.load(f)

    if os.path.exists(EVAL_PATH):
        with open(EVAL_PATH, 'r') as f:
            eval_data = json.load(f)

    if os.path.exists(FEAT_IMP_PATH):
        with open(FEAT_IMP_PATH, 'r') as f:
            feature_importance_data = json.load(f)

    if os.path.exists(INSPECT_PATH):
        with open(INSPECT_PATH, 'r') as f:
            inspection_data = json.load(f)

load_artifacts()

def format_inr_lakhs(lakhs):
    """Formats a price in Lakhs to standard Indian notation (Cr or Lakhs)."""
    if lakhs >= 100.0:
        cr = lakhs / 100.0
        return f"₹{cr:.2f} Cr"
    else:
        return f"₹{lakhs:.2f} Lakhs"

def format_indian_number(amount):
    """Formats full integer amount into standard Indian comma grouping (e.g. 18,75,000)."""
    amount = round(amount)
    s = str(amount)
    if len(s) <= 3:
        return f"₹{s}"
    last_three = s[-3:]
    remaining = s[:-3]
    result = ""
    while len(remaining) > 2:
        result = "," + remaining[-2:] + result
        remaining = remaining[:-2]
    result = remaining + result + "," + last_three
    return f"₹{result}"

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "PropPredict ML Service",
        "model_loaded": model_pipeline is not None,
        "selected_model": metrics_data.get("best_model", "Random Forest"),
        "version": "2.0.0"
    }), 200

@app.route('/model-info', methods=['GET'])
def model_info():
    if not metrics_data:
        return jsonify({"error": "Model metadata not available. Please run train.py first."}), 500
    
    best_model_name = metrics_data.get("best_model", "Random Forest")
    best_perf = metrics_data.get("models_performance", {}).get(best_model_name, {})

    return jsonify({
        "dataset_name": metrics_data.get("dataset_name", "Indian Urban House Price Prediction Dataset"),
        "dataset_type": metrics_data.get("dataset_type", "Synthetic Procedural Benchmark"),
        "best_model": best_model_name,
        "total_records": metrics_data.get("total_records", 5000),
        "train_records": metrics_data.get("train_records", 4000),
        "test_records": metrics_data.get("test_records", 1000),
        "target_variable": metrics_data.get("target_variable", "Price_INR_Lakhs"),
        "numeric_features": metrics_data.get("numeric_features", []),
        "categorical_features": metrics_data.get("categorical_features", []),
        "removed_leakage_features": metrics_data.get("removed_leakage_features", ["Price_per_SqFt"]),
        "models_performance": metrics_data.get("models_performance", {}),
        "best_model_metrics": best_perf,
        "cities": metrics_data.get("cities", []),
        "city_localities": metrics_data.get("city_localities", {})
    }), 200

@app.route('/evaluation-data', methods=['GET'])
def evaluation_data():
    return jsonify({
        "actual_vs_predicted": eval_data.get("actual_vs_predicted", []),
        "price_distribution": eval_data.get("price_distribution", []),
        "metrics_comparison": eval_data.get("metrics_comparison", []),
        "feature_importance": feature_importance_data,
        "inspection": inspection_data
    }), 200

@app.route('/features-schema', methods=['GET'])
def features_schema():
    return jsonify({
        "cities": metrics_data.get("cities", []),
        "city_localities": metrics_data.get("city_localities", {}),
        "property_types": metrics_data.get("property_types", ["Apartment", "Independent House", "Villa", "Penthouse", "Studio"]),
        "furnishing_statuses": metrics_data.get("furnishing_statuses", ["Furnished", "Semi-Furnished", "Unfurnished"]),
        "gated_options": ["Yes", "No"],
        "ranges": {
            "bhk": {"min": 1, "max": 6, "default": 2},
            "bathrooms": {"min": 1, "max": 6, "default": 2},
            "area_sqft": {"min": 350, "max": 5500, "default": 1000},
            "floor_no": {"min": 0, "max": 45, "default": 8},
            "total_floors": {"min": 1, "max": 50, "default": 20},
            "property_age": {"min": 0, "max": 30, "default": 2},
            "parking_spaces": {"min": 0, "max": 3, "default": 1},
            "metro_distance_km": {"min": 0.1, "max": 15.0, "default": 0.8},
            "amenities_score": {"min": 1, "max": 10, "default": 8}
        }
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    if model_pipeline is None:
        return jsonify({"error": "Model pipeline is not loaded. Please run train.py first."}), 500

    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No input payload provided"}), 400

        # Extract & validate input features
        city = str(data.get("City", data.get("city", "Mumbai")))
        locality = str(data.get("Locality", data.get("locality", "Kandivali West")))
        prop_type = str(data.get("Property_Type", data.get("property_type", "Apartment")))
        furnishing = str(data.get("Furnishing_Status", data.get("furnishing_status", "Semi-Furnished")))
        gated = str(data.get("Gated_Community", data.get("gated_community", "Yes")))

        bhk = int(data.get("BHK", data.get("bhk", 2)))
        bathrooms = int(data.get("Bathrooms", data.get("bathrooms", 2)))
        area_sqft = float(data.get("Area_SqFt", data.get("area_sqft", 1000)))
        floor_no = int(data.get("Floor_No", data.get("floor_no", 8)))
        total_floors = int(data.get("Total_Floors", data.get("total_floors", 20)))
        property_age = int(data.get("Property_Age", data.get("property_age", 2)))
        parking_spaces = int(data.get("Parking_Spaces", data.get("parking_spaces", 1)))
        metro_distance_km = float(data.get("Metro_Distance_KM", data.get("metro_distance_km", 0.8)))
        amenities_score = int(data.get("Amenities_Score", data.get("amenities_score", 8)))

        # Construct single-row DataFrame matching the exact schema expected by ColumnTransformer
        input_dict = {
            "BHK": [bhk],
            "Bathrooms": [bathrooms],
            "Area_SqFt": [area_sqft],
            "Floor_No": [floor_no],
            "Total_Floors": [total_floors],
            "Property_Age": [property_age],
            "Parking_Spaces": [parking_spaces],
            "Metro_Distance_KM": [metro_distance_km],
            "Amenities_Score": [amenities_score],
            "City": [city],
            "Locality": [locality],
            "Property_Type": [prop_type],
            "Furnishing_Status": [furnishing],
            "Gated_Community": [gated]
        }
        input_df = pd.DataFrame(input_dict)

        # Run inference through Scikit-Learn Pipeline
        pred_lakhs = float(model_pipeline.predict(input_df)[0])
        pred_lakhs = max(15.0, pred_lakhs)

        exact_inr = round(pred_lakhs * 100000.0)
        rate_sqft = round(exact_inr / area_sqft) if area_sqft > 0 else 0

        best_model_name = metrics_data.get("best_model", "Random Forest")
        best_r2 = metrics_data.get("models_performance", {}).get(best_model_name, {}).get("R2", 0.8529)
        best_mape = metrics_data.get("models_performance", {}).get(best_model_name, {}).get("MAPE", 29.20)

        # Expected price range using test MAPE
        mape_fraction = (best_mape / 100.0) if best_mape else 0.25
        low_lakhs = round(pred_lakhs * (1 - mape_fraction), 2)
        high_lakhs = round(pred_lakhs * (1 + mape_fraction), 2)

        factor_explanations = [
            {
                "factor": "Spatial Scale & BHK",
                "impact": f"{bhk} BHK ({int(area_sqft):,} sq.ft)",
                "description": f"Layout of {bhk} bedrooms and {bathrooms} bathrooms over {int(area_sqft):,} sq.ft living area."
            },
            {
                "factor": "Micro-Market Rate",
                "impact": f"{locality}, {city}",
                "description": f"Governed by baseline residential pricing in {locality} ({city})."
            },
            {
                "factor": "Society Amenities",
                "impact": f"Score {amenities_score}/10 ({gated} Gated)",
                "description": f"Clubhouse, security, and facility tier adjustment on square-foot valuation."
            },
            {
                "factor": "Condition & Parking",
                "impact": f"{furnishing} · {parking_spaces} Parking",
                "description": f"{furnishing} status and {parking_spaces} dedicated car parking slot(s)."
            }
        ]

        response = {
            "predicted_price_lakhs": round(pred_lakhs, 2),
            "predicted_price_formatted": format_inr_lakhs(pred_lakhs),
            "price_inr_exact": exact_inr,
            "price_inr_formatted": format_indian_number(exact_inr),
            "price_range": {
                "low_lakhs": low_lakhs,
                "high_lakhs": high_lakhs,
                "low_formatted": format_inr_lakhs(low_lakhs),
                "high_formatted": format_inr_lakhs(high_lakhs)
            },
            "rate_per_sqft": rate_sqft,
            "rate_per_sqft_formatted": f"{format_indian_number(rate_sqft)} / sq.ft",
            "model_used": f"{best_model_name} Regressor",
            "model_r2": best_r2,
            "model_mape": best_mape,
            "feature_impacts": factor_explanations,
            "input_features": {
                "City": city,
                "Locality": locality,
                "Property_Type": prop_type,
                "BHK": bhk,
                "Bathrooms": bathrooms,
                "Area_SqFt": area_sqft,
                "Floor_No": floor_no,
                "Total_Floors": total_floors,
                "Property_Age": property_age,
                "Furnishing_Status": furnishing,
                "Parking_Spaces": parking_spaces,
                "Gated_Community": gated,
                "Metro_Distance_KM": metro_distance_km,
                "Amenities_Score": amenities_score
            }
        }

        return jsonify(response), 200

    except Exception as e:
        print(f"[ERROR] Prediction failed: {str(e)}", flush=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[SERVER] Starting PropPredict Flask API on http://localhost:{port}", flush=True)
    app.run(host='0.0.0.0', port=port, debug=False)
