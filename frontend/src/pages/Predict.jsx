import React, { useState, useEffect, useRef } from 'react';
import { Calculator, AlertCircle, Building, MapPin, Layers, Award, Check, Copy, RefreshCw, ArrowRight, ShieldCheck, Sparkles, TrendingUp, Info } from 'lucide-react';
import { predictPrice, fetchFeaturesSchema } from '../services/api';

const DEFAULT_CITY_LOCALITIES = {
  "Mumbai": [
    "Kandivali West", "Kandivali East", "Thane West", "Thane (Ghodbunder Rd)",
    "Bandra West", "Bandra East", "Borivali West", "Malad West", "Goregaon East",
    "Andheri West", "Andheri East", "Powai", "Worli", "Dadar",
    "Navi Mumbai (Vashi)", "Navi Mumbai (Kharghar)"
  ],
  "Bangalore": [
    "Electronic City", "Sarjapur Road", "Whitefield", "Yelahanka",
    "Kanakapura Road", "Marathahalli", "BTM Layout", "HSR Layout",
    "Indiranagar", "Koramangala", "Hebbal", "Bannerghatta Road"
  ],
  "Delhi NCR": [
    "Noida Extension (Greater Noida W)", "Noida Sector 137", "Noida Sector 62", "Noida Expressway",
    "Gurgaon Sector 48 (Sohna Rd)", "Gurgaon Sector 82 (New Gurgaon)", "Gurgaon Cyber City",
    "Gurgaon Golf Course Rd", "Dwarka (Delhi)", "Janakpuri (Delhi)", "Rohini (Delhi)", "South Extension"
  ],
  "Ahmedabad": [
    "Bopal", "South Bopal (SoBo)", "Gota", "Chandkheda", "Nikol",
    "Vastrapur", "Satellite", "Prahlad Nagar", "SG Highway", "Bodakdev", "Maninagar"
  ],
  "Pune": [
    "Hinjewadi", "Wakad", "Hadapsar", "Kharadi", "Baner",
    "Pimple Saudagar", "Kothrud", "Viman Nagar", "Koregaon Park", "Kalyani Nagar"
  ],
  "Hyderabad": [
    "Jubilee Hills", "Banjara Hills", "HITEC City", "Gachibowli",
    "Madhapur", "Kondapur", "Kukatpally", "Miyapur"
  ],
  "Chennai": [
    "Anna Nagar", "Adyar", "Boat Club Road", "OMR IT Corridor",
    "Velachery", "Porur", "Tambaram", "T Nagar"
  ],
  "Kolkata": [
    "Park Street", "Ballygunge", "Salt Lake Sector V", "New Town",
    "Alipore", "Rajarhat", "Behala", "Jadavpur"
  ]
};

export default function Predict({ prefillData, setActivePage }) {
  const [schema, setSchema] = useState(null);

  // Form State initialized with defaults
  const [formData, setFormData] = useState({
    City: "Mumbai",
    Locality: "Kandivali West",
    Property_Type: "Apartment",
    BHK: 2,
    Bathrooms: 2,
    Area_SqFt: 1050,
    Floor_No: 8,
    Total_Floors: 20,
    Property_Age: 2,
    Furnishing_Status: "Semi-Furnished",
    Parking_Spaces: 1,
    Gated_Community: "Yes",
    Metro_Distance_KM: 0.8,
    Amenities_Score: 8
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const isInitialMount = useRef(true);

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
      .then(data => {
        if (data && data.city_localities) {
          setSchema(data);
        }
      })
      .catch(err => console.warn('Schema fetch warning:', err));
  }, []);

  const cityLocalitiesMap = schema?.city_localities || DEFAULT_CITY_LOCALITIES;
  const citiesList = schema?.cities || Object.keys(cityLocalitiesMap);
  const availableLocalities = cityLocalitiesMap[formData.City] || DEFAULT_CITY_LOCALITIES[formData.City] || [];

  // Live Auto-Calculation whenever formData changes
  useEffect(() => {
    let cancel = false;
    const timer = setTimeout(async () => {
      try {
        const response = await predictPrice(formData);
        if (!cancel) {
          setResult(response);
          setError(null);
        }
      } catch (err) {
        if (!cancel) setError(err.message);
      }
    }, isInitialMount.current ? 0 : 150);

    isInitialMount.current = false;
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [formData]);

  const handleCityChange = (newCity) => {
    const locs = cityLocalitiesMap[newCity] || DEFAULT_CITY_LOCALITIES[newCity] || [];
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

  const handlePredictManual = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await predictPrice(formData);
      setResult(response);
      const resEl = document.getElementById('prediction-result-card');
      if (resEl) {
        resEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      setError(err.message || 'Failed to predict price. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `PropPredict Valuation: ${result.predicted_price_formatted} (${result.price_inr_formatted || `₹${result.predicted_price_lakhs} Lakhs`}) - ${result.rate_per_sqft_formatted} | Model: ${result.model_used}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick Presets
  const applyPreset = (presetName) => {
    if (presetName === 'mumbai-kandivali') {
      setFormData({
        City: "Mumbai",
        Locality: "Kandivali West",
        Property_Type: "Apartment",
        BHK: 2,
        Bathrooms: 2,
        Area_SqFt: 1000,
        Floor_No: 9,
        Total_Floors: 22,
        Property_Age: 2,
        Furnishing_Status: "Semi-Furnished",
        Parking_Spaces: 1,
        Gated_Community: "Yes",
        Metro_Distance_KM: 0.6,
        Amenities_Score: 8
      });
    } else if (presetName === 'mumbai-bandra') {
      setFormData({
        City: "Mumbai",
        Locality: "Bandra West",
        Property_Type: "Apartment",
        BHK: 3,
        Bathrooms: 3,
        Area_SqFt: 1450,
        Floor_No: 14,
        Total_Floors: 24,
        Property_Age: 2,
        Furnishing_Status: "Semi-Furnished",
        Parking_Spaces: 2,
        Gated_Community: "Yes",
        Metro_Distance_KM: 0.8,
        Amenities_Score: 9
      });
    } else if (presetName === 'mumbai-thane') {
      setFormData({
        City: "Mumbai",
        Locality: "Thane (Ghodbunder Rd)",
        Property_Type: "Apartment",
        BHK: 1,
        Bathrooms: 1,
        Area_SqFt: 750,
        Floor_No: 7,
        Total_Floors: 18,
        Property_Age: 1,
        Furnishing_Status: "Semi-Furnished",
        Parking_Spaces: 1,
        Gated_Community: "Yes",
        Metro_Distance_KM: 2.2,
        Amenities_Score: 7
      });
    } else if (presetName === 'bangalore-ecity') {
      setFormData({
        City: "Bangalore",
        Locality: "Electronic City",
        Property_Type: "Apartment",
        BHK: 2,
        Bathrooms: 2,
        Area_SqFt: 850,
        Floor_No: 4,
        Total_Floors: 12,
        Property_Age: 2,
        Furnishing_Status: "Semi-Furnished",
        Parking_Spaces: 1,
        Gated_Community: "Yes",
        Metro_Distance_KM: 0.9,
        Amenities_Score: 7
      });
    } else if (presetName === 'delhi-noida') {
      setFormData({
        City: "Delhi NCR",
        Locality: "Noida Extension (Greater Noida W)",
        Property_Type: "Apartment",
        BHK: 2,
        Bathrooms: 2,
        Area_SqFt: 950,
        Floor_No: 6,
        Total_Floors: 19,
        Property_Age: 3,
        Furnishing_Status: "Semi-Furnished",
        Parking_Spaces: 1,
        Gated_Community: "Yes",
        Metro_Distance_KM: 2.8,
        Amenities_Score: 7
      });
    } else if (presetName === 'ahmedabad-bopal') {
      setFormData({
        City: "Ahmedabad",
        Locality: "Bopal",
        Property_Type: "Apartment",
        BHK: 2,
        Bathrooms: 2,
        Area_SqFt: 1000,
        Floor_No: 5,
        Total_Floors: 14,
        Property_Age: 2,
        Furnishing_Status: "Semi-Furnished",
        Parking_Spaces: 1,
        Gated_Community: "Yes",
        Metro_Distance_KM: 2.5,
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
        Floor_No: 32,
        Total_Floors: 34,
        Property_Age: 1,
        Furnishing_Status: "Furnished",
        Parking_Spaces: 3,
        Gated_Community: "Yes",
        Metro_Distance_KM: 1.2,
        Amenities_Score: 10
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl real-estate-predict-bg border border-slate-800 shadow-2xl relative overflow-hidden text-center space-y-3">
        <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-20"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Valuation Engine — 5,000 Records Model</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Property Value Estimator
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            “Select Indian micro-markets, spatial specifications, and transit access for instantaneous ML valuation.”
          </p>

          {/* Quick Presets Bar */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Quick Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('mumbai-kandivali')}
              className="px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs transition-colors"
            >
              Mumbai Kandivali 2BHK
            </button>
            <button
              type="button"
              onClick={() => applyPreset('mumbai-thane')}
              className="px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs transition-colors"
            >
              Thane 1BHK (₹68L)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('bangalore-ecity')}
              className="px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs transition-colors"
            >
              Bangalore E-City (₹48L)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('delhi-noida')}
              className="px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs transition-colors"
            >
              Noida Ext (₹45L)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('ahmedabad-bopal')}
              className="px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs transition-colors"
            >
              Ahmedabad Bopal (₹48L)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('mumbai-bandra')}
              className="px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs transition-colors"
            >
              Bandra West 3BHK
            </button>
            <button
              type="button"
              onClick={() => applyPreset('delhi-penthouse')}
              className="px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs transition-colors"
            >
              Gurgaon Penthouse
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, Output / Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handlePredictManual} className="p-5 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-6">
            
            {/* Section 1: Property Location & Format */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
                <MapPin className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wider">1. Location & Property Format</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    City <span className="text-blue-400">*</span>
                  </label>
                  <select
                    value={formData.City}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                    required
                  >
                    {citiesList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Locality */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    Locality / Micro-Market <span className="text-blue-400">*</span>
                  </label>
                  <select
                    value={formData.Locality}
                    onChange={(e) => handleChange('Locality', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                    required
                  >
                    {availableLocalities.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Property Type */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Property Type</label>
                  <select
                    value={formData.Property_Type}
                    onChange={(e) => handleChange('Property_Type', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
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
                  <label className="text-xs text-slate-300 font-medium">Furnishing</label>
                  <select
                    value={formData.Furnishing_Status}
                    onChange={(e) => handleChange('Furnishing_Status', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
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
                <h3 className="font-semibold text-xs uppercase tracking-wider">2. Area & Spatial Dimensions</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Built-up / Area */}
                <div className="sm:col-span-3 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-slate-300 font-medium">Built-Up Area</label>
                    <span className="font-mono text-blue-400 font-bold text-sm">
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
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>350 sq.ft (Compact)</span>
                    <span>1,500 sq.ft (Standard 3BHK)</span>
                    <span>5,500 sq.ft (Penthouse/Villa)</span>
                  </div>
                </div>

                {/* BHK */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Bedrooms (BHK)</label>
                  <select
                    value={formData.BHK}
                    onChange={(e) => handleChange('BHK', Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} BHK</option>
                    ))}
                  </select>
                </div>

                {/* Bathrooms */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Bathrooms</label>
                  <select
                    value={formData.Bathrooms}
                    onChange={(e) => handleChange('Bathrooms', Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} Bath</option>
                    ))}
                  </select>
                </div>

                {/* Gated Community */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Gated Society</label>
                  <select
                    value={formData.Gated_Community}
                    onChange={(e) => handleChange('Gated_Community', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Yes">Yes (Gated Community)</option>
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
                  <label className="text-xs text-slate-300 font-medium">Floor No</label>
                  <input
                    type="number"
                    min="0"
                    max="45"
                    value={formData.Floor_No}
                    onChange={(e) => handleChange('Floor_No', Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Total Floors</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.Total_Floors}
                    onChange={(e) => handleChange('Total_Floors', Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.Property_Age}
                    onChange={(e) => handleChange('Property_Age', Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Parking Slots</label>
                  <select
                    value={formData.Parking_Spaces}
                    onChange={(e) => handleChange('Parking_Spaces', Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
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
                  <label className="text-xs text-slate-300 font-medium">
                    Amenities Score (1 - 10)
                  </label>
                  <select
                    value={formData.Amenities_Score}
                    onChange={(e) => handleChange('Amenities_Score', Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="10">10 / 10 (Full Luxury Club & Pool)</option>
                    <option value="8">8 / 10 (Gated Club House & Gym)</option>
                    <option value="6">6 / 10 (Standard Security & Lift)</option>
                    <option value="4">4 / 10 (Basic Facilities)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    Distance to Metro Station (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="15.0"
                    value={formData.Metro_Distance_KM}
                    onChange={(e) => handleChange('Metro_Distance_KM', Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
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
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calculating Model Valuation...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>Recalculate Valuation Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        </div>

        {/* Output Column (5 cols) */}
        <div className="lg:col-span-5" id="prediction-result-card">
          
          {result ? (
            <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/95 border border-blue-500/50 shadow-2xl backdrop-blur-xl space-y-5">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  ML Valuation Live
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Valuation'}</span>
                </button>
              </div>

              {/* Main Estimated Value */}
              <div className="space-y-1 bg-gradient-to-br from-blue-950/40 to-slate-950 p-4 rounded-xl border border-blue-500/20">
                <div className="text-xs uppercase tracking-wider text-blue-300 font-medium">
                  Estimated Market Value
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {result.predicted_price_formatted}
                </div>
                <div className="text-xs text-slate-300 font-mono pt-1">
                  Exact: <span className="text-white font-bold">{result.price_inr_formatted || `₹${(result.predicted_price_lakhs * 100000).toLocaleString('en-IN')}`}</span> ({result.predicted_price_lakhs} Lakhs)
                </div>
                {result.price_range && (
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex justify-between">
                    <span>Expected Market Range:</span>
                    <span className="text-slate-200 font-medium">
                      {result.price_range.low_formatted} – {result.price_range.high_formatted}
                    </span>
                  </div>
                )}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2 py-1">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Effective Rate</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {result.rate_per_sqft_formatted}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Evaluated Model</div>
                  <div className="text-xs font-semibold text-emerald-400 truncate mt-0.5">
                    {result.model_used || "Gradient Boosting Regressor"}
                  </div>
                </div>
              </div>

              {/* Model Accuracy & Test Error Note */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Model Validation Performance</span>
                  </span>
                  <span className="font-mono text-emerald-400">R² = {result.model_r2 || "0.9383"}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Test-Set Mean Absolute Error (MAPE):</span>
                  <span className="font-mono text-slate-200">{result.model_mape || "17.10"}%</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
                  Trained on 5,000 verified Indian urban real estate records with 80/20 train/test holdout validation.
                </p>
              </div>

              {/* Factors Influencing Valuation */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>Key Valuation Drivers</span>
                </div>

                <div className="space-y-1.5">
                  {result.feature_impacts ? (
                    result.feature_impacts.map((factor, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-200">{factor.factor}</span>
                          <span className="text-[11px] text-blue-400">{factor.impact}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{factor.description}</div>
                      </div>
                    ))
                  ) : result.feature_contributions ? (
                    Object.entries(result.feature_contributions).map(([key, val], idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex justify-between items-center">
                        <span className="font-medium text-slate-300">{key}</span>
                        <span className="text-[11px] text-blue-300 font-mono">{val}</span>
                      </div>
                    ))
                  ) : null}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivePage('model')}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition-colors"
                >
                  View ML Metrics
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage('properties')}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold text-center transition-colors"
                >
                  Browse Homes
                </button>
              </div>

            </div>
          ) : (
            /* Loading / Blank state */
            <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-3 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Estimating Valuation...</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                The ML model is computing live predictions for the selected property features.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
