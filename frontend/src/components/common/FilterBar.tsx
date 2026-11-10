import React from 'react';
import { Store, Package, RefreshCw, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  selectedStore: number | undefined;
  selectedItem: number | undefined;
  onStoreChange: (store: number | undefined) => void;
  onItemChange: (item: number | undefined) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  storeOptions?: number[];
  itemOptions?: number[];
  showItemFilter?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedStore,
  selectedItem,
  onStoreChange,
  onItemChange,
  onRefresh,
  isLoading = false,
  storeOptions = Array.from({ length: 10 }, (_, i) => i + 1),
  itemOptions = Array.from({ length: 50 }, (_, i) => i + 1),
  showItemFilter = true,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface-card border border-surface-border rounded-xl shadow-md">
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <SlidersHorizontal className="w-4 h-4 text-brand-cyan" />
        <span>Global Filters</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Store Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 flex items-center">
            <Store className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Store:
          </label>
          <select
            value={selectedStore ?? ''}
            onChange={(e) => onStoreChange(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-brand-cyan hover:border-slate-600 transition-colors"
          >
            <option value="">All Stores (Chain-wide)</option>
            {storeOptions.map((st) => (
              <option key={st} value={st}>
                Store {st}
              </option>
            ))}
          </select>
        </div>

        {/* Item Selector */}
        {showItemFilter && (
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 flex items-center">
              <Package className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Item:
            </label>
            <select
              value={selectedItem ?? ''}
              onChange={(e) => onItemChange(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-brand-cyan hover:border-slate-600 transition-colors"
            >
              <option value="">All Items (Top Aggregated)</option>
              {itemOptions.map((it) => (
                <option key={it} value={it}>
                  Item {it}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1.5 bg-surface-hover hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-surface-border transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Data Calculations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-cyan' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
};
