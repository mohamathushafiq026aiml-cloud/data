import React from 'react';
import { Download, FileText, RotateCcw, Database, Plus, Sparkles } from 'lucide-react';
import { Dataset, PipelineStepId } from '../types';

interface TopBarProps {
  dataset: Dataset | null;
  onReset: () => void;
  onNavigate: (step: PipelineStepId) => void;
  onExportCSV: () => void;
  onExportMarkdown: () => void;
  onOpenAddRow: () => void;
  onOpenAddFeature: () => void;
  logsCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  dataset,
  onReset,
  onNavigate,
  onExportCSV,
  onExportMarkdown,
  onOpenAddRow,
  onOpenAddFeature,
  logsCount
}) => {
  return (
    <header className="h-16 px-6 bg-white border-b border-neutral-200 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-mono font-bold text-sm tracking-tight shadow-sm">
          DP
        </div>
        <div>
          <span className="text-base font-semibold tracking-tight text-neutral-900 block leading-tight">
            Data Preprocessing Studio
          </span>
          <span className="text-xs text-neutral-500 font-normal">
            Machine Learning Data Preparation &amp; Pipeline Audit
          </span>
        </div>
      </div>

      {/* Zone 2: Clean unboxed metadata with typographic separators */}
      {dataset && (
        <div className="hidden lg:flex items-center gap-2 text-xs text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-md border border-neutral-200">
          <Database className="w-3.5 h-3.5 text-neutral-500" />
          <span className="font-medium text-neutral-900">{dataset.name}</span>
          <span className="text-neutral-300" aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{dataset.rows.length} rows</span>
          <span className="text-neutral-300" aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{dataset.columns.length} columns</span>
          <span className="text-neutral-300" aria-hidden="true">·</span>
          <span className="text-emerald-700 font-medium font-mono tabular-nums">{logsCount} steps logged</span>
        </div>
      )}

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2">
        {dataset && (
          <>
            <button
              onClick={onOpenAddRow}
              title="Add a new row to the dataset"
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-neutral-600" />
              <span>Add Record</span>
            </button>

            <button
              onClick={onOpenAddFeature}
              title="Engineer and add a new calculated column"
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
              <span>Engineer Feature</span>
            </button>

            <button
              onClick={onReset}
              title="Reset to initial dataset state"
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={onExportMarkdown}
              title="Download execution audit log as Markdown"
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer hidden sm:flex"
            >
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              <span>Log (.md)</span>
            </button>

            <button
              onClick={onExportCSV}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

