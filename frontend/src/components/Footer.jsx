import React from 'react';
import { Building2, Database, BrainCircuit, ShieldCheck } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="border-t border-slate-800 bg-[#080d1a] text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-white">
                Prop<span className="text-blue-500">Predict</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              “Predict the value of your next property with Machine Learning.” An intuitive property valuation platform driven by regression models.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActivePage('home')} className="hover:text-blue-400 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('predict')} className="hover:text-blue-400 transition-colors">
                  Predict Price
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('properties')} className="hover:text-blue-400 transition-colors">
                  Properties
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('model')} className="hover:text-blue-400 transition-colors">
                  The Model
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('about')} className="hover:text-blue-400 transition-colors">
                  About
                </button>
              </li>
            </ul>
          </div>

          {/* Tech Overview */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3">Model Details</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>3,600 Dataset Samples</span>
              </li>
              <li className="flex items-center gap-2">
                <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gradient Boosting Model</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>R² Score: 0.9527 (95.3%)</span>
              </li>
            </ul>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-200">Disclaimer</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Estimations are based on statistical market trends and machine-learning models. They provide approximate guidance rather than official certified appraisals.
            </p>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 PropPredict. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>React</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Python Flask</span>
            <span>•</span>
            <span>Scikit-Learn</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
