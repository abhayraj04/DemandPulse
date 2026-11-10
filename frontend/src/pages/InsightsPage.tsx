import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

import { api } from '../services/api';
import { BusinessInsight } from '../types/api';
import { FilterBar } from '../components/common/FilterBar';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const InsightsPage: React.FC<{
  selectedStore: number | undefined;
  selectedItem: number | undefined;
  onStoreChange: (st: number | undefined) => void;
  onItemChange: (it: number | undefined) => void;
}> = ({ selectedStore, selectedItem, onStoreChange, onItemChange }) => {
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getInsights({
        store: selectedStore,
        item: selectedItem,
      });
      setInsights(res.insights);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI business insights.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [selectedStore, selectedItem]);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          border: 'border-rose-500/30',
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: AlertTriangle,
          iconColor: 'text-rose-400',
        };
      case 'medium':
        return {
          border: 'border-amber-500/30',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
        };
      case 'positive':
        return {
          border: 'border-emerald-500/30',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
        };
      case 'info':
      default:
        return {
          border: 'border-brand-cyan/30',
          badge: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30',
          icon: Sparkles,
          iconColor: 'text-brand-cyan',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Filter Bar */}
      <FilterBar
        selectedStore={selectedStore}
        selectedItem={selectedItem}
        onStoreChange={onStoreChange}
        onItemChange={onItemChange}
        onRefresh={fetchInsights}
        isLoading={isLoading}
      />

      {/* AI Intelligence Header Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-brand-cyan/15 via-surface-card to-brand-purple/15 border border-brand-cyan/30 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Automated Rule-Based Decision Intelligence</span>
              <span className="text-[10px] bg-brand-cyan/20 text-brand-cyan px-2 py-0.5 rounded-full font-mono uppercase">
                Active Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Grounded mathematical observations extracted directly from historical trends, seasonality, and model evaluations.
            </p>
          </div>
        </div>

        <div className="hidden sm:block text-right font-mono text-xs">
          <span className="text-slate-400">Total Extracted:</span>
          <p className="text-xl font-bold text-white">{insights.length} Insights</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} height="h-32" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => {
            const style = getSeverityStyle(insight.severity);
            const IconComponent = style.icon;

            return (
              <div
                key={insight.id}
                className={`p-5 rounded-xl bg-surface-card border ${style.border} shadow-lg hover:border-slate-600 transition-all flex flex-col justify-between space-y-4`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {insight.category}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${style.badge}`}
                    >
                      {insight.severity} Priority
                    </span>
                  </div>

                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-1.5 rounded-lg bg-navy-900 border border-surface-border mt-0.5">
                      <IconComponent className={`w-4 h-4 ${style.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {insight.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-navy-900 border border-surface-border flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Target: {insight.target_entity}</span>
                    <span className="text-brand-cyan font-bold">{insight.supporting_metric}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-border flex items-start space-x-2 text-xs">
                  <ArrowRight className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
                  <p className="text-slate-300">
                    <strong className="text-brand-emerald font-semibold">Recommended Action: </strong>
                    {insight.actionable_recommendation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
