export type ColumnType = 'numeric' | 'categorical';

export interface DataRow {
  [key: string]: string | number | null;
}

export interface Dataset {
  name: string;
  columns: string[];
  rows: DataRow[];
  columnTypes: Record<string, ColumnType>;
}

export type PipelineStepId = 
  | 'load'
  | 'overview'
  | 'eda'
  | 'clean'
  | 'missing'
  | 'encode'
  | 'normalize'
  | 'features'
  | 'export';

export interface PipelineLogEntry {
  id: string;
  step: PipelineStepId;
  stepTitle: string;
  timestamp: string;
  actionSummary: string;
  details: string[];
  mlRationale: string;
  changesCount?: number;
}

export interface NumericStats {
  column: string;
  count: number;
  missingCount: number;
  missingPercent: number;
  validCount: number;
  negativeCount: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
}

export interface CategoricalStats {
  column: string;
  count: number;
  missingCount: number;
  missingPercent: number;
  validCount: number;
  uniqueCount: number;
  mode: string;
  modeCount: number;
  distribution: { value: string; count: number; percentage: number }[];
}

export interface ClassBalance {
  targetColumn: string;
  totalValid: number;
  classes: {
    className: string;
    count: number;
    percentage: number;
  }[];
  isBalanced: boolean;
  imbalanceRatio: number;
}

export interface FeatureCorrelation {
  feature: string;
  correlation: number;
  absCorrelation: number;
  strength: 'Strong' | 'Moderate' | 'Weak';
  direction: 'Positive' | 'Negative' | 'Neutral';
  sampleSize: number;
}

export interface ScalingSummary {
  column: string;
  beforeMin: number;
  beforeMax: number;
  beforeMean: number;
  beforeStd: number;
  afterMin: number;
  afterMax: number;
  afterMean: number;
  afterStd: number;
}

export interface MissingComparison {
  column: string;
  type: ColumnType;
  beforeCount: number;
  afterCount: number;
  imputedMethod: 'median' | 'mode' | 'none';
  imputedValue: string | number | null;
}

export type FeatureEngOperation = 'interaction' | 'ratio' | 'polynomial' | 'binning';

export interface FeatureEngineeringConfig {
  newColumnName: string;
  operation: FeatureEngOperation;
  colA: string;
  colB?: string;
  mathOp?: 'multiply' | 'divide' | 'add' | 'subtract';
  degree?: number;
  binThresholds?: number[];
  binLabels?: string[];
}

