import React, { useState } from 'react';
import { Sparkles, ArrowRight, Building2, Sliders, ChevronRight, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { SAMPLE_PROPERTIES } from '../data/sampleProperties';

export default function Home({ setActivePage, setPrefillData }) {
  // Quick predictor state
  const [quickCity, setQuickCity] = useState('Mumbai');
  const [quickLocality, setQuickLocality] = useState('Bandra West');
  const [quickBhk, setQuickBhk] = useState(3);
  const [quickType, setQuickType] = useState('Apartment');
  const [quickArea, setQuickArea] = useState(1450);

  // Filter state for explore properties
  const [selectedCity, setSelectedCity] = useState('All');

  const handleQuickEstimate = (e) => {
    e.preventDefault();
    setPrefillData({
      City: quickCity,
      Locality: quickLocality,
      BHK: Number(quickBhk),
      Property_Type: quickType,
      Area_SqFt: Number(quickArea),
      Bathrooms: Number(quickBhk) >= 3 ? 3 : 2,
    });
    setActivePage('predict');
  };

  const handlePredictProperty = (property) => {
    setPrefillData({
      City: property.city,
      Locality: property.locality,
      Property_Type: property.propertyType,
      BHK: property.bhk,
      Bathrooms: property.bathrooms,
      Area_SqFt: property.livingArea,
      Floor_No: property.floorNo,
      Total_Floors: property.totalFloors,
      Property_Age: property.age,
      Parking_Spaces: property.parking,
      Furnishing_Status: property.furnishing,
      Gated_Community: property.gated || "Yes",
      Metro_Distance_KM: property.metroDist,
      Amenities_Score: property.amenitiesScore,
    });
    setActivePage('predict');
  };

  const filteredProperties = selectedCity === 'All' 
    ? SAMPLE_PROPERTIES.slice(0, 6) 
    : SAMPLE_PROPERTIES.filter(p => p.city.toLowerCase() === selectedCity.toLowerCase());

  return (
    <div className="space-y-20 pb-16">
      
      {/* 1. CINEMATIC REAL ESTATE HERO SECTION */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto real-estate-hero-bg rounded-3xl border border-slate-800/80 shadow-2xl mt-4 overflow-hidden">
        
        {/* Architectural grid overlay */}
        <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-40"></div>

        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
          
          {/* Subtitle Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-300 backdrop-blur-md shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Real Estate Valuation for Indian Cities</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            KNOW THE VALUE <br />
            <span className="text-blue-500">BEFORE YOU BUY.</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed drop-shadow">
            AI-powered property valuation for India's urban real-estate market. Estimate property market values from location, super built-up area, layout, quality, and transit connectivity.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActivePage('predict')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Predict Property Price</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActivePage('properties')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 text-slate-100 font-semibold text-sm border border-slate-700/80 backdrop-blur-md transition-all"
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Explore Properties</span>
            </button>
          </div>

          {/* Metrics Summary Strip */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-md">
              <div className="text-xs text-slate-400 font-medium">Validation Accuracy</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">R² 0.9614</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-md">
              <div className="text-xs text-slate-400 font-medium">Winning Model</div>
              <div className="text-base font-bold text-blue-400 truncate">Gradient Boosting</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-md">
              <div className="text-xs text-slate-400 font-medium">Dataset Records</div>
              <div className="text-lg font-bold text-white font-mono">4,000 Verified</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-md">
              <div className="text-xs text-slate-400 font-medium">Major Metros</div>
              <div className="text-lg font-bold text-white font-mono">8 Metros</div>
            </div>
          </div>

        </div>

        {/* 2. QUICK PREDICTION FLOATING CARD */}
        <div className="mt-12 max-w-4xl mx-auto relative z-10">
          <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Quick Property Valuation</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Live ML Inference
              </span>
            </div>

            <form onSubmit={handleQuickEstimate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              
              {/* City */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">City</label>
                <select
                  value={quickCity}
                  onChange={(e) => {
                    const c = e.target.value;
                    setQuickCity(c);
                    if (c === "Mumbai") setQuickLocality("Bandra West");
                    else if (c === "Bangalore") setQuickLocality("Indiranagar");
                    else if (c === "Delhi NCR") setQuickLocality("Gurgaon Golf Course Rd");
                    else if (c === "Pune") setQuickLocality("Koregaon Park");
                    else if (c === "Hyderabad") setQuickLocality("HITEC City");
                    else if (c === "Chennai") setQuickLocality("Anna Nagar");
                    else if (c === "Kolkata") setQuickLocality("Salt Lake Sector V");
                    else if (c === "Ahmedabad") setQuickLocality("SG Highway");
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                </select>
              </div>

              {/* BHK */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Bedrooms</label>
                <select
                  value={quickBhk}
                  onChange={(e) => setQuickBhk(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4 BHK</option>
                  <option value="5">5+ BHK</option>
                </select>
              </div>

              {/* Property Type */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Property Type</label>
                <select
                  value={quickType}
                  onChange={(e) => setQuickType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Independent House">Independent House</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Studio">Studio</option>
                </select>
              </div>

              {/* Built-up Area */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Area (sq.ft)</label>
                <input
                  type="number"
                  min="300"
                  max="6000"
                  value={quickArea}
                  onChange={(e) => setQuickArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 1450"
                  required
                />
              </div>

              {/* Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Estimate Price</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </form>
          </div>
        </div>
      </section>

      {/* 3. EXPLORE PROPERTIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Featured Properties
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Select any listing to test how its characteristics are valued by the ML model.
            </p>
          </div>

          {/* City Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Mumbai', 'Bangalore', 'Delhi NCR', 'Ahmedabad', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata'].map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCity === city
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              onPredictSimilar={handlePredictProperty}
              onViewDetails={handlePredictProperty}
            />
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => setActivePage('properties')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
          >
            <span>View All Properties</span>
            <ChevronRight className="w-4 h-4 text-blue-400" />
          </button>
        </div>
      </section>

      {/* 4. SIMPLE HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="max-w-2xl mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              How PropPredict Estimates Value
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Our system utilizes trained regression algorithms to model real-world property prices in Indian Rupees based on key location and structural parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-blue-400 font-bold text-xs">Step 1</div>
              <h4 className="font-semibold text-sm text-white">Data Preprocessing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Normalizes numerical features (area, age, floor) and encodes Indian micro-markets via Scikit-Learn ColumnTransformer.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-blue-400 font-bold text-xs">Step 2</div>
              <h4 className="font-semibold text-sm text-white">Gradient Boosting Model</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies decision tree ensembles trained on 4,000 verified property records achieving an R² accuracy of 0.9614.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-blue-400 font-bold text-xs">Step 3</div>
              <h4 className="font-semibold text-sm text-white">Valuation & Factors</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Delivers immediate estimated pricing in Indian Rupees along with factor contributions explaining the valuation.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
