import React, { useState } from 'react';
import { Maximize2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Dataset, PipelineStepId, ScalingSummary } from '../../types';
import { minMaxScaleNumeric } from '../../utils/transforms';

interface NormalizeStepProps {
  dataset: Dataset;
  onUpdateDataset: (
    updated: Dataset,
    log: {
      actionSummary: string;
      details: string[];
      mlRationale: string;
      changesCount: number;
    }
  ) => void;
  onNavigate: (step: PipelineStepId) => void;
}

export const NormalizeStep: React.FC<NormalizeStepProps> = ({
  dataset,
  onUpdateDataset,
  onNavigate
}) => {
  const numericCols = dataset.columns.filter(c => dataset.columnTypes[c] === 'numeric');

  // Do not scale binary dummy columns by default (they are already [0, 1])
  const continuousNumericCols = numericCols.filter(c => {
    // Check if distinct values are just 0 and 1
    const distinct = new Set(dataset.rows.map(r => r[c]));
    return !(distinct.size <= 2 && distinct.has(0) && distinct.has(1));
  });

  const [selectedCols, setSelectedCols] = useState<string[]>(continuousNumericCols);
  const [rangeMin, setRangeMin] = useState<number>(0);
  const [rangeMax, setRangeMax] = useState<number>(1);
  const [scalingSummaries, setScalingSummaries] = useState<ScalingSummary[] | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSelectAll = () => {
    setSelectedCols(numericCols);
  };

  const handleSelectContinuousOnly = () => {
    setSelectedCols(continuousNumericCols);
  };

  const handleApplyScaling = () => {
    if (selectedCols.length === 0) return;

    const { updatedDataset, summary } = minMaxScaleNumeric(
      dataset,
      selectedCols,
      rangeMin,
      rangeMax
    );

    setScalingSummaries(summary);

    const details = summary.map(
      s => `${s.column}: [${s.beforeMin}..${s.beforeMax}] → [${s.afterMin}..${s.afterMax}] (mean: ${s.beforeMean} → ${s.afterMean})`
    );

    onUpdateDataset(updatedDataset, {
      actionSummary: `Min-Max normalized ${selectedCols.length} numeric feature(s) into range [${rangeMin}, ${rangeMax}]`,
      details,
      mlRationale: 'Features with large numeric scales (e.g. MonthlyIncome in thousands vs Age in tens) dominate Euclidean distance calculations and cause gradient descent to oscillate inefficiently. Min-Max normalization rescales all numeric features into an identical bounded range [0, 1], guaranteeing equitable feature weighting across KNN, SVM, Logistic Regression, and Neural Networks.',
      changesCount: selectedCols.length * dataset.rows.length
    });

    setNotification(`Successfully scaled ${selectedCols.length} features to range [${rangeMin}, ${rangeMax}].`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Feature Normalization (Min-Max Scaling)
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Rescale numeric features into uniform bounded intervals [0, 1] for gradient and distance convergence.
          </p>
        </div>

        <button
          onClick={() => onNavigate('features')}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 self-start cursor-pointer shadow-xs"
        >
          <span>Continue to Feature Selection</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 text-[11px] font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Configuration Card */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-neutral-100 text-neutral-800">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Min-Max Scaling Parameters
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Formula: <span className="font-mono">x' = (x - x_min) / (x_max - x_min) * (range_max - range_min) + range_min</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-600 font-medium">Target Range:</span>
            <button
              onClick={() => { setRangeMin(0); setRangeMax(1); }}
              className={`px-3 py-1.5 rounded border transition-colors cursor-pointer ${
                rangeMin === 0 && rangeMax === 1
                  ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              [0, 1] Standard
            </button>
            <button
              onClick={() => { setRangeMin(-1); setRangeMax(1); }}
              className={`px-3 py-1.5 rounded border transition-colors cursor-pointer ${
                rangeMin === -1 && rangeMax === 1
                  ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              [-1, 1] Bipolar
            </button>
          </div>
        </div>

        {/* Feature Selector */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-700">
              Select Numeric Features to Scale ({selectedCols.length} selected):
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectContinuousOnly}
                className="text-[11px] text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
              >
                Continuous only (ignore binary)
              </button>
              <span className="text-neutral-300" aria-hidden="true">·</span>
              <button
                onClick={handleSelectAll}
                className="text-[11px] text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
              >
                Select all numeric
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {numericCols.map(col => {
              const isChecked = selectedCols.includes(col);
              return (
                <label
                  key={col}
                  className={`text-xs px-2.5 py-1 rounded border flex items-center gap-1.5 cursor-pointer select-none transition-colors ${
                    isChecked
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCols([...selectedCols, col]);
                      } else {
                        setSelectedCols(selectedCols.filter(c => c !== col));
                      }
                    }}
                    className="hidden"
                  />
                  <span>{col}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Rescales each feature proportionally to fit between {rangeMin} and {rangeMax}.
          </span>
          <button
            onClick={handleApplyScaling}
            disabled={selectedCols.length === 0}
            className="py-1.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
          >
            Apply Min-Max Scaling
          </button>
        </div>
      </div>

      {/* Before / After Summary Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Normalization Before / After Summary
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Comparison of bounds [Min, Max] and central moments [Mean, Std] before and after scaling.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100/80 text-neutral-600 border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-3 font-mono font-medium text-neutral-400 w-12 text-center">#</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700">Feature</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700 text-right bg-neutral-50/60">Before Min</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700 text-right bg-neutral-50/60">Before Max</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700 text-right bg-neutral-50/60">Before Mean</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700 text-right bg-neutral-50/60">Before Std</th>
                <th className="py-2.5 px-3 font-medium text-neutral-900 text-right bg-emerald-50/40 font-semibold">After Min</th>
                <th className="py-2.5 px-3 font-medium text-neutral-900 text-right bg-emerald-50/40 font-semibold">After Max</th>
                <th className="py-2.5 px-3 font-medium text-neutral-900 text-right bg-emerald-50/40 font-semibold">After Mean</th>
                <th className="py-2.5 px-3 font-medium text-neutral-900 text-right bg-emerald-50/40 font-semibold">After Std</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {scalingSummaries ? (
                scalingSummaries.map((s, idx) => (
                  <tr key={s.column} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-neutral-400 text-center">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium font-mono text-neutral-900">{s.column}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-600 bg-neutral-50/30">{s.beforeMin}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-600 bg-neutral-50/30">{s.beforeMax}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-600 bg-neutral-50/30">{s.beforeMean}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-600 bg-neutral-50/30">{s.beforeStd}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700 bg-emerald-50/20">{s.afterMin}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700 bg-emerald-50/20">{s.afterMax}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-neutral-900 bg-emerald-50/20">{s.afterMean}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-700 bg-emerald-50/20">{s.afterStd}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-neutral-400">
                    Click "Apply Min-Max Scaling" above to generate the before/after statistics comparison.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
