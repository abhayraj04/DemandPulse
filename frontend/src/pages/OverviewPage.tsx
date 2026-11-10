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
import { ExecutiveOverview } from '../types/api';
import { MetricCard } from '../components/common/MetricCard';
import { FilterBar } from '../components/common/FilterBar';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const OverviewPage: React.FC<{
  selectedStore: number | undefined;
  selectedItem: number | undefined;
  onStoreChange: (st: number | undefined) => void;
  onItemChange: (it: number | undefined) => void;
}> = ({ selectedStore, selectedItem, onStoreChange, onItemChange }) => {
  const [data, setData] = useState<ExecutiveOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getOverview({ store: selectedStore, item: selectedItem });
      setData(res);
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
      {/* Filter Bar */}
      <FilterBar
        selectedStore={selectedStore}
        selectedItem={selectedItem}
        onStoreChange={onStoreChange}
        onItemChange={onItemChange}
        onRefresh={fetchOverview}
        isLoading={isLoading}
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Units Sold"
          value={data?.total_units_sold.toLocaleString() ?? '0'}
          subtitle="Cumulative verified volume"
          change={data?.sales_growth_pct}
          changeLabel="MoM Growth"
          icon={ShoppingBag}
          color="cyan"
        />
        <MetricCard
          title="Average Daily Sales"
          value={data?.average_daily_sales.toLocaleString() ?? '0'}
          subtitle="Mean units sold per day"
          icon={Calendar}
          color="emerald"
        />
        <MetricCard
          title="Best Performing Store"
          value={data?.best_performing_store ? `Store #${data.best_performing_store}` : 'Chain'}
          subtitle="Highest aggregate sales revenue"
          icon={Store}
          badge="Top Performer"
          color="blue"
        />
        <MetricCard
          title="Top Product SKU"
          value={data?.highest_selling_product ? `Item #${data.highest_selling_product}` : 'All'}
          subtitle="Leading demand volume item"
          icon={Package}
          badge="Leader"
          color="purple"
        />
      </div>

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
