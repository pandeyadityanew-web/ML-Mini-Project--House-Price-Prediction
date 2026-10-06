import React from 'react';
import { FileText, Rocket, ShieldAlert, CheckCircle2, Database } from 'lucide-react';

export default function About({ setActivePage }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          About PropPredict
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Indian Urban House Price Prediction platform driven by Scikit-Learn regression pipelines.
        </p>
      </div>

      {/* Problem & Objective */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Problem Statement</span>
          </div>
          <h3 className="text-lg font-bold text-white">Indian Real Estate Valuation</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            House prices across major Indian cities (Mumbai, Bangalore, Delhi NCR, Pune, Hyderabad, Chennai, Kolkata, Ahmedabad) depend on multiple non-linear factors including micro-market locations, living area, quality, building vintage, transit proximity, and society amenities.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Rocket className="w-4 h-4" />
            <span>Project Objective</span>
          </div>
          <h3 className="text-lg font-bold text-white">Supervised ML Regression Pipeline</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Develop an end-to-end Machine Learning regression system capable of estimating property prices in Indian Rupees (INR Lakhs) from structural characteristics, complete with leak-free preprocessing, multi-model comparison, and an interactive prediction interface.
          </p>
        </div>

      </div>

      {/* Dataset Overview */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
          <Database className="w-4 h-4" />
          <span>Dataset Details</span>
        </div>
        <h3 className="text-base font-bold text-white">Indian Urban House Price Dataset</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The model is trained on a structured dataset of <strong>5,000 property records</strong> across 8 major Indian metropolitan areas and 60+ micro-market localities. All features were audited for target leakage (dropping derived variables like <code className="text-blue-400">Price_per_SqFt</code>). The continuous target variable is <strong>Price_INR_Lakhs</strong>.
        </p>
      </div>

      {/* Practical Applications */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white">Practical Applications</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <strong className="text-white block font-semibold">Buyer Decision Support</strong>
            <p className="text-slate-400">Provides objective fair-market benchmarks before negotiating residential property purchases.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <strong className="text-white block font-semibold">Seller & Developer Benchmarking</strong>
            <p className="text-slate-400">Assists builders in pricing newly launched developments based on micro-market parameters.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <strong className="text-white block font-semibold">Mortgage & Loan Assessment</strong>
            <p className="text-slate-400">Supplies instant baseline estimates for collateral property evaluations.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <strong className="text-white block font-semibold">Portfolio Analytics</strong>
            <p className="text-slate-400">Helps investors compare valuation yields across metropolitan corridors.</p>
          </div>

        </div>
      </div>

      {/* Project Limitations */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          <span>Considerations & Limitations</span>
        </div>
        <h3 className="text-base font-bold text-white">Model Scope & Assumptions</h3>
        
        <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
          <li>
            Predictions are optimal within standard residential distributions (350 – 5,500 sq.ft, 1 – 6 BHK) across the represented 8 metropolitan clusters.
          </li>
          <li>
            Macro-economic interest rate changes, municipal rezoning, and stamp duty shifts are assumed constant relative to baseline training data.
          </li>
          <li>
            The model provides statistical estimates and is intended as a quantitative estimation tool rather than an official certified legal surveyor appraisal.
          </li>
        </ul>
      </div>

      {/* Future Scope */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-base font-bold text-white">Future Roadmap</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <strong className="text-white">Live GIS Mapping</strong>
            <p className="text-slate-400">Geospatial coordinates and transit API radius queries.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <strong className="text-white">Computer Vision</strong>
            <p className="text-slate-400">Automated interior luxury finish scoring from property photographs.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <strong className="text-white">Trend Forecasting</strong>
            <p className="text-slate-400">Time-series forecasting for projected 12-month appreciation.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
