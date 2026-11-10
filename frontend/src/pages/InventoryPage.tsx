import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Truck,
  ShieldAlert,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Package,
  Info,
  ShoppingCart,
  RefreshCw,
} from 'lucide-react';

import { api } from '../services/api';
import { InventoryRecommendationResponse, InventoryItemRecommendation } from '../types/api';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const InventoryPage: React.FC<{
  selectedStore: number | undefined;
  onStoreChange: (st: number | undefined) => void;
}> = ({ selectedStore, onStoreChange }) => {
  const [store, setStore] = useState<number>(selectedStore || 1);
  const [leadTime, setLeadTime] = useState<number>(7);
  const [serviceLevel, setServiceLevel] = useState<number>(95);
  const [stockOverride, setStockOverride] = useState<string>('');
  const [topN, setTopN] = useState<number>(15);

  const [data, setData] = useState<InventoryRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderPlacedItems, setOrderPlacedItems] = useState<Record<number, boolean>>({});

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getInventoryRecommendations({
        store,
        lead_time_days: leadTime,
        target_service_level: serviceLevel,
        top_n_items: topN,
        current_stock_override: stockOverride ? Number(stockOverride) : undefined,
      });
      setData(res);
      onStoreChange(store);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate inventory recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [store, leadTime, serviceLevel, topN]);

  const handlePlaceOrder = (itemId: number, units: number) => {
    setOrderPlacedItems((prev) => ({ ...prev, [itemId]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Inventory Parameters & Assumptions Form */}
      <div className="p-4 bg-surface-card border border-surface-border rounded-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-brand-cyan" />
            <span>Inventory Assumptions & Lead Time Controls</span>
          </div>
          <span className="text-[11px] text-brand-emerald font-mono flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Documented Statistical Safety Buffer
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Store Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Target Store</label>
            <select
              value={store}
              onChange={(e) => setStore(Number(e.target.value))}
              className="w-full bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-3 py-2 text-xs font-medium focus:border-brand-cyan"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s}>
                  Store {s}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Lead Time */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Supplier Lead Time (Days)
            </label>
            <select
              value={leadTime}
              onChange={(e) => setLeadTime(Number(e.target.value))}
              className="w-full bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-3 py-2 text-xs font-medium focus:border-brand-cyan"
            >
              <option value={3}>3 Days (Express Delivery)</option>
              <option value={7}>7 Days (Standard Regional)</option>
              <option value={14}>14 Days (Two Weeks)</option>
              <option value={30}>30 Days (Overseas Cargo)</option>
            </select>
          </div>

          {/* Service Level */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Target Service Level
            </label>
            <select
              value={serviceLevel}
              onChange={(e) => setServiceLevel(Number(e.target.value))}
              className="w-full bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-3 py-2 text-xs font-medium focus:border-brand-cyan"
            >
              <option value={85}>85% (Z = 1.04 - Lean)</option>
              <option value={90}>90% (Z = 1.28 - Standard)</option>
              <option value={95}>95% (Z = 1.645 - Recommended)</option>
              <option value={98}>98% (Z = 2.05 - High Priority)</option>
              <option value={99}>99% (Z = 2.33 - Critical SKU)</option>
            </select>
          </div>

          {/* Manual Stock Level Override */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Stock Override (Optional)
            </label>
            <input
              type="number"
              placeholder="e.g. 150 units"
              value={stockOverride}
              onChange={(e) => setStockOverride(e.target.value)}
              className="w-full bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-3 py-2 text-xs font-medium placeholder-slate-500 focus:border-brand-cyan"
            />
          </div>

          {/* Apply button */}
          <div className="flex items-end">
            <button
              onClick={fetchRecommendations}
              disabled={isLoading}
              className="w-full py-2 bg-brand-cyan hover:bg-cyan-400 text-navy-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Calculate Plan</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading && !data ? (
        <LoadingSkeleton rows={4} height="h-32" />
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Critical Stockout Risks"
              value={data?.summary.critical_stockout_risks ?? 0}
              subtitle="Stock runs out before shipment arrives"
              icon={ShieldAlert}
              color="amber"
            />
            <MetricCard
              title="Reorders Needed"
              value={data?.summary.reorders_needed ?? 0}
              subtitle="Current stock below reorder point"
              icon={ShoppingCart}
              color="cyan"
            />
            <MetricCard
              title="Healthy Inventory SKUs"
              value={data?.summary.healthy_levels ?? 0}
              subtitle="Stock levels within optimal range"
              icon={CheckCircle2}
              color="emerald"
            />
            <MetricCard
              title="Total Suggested Reorder"
              value={(data?.summary.total_suggested_reorder_units ?? 0).toLocaleString()}
              subtitle="Total units to purchase"
              icon={Truck}
              color="blue"
            />
          </div>

          {/* Detailed Inventory Recommendations Table */}
          <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Automated SKU Replenishment Recommendations
                </h3>
                <p className="text-xs text-slate-400">
                  Calculated dynamically from forecast demand rate and historical standard deviation
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-navy-900 px-3 py-1 rounded-lg border border-surface-border">
                Store #{store} • Lead Time: {leadTime}d • Service Level: {serviceLevel}%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Product SKU</th>
                    <th className="py-3 px-3 text-right">Current Stock</th>
                    <th className="py-3 px-3 text-right">Daily Demand</th>
                    <th className="py-3 px-3 text-right">Safety Stock</th>
                    <th className="py-3 px-3 text-right">Reorder Point (ROP)</th>
                    <th className="py-3 px-3 text-right">Days Left</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Suggested Order</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono">
                  {data?.recommendations.map((item) => {
                    const isOrdered = orderPlacedItems[item.item_id];

                    return (
                      <tr
                        key={item.item_id}
                        className={`hover:bg-navy-900/60 transition-colors ${
                          item.status === 'CRITICAL_STOCKOUT_RISK' ? 'bg-rose-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-sans font-semibold text-white">
                          {item.item_name}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-200">
                          {item.current_stock.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-brand-cyan">
                          {item.avg_daily_demand.toFixed(1)}/d
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          {item.safety_stock}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-brand-amber">
                          {item.reorder_point}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          <span
                            className={
                              item.days_remaining < leadTime
                                ? 'text-rose-400 font-bold'
                                : 'text-slate-300'
                            }
                          >
                            {item.days_remaining}d
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-sans">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-brand-emerald">
                          {item.suggested_order > 0
                            ? `${item.suggested_order.toLocaleString()} units`
                            : '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-sans">
                          {item.suggested_order > 0 ? (
                            <button
                              onClick={() => handlePlaceOrder(item.item_id, item.suggested_order)}
                              disabled={isOrdered}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                                isOrdered
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-brand-cyan text-navy-950 hover:bg-cyan-400'
                              }`}
                            >
                              {isOrdered ? 'PO Created ✓' : 'Create PO'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Optimal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Documented Methodology Box */}
            <div className="mt-4 p-4 rounded-xl bg-navy-900 border border-surface-border text-xs text-slate-400 space-y-2">
              <h4 className="font-semibold text-slate-200 flex items-center">
                <Info className="w-4 h-4 text-brand-cyan mr-1.5" />
                Inventory Calculation Methodology & Formula Explanations
              </h4>
              <p>
                • <strong className="text-slate-300">Safety Stock:</strong> Calculated as{' '}
                <code className="text-brand-cyan bg-navy-950 px-1 py-0.5 rounded">
                  Z × σ_d × √(LeadTime)
                </code>
                , absorbing daily demand spikes during the supplier delivery window.
              </p>
              <p>
                • <strong className="text-slate-300">Reorder Point (ROP):</strong> Calculated as{' '}
                <code className="text-brand-cyan bg-navy-950 px-1 py-0.5 rounded">
                  (Avg Daily Demand × LeadTime) + Safety Stock
                </code>
                . When current stock reaches this threshold, an order must be dispatched.
              </p>
              <p className="text-[11px] text-slate-400 italic">{data?.disclaimer}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
