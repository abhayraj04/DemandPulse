import React, { useEffect, useState } from 'react';
import {
  Grid,
  Calendar,
  Building2,
  Package,
  Layers,
  Sparkles,
  Info,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { DemandHeatmapResponse, HeatmapCell } from '../types/api';
import { formatINR, formatIndianNumber } from '../utils/formatters';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

const DemandHeatmapPage: React.FC = () => {
  const [matrixType, setMatrixType] = useState<string>('products_by_stores');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<DemandHeatmapResponse | null>(null);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [filterText, setFilterText] = useState<string>('');

  useEffect(() => {
    fetchHeatmap();
  }, [matrixType]);

  const fetchHeatmap = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedCell(null);
      const data = await api.getHeatmap({ matrix_type: matrixType });
      setHeatmapData(data);
    } catch (err: any) {
      console.error('Failed to fetch demand heatmap:', err);
      setError('Failed to compute multidimensional sales intensity matrix.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to map intensity to Tailwind / CSS background colors
  const getCellBg = (intensity: number) => {
    if (intensity < 0.15) return 'bg-slate-900/90 text-slate-500 hover:border-slate-600';
    if (intensity < 0.35) return 'bg-blue-950/70 text-blue-300 border-blue-900/40 hover:border-blue-400';
    if (intensity < 0.60) return 'bg-cyan-900/60 text-cyan-200 border-cyan-700/50 hover:border-cyan-400';
    if (intensity < 0.80) return 'bg-teal-700/70 text-emerald-100 border-teal-500/50 hover:border-teal-300';
    return 'bg-emerald-600/90 text-white font-bold border-emerald-400 hover:border-white shadow-sm shadow-emerald-500/30';
  };

  // Filter rows if on products_by_stores
  const filteredRows = heatmapData
    ? matrixType === 'products_by_stores' && filterText.trim()
      ? heatmapData.rows.filter((r: string) => {
          const matchCell = heatmapData.cells.find((c: HeatmapCell) => c.row === r);
          const name = matchCell?.product_name || '';
          return (
            r.toLowerCase().includes(filterText.toLowerCase()) ||
            name.toLowerCase().includes(filterText.toLowerCase())
          );
        })
      : heatmapData.rows
    : [];

  // Group cells by row for quick lookup: map[row][col] -> cell
  const cellMap = React.useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    if (heatmapData) {
      for (const cell of heatmapData.cells) {
        map.set(`${cell.row}___${cell.column}`, cell);
      }
    }
    return map;
  }, [heatmapData]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-wider uppercase mb-1">
            <Grid className="w-4 h-4" />
            <span>Multidimensional Velocity Analysis</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Demand Velocity Heatmap</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Spot cross-channel patterns instantly. Identify top-selling SKUs across Indian metro clusters,
            seasonal day-of-week surges, and monthly store velocities.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setMatrixType('products_by_stores')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              matrixType === 'products_by_stores'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Products × Stores
          </button>
          <button
            onClick={() => setMatrixType('dow_by_month')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              matrixType === 'dow_by_month'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            DOW × Month
          </button>
          <button
            onClick={() => setMatrixType('store_by_month')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              matrixType === 'store_by_month'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Stores × Month
          </button>
        </div>
      </div>

      {loading && !heatmapData && (
        <LoadingSkeleton rows={4} height="h-32" />
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {heatmapData && (
        <div className="space-y-6">
          {/* Controls & Legend Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              {matrixType === 'products_by_stores' && (
                <input
                  type="text"
                  placeholder="Filter by SKU or Product Name..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 w-64 focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                />
              )}
              <span className="text-xs text-slate-400">
                Displaying <strong>{filteredRows.length}</strong> rows × <strong>{heatmapData.columns.length}</strong> columns
              </span>
            </div>

            {/* Gradient Legend */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Low Volume ({heatmapData.min_val.toFixed(0)})</span>
              <div className="flex items-center h-4 rounded overflow-hidden border border-slate-800 w-36">
                <div className="h-full flex-1 bg-slate-900"></div>
                <div className="h-full flex-1 bg-blue-950"></div>
                <div className="h-full flex-1 bg-cyan-900"></div>
                <div className="h-full flex-1 bg-teal-700"></div>
                <div className="h-full flex-1 bg-emerald-500"></div>
              </div>
              <span className="text-emerald-400 font-semibold">Peak Demand ({heatmapData.max_val.toFixed(0)})</span>
            </div>
          </div>

          {/* Interactive Inspection Card when a cell is clicked */}
          {selectedCell && (
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Inspected Cell: {selectedCell.label}</span>
                </div>
                <div className="text-base font-bold text-white">
                  {selectedCell.product_name ? `${selectedCell.product_name} (${selectedCell.row})` : selectedCell.row}
                  {' → '}
                  <span className="text-cyan-300">
                    {selectedCell.city ? `${selectedCell.city} (${selectedCell.column})` : selectedCell.column}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-[11px] text-slate-400">Average Daily Sales</div>
                  <div className="text-xl font-bold text-white font-mono">
                    {selectedCell.value.toFixed(1)} <span className="text-xs text-slate-400 font-normal">units/day</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Velocity Intensity</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono">
                    {(selectedCell.intensity * 100).toFixed(0)}%
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* The Heatmap Matrix Grid */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800">
                  <th className="py-3 px-4 text-left font-semibold text-slate-400 sticky left-0 bg-slate-900 z-10 min-w-[180px]">
                    {matrixType === 'products_by_stores'
                      ? 'Product SKU'
                      : matrixType === 'dow_by_month'
                      ? 'Day of Week'
                      : 'Store Location'}
                  </th>
                  {heatmapData.columns.map((col: string) => (
                    <th
                      key={col}
                      className="py-3 px-2 text-center font-medium text-slate-300 min-w-[70px] whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredRows.map((rowName: string) => {
                  const sampleCell = cellMap.get(`${rowName}___${heatmapData.columns[0]}`);
                  return (
                    <tr key={rowName} className="hover:bg-slate-900/40 transition">
                      {/* Row Header */}
                      <td className="py-2 px-4 sticky left-0 bg-slate-950 z-10 border-r border-slate-800/60">
                        <div className="font-mono font-semibold text-white text-[11px]">{rowName}</div>
                        {sampleCell?.product_name && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={sampleCell.product_name}>
                            {sampleCell.product_name}
                          </div>
                        )}
                      </td>

                      {/* Cells */}
                      {heatmapData.columns.map((colName: string) => {
                        const cell = cellMap.get(`${rowName}___${colName}`);
                        if (!cell) {
                          return <td key={colName} className="p-1 text-center bg-slate-950 text-slate-700">-</td>;
                        }

                        const isSelected =
                          selectedCell?.row === cell.row && selectedCell?.column === cell.column;

                        return (
                          <td
                            key={colName}
                            onClick={() => setSelectedCell(cell)}
                            title={`${cell.label}: ${cell.value.toFixed(1)} units/day`}
                            className={`p-1.5 text-center cursor-pointer transition border border-transparent font-mono text-[11px] ${getCellBg(
                              cell.intensity
                            )} ${isSelected ? 'ring-2 ring-cyan-400 z-10' : ''}`}
                          >
                            {cell.value.toFixed(0)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Analytical Takeaways */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-white">How to Interpret This Heatmap:</span>
              <p>
                Each cell value represents the normalized historical daily sales velocity calculated directly from the
                913,000 real transaction rows. Darker green/teal zones highlight peak sales demand clusters where
                stock replenishment must be prioritized.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandHeatmapPage;
