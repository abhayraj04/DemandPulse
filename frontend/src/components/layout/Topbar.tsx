import React, { useState } from 'react';
import {
  Bell,
  Search,
  Database,
  User,
  Menu,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  datasetAvailable: boolean;
  onOpenDataset: () => void;
  onToggleMobileMenu?: () => void;
  sidebarHidden?: boolean;
  onToggleSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  datasetAvailable,
  onOpenDataset,
  onToggleMobileMenu,
  sidebarHidden,
  onToggleSidebar,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: 'P015 (Sugar) Reorder Alert',
      time: '10m ago',
      desc: 'Inventory approaching safety buffer in Store 2 (Bengaluru).',
    },
    {
      id: 2,
      type: 'success',
      title: 'XGBoost Benchmark Validated',
      time: '1h ago',
      desc: 'Achieved 14.2% WAPE on 30-day chronological holdout.',
    },
    {
      id: 3,
      type: 'info',
      title: 'Weekend Surge Pattern Active',
      time: '3h ago',
      desc: 'Weekend sales uplift +32.4% above weekday baseline.',
    },
  ];

  return (
    <header className="h-16 bg-navy-950/80 backdrop-blur-md border-b border-surface-border sticky top-0 z-20 px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Nav Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={sidebarHidden ? "Show Navigation Bar (Expand)" : "Hide Navigation Bar (Full Width Screen)"}
            className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-surface-card hover:bg-slate-800 border border-surface-border rounded-lg transition shadow-sm"
          >
            {sidebarHidden ? (
              <>
                <PanelLeftOpen className="w-4 h-4 text-brand-cyan" />
                <span className="text-[11px]">Show Nav</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 text-slate-400" />
                <span className="text-[11px]">Hide Nav</span>
              </>
            )}
          </button>
        )}

        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-400 hover:text-white bg-surface-card border border-surface-border rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      {/* Right Action Icons & Controls */}
      <div className="flex items-center space-x-3">
        {/* Dataset Status Pill */}
        <button
          onClick={onOpenDataset}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            datasetAvailable
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title="Click to view dataset management"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {datasetAvailable ? 'Kaggle Store-Demand Active' : 'Setup Required'}
          </span>
          <span className="md:hidden">{datasetAvailable ? 'Active' : 'Setup'}</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-300 hover:text-white bg-surface-card hover:bg-surface-hover border border-surface-border rounded-xl transition-colors relative"
            title="Notifications & Insights"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-cyan rounded-full animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-cyan rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-card border border-surface-border rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Real-time Alerts & Insights
                </span>
                <span className="text-[10px] bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded-full font-mono">
                  3 New
                </span>
              </div>

              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-lg bg-navy-900 border border-surface-border/60 text-xs hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recruiter / User Profile Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-surface-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-blue to-brand-cyan flex items-center justify-center font-bold text-navy-950 text-xs shadow-md">
            AR
          </div>
          <div className="hidden lg:block text-left text-xs">
            <p className="font-semibold text-white leading-tight">Abhay Raj</p>
            <p className="text-[10px] text-brand-cyan font-mono leading-tight">Data Scientist</p>
          </div>
        </div>
      </div>
    </header>
  );
};
