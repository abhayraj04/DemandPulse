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
  Download,
  DollarSign,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { api } from '../services/api';
import { InventoryRecommendationResponse, InventoryItemRecommendation, StoreProfile } from '../types/api';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { formatINR, formatIndianNumber } from '../utils/formatters';

export const InventoryPage: React.FC<{
  selectedStore: number | undefined;
  onStoreChange: (st: number | undefined) => void;
}> = ({ selectedStore, onStoreChange }) => {
  const [store, setStore] = useState<number>(selectedStore || 1);
  const [leadTime, setLeadTime] = useState<number>(7);
  const [serviceLevel, setServiceLevel] = useState<number>(95);
  const [stockOverride, setStockOverride] = useState<string>('');
  const [topN, setTopN] = useState<number>(15);
  const [stores, setStores] = useState<StoreProfile[]>([]);

  // What-If Sandbox Parameters
  const [demandSurgePct, setDemandSurgePct] = useState<number>(0); // -20% to +50%
  const [supplierDelayDays, setSupplierDelayDays] = useState<number>(0); // 0 to 10 days

  const [data, setData] = useState<InventoryRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderPlacedItems, setOrderPlacedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api.getCatalogStores().then((res) => setStores(res.stores)).catch(console.error);
  }, []);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getInventoryRecommendations({
        store,
        lead_time_days: leadTime + supplierDelayDays,
        target_service_level: serviceLevel,
        top_n_items: topN,
        current_stock_override: stockOverride ? Number(stockOverride) : undefined,
      });

      // Apply demand surge modifier if set in simulation
      if (demandSurgePct !== 0 && res.recommendations) {
        const factor = 1 + (demandSurgePct / 100);
        res.recommendations = res.recommendations.map((item) => {
          const adjDemand = item.avg_daily_demand * factor;
          const adjDaysLeft = adjDemand > 0 ? Number((item.current_stock / adjDemand).toFixed(1)) : 999;
          const isCritical = adjDaysLeft < (leadTime + supplierDelayDays);
          return {
            ...item,
            avg_daily_demand: Number(adjDemand.toFixed(1)),
            days_remaining: adjDaysLeft,
            status: isCritical ? 'CRITICAL_STOCKOUT_RISK' : item.status,
            severity: isCritical ? 'high' : item.severity,
          };
        });
      }

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
  }, [store, leadTime, serviceLevel, topN, demandSurgePct, supplierDelayDays]);

  const handleExportCSV = () => {
    if (!data?.recommendations) return;
    const headers = [
      'Product ID',
      'Product Name',
      'Brand',
      'Category',
      'Package Size',
      'Unit Cost (₹)',
      'Unit Price (₹)',
      'Avg Daily Demand',
      'Current Stock',
      'Safety Stock',
      'Reorder Point (ROP)',
      'Days Remaining',
      'Inventory Status',
      'Suggested Order (Units)',
      'Reorder Cost (₹)',
      'Revenue at Risk (₹)',
    ];
    const rows = data.recommendations.map((r) => [
      r.product_id || r.sku || `P0${r.item_id}`,
      `"${r.item_name}"`,
      r.brand || 'RetailBrand',
      r.category || 'General',
      r.package_size || 'Standard Pack',
      r.unit_cost?.toFixed(2) ?? '0.00',
      r.unit_price?.toFixed(2) ?? '0.00',
      r.avg_daily_demand.toFixed(1),
      r.current_stock,
      r.safety_stock,
      r.reorder_point,
      r.days_remaining,
      r.status,
      r.suggested_order,
      (r.suggested_order_cost_inr ?? r.suggested_order_cost_usd ?? (r.suggested_order * 10)).toFixed(2),
      (r.revenue_at_risk_inr ?? r.revenue_at_risk_usd ?? 0).toFixed(2),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DemandPulse_PO_Store_${store}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePlaceOrder = (itemId: number) => {
    setOrderPlacedItems((prev) => ({ ...prev, [itemId]: true }));
  };

  const currentStoreProfile = stores.find((s) => s.store_id === store);

  return (
    <div className="space-y-6">
      {/* Inventory Parameters & Assumptions Form */}
      <div className="p-4 bg-surface-card border border-surface-border rounded-xl shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-border">
          <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-brand-cyan" />
            <span>Inventory Assumptions & Replenishment Controls</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[11px] text-brand-emerald font-mono flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Documented Statistical Safety Buffer
            </span>
            <button
              onClick={handleExportCSV}
              disabled={!data?.recommendations?.length}
              className="px-3 py-1 bg-surface-border hover:bg-navy-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Export PO (.CSV)</span>
            </button>
            <a
              href={api.getAbcXyzCsvUrl(store)}
              download
              className="px-3 py-1 bg-surface-border hover:bg-navy-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              title="Download complete 9-quadrant ABC-XYZ segmentation matrix CSV"
            >
              <Download className="w-3.5 h-3.5 text-brand-purple" />
              <span>Export ABC-XYZ (.CSV)</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Store Selector with City & Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Target Store</label>
            <select
              value={store}
              onChange={(e) => setStore(Number(e.target.value))}
              className="w-full bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-3 py-2 text-xs font-medium focus:border-brand-cyan"
            >
              {stores.length > 0 ? (
                stores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>
                    Store {s.store_id} — {s.city}, {s.state} ({s.tier})
                  </option>
                ))
              ) : (
                Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>
                    Store {s}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Supplier Lead Time */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Base Supplier Lead Time
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

        {/* What-If Scenario Sandbox */}
        <div className="p-3.5 bg-navy-900/90 border border-brand-cyan/20 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-brand-cyan">
              <Zap className="w-4 h-4 text-brand-amber" />
              <span>Executive What-If Simulation Sandbox</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Dynamically stress-test supply chains against disruptions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Demand Surge Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span>Demand Surge / Black Swan Shock:</span>
                <span className={`font-mono font-bold ${demandSurgePct > 0 ? 'text-amber-400' : demandSurgePct < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {demandSurgePct > 0 ? `+${demandSurgePct}%` : `${demandSurgePct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                step="5"
                value={demandSurgePct}
                onChange={(e) => setDemandSurgePct(Number(e.target.value))}
                className="w-full h-1.5 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-20% (Lull)</span>
                <span>0% (Baseline)</span>
                <span>+25% (Promo)</span>
                <span>+50% (Flash Sale)</span>
              </div>
            </div>

            {/* Supplier Lead Time Delay */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span>Port Congestion / Supplier Delay:</span>
                <span className={`font-mono font-bold ${supplierDelayDays > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  +{supplierDelayDays} days delay
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={supplierDelayDays}
                onChange={(e) => setSupplierDelayDays(Number(e.target.value))}
                className="w-full h-1.5 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-brand-amber"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0d (On Time)</span>
                <span>+3d (Customs Lag)</span>
                <span>+7d (Major Bottleneck)</span>
                <span>+10d (Disruption)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Store Profile Badge */}
        {currentStoreProfile && (
          <div className="flex flex-wrap items-center justify-between text-xs bg-navy-900/60 px-3 py-2 rounded-lg border border-surface-border text-slate-400">
            <div>
              <span className="text-white font-semibold">{currentStoreProfile.name}</span>
              <span className="mx-2">•</span>
              <span>{currentStoreProfile.city}, {currentStoreProfile.state} ({currentStoreProfile.region})</span>
              <span className="mx-2">•</span>
              <span>{currentStoreProfile.sqft.toLocaleString()} sq.ft ({currentStoreProfile.tier})</span>
            </div>
            <div className="font-mono text-slate-300">
              Hub: <span className="text-brand-cyan">{currentStoreProfile.warehouse_hub}</span> | Lead: {leadTime + supplierDelayDays}d
            </div>
          </div>
        )}
      </div>

      {isLoading && !data ? (
        <LoadingSkeleton rows={4} height="h-32" />
      ) : (
        <>
          {/* Summary KPIs with Financial Unit Economics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Critical Stockout Risks"
              value={data?.summary.critical_stockout_risks ?? 0}
              subtitle="Stock depletes before shipment arrives"
              icon={ShieldAlert}
              color="amber"
            />
            <MetricCard
              title="Reorder Cost"
              value={formatINR(data?.summary.total_suggested_reorder_cost_inr ?? data?.summary.total_suggested_reorder_cost_usd)}
              subtitle="Estimated based on configured demo prices"
              icon={DollarSign}
              color="emerald"
            />
            <MetricCard
              title="Revenue at Risk"
              value={formatINR(data?.summary.total_revenue_at_risk_inr ?? data?.summary.total_revenue_at_risk_usd)}
              subtitle="Estimated based on configured demo prices"
              icon={TrendingUp}
              color="amber"
            />
            <MetricCard
              title="Total Suggested Reorder"
              value={formatIndianNumber(data?.summary.total_suggested_reorder_units)}
              subtitle="Total units across recommended items"
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
                  Calculated dynamically from forecast demand rate, standard deviation, and configured unit costs
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-slate-400 bg-navy-900 px-3 py-1 rounded-lg border border-surface-border">
                  Store #{store} • Effective Lead Time: {leadTime + supplierDelayDays}d • Target SL: {serviceLevel}%
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Product ID & Name</th>
                    <th className="py-3 px-3">Package Size</th>
                    <th className="py-3 px-3 text-right">Unit Cost (₹)</th>
                    <th className="py-3 px-3 text-right">Current Stock</th>
                    <th className="py-3 px-3 text-right">Daily Demand</th>
                    <th className="py-3 px-3 text-right">Safety Stock</th>
                    <th className="py-3 px-3 text-right">Reorder Point (ROP)</th>
                    <th className="py-3 px-3 text-right">Days Left</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Suggested Order</th>
                    <th className="py-3 px-3 text-right">Reorder Cost (₹)</th>
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
                        <td className="py-3 px-3 font-sans">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-navy-950 text-brand-cyan border border-surface-border font-bold">
                              {item.product_id || item.sku || `P0${item.item_id}`}
                            </span>
                            <span className="font-semibold text-white">{item.item_name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5 font-sans">
                            <span className="text-slate-300">{item.brand}</span>
                            <span>•</span>
                            <span className="bg-navy-900 text-slate-400 px-1.5 py-0.2 rounded border border-surface-border">
                              {item.category || 'General'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-sans">
                          {item.package_size || 'Standard Pack'}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          {formatINR(item.unit_cost, { showDecimals: true })}
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
                              item.days_remaining < (leadTime + supplierDelayDays)
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
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          {item.suggested_order > 0
                            ? formatINR(item.suggested_order_cost_inr ?? item.suggested_order_cost_usd)
                            : '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-sans">
                          {item.suggested_order > 0 ? (
                            <button
                              onClick={() => handlePlaceOrder(item.item_id)}
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
                            <span className="text-[11px] text-slate-500">Optimal</span>
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
              <p>
                • <strong className="text-slate-300">Financial Impact:</strong> Reorder Cost is computed as{' '}
                <code className="text-brand-cyan bg-navy-950 px-1 py-0.5 rounded">
                  Suggested Order Units × Configured Demo Unit Cost (₹)
                </code>
                , giving procurement leaders exact cash outlay numbers for purchase order generation.
              </p>
              <p className="text-[11px] text-brand-cyan font-mono italic">
                * Estimated based on configured demo prices. Product names and store locations illustrate enterprise retail SaaS operations.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
