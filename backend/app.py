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
        print("[BACKEND] Loaded Indian Urban House Price model.pkl pipeline.", flush=True)
    else:
        print("[WARN] model.pkl not found! Run train.py first.", flush=True)

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

def format_inr_lakhs_to_string(lakhs):
    """
    Formats price in Lakhs to Indian denomination: e.g. 125.5 -> '₹1.26 Cr', 45.0 -> '₹45.00 L'
    """
    if lakhs >= 100.0:
        cr = lakhs / 100.0
        return f"₹{cr:.2f} Cr"
    else:
        return f"₹{lakhs:.2f} L"

def format_indian_number(amount):
    """
    Formats a full integer amount to standard Indian comma notation: e.g. 18750000 -> "₹1,87,50,000"
    """
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
        "service": "PropPredict — Indian Urban House Price ML Service",
        "model_loaded": model_pipeline is not None,
        "version": "2.0.0"
    }), 200

@app.route('/model-info', methods=['GET'])
def model_info():
    if not metrics_data:
        return jsonify({"error": "Model metadata not available. Please train model first."}), 500
    
    best_model_name = metrics_data.get("best_model", "Gradient Boosting")
    best_perf = metrics_data.get("models_performance", {}).get(best_model_name, {})

    return jsonify({
        "dataset_name": metrics_data.get("dataset_name", "Indian Urban House Price Prediction Dataset"),
        "best_model": best_model_name,
        "total_records": metrics_data.get("total_records", 4000),
        "train_records": metrics_data.get("train_records", 3200),
        "test_records": metrics_data.get("test_records", 800),
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
        "property_types": metrics_data.get("property_types", []),
        "furnishing_statuses": metrics_data.get("furnishing_statuses", []),
        "gated_options": ["Yes", "No"],
        "ranges": {
            "bhk": {"min": 1, "max": 6, "default": 3},
            "bathrooms": {"min": 1, "max": 6, "default": 2},
            "area_sqft": {"min": 350, "max": 5500, "default": 1450},
            "floor_no": {"min": 0, "max": 40, "default": 5},
            "total_floors": {"min": 1, "max": 45, "default": 15},
            "property_age": {"min": 0, "max": 30, "default": 2},
            "parking_spaces": {"min": 0, "max": 3, "default": 1},
            "metro_distance_km": {"min": 0.2, "max": 15.0, "default": 1.2},
            "amenities_score": {"min": 1, "max": 10, "default": 8}
        }
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    if model_pipeline is None:
        return jsonify({"error": "Model pipeline is not loaded. Run train.py first."}), 500

    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No input payload provided"}), 400

        city = str(data.get("City", data.get("city", "Mumbai")))
        locality = str(data.get("Locality", data.get("locality", "Bandra West")))
        prop_type = str(data.get("Property_Type", data.get("property_type", "Apartment")))
        furnishing = str(data.get("Furnishing_Status", data.get("furnishing_status", "Semi-Furnished")))
        gated = str(data.get("Gated_Community", data.get("gated_community", "Yes")))

        bhk = int(data.get("BHK", data.get("bhk", 3)))
        bathrooms = int(data.get("Bathrooms", data.get("bathrooms", 2)))
        area_sqft = float(data.get("Area_SqFt", data.get("area_sqft", data.get("living_area_sqft", 1450))))
        floor_no = int(data.get("Floor_No", data.get("floor_no", 5)))
        total_floors = int(data.get("Total_Floors", data.get("total_floors", 15)))
        property_age = int(data.get("Property_Age", data.get("property_age", 2)))
        parking_spaces = int(data.get("Parking_Spaces", data.get("parking_spaces", 1)))
        metro_distance_km = float(data.get("Metro_Distance_KM", data.get("metro_distance_km", 1.2)))
        amenities_score = int(data.get("Amenities_Score", data.get("amenities_score", 8)))

        # Construct input DataFrame matching exact feature schema
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

        # Run prediction through Scikit-learn Pipeline
        pred_lakhs = float(model_pipeline.predict(input_df)[0])
        pred_lakhs = max(15.0, pred_lakhs) # Floor at minimum 15 Lakhs

        # Calculate exact INR values and rate per sq.ft
        exact_inr = round(pred_lakhs * 100000.0)
        rate_sqft = round(exact_inr / area_sqft) if area_sqft > 0 else 0

        best_model_name = metrics_data.get("best_model", "Gradient Boosting")
        best_r2 = metrics_data.get("models_performance", {}).get(best_model_name, {}).get("R2", 0.9614)
        best_mape = metrics_data.get("models_performance", {}).get(best_model_name, {}).get("MAPE", 13.15)

        # Feature factor contributions
        factor_explanations = [
            {
                "factor": "Built-Up Area",
                "value": f"{int(area_sqft):,} sq.ft",
                "impact": "Primary Size Driver",
                "description": f"Overall dimensions of {int(area_sqft):,} sq.ft govern baseline property scale."
            },
            {
                "factor": "City & Micro-Market",
                "value": f"{locality}, {city}",
                "impact": "High Geographic Impact",
                "description": f"Micro-market land rate for {locality} in {city} dictates square foot valuation."
            },
            {
                "factor": "Property Layout",
                "value": f"{bhk} BHK · {prop_type}",
                "impact": "Layout Tier",
                "description": f"Configuration matching {bhk} bedrooms and {bathrooms} bathrooms."
            },
            {
                "factor": "Vintage & Amenities",
                "value": f"{property_age} Yrs · Score {amenities_score}/10",
                "impact": "Amenities Multiplier",
                "description": f"Building age depreciation offset by gated society amenities and transit access."
            }
        ]

        response = {
            "predicted_price_lakhs": round(pred_lakhs, 2),
            "predicted_price_formatted": format_inr_lakhs_to_string(pred_lakhs),
            "price_inr_exact": exact_inr,
            "price_inr_formatted": format_indian_number(exact_inr),
            "rate_per_sqft": rate_sqft,
            "rate_per_sqft_formatted": f"{format_indian_number(rate_sqft)} / sq.ft",
            "model_used": best_model_name,
            "model_r2": best_r2,
            "model_mape": best_mape,
            "currency": "INR",
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
        print(f"[ERROR] /predict failed: {str(e)}", flush=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[SERVER] Starting PropPredict Flask API on http://localhost:{port}", flush=True)
    app.run(host='0.0.0.0', port=port, debug=False)
