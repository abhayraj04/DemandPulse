import React, { useState } from 'react';
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
    subtitle: 'Multi-model probabilistic forecasting with prediction intervals',
  },
  inventory: {
    title: 'Inventory Intelligence',
    subtitle: 'Safety stock, reorder point calculations, and stockout mitigation recommendations',
  },
  models: {
    title: 'Model Performance Center',
    subtitle: 'Chronological walk-forward validation leaderboard and residual distribution',
  },
  insights: {
    title: 'AI Business Insights',
    subtitle: 'Real-data grounded business intelligence signals and tactical recommendations',
  },
  dataset: {
    title: 'Dataset Management & Setup',
    subtitle: 'Data validation metrics, quality reports, and Kaggle dataset upload',
  },
  about: {
    title: 'About DemandVision AI',
    subtitle: 'Architectural documentation, time-series methodology, and project guide',
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
  const current = tabTitles[activeTab];

  return (
    <div className="flex min-h-screen bg-navy-900 text-slate-100">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          datasetAvailable={datasetAvailable}
          totalRecords={totalRecords}
        />
      </div>

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
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={current.title}
          subtitle={current.subtitle}
          datasetAvailable={datasetAvailable}
          onOpenDataset={() => onTabChange('dataset')}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
