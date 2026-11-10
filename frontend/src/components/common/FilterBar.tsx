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
  productCatalog?: { item_id: number | null; name: string; sku?: string; category?: string }[];
  storeRegistry?: { store_id: number; name: string; short_name?: string; city?: string }[];
}

const DEFAULT_INDIAN_STORES: Record<number, string> = {
  1: 'Store 1 — Hyderabad',
  2: 'Store 2 — Bengaluru',
  3: 'Store 3 — Mumbai',
  4: 'Store 4 — Delhi',
  5: 'Store 5 — Pune',
  6: 'Store 6 — Chennai',
  7: 'Store 7 — Kolkata',
  8: 'Store 8 — Ahmedabad',
  9: 'Store 9 — Jaipur',
  10: 'Store 10 — Patna',
};

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
  productCatalog,
  storeRegistry,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface-card border border-surface-border rounded-xl shadow-md">
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <SlidersHorizontal className="w-4 h-4 text-brand-cyan" />
        <span>Enterprise Filters</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Store Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 flex items-center">
            <Store className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Location:
          </label>
          <select
            value={selectedStore ?? ''}
            onChange={(e) => onStoreChange(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-brand-cyan hover:border-slate-600 transition-colors max-w-[210px] truncate"
          >
            <option value="">All Stores (National Chain)</option>
            {storeOptions.map((st) => {
              const info = storeRegistry?.find((s) => s.store_id === st);
              const label = info ? `${st}. ${info.short_name || info.city || info.name}` : (DEFAULT_INDIAN_STORES[st] || `Store ${st}`);
              return (
                <option key={st} value={st}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        {/* Item Selector */}
        {showItemFilter && (
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 flex items-center">
              <Package className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Product SKU:
            </label>
            <select
              value={selectedItem ?? ''}
              onChange={(e) => onItemChange(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-navy-850 text-slate-200 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-brand-cyan hover:border-slate-600 transition-colors max-w-[250px] truncate"
            >
              <option value="">All SKUs (Aggregated)</option>
              {itemOptions.map((it) => {
                const prod = productCatalog?.find((p) => p.item_id === it);
                const label = prod ? `#${it} • ${prod.name}` : `Item #${it}`;
                return (
                  <option key={it} value={it}>
                    {label}
                  </option>
                );
              })}
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
