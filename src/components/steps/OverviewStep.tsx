import React from 'react';
import { Layers, Hash, Type, HelpCircle, ArrowRight, Plus, Sparkles } from 'lucide-react';
import { ColumnType, Dataset, PipelineStepId } from '../../types';
import { DataTable } from '../DataTable';

interface OverviewStepProps {
  dataset: Dataset;
  onUpdateColumnType: (column: string, newType: ColumnType) => void;
  onNavigate: (step: PipelineStepId) => void;
  onOpenAddRow?: () => void;
  onOpenAddFeature?: () => void;
}

export const OverviewStep: React.FC<OverviewStepProps> = ({
  dataset,
  onUpdateColumnType,
  onNavigate,
  onOpenAddRow,
  onOpenAddFeature
}) => {
  const numericCols = dataset.columns.filter(c => dataset.columnTypes[c] === 'numeric');
  const categoricalCols = dataset.columns.filter(c => dataset.columnTypes[c] === 'categorical');

  let totalMissingCells = 0;
  dataset.rows.forEach(r => {
    dataset.columns.forEach(c => {
      const v = r[c];
      if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
        totalMissingCells++;
      }
    });
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Raw Data Overview &amp; Schema
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Initial inspection of dimensions, inferred data types, and first 10 records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAddRow && (
            <button
              onClick={onOpenAddRow}
              className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-neutral-600" />
              <span>Add Record</span>
            </button>
          )}

          {onOpenAddFeature && (
            <button
              onClick={onOpenAddFeature}
              className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
              <span>Engineer Feature</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('eda')}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 self-start cursor-pointer shadow-xs"
          >
            <span>Continue to EDA</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Total Rows</span>
            <Layers className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-1 font-mono tabular-nums">
            {dataset.rows.length}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Data points ingested
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Total Columns</span>
            <span className="font-mono text-neutral-400 text-xs">p={dataset.columns.length}</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-1 font-mono tabular-nums">
            {dataset.columns.length}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {numericCols.length} numeric · {categoricalCols.length} categorical
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Missing Cells</span>
            <HelpCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1 font-mono tabular-nums">
            {totalMissingCells}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {((totalMissingCells / (dataset.rows.length * dataset.columns.length || 1)) * 100).toFixed(1)}% of all entries
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Feature Types</span>
            <span className="text-xs font-mono text-neutral-400">dtype</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-1 font-mono tabular-nums">
            {numericCols.length} <span className="text-sm font-normal text-neutral-500">/</span> {categoricalCols.length}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Numeric / Text features
          </div>
        </div>
      </div>

      {/* Column Type Schema Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Feature Dictionary &amp; Inferred Types</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Review automatically inferred types. You can toggle a column between Numeric and Categorical if needed.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100/80 text-neutral-600 border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-3 font-mono font-medium text-neutral-400 w-12 text-center">#</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700">Column Name</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700">Inferred Type</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Non-Null Count</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Missing Count</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700">Sample Distinct Values</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {dataset.columns.map((col, idx) => {
                const type = dataset.columnTypes[col];
                let missingCount = 0;
                const distinctSamples: string[] = [];
                const sampleSet = new Set<string>();

                dataset.rows.forEach(r => {
                  const val = r[col];
                  if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
                    missingCount++;
                  } else {
                    const str = String(val);
                    if (!sampleSet.has(str) && sampleSet.size < 4) {
                      sampleSet.add(str);
                      distinctSamples.push(str);
                    }
                  }
                });

                const nonNull = dataset.rows.length - missingCount;

                return (
                  <tr key={col} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-neutral-400 text-center">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-neutral-900 font-mono">{col}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        {type === 'numeric' ? (
                          <>
                            <Hash className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-blue-900 font-medium">Numeric</span>
                          </>
                        ) : (
                          <>
                            <Type className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-amber-900 font-medium">Categorical</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-700">
                      {nonNull} / {dataset.rows.length}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {missingCount > 0 ? (
                        <span className="text-amber-700 font-semibold">{missingCount}</span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 max-w-xs truncate">
                      {distinctSamples.join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onUpdateColumnType(col, type === 'numeric' ? 'categorical' : 'numeric')}
                        className="text-[11px] text-neutral-600 hover:text-neutral-900 underline font-medium cursor-pointer"
                      >
                        Switch to {type === 'numeric' ? 'Categorical' : 'Numeric'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* First 10 Rows Preview Table */}
      <div>
        <DataTable
          columns={dataset.columns}
          rows={dataset.rows}
          columnTypes={dataset.columnTypes}
          title="Raw Dataset Preview (First 10 Rows)"
          subtitle="Inspect raw formatting, casing inconsistencies, and missing null values."
          defaultPageSize={10}
        />
      </div>
    </div>
  );
};
