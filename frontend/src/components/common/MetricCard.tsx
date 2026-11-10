import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  badge?: string;
  color?: 'cyan' | 'emerald' | 'blue' | 'amber' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeLabel = 'vs prev month',
  icon: Icon,
  badge,
  color = 'cyan',
}) => {
  const colorMap = {
    cyan: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20 group-hover:border-brand-cyan/40',
    emerald: 'text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20 group-hover:border-brand-emerald/40',
    blue: 'text-brand-blue bg-brand-blue/10 border-brand-blue/20 group-hover:border-brand-blue/40',
    amber: 'text-brand-amber bg-brand-amber/10 border-brand-amber/20 group-hover:border-brand-amber/40',
    purple: 'text-brand-purple bg-brand-purple/10 border-brand-purple/20 group-hover:border-brand-purple/40',
  };

  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="relative group p-5 rounded-xl bg-surface-card border border-surface-border hover:border-slate-700 transition-all duration-200 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${colorMap[color]} transition-colors`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-mono">
          {value}
        </h3>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-surface-hover text-slate-300 border border-surface-border">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || change !== undefined) && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {change !== undefined ? (
            <div className="flex items-center space-x-1.5">
              <span
                className={`flex items-center font-medium ${
                  isPositive ? 'text-brand-emerald' : 'text-brand-rose'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                )}
                {isPositive ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-slate-400">{changeLabel}</span>
            </div>
          ) : (
            <span className="text-slate-400">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};
