import React, { useState } from 'react';
import { Download, FileText, CheckCircle2, Copy, Check, Code, History } from 'lucide-react';
import { Dataset, PipelineLogEntry } from '../../types';
import { exportToCSV } from '../../utils/csv';
import { generateMarkdownLog } from '../../utils/transforms';

interface ExportStepProps {
  dataset: Dataset;
  logs: PipelineLogEntry[];
  initialRowCount: number;
  initialColCount: number;
  onDownloadCSV: () => void;
  onDownloadMarkdown: () => void;
}

export const ExportStep: React.FC<ExportStepProps> = ({
  dataset,
  logs,
  initialRowCount,
  initialColCount,
  onDownloadCSV,
  onDownloadMarkdown
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [viewTab, setViewTab] = useState<'log' | 'markdown' | 'python'>('log');

  const markdownContent = generateMarkdownLog(dataset, logs, initialRowCount, initialColCount);

  const pythonSnippet = `# Python & Scikit-Learn Integration
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

# 1. Load the cleaned, preprocessed dataset
df = pd.read_csv('${dataset.name.replace('.csv', '')}_cleaned.csv')

# 2. Separate features (X) and target variable (y)
target_column = '${dataset.columns.includes('Attrition') ? 'Attrition' : dataset.columns[dataset.columns.length - 1]}'
X = df.drop(columns=[target_column])
y = df[target_column]

# 3. Stratified Train / Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y if y.nunique() <= 5 else None
)

print(f"Dataset ready: {X_train.shape[0]} train rows, {X_test.shape[0]} test rows, {X_train.shape[1]} features.")

# 4. Train baseline classifier
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))
`;

  const copyToClipboard = (text: string, isMd: boolean) => {
    navigator.clipboard.writeText(text);
    if (isMd) {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">
          Export Prepared Dataset &amp; Audit Log
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Download your ready-to-train ML dataset and an academic markdown log documenting every transformation.
        </p>
      </div>

      {/* Primary Download CTAs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CSV Download */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between hover:border-neutral-300 transition-all">
          <div>
            <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">
              Cleaned Dataset (.csv)
            </h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Standardized, imputed, one-hot encoded, and Min-Max scaled data table ready for Pandas, PyTorch, TensorFlow, or Scikit-Learn.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-md border border-neutral-200 font-mono">
              <span>{dataset.rows.length} rows</span>
              <span className="text-neutral-300" aria-hidden="true">·</span>
              <span>{dataset.columns.length} columns</span>
              <span className="text-neutral-300" aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium">0 missing cells</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-100">
            <button
              onClick={onDownloadCSV}
              className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Cleaned CSV</span>
            </button>
          </div>
        </div>

        {/* Markdown Log Download */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between hover:border-neutral-300 transition-all">
          <div>
            <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">
              Preprocessing Audit Log (.md)
            </h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Publication-ready documentation detailing every cleaning step, mathematical formula, feature encoding, and machine learning rationale.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-md border border-neutral-200 font-mono">
              <span>{logs.length} pipeline actions logged</span>
              <span className="text-neutral-300" aria-hidden="true">·</span>
              <span>GitHub &amp; Overleaf compatible</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-100">
            <button
              onClick={onDownloadMarkdown}
              className="w-full py-2.5 px-4 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-neutral-600" />
              <span>Download Markdown Report (.md)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs for Log / Markdown / Python Preview */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewTab('log')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewTab === 'log'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Step-by-Step Chronology ({logs.length})</span>
            </button>

            <button
              onClick={() => setViewTab('markdown')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewTab === 'markdown'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown Source</span>
            </button>

            <button
              onClick={() => setViewTab('python')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewTab === 'python'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Python Integration Code</span>
            </button>
          </div>

          {viewTab === 'markdown' && (
            <button
              onClick={() => copyToClipboard(markdownContent, true)}
              className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer self-end sm:self-auto"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMd ? 'Copied Markdown!' : 'Copy Markdown'}</span>
            </button>
          )}

          {viewTab === 'python' && (
            <button
              onClick={() => copyToClipboard(pythonSnippet, false)}
              className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer self-end sm:self-auto"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied Python Script!' : 'Copy Python'}</span>
            </button>
          )}
        </div>

        {/* Tab 1: Chronological Steps Log */}
        {viewTab === 'log' && (
          <div className="p-5 divide-y divide-neutral-100">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No transformation actions logged yet. Apply operations in previous steps to build your log.
              </div>
            ) : (
              logs.map((entry, idx) => (
                <div key={entry.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-mono font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">
                        {entry.stepTitle}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-neutral-400">
                      {entry.timestamp}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-neutral-800 pl-7">
                    {entry.actionSummary}
                  </p>

                  {entry.details.length > 0 && (
                    <ul className="pl-7 space-y-1 text-xs text-neutral-600">
                      {entry.details.map((detail, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-1.5">
                          <span className="text-neutral-400">·</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="ml-7 mt-2 p-2.5 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-700">
                    <span className="font-semibold text-neutral-900">ML Rationale: </span>
                    <span>{entry.mlRationale}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Raw Markdown Source */}
        {viewTab === 'markdown' && (
          <div className="p-4 bg-neutral-900 text-neutral-100 font-mono text-xs overflow-x-auto max-h-[460px] leading-relaxed">
            <pre className="whitespace-pre-wrap">{markdownContent}</pre>
          </div>
        )}

        {/* Tab 3: Python Snippet */}
        {viewTab === 'python' && (
          <div className="p-4 bg-neutral-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[460px] leading-relaxed">
            <pre className="whitespace-pre-wrap">{pythonSnippet}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
