import React, { useState, useEffect } from 'react';
import {
  Activity,
  Sliders,
  HelpCircle,
  GitCommit,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import { api } from '../services/api';
import { TimeSeriesDecomposition } from '../types/api';
import { FilterBar } from '../components/common/FilterBar';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const TimeSeriesPage: React.FC<{
  selectedStore: number | undefined;
  selectedItem: number | undefined;
  onStoreChange: (st: number | undefined) => void;
  onItemChange: (it: number | undefined) => void;
}> = ({ selectedStore, selectedItem, onStoreChange, onItemChange }) => {
  const [data, setData] = useState<TimeSeriesDecomposition | null>(null);
  const [period, setPeriod] = useState<number>(7);
  const [modelType, setModelType] = useState<'additive' | 'multiplicative'>('additive');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDecomposition = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getTimeSeriesDecomposition({
        store: selectedStore || 1,
        item: selectedItem || 1,
        period: period,
        model_type: modelType,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to decompose time-series.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDecomposition();
  }, [selectedStore, selectedItem, period, modelType]);

  // Combine dates with observed, trend, seasonal, and residual for plotting
  const chartData = (data?.dates || []).map((date, idx) => ({
    date: date.slice(5),
    observed: data?.observed[idx] ?? null,
    trend: data?.trend[idx] ?? null,
    seasonal: data?.seasonal[idx] ?? null,
    residual: data?.residual[idx] ?? null,
  }));

  return (
    <div className="space-y-6">
      {/* Filters and Model Type Controls */}
      <div className="space-y-3">
        <FilterBar
          selectedStore={selectedStore || 1}
          selectedItem={selectedItem || 1}
          onStoreChange={(s) => onStoreChange(s || 1)}
          onItemChange={(i) => onItemChange(i || 1)}
          onRefresh={fetchDecomposition}
          isLoading={isLoading}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-card border border-surface-border rounded-xl">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Sliders className="w-4 h-4 text-brand-cyan" />
            <span>Decomposition Parameters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period selector */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400">Seasonal Cycle:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-2.5 py-1 text-xs focus:border-brand-cyan"
              >
                <option value={7}>7 Days (Weekly cycle)</option>
                <option value={14}>14 Days (Bi-weekly)</option>
                <option value={30}>30 Days (Monthly cycle)</option>
              </select>
            </div>

            {/* Model Type */}
            <div className="flex items-center space-x-1.5 bg-navy-850 p-1 rounded-lg border border-surface-border text-xs">
              <button
                onClick={() => setModelType('additive')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  modelType === 'additive'
                    ? 'bg-brand-cyan text-navy-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Additive (Y = T + S + R)
              </button>
              <button
                onClick={() => setModelType('multiplicative')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  modelType === 'multiplicative'
                    ? 'bg-brand-cyan text-navy-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Multiplicative (Y = T * S * R)
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && !data ? (
        <LoadingSkeleton rows={4} height="h-40" />
      ) : (
        <>
          {/* Stationarity Card */}
          {data?.stationarity && (
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg border ${
                    data.stationarity.is_stationary
                      ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20'
                      : 'bg-brand-amber/10 text-brand-amber border-brand-amber/20'
                  }`}
                >
                  {data.stationarity.is_stationary ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>{data.stationarity.test_name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                        data.stationarity.is_stationary
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {data.stationarity.is_stationary ? 'Stationary Series' : 'Non-Stationary Series'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">{data.stationarity.interpretation}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400">ADF Stat:</span>{' '}
                  <span className="text-white font-bold">{data.stationarity.test_statistic}</span>
                </div>
                <div>
                  <span className="text-slate-400">p-value:</span>{' '}
                  <span className="text-brand-cyan font-bold">{data.stationarity.p_value}</span>
                </div>
              </div>
            </div>
          )}

          {/* 4 Decomposed Component Charts */}
          <div className="space-y-4">
            {/* 1. Observed */}
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">1. Observed Sales Series (Original)</span>
                <span className="text-[10px] text-slate-400">Last 180 Daily Observations</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="observed" stroke="#94A3B8" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Trend */}
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-brand-cyan">2. Extracted Trend Component</span>
                <span className="text-[10px] text-slate-400">{data?.explanations.trend}</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="trend" stroke="#06B6D4" strokeWidth={2.2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Seasonality */}
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-brand-emerald">3. Repeating Seasonal Component</span>
                <span className="text-[10px] text-slate-400">{data?.explanations.seasonality}</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="seasonal" stroke="#10B981" strokeWidth={1.8} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Residual */}
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-brand-purple">4. Residual Noise Component</span>
                <span className="text-[10px] text-slate-400">{data?.explanations.residual}</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="residual" stroke="#8B5CF6" strokeWidth={1.2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Autocorrelation (ACF & PACF) Analysis */}
          <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Autocorrelation (ACF) & Partial Autocorrelation (PACF)
                </h3>
                <p className="text-xs text-slate-400">
                  Measures correlation between current demand and historical sales across daily lags (1 to 30)
                </p>
              </div>
              <GitCommit className="w-4 h-4 text-brand-cyan" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.acf_pacf ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="lag"
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    stroke="#334155"
                    tickFormatter={(l) => `Lag ${l}`}
                  />
                  <YAxis domain={[-0.3, 1.0]} tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="acf" name="Autocorrelation (ACF)" fill="#06B6D4" />
                  <Bar dataKey="pacf" name="Partial Autocorrelation (PACF)" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-navy-900 border border-surface-border/70 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Lag 7 & Lag 14 Spikes:</span> The prominent spikes at multiples of 7 lags statistically confirm weekly retail seasonality cycles, justifying our 7-day lagged features in the XGBoost forecasting model.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
