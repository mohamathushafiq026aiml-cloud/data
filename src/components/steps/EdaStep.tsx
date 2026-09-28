import React, { useState } from 'react';
import { HelpCircle, BarChart2, Hash, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Dataset, PipelineStepId } from '../../types';
import {
  calculateMissingSummary,
  calculateNumericStats,
  calculateClassBalance
} from '../../utils/stats';

interface EdaStepProps {
  dataset: Dataset;
  onNavigate: (step: PipelineStepId) => void;
}

export const EdaStep: React.FC<EdaStepProps> = ({ dataset, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'missing' | 'numeric' | 'target'>('missing');

  // Default target column to 'Attrition' if present, else first categorical column
  const defaultTarget = dataset.columns.includes('Attrition')
    ? 'Attrition'
    : dataset.columns.find(c => dataset.columnTypes[c] === 'categorical') || dataset.columns[0];

  const [selectedTarget, setSelectedTarget] = useState<string>(defaultTarget);

  const missingSummary = calculateMissingSummary(dataset.columns, dataset.rows, dataset.columnTypes);
  const numericColumns = dataset.columns.filter(c => dataset.columnTypes[c] === 'numeric');
  const numericStats = numericColumns.map(col => calculateNumericStats(col, dataset.rows));
  const classBalance = selectedTarget ? calculateClassBalance(selectedTarget, dataset.rows) : null;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Exploratory Data Analysis (EDA)
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Analyze missingness distributions, central tendencies of numeric features, and target class balance.
          </p>
        </div>

        <button
          onClick={() => onNavigate('clean')}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 self-start cursor-pointer shadow-xs"
        >
          <span>Proceed to Data Cleaning</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200 self-start w-fit">
        <button
          onClick={() => setActiveTab('missing')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'missing'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Missing Values Count</span>
        </button>

        <button
          onClick={() => setActiveTab('numeric')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'numeric'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Numeric Feature Statistics</span>
        </button>

        <button
          onClick={() => setActiveTab('target')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'target'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Target Class Balance</span>
        </button>
      </div>

      {/* TAB 1: Missing Values Overview */}
      {activeTab === 'missing' && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden space-y-0">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Missing Values Summary per Column</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Columns with missing null or empty values that must be imputed before ML modeling.
              </p>
            </div>
            <div className="text-xs text-neutral-600 font-mono">
              Total rows: <span className="font-semibold text-neutral-900">{dataset.rows.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100/80 text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3 font-mono font-medium text-neutral-400 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700">Column Name</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700">Type</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Valid Rows</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Missing Count</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Missing %</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 w-44">Missing Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {missingSummary.map((item, idx) => (
                  <tr key={item.column} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-neutral-400 text-center">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium font-mono text-neutral-900">{item.column}</td>
                    <td className="py-2.5 px-3 text-neutral-600">
                      <span className={`text-[11px] font-medium ${item.type === 'numeric' ? 'text-blue-700' : 'text-amber-700'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-700">
                      {item.validCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {item.missingCount > 0 ? (
                        <span className="font-semibold text-amber-700">{item.missingCount}</span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-700">
                      {item.missingPercent.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-300 ${
                            item.missingPercent > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(item.missingPercent, 2)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Numeric Feature Statistics */}
      {activeTab === 'numeric' && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Descriptive Statistics for Numeric Features</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Measures of central tendency, dispersion, extremes, and flagged negative anomalies.
              </p>
            </div>
            <div className="text-xs text-neutral-500">
              Columns evaluated: <span className="font-mono font-medium text-neutral-800">{numericStats.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100/80 text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3 font-mono font-medium text-neutral-400 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700">Feature</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Valid (n)</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Missing</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Mean</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Median</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Std Dev</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Min</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Max</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Negative Anom.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {numericStats.map((stat, idx) => (
                  <tr key={stat.column} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-neutral-400 text-center">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium font-mono text-neutral-900">{stat.column}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-700">{stat.validCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {stat.missingCount > 0 ? (
                        <span className="text-amber-700 font-semibold">{stat.missingCount}</span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-800 font-medium">
                      {stat.mean.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-800">
                      {stat.median.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-600">
                      {stat.std.toLocaleString()}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono tabular-nums ${stat.min < 0 ? 'text-rose-600 font-bold bg-rose-50/50' : 'text-neutral-700'}`}>
                      {stat.min.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-700">
                      {stat.max.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {stat.negativeCount > 0 ? (
                        <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                          {stat.negativeCount} flagged (&lt; 0)
                        </span>
                      ) : (
                        <span className="text-emerald-600">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-neutral-50/50 border-t border-neutral-200 text-xs text-neutral-600">
            <strong>EDA Observation:</strong> Check if median and mean diverge significantly. For example, if mean is influenced by outliers or corrupted negative values, median is the robust measure of central tendency for missing value imputation.
          </div>
        </div>
      )}

      {/* TAB 3: Target Class Balance */}
      {activeTab === 'target' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Target Feature Class Balance</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Machine learning classifiers require balanced or stratified class distributions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-neutral-700">Select Target Column:</label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="bg-neutral-50 border border-neutral-300 rounded-md px-3 py-1.5 text-xs text-neutral-900 font-medium focus:outline-none focus:border-neutral-900"
                >
                  {dataset.columns.map(col => (
                    <option key={col} value={col}>{col} ({dataset.columnTypes[col]})</option>
                  ))}
                </select>
              </div>
            </div>

            {classBalance && (
              <div className="mt-5 space-y-6">
                {/* Imbalance Status Banner */}
                <div className={`p-4 rounded-lg border text-xs flex items-start gap-3 ${
                  classBalance.isBalanced
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}>
                  {classBalance.isBalanced ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold">
                      {classBalance.isBalanced ? 'Relatively Balanced Distribution' : 'Class Imbalance Detected'}
                    </span>
                    <p className="mt-1 text-neutral-600">
                      Imbalance ratio is <strong className="font-mono tabular-nums">{classBalance.imbalanceRatio}:1</strong> across {classBalance.classes.length} classes ({classBalance.totalValid} valid samples).
                      {!classBalance.isBalanced && (
                        <span> In ML workflows, use Stratified K-Fold cross-validation, weighted loss functions, or precision-recall metrics rather than raw accuracy.</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Class Distribution Visual Bars */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-neutral-700">
                    Distribution of "{classBalance.targetColumn}"
                  </div>

                  <div className="space-y-3">
                    {classBalance.classes.map((cls) => (
                      <div key={cls.className} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-neutral-800 font-mono">
                            {cls.className === '' ? '(empty)' : cls.className}
                          </span>
                          <div className="flex items-center gap-2 text-neutral-600">
                            <span className="font-mono tabular-nums font-semibold text-neutral-900">{cls.count}</span>
                            <span>({cls.percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-100 h-3 rounded-md overflow-hidden">
                          <div
                            className="bg-neutral-800 h-full rounded-md transition-all duration-300"
                            style={{ width: `${cls.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Class Counts Table */}
                <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-100/80 text-neutral-600 border-b border-neutral-200">
                      <tr>
                        <th className="py-2 px-3 font-medium">Class Value</th>
                        <th className="py-2 px-3 font-medium text-right">Sample Count</th>
                        <th className="py-2 px-3 font-medium text-right">Percentage</th>
                        <th className="py-2 px-3 font-medium text-right">Ratio to Majority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {classBalance.classes.map((cls) => {
                        const majorityCount = classBalance.classes[0].count;
                        const ratio = majorityCount > 0 ? (cls.count / majorityCount).toFixed(2) : '1.0';
                        return (
                          <tr key={cls.className} className="hover:bg-neutral-50/80">
                            <td className="py-2 px-3 font-medium font-mono text-neutral-900">{cls.className}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-800">{cls.count}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-800">{cls.percentage}%</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-600">{ratio}x</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
