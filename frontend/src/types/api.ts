export interface ProductCatalogItem {
  product_id?: string;
  item_id: number | null;
  name: string;
  category: string;
  brand: string;
  package_size?: string;
  configured_price_inr?: number;
  unit_price: number;
  unit_cost: number;
  margin_pct: number;
  lead_time_days?: number;
  moq?: number;
  supplier?: string;
  sku: string;
  forecast_availability: 'Available' | 'Catalog Only';
}

export interface StoreProfile {
  store_id: number;
  name: string;
  short_name: string;
  city: string;
  state: string;
  region: string;
  sqft: number;
  warehouse_hub: string;
  manager: string;
  tier: string;
  illustrative?: boolean;
}

export interface ExecutiveOverview {
  total_units_sold: number;
  number_of_stores: number;
  number_of_products: number;
  average_daily_sales: number;
  highest_selling_product: number | null;
  best_performing_store: number | null;
  sales_growth_pct: number;
  estimated_gross_revenue?: number;
  estimated_gross_profit?: number;
  average_gross_margin_pct?: number;
  currency?: string;
  currency_symbol?: string;
  revenue_disclaimer?: string;
  data_architecture_note?: string;
  top_product_details?: ProductCatalogItem;
  top_store_details?: StoreProfile;
  monthly_trend: { date: string; sales: number }[];
  daily_trend: { date: string; sales: number }[];
  top_products: {
    item: string;
    item_id: number;
    sales: number;
    product_id?: string;
    product_name?: string;
    category?: string;
    brand?: string;
    package_size?: string;
    sku?: string;
    unit_price?: number;
    configured_price_inr?: number;
    revenue?: number;
  }[];
  store_comparison: {
    store: string;
    store_id: number;
    sales: number;
    store_name?: string;
    city?: string;
    state?: string;
    region?: string;
  }[];
}

export interface DetailedSalesAnalytics {
  summary_stats: {
    mean_sales: number;
    median_sales: number;
    std_deviation: number;
    variance: number;
    coefficient_of_variation: number;
    min_sales: number;
    max_sales: number;
    p25: number;
    p75: number;
    total_volume: number;
  };
  weekly_pattern: { day: string; avg_sales: number }[];
  monthly_pattern: { month: string; avg_sales: number }[];
  top_performers: { item: string; item_id: number; total_sales: number; avg_sales: number }[];
  bottom_performers: { item: string; item_id: number; total_sales: number; avg_sales: number }[];
  sales_distribution: { bin_range: string; count: number; percentage: number }[];
  yearly_comparison: { year: number; total_sales: number; avg_daily_sales: number }[];
}

export interface TimeSeriesDecomposition {
  model_type: string;
  period: number;
  sample_size: number;
  dates: string[];
  observed: number[];
  trend: (number | null)[];
  seasonal: number[];
  residual: (number | null)[];
  rolling_metrics: {
    date: string;
    actual: number;
    ma_7: number;
    ma_30: number;
    std_7: number;
  }[];
  acf_pacf: {
    lag: number;
    acf: number;
    pacf: number;
  }[];
  stationarity: {
    test_name: string;
    test_statistic: number;
    p_value: number;
    is_stationary: boolean;
    critical_values: Record<string, number>;
    interpretation: string;
  };
  explanations: {
    trend: string;
    seasonality: string;
    residual: string;
    acf: string;
  };
}

export interface ForecastModelInfo {
  id: string;
  name: string;
  type: string;
  description: string;
  recommended: boolean;
}

export interface ForecastResponse {
  store: number;
  store_name?: string;
  item: number;
  product_name?: string;
  sku?: string;
  category?: string;
  brand?: string;
  unit_price?: number;
  unit_cost?: number;
  margin_pct?: number;
  model_id: string;
  model_name: string;
  horizon_days: number;
  forecast_date: string;
  training_time_seconds: number;
  metrics: {
    mae: number;
    rmse: number;
    mape: number;
    wape: number;
    r2: number;
    mean_residual: number;
    std_residual: number;
  };
  summary: {
    total_predicted_units: number;
    avg_daily_forecast: number;
    peak_daily_forecast: number;
    predicted_revenue?: number;
    predicted_cost?: number;
    predicted_gross_profit?: number;
  };
  history: { date: string; sales: number; is_forecast: boolean }[];
  forecast: {
    date: string;
    predicted_sales: number;
    lower_bound: number;
    upper_bound: number;
    is_forecast: boolean;
  }[];
  combined_series: any[];
  disclaimer: string;
}

export interface ModelPerformanceResult {
  store: number;
  item: number;
  test_horizon_days: number;
  evaluation_window: { start: string; end: string };
  best_model: string;
  leaderboard: {
    model: string;
    mae: number;
    rmse: number;
    mape: number;
    wape: number;
    r2: number;
  }[];
  comparison_points: {
    date: string;
    actual: number;
    [key: string]: any;
  }[];
  best_model_residuals: number[];
  validation_strategy: string;
}

export interface InventoryItemRecommendation {
  item_id: number;
  product_id?: string;
  item_name: string;
  sku?: string;
  category?: string;
  brand?: string;
  package_size?: string;
  unit_price?: number;
  unit_cost?: number;
  margin_pct?: number;
  store_id: number;
  current_stock: number;
  stock_value_usd?: number;
  stock_value_inr?: number;
  avg_daily_demand: number;
  safety_stock: number;
  reorder_point: number;
  days_remaining: number;
  suggested_order: number;
  suggested_order_cost_usd?: number;
  suggested_order_cost_inr?: number;
  revenue_at_risk_usd?: number;
  revenue_at_risk_inr?: number;
  eoq?: number;
  status: "CRITICAL_STOCKOUT_RISK" | "REORDER_REQUIRED" | "HEALTHY" | "EXCESS_INVENTORY";
  severity: "high" | "medium" | "normal" | "low";
  alert_message: string;
  forecast_availability?: string;
}

export interface InventoryRecommendationResponse {
  store: number;
  store_name?: string;
  lead_time_days: number;
  target_service_level: number;
  currency?: string;
  currency_symbol?: string;
  summary: {
    total_items_analyzed: number;
    critical_stockout_risks: number;
    reorders_needed: number;
    healthy_levels: number;
    total_suggested_reorder_units: number;
    total_suggested_reorder_cost_usd?: number;
    total_suggested_reorder_cost_inr?: number;
    total_revenue_at_risk_usd?: number;
    total_revenue_at_risk_inr?: number;
    total_working_capital_held_usd?: number;
    total_working_capital_held_inr?: number;
  };
  recommendations: InventoryItemRecommendation[];
  disclaimer: string;
}

export interface BusinessInsight {
  id: string;
  category: string;
  title: string;
  explanation: string;
  supporting_metric: string;
  target_entity: string;
  severity: "high" | "medium" | "positive" | "info";
  actionable_recommendation: string;
}

export interface DatasetStatus {
  dataset_available: boolean;
  raw_file_exists: boolean;
  raw_file_path: string;
  raw_file_size_bytes: number;
  clean_file_exists: boolean;
  total_records: number;
  stores: number[];
  items: number[];
  date_range: {
    start: string | null;
    end: string | null;
    total_days: number;
  } | null;
  dataset_source: string;
  source_url: string;
}
