import React, { useState } from 'react';
import { X, Sparkles, Layers, ArrowRight, Check } from 'lucide-react';
import { Dataset, FeatureEngOperation, FeatureEngineeringConfig } from '../types';

interface AddFeatureModalProps {
  dataset: Dataset;
  isOpen: boolean;
  onClose: () => void;
  onAddFeature: (config: FeatureEngineeringConfig) => void;
}

export const AddFeatureModal: React.FC<AddFeatureModalProps> = ({
  dataset,
  isOpen,
  onClose,
  onAddFeature
}) => {
  const numericCols = dataset.columns.filter(c => dataset.columnTypes[c] === 'numeric');

  const [featureName, setFeatureName] = useState('');
  const [operation, setOperation] = useState<FeatureEngOperation>('interaction');
  const [colA, setColA] = useState(numericCols[0] || dataset.columns[0]);
  const [colB, setColB] = useState(numericCols[1] || numericCols[0] || dataset.columns[0]);
  const [mathOp, setMathOp] = useState<'multiply' | 'divide' | 'add' | 'subtract'>('multiply');
  const [degree, setDegree] = useState<number>(2);
  const [binThreshold1, setBinThreshold1] = useState<number>(30);
  const [binThreshold2, setBinThreshold2] = useState<number>(45);

  if (!isOpen) return null;

  // Auto-generate name suggestion
  const defaultName = operation === 'interaction'
    ? `${colA}_${mathOp}_${colB}`
    : operation === 'ratio'
    ? `${colA}_per_${colB}`
    : operation === 'polynomial'
    ? `${colA}_pow${degree}`
    : `${colA}_binned`;

  const finalName = featureName.trim() || defaultName;

  // Compute 4 preview rows
  const previewRows = dataset.rows.slice(0, 4).map(r => {
    const valA = r[colA];
    const numA = typeof valA === 'number' ? valA : Number(valA);
    let calculated: any = 'null';

    if (operation === 'interaction') {
      const valB = r[colB];
      const numB = typeof valB === 'number' ? valB : Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        if (mathOp === 'add') calculated = numA + numB;
        else if (mathOp === 'subtract') calculated = numA - numB;
        else if (mathOp === 'divide') calculated = numB !== 0 ? (numA / numB).toFixed(2) : 'null';
        else calculated = (numA * numB).toFixed(2);
      }
    } else if (operation === 'ratio') {
      const valB = r[colB];
      const numB = typeof valB === 'number' ? valB : Number(valB);
      if (!isNaN(numA) && !isNaN(numB) && numB !== 0) {
        calculated = (numA / numB).toFixed(2);
      }
    } else if (operation === 'polynomial') {
      if (!isNaN(numA)) calculated = Math.pow(numA, degree).toFixed(2);
    } else if (operation === 'binning') {
      if (!isNaN(numA)) {
        if (numA < binThreshold1) calculated = 'Low';
        else if (numA < binThreshold2) calculated = 'Mid';
        else calculated = 'High';
      }
    }

    return {
      id: r[dataset.columns[0]],
      valA,
      valB: r[colB],
      result: calculated
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFeature({
      newColumnName: finalName,
      operation,
      colA,
      colB,
      mathOp,
      degree,
      binThresholds: [binThreshold1, binThreshold2],
      binLabels: ['Low', 'Mid', 'High']
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neutral-800" />
              <span>Engineer New Feature (Add Column)</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Construct synthetic features, cross-column interactions, ratios, or bins to enhance model accuracy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Feature Name */}
          <div className="space-y-1">
            <label className="font-medium text-neutral-700 block">
              New Feature Name:
            </label>
            <input
              type="text"
              placeholder={defaultName}
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-md font-mono focus:bg-white focus:border-neutral-900 focus:outline-none"
            />
          </div>

          {/* Operation Selector */}
          <div className="space-y-1.5">
            <label className="font-medium text-neutral-700 block">
              Engineering Transformation Technique:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'interaction', label: 'Interaction (A × B)', desc: 'Multiplication or addition of two features' },
                { id: 'ratio', label: 'Feature Ratio (A / B)', desc: 'Normalized rate or unit proportion' },
                { id: 'polynomial', label: 'Polynomial (A^n)', desc: 'Powers for non-linear curve fitting' },
                { id: 'binning', label: 'Discretization / Binning', desc: 'Partition continuous values into buckets' }
              ].map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setOperation(item.id as any)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    operation === item.id
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="font-medium text-xs">{item.label}</div>
                  <div className={`text-[10px] mt-0.5 ${operation === item.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Inputs Selection */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div>
              <label className="font-medium text-neutral-700 block mb-1">
                Primary Feature (A):
              </label>
              <select
                value={colA}
                onChange={(e) => setColA(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-md px-2 py-1.5 font-mono focus:outline-none"
              >
                {numericCols.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {(operation === 'interaction' || operation === 'ratio') && (
              <div>
                <label className="font-medium text-neutral-700 block mb-1">
                  Secondary Feature (B):
                </label>
                <select
                  value={colB}
                  onChange={(e) => setColB(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-md px-2 py-1.5 font-mono focus:outline-none"
                >
                  {numericCols.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {operation === 'interaction' && (
              <div className="col-span-2 pt-2 border-t border-neutral-200">
                <label className="font-medium text-neutral-700 block mb-1">
                  Arithmetic Operator:
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'multiply', label: 'Multiply (×)' },
                    { id: 'divide', label: 'Divide (÷)' },
                    { id: 'add', label: 'Add (+)' },
                    { id: 'subtract', label: 'Subtract (−)' }
                  ].map(op => (
                    <button
                      type="button"
                      key={op.id}
                      onClick={() => setMathOp(op.id as any)}
                      className={`px-3 py-1 rounded border text-xs cursor-pointer ${
                        mathOp === op.id
                          ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {operation === 'polynomial' && (
              <div className="col-span-2 pt-2 border-t border-neutral-200">
                <label className="font-medium text-neutral-700 block mb-1">
                  Power Degree:
                </label>
                <div className="flex items-center gap-2">
                  {[2, 3, 4].map(deg => (
                    <button
                      type="button"
                      key={deg}
                      onClick={() => setDegree(deg)}
                      className={`px-3 py-1 rounded border text-xs cursor-pointer ${
                        degree === deg
                          ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                          : 'bg-white text-neutral-700 border-neutral-200'
                      }`}
                    >
                      Power of {deg} (x^{deg})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {operation === 'binning' && (
              <div className="col-span-2 pt-2 border-t border-neutral-200 space-y-2">
                <label className="font-medium text-neutral-700 block">
                  Bucket Threshold Cutoffs:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-500 block mb-0.5">Threshold 1 (Low / Mid):</span>
                    <input
                      type="number"
                      value={binThreshold1}
                      onChange={(e) => setBinThreshold1(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded px-2 py-1 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 block mb-0.5">Threshold 2 (Mid / High):</span>
                    <input
                      type="number"
                      value={binThreshold2}
                      onChange={(e) => setBinThreshold2(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded px-2 py-1 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Box */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="p-2.5 bg-neutral-100/70 border-b border-neutral-200 font-medium text-neutral-700 flex items-center justify-between">
              <span>Preview: First 4 Calculations</span>
              <span className="font-mono text-neutral-500 font-normal">Column: {finalName}</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="p-2 font-mono">Row</th>
                  <th className="p-2 font-mono">{colA}</th>
                  {(operation === 'interaction' || operation === 'ratio') && (
                    <th className="p-2 font-mono">{colB}</th>
                  )}
                  <th className="p-2 font-mono font-bold text-neutral-900 text-right bg-emerald-50/40">
                    =&gt; {finalName}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {previewRows.map((r, i) => (
                  <tr key={i}>
                    <td className="p-2 font-mono text-neutral-400">#{i + 1}</td>
                    <td className="p-2 font-mono text-neutral-700">{String(r.valA)}</td>
                    {(operation === 'interaction' || operation === 'ratio') && (
                      <td className="p-2 font-mono text-neutral-700">{String(r.valB)}</td>
                    )}
                    <td className="p-2 font-mono font-semibold text-neutral-900 text-right bg-emerald-50/20">
                      {String(r.result)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action CTAs */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer shadow-xs"
            >
              Add Feature Column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
