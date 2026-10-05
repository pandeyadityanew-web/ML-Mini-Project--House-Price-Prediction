import React from 'react';
import { Bed, Bath, Maximize2, MapPin, Sparkles, ArrowRight } from 'lucide-react';

export default function PropertyCard({ property, onPredictSimilar, onViewDetails }) {
  return (
    <div className="group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {property.tag && (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-600/90 text-white shadow-sm">
              {property.tag}
            </span>
          )}
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900/90 text-slate-300 border border-slate-700/60">
            {property.propertyType}
          </span>
        </div>

        {/* Price on Image Bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              {property.priceFormatted}
            </div>
            <div className="text-[11px] text-blue-300 font-medium">
              {property.rateSqft}
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {property.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>
          <h3 className="font-semibold text-base text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
            {property.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {property.description}
          </p>
        </div>

        {/* Key Property Specs */}
        <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5 text-blue-400" />
            <span>{property.bhk} BHK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-3.5 h-3.5 text-blue-400" />
            <span>{property.bathrooms} Bath</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{property.livingArea} sq.ft</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-1">
          <button
            onClick={() => onPredictSimilar && onPredictSimilar(property)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Estimate with AI</span>
          </button>
        </div>

      </div>
    </div>
  );
}
