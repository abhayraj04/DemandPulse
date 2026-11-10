import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Store,
  Package,
  Calendar,
  Award,
  TrendingUp,
  DollarSign,
  Layers,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

import { api } from '../services/api';
import {
  ExecutiveOverview,
  ProductCatalogItem,
  StoreProfile,
  ProductIntelligenceItem,
  RiskEngineResponse,
  AnomalyDetectionResponse,
} from '../types/api';
import { MetricCard } from '../components/common/MetricCard';
import { FilterBar } from '../components/common/FilterBar';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { formatINR, formatIndianNumber } from '../utils/formatters';

export const OverviewPage: React.FC<{
  selectedStore: number | undefined;
  selectedItem: number | undefined;
  onStoreChange: (st: number | undefined) => void;
  onItemChange: (it: number | undefined) => void;
}> = ({ selectedStore, selectedItem, onStoreChange, onItemChange }) => {
  const [data, setData] = useState<ExecutiveOverview | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<ProductCatalogItem[]>([]);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [productScores, setProductScores] = useState<ProductIntelligenceItem[]>([]);
  const [risksData, setRisksData] = useState<RiskEngineResponse | null>(null);
  const [anomaliesData, setAnomaliesData] = useState<AnomalyDetectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load product catalog and stores metadata once
    api.getCatalogProducts().then((res) => setCatalog(res.products)).catch(console.error);
    api.getCatalogStores().then((res) => setStores(res.stores)).catch(console.error);
  }, []);

  const fetchOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [overviewRes, catRes, scoresRes, risksRes, anomaliesRes] = await Promise.all([
        api.getOverview({ store: selectedStore, item: selectedItem }),
        api.getCategories(selectedStore),
        api.getProductScores({ store: selectedStore }).catch(() => null),
        api.getRisks({ store: selectedStore }).catch(() => null),
        api.getAnomalies({ store: selectedStore, item: selectedItem }).catch(() => null),
      ]);
      setData(overviewRes);
      setCategories(catRes.categories || []);
      if (scoresRes?.products) setProductScores(scoresRes.products);
      if (risksRes) setRisksData(risksRes);
      if (anomaliesRes) setAnomaliesData(anomaliesRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load executive overview.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedStore, selectedItem]);

  if (isLoading && !data) {
    return <LoadingSkeleton rows={4} height="h-32" />;
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
        <p className="font-semibold mb-1">Failed to load overview data</p>
        <p>{error}</p>
        <button
          onClick={fetchOverview}
          className="mt-3 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Educational Data Architecture Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-navy-900 border border-surface-border text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center space-x-2 text-slate-300">
          <Info className="w-4 h-4 text-brand-cyan flex-shrink-0" />
          <span>
            <strong className="text-white">Data Architecture:</strong> Historical sales units from public benchmark time series. Indian product names and store cities represent an illustrative localization layer.
          </span>
        </div>
        <span className="text-[11px] font-mono text-brand-emerald bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
          Estimated based on configured demo prices
        </span>
      </div>

      {/* Filter Bar */}
      <FilterBar
        selectedStore={selectedStore}
        selectedItem={selectedItem}
        onStoreChange={onStoreChange}
        onItemChange={onItemChange}
        onRefresh={fetchOverview}
        isLoading={isLoading}
        productCatalog={catalog}
        storeRegistry={stores}
      />

      {/* Top Metric Cards - Physical Volume & Commercial Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sales Units"
          value={formatIndianNumber(data?.total_units_sold)}
          subtitle={`Verified historical units across ${data?.number_of_stores ?? 10} stores`}
          change={data?.sales_growth_pct}
          changeLabel="Annual Growth"
          icon={ShoppingBag}
          color="cyan"
        />
        <MetricCard
          title="Estimated Revenue"
          value={formatINR(data?.estimated_gross_revenue, { compact: true })}
          subtitle="Estimated based on configured demo prices"
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          title="Top Performing Location"
          value={data?.top_store_details?.city ?? (data?.best_performing_store ? `Store #${data.best_performing_store}` : 'Chain')}
          subtitle={data?.top_store_details ? `${data.top_store_details.name} • ${data.top_store_details.tier}` : 'Store 2 — Bengaluru (13.7%)'}
          icon={Store}
          badge="Leader"
          color="blue"
        />
        <MetricCard
          title="Top Product SKU"
          value={data?.top_product_details ? `${data.top_product_details.product_id || `P0${data.top_product_details.item_id}`} • ${data.top_product_details.name}` : 'P015 • Sugar'}
          subtitle={data?.top_product_details ? `Configured Unit Price: ${formatINR(data.top_product_details.configured_price_inr ?? data.top_product_details.unit_price)}` : 'Item #15'}
          icon={Package}
          badge="Top Volume"
          color="purple"
        />
      </div>

      {/* Department Category Breakdown Bar */}
      {categories.length > 0 && (
        <div className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-md">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-brand-cyan" />
              Sales Distribution by Department Category
            </span>
            <span className="text-xs text-slate-400 font-mono">5 Commercial Departments</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs font-mono">
            {categories.map((cat) => (
              <div key={cat.category} className="p-2.5 rounded-lg bg-navy-900 border border-surface-border">
                <span className="text-slate-400 font-sans text-[11px] font-semibold block truncate">{cat.category}</span>
                <p className="text-base font-bold text-white mt-0.5">{cat.total_units.toLocaleString()} units</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span className="text-brand-cyan font-bold">{cat.volume_share_pct}% vol</span>
                  <span className="text-brand-emerald">{formatINR(cat.estimated_revenue, { compact: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Trend Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Trend */}
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Monthly Sales Trajectory</h3>
              <p className="text-xs text-slate-400">Total verified units sold aggregated by month</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
              5-Year Horizon
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly_trend ?? []}>
                <defs>
                  <linearGradient id="monthlyCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => val.slice(0, 7)}
                  stroke="#334155"
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  stroke="#334155"
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [`${val.toLocaleString()} units`, 'Sales Volume']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#monthlyCyan)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Sales Trend (Recent Window) */}
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Daily Demand Velocity</h3>
              <p className="text-xs text-slate-400">High-frequency daily sales fluctuations</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
              Daily Granularity
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.daily_trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => val.slice(5)}
                  stroke="#334155"
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  stroke="#334155"
                  tickFormatter={(val) => val.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [`${val.toLocaleString()} units`, 'Daily Sales']}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#10B981"
                  strokeWidth={1.8}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Benchmark Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Products */}
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Top 10 Products by Volume</h3>
              <p className="text-xs text-slate-400">Highest-grossing SKUs across analyzed stores</p>
            </div>
            <Layers className="w-4 h-4 text-brand-cyan" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data?.top_products ?? []}
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  stroke="#334155"
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="item"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  stroke="#334155"
                  width={65}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [`${val.toLocaleString()} units`, 'Total Sold']}
                />
                <Bar dataKey="sales" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Store Performance Comparison */}
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Store Benchmark Comparison</h3>
              <p className="text-xs text-slate-400">Total unit distribution across all 10 locations</p>
            </div>
            <Store className="w-4 h-4 text-brand-purple" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.store_comparison ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="store"
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  stroke="#334155"
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  stroke="#334155"
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [`${val.toLocaleString()} units`, 'Store Sales']}
                />
                <Bar dataKey="sales" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ADVANCED INTELLIGENCE SECTION: Product Intelligence + Risk Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Intelligence Top Opportunities */}
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-cyan" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Product Intelligence Score Leaderboard
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Composite 0–100 score: Growth, Consistency, Velocity, Stability & Margin
              </p>
            </div>
            <span className="text-[10px] font-mono bg-brand-cyan/15 text-brand-cyan px-2 py-0.5 rounded border border-brand-cyan/30">
              Top Performers
            </span>
          </div>

          <div className="space-y-3">
            {productScores.slice(0, 4).map((p) => (
              <div
                key={p.item_id}
                className="p-3 rounded-lg bg-navy-900 border border-surface-border hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-brand-cyan">{p.product_id}</span>
                    <span className="text-xs font-semibold text-white truncate max-w-[200px]" title={p.product_name}>
                      {p.product_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.tier === 'High Opportunity'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {p.tier}
                    </span>
                    <span className="text-base font-bold font-mono text-white">{p.overall_score}</span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-gradient-to-r from-brand-cyan to-brand-emerald h-full rounded-full"
                    style={{ width: `${p.overall_score}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-400 font-mono">
                  <div>Growth: <strong className="text-slate-200">{p.components.sales_growth.score}</strong></div>
                  <div>Consistency: <strong className="text-slate-200">{p.components.demand_consistency.score}</strong></div>
                  <div>Stability: <strong className="text-slate-200">{p.components.stability.score}</strong></div>
                  <div>Daily: <strong className="text-brand-emerald">{p.avg_daily_demand.toFixed(1)} u/d</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demand & Inventory Risk Engine Radar */}
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Demand & Inventory Risk Engine
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-factor vulnerability: Stockout days, demand volatility & sales momentum
                </p>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Active Radar
              </span>
            </div>

            {/* Risk Counts Strip */}
            {risksData && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-center">
                  <div className="text-lg font-bold font-mono text-rose-400">{risksData.summary.high_risk_count}</div>
                  <div className="text-[10px] text-rose-300 uppercase tracking-wider">High Risk SKUs</div>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-center">
                  <div className="text-lg font-bold font-mono text-amber-400">{risksData.summary.medium_risk_count}</div>
                  <div className="text-[10px] text-amber-300 uppercase tracking-wider">Medium Risk</div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-center">
                  <div className="text-lg font-bold font-mono text-emerald-400">{risksData.summary.low_risk_count}</div>
                  <div className="text-[10px] text-emerald-300 uppercase tracking-wider">Low Risk</div>
                </div>
              </div>
            )}

            {/* Top Critical Risk Items */}
            <div className="space-y-2.5">
              {risksData?.items.slice(0, 3).map((r) => (
                <div
                  key={r.item_id}
                  className="p-2.5 rounded-lg bg-navy-900 border border-surface-border text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-amber-400 font-bold">{r.product_id}</span>
                      <span className="text-white font-medium truncate max-w-[170px]">{r.product_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Days left: <strong className="text-rose-400 font-mono">{r.days_remaining.toFixed(1)}d</strong> • Revenue at risk:{' '}
                      <strong className="text-slate-200">{formatINR(r.revenue_at_risk_inr)}</strong>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 uppercase">
                    {r.risk_level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-surface-border text-[11px] text-slate-400 flex items-center justify-between">
            <span>Potential stockout risk based on configured inventory assumptions.</span>
            <span className="text-amber-400 font-bold font-mono">
              Total Risk: {formatINR(risksData?.summary.total_revenue_at_risk_inr)}
            </span>
          </div>
        </div>
      </div>

      {/* STATISTICAL ANOMALY DETECTION STREAM */}
      {anomaliesData && anomaliesData.anomalies.length > 0 && (
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Statistical Anomaly Detection Stream
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rolling 14-day Z-score analysis flagging demand spikes and drops exceeding 2.5 standard deviations
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
              {anomaliesData.summary.total_anomalies_detected} Anomalies Flagged
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {anomaliesData.anomalies.slice(0, 4).map((a, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-navy-900 border border-surface-border text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400 text-[11px]">{a.date}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      a.direction === 'positive'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {a.severity}
                  </span>
                </div>
                <div className="font-semibold text-white truncate" title={a.product_name}>
                  {a.product_name}
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                  <span>Actual: <strong className="text-white">{a.actual_sales}</strong></span>
                  <span>Expected: <strong className="text-slate-300">{a.expected_mean.toFixed(0)}</strong></span>
                  <span className="text-brand-cyan">Z: {a.z_score.toFixed(1)}</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 pt-1 border-t border-surface-border/50">
                  {a.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
