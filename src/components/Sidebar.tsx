import React from 'react';
import {
  UploadCloud,
  LayoutGrid,
  BarChart3,
  Sparkles,
  HelpCircle,
  Binary,
  Maximize2,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { PipelineStepId } from '../types';

interface StepItem {
  id: PipelineStepId;
  number: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: StepItem[] = [
  {
    id: 'load',
    number: '01',
    label: 'Load Dataset',
    description: 'Upload CSV or sample data',
    icon: UploadCloud
  },
  {
    id: 'overview',
    number: '02',
    label: 'Raw Overview',
    description: 'Data types & first 10 rows',
    icon: LayoutGrid
  },
  {
    id: 'eda',
    number: '03',
    label: 'Exploratory EDA',
    description: 'Statistics & class balance',
    icon: BarChart3
  },
  {
    id: 'clean',
    number: '04',
    label: 'Data Cleaning',
    description: 'Text casing, negatives, drop cols',
    icon: Sparkles
  },
  {
    id: 'missing',
    number: '05',
    label: 'Missing Values',
    description: 'Impute median & mode',
    icon: HelpCircle
  },
  {
    id: 'encode',
    number: '06',
    label: 'Categorical Encoding',
    description: 'Ordinal order & one-hot dummies',
    icon: Binary
  },
  {
    id: 'normalize',
    number: '07',
    label: 'Normalization',
    description: 'Min-Max feature scaling',
    icon: Maximize2
  },
  {
    id: 'features',
    number: '08',
    label: 'Feature Selection',
    description: 'Target Pearson correlations',
    icon: TrendingUp
  },
  {
    id: 'export',
    number: '09',
    label: 'Export & Audit Log',
    description: 'Download CSV & Markdown log',
    icon: FileCheck
  }
];

interface SidebarProps {
  currentStep: PipelineStepId;
  onSelectStep: (step: PipelineStepId) => void;
  completedSteps: Set<PipelineStepId>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentStep,
  onSelectStep,
  completedSteps
}) => {
  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0 h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-neutral-200">
        <div className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
          Preprocessing Pipeline
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Complete stages sequentially or jump to any step.
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isDone = completedSteps.has(step.id);
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-3 cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <div className={`mt-0.5 p-1.5 rounded-md ${
                isActive
                  ? 'bg-neutral-800 text-white'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-neutral-100 text-neutral-500'
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-medium ${
                    isActive ? 'text-neutral-300' : 'text-neutral-400'
                  }`}>
                    {step.number}
                  </span>
                  {isDone && !isActive && (
                    <span className="text-[10px] font-medium text-emerald-600">
                      Applied
                    </span>
                  )}
                </div>
                <div className={`text-sm font-medium truncate ${
                  isActive ? 'text-white' : 'text-neutral-900'
                }`}>
                  {step.label}
                </div>
                <div className={`text-xs truncate ${
                  isActive ? 'text-neutral-300' : 'text-neutral-500'
                }`}>
                  {step.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-200 bg-neutral-50/50">
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
          <span>Pipeline Progress</span>
          <span className="font-mono tabular-nums font-medium text-neutral-800">
            {completedSteps.size} / {STEPS.length}
          </span>
        </div>
        <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-neutral-900 h-full transition-all duration-300"
            style={{ width: `${(completedSteps.size / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
