import React from 'react';

interface StatusBadgeProps {
  status: 'CRITICAL_STOCKOUT_RISK' | 'REORDER_REQUIRED' | 'HEALTHY' | 'EXCESS_INVENTORY' | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'CRITICAL_STOCKOUT_RISK':
        return {
          label: 'Critical Stockout',
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400 animate-pulse',
        };
      case 'REORDER_REQUIRED':
        return {
          label: 'Reorder Needed',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'EXCESS_INVENTORY':
        return {
          label: 'Overstocked',
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          dot: 'bg-purple-400',
        };
      case 'HEALTHY':
      default:
        return {
          label: 'Optimal',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`} />
      {config.label}
    </span>
  );
};
