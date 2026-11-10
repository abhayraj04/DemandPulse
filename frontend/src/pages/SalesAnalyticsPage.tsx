import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  HelpCircle,
  BarChart2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';

import { api } from '../services/api';
import { DetailedSalesAnalytics } from '../types/api';
import { FilterBar } from '../components/common/FilterBar';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const SalesAnalyticsPage: React.FC<{
  selectedStore: number | undefined;
  selectedItem: number | undefined;
  onStoreChange: (st: number | undefined) => void;
  onItemChange: (it: number | undefined) => void;
}> = ({ selectedStore, selectedItem, onStoreChange, onItemChange }) => {
  const [data, setData] = useState<DetailedSalesAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getDetailedSalesAnalytics({ store: selectedStore, item: selectedItem });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedStore, selectedItem]);

  if (isLoading && !data) {
    return <LoadingSkeleton rows={4} height="h-32" />;
  }

  const stats = data?.summary_stats;

  return (
    <div className="space-y-6">
      {/* Global Filter Bar */}
      <FilterBar
        selectedStore={selectedStore}
        selectedItem={selectedItem}
        onStoreChange={onStoreChange}
        onItemChange={onItemChange}
        onRefresh={fetchAnalytics}
        isLoading={isLoading}
      />

      {/* Statistical Summary Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Mean Daily</span>
            <p className="text-xl font-bold font-mono text-brand-cyan mt-1">{stats.mean_sales}</p>
            <span className="text-[10px] text-slate-400">Arithmetic average</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Median Daily</span>
            <p className="text-xl font-bold font-mono text-brand-emerald mt-1">{stats.median_sales}</p>
            <span className="text-[10px] text-slate-400">50th percentile (robust)</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Std Deviation</span>
            <p className="text-xl font-bold font-mono text-brand-blue mt-1">{stats.std_deviation}</p>
            <span className="text-[10px] text-slate-400">Demand dispersion</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Coeff. Variation</span>
            <p className="text-xl font-bold font-mono text-brand-purple mt-1">{stats.coefficient_of_variation}</p>
            <span className="text-[10px] text-slate-400">Std / Mean ratio</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">IQR Range (25-75)</span>
            <p className="text-xl font-bold font-mono text-brand-amber mt-1">{stats.p25} – {stats.p75}</p>
            <span className="text-[10px] text-slate-400">Core 50% density</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Max Observed</span>
            <p className="text-xl font-bold font-mono text-white mt-1">{stats.max_sales}</p>
            <span className="text-[10px] text-slate-400">Peak single-day spike</span>
          </div>
        </div>
      )}

      {/* Seasonality Curves Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week Weekly Pattern */}
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Weekly Day-of-Week Seasonality</h3>
              <p className="text-xs text-slate-400">Average sales volume across days of the week</p>
            </div>
            <Calendar className="w-4 h-4 text-brand-cyan" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekly_pattern ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 10 }} stroke="#334155" />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [`${val.toFixed(1)} units/day`, 'Avg Daily Sales']}
                />
                <Bar dataKey="avg_sales" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 p-3 rounded-lg bg-navy-900 border border-surface-border/70 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Weekend Uplift:</span> Friday, Saturday, and Sunday consistently show the highest retail customer footfall and transactional basket size.
          </div>
        </div>

        {/* Monthly Seasonality Pattern */}
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Annual Monthly Seasonality Cycle</h3>
              <p className="text-xs text-slate-400">Historical demand curve by calendar month (Jan - Dec)</p>
            </div>
            <TrendingUp className="w-4 h-4 text-brand-emerald" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthly_pattern ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  stroke="#334155"
                  tickFormatter={(val) => val.slice(0, 3)}
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
                  formatter={(val: number) => [`${val.toFixed(1)} units`, 'Monthly Avg Demand']}
                />
                <Line
                  type="monotone"
                  dataKey="avg_sales"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10B981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 p-3 rounded-lg bg-navy-900 border border-surface-border/70 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Summer Surge:</span> Retail volume peaks across June, July, and August, experiencing seasonal troughs during January and February.
          </div>
        </div>
      </div>

      {/* Sales Volume Distribution & Yearly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Distribution Histogram */}
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Sales Distribution (Histogram Bins)</h3>
              <p className="text-xs text-slate-400">Frequency of daily transaction volumes</p>
            </div>
            <BarChart2 className="w-4 h-4 text-brand-blue" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.sales_distribution ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="bin_range" tick={{ fill: '#94A3B8', fontSize: 10 }} stroke="#334155" />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} stroke="#334155" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val: number, name: string) => [
                    name === 'count' ? `${val.toLocaleString()} days` : `${val}%`,
                    name === 'count' ? 'Day Count' : 'Percentage',
                  ]}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 vs Bottom 5 Performers */}
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide mb-1">Product Dispersion Analysis</h3>
            <p className="text-xs text-slate-400 mb-4">Contrast between top-performing volume drivers and low-demand SKUs</p>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center mb-2">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Top 5 Volume Leaders
                </span>
                <div className="space-y-1.5">
                  {data?.top_performers.map((item: any) => (
                    <div
                      key={item.item_id}
                      className="flex items-center justify-between p-2 rounded-lg bg-navy-900 border border-surface-border text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">{item.item}</span>
                        {item.category && (
                          <div className="flex items-center space-x-2 mt-0.5 text-[10px]">
                            <span className="text-brand-cyan font-mono">{item.sku}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-400">{item.category}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-x-3 font-mono text-right">
                        <span className="text-slate-400">{item.avg_sales} units/day</span>
                        <span className="text-brand-emerald font-semibold">
                          {item.total_sales.toLocaleString()} units
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center mb-2">
                  <ArrowDownRight className="w-3.5 h-3.5 mr-1" /> Bottom 5 Volume Items
                </span>
                <div className="space-y-1.5">
                  {data?.bottom_performers.map((item: any) => (
                    <div
                      key={item.item_id}
                      className="flex items-center justify-between p-2 rounded-lg bg-navy-900 border border-surface-border text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">{item.item}</span>
                        {item.category && (
                          <div className="flex items-center space-x-2 mt-0.5 text-[10px]">
                            <span className="text-brand-cyan font-mono">{item.sku}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-400">{item.category}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-x-3 font-mono text-right">
                        <span className="text-slate-400">{item.avg_sales} units/day</span>
                        <span className="text-slate-300 font-semibold">
                          {item.total_sales.toLocaleString()} units
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
