import React from 'react';
import {
  Info,
  Code2,
  Cpu,
  Boxes,
  Database,
  ShieldCheck,
  Award,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Hero Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-navy-950 via-surface-card to-navy-950 border border-brand-cyan/30 shadow-2xl space-y-3">
        <div className="flex items-center space-x-2 text-brand-cyan text-xs font-mono font-semibold uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>Technical Architecture & Recruiter Briefing</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          DemandPulse Platform Overview
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          DemandPulse is a production-grade retail demand forecasting and inventory intelligence platform. Built from scratch with an emphasis on mathematical correctness, statistical explainability, and real-time interactive decision support.
        </p>
      </div>

      {/* Core Architectural Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border space-y-2.5">
          <div className="flex items-center space-x-2 text-brand-cyan">
            <Cpu className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">Time-Series & ML Forecasting</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Implements 5 distinct model families ranging from statistical baselines (Seasonal Naive, 14-day Moving Average) to classic econometric time-series (ARIMA, Holt-Winters Exponential Smoothing) and gradient-boosted decision trees (XGBoost). All feature engineering operates strictly in the past, eliminating lookahead bias.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-surface-card border border-surface-border space-y-2.5">
          <div className="flex items-center space-x-2 text-brand-emerald">
            <Boxes className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">Statistical Inventory Intelligence</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Translates sales forecasts into actionable supply chain planning. Automatically computes Safety Stock (Z × σ × √L), dynamic Reorder Points (ROP), Days of Inventory Remaining (DOIR), and replenishment order quantities calibrated to target service levels (85%–99%).
          </p>
        </div>

        <div className="p-5 rounded-xl bg-surface-card border border-surface-border space-y-2.5">
          <div className="flex items-center space-x-2 text-brand-purple">
            <Award className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">Walk-Forward Model Validation</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Rejects random train/test splits that cause data leakage in autocorrelated retail series. Evaluates all models chronologically on out-of-sample holdout windows using standardized metrics: WAPE (Weighted Absolute Percentage Error), MAE, RMSE, MAPE, and R².
          </p>
        </div>

        <div className="p-5 rounded-xl bg-surface-card border border-surface-border space-y-2.5">
          <div className="flex items-center space-x-2 text-brand-blue">
            <Layers className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">Single-Service Deployment</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Engineered for cost-effective deployment on Render as a single web service. The React 18 production build is served directly through FastAPI static mounting with SPA fallback, eliminating CORS issues and multi-service hosting overhead.
          </p>
        </div>
      </div>

      {/* Technology Stack Table */}
      <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-brand-cyan" />
          <span>Technology Stack Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-navy-900 border border-surface-border space-y-2">
            <h4 className="font-semibold text-brand-cyan uppercase tracking-wider text-[11px]">Backend & APIs</h4>
            <ul className="text-slate-300 space-y-1">
              <li>• Python 3.11+ / 3.14</li>
              <li>• FastAPI (High performance ASGI)</li>
              <li>• Uvicorn (ASGI web server)</li>
              <li>• Pydantic v2 (Strict Schema validation)</li>
              <li>• Thread-safe In-Memory Caching</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-navy-900 border border-surface-border space-y-2">
            <h4 className="font-semibold text-brand-emerald uppercase tracking-wider text-[11px]">Data Science & ML</h4>
            <ul className="text-slate-300 space-y-1">
              <li>• Pandas & NumPy (Data processing)</li>
              <li>• Statsmodels (ARIMA, Decomposition, ADF)</li>
              <li>• XGBoost (Gradient-boosted forecaster)</li>
              <li>• Scikit-learn (Holdout evaluation metrics)</li>
              <li>• Joblib & Python-Multipart</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-navy-900 border border-surface-border space-y-2">
            <h4 className="font-semibold text-brand-purple uppercase tracking-wider text-[11px]">Frontend & UI/UX</h4>
            <ul className="text-slate-300 space-y-1">
              <li>• React 18 (TypeScript)</li>
              <li>• Vite (Fast build tooling)</li>
              <li>• Tailwind CSS (Navy enterprise design)</li>
              <li>• Recharts (Responsive analytical charting)</li>
              <li>• Lucide React (Enterprise iconography)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Dataset & Provenance Documentation */}
      <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Database className="w-4 h-4 text-brand-blue" />
          <span>Dataset Provenance & Usage Rights</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The application leverages the <strong>Kaggle Store Item Demand Forecasting Challenge</strong> dataset, consisting of 913,000 verified daily sales observations across 10 retail locations and 50 unique items spanning January 1, 2013 through December 31, 2017.
        </p>
        <div className="p-3 rounded-lg bg-navy-900 border border-surface-border text-xs text-slate-400">
          <span className="font-semibold text-slate-200">Data Integrity Notice: </span>
          All numbers, charts, and forecasts displayed across the platform are derived strictly from genuine mathematical operations on this dataset. No synthetic, mocked, or fabricated sales metrics are used.
        </div>
      </div>
    </div>
  );
};
