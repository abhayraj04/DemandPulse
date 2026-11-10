import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  SlidersHorizontal,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Tag,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  TrendingUp,
  X,
  Check,
} from 'lucide-react';

import { api } from '../services/api';
import { ProductCatalogItem } from '../types/api';
import { formatINR, formatIndianNumber } from '../utils/formatters';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const ProductCatalogPage: React.FC<{
  onSelectProductForForecast?: (itemId: number) => void;
}> = ({ onSelectProductForForecast }) => {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'available' | 'catalog_only'>('all');

  // Edit Price Modal / Drawer State
  const [editingProduct, setEditingProduct] = useState<ProductCatalogItem | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fetchCatalog = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getCatalogProducts({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchTerm.trim() ? searchTerm.trim() : undefined,
        forecast_only: selectedAvailability === 'available' ? true : undefined,
      });

      let list: ProductCatalogItem[] = res.products || [];
      if (selectedAvailability === 'catalog_only') {
        list = list.filter((p) => p.forecast_availability === 'Catalog Only');
      }

      setProducts(list);
      if (res.categories && res.categories.length > 0) {
        setCategories(res.categories);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load product catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, selectedAvailability]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenEditPrice = (prod: ProductCatalogItem) => {
    setEditingProduct(prod);
    setNewPrice(prod.configured_price_inr?.toString() || prod.unit_price.toString());
    setSaveSuccessMsg(null);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.product_id) return;
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid positive price in INR (₹).');
      return;
    }

    try {
      setIsSavingPrice(true);
      const res = await api.updateProductPrice(editingProduct.product_id, priceNum);
      setSaveSuccessMsg(`Price updated to ₹${priceNum.toFixed(2)}`);
      
      // Update local state
      setProducts((prev) =>
        prev.map((p) => (p.product_id === editingProduct.product_id ? { ...p, ...res.product } : p))
      );

      setTimeout(() => {
        setEditingProduct(null);
        setSaveSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to update configured price.');
    } finally {
      setIsSavingPrice(false);
    }
  };

  const availableCount = products.filter((p) => p.forecast_availability === 'Available').length;
  const catalogOnlyCount = products.filter((p) => p.forecast_availability === 'Catalog Only').length;

  return (
    <div className="space-y-6">
      {/* Educational Data Architecture & Transparency Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-navy-900 via-navy-850 to-slate-900 border border-brand-cyan/20 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/15 text-brand-cyan flex items-center justify-center font-bold">
              ₹
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Indian Retail Product Catalog & Configured Pricing Layer
              </h2>
              <p className="text-xs text-slate-400">
                100 FMCG SKUs mapped across 7 retail categories with configurable demonstration prices in Indian Rupees (₹)
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Transparent Business Mapping
          </span>
        </div>

        {/* 4 Pillars of Data Integrity */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-navy-950/70 border border-surface-border space-y-1">
            <span className="text-brand-cyan font-bold block uppercase text-[10px] tracking-wider">1. Original Data</span>
            <p className="text-slate-300 text-[11px]">
              913,000 historical daily transaction units from Kaggle benchmark time series.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-navy-950/70 border border-surface-border space-y-1">
            <span className="text-brand-purple font-bold block uppercase text-[10px] tracking-wider">2. Illustrative Layer</span>
            <p className="text-slate-300 text-[11px]">
              Indian FMCG brand names and 10 metro city store mappings illustrate practical SaaS deployment.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-navy-950/70 border border-surface-border space-y-1">
            <span className="text-brand-amber font-bold block uppercase text-[10px] tracking-wider">3. Configured Pricing</span>
            <p className="text-slate-300 text-[11px]">
              Editable demonstration prices in Indian Rupees (₹). Modify any SKU price below.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-navy-950/70 border border-surface-border space-y-1">
            <span className="text-brand-emerald font-bold block uppercase text-[10px] tracking-wider">4. Calculated Metrics</span>
            <p className="text-slate-300 text-[11px]">
              Estimated Revenue = Historical Sales Units × Configured Demo Unit Price.
            </p>
          </div>
        </div>
      </div>

      {/* Catalog Search & Filtering Header */}
      <div className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Product Name, ID (e.g. P001), Brand, Category, Size..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-navy-850 text-slate-200 pl-9 pr-3 py-2 text-xs rounded-lg border border-surface-border placeholder-slate-500 focus:outline-none focus:border-brand-cyan"
            />
          </div>

          {/* Forecast Availability Filter Tabs */}
          <div className="flex items-center space-x-1 bg-navy-900 p-1 rounded-lg border border-surface-border text-xs">
            <button
              onClick={() => setSelectedAvailability('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                selectedAvailability === 'all'
                  ? 'bg-brand-cyan text-navy-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All SKUs (100)
            </button>
            <button
              onClick={() => setSelectedAvailability('available')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1 ${
                selectedAvailability === 'available'
                  ? 'bg-brand-emerald text-navy-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Forecast Available (P001–P050)</span>
            </button>
            <button
              onClick={() => setSelectedAvailability('catalog_only')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1 ${
                selectedAvailability === 'catalog_only'
                  ? 'bg-brand-amber text-navy-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Catalog Only (P051–P100)</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-[11px] font-medium ${
              selectedCategory === 'all'
                ? 'bg-slate-700 text-white font-semibold'
                : 'bg-navy-900 text-slate-400 hover:text-slate-200 border border-surface-border'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-[11px] font-medium ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 font-semibold'
                  : 'bg-navy-900 text-slate-400 hover:text-slate-200 border border-surface-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Product Master Directory ({products.length} Products Found)
            </h3>
            <p className="text-xs text-slate-400">
              Showing configured demo prices in Indian Rupees (₹). Click "Edit Price" on any product to adjust.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-navy-900 px-3 py-1 rounded-lg border border-surface-border">
            Estimated based on configured demo prices
          </span>
        </div>

        {isLoading ? (
          <LoadingSkeleton rows={6} height="h-16" />
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No products match the selected search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Product ID & Name</th>
                  <th className="py-3 px-3">Brand</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Package Size</th>
                  <th className="py-3 px-3 text-right">Configured Demo Price (₹)</th>
                  <th className="py-3 px-3 text-center">Forecast Availability</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border font-mono">
                {products.map((p) => {
                  const isAvailable = p.forecast_availability === 'Available';

                  return (
                    <tr
                      key={p.product_id}
                      className="hover:bg-navy-900/60 transition-colors group"
                    >
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-navy-950 text-brand-cyan border border-surface-border font-bold">
                            {p.product_id}
                          </span>
                          <span className="font-semibold text-white group-hover:text-brand-cyan transition-colors">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-sans">
                        {p.brand}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-navy-900 text-slate-300 border border-surface-border">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-sans">
                        {p.package_size || 'Standard Pack'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-brand-emerald">
                        {formatINR(p.configured_price_inr ?? p.unit_price)}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        {isAvailable ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center w-fit mx-auto">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Available
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center w-fit mx-auto" title="No historical time-series in benchmark dataset">
                            Catalog Only
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEditPrice(p)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium flex items-center space-x-1 transition-colors"
                            title="Edit configured demonstration price in INR"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Price</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Price Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-brand-cyan" />
                <h3 className="text-sm font-bold text-white">
                  Edit Configured Demo Price (₹)
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-navy-850"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-brand-cyan font-bold">{editingProduct.product_id}</span>
                <span className="text-white font-semibold">{editingProduct.name}</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Brand: <span className="text-slate-200">{editingProduct.brand}</span> • Category: <span className="text-slate-200">{editingProduct.category}</span>
              </p>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Unit Price in Indian Rupees (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-navy-900 text-white pl-8 pr-3 py-2 text-sm font-mono rounded-lg border border-surface-border focus:outline-none focus:border-brand-cyan"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  Note: Updating this price will dynamically recalculate estimated revenues and reorder costs across the platform.
                </p>
              </div>

              {saveSuccessMsg && (
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-850 text-slate-300 text-xs font-medium border border-surface-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPrice}
                  className="px-4 py-1.5 rounded-lg bg-brand-cyan hover:bg-cyan-400 text-navy-950 text-xs font-bold transition-colors flex items-center space-x-1.5 shadow"
                >
                  <span>{isSavingPrice ? 'Saving...' : 'Save Price'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
