import React, { useState } from 'react';
import { Binary, MoveUp, MoveDown, CheckCircle2, ArrowRight, Layers } from 'lucide-react';
import { Dataset, PipelineStepId } from '../../types';
import { labelEncodeOrdinal, oneHotEncodeNominal } from '../../utils/transforms';

interface EncodeStepProps {
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

export const EncodeStep: React.FC<EncodeStepProps> = ({
  dataset,
  onUpdateDataset,
  onNavigate
}) => {
  const categoricalCols = dataset.columns.filter(c => dataset.columnTypes[c] === 'categorical');

  // Part 1: Ordinal Encoding State
  const defaultOrdinalCol = categoricalCols.find(c =>
    c.toLowerCase().includes('education') || c.toLowerCase().includes('score') || c.toLowerCase().includes('level')
  ) || categoricalCols[0] || '';

  const [selectedOrdinalCol, setSelectedOrdinalCol] = useState<string>(defaultOrdinalCol);
  const [orderedCategories, setOrderedCategories] = useState<string[]>([]);
  const [ordinalColMapping, setOrdinalColMapping] = useState<Record<string, number> | null>(null);

  // Update categories when selected column changes
  React.useEffect(() => {
    if (selectedOrdinalCol && dataset.columns.includes(selectedOrdinalCol)) {
      const distinct = Array.from(new Set(
        dataset.rows
          .map(r => r[selectedOrdinalCol])
          .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
          .map(v => String(v).trim())
      )).sort();
      setOrderedCategories(distinct);
    }
  }, [selectedOrdinalCol, dataset]);

  // Part 2: One-Hot Encoding State
  const [selectedNominalCols, setSelectedNominalCols] = useState<string[]>(
    categoricalCols.filter(c => c !== selectedOrdinalCol && c !== 'Attrition')
  );
  const [dropFirst, setDropFirst] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  // Move category up in rank
  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newArr = [...orderedCategories];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setOrderedCategories(newArr);
  };

  // Execute Ordinal Label Encoding
  const handleApplyOrdinalEncoding = () => {
    if (!selectedOrdinalCol || orderedCategories.length === 0) return;

    const { updatedDataset, mapping } = labelEncodeOrdinal(
      dataset,
      selectedOrdinalCol,
      orderedCategories
    );

    setOrdinalColMapping(mapping);

    const mappingDetails = orderedCategories.map((cat, idx) => `"${cat}" → ${idx}`);

    onUpdateDataset(updatedDataset, {
      actionSummary: `Label-encoded ordinal column "${selectedOrdinalCol}" with user-specified hierarchy (${orderedCategories.length} levels)`,
      details: [
        `Target feature: ${selectedOrdinalCol}`,
        `Ordered mapping: ${mappingDetails.join(', ')}`,
        `Column converted to continuous numeric type`
      ],
      mlRationale: `Ordinal features possess an intrinsic natural hierarchy (e.g. High School < Bachelor < Master < PhD). Label encoding with integer ranks [0, 1, 2, ...] mathematically encodes this order so models can compute monotonic directional relationships without blowing up feature dimensionality.`,
      changesCount: dataset.rows.length
    });

    setNotification(`Successfully label-encoded "${selectedOrdinalCol}" with ${orderedCategories.length} hierarchical levels.`);
  };

  // Execute One-Hot Encoding
  const handleApplyOneHotEncoding = () => {
    if (selectedNominalCols.length === 0) return;

    const { updatedDataset, newColumnsAdded } = oneHotEncodeNominal(
      dataset,
      selectedNominalCols,
      dropFirst
    );

    onUpdateDataset(updatedDataset, {
      actionSummary: `One-hot encoded ${selectedNominalCols.length} nominal feature(s): [${selectedNominalCols.join(', ')}] into ${newColumnsAdded.length} binary dummy features`,
      details: [
        `Encoded features: ${selectedNominalCols.join(', ')}`,
        `Dummy columns created: ${newColumnsAdded.join(', ')}`,
        `Drop first category: ${dropFirst ? 'Yes (prevents multicollinearity)' : 'No'}`
      ],
      mlRationale: 'Nominal features (like Department or City) have no inherent mathematical ranking. Arbitrary integer encoding would falsely impose an artificial numerical distance (e.g., Chicago=1 vs New York=2 implies New York is 2x Chicago). One-hot encoding creates orthogonal binary indicator features suitable for linear, distance-based, and neural models.',
      changesCount: newColumnsAdded.length
    });

    setNotification(`Created ${newColumnsAdded.length} one-hot encoded binary columns.`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Categorical Feature Encoding
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Encode ordinal features with user-defined hierarchy, and convert nominal features into binary one-hot dummies.
          </p>
        </div>

        <button
          onClick={() => onNavigate('normalize')}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 self-start cursor-pointer shadow-xs"
        >
          <span>Continue to Normalization</span>
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

      {/* Part 1: Ordinal Label Encoding */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-neutral-100 text-neutral-800">
              <Binary className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                1. Ordinal Label Encoding (User-Defined Ranking)
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Assign ascending integer values (0, 1, 2, ...) to categories that possess a natural progressive order (e.g. Education level).
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-medium text-neutral-700">Select Ordinal Feature:</label>
            <select
              value={selectedOrdinalCol}
              onChange={(e) => setSelectedOrdinalCol(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 rounded-md px-3 py-1.5 text-xs text-neutral-900 font-medium focus:outline-none"
            >
              {categoricalCols.length === 0 ? (
                <option value="">No categorical columns available</option>
              ) : (
                categoricalCols.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))
              )}
            </select>
          </div>

          {selectedOrdinalCol && orderedCategories.length > 0 && (
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="text-xs font-semibold text-neutral-700 mb-2">
                Arrange Category Order (Lowest Rank 0 to Highest Rank):
              </div>
              <div className="space-y-1.5">
                {orderedCategories.map((cat, idx) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2 bg-white rounded border border-neutral-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-neutral-900 text-white font-mono text-center flex items-center justify-center font-bold text-[11px]">
                        {idx}
                      </span>
                      <span className="font-medium text-neutral-900">{cat}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveCategory(idx, 'up')}
                        disabled={idx === 0}
                        title="Move higher in hierarchy"
                        className="p-1 rounded hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveCategory(idx, 'down')}
                        disabled={idx === orderedCategories.length - 1}
                        title="Move lower in hierarchy"
                        className="p-1 rounded hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500">
              Converts text string into numeric rank [0..{orderedCategories.length - 1}].
            </span>
            <button
              onClick={handleApplyOrdinalEncoding}
              disabled={!selectedOrdinalCol || orderedCategories.length === 0}
              className="py-1.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-40 cursor-pointer"
            >
              Apply Ordinal Encoding
            </button>
          </div>
        </div>
      </div>

      {/* Part 2: One-Hot Encoding */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-neutral-100 text-neutral-800">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                2. One-Hot Encoding (Nominal Features)
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Generate binary indicator variables (0 or 1) for unordered nominal categories like Department or City.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1.5">
              Select Nominal Columns to One-Hot Encode:
            </label>
            <div className="flex flex-wrap gap-2">
              {categoricalCols.length === 0 ? (
                <span className="text-xs text-neutral-400">All categorical columns are already encoded.</span>
              ) : (
                categoricalCols.map(col => {
                  const isChecked = selectedNominalCols.includes(col);
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
                            setSelectedNominalCols([...selectedNominalCols, col]);
                          } else {
                            setSelectedNominalCols(selectedNominalCols.filter(c => c !== col));
                          }
                        }}
                        className="hidden"
                      />
                      <span>{col}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-md border border-neutral-200">
            <input
              type="checkbox"
              id="dropFirst"
              checked={dropFirst}
              onChange={(e) => setDropFirst(e.target.checked)}
              className="rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="dropFirst" className="text-xs text-neutral-700 cursor-pointer">
              <strong>Drop first category (k-1 encoding)</strong>: Recommended for Linear &amp; Logistic Regression to prevent multicollinearity (dummy variable trap).
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500">
              {selectedNominalCols.length} column(s) chosen for one-hot vectorization.
            </span>
            <button
              onClick={handleApplyOneHotEncoding}
              disabled={selectedNominalCols.length === 0}
              className="py-1.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-40 cursor-pointer"
            >
              Apply One-Hot Encoding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
