import React from 'react';
import { Database, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-card border border-surface-border rounded-xl">
      <div className="p-3 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full text-brand-cyan mb-4">
        {icon || <Database className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-cyan text-navy-950 font-semibold text-sm rounded-lg hover:bg-cyan-400 transition-colors shadow-md"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
