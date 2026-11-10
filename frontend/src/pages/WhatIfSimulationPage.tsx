import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Truck,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
  Info,
  CheckCircle2,
} from 'lucide-react';

import { api } from '../services/api';
import { ProductCatalogItem, StoreProfile } from '../types/api';
import { formatINR, formatIndianNumber } from '../utils/formatters';
import { MetricCard } from '../components/common/MetricCard';

export const WhatIfSimulationPage: React.FC<{
  selectedStore: number | undefined;
  selectedItem: number | undefined;
  onStoreChange: (st: number | undefined) => void;
  onItemChange: (it: number | undefined) => void;
}> = ({ selectedStore, selectedItem, onStoreChange, onItemChange }) => {
  const [store, setStore] = useState<number>(selectedStore || 1);
  const [item, setItem] = useState<number>(selectedItem || 1);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [catalog, setCatalog] = useState<ProductCatalogItem[]>([]);

  // Simulation Parameters
  const [demandShockPct, setDemandShockPct] = useState<number>(10); // +10% default
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7);
  const [targetServiceLevel, setTargetServiceLevel] = useState<number>(95);
  const [inventoryOverride, setInventoryOverride] = useState<number>(250);
  const [unitPriceOverride, setUnitPriceOverride] = useState<number>(320);

  // Baseline Historical Metrics
  const [baselineDailyDemand, setBaselineDailyDemand] = useState<number>(35.0);
  const [baselineStd, setBaselineStd] = useState<number>(8.5);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    api.getCatalogStores().then((res) => setStores(res.stores)).catch(console.error);
    api.getCatalogProducts().then((res) => {
      setCatalog(res.products);
      const initialProd = res.products.find((p: ProductCatalogItem) => p.item_id === item);
      if (initialProd) {
        setUnitPriceOverride(initialProd.configured_price_inr ?? initialProd.unit_price);
      }
    }).catch(console.error);
  }, []);

  // Fetch baseline historical metrics for selected store and item
  useEffect(() => {
    const fetchBaseline = async () => {
      try {
        setIsLoading(true);
        const res = await api.getDetailedSalesAnalytics({ store, item });
        const mean = res.summary_stats.mean_sales || 30.0;
        const std = res.summary_stats.std_deviation || 8.0;
        setBaselineDailyDemand(mean);
        setBaselineStd(std);

        // Update default inventory and price from catalog
        const prod = catalog.find((p) => p.item_id === item);
        if (prod) {
          setUnitPriceOverride(prod.configured_price_inr ?? prod.unit_price);
          setInventoryOverride(Math.round(mean * 10)); // ~10 days supply default
        }
      } catch (err) {
        console.error('Failed to load baseline sales for simulation:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBaseline();
  }, [store, item, catalog]);

  // Dynamic Scenario Mathematical Calculations
  const demandMultiplier = 1.0 + demandShockPct / 100.0;
  const simulatedDailyDemand = baselineDailyDemand * demandMultiplier;
  const simulatedLeadTimeDemand = simulatedDailyDemand * leadTimeDays;

  // Z-score mapping
  const zScores: Record<number, number> = { 85: 1.04, 90: 1.28, 95: 1.645, 98: 2.05, 99: 2.33 };
  const z = zScores[targetServiceLevel] || 1.645;
  const simulatedStd = baselineStd * Math.sqrt(demandMultiplier);
  const simulatedSafetyStock = Math.round(z * simulatedStd * Math.sqrt(leadTimeDays));
  const simulatedReorderPoint = Math.round(simulatedLeadTimeDemand + simulatedSafetyStock);

  // Supply duration & gap
  const daysOfSupply = simulatedDailyDemand > 0 ? inventoryOverride / simulatedDailyDemand : 999;
  const inventoryGap = inventoryOverride - simulatedReorderPoint; // negative = deficit
  const suggestedOrderQuantity = Math.max(0, simulatedReorderPoint - inventoryOverride);
  const estimatedRevenue30d = simulatedDailyDemand * 30 * unitPriceOverride;
  const baselineRevenue30d = baselineDailyDemand * 30 * unitPriceOverride;
  const revenueDelta = estimatedRevenue30d - baselineRevenue30d;

  // Risk Classification
  let riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk' = 'Low Risk';
  let riskBadgeColor = 'emerald';
  let riskExplanation = '';

  if (daysOfSupply < leadTimeDays) {
    riskLevel = 'High Risk';
    riskBadgeColor = 'rose';
    riskExplanation = `Current inventory (${daysOfSupply.toFixed(1)} days) depletes before the ${leadTimeDays}-day supplier delivery window. Potential stockout risk based on configured inventory assumptions.`;
  } else if (inventoryOverride <= simulatedReorderPoint) {
    riskLevel = 'Medium Risk';
    riskBadgeColor = 'amber';
    riskExplanation = `Current inventory has breached the calculated Reorder Point (${simulatedReorderPoint} units). Potential stockout risk based on configured inventory assumptions.`;
  } else {
    riskLevel = 'Low Risk';
    riskBadgeColor = 'emerald';
    riskExplanation = `Current inventory exceeds the replenishment threshold (${simulatedReorderPoint} units). Supply remains healthy under this simulated scenario.`;
  }

  const selectedProd = catalog.find((p) => p.item_id === item);
  const selectedStoreProfile = stores.find((s) => s.store_id === store);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-navy-900 via-navy-850 to-slate-900 border border-brand-cyan/20 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-brand-cyan" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Executive What-If Simulation Sandbox
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamically model demand surges, supplier lead time bottlenecks, and price sensitivity against configured inventory.
          </p>
        </div>
        <div className="text-[11px] font-mono text-slate-400 bg-navy-950 px-3 py-1.5 rounded-lg border border-surface-border">
          * Estimated based on configured demo prices
        </div>
      </div>

      {/* Preset Scenario Buttons */}
      <div className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-md space-y-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Preset Scenario Quick-Triggers
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <button
            onClick={() => {
              setDemandShockPct(0);
              setLeadTimeDays(7);
            }}
            className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
              demandShockPct === 0 && leadTimeDays === 7
                ? 'bg-slate-700 border-slate-500 text-white shadow'
                : 'bg-navy-900 border-surface-border text-slate-300 hover:border-slate-600'
            }`}
          >
            <span className="font-bold block">Base Scenario (0%)</span>
            <span className="text-[10px] text-slate-400">Normal operations, 7d lead time</span>
          </button>

          <button
            onClick={() => {
              setDemandShockPct(10);
              setLeadTimeDays(7);
            }}
            className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
              demandShockPct === 10
                ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow'
                : 'bg-navy-900 border-surface-border text-slate-300 hover:border-slate-600'
            }`}
          >
            <span className="font-bold block text-cyan-400">Demand Increase +10%</span>
            <span className="text-[10px] text-slate-400">Mild promotional surge</span>
          </button>

          <button
            onClick={() => {
              setDemandShockPct(20);
              setLeadTimeDays(10);
            }}
            className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
              demandShockPct === 20
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow'
                : 'bg-navy-900 border-surface-border text-slate-300 hover:border-slate-600'
            }`}
          >
            <span className="font-bold block text-amber-400">Demand Increase +20%</span>
            <span className="text-[10px] text-slate-400">Heavy promotion + 3d customs delay</span>
          </button>

          <button
            onClick={() => {
              setDemandShockPct(-10);
              setLeadTimeDays(7);
            }}
            className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
              demandShockPct === -10
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow'
                : 'bg-navy-900 border-surface-border text-slate-300 hover:border-slate-600'
            }`}
          >
            <span className="font-bold block text-rose-400">Demand Decrease -10%</span>
            <span className="text-[10px] text-slate-400">Seasonal post-holiday lull</span>
          </button>
        </div>
      </div>

      {/* Interactive Sliders & Parameter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Parameter Controls */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Simulation Inputs & Assumptions
            </span>
            <span className="text-[11px] text-brand-cyan font-mono">
              Real-time parameter re-evaluation
            </span>
          </div>

          {/* Store and Item Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Location</label>
              <select
                value={store}
                onChange={(e) => {
                  const s = Number(e.target.value);
                  setStore(s);
                  onStoreChange(s);
                }}
                className="w-full bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-3 py-2 text-xs font-medium focus:border-brand-cyan"
              >
                {stores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>
                    Store {s.store_id} — {s.city} ({s.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Product SKU</label>
              <select
                value={item}
                onChange={(e) => {
                  const it = Number(e.target.value);
                  setItem(it);
                  onItemChange(it);
                }}
                className="w-full bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-3 py-2 text-xs font-medium focus:border-brand-cyan truncate"
              >
                {catalog.filter((p) => p.item_id !== null).map((p) => (
                  <option key={p.item_id} value={p.item_id!}>
                    {p.product_id} • {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Slider 1: Expected Demand Shock % */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-navy-900 border border-surface-border">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Expected Demand Surge / Shock:</span>
              <span className={`font-mono font-bold text-sm ${demandShockPct > 0 ? 'text-amber-400' : demandShockPct < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {demandShockPct > 0 ? `+${demandShockPct}%` : `${demandShockPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="80"
              step="5"
              value={demandShockPct}
              onChange={(e) => setDemandShockPct(Number(e.target.value))}
              className="w-full h-2 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-40% Lull</span>
              <span>-10%</span>
              <span>0% Baseline</span>
              <span>+20% Surge</span>
              <span>+50% Flash Sale</span>
              <span>+80% Peak</span>
            </div>
          </div>

          {/* Slider 2: Current Inventory Units */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-navy-900 border border-surface-border">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Configured Inventory on Hand:</span>
              <span className="font-mono font-bold text-sm text-brand-emerald">
                {inventoryOverride.toLocaleString()} units
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="1500"
              step="20"
              value={inventoryOverride}
              onChange={(e) => setInventoryOverride(Number(e.target.value))}
              className="w-full h-2 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-brand-emerald"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>20 (Depleted)</span>
              <span>250</span>
              <span>500</span>
              <span>1,000</span>
              <span>1,500 (Heavily Stocked)</span>
            </div>
          </div>

          {/* Dual Inputs: Supplier Lead Time & Target Service Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Supplier Lead Time (Days)
              </label>
              <select
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                className="w-full bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-3 py-2 text-xs font-medium focus:border-brand-cyan"
              >
                <option value={3}>3 Days (Express Courier)</option>
                <option value={7}>7 Days (Standard Regional)</option>
                <option value={10}>10 Days (Customs / Congestion)</option>
                <option value={14}>14 Days (Two Weeks Delay)</option>
                <option value={21}>21 Days (Extended Bottleneck)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Service Level
              </label>
              <select
                value={targetServiceLevel}
                onChange={(e) => setTargetServiceLevel(Number(e.target.value))}
                className="w-full bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-3 py-2 text-xs font-medium focus:border-brand-cyan"
              >
                <option value={85}>85% (Z = 1.04 - Lean)</option>
                <option value={90}>90% (Z = 1.28 - Standard)</option>
                <option value={95}>95% (Z = 1.645 - Recommended)</option>
                <option value={98}>98% (Z = 2.05 - High Priority)</option>
                <option value={99}>99% (Z = 2.33 - Critical SKU)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Configured Unit Price (₹)
              </label>
              <input
                type="number"
                value={unitPriceOverride}
                onChange={(e) => setUnitPriceOverride(Number(e.target.value))}
                className="w-full bg-navy-850 text-white border border-surface-border rounded-lg px-3 py-2 text-xs font-mono focus:border-brand-cyan"
              />
            </div>
          </div>
        </div>

        {/* Right Col: Scenario Outcome Card */}
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Simulated Impact
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  riskLevel === 'High Risk'
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : riskLevel === 'Medium Risk'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {riskLevel}
              </span>
            </div>

            <div className="space-y-3 pt-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-surface-border/50">
                <span className="text-slate-400">Baseline Demand:</span>
                <span className="font-mono text-slate-200">{baselineDailyDemand.toFixed(1)} units/day</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-surface-border/50">
                <span className="text-slate-400">Simulated Demand:</span>
                <span className="font-mono text-brand-cyan font-bold">{simulatedDailyDemand.toFixed(1)} units/day</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-surface-border/50">
                <span className="text-slate-400">Days of Supply Remaining:</span>
                <span className={`font-mono font-bold ${daysOfSupply < leadTimeDays ? 'text-rose-400' : 'text-slate-200'}`}>
                  {daysOfSupply.toFixed(1)} days
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-surface-border/50">
                <span className="text-slate-400">Simulated Safety Stock:</span>
                <span className="font-mono text-slate-200">{simulatedSafetyStock} units</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-surface-border/50">
                <span className="text-slate-400">Simulated Reorder Point:</span>
                <span className="font-mono text-amber-400 font-bold">{simulatedReorderPoint} units</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-surface-border/50">
                <span className="text-slate-400">Inventory Gap / Deficit:</span>
                <span className={`font-mono font-bold ${inventoryGap < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {inventoryGap > 0 ? `+${inventoryGap} units surplus` : `${inventoryGap} units deficit`}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-surface-border/50">
                <span className="text-slate-400">Suggested Order Units:</span>
                <span className="font-mono text-brand-emerald font-bold">{suggestedOrderQuantity} units</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Reorder Cost (₹):</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {formatINR(suggestedOrderQuantity * (selectedProd?.unit_cost ?? 200))}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Explanation Alert */}
          <div className="p-3 rounded-lg bg-navy-900 border border-surface-border text-[11px] text-slate-300 space-y-1">
            <span className="font-semibold text-white flex items-center">
              <Info className="w-3.5 h-3.5 mr-1 text-brand-cyan" />
              Scenario Evaluation Note:
            </span>
            <p>{riskExplanation}</p>
          </div>
        </div>
      </div>

      {/* Comparison Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Updated Expected Demand"
          value={`${formatIndianNumber(Math.round(simulatedDailyDemand * 30))} units`}
          subtitle={`30-day forecast volume (${demandShockPct > 0 ? `+${demandShockPct}%` : `${demandShockPct}%`})`}
          icon={Layers}
          color="cyan"
        />
        <MetricCard
          title="Simulated 30-Day Revenue"
          value={formatINR(estimatedRevenue30d)}
          subtitle={`Revenue variance: ${revenueDelta >= 0 ? `+${formatINR(revenueDelta)}` : formatINR(revenueDelta)}`}
          icon={TrendingUp}
          color="emerald"
        />
        <MetricCard
          title="Inventory Position Gap"
          value={`${inventoryGap > 0 ? `+${inventoryGap}` : inventoryGap} units`}
          subtitle={inventoryGap < 0 ? 'Deficit below calculated safety ROP' : 'Comfortable stock buffer'}
          icon={Package}
          color={inventoryGap < 0 ? 'amber' : 'emerald'}
        />
        <MetricCard
          title="Suggested Reorder Quantity"
          value={`${suggestedOrderQuantity} units`}
          subtitle={`Reorder cost: ${formatINR(suggestedOrderQuantity * (selectedProd?.unit_cost ?? 200))}`}
          icon={Truck}
          color="blue"
        />
      </div>
    </div>
  );
};
