import React, { useState } from 'react';
import { TrendingUp, ArrowRight, Target, Info, CheckCircle2 } from 'lucide-react';
import { Dataset, PipelineStepId } from '../../types';
import { calculateFeatureCorrelations } from '../../utils/stats';

interface FeatureSelectionStepProps {
  dataset: Dataset;
  onNavigate: (step: PipelineStepId) => void;
  onLogStep?: (log: {
    actionSummary: string;
    details: string[];
    mlRationale: string;
    changesCount: number;
  }) => void;
}

export const FeatureSelectionStep: React.FC<FeatureSelectionStepProps> = ({
  dataset,
  onNavigate,
  onLogStep
}) => {
  // Default target column to 'Attrition' or the last column
  const defaultTarget = dataset.columns.includes('Attrition')
    ? 'Attrition'
    : dataset.columns[dataset.columns.length - 1];

  const [selectedTarget, setSelectedTarget] = useState<string>(defaultTarget);
  const [viewMode, setViewMode] = useState<'both' | 'chart' | 'table'>('both');

  const correlations = calculateFeatureCorrelations(
    selectedTarget,
    dataset.columns,
    dataset.rows,
    dataset.columnTypes
  );

  const topPredictors = correlations.filter(c => c.strength !== 'Weak');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Feature Selection &amp; Target Correlation
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Quantify linear association of each feature with the ML target to identify key predictors and filter uninformative noise.
          </p>
        </div>

        <button
          onClick={() => onNavigate('export')}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 self-start cursor-pointer shadow-xs"
        >
          <span>Proceed to Export &amp; Log</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target Selector Banner */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-neutral-900 text-white">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-900">
              Target Prediction Variable (y)
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              Calculating Pearson correlation coefficient <em>r</em> between feature vector <strong>X</strong> and target <strong>y</strong>.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-neutral-700">Target:</label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="bg-neutral-50 border border-neutral-300 rounded-md px-3 py-1.5 text-xs text-neutral-900 font-semibold focus:outline-none focus:border-neutral-900"
          >
            {dataset.columns.map(col => (
              <option key={col} value={col}>{col} ({dataset.columnTypes[col]})</option>
            ))}
          </select>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-600">
          Showing correlation for <span className="font-semibold text-neutral-900 font-mono">{correlations.length}</span> numeric &amp; encoded features.
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200">
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'both' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Chart &amp; Table
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'chart' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Bar Chart Only
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Sorted Table Only
          </button>
        </div>
      </div>

      {/* Visual Correlation Bar Chart */}
      {(viewMode === 'both' || viewMode === 'chart') && (
        <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Correlation Coefficient Magnitude &amp; Direction Chart
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Bars to the left indicate negative correlation; bars to the right indicate positive correlation.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" /> Positive (r &gt; 0)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" /> Negative (r &lt; 0)
              </span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {correlations.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No numeric or encoded features available for correlation analysis.
              </div>
            ) : (
              correlations.map(item => {
                const isPositive = item.correlation >= 0;
                const barWidth = Math.min(100, Math.round(item.absCorrelation * 100));

                return (
                  <div key={item.feature} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium text-neutral-800">
                        {item.feature}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-neutral-500">
                          {item.strength}
                        </span>
                        <span className={`font-mono tabular-nums font-semibold ${
                          isPositive ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {item.correlation > 0 ? `+${item.correlation}` : item.correlation}
                        </span>
                      </div>
                    </div>

                    {/* Dual Bi-directional Bar with Zero Axis */}
                    <div className="grid grid-cols-2 gap-0 h-4 bg-neutral-50 rounded-sm border border-neutral-200 overflow-hidden relative">
                      {/* Left Half: Negative */}
                      <div className="flex justify-end border-r border-neutral-400/80 pr-0.5 items-center">
                        {!isPositive && (
                          <div
                            className="bg-rose-500 h-2.5 rounded-xs transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                        )}
                      </div>

                      {/* Right Half: Positive */}
                      <div className="flex justify-start pl-0.5 items-center">
                        {isPositive && (
                          <div
                            className="bg-emerald-600 h-2.5 rounded-xs transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Sorted Correlation Table */}
      {(viewMode === 'both' || viewMode === 'table') && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Ranked Correlation Table with Target ({selectedTarget})
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Sorted by absolute correlation magnitude (|r|).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100/80 text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3 font-mono font-medium text-neutral-400 w-12 text-center">Rank</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700">Feature Name</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Pearson (r)</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700 text-right">Magnitude (|r|)</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700">Direction</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700">Strength</th>
                  <th className="py-2.5 px-3 font-medium text-neutral-700">ML Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {correlations.map((item, idx) => {
                  return (
                    <tr key={item.feature} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-neutral-400 text-center">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium font-mono text-neutral-900">{item.feature}</td>
                      <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-semibold ${
                        item.correlation >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {item.correlation > 0 ? `+${item.correlation}` : item.correlation}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-800">
                        {item.absCorrelation}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700 capitalize">
                        {item.direction}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[11px] font-medium ${
                          item.strength === 'Strong'
                            ? 'text-emerald-700'
                            : item.strength === 'Moderate'
                            ? 'text-blue-700'
                            : 'text-neutral-500'
                        }`}>
                          {item.strength}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 text-[11px]">
                        {item.strength === 'Strong'
                          ? 'High predictive linear weight. Essential core feature.'
                          : item.strength === 'Moderate'
                          ? 'Moderate predictor. Retain for tree/linear ensemble models.'
                          : 'Low linear association. May be pruned if using L1/Lasso regression.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ML Guidance Note */}
      <div className="p-4 bg-neutral-100/70 border border-neutral-200 rounded-lg text-xs text-neutral-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-neutral-800">Machine Learning Rationale for Feature Selection:</span>
          <p>
            Pearson's <em>r</em> evaluates linear dependence between inputs and outcomes. Features with negligible correlation (|r| &lt; 0.05) increase model variance without boosting accuracy (Curse of Dimensionality). Identifying strongly correlated features also flags high-impact drivers for feature engineering and interpretability (e.g., SHAP/LIME feature importances).
          </p>
        </div>
      </div>
    </div>
  );
};
