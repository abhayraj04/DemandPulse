#!/usr/bin/env python3
"""DemandPulse — Enterprise AI Retail Forecasting & Inventory CLI
Standalone command-line interface for ML time-series forecasting,
inventory risk audits, anomaly detection, and executive reporting.
"""

import sys
import os
import argparse
import warnings
from datetime import datetime
from tabulate import tabulate

# Suppress statsmodels frequency warnings for clean CLI output
warnings.filterwarnings("ignore")

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Enable UTF-8 console output for Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from backend.data.loader import get_data_loader
from backend.data.catalog import get_product, get_store, get_all_stores, get_all_products
from backend.forecasting.forecast_service import get_forecast_service
from backend.forecasting.evaluation import evaluate_forecast
from backend.inventory.recommendations import get_inventory_recommendations
from backend.inventory.risk_engine import evaluate_demand_and_inventory_risks
from backend.inventory.abc_xyz import calculate_abc_xyz_analysis
from backend.analytics.anomaly_detection import detect_sales_anomalies
from backend.analytics.product_intelligence import calculate_product_intelligence_scores

# Terminal Colors
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def print_banner():
    banner = f"""{CYAN}{BOLD}
  ____                               _ ____        _           
 |  _ \\  ___ _ __ ___   __ _ _ __   __| |  _ \\ _   _| |___  ___ 
 | | | |/ _ \\ '_ ` _ \\ / _` | '_ \\ / _` | |_) | | | | / __|/ _ \\
 | |_| |  __/ | | | | | (_| | | | | (_| |  __/| |_| | \\__ \\  __/
 |____/ \\___|_| |_| |_|\\__,_|_| |_|\\__,_|_|    \\__,_|_|___/\\___|
{RESET}{DIM}  Enterprise AI Retail Demand Forecasting & Inventory Intelligence Platform
  Localized for Indian Retail (10 Metro Stores | 100 FMCG SKUs | Kaggle 913k Rows){RESET}
"""
    print(banner)


def format_inr(val: float) -> str:
    """Format numeric amount into INR currency."""
    if val >= 10_000_000:
        return f"₹{val / 10_000_000:.2f} Cr"
    elif val >= 100_000:
        return f"₹{val / 100_000:.2f} Lakh"
    return f"₹{val:,.2f}"


def cmd_status(args):
    """Display platform dataset health and statistics."""
    loader = get_data_loader()
    status = loader.get_status()
    meta = loader.get_metadata() or {}
    
    print(f"\n{BOLD}=== DEMANDPULSE DATASET & PLATFORM HEALTH ==={RESET}")
    print(f"Status:            {GREEN if status.get('dataset_available') else RED}{'ACTIVE' if status.get('dataset_available') else 'OFFLINE'}{RESET}")
    print(f"Verified Records:  {status.get('total_records', 0):,} daily sales observations")
    print(f"Dataset Source:    Kaggle Store Item Demand Forecasting Benchmark")
    
    dr = status.get("date_range") or {}
    print(f"Date Span:         {dr.get('start', 'N/A')} to {dr.get('end', 'N/A')} ({dr.get('total_days', 0)} days / 5 full years)")
    print(f"Stores Configured: {len(status.get('stores', []))} Indian Metro Hubs (Hyderabad, Bengaluru, Mumbai, Delhi, ...)")
    print(f"Product Catalog:   100 Verified FMCG SKUs (Staples, Dairy, Snacks, Beverages, Personal Care)")
    print(f"Engine Version:    DemandPulse v2.0.0 (FastAPI + React 18 + XGBoost + SARIMA)")
    print()


def cmd_forecast(args):
    """Generate time-series forecast for a store and SKU."""
    service = get_forecast_service()
    store_meta = get_store(args.store)
    product_meta = get_product(args.item)
    
    print(f"\n{BOLD}{CYAN}=== RUNNING FORECAST ENGINE ==={RESET}")
    print(f"Store:   Store {args.store} — {store_meta.get('city')} ({store_meta.get('state')})")
    print(f"Product: {product_meta.get('product_id')} • {product_meta.get('name')} [{product_meta.get('category')}]")
    print(f"Price:   {format_inr(product_meta.get('unit_price', 0))} (Configured demo price)")
    print(f"Model:   {args.model.upper()} | Horizon: {args.horizon} Days\n")

    res = service.generate_forecast(
        store=args.store,
        item=args.item,
        model_id=args.model,
        horizon=args.horizon
    )

    if "error" in res:
        print(f"{RED}Error:{RESET} {res['error']}")
        return

    # Validation Metrics Table
    val = res.get("metrics", {})
    metrics_table = [
        ["MAE (Mean Absolute Error)", f"{val.get('mae', 0):.2f} units"],
        ["RMSE (Root Mean Sq. Error)", f"{val.get('rmse', 0):.2f} units"],
        ["WAPE (Weighted Abs. % Error)", f"{BOLD}{val.get('wape', 0):.2f}%{RESET}"],
        ["MAPE (Mean Abs. % Error)", f"{val.get('mape', 0):.2f}%"],
        ["R² Score (Goodness of Fit)", f"{val.get('r2', 0):.4f}"],
        ["Tracking Signal (TS)", f"{val.get('tracking_signal', 0):.2f} MAD"],
        ["Bias Diagnostic", f"{GREEN if 'Unbiased' in val.get('bias_status', '') else YELLOW}{val.get('bias_status', 'N/A')}{RESET}"],
        ["Training Duration", f"{res.get('training_time_seconds', 0):.3f}s"],
    ]
    print(f"{BOLD}Chronological Holdout Validation Metrics:{RESET}")
    print(tabulate(metrics_table, headers=["Metric", "Value"], tablefmt="rounded_outline"))

    # Forecast preview
    forecast_points = res.get("forecast", [])
    if forecast_points:
        total_forecast_units = sum(p["predicted_sales"] for p in forecast_points)
        est_rev = total_forecast_units * product_meta.get("unit_price", 0)
        
        print(f"\n{BOLD}Forecast Summary ({args.horizon} Days Ahead):{RESET}")
        print(f"Total Projected Units:   {total_forecast_units:,.1f} units")
        print(f"Daily Demand Rate:       {total_forecast_units / args.horizon:.1f} units/day")
        print(f"Estimated Revenue:       {format_inr(est_rev)} (Estimated based on configured demo prices)")

        # First 7 days schedule
        print(f"\n{BOLD}Next 7 Days Schedule:{RESET}")
        sched_rows = []
        for p in forecast_points[:7]:
            sched_rows.append([
                p.get("date"),
                f"{p.get('predicted_sales', 0):.1f} u",
                f"{p.get('lower_bound', 0):.1f} u",
                f"{p.get('upper_bound', 0):.1f} u",
                format_inr(p.get('predicted_sales', 0) * product_meta.get('unit_price', 0))
            ])
        print(tabulate(sched_rows, headers=["Date", "Forecast", "Lower (95%)", "Upper (95%)", "Est. Revenue"], tablefmt="psql"))
    print()


def cmd_benchmark(args):
    """Benchmark all 5 time series models on chronological holdout."""
    service = get_forecast_service()
    store_meta = get_store(args.store)
    product_meta = get_product(args.item)

    print(f"\n{BOLD}{CYAN}=== MODEL PERFORMANCE BENCHMARK LEADERBOARD ==={RESET}")
    print(f"Store:   Store {args.store} — {store_meta.get('city')}")
    print(f"Product: {product_meta.get('product_id')} • {product_meta.get('name')}\n")

    models = ["xgboost", "arima", "exponential_smoothing", "moving_average", "naive"]
    results = []

    for m in models:
        res = service.generate_forecast(store=args.store, item=args.item, model_id=m, horizon=30)
        if "error" not in res:
            val = res.get("metrics", {})
            results.append({
                "model": res.get("model_name", m),
                "wape": val.get("wape", 999.0),
                "mae": val.get("mae", 0),
                "rmse": val.get("rmse", 0),
                "r2": val.get("r2", 0),
                "ts": val.get("tracking_signal", 0),
                "time": f"{res.get('training_time_seconds', 0):.2f}s"
            })

    # Sort by WAPE ascending
    results.sort(key=lambda x: x["wape"])

    table_data = []
    for rank, r in enumerate(results, start=1):
        badge = f"{GREEN}★ BEST{RESET}" if rank == 1 else f"#{rank}"
        table_data.append([
            badge,
            r["model"],
            f"{r['wape']:.2f}%",
            f"{r['mae']:.2f}",
            f"{r['rmse']:.2f}",
            f"{r['r2']:.4f}",
            f"{r['ts']:.2f}",
            r["time"]
        ])

    print(tabulate(table_data, headers=["Rank", "Model", "WAPE", "MAE", "RMSE", "R²", "Tracking Signal", "Latency"], tablefmt="rounded_grid"))
    print(f"\n{GREEN}Automatic Recommendation:{RESET} {results[0]['model']} achieves lowest out-of-sample error ({results[0]['wape']:.2f}% WAPE).")
    print()


def cmd_inventory(args):
    """Run inventory replenishment and stockout audit."""
    store_meta = get_store(args.store)
    print(f"\n{BOLD}{CYAN}=== INVENTORY REPLENISHMENT & RISK AUDIT ==={RESET}")
    print(f"Store:      Store {args.store} — {store_meta.get('city')} ({store_meta.get('state')})")
    print(f"Lead Time:  {args.lead_time} Days | Target Service Level: {args.service_level}%\n")

    rec = get_inventory_recommendations(
        store=args.store,
        lead_time_days=args.lead_time,
        target_service_level=args.service_level,
        top_n_items=args.limit
    )

    summary = rec.get("summary", {})
    kpis = [
        ["Critical Stockout Risk SKUs", f"{RED}{summary.get('critical_stockout_risks', 0)} SKUs{RESET}"],
        ["Reorder Required SKUs", f"{YELLOW}{summary.get('reorders_needed', 0)} SKUs{RESET}"],
        ["Healthy Buffer SKUs", f"{GREEN}{summary.get('healthy_levels', 0)} SKUs{RESET}"],
        ["Total Suggested Reorder Units", f"{summary.get('total_suggested_reorder_units', 0):,} units"],
        ["Suggested Reorder Cost", format_inr(summary.get('total_suggested_reorder_cost_inr', 0))],
        ["Revenue at Immediate Risk", format_inr(summary.get('total_revenue_at_risk_inr', 0))],
    ]
    print(tabulate(kpis, headers=["Executive Indicator", "Quantity / Valuation"], tablefmt="rounded_outline"))

    items = rec.get("recommendations", [])
    if items:
        table_rows = []
        for it in items[:args.limit]:
            status_str = it.get("status", "")
            if status_str == "CRITICAL_STOCKOUT_RISK":
                colored_status = f"{RED}CRITICAL{RESET}"
            elif status_str == "REORDER_REQUIRED":
                colored_status = f"{YELLOW}REORDER{RESET}"
            else:
                colored_status = f"{GREEN}HEALTHY{RESET}"

            table_rows.append([
                it.get("product_id"),
                it.get("item_name")[:24],
                it.get("current_stock"),
                f"{it.get('avg_daily_demand', 0):.1f}",
                it.get("safety_stock"),
                it.get("reorder_point"),
                f"{it.get('days_remaining', 0):.1f} d",
                colored_status,
                f"{it.get('suggested_order', 0)} u",
                format_inr(it.get('suggested_order_cost_inr', 0))
            ])

        print(f"\n{BOLD}Product Replenishment Action Plan:{RESET}")
        print(tabulate(
            table_rows,
            headers=["ID", "Product Name", "Stock", "Demand/d", "Safety", "ROP", "Days Left", "Status", "PO Qty", "Order Cost"],
            tablefmt="psql"
        ))
    print(f"\n{DIM}Note: Stockout risks and order suggestions calculated using lead time and target service levels.{RESET}\n")


def cmd_report(args):
    """Generate executive briefing and optionally export to file."""
    from backend.api.routes.analytics_advanced import get_executive_summary_report_endpoint

    print(f"\n{BOLD}{CYAN}=== GENERATING EXECUTIVE INTELLIGENCE BRIEF ==={RESET}")
    report_data = get_executive_summary_report_endpoint(store=args.store)
    md_content = report_data.get("markdown_report", "")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(md_content)
        print(f"{GREEN}✓ Successfully saved report to {args.output}{RESET}\n")
    else:
        print("\n" + md_content + "\n")


def cmd_anomaly(args):
    """Run anomaly detection for sales deviations."""
    print(f"\n{BOLD}{CYAN}=== RUNNING STATISTICAL ANOMALY DETECTION ==={RESET}")
    print(f"Store: Store {args.store} | SKU: Item {args.item} | Threshold: Z ≥ {args.threshold}\n")

    res = detect_sales_anomalies(
        store=args.store,
        item=args.item,
        threshold_z=args.threshold,
        limit=args.limit
    )

    summary = res.get("summary", {})
    print(f"Analyzed Records:     {summary.get('total_observations_analyzed', 0):,} days")
    print(f"Anomalies Detected:   {RED if summary.get('total_anomalies_detected', 0) > 0 else GREEN}{summary.get('total_anomalies_detected', 0)}{RESET} occurrences")
    print(f"Demand Spikes:        {summary.get('spikes_count', 0)} surges")
    print(f"Demand Contractions:  {summary.get('drops_count', 0)} dips\n")

    anomalies = res.get("anomalies", [])
    if anomalies:
        rows = []
        for a in anomalies[:args.limit]:
            type_badge = f"{GREEN}▲ SPIKE{RESET}" if a.get("direction") == "positive" else f"{RED}▼ DROP{RESET}"
            rows.append([
                a.get("date"),
                a.get("product_name")[:25],
                f"{a.get('actual_sales', 0):.0f} u",
                f"{a.get('expected_mean', 0):.1f} u",
                f"{a.get('z_score', 0):.2f}",
                type_badge,
                a.get("severity")
            ])
        print(tabulate(rows, headers=["Date", "Product", "Actual", "Expected Mean", "Z-Score", "Type", "Severity"], tablefmt="psql"))
    else:
        print(f"{GREEN}No statistical anomalies exceeding Z ≥ {args.threshold} found in selected historical window.{RESET}")
    print()


def cmd_abc_xyz(args):
    """Run ABC-XYZ inventory segmentation analysis."""
    store_meta = get_store(args.store) if args.store else {"name": "National", "city": "All Metro Hubs"}
    print(f"\n{BOLD}{CYAN}=== ABC-XYZ INVENTORY SEGMENTATION MATRIX ==={RESET}")
    print(f"Scope: {store_meta.get('name')} ({store_meta.get('city')})\n")

    res = calculate_abc_xyz_analysis(store=args.store)
    if "error" in res:
        print(f"{RED}Error:{RESET} {res['error']}")
        return

    summary = res.get("summary", {})
    abc_dist = summary.get("abc_distribution", {})
    xyz_dist = summary.get("xyz_distribution", {})

    # Overview Breakdown Table
    summary_table = [
        ["Class A (High Value - 80% Rev)", f"{abc_dist.get('A', {}).get('count', 0)} SKUs ({abc_dist.get('A', {}).get('pct_skus', 0):.1f}%)", format_inr(abc_dist.get('A', {}).get('revenue_inr', 0)), f"{abc_dist.get('A', {}).get('revenue_share_pct', 0):.1f}%", "Tightest control, daily review"],
        ["Class B (Medium Value - 15% Rev)", f"{abc_dist.get('B', {}).get('count', 0)} SKUs ({abc_dist.get('B', {}).get('pct_skus', 0):.1f}%)", format_inr(abc_dist.get('B', {}).get('revenue_inr', 0)), f"{abc_dist.get('B', {}).get('revenue_share_pct', 0):.1f}%", "Standard control, periodic review"],
        ["Class C (Low Value - 5% Rev)", f"{abc_dist.get('C', {}).get('count', 0)} SKUs ({abc_dist.get('C', {}).get('pct_skus', 0):.1f}%)", format_inr(abc_dist.get('C', {}).get('revenue_inr', 0)), f"{abc_dist.get('C', {}).get('revenue_share_pct', 0):.1f}%", "Bulk replenishment, two-bin system"],
    ]
    print(f"{BOLD}Pareto Revenue Value Distribution (ABC):{RESET}")
    print(tabulate(summary_table, headers=["Classification", "SKU Count (%)", "Revenue Total", "Revenue Share", "Governance Policy"], tablefmt="rounded_outline"))

    # Volatility Distribution (XYZ)
    print(f"\n{BOLD}Demand Volatility Distribution (XYZ):{RESET}")
    print(f"  • {GREEN}Class X (Constant / CV ≤ 0.35):{RESET} {xyz_dist.get('X', 0)} SKUs (High predictability, low safety buffer)")
    print(f"  • {YELLOW}Class Y (Variable / 0.35 < CV ≤ 0.55):{RESET} {xyz_dist.get('Y', 0)} SKUs (Moderate volatility, seasonal buffer)")
    print(f"  • {RED}Class Z (Erratic / CV > 0.55):{RESET} {xyz_dist.get('Z', 0)} SKUs (High uncertainty, dynamic safety stock)\n")

    # 9-Segment Grid
    matrix = res.get("matrix_grid", {})
    matrix_rows = []
    for seg_key in ["AX", "AY", "AZ", "BX", "BY", "BZ", "CX", "CY", "CZ"]:
        seg_data = matrix.get(seg_key, {})
        matrix_rows.append([
            f"{BOLD}{seg_key}{RESET}",
            f"{seg_data.get('count', 0)} SKUs",
            format_inr(seg_data.get('total_revenue', 0)),
            f"{seg_data.get('revenue_share_pct', 0):.1f}%",
            seg_data.get("priority", "N/A"),
            seg_data.get("strategy", "")[:45] + "...",
        ])

    print(f"{BOLD}9-Quadrant Supply Chain Strategy Matrix:{RESET}")
    print(tabulate(matrix_rows, headers=["Segment", "SKU Count", "Revenue", "Share %", "Priority", "Recommended Replenishment Strategy"], tablefmt="psql"))

    # Top A-Class Items
    print(f"\n{BOLD}Top Class-A Critical SKUs:{RESET}")
    items = res.get("items", [])
    top_a = [x for x in items if x["abc_class"] == "A"][:8]
    a_rows = []
    for it in top_a:
        a_rows.append([
            it.get("product_id"),
            it.get("product_name")[:24],
            format_inr(it.get("unit_price", 0)),
            f"{it.get('avg_daily_demand', 0):.1f} u/d",
            f"{it.get('cv', 0):.2f}",
            f"{BOLD}{it.get('segment')}{RESET}",
            format_inr(it.get("total_revenue", 0)),
            f"{it.get('cumulative_percentage', 0):.1f}%",
            it.get("replenishment_model", ""),
        ])
    print(tabulate(a_rows, headers=["Product", "Name", "Price", "Daily Demand", "CV", "Segment", "Revenue", "Cum %", "Replenishment Model"], tablefmt="rounded_grid"))
    print()


def cmd_export(args):
    """Export forecast, inventory PO, or ABC-XYZ segmentation to CSV."""
    from backend.api.routes.inventory import (
        export_forecast_csv_endpoint,
        export_inventory_po_csv_endpoint,
        export_abc_xyz_csv_endpoint,
    )

    print(f"\n{BOLD}{CYAN}=== DEMANDPULSE CSV DATA EXPORT ==={RESET}")
    export_type = args.type.lower()
    default_filename = ""
    res = None

    if export_type == "forecast":
        res = export_forecast_csv_endpoint(store=args.store, item=args.item, horizon=args.horizon, model_id=args.model)
        default_filename = f"DemandPulse_Forecast_Store{args.store}_Item{args.item}_{args.model}.csv"
    elif export_type == "inventory":
        res = export_inventory_po_csv_endpoint(store=args.store, lead_time_days=args.lead_time)
        default_filename = f"DemandPulse_Replenishment_PO_Store{args.store}.csv"
    elif export_type in ("abc-xyz", "abc"):
        res = export_abc_xyz_csv_endpoint(store=args.store)
        default_filename = f"DemandPulse_ABC_XYZ_Store{args.store or 'National'}.csv"
    else:
        print(f"{RED}Unknown export type:{RESET} {args.type}. Use 'forecast', 'inventory', or 'abc-xyz'.")
        return

    out_path = args.output or default_filename
    with open(out_path, "wb") as f:
        f.write(res.body)

    file_size_kb = os.path.getsize(out_path) / 1024.0
    print(f"{GREEN}✓ Export Successful!{RESET}")
    print(f"File Saved:  {BOLD}{out_path}{RESET}")
    print(f"File Size:   {file_size_kb:.1f} KB")
    print(f"Format:      RFC 4180 Standard CSV\n")


def main():
    print_banner()
    parser = argparse.ArgumentParser(
        description="DemandPulse CLI — AI Retail Forecasting & Inventory Intelligence",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Available Commands")

    # Command: status
    subparsers.add_parser("status", help="Check system health, Kaggle dataset records, and store mappings")

    # Command: forecast
    p_fc = subparsers.add_parser("forecast", help="Generate ML demand forecast and evaluation metrics")
    p_fc.add_argument("--store", type=int, default=1, help="Store ID (1-10, default: 1 Hyderabad)")
    p_fc.add_argument("--item", type=int, default=1, help="Item ID (1-50, default: 1 Atta)")
    p_fc.add_argument("--model", type=str, default="xgboost", choices=["xgboost", "arima", "exponential_smoothing", "moving_average", "naive"], help="Forecasting model")
    p_fc.add_argument("--horizon", type=int, default=30, help="Forecast horizon in days (default: 30)")

    # Command: benchmark
    p_bm = subparsers.add_parser("benchmark", help="Benchmark all 5 time series models on holdout validation")
    p_bm.add_argument("--store", type=int, default=1, help="Store ID (1-10)")
    p_bm.add_argument("--item", type=int, default=1, help="Item ID (1-50)")

    # Command: inventory
    p_inv = subparsers.add_parser("inventory", help="Run inventory replenishment audit and stockout risk analysis")
    p_inv.add_argument("--store", type=int, default=1, help="Store ID (1-10)")
    p_inv.add_argument("--lead-time", type=int, default=7, help="Supplier lead time in days (default: 7)")
    p_inv.add_argument("--service-level", type=int, default=95, help="Target service level percentage (default: 95)")
    p_inv.add_argument("--limit", type=int, default=10, help="Number of items to show (default: 10)")

    # Command: abc-xyz
    p_abc = subparsers.add_parser("abc-xyz", help="Run ABC-XYZ inventory segmentation (Pareto value & volatility)")
    p_abc.add_argument("--store", type=int, default=1, help="Store ID (1-10, default: 1)")

    # Command: export
    p_exp = subparsers.add_parser("export", help="Export dataset, forecast, or PO directly to CSV")
    p_exp.add_argument("--type", type=str, required=True, choices=["forecast", "inventory", "abc-xyz"], help="Export dataset type")
    p_exp.add_argument("--store", type=int, default=1, help="Store ID (1-10)")
    p_exp.add_argument("--item", type=int, default=1, help="Item ID (1-50)")
    p_exp.add_argument("--horizon", type=int, default=30, help="Forecast horizon days (default: 30)")
    p_exp.add_argument("--model", type=str, default="xgboost", help="Forecast model")
    p_exp.add_argument("--lead-time", type=int, default=7, help="Lead time days")
    p_exp.add_argument("--output", "-o", type=str, default=None, help="Output file path (default: auto-named .csv)")

    # Command: report
    p_rep = subparsers.add_parser("report", help="Generate Executive Intelligence Brief in Markdown")
    p_rep.add_argument("--store", type=int, default=None, help="Store ID (optional; default: All Stores)")
    p_rep.add_argument("--output", "-o", type=str, default=None, help="Path to save markdown file (e.g. report.md)")

    # Command: anomaly
    p_anom = subparsers.add_parser("anomaly", help="Run statistical anomaly detection (Z-score)")
    p_anom.add_argument("--store", type=int, default=1, help="Store ID (1-10)")
    p_anom.add_argument("--item", type=int, default=1, help="Item ID (1-50)")
    p_anom.add_argument("--threshold", type=float, default=2.5, help="Z-score threshold (default: 2.5)")
    p_anom.add_argument("--limit", type=int, default=10, help="Max anomalies to display")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    dispatch = {
        "status": cmd_status,
        "forecast": cmd_forecast,
        "benchmark": cmd_benchmark,
        "inventory": cmd_inventory,
        "abc-xyz": cmd_abc_xyz,
        "export": cmd_export,
        "report": cmd_report,
        "anomaly": cmd_anomaly,
    }

    if args.command in dispatch:
        dispatch[args.command](args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
