import React, { useState, useMemo } from 'react';
import { Search, MapPin, X, Building2, Sparkles } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { SAMPLE_PROPERTIES } from '../data/sampleProperties';

export default function Properties({ setActivePage, setPrefillData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedBhk, setSelectedBhk] = useState('All');
  const [priceSort, setPriceSort] = useState('featured');

  const filteredProperties = useMemo(() => {
    return SAMPLE_PROPERTIES.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = (item.title || '').toLowerCase().includes(q) ||
                          (item.location || '').toLowerCase().includes(q) ||
                          (item.locality || '').toLowerCase().includes(q) ||
                          (item.city || '').toLowerCase().includes(q) ||
                          (item.description || '').toLowerCase().includes(q);
      
      const matchCity = selectedCity === 'All' || item.city.toLowerCase() === selectedCity.toLowerCase();
      const matchType = selectedType === 'All' || item.propertyType.toLowerCase() === selectedType.toLowerCase();
      const matchBhk = selectedBhk === 'All' || item.bhk === Number(selectedBhk);

      return matchSearch && matchCity && matchType && matchBhk;
    }).sort((a, b) => {
      if (priceSort === 'price-low') return (a.priceLakhs || 0) - (b.priceLakhs || 0);
      if (priceSort === 'price-high') return (b.priceLakhs || 0) - (a.priceLakhs || 0);
      if (priceSort === 'area-high') return (b.livingArea || 0) - (a.livingArea || 0);
      return 0;
    });
  }, [searchQuery, selectedCity, selectedType, selectedBhk, priceSort]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Explore Properties
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Browse verified residential listings across India's top urban markets. Click any property to test its parameters in our valuation model.
        </p>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by locality (e.g. Kandivali, Bandra, Thane, Bopal, Whitefield), title or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          
          <div>
            <label className="block text-slate-400 mb-1">City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Pune">Pune</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
              <option value="Kolkata">Kolkata</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Property Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Penthouse">Penthouse</option>
              <option value="Independent House">Independent House</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Bedrooms</label>
            <select
              value={selectedBhk}
              onChange={(e) => setSelectedBhk(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">Any BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
              <option value="5">5+ BHK</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Sort By</label>
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="area-high">Area: Largest First</option>
            </select>
          </div>

        </div>

      </div>

      {/* Property Cards Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              onPredictSimilar={handlePredictProperty}
            />
          ))}
        </div>
      ) : (
        <div className="p-10 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
          <p className="text-sm text-slate-300">No properties matched your search filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCity('All');
              setSelectedType('All');
              setSelectedBhk('All');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-blue-400 text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}

    </div>
  );
}
