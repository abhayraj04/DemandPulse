import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Cpu,
  Boxes,
  Award,
  Sparkles,
  Database,
  Info,
  ChevronRight,
  ShieldCheck,
  Package,
  Sliders,
  Grid,
  Binary,
  PanelLeftClose,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'sales'
  | 'timeseries'
  | 'forecasting'
  | 'simulation'
  | 'heatmap'
  | 'inventory'
  | 'catalog'
  | 'datascience'
  | 'models'
  | 'insights'
  | 'dataset'
  | 'about';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  datasetAvailable: boolean;
  totalRecords: number;
  onHideSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  datasetAvailable,
  totalRecords,
  onHideSidebar,
}) => {
  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Executive Overview',
      icon: BarChart3,
      badge: 'Core',
    },
    {
      id: 'sales' as NavTab,
      label: 'Sales Analytics',
      icon: TrendingUp,
    },
    {
      id: 'timeseries' as NavTab,
      label: 'Time-Series Explorer',
      icon: Activity,
    },
    {
      id: 'forecasting' as NavTab,
      label: 'Demand Forecasting Lab',
      icon: Cpu,
      badge: 'ML Engine',
    },
    {
      id: 'simulation' as NavTab,
      label: 'What-If Simulation Lab',
      icon: Sliders,
      badge: 'Interactive',
    },
    {
      id: 'heatmap' as NavTab,
      label: 'Demand Velocity Heatmap',
      icon: Grid,
      badge: 'Matrix',
    },
    {
      id: 'inventory' as NavTab,
      label: 'Inventory Intelligence',
      icon: Boxes,
    },
    {
      id: 'catalog' as NavTab,
      label: 'Product Catalog & Pricing',
      icon: Package,
      badge: '100 SKUs',
    },
    {
      id: 'datascience' as NavTab,
      label: 'Data Science & ML Lab',
      icon: Binary,
      badge: 'Audit & SHAP',
    },
    {
      id: 'models' as NavTab,
      label: 'Model Performance',
      icon: Award,
    },
    {
      id: 'insights' as NavTab,
      label: 'AI Business Insights',
      icon: Sparkles,
      badge: 'Rule AI',
    },
    {
      id: 'dataset' as NavTab,
      label: 'Dataset Management',
      icon: Database,
    },
    {
      id: 'about' as NavTab,
      label: 'About Project',
      icon: Info,
    },
  ];

  return (
    <aside className="w-64 bg-navy-950 border-r border-surface-border flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan via-brand-blue to-brand-purple flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <TrendingUp className="w-5 h-5 text-navy-950 font-bold" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center space-x-1.5">
              <span>DemandPulse</span>
              <span className="text-brand-cyan text-[10px] font-mono px-1 py-0.5 rounded bg-brand-cyan/15 border border-brand-cyan/30">
                AI
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide truncate max-w-[125px]">
              Bharat Intelligence
            </p>
          </div>
        </div>

        {onHideSidebar && (
          <button
            onClick={onHideSidebar}
            title="Hide Navigation Bar (Full Width Screen)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-surface-border transition"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Platform Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-brand-cyan/15 to-brand-blue/10 text-brand-cyan border border-brand-cyan/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-surface-hover/70'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-brand-cyan' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center space-x-1.5">
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-brand-cyan/20 text-brand-cyan'
                        : 'bg-navy-900 text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${
                    isActive
                      ? 'text-brand-cyan translate-x-0.5'
                      : 'text-slate-600 group-hover:text-slate-400'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Dataset & System Health Footer Card */}
      <div className="p-4 border-t border-surface-border bg-navy-900/60">
        <div className="p-3 rounded-xl bg-navy-850/80 border border-surface-border/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald" />
              <span>Engine Status</span>
            </span>
            <span className="flex items-center space-x-1 text-[10px] font-mono text-brand-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
              <span>Production</span>
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex justify-between pt-1 border-t border-surface-border/50">
            <span>Verified Records:</span>
            <span className="text-white font-bold">{totalRecords.toLocaleString()}</span>
          </div>

          <div className="text-[10px] text-slate-500 font-sans pt-0.5">
            5-Year Kaggle Benchmark • Zero Leakage
          </div>
        </div>
      </div>
    </aside>
  );
};
