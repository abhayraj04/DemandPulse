import React, { useEffect, useState } from 'react';
import {
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Award,
  HelpCircle,
  Clock,
  Sparkles,
  BarChart3,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { DataScienceLabResponse } from '../types/api';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

const DataScienceLabPage: React.FC = () => {
  const [store, setStore] = useState<number>(1);
  const [item, setItem] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [labData, setLabData] = useState<DataScienceLabResponse | null>(null);

  useEffect(() => {
    fetchLabData();
  }, [store, item]);

  const fetchLabData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDataScienceLab({ store, item });
      setLabData(data);
    } catch (err: any) {
      console.error('Failed to load Data Science Lab data:', err);
      setError('Failed to load technical audit from machine learning pipeline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-wider uppercase mb-1">
            <Cpu className="w-4 h-4" />
            <span>Machine Learning & Pipeline Explainability</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Data Science & ML Engineering Lab</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Mathematical rigor and production transparency. Audit dataset integrity, verify zero-leakage walk-forward validation,
            inspect engineered lag matrices, and analyze XGBoost feature importance distributions.
          </p>
        </div>

        {/* Store & SKU Selector */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
          <div className="text-xs text-slate-400 font-medium pl-2">Inspection Target:</div>
          <select
            value={store}
            onChange={(e) => setStore(Number(e.target.value))}
            className="bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
              <option key={s} value={s}>
                Store {s}
              </option>
            ))}
          </select>
          <select
            value={item}
            onChange={(e) => setItem(Number(e.target.value))}
            className="bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
          >
            {Array.from({ length: 50 }, (_, i) => i + 1).map((it) => (
              <option key={it} value={it}>
                Item {it} (P{String(it).padStart(3, '0')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && !labData && (
        <LoadingSkeleton rows={4} height="h-32" />
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {labData && (
        <>
          {/* SECTION 1: DATA QUALITY & INTEGRITY AUDIT */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Data Quality & Leakage Audit</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                {labData.data_quality_audit.quality_status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="text-xs text-slate-400 mb-1">Total Transaction Records</div>
                <div className="text-2xl font-bold text-white font-mono">
                  {labData.data_quality_audit.total_records.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Full 5-year Kaggle daily sales benchmark</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="text-xs text-slate-400 mb-1">Missing / Null Values</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  {labData.data_quality_audit.missing_values} (0.00%)
                </div>
                <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Zero imputation required
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="text-xs text-slate-400 mb-1">Duplicate Records</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  {labData.data_quality_audit.duplicate_records} (0.00%)
                </div>
                <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Unique (date, store, item) index
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="text-xs text-slate-400 mb-1">Time Horizon Span</div>
                <div className="text-2xl font-bold text-cyan-400 font-mono">
                  {labData.data_quality_audit.time_span_years.toFixed(1)} Years
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {labData.data_quality_audit.date_range}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CHRONOLOGICAL WALK-FORWARD VALIDATION METHODOLOGY */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Validation Methodology & Zero-Leakage Guarantee</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  In time-series forecasting, standard k-fold cross-validation or randomized train/test splits cause
                  <span className="text-rose-400 font-semibold"> catastrophic temporal leakage</span> by training on future observations to predict past dates.
                  DemandVision AI strictly enforces <span className="text-cyan-400 font-semibold">Chronological Walk-Forward Validation</span>.
                </p>

                {/* Timeline Diagram */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-3 font-mono text-xs">
                  <div className="text-slate-400 font-sans text-xs font-semibold">Temporal Data Boundary Partition:</div>
                  <div className="flex items-center gap-1 h-8 rounded-lg overflow-hidden border border-slate-700/60 p-0.5">
                    <div className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 h-full flex items-center justify-center flex-[8] rounded-l text-[11px] font-medium">
                      Historical Training Window (2013-01-01 to 2017-09-30)
                    </div>
                    <div className="bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 h-full flex items-center justify-center flex-[2] rounded-r text-[11px] font-medium">
                      Holdout Test (Last 90 Days)
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1 font-sans">
                    <span>Train Horizon: {labData.validation_methodology.train_window}</span>
                    <span className="text-cyan-400 font-medium">Out-of-Sample Test: {labData.validation_methodology.test_window}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-xs text-cyan-300/90 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-cyan-300">Data Leakage Prevention:</strong> {labData.validation_methodology.leakage_guarantee}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Recruiter Interview Takeaway</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {labData.model_explainability.recruiter_takeaway}
                </p>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span className="text-slate-300 font-semibold">Algorithm:</span> {labData.model_explainability.algorithm}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: MODEL EXPLAINABILITY & XGBOOST FEATURE IMPORTANCE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">XGBoost Feature Importance Distribution</h2>
              </div>
              <span className="text-xs text-slate-400">
                Top Predictor: <strong className="text-cyan-400">{labData.model_explainability.top_predictor}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Horizontal Bar Chart */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs font-medium text-slate-400 mb-4">
                  Normalized Feature Contribution to Variance Explained (%):
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={labData.model_explainability.feature_importance}
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#64748B"
                        fontSize={11}
                        unit="%"
                        domain={[0, 'auto']}
                      />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          color: '#F8FAFC'
                        }}
                        formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Contribution']}
                      />
                      <Bar dataKey="importance_pct" radius={[0, 6, 6, 0]}>
                        {labData.model_explainability.feature_importance.map((entry: any, idx: number) => {
                          const fill =
                            entry.category === 'lag'
                              ? '#06B6D4' // cyan
                              : entry.category === 'rolling'
                              ? '#10B981' // emerald
                              : '#8B5CF6'; // purple
                          return <Cell key={`cell-${idx}`} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-cyan-500"></span>
                    <span className="text-slate-300">Lag Features (Autoregressive)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500"></span>
                    <span className="text-slate-300">Rolling Window Stats</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-purple-500"></span>
                    <span className="text-slate-300">Calendar Features</span>
                  </div>
                </div>
              </div>

              {/* Analytical Interpretations */}
              <div className="lg:col-span-5 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {labData.model_explainability.feature_importance.map((f: any, i: number) => (
                  <div
                    key={f.feature}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{f.feature}</span>
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${
                            f.category === 'lag'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                              : f.category === 'rolling'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {f.category}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {f.importance_pct.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">{f.analytical_insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: FEATURE ENGINEERING ARCHITECTURE & RECENT MATRIX SAMPLE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Engineered Feature Matrix Sample</h2>
              </div>
              <span className="text-xs text-slate-400">
                Live output of temporal transformation pipeline
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-purple-400 font-semibold mb-1">Calendar & Temporal:</div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    {labData.feature_engineering_architecture.calendar_features.join(', ')}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-cyan-400 font-semibold mb-1">Autoregressive Lags:</div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    {labData.feature_engineering_architecture.lag_features.join(', ')}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-emerald-400 font-semibold mb-1">Rolling Aggregations:</div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    {labData.feature_engineering_architecture.rolling_window_features.join(', ')}
                  </div>
                </div>
              </div>

              {/* Sample Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">date</th>
                      <th className="py-2.5 px-3 text-emerald-400">sales (target)</th>
                      <th className="py-2.5 px-3">lag_7</th>
                      <th className="py-2.5 px-3">lag_14</th>
                      <th className="py-2.5 px-3">lag_28</th>
                      <th className="py-2.5 px-3">rolling_mean_7</th>
                      <th className="py-2.5 px-3">rolling_std_7</th>
                      <th className="py-2.5 px-3">day_of_week</th>
                      <th className="py-2.5 px-3">is_weekend</th>
                      <th className="py-2.5 px-3">month</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                    {labData.feature_engineering_architecture.recent_sample.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-200 font-semibold">{row.date}</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">{row.sales}</td>
                        <td className="py-2 px-3 text-cyan-300">{row.lag_7}</td>
                        <td className="py-2 px-3 text-slate-400">{row.lag_14}</td>
                        <td className="py-2 px-3 text-slate-400">{row.lag_28}</td>
                        <td className="py-2 px-3 text-emerald-300">
                          {typeof row.rolling_mean_7 === 'number' ? row.rolling_mean_7.toFixed(1) : row.rolling_mean_7}
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {typeof row.rolling_std_7 === 'number' ? row.rolling_std_7.toFixed(1) : row.rolling_std_7}
                        </td>
                        <td className="py-2 px-3">{row.day_of_week}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              row.is_weekend ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {row.is_weekend ? '1' : '0'}
                          </span>
                        </td>
                        <td className="py-2 px-3">{row.month}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DataScienceLabPage;
