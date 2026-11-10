import {
  ExecutiveOverview,
  DetailedSalesAnalytics,
  TimeSeriesDecomposition,
  ForecastModelInfo,
  ForecastResponse,
  ModelPerformanceResult,
  InventoryRecommendationResponse,
  BusinessInsight,
  DatasetStatus
} from '../types/api';

const API_BASE = '/api';

export const api = {
  // System Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Dataset Management
  async getDatasetStatus(): Promise<DatasetStatus> {
    const res = await fetch(`${API_BASE}/dataset/status`);
    if (!res.ok) throw new Error('Failed to fetch dataset status');
    return res.json();
  },

  async getDatasetQualityReport(): Promise<any> {
    const res = await fetch(`${API_BASE}/dataset/quality`);
    if (!res.ok) throw new Error('Failed to fetch quality report');
    return res.json();
  },

  async uploadDataset(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/dataset/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload dataset');
    }
    return res.json();
  },

  // Executive Overview
  async getOverview(params?: { store?: number; item?: number }): Promise<ExecutiveOverview> {
    const query = new URLSearchParams();
    if (params?.store) query.set('store', params.store.toString());
    if (params?.item) query.set('item', params.item.toString());
    const res = await fetch(`${API_BASE}/overview?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch executive overview');
    return res.json();
  },

  // Sales Analytics
  async getDetailedSalesAnalytics(params?: { store?: number; item?: number }): Promise<DetailedSalesAnalytics> {
    const query = new URLSearchParams();
    if (params?.store) query.set('store', params.store.toString());
    if (params?.item) query.set('item', params.item.toString());
    const res = await fetch(`${API_BASE}/sales/analytics?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch sales analytics');
    return res.json();
  },

  async getSalesTrends(params?: { store?: number; item?: number; granularity?: 'daily' | 'weekly' | 'monthly' }) {
    const query = new URLSearchParams();
    if (params?.store) query.set('store', params.store.toString());
    if (params?.item) query.set('item', params.item.toString());
    if (params?.granularity) query.set('granularity', params.granularity);
    const res = await fetch(`${API_BASE}/sales/trends?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch sales trends');
    return res.json();
  },

  async getProductRankings(store?: number) {
    const query = new URLSearchParams();
    if (store) query.set('store', store.toString());
    const res = await fetch(`${API_BASE}/sales/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getStoreRankings() {
    const res = await fetch(`${API_BASE}/sales/stores`);
    if (!res.ok) throw new Error('Failed to fetch stores');
    return res.json();
  },

  async getCategories(store?: number) {
    const query = new URLSearchParams();
    if (store) query.set('store', store.toString());
    const res = await fetch(`${API_BASE}/sales/categories?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getCatalogProducts(params?: { category?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const res = await fetch(`${API_BASE}/catalog/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch product catalog');
    return res.json();
  },

  async getCatalogStores(region?: string) {
    const query = new URLSearchParams();
    if (region) query.set('region', region);
    const res = await fetch(`${API_BASE}/catalog/stores?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch store profiles');
    return res.json();
  },

  // Time-Series Explorer
  async getTimeSeriesDecomposition(params: {
    store?: number;
    item?: number;
    period?: number;
    model_type?: 'additive' | 'multiplicative';
  }): Promise<TimeSeriesDecomposition> {
    const query = new URLSearchParams();
    if (params.store) query.set('store', params.store.toString());
    if (params.item) query.set('item', params.item.toString());
    if (params.period) query.set('period', params.period.toString());
    if (params.model_type) query.set('model_type', params.model_type);
    const res = await fetch(`${API_BASE}/timeseries/decomposition?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to decompose time series');
    return res.json();
  },

  // Forecasting Lab
  async getForecastModels(): Promise<{ models: ForecastModelInfo[] }> {
    const res = await fetch(`${API_BASE}/forecast/models`);
    if (!res.ok) throw new Error('Failed to fetch models');
    return res.json();
  },

  async getForecast(params: {
    store: number;
    item: number;
    model_id: string;
    horizon: number;
  }): Promise<ForecastResponse> {
    const query = new URLSearchParams({
      store: params.store.toString(),
      item: params.item.toString(),
      model_id: params.model_id,
      horizon: params.horizon.toString(),
    });
    const res = await fetch(`${API_BASE}/forecast?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to generate forecast');
    return res.json();
  },

  // Model Performance Center
  async getModelPerformance(params: {
    store: number;
    item: number;
    horizon: number;
  }): Promise<ModelPerformanceResult> {
    const query = new URLSearchParams({
      store: params.store.toString(),
      item: params.item.toString(),
      horizon: params.horizon.toString(),
    });
    const res = await fetch(`${API_BASE}/models/performance?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to evaluate models');
    return res.json();
  },

  // Inventory Intelligence
  async getInventoryRecommendations(params: {
    store: number;
    lead_time_days: number;
    target_service_level: number;
    top_n_items?: number;
    current_stock_override?: number;
  }): Promise<InventoryRecommendationResponse> {
    const res = await fetch(`${API_BASE}/inventory/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to calculate inventory recommendations');
    return res.json();
  },

  // AI Business Insights
  async getInsights(params?: { store?: number; item?: number }): Promise<{ insights: BusinessInsight[] }> {
    const query = new URLSearchParams();
    if (params?.store) query.set('store', params.store.toString());
    if (params?.item) query.set('item', params.item.toString());
    const res = await fetch(`${API_BASE}/insights?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch AI insights');
    return res.json();
  },
};
