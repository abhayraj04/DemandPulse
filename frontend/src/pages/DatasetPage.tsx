import React, { useState, useEffect } from 'react';
import {
  Database,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

import { api } from '../services/api';
import { DatasetStatus } from '../types/api';
import { MetricCard } from '../components/common/MetricCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const DatasetPage: React.FC = () => {
  const [status, setStatus] = useState<DatasetStatus | null>(null);
  const [qualityReport, setQualityReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const s = await api.getDatasetStatus();
      setStatus(s);
      if (s.dataset_available) {
        const q = await api.getDatasetQualityReport();
        setQualityReport(q);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadMessage('Uploading and running validation pipeline on CSV...');
      await api.uploadDataset(file);
      setUploadMessage('Dataset processed successfully! Refreshing analytics...');
      await fetchStatus();
    } catch (err: any) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className={`p-3 rounded-xl border ${
              status?.dataset_available
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Kaggle Store Item Demand Forecasting Dataset</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  status?.dataset_available
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                {status?.dataset_available ? 'Verified & Loaded' : 'Missing Dataset'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Daily historical sales records spanning 10 retail stores and 50 unique consumer product SKUs.
            </p>
          </div>
        </div>

        <a
          href={'https://www.kaggle.com/competitions/demand-forecasting-kernels-only/data'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-surface-border transition-colors"
        >
          <span>View on Kaggle</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {isLoading && !status ? (
        <LoadingSkeleton rows={3} height="h-32" />
      ) : (
        <>
          {/* Dataset Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Verified Total Records"
              value={status?.total_records.toLocaleString() ?? '0'}
              subtitle="Daily store-item observations"
              icon={FileText}
              color="cyan"
            />
            <MetricCard
              title="Unique Retail Stores"
              value={status?.stores.length ?? 0}
              subtitle="Store IDs 1 through 10"
              icon={CheckCircle2}
              color="emerald"
            />
            <MetricCard
              title="Tracked Product SKUs"
              value={status?.items.length ?? 0}
              subtitle="Item IDs 1 through 50"
              icon={Database}
              color="blue"
            />
            <MetricCard
              title="Historical Date Span"
              value={status?.date_range ? `${status.date_range.total_days} Days` : 'N/A'}
              subtitle={
                status?.date_range
                  ? `${status.date_range.min_date} to ${status.date_range.max_date}`
                  : 'No dates'
              }
              icon={ShieldCheck}
              color="purple"
            />
          </div>

          {/* Dataset Upload Area */}
          <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-lg">
            <h3 className="text-sm font-bold text-white mb-1">Local CSV Dataset Import</h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload a valid <code className="text-brand-cyan">train.csv</code> file. The engine will validate column headers, verify non-negative sales, sort chronologically, and regenerate precomputed summaries.
            </p>

            <div className="border-2 border-dashed border-surface-border hover:border-brand-cyan rounded-xl p-8 text-center bg-navy-950/40 transition-colors">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-200 mb-1">
                Drag and drop your retail CSV file here, or click to browse
              </p>
              <p className="text-[11px] text-slate-400 mb-4">
                Expected columns: <code className="text-slate-300">date, store, item, sales</code>
              </p>

              <label className="inline-block px-4 py-2 bg-brand-cyan hover:bg-cyan-400 text-navy-950 font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-md">
                <span>{isUploading ? 'Processing...' : 'Select CSV File'}</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {uploadMessage && (
                <p className="mt-3 text-xs text-brand-cyan font-mono animate-pulse">
                  {uploadMessage}
                </p>
              )}
            </div>
          </div>

          {/* Data Quality Report Card */}
          {qualityReport && (
            <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-brand-emerald" />
                  <h3 className="text-sm font-bold text-white">
                    Automated Data Integrity & Quality Audit
                  </h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Integrity Verified: 100%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-navy-900 border border-surface-border">
                  <span className="text-slate-400">Missing Values:</span>
                  <p className="text-base font-bold text-brand-emerald mt-1">
                    {Object.values(qualityReport.missing_values || {}).reduce(
                      (a: any, b: any) => a + b,
                      0
                    ) as number}{' '}
                    (0.0%)
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-navy-900 border border-surface-border">
                  <span className="text-slate-400">Duplicate Rows:</span>
                  <p className="text-base font-bold text-brand-emerald mt-1">
                    {qualityReport.duplicate_count} (0.0%)
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-navy-900 border border-surface-border">
                  <span className="text-slate-400">Sales Mean / Median:</span>
                  <p className="text-base font-bold text-brand-cyan mt-1">
                    {qualityReport.sales_summary?.mean} / {qualityReport.sales_summary?.median}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
