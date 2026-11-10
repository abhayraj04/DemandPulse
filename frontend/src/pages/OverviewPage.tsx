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
import { ExecutiveOverview, ProductCatalogItem, StoreProfile } from '../types/api';
import { MetricCard } from '../components/common/MetricCard';
import { FilterBar } from '../components/common/FilterBar';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { formatINR, formatIndianNumber } from '../utils/formatters';
import { Info } from 'lucide-react';

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
      const [overviewRes, catRes] = await Promise.all([
        api.getOverview({ store: selectedStore, item: selectedItem }),
        api.getCategories(selectedStore),
      ]);
      setData(overviewRes);
      setCategories(catRes.categories || []);
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
    </div>
  );
};
