import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Calendar,
  Layers,
  Clock,
  Sparkles,
  Info,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Package,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import { api } from '../services/api';
import { ForecastResponse, ForecastModelInfo, ProductCatalogItem, StoreProfile } from '../types/api';
import { MetricCard } from '../components/common/MetricCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { formatINR, formatIndianNumber } from '../utils/formatters';

export const DemandForecastingPage: React.FC<{
  selectedStore: number | undefined;
  selectedItem: number | undefined;
  onStoreChange: (st: number | undefined) => void;
  onItemChange: (it: number | undefined) => void;
}> = ({ selectedStore, selectedItem, onStoreChange, onItemChange }) => {
  const [store, setStore] = useState<number>(selectedStore || 1);
  const [item, setItem] = useState<number>(selectedItem || 1);
  const [modelId, setModelId] = useState<string>('xgboost');
  const [horizon, setHorizon] = useState<number>(30);

  const [availableModels, setAvailableModels] = useState<ForecastModelInfo[]>([]);
  const [catalog, setCatalog] = useState<ProductCatalogItem[]>([]);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with global store/item if changed from outside
  useEffect(() => {
    if (selectedStore && selectedStore !== store) setStore(selectedStore);
    if (selectedItem && selectedItem !== item) setItem(selectedItem);
  }, [selectedStore, selectedItem]);

  // Load model definitions and catalog metadata
  useEffect(() => {
    api.getForecastModels().then((res) => setAvailableModels(res.models)).catch(console.error);
    api.getCatalogProducts().then((res) => setCatalog(res.products)).catch(console.error);
    api.getCatalogStores().then((res) => setStores(res.stores)).catch(console.error);
  }, []);

  const runForecast = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getForecast({
        store,
        item,
        model_id: modelId,
        horizon,
      });
      setForecastData(res);
      onStoreChange(store);
      onItemChange(item);
    } catch (err: any) {
      setError(err.message || 'Failed to generate demand forecast.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runForecast();
  }, [store, item, modelId, horizon]);

  // Merge history and forecast for seamless fan chart display
  const chartPoints = forecastData
    ? [
        ...forecastData.history.map((h) => ({
          date: h.date,
          historical: h.sales,
          predicted: null as number | null,
          lower: null as number | null,
          upper: null as number | null,
        })),
        ...forecastData.forecast.map((f) => ({
          date: f.date,
          historical: null as number | null,
          predicted: f.predicted_sales,
          lower: f.lower_bound,
          upper: f.upper_bound,
        })),
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Control Panel: Store, Item, Model, Horizon */}
      <div className="p-4 bg-surface-card border border-surface-border rounded-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-brand-cyan" />
            <span>Forecasting Configuration Parameters</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Zero Lookahead Leakage Guarantee
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Store Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Target Location</label>
            <select
              value={store}
              onChange={(e) => setStore(Number(e.target.value))}
              className="w-full bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-3 py-2 text-xs font-medium focus:border-brand-cyan"
            >
              {stores.length > 0
                ? stores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      Store {s.store_id} — {s.city} ({s.state})
                    </option>
                  ))
                : Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={s}>
                      Store {s}
                    </option>
                  ))}
            </select>
          </div>

          {/* Product Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Indian Retail Product SKU</label>
            <select
              value={item}
              onChange={(e) => setItem(Number(e.target.value))}
              className="w-full bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-3 py-2 text-xs font-medium focus:border-brand-cyan truncate"
            >
              {catalog.length > 0
                ? catalog.filter((it) => it.item_id !== null).map((it) => (
                    <option key={it.item_id} value={it.item_id!}>
                      {it.product_id || `P0${it.item_id}`} • {it.name} ({formatINR(it.configured_price_inr ?? it.unit_price)})
                    </option>
                  ))
                : Array.from({ length: 50 }, (_, i) => i + 1).map((it) => (
                    <option key={it} value={it}>
                      Item #{it}
                    </option>
                  ))}
            </select>
          </div>

          {/* Forecasting Model Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Forecasting Model</label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-3 py-2 text-xs font-medium focus:border-brand-cyan"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.recommended ? '★ Recommended' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Forecast Horizon */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Forecast Horizon</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[7, 30, 90].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    horizon === h
                      ? 'bg-brand-cyan text-navy-950 border-brand-cyan font-bold shadow-sm'
                      : 'bg-navy-850 text-slate-300 border-surface-border hover:border-slate-600'
                  }`}
                >
                  {h} Days
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoading && !forecastData ? (
        <LoadingSkeleton rows={4} height="h-36" />
      ) : (
        <>
          {/* Selected Product Commercial Profile Banner */}
          {forecastData?.product_name && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-brand-cyan/15 via-surface-card to-brand-blue/15 border border-brand-cyan/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{forecastData.product_name}</span>
                    <span className="text-[10px] font-mono bg-navy-900 text-brand-cyan px-2 py-0.5 rounded border border-surface-border">
                      SKU: {forecastData.sku || `SKU-${forecastData.item}`}
                    </span>
                    <span className="text-[10px] font-semibold bg-surface-hover text-slate-300 px-2 py-0.5 rounded border border-surface-border">
                      {forecastData.category || 'General'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Location: <strong className="text-slate-200">{forecastData.store_name || `Store #${forecastData.store}`}</strong> • Brand: <strong className="text-slate-200">{forecastData.brand || 'RetailBrand'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 font-mono text-right">
                <div>
                  <span className="text-slate-400 text-[10px]">Configured Unit Price</span>
                  <p className="text-sm font-bold text-brand-emerald">{formatINR(forecastData.unit_price, { showDecimals: true })}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Estimated Profit</span>
                  <p className="text-sm font-bold text-brand-cyan">{formatINR(forecastData?.summary.predicted_gross_profit)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Forecast Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Forecasted Sales Units"
              value={formatIndianNumber(forecastData?.summary.total_predicted_units)}
              subtitle={`Total forecast volume over next ${horizon} days`}
              icon={Layers}
              color="cyan"
            />
            <MetricCard
              title="Forecasted Revenue"
              value={formatINR(forecastData?.summary.predicted_revenue)}
              subtitle="Estimated based on configured demo prices"
              icon={TrendingUp}
              color="emerald"
            />
            <MetricCard
              title="Avg Daily Demand Pace"
              value={`${forecastData?.summary.avg_daily_forecast.toFixed(1) ?? '0.0'} /d`}
              subtitle={`Peak Spike: ${forecastData?.summary.peak_daily_forecast.toFixed(1) ?? '0.0'} units`}
              icon={Calendar}
              color="purple"
            />
            <MetricCard
              title="Holdout WAPE Accuracy"
              value={`${forecastData?.metrics.wape ?? 0}%`}
              subtitle={`MAE: ${forecastData?.metrics.mae} units • ${forecastData?.model_name}`}
              icon={CheckCircle2}
              badge="Holdout Score"
              color="blue"
            />
          </div>

          {/* Primary Forecast Chart with Confidence Bounds */}
          <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2">
                  <span>Probabilistic Demand Forecast Curve</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                    {forecastData?.model_name}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Historical actual demand (last 90 days) aligned with future {horizon}-day projections & 95% confidence bounds
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono">
                <span className="flex items-center text-slate-400">
                  <span className="w-3 h-0.5 bg-slate-400 mr-1.5" /> Historical
                </span>
                <span className="flex items-center text-brand-cyan">
                  <span className="w-3 h-1 bg-brand-cyan mr-1.5" /> Forecast
                </span>
                <span className="flex items-center text-cyan-400/60">
                  <span className="w-3 h-2 bg-cyan-500/20 mr-1.5 rounded" /> 95% Interval
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartPoints}>
                  <defs>
                    <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    stroke="#334155"
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: '#1E293B',
                      borderRadius: '0.75rem',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: string) => {
                      if (val === null || val === undefined) return ['', ''];
                      if (name === 'historical') return [`${val} units`, 'Historical Sales'];
                      if (name === 'predicted') return [`${val} units`, 'Predicted Forecast'];
                      if (name === 'upper') return [`${val} units`, 'Upper 95% Bound'];
                      if (name === 'lower') return [`${val} units`, 'Lower 95% Bound'];
                      return [val, name];
                    }}
                  />
                  {/* Historical line */}
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="#94A3B8"
                    strokeWidth={1.8}
                    dot={false}
                    connectNulls={false}
                  />
                  {/* Confidence Interval Band */}
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="transparent"
                    fill="url(#forecastBand)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="transparent"
                    fill="#111827"
                  />
                  {/* Predicted Forecast line */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#06B6D4"
                    strokeWidth={2.5}
                    dot={{ fill: '#06B6D4', r: 2.5 }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Disclaimer */}
            <div className="mt-3 p-3 rounded-lg bg-navy-900 border border-surface-border text-xs text-slate-400 flex items-start space-x-2">
              <Info className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold text-slate-200">Probabilistic Accuracy Notice: </span>
                {forecastData?.disclaimer}
              </p>
            </div>
          </div>

          {/* Model Accuracy Metrics & Forecast Breakdown Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Accuracy Card */}
            <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                <span>Validation Accuracy Profile</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Calculated strictly on chronological out-of-sample holdout data without future leakage.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between p-2.5 rounded-lg bg-navy-900 border border-surface-border">
                  <span className="text-slate-400">WAPE (Weighted APE):</span>
                  <span className="text-brand-cyan font-bold">{forecastData?.metrics.wape}%</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-navy-900 border border-surface-border">
                  <span className="text-slate-400">MAE (Mean Absolute Error):</span>
                  <span className="text-white font-bold">{forecastData?.metrics.mae} units</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-navy-900 border border-surface-border">
                  <span className="text-slate-400">RMSE (Root Mean Squared):</span>
                  <span className="text-white font-bold">{forecastData?.metrics.rmse} units</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-navy-900 border border-surface-border">
                  <span className="text-slate-400">MAPE (Percentage Error):</span>
                  <span className="text-white font-bold">{forecastData?.metrics.mape}%</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-navy-900 border border-surface-border">
                  <span className="text-slate-400">R² Coefficient:</span>
                  <span className="text-brand-emerald font-bold">{forecastData?.metrics.r2}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-navy-900 border border-surface-border">
                  <span className="text-slate-400">Training Time:</span>
                  <span className="text-slate-300 font-bold">{forecastData?.training_time_seconds}s</span>
                </div>
              </div>
            </div>

            {/* Daily Forecast Table Preview */}
            <div className="lg:col-span-2 p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Future Daily Forecast Table
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    First 10 days of {horizon}-day projection
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-surface-border text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Day</th>
                        <th className="py-2.5 px-3 text-right">Predicted Demand</th>
                        <th className="py-2.5 px-3 text-right">95% Interval (Low - High)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border font-mono">
                      {forecastData?.forecast.slice(0, 10).map((row) => {
                        const dayName = new Date(row.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                        });
                        return (
                          <tr key={row.date} className="hover:bg-navy-900 transition-colors">
                            <td className="py-2.5 px-3 text-slate-200">{row.date}</td>
                            <td className="py-2.5 px-3 text-slate-400 font-sans">{dayName}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-brand-cyan">
                              {row.predicted_sales}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-400">
                              {row.lower_bound} – {row.upper_bound}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs text-slate-400">
                <span>Displaying 10 of {forecastData?.forecast.length} projected days</span>
                <span className="text-brand-emerald font-semibold">Store {store} • Item {item}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
