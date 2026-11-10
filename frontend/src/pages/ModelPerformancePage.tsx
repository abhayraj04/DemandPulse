import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Sliders,
  TrendingUp,
  BarChart2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import { api } from '../services/api';
import { ModelPerformanceResult } from '../types/api';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const ModelPerformancePage: React.FC<{
  selectedStore: number | undefined;
  selectedItem: number | undefined;
}> = ({ selectedStore, selectedItem }) => {
  const [store, setStore] = useState<number>(selectedStore || 1);
  const [item, setItem] = useState<number>(selectedItem || 1);
  const [horizon, setHorizon] = useState<number>(30);

  const [data, setData] = useState<ModelPerformanceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getModelPerformance({
        store,
        item,
        horizon,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate model performance.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [store, item, horizon]);

  return (
    <div className="space-y-6">
      {/* Target Selector */}
      <div className="p-4 bg-surface-card border border-surface-border rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
          <Award className="w-4 h-4 text-brand-cyan" />
          <span>Walk-Forward Benchmark Evaluation Configuration</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Store:</span>
            <select
              value={store}
              onChange={(e) => setStore(Number(e.target.value))}
              className="bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-2.5 py-1 text-xs focus:border-brand-cyan"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s}>
                  Store {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Item SKU:</span>
            <select
              value={item}
              onChange={(e) => setItem(Number(e.target.value))}
              className="bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-2.5 py-1 text-xs focus:border-brand-cyan"
            >
              {Array.from({ length: 50 }, (_, i) => i + 1).map((it) => (
                <option key={it} value={it}>
                  Item #{it}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Holdout Window:</span>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-2.5 py-1 text-xs focus:border-brand-cyan"
            >
              <option value={14}>14 Days Holdout</option>
              <option value={30}>30 Days Holdout (Standard)</option>
              <option value={60}>60 Days Holdout</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && !data ? (
        <LoadingSkeleton rows={4} height="h-36" />
      ) : (
        <>
          {/* Best Model Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand-cyan/15 via-surface-card to-brand-blue/15 border border-brand-cyan/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-brand-cyan uppercase">
                  Top Performing Forecaster
                </span>
                <h3 className="text-xl font-bold text-white">{data?.best_model}</h3>
                <p className="text-xs text-slate-400">
                  Evaluated on chronological holdout window ({data?.evaluation_window.start} to{' '}
                  {data?.evaluation_window.end})
                </p>
              </div>
            </div>

            <div className="text-right text-xs font-mono">
              <span className="text-slate-400">Lowest Holdout WAPE:</span>
              <p className="text-2xl font-bold text-brand-emerald">
                {data?.leaderboard[0]?.wape}%
              </p>
            </div>
          </div>

          {/* Model Leaderboard Table */}
          <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
            <h3 className="text-sm font-bold text-white mb-1">
              Cross-Model Evaluation Leaderboard
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              All models evaluated on identical holdout timestamps. Ranked strictly by lowest forecast error.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Forecasting Model</th>
                    <th className="py-2.5 px-3 text-right">WAPE (%)</th>
                    <th className="py-2.5 px-3 text-right">MAE (Units)</th>
                    <th className="py-2.5 px-3 text-right">RMSE (Units)</th>
                    <th className="py-2.5 px-3 text-right">MAPE (%)</th>
                    <th className="py-2.5 px-3 text-right">R²</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono">
                  {data?.leaderboard.map((m, idx) => (
                    <tr
                      key={m.model}
                      className={`hover:bg-navy-900 transition-colors ${
                        idx === 0 ? 'bg-brand-cyan/5 font-semibold text-white' : 'text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-400">#{idx + 1}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-white flex items-center space-x-1.5">
                        {idx === 0 && <span className="text-brand-cyan">★</span>}
                        <span>{m.model}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-brand-cyan">{m.wape}%</td>
                      <td className="py-2.5 px-3 text-right">{m.mae}</td>
                      <td className="py-2.5 px-3 text-right">{m.rmse}</td>
                      <td className="py-2.5 px-3 text-right">{m.mape}%</td>
                      <td className="py-2.5 px-3 text-right text-brand-emerald">{m.r2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Comparison Chart & Actual vs Predicted */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* WAPE & MAE Comparison Bar Chart */}
            <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Error Metric Comparison</h3>
                  <p className="text-xs text-slate-400">WAPE (%) and MAE across all candidate architectures</p>
                </div>
                <BarChart2 className="w-4 h-4 text-brand-cyan" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.leaderboard ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis
                      dataKey="model"
                      tick={{ fill: '#94A3B8', fontSize: 9 }}
                      stroke="#334155"
                      tickFormatter={(name) => name.split(' ')[0]}
                    />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="wape" name="WAPE Error (%)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="mae" name="MAE Error (Units)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Actual vs Predicted on Holdout Window */}
            <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Holdout Actual vs. Predicted Curve
                  </h3>
                  <p className="text-xs text-slate-400">Visualizing forecast alignment over test days</p>
                </div>
                <TrendingUp className="w-4 h-4 text-brand-emerald" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.comparison_points ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#64748B', fontSize: 10 }}
                      stroke="#334155"
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="actual" name="Actual Sales" stroke="#F8FAFC" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="XGBoost" name="XGBoost" stroke="#06B6D4" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ARIMA" name="ARIMA" stroke="#8B5CF6" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Naive" name="Naive" stroke="#64748B" strokeDasharray="3 3" strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Validation Philosophy Footer */}
          <div className="p-4 rounded-xl bg-navy-900 border border-surface-border text-xs text-slate-400 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200">Strict Chronological Validation Standard</h4>
              <p className="mt-1">
                Retail time-series data possesses strict temporal ordering and autocorrelation. Random train/test splits (e.g. standard K-Fold cross-validation) cause catastrophic data leakage by training on future observations to predict the past. DemandVision AI enforces chronological walk-forward holdout splits, ensuring models are tested under real operational deployment conditions.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
