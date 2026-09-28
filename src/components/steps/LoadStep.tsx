import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Dataset, PipelineStepId } from '../../types';
import { getSampleDataset } from '../../data/sampleAttrition';
import { parseCSV } from '../../utils/csv';

interface LoadStepProps {
  currentDataset: Dataset | null;
  onLoadDataset: (dataset: Dataset, isSample: boolean) => void;
  onNavigate: (step: PipelineStepId) => void;
}

export const LoadStep: React.FC<LoadStepProps> = ({
  currentDataset,
  onLoadDataset,
  onNavigate
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    setErrorMsg(null);
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      setErrorMsg('Please upload a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text, file.name);
        onLoadDataset(parsed, false);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to parse CSV file. Ensure valid headers and comma delimiters.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed reading file.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = () => {
    setErrorMsg(null);
    const sample = getSampleDataset();
    onLoadDataset(sample, true);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Info */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">
          Load or Ingest Dataset
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Import your machine learning dataset via CSV, or launch the built-in Employee Attrition benchmark designed to demonstrate end-to-end data cleaning.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Two Column Ingestion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Built-in Sample Dataset */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col justify-between hover:border-neutral-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">
              Employee Attrition Benchmark
            </h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Curated student ML benchmark (45 employees) containing realistic real-world data flaws:
            </p>

            <ul className="mt-4 space-y-2 text-xs text-neutral-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span><strong>Messy casing &amp; whitespace</strong>: " sales ", "SALES", " Chicago " in categorical columns.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span><strong>Negative income anomalies</strong>: -3200, -4150, -5200 data entry mistakes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>Missing values</strong> in numeric (Age, MonthlyIncome) and categorical fields.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 mt-1.5 shrink-0" />
                <span><strong>Non-predictive ID column</strong> (<code>EmployeeID</code>) ready for dropping.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100">
            <button
              onClick={handleLoadSample}
              className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Load Employee Attrition Dataset</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Option 2: Upload CSV */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col justify-between items-center text-center transition-all ${
            dragOver
              ? 'border-neutral-900 bg-neutral-50/80'
              : 'border-neutral-300 hover:border-neutral-400 bg-white'
          }`}
        >
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">
              Upload Custom CSV
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
              Drag &amp; drop your CSV file here, or click to browse from your device.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </div>

          <div className="w-full pt-4 border-t border-neutral-100">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Browse CSV File
            </button>
          </div>
        </div>
      </div>

      {/* Current Dataset Active Card */}
      {currentDataset && (
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-900">
                Dataset Active: <span className="font-semibold">{currentDataset.name}</span>
              </div>
              <div className="text-xs text-emerald-700/80 flex items-center gap-2 mt-0.5">
                <span className="font-mono tabular-nums">{currentDataset.rows.length} rows</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{currentDataset.columns.length} columns</span>
                <span aria-hidden="true">·</span>
                <span>Ready for inspection &amp; preprocessing</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('overview')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Proceed to Overview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
