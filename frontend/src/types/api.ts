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
  date_range: { min_date: string; max_date: string; total_days: number };
  file_format_valid: boolean;
}

export interface ProductIntelligenceItem {
  item_id: number;
  product_id: string;
  product_name: string;
  brand: string;
  category: string;
  package_size: string;
  configured_price_inr: number;
  overall_score: number;
  tier: 'High Opportunity' | 'Strong Performance' | 'Monitor' | 'High Risk';
  tier_badge: 'emerald' | 'cyan' | 'amber' | 'rose';
  summary_desc: string;
  rank: number;
  components: {
    sales_growth: { score: number; max: number; label: string; metric: string };
    demand_consistency: { score: number; max: number; label: string; metric: string };
    volume_pace: { score: number; max: number; label: string; metric: string };
    stability: { score: number; max: number; label: string; metric: string };
    inventory_alignment: { score: number; max: number; label: string; metric: string };
  };
  recent_annual_units: number;
  growth_rate_pct: number;
  avg_daily_demand: number;
}

export interface RiskItem {
  item_id: number;
  product_id: string;
  product_name: string;
  brand: string;
  category: string;
  package_size: string;
  configured_price_inr: number;
  unit_cost_inr: number;
  risk_score: number;
  risk_level: 'High Risk' | 'Medium Risk' | 'Low Risk';
  risk_badge: 'rose' | 'amber' | 'emerald';
  current_stock: number;
  safety_stock: number;
  reorder_point: number;
  lead_time_demand: number;
  days_remaining: number;
  avg_daily_demand: number;
  volatility_cv: number;
  momentum_pct: number;
  suggested_order: number;
  reorder_cost_inr: number;
  revenue_at_risk_inr: number;
  explanation: string;
  recommended_action: string;
}

export interface RiskEngineResponse {
  store: number;
  store_name: string;
  city: string;
  lead_time_days: number;
  service_level: number;
  summary: {
    total_items_evaluated: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
    total_revenue_at_risk_inr: number;
    overall_risk_index: number;
  };
  items: RiskItem[];
  disclaimer: string;
}

export interface AnomalyItem {
  date: string;
  store_id: number | null;
  store_name: string;
  city: string;
  item_id: number | null;
  product_id: string | null;
  product_name: string;
  actual_sales: number;
  expected_mean: number;
  expected_lower: number;
  expected_upper: number;
  z_score: number;
  deviation_pct: number;
  severity: 'Critical Spike' | 'Critical Drop' | 'Moderate Spike' | 'Moderate Drop';
  severity_badge: 'rose' | 'amber' | 'cyan' | 'slate';
  direction: 'positive' | 'negative';
  explanation: string;
}

export interface AnomalyDetectionResponse {
  store: number | null;
  item: number | null;
  window_days: number;
  threshold_z: number;
  summary: {
    total_anomalies_detected: number;
    spikes_count: number;
    drops_count: number;
    max_z_score: number;
  };
  anomalies: AnomalyItem[];
  disclaimer: string;
}

export interface HeatmapCell {
  row: string;
  column: string;
  value: number;
  intensity: number;
  item_id?: number;
  store_id?: number;
  product_name?: string;
  city?: string;
  label: string;
}

export interface DemandHeatmapResponse {
  matrix_type: string;
  title: string;
  subtitle: string;
  rows: string[];
  columns: string[];
  min_val: number;
  max_val: number;
  cells: HeatmapCell[];
}

export interface CalendarDay {
  day_index: number;
  date: string;
  day_name: string;
  short_date: string;
  predicted_units: number;
  lower_bound: number;
  upper_bound: number;
  cumulative_demand: number;
  projected_remaining_stock: number;
  intensity: 'Peak Spike' | 'Normal Demand' | 'Low Demand';
  intensity_badge: 'amber' | 'cyan' | 'slate';
  is_weekend: boolean;
  is_stockout_risk: boolean;
}

export interface ForecastCalendarResponse {
  store: number;
  store_name: string;
  city: string;
  item: number;
  product_id: string;
  product_name: string;
  category: string;
  brand: string;
  configured_price_inr: number;
  model_used: string;
  horizon_days: number;
  starting_stock: number;
  total_forecast_units: number;
  estimated_forecast_revenue_inr: number;
  avg_daily_demand: number;
  stockout_depletion_date: string | null;
  stockout_days_from_today: number | null;
  calendar_days: CalendarDay[];
  disclaimer: string;
}

export interface DataScienceLabResponse {
  data_quality_audit: {
    total_records: number;
    missing_values: number;
    duplicate_records: number;
    date_range: string;
    time_span_years: number;
    unique_stores: number;
    unique_items: number;
    completeness_pct: number;
    quality_status: string;
  };
  feature_engineering_architecture: {
    calendar_features: string[];
    lag_features: string[];
    rolling_window_features: string[];
    leakage_prevention_method: string;
    recent_sample: any[];
  };
  model_explainability: {
    algorithm: string;
    hyperparameters: Record<string, any>;
    feature_importance: {
      feature: string;
      importance_score: number;
      importance_pct: number;
      category: string;
      analytical_insight: string;
    }[];
    top_predictor: string;
    recruiter_takeaway: string;
  };
  validation_methodology: {
    strategy: string;
    train_window: string;
    test_window: string;
    leakage_guarantee: string;
  };
}
