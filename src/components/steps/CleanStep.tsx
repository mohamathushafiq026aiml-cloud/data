import React, { useState } from 'react';
import { Sparkles, Trash2, AlertOctagon, CheckCircle2, ArrowRight } from 'lucide-react';
import { Dataset, PipelineStepId } from '../../types';
import { cleanTextColumns, flagAndNullifyNegatives, dropColumns } from '../../utils/transforms';

interface CleanStepProps {
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

export const CleanStep: React.FC<CleanStepProps> = ({
  dataset,
  onUpdateDataset,
  onNavigate
}) => {
  // Action A state: Text casing & trim
  const categoricalCols = dataset.columns.filter(c => dataset.columnTypes[c] === 'categorical');
  const [selectedTextCols, setSelectedTextCols] = useState<string[]>(categoricalCols);
  const [casingOption, setCasingOption] = useState<'titlecase' | 'lowercase' | 'uppercase' | 'trim-only'>('titlecase');

  // Action B state: Negative numeric detection
  const numericCols = dataset.columns.filter(c => dataset.columnTypes[c] === 'numeric');
  const [selectedNumCols, setSelectedNumCols] = useState<string[]>(numericCols);

  // Scan current negative values
  const negativeReport: { column: string; count: number; sampleVals: number[] }[] = [];
  for (const col of numericCols) {
    const negatives: number[] = [];
    dataset.rows.forEach(r => {
      const v = r[col];
      if (typeof v === 'number' && v < 0) {
        negatives.push(v);
      }
    });
    if (negatives.length > 0) {
      negativeReport.push({
        column: col,
        count: negatives.length,
        sampleVals: negatives.slice(0, 5)
      });
    }
  }

  // Action C state: Drop columns
  const [colsToDrop, setColsToDrop] = useState<string[]>(
    dataset.columns.filter(c => c.toLowerCase().includes('id'))
  );

  const [notification, setNotification] = useState<string | null>(null);

  // 1. Handle Text Cleaning
  const handleApplyTextCleaning = () => {
    if (selectedTextCols.length === 0) return;
    const { updatedDataset, modifiedCount, columnsCleaned } = cleanTextColumns(
      dataset,
      casingOption,
      selectedTextCols
    );

    const casingLabel = casingOption === 'titlecase'
      ? 'Title Case'
      : casingOption === 'lowercase'
      ? 'lowercase'
      : casingOption === 'uppercase'
      ? 'UPPERCASE'
      : 'Trimmed whitespace only';

    onUpdateDataset(updatedDataset, {
      actionSummary: `Trimmed whitespace and standardized casing to ${casingLabel} on ${columnsCleaned.length} categorical columns`,
      details: [
        `Target columns: ${columnsCleaned.join(', ')}`,
        `Casing mode: ${casingLabel}`,
        `Total string cell values standardized or cleaned: ${modifiedCount}`
      ],
      mlRationale: 'Inconsistent string casing and leading/trailing whitespace create spurious duplicate categories (e.g. " sales " vs "Sales"), inflating feature cardinality and degrading ML tree splits and one-hot encoding representations.',
      changesCount: modifiedCount
    });

    setNotification(`Successfully standardized text across ${columnsCleaned.length} columns (${modifiedCount} cells modified).`);
  };

  // 2. Handle Negatives to Missing
  const handleConvertNegatives = () => {
    if (selectedNumCols.length === 0) return;
    const { updatedDataset, flaggedByColumn, totalFlagged } = flagAndNullifyNegatives(
      dataset,
      selectedNumCols
    );

    const details = Object.entries(flaggedByColumn)
      .filter(([_, count]) => count > 0)
      .map(([col, count]) => `${col}: converted ${count} negative values to missing (null)`);

    onUpdateDataset(updatedDataset, {
      actionSummary: `Flagged and converted ${totalFlagged} negative numeric anomalies to missing (null)`,
      details: details.length > 0 ? details : ['No negative values found in selected columns.'],
      mlRationale: 'Features such as salary, income, age, and tenure are strictly non-negative in real-world contexts. Negative entries represent measurement or keying errors that distort distributions; converting them to null allows controlled statistical imputation rather than biasing model weights.',
      changesCount: totalFlagged
    });

    setNotification(`Converted ${totalFlagged} negative anomalies to missing values.`);
  };

  // 3. Handle Dropping Columns
  const handleDropColumns = () => {
    if (colsToDrop.length === 0) return;
    const { updatedDataset, dropped } = dropColumns(dataset, colsToDrop);

    onUpdateDataset(updatedDataset, {
      actionSummary: `Dropped ${dropped.length} non-predictive column(s): ${dropped.join(', ')}`,
      details: [
        `Columns removed: ${dropped.join(', ')}`,
        `Remaining columns: ${updatedDataset.columns.length}`
      ],
      mlRationale: 'Identifier fields (like EmployeeID, UUIDs, or row numbers) have arbitrary unique values with zero generalizing predictive power. Leaving them in risks severe overfitting, data leakage, and high computational overhead.',
      changesCount: dropped.length
    });

    setColsToDrop([]);
    setNotification(`Dropped columns: ${dropped.join(', ')}.`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Data Cleaning &amp; Anomaly Remediation
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Standardize messy text, flag erroneous negative values, and drop unneeded identifier columns.
          </p>
        </div>

        <button
          onClick={() => onNavigate('missing')}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 self-start cursor-pointer shadow-xs"
        >
          <span>Continue to Missing Values</span>
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

      {/* Grid of 3 Cleaning Operations */}
      <div className="space-y-6">
        {/* OP 1: Text Casing & Whitespace */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-neutral-100 text-neutral-800">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  1. Trim Whitespace &amp; Standardize Text Casing
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Eliminates leading/trailing spaces and unifies casing so " sales " and "SALES" become identical categories.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1.5">
                Target Casing Format:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'titlecase', label: 'Title Case (Sales)' },
                  { id: 'lowercase', label: 'lowercase (sales)' },
                  { id: 'uppercase', label: 'UPPERCASE (SALES)' },
                  { id: 'trim-only', label: 'Trim spaces only' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setCasingOption(opt.id as any)}
                    className={`py-1.5 px-2.5 text-xs rounded border text-left cursor-pointer transition-all ${
                      casingOption === opt.id
                        ? 'border-neutral-900 bg-neutral-900 text-white font-medium'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1.5">
                Apply to Columns ({selectedTextCols.length} selected):
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-neutral-200 rounded-md bg-neutral-50/50">
                {categoricalCols.map(col => {
                  const isChecked = selectedTextCols.includes(col);
                  return (
                    <label
                      key={col}
                      className={`text-xs px-2 py-1 rounded border flex items-center gap-1.5 cursor-pointer select-none transition-colors ${
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
                            setSelectedTextCols([...selectedTextCols, col]);
                          } else {
                            setSelectedTextCols(selectedTextCols.filter(c => c !== col));
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
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500">
              ML Rationale: Eliminates artificial category divergence before encoding.
            </span>
            <button
              onClick={handleApplyTextCleaning}
              disabled={selectedTextCols.length === 0}
              className="py-1.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-40 cursor-pointer"
            >
              Apply Text Cleaning
            </button>
          </div>
        </div>

        {/* OP 2: Negative Numeric Anomalies */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-rose-50 text-rose-700">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  2. Flag Negative Values &amp; Convert to Missing
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Detects illegal negative values (e.g. negative monthly incomes or ages) and converts them to null for proper median imputation.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100">
            {negativeReport.length > 0 ? (
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-md text-xs text-rose-800 space-y-1.5 mb-4">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                  <span>Negative Anomalies Detected:</span>
                </div>
                {negativeReport.map(r => (
                  <div key={r.column} className="text-neutral-700">
                    • <strong>{r.column}</strong>: <span className="font-mono tabular-nums font-semibold text-rose-700">{r.count}</span> negative entry(s) detected (e.g. <span className="font-mono text-rose-600 font-medium">{r.sampleVals.join(', ')}</span>).
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-600 mb-4">
                No negative values currently found in numeric columns.
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[11px] text-neutral-500">
                Action: Converts values &lt; 0 to null (NaN) so they do not distort distribution medians and model weights.
              </span>
              <button
                onClick={handleConvertNegatives}
                disabled={negativeReport.length === 0}
                className="py-1.5 px-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-40 cursor-pointer shadow-xs whitespace-nowrap self-end sm:self-auto"
              >
                Flag &amp; Convert Negatives to Null
              </button>
            </div>
          </div>
        </div>

        {/* OP 3: Drop Columns */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-neutral-100 text-neutral-700">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  3. Drop Irrelevant or Identifier Columns
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Drop high-cardinality unique IDs (e.g. <code>EmployeeID</code>) or columns with no generalizing predictive value.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1.5">
                Select Columns to Drop:
              </label>
              <div className="flex flex-wrap gap-2">
                {dataset.columns.map(col => {
                  const isChecked = colsToDrop.includes(col);
                  const isId = col.toLowerCase().includes('id');
                  return (
                    <label
                      key={col}
                      className={`text-xs px-2.5 py-1 rounded border flex items-center gap-1.5 cursor-pointer select-none transition-colors ${
                        isChecked
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setColsToDrop([...colsToDrop, col]);
                          } else {
                            setColsToDrop(colsToDrop.filter(c => c !== col));
                          }
                        }}
                        className="hidden"
                      />
                      <span>{col}</span>
                      {isId && (
                        <span className="text-[10px] opacity-80">(Recommended)</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-neutral-500">
                {colsToDrop.length > 0 ? (
                  <span>Will permanently remove {colsToDrop.length} column(s) from dataset.</span>
                ) : (
                  <span>Select any columns above to drop.</span>
                )}
              </span>
              <button
                onClick={handleDropColumns}
                disabled={colsToDrop.length === 0}
                className="py-1.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-40 cursor-pointer"
              >
                Drop {colsToDrop.length} Column(s)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
