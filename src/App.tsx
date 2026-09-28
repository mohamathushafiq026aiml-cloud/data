import React, { useState, useEffect } from 'react';
import { ColumnType, Dataset, PipelineLogEntry, PipelineStepId } from './types';
import { getSampleDataset } from './data/sampleAttrition';
import { exportToCSV } from './utils/csv';
import { generateMarkdownLog, addCustomRow, addEngineeredFeature } from './utils/transforms';
import { FeatureEngineeringConfig } from './types';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { AddRowModal } from './components/AddRowModal';
import { AddFeatureModal } from './components/AddFeatureModal';
import { LoadStep } from './components/steps/LoadStep';
import { OverviewStep } from './components/steps/OverviewStep';
import { EdaStep } from './components/steps/EdaStep';
import { CleanStep } from './components/steps/CleanStep';
import { MissingValuesStep } from './components/steps/MissingValuesStep';
import { EncodeStep } from './components/steps/EncodeStep';
import { NormalizeStep } from './components/steps/NormalizeStep';
import { FeatureSelectionStep } from './components/steps/FeatureSelectionStep';
import { ExportStep } from './components/steps/ExportStep';

export default function App() {
  // Initialize with the sample Employee Attrition dataset so the user can immediately interact
  const initialSample = getSampleDataset();
  const [dataset, setDataset] = useState<Dataset>(initialSample);
  const [initialSnapshot, setInitialSnapshot] = useState<Dataset>(initialSample);
  const [currentStep, setCurrentStep] = useState<PipelineStepId>('overview');
  const [completedSteps, setCompletedSteps] = useState<Set<PipelineStepId>>(new Set(['load', 'overview']));
  const [isAddRowOpen, setIsAddRowOpen] = useState(false);
  const [isAddFeatureOpen, setIsAddFeatureOpen] = useState(false);
  const [logs, setLogs] = useState<PipelineLogEntry[]>([
    {
      id: 'init-1',
      step: 'load',
      stepTitle: 'Dataset Ingestion & Schema Parsing',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actionSummary: `Loaded benchmark dataset "${initialSample.name}" with ${initialSample.rows.length} records and ${initialSample.columns.length} columns`,
      details: [
        `Inferred ${initialSample.columns.filter(c => initialSample.columnTypes[c] === 'numeric').length} numeric columns`,
        `Inferred ${initialSample.columns.filter(c => initialSample.columnTypes[c] === 'categorical').length} categorical columns`,
        `Identified non-predictive ID column "EmployeeID" and negative values in "MonthlyIncome"`
      ],
      mlRationale: 'Initial ingestion and schema verification establish feature types, baseline cardinality, and data integrity boundaries before downstream algorithmic operations.'
    }
  ]);

  // Handler to load new dataset (custom upload or sample re-load)
  const handleLoadDataset = (newDataset: Dataset, isSample: boolean) => {
    setDataset(newDataset);
    setInitialSnapshot(newDataset);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setLogs([
      {
        id: `load-${Date.now()}`,
        step: 'load',
        stepTitle: 'Dataset Ingestion',
        timestamp: timeStr,
        actionSummary: `Ingested ${isSample ? 'built-in sample' : 'custom CSV'} "${newDataset.name}" (${newDataset.rows.length} rows, ${newDataset.columns.length} columns)`,
        details: [
          `Columns: ${newDataset.columns.join(', ')}`,
          `Numeric features: ${newDataset.columns.filter(c => newDataset.columnTypes[c] === 'numeric').length}`,
          `Categorical features: ${newDataset.columns.filter(c => newDataset.columnTypes[c] === 'categorical').length}`
        ],
        mlRationale: 'Valid CSV parsing establishes structural tabular consistency necessary for numerical computation and vectorization.'
      }
    ]);

    setCompletedSteps(new Set(['load', 'overview']));
    setCurrentStep('overview');
  };

  // Reset to initial snapshot
  const handleReset = () => {
    if (confirm('Reset dataset back to its original state? All transformations will be cleared.')) {
      setDataset(initialSnapshot);
      setCompletedSteps(new Set(['load', 'overview']));
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs([
        {
          id: `reset-${Date.now()}`,
          step: 'load',
          stepTitle: 'Pipeline Reset',
          timestamp: timeStr,
          actionSummary: `Reset dataset to original "${initialSnapshot.name}" snapshot`,
          details: ['Cleared all cleaning, imputation, encoding, and normalization transforms.'],
          mlRationale: 'Allows iterative parameter tuning and comparative testing across preprocessing hypotheses.'
        }
      ]);
      setCurrentStep('overview');
    }
  };

  // Update a column type (e.g. user toggles between categorical and numeric)
  const handleUpdateColumnType = (column: string, newType: ColumnType) => {
    setDataset(prev => ({
      ...prev,
      columnTypes: {
        ...prev.columnTypes,
        [column]: newType
      }
    }));
  };

  // Update dataset after any transformation step and append to audit log
  const handleUpdateDataset = (
    updated: Dataset,
    logInfo: {
      actionSummary: string;
      details: string[];
      mlRationale: string;
      changesCount: number;
    }
  ) => {
    setDataset(updated);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const stepTitles: Record<PipelineStepId, string> = {
      load: 'Data Ingestion',
      overview: 'Raw Overview',
      eda: 'Exploratory Data Analysis',
      clean: 'Data Cleaning & Remediation',
      missing: 'Missing Value Imputation',
      encode: 'Categorical Feature Encoding',
      normalize: 'Feature Normalization',
      features: 'Feature Correlation & Selection',
      export: 'Pipeline Export'
    };

    const newLog: PipelineLogEntry = {
      id: `log-${Date.now()}`,
      step: currentStep,
      stepTitle: stepTitles[currentStep] || currentStep,
      timestamp: timeStr,
      actionSummary: logInfo.actionSummary,
      details: logInfo.details,
      mlRationale: logInfo.mlRationale,
      changesCount: logInfo.changesCount
    };

    setLogs(prev => [...prev, newLog]);
    setCompletedSteps(prev => new Set([...prev, currentStep]));
  };

  // Handle adding a manual record
  const handleAddRow = (newRow: any) => {
    const updated = addCustomRow(dataset, newRow);
    setDataset(updated);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: PipelineLogEntry = {
      id: `addrow-${Date.now()}`,
      step: 'overview',
      stepTitle: 'Manual Record Addition',
      timestamp: timeStr,
      actionSummary: `Added 1 new sample record to dataset "${dataset.name}" (Row #${updated.rows.length})`,
      details: [
        `Record values: ${Object.entries(newRow).map(([k, v]) => `${k}=${v}`).join(', ')}`,
        `New row count: ${updated.rows.length}`
      ],
      mlRationale: 'Ingesting specific benchmark test cases or hypothetical profiles tests model generalization boundary conditions and inference pipelines.',
      changesCount: 1
    };

    setLogs(prev => [...prev, newLog]);
  };

  // Handle adding an engineered feature
  const handleAddFeature = (config: FeatureEngineeringConfig) => {
    const { updatedDataset, featureName, inferredType, description } = addEngineeredFeature(dataset, config);
    setDataset(updatedDataset);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: PipelineLogEntry = {
      id: `addfeat-${Date.now()}`,
      step: 'clean',
      stepTitle: 'Feature Engineering (Added Column)',
      timestamp: timeStr,
      actionSummary: `Engineered synthetic feature "${featureName}" (${inferredType})`,
      details: [
        `Operation: ${config.operation}`,
        `Calculation: ${description}`,
        `Added to dataset schema; total features now ${updatedDataset.columns.length}`
      ],
      mlRationale: 'Synthesizing non-linear feature interactions, normalized ratios, or domain-specific binning allows linear and tree models to capture complex multi-variable relationships without deep architecture complexity.',
      changesCount: updatedDataset.rows.length
    };

    setLogs(prev => [...prev, newLog]);
  };

  // Download cleaned CSV
  const handleDownloadCSV = () => {
    const csvContent = exportToCSV(dataset.columns, dataset.rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanName = dataset.name.endsWith('.csv')
      ? `${dataset.name.slice(0, -4)}_preprocessed.csv`
      : `${dataset.name}_preprocessed.csv`;
    link.href = url;
    link.setAttribute('download', cleanName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Markdown log
  const handleDownloadMarkdown = () => {
    const md = generateMarkdownLog(dataset, logs, initialSnapshot.rows.length, initialSnapshot.columns.length);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'preprocessing_audit_report.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col antialiased">
      {/* Top Bar Contract (Single wordmark, unboxed metadata, clean actions) */}
      <TopBar
        dataset={dataset}
        onReset={handleReset}
        onNavigate={setCurrentStep}
        onExportCSV={handleDownloadCSV}
        onExportMarkdown={handleDownloadMarkdown}
        onOpenAddRow={() => setIsAddRowOpen(true)}
        onOpenAddFeature={() => setIsAddFeatureOpen(true)}
        logsCount={logs.length}
      />

      {/* Add Row Modal */}
      <AddRowModal
        dataset={dataset}
        isOpen={isAddRowOpen}
        onClose={() => setIsAddRowOpen(false)}
        onAddRow={handleAddRow}
      />

      {/* Add / Engineer Feature Modal */}
      <AddFeatureModal
        dataset={dataset}
        isOpen={isAddFeatureOpen}
        onClose={() => setIsAddFeatureOpen(false)}
        onAddFeature={handleAddFeature}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Pipeline Navigation */}
        <Sidebar
          currentStep={currentStep}
          onSelectStep={setCurrentStep}
          completedSteps={completedSteps}
        />

        {/* Main Workspace Viewport */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-neutral-50">
          <div className="max-w-6xl mx-auto">
            {currentStep === 'load' && (
              <LoadStep
                currentDataset={dataset}
                onLoadDataset={handleLoadDataset}
                onNavigate={setCurrentStep}
              />
            )}

            {currentStep === 'overview' && (
              <OverviewStep
                dataset={dataset}
                onUpdateColumnType={handleUpdateColumnType}
                onNavigate={setCurrentStep}
                onOpenAddRow={() => setIsAddRowOpen(true)}
                onOpenAddFeature={() => setIsAddFeatureOpen(true)}
              />
            )}

            {currentStep === 'eda' && (
              <EdaStep
                dataset={dataset}
                onNavigate={setCurrentStep}
              />
            )}

            {currentStep === 'clean' && (
              <CleanStep
                dataset={dataset}
                onUpdateDataset={handleUpdateDataset}
                onNavigate={setCurrentStep}
              />
            )}

            {currentStep === 'missing' && (
              <MissingValuesStep
                dataset={dataset}
                onUpdateDataset={handleUpdateDataset}
                onNavigate={setCurrentStep}
              />
            )}

            {currentStep === 'encode' && (
              <EncodeStep
                dataset={dataset}
                onUpdateDataset={handleUpdateDataset}
                onNavigate={setCurrentStep}
              />
            )}

            {currentStep === 'normalize' && (
              <NormalizeStep
                dataset={dataset}
                onUpdateDataset={handleUpdateDataset}
                onNavigate={setCurrentStep}
              />
            )}

            {currentStep === 'features' && (
              <FeatureSelectionStep
                dataset={dataset}
                onNavigate={setCurrentStep}
                onLogStep={(log) => handleUpdateDataset(dataset, log)}
              />
            )}

            {currentStep === 'export' && (
              <ExportStep
                dataset={dataset}
                logs={logs}
                initialRowCount={initialSnapshot.rows.length}
                initialColCount={initialSnapshot.columns.length}
                onDownloadCSV={handleDownloadCSV}
                onDownloadMarkdown={handleDownloadMarkdown}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
