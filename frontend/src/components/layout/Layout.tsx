import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Topbar } from './Topbar';

interface LayoutProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  datasetAvailable: boolean;
  totalRecords: number;
  children: React.ReactNode;
}

const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Executive Overview',
    subtitle: 'High-level retail performance KPIs, sales growth, and store benchmarks',
  },
  sales: {
    title: 'Sales Analytics Workspace',
    subtitle: 'Deep-dive product rankings, seasonality patterns, and volume distributions',
  },
  timeseries: {
    title: 'Time-Series Explorer',
    subtitle: 'Decomposition (Trend, Seasonality, Residuals), rolling metrics, and ACF/PACF',
  },
  forecasting: {
    title: 'Demand Forecasting Lab',
    subtitle: 'Multi-model probabilistic forecasting with prediction intervals & 30-day calendar',
  },
  simulation: {
    title: 'What-If Demand & Inventory Simulation Lab',
    subtitle: 'Interactive stress testing: demand shocks, lead times, service levels, and price deltas',
  },
  heatmap: {
    title: 'Demand Velocity Heatmap Explorer',
    subtitle: 'Multidimensional cross-tabulation: Products × Stores, Seasonality, and Regional Volume',
  },
  inventory: {
    title: 'Inventory Intelligence & ROP Optimization',
    subtitle: 'Safety stock, reorder point calculations, and stockout mitigation purchase orders',
  },
  catalog: {
    title: 'Indian Retail Product Catalog & Pricing',
    subtitle: '100 FMCG SKUs, forecast availability mappings, and configurable INR (₹) demonstration prices',
  },
  datascience: {
    title: 'Data Science & ML Engineering Lab',
    subtitle: 'Mathematical rigor: Data Quality Audit, Chronological Walk-Forward Validation & XGBoost Feature Importance',
  },
  models: {
    title: 'Model Performance Center',
    subtitle: 'Chronological walk-forward validation leaderboard and residual distribution',
  },
  insights: {
    title: 'AI Business Insights Engine',
    subtitle: 'Real-data grounded business intelligence signals and tactical recommendations',
  },
  dataset: {
    title: 'Dataset Management & Setup',
    subtitle: 'Data validation metrics, quality reports, and Kaggle dataset upload',
  },
  about: {
    title: 'About DemandPulse',
    subtitle: 'Architectural documentation, time-series methodology, and interview preparation guide',
  },
};

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  onTabChange,
  datasetAvailable,
  totalRecords,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const current = tabTitles[activeTab];

  // Productivity Keyboard Shortcut: Press '[' or 'Ctrl+B' to toggle navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        (e.key === '[' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b')
      ) {
        e.preventDefault();
        setSidebarHidden((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-navy-900 text-slate-100">
      {/* Desktop Sidebar (Hideable) */}
      {!sidebarHidden && (
        <div className="hidden lg:block transition-all duration-300">
          <Sidebar
            activeTab={activeTab}
            onTabChange={onTabChange}
            datasetAvailable={datasetAvailable}
            totalRecords={totalRecords}
            onHideSidebar={() => setSidebarHidden(true)}
          />
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 bg-navy-950">
            <Sidebar
              activeTab={activeTab}
              onTabChange={(tab) => {
                onTabChange(tab);
                setMobileMenuOpen(false);
              }}
              datasetAvailable={datasetAvailable}
              totalRecords={totalRecords}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          title={current.title}
          subtitle={current.subtitle}
          datasetAvailable={datasetAvailable}
          onOpenDataset={() => onTabChange('dataset')}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          sidebarHidden={sidebarHidden}
          onToggleSidebar={() => setSidebarHidden(!sidebarHidden)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
