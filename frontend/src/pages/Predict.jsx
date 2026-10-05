import React, { useState, useEffect } from 'react';
import { Calculator, AlertCircle, Building, MapPin, Layers, Award, Check, Copy, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { predictPrice, fetchFeaturesSchema } from '../services/api';

const DEFAULT_CITY_LOCALITIES = {
  "Mumbai": ["Bandra West", "Worli", "Andheri East", "Juhu", "Thane West", "Navi Mumbai (Vashi)"],
  "Bangalore": ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Electronic City", "Hebbal"],
  "Delhi NCR": ["Gurgaon Golf Course Rd", "Gurgaon Cyber City", "South Extension", "Vasant Kunj", "Noida Sector 62", "Noida Expressway"],
  "Pune": ["Koregaon Park", "Kalyani Nagar", "Baner", "Hinjewadi", "Wakad"],
  "Hyderabad": ["Jubilee Hills", "Banjara Hills", "HITEC City", "Gachibowli", "Madhapur"],
  "Chennai": ["Anna Nagar", "Adyar", "Boat Club Road", "OMR IT Corridor", "Velachery"],
  "Kolkata": ["Park Street", "Ballygunge", "Salt Lake Sector V", "New Town", "Alipore"],
  "Ahmedabad": ["SG Highway", "Bodakdev", "Prahlad Nagar", "Satellite", "Bopal"]
};

export default function Predict({ prefillData, setActivePage }) {
  const [schema, setSchema] = useState(null);

  // Form State initialized with realistic defaults matching exact dataset features
  const [formData, setFormData] = useState({
    City: "Mumbai",
    Locality: "Bandra West",
    Property_Type: "Apartment",
    BHK: 3,
    Bathrooms: 2,
    Area_SqFt: 1450,
    Floor_No: 7,
    Total_Floors: 18,
    Property_Age: 3,
    Furnishing_Status: "Semi-Furnished",
    Parking_Spaces: 1,
    Gated_Community: "Yes",
    Metro_Distance_KM: 1.2,
    Amenities_Score: 8
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Apply prefill data when redirected from other pages
  useEffect(() => {
    if (prefillData && Object.keys(prefillData).length > 0) {
      setFormData(prev => ({
        ...prev,
        City: prefillData.City || prefillData.city || prev.City,
        Locality: prefillData.Locality || prefillData.locality || prev.Locality,
        Property_Type: prefillData.Property_Type || prefillData.property_type || prev.Property_Type,
        BHK: Number(prefillData.BHK || prefillData.bhk || prev.BHK),
        Bathrooms: Number(prefillData.Bathrooms || prefillData.bathrooms || prev.Bathrooms),
        Area_SqFt: Number(prefillData.Area_SqFt || prefillData.area_sqft || prefillData.living_area_sqft || prev.Area_SqFt),
        Floor_No: Number(prefillData.Floor_No || prefillData.floor_no || prev.Floor_No),
        Total_Floors: Number(prefillData.Total_Floors || prefillData.total_floors || prev.Total_Floors),
        Property_Age: Number(prefillData.Property_Age || prefillData.property_age || prev.Property_Age),
        Furnishing_Status: prefillData.Furnishing_Status || prefillData.furnishing_status || prev.Furnishing_Status,
        Parking_Spaces: Number(prefillData.Parking_Spaces || prefillData.parking_spaces || prev.Parking_Spaces),
        Gated_Community: prefillData.Gated_Community || prefillData.gated || prev.Gated_Community,
        Metro_Distance_KM: Number(prefillData.Metro_Distance_KM || prefillData.metro_dist || prev.Metro_Distance_KM),
        Amenities_Score: Number(prefillData.Amenities_Score || prefillData.amenities_score || prev.Amenities_Score)
      }));
    }
  }, [prefillData]);

  // Fetch schema dynamically from backend
  useEffect(() => {
    fetchFeaturesSchema()
      .then(data => setSchema(data))
      .catch(err => console.warn('Schema fetch warning:', err));
  }, []);

  const cityLocalitiesMap = schema?.city_localities || DEFAULT_CITY_LOCALITIES;
  const citiesList = schema?.cities || Object.keys(cityLocalitiesMap);
  const availableLocalities = cityLocalitiesMap[formData.City] || [];

  const handleCityChange = (newCity) => {
    const locs = cityLocalitiesMap[newCity] || [];
    setFormData(prev => ({
      ...prev,
      City: newCity,
      Locality: locs.length > 0 ? locs[0] : ""
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await predictPrice(formData);
      setResult(response);
      setTimeout(() => {
        const resEl = document.getElementById('prediction-result-card');
        if (resEl) {
          resEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      setError(err.message || 'Failed to predict price. Make sure the Python backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `PropPredict Valuation: ${result.predicted_price_formatted} (${result.price_inr_formatted}) - ${result.rate_per_sqft_formatted} | Model: ${result.model_used}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick Presets
  const applyPreset = (presetName) => {
    if (presetName === 'mumbai-luxury') {
      setFormData({
        City: "Mumbai",
        Locality: "Worli",
        Property_Type: "Apartment",
        BHK: 4,
        Bathrooms: 4,
        Area_SqFt: 2200,
        Floor_No: 24,
        Total_Floors: 35,
        Property_Age: 1,
        Furnishing_Status: "Furnished",
        Parking_Spaces: 2,
        Gated_Community: "Yes",
        Metro_Distance_KM: 0.8,
        Amenities_Score: 9
      });
    } else if (presetName === 'bangalore-villa') {
      setFormData({
        City: "Bangalore",
        Locality: "Indiranagar",
        Property_Type: "Villa",
        BHK: 4,
        Bathrooms: 4,
        Area_SqFt: 2800,
        Floor_No: 0,
        Total_Floors: 2,
        Property_Age: 2,
        Furnishing_Status: "Semi-Furnished",
        Parking_Spaces: 2,
        Gated_Community: "Yes",
        Metro_Distance_KM: 1.0,
        Amenities_Score: 9
      });
    } else if (presetName === 'pune-tech') {
      setFormData({
        City: "Pune",
        Locality: "Hinjewadi",
        Property_Type: "Apartment",
        BHK: 2,
        Bathrooms: 2,
        Area_SqFt: 1100,
        Floor_No: 6,
        Total_Floors: 14,
        Property_Age: 3,
        Furnishing_Status: "Semi-Furnished",
        Parking_Spaces: 1,
        Gated_Community: "Yes",
        Metro_Distance_KM: 1.5,
        Amenities_Score: 7
      });
    } else if (presetName === 'delhi-penthouse') {
      setFormData({
        City: "Delhi NCR",
        Locality: "Gurgaon Golf Course Rd",
        Property_Type: "Penthouse",
        BHK: 5,
        Bathrooms: 5,
        Area_SqFt: 3500,
        Floor_No: 30,
        Total_Floors: 32,
        Property_Age: 1,
        Furnishing_Status: "Furnished",
        Parking_Spaces: 3,
        Gated_Community: "Yes",
        Metro_Distance_KM: 0.6,
        Amenities_Score: 10
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Property Value Estimator
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          “Enter the property characteristics and let our machine-learning model estimate its market value.”
        </p>

        {/* Quick Presets Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs">
          <span className="text-slate-400">Quick Test Scenarios:</span>
          <button
            type="button"
            onClick={() => applyPreset('mumbai-luxury')}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Mumbai Worli 4BHK
          </button>
          <button
            type="button"
            onClick={() => applyPreset('delhi-penthouse')}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Gurgaon Penthouse
          </button>
          <button
            type="button"
            onClick={() => applyPreset('bangalore-villa')}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Bangalore Villa
          </button>
          <button
            type="button"
            onClick={() => applyPreset('pune-tech')}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Pune 2BHK
          </button>
        </div>
      </div>

      {/* Main Grid: Form on Left, Output / Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handlePredict} className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            
            {/* Section 1: Property Location & Format */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
                <MapPin className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wider">1. Location & Property Format</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    City <span className="text-blue-400">*</span>
                  </label>
                  <select
                    value={formData.City}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                    required
                  >
                    {citiesList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Locality */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Locality / Micro-Market <span className="text-blue-400">*</span>
                  </label>
                  <select
                    value={formData.Locality}
                    onChange={(e) => handleChange('Locality', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                    required
                  >
                    {availableLocalities.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Property Type */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Property Type</label>
                  <select
                    value={formData.Property_Type}
                    onChange={(e) => handleChange('Property_Type', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Independent House">Independent House</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Studio">Studio</option>
                  </select>
                </div>

                {/* Furnishing Status */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Furnishing</label>
                  <select
                    value={formData.Furnishing_Status}
                    onChange={(e) => handleChange('Furnishing_Status', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Furnished">Furnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Section 2: Spatial Layout */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
                <Building className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wider">2. Area & Dimensions</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Built-up / Area */}
                <div className="sm:col-span-3 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-slate-300">Built-Up Area</label>
                    <span className="font-mono text-blue-400 font-bold">
                      {formData.Area_SqFt.toLocaleString()} sq.ft
                    </span>
                  </div>
                  <input
                    type="range"
                    min="350"
                    max="5500"
                    step="25"
                    value={formData.Area_SqFt}
                    onChange={(e) => handleChange('Area_SqFt', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>350 sq.ft</span>
                    <span>2,500 sq.ft</span>
                    <span>5,500 sq.ft</span>
                  </div>
                </div>

                {/* BHK */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Bedrooms (BHK)</label>
                  <select
                    value={formData.BHK}
                    onChange={(e) => handleChange('BHK', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} BHK</option>
                    ))}
                  </select>
                </div>

                {/* Bathrooms */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Bathrooms</label>
                  <select
                    value={formData.Bathrooms}
                    onChange={(e) => handleChange('Bathrooms', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} Bath</option>
                    ))}
                  </select>
                </div>

                {/* Gated Community */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Gated Society</label>
                  <select
                    value={formData.Gated_Community}
                    onChange={(e) => handleChange('Gated_Community', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Yes">Yes (Gated)</option>
                    <option value="No">No (Standalone)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Section 3: Elevation, Parking & Age */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
                <Layers className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wider">3. Floor Level & Vintage</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Floor No</label>
                  <input
                    type="number"
                    min="0"
                    max="45"
                    value={formData.Floor_No}
                    onChange={(e) => handleChange('Floor_No', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Total Floors</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.Total_Floors}
                    onChange={(e) => handleChange('Total_Floors', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.Property_Age}
                    onChange={(e) => handleChange('Property_Age', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Parking Slots</label>
                  <select
                    value={formData.Parking_Spaces}
                    onChange={(e) => handleChange('Parking_Spaces', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {[0, 1, 2, 3].map(n => (
                      <option key={n} value={n}>{n} Car Slot{n === 1 ? '' : 's'}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* Section 4: Amenities & Transit */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
                <Award className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wider">4. Amenities & Connectivity</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Amenities Score (1 - 10)
                  </label>
                  <select
                    value={formData.Amenities_Score}
                    onChange={(e) => handleChange('Amenities_Score', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="10">10 / 10 (Full Luxury Club & Pool)</option>
                    <option value="8">8 / 10 (Gated Club House & Gym)</option>
                    <option value="6">6 / 10 (Standard Security & Lift)</option>
                    <option value="4">4 / 10 (Basic Facilities)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Distance to Metro Station (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="15.0"
                    value={formData.Metro_Distance_KM}
                    onChange={(e) => handleChange('Metro_Distance_KM', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Model Prediction...</span>
                </>
              ) : (
                <>
                  <span>Predict Property Value</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Output Column (5 cols) */}
        <div className="lg:col-span-5" id="prediction-result-card">
          
          {result ? (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-blue-500/40 shadow-lg space-y-5">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  ML Valuation Complete
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Main Estimated Value */}
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Estimated Property Value
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white">
                  {result.predicted_price_formatted}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Exact: <span className="text-slate-200">{result.price_inr_formatted}</span> ({result.predicted_price_lakhs} Lakhs)
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-800">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Price / Sq.Ft</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {result.rate_per_sqft_formatted}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Deployed Model</div>
                  <div className="text-xs font-semibold text-emerald-400 truncate mt-0.5">
                    {result.model_used}
                  </div>
                </div>
              </div>

              {/* Model Accuracy & Test Error Note (No fake confidence interval) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Model Validation Performance</span>
                  </span>
                  <span className="font-mono text-emerald-400">R² = {result.model_r2}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Test-Set Mean Error (MAPE):</span>
                  <span className="font-mono text-slate-200">{result.model_mape}%</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
                  Estimated based on 80/20 held-out evaluation of Indian urban market property records.
                </p>
              </div>

              {/* Factors Influencing Valuation */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Important Valuation Factors
                </div>

                <div className="space-y-1.5">
                  {result.feature_impacts && result.feature_impacts.map((factor, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200">{factor.factor}</span>
                        <span className="text-[11px] text-blue-400">{factor.impact}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{factor.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setActivePage('model')}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition-colors"
                >
                  View Model R² & Performance
                </button>
                <button
                  onClick={() => setActivePage('properties')}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold text-center transition-colors"
                >
                  Browse Similar Properties
                </button>
              </div>

            </div>
          ) : (
            /* Blank state */
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Ready for Estimation</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Fill in the property details on the left and click <strong className="text-slate-200">“Predict Property Value”</strong>.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Model Engine:</span>
                  <span className="text-slate-200 font-semibold">Gradient Boosting</span>
                </div>
                <div className="flex justify-between">
                  <span>Test Set R²:</span>
                  <span className="text-emerald-400 font-semibold">0.9614</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Variable:</span>
                  <span className="text-slate-200 font-mono">Price_INR_Lakhs</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
