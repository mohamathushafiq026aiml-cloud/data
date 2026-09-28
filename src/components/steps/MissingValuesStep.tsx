import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Dataset, MissingComparison, PipelineStepId } from '../../types';
import { imputeMissingValues } from '../../utils/transforms';

interface MissingValuesStepProps {
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

export const MissingValuesStep: React.FC<MissingValuesStepProps> = ({
  dataset,
  onUpdateDataset,
  onNavigate
}) => {
  const [numericStrategy, setNumericStrategy] = useState<'median' | 'mean'>('median');
  const [comparisons, setComparisons] = useState<MissingComparison[] | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Count current missing
  let currentTotalMissing = 0;
  const currentMissingPerCol: Record<string, number> = {};
  for (const col of dataset.columns) {
    let colMissing = 0;
    for (const row of dataset.rows) {
      const v = row[col];
      if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
        colMissing++;
      }
    }
    currentMissingPerCol[col] = colMissing;
    currentTotalMissing += colMissing;
  }

  const handleImpute = () => {
    const { updatedDataset, comparisons: resultComparisons, totalImputed } = imputeMissingValues(
      dataset,
      { numericStrategy }
    );

    setComparisons(resultComparisons);

    const details = resultComparisons
      .filter(c => c.beforeCount > 0)
      .map(c => `${c.column} (${c.type}): filled ${c.beforeCount} missing values with ${c.imputedMethod} = "${c.imputedValue}"`);

    onUpdateDataset(updatedDataset, {
      actionSummary: `Imputed ${totalImputed} missing values across ${resultComparisons.filter(c => c.beforeCount > 0).length} columns (Numeric: ${numericStrategy}, Categorical: mode)`,
      details: details.length > 0 ? details : ['No missing values found in dataset.'],
      mlRationale: 'Machine learning algorithms (such as Scikit-Learn estimators, SVMs, neural nets) cannot accept NaN values and throw fatal convergence exceptions. Imputing numeric features with median preserves central tendency resistant to extreme outliers, while categorical mode captures the maximum likelihood category.',
      changesCount: totalImputed
    });

    setNotification(`Successfully imputed all ${totalImputed} missing values across the dataset.`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Missing Values Imputation
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Fill numeric columns with the median and categorical columns with the mode.
          </p>
        </div>

        <button
          onClick={() => onNavigate('encode')}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 self-start cursor-pointer shadow-xs"
        >
          <span>Continue to Encoding</span>
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

      {/* Overview Stat Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <span className="text-xs text-neutral-500 block">Total Missing Cells</span>
          <div className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
            currentTotalMissing > 0 ? 'text-amber-700' : 'text-emerald-600'
          }`}>
            {currentTotalMissing}
          </div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">
            {currentTotalMissing === 0 ? 'Dataset is 100% complete' : 'Requires imputation'}
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <span className="text-xs text-neutral-500 block">Numeric Imputation Method</span>
          <div className="text-lg font-bold text-neutral-900 mt-1 font-mono uppercase">
            {numericStrategy}
          </div>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">
            Robust against skewed salaries &amp; outliers
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <span className="text-xs text-neutral-500 block">Categorical Imputation Method</span>
          <div className="text-lg font-bold text-neutral-900 mt-1 font-mono uppercase">
            Mode (Most Frequent)
          </div>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">
            Preserves highest probability class
          </span>
        </div>
      </div>

      {/* Imputation Control Card */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Imputation Strategy Configuration
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select strategy for continuous variables (Median recommended for skewed data).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-neutral-700">Numeric Strategy:</label>
            <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-md border border-neutral-200">
              <button
                onClick={() => setNumericStrategy('median')}
                className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                  numericStrategy === 'median'
                    ? 'bg-white font-medium text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Median (Standard)
              </button>
              <button
                onClick={() => setNumericStrategy('mean')}
                className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                  numericStrategy === 'mean'
                    ? 'bg-white font-medium text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Mean
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
            <span>Categorical columns will automatically be filled with each feature's mode.</span>
          </div>

          <button
            onClick={handleImpute}
            disabled={currentTotalMissing === 0}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40 cursor-pointer self-start sm:self-auto shadow-xs"
          >
            {currentTotalMissing > 0 ? `Execute Imputation (${currentTotalMissing} missing)` : 'No Missing Values to Impute'}
          </button>
        </div>
      </div>

      {/* Before / After Missing Comparison Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Before / After Missing Counts by Feature
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Tracks the missingness reduction and exact substitution value per column.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100/80 text-neutral-600 border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-3 font-mono font-medium text-neutral-400 w-12 text-center">#</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700">Column Name</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700">Type</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Before Missing</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">After Missing</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700">Imputed Method</th>
                <th className="py-2.5 px-3 font-medium text-neutral-700">Imputed Value Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {dataset.columns.map((col, idx) => {
                const colType = dataset.columnTypes[col];
                const beforeMissing = currentMissingPerCol[col] || 0;
                const matchedComp = comparisons?.find(c => c.column === col);

                return (
                  <tr key={col} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-neutral-400 text-center">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium font-mono text-neutral-900">{col}</td>
                    <td className="py-2.5 px-3 text-neutral-600">
                      <span className={`text-[11px] font-medium ${colType === 'numeric' ? 'text-blue-700' : 'text-amber-700'}`}>
                        {colType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {beforeMissing > 0 ? (
                        <span className="text-amber-700 font-semibold">{beforeMissing}</span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {matchedComp ? (
                        <span className="text-emerald-600 font-semibold">0</span>
                      ) : beforeMissing === 0 ? (
                        <span className="text-emerald-600">0</span>
                      ) : (
                        <span className="text-amber-700">{beforeMissing}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-700 capitalize">
                      {matchedComp?.imputedMethod && matchedComp.imputedMethod !== 'none'
                        ? matchedComp.imputedMethod
                        : beforeMissing > 0
                        ? (colType === 'numeric' ? numericStrategy : 'mode')
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-neutral-800">
                      {matchedComp?.imputedValue !== undefined && matchedComp.imputedValue !== null
                        ? String(matchedComp.imputedValue)
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
