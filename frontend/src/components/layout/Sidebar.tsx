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
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'sales'
  | 'timeseries'
  | 'forecasting'
  | 'inventory'
  | 'models'
  | 'insights'
  | 'dataset'
  | 'about';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  datasetAvailable: boolean;
  totalRecords: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  datasetAvailable,
  totalRecords,
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
      id: 'inventory' as NavTab,
      label: 'Inventory Intelligence',
      icon: Boxes,
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
      <div className="p-5 border-b border-surface-border flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan via-brand-blue to-brand-purple flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <TrendingUp className="w-6 h-6 text-navy-950 font-bold" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-white flex items-center space-x-1">
            <span>DemandVision</span>
            <span className="text-brand-cyan text-xs px-1.5 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20">
              AI
            </span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide truncate max-w-[140px]">
            Retail Forecasting Platform
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Dashboard Modules
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
                    className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                      isActive
                        ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40'
                        : 'bg-surface-border text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${
                    isActive ? 'opacity-100 translate-x-0.5 text-brand-cyan' : 'opacity-0'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Dataset & Engine Status Card */}
      <div className="p-4 border-t border-surface-border bg-navy-900/60">
        <div className="p-3 rounded-xl bg-surface-card border border-surface-border text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-brand-emerald" />
              Engine Status
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                datasetAvailable ? 'bg-brand-emerald animate-pulse' : 'bg-brand-amber'
              }`}
            />
          </div>

          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div className="flex justify-between">
              <span>Dataset:</span>
              <span className="font-mono text-slate-200">
                {datasetAvailable ? `${totalRecords.toLocaleString()} rows` : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Models:</span>
              <span className="text-brand-cyan font-mono">XGBoost & ARIMA</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
