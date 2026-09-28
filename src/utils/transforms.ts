import { ColumnType, DataRow, Dataset, FeatureEngineeringConfig, MissingComparison, PipelineLogEntry, ScalingSummary } from '../types';
import { calculateNumericStats } from './stats';

/**
 * Clean text columns: trim whitespace and standardize casing.
 */
export function cleanTextColumns(
  dataset: Dataset,
  casing: 'lowercase' | 'titlecase' | 'uppercase' | 'trim-only',
  targetColumns?: string[]
): {
  updatedDataset: Dataset;
  modifiedCount: number;
  columnsCleaned: string[];
} {
  const colsToClean = targetColumns && targetColumns.length > 0
    ? targetColumns
    : dataset.columns.filter(col => dataset.columnTypes[col] === 'categorical');

  let modifiedCount = 0;

  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  const newRows = dataset.rows.map(row => {
    const newRow = { ...row };
    for (const col of colsToClean) {
      const val = row[col];
      if (val !== null && val !== undefined) {
        const rawStr = String(val);
        const trimmed = rawStr.trim();
        let formatted = trimmed;

        if (casing === 'lowercase') {
          formatted = trimmed.toLowerCase();
        } else if (casing === 'uppercase') {
          formatted = trimmed.toUpperCase();
        } else if (casing === 'titlecase') {
          formatted = toTitleCase(trimmed);
        }

        if (formatted === '') {
          newRow[col] = null;
          if (rawStr !== '') modifiedCount++;
        } else {
          newRow[col] = formatted;
          if (rawStr !== formatted) {
            modifiedCount++;
          }
        }
      }
    }
    return newRow;
  });

  return {
    updatedDataset: {
      ...dataset,
      rows: newRows
    },
    modifiedCount,
    columnsCleaned: colsToClean
  };
}

/**
 * Flags negative values in numeric columns and converts them to missing (null).
 */
export function flagAndNullifyNegatives(
  dataset: Dataset,
  targetColumns?: string[]
): {
  updatedDataset: Dataset;
  flaggedByColumn: Record<string, number>;
  totalFlagged: number;
} {
  const colsToCheck = targetColumns && targetColumns.length > 0
    ? targetColumns
    : dataset.columns.filter(col => dataset.columnTypes[col] === 'numeric');

  const flaggedByColumn: Record<string, number> = {};
  let totalFlagged = 0;

  for (const col of colsToCheck) {
    flaggedByColumn[col] = 0;
  }

  const newRows = dataset.rows.map(row => {
    const newRow = { ...row };
    for (const col of colsToCheck) {
      const val = row[col];
      if (val !== null && val !== undefined) {
        const num = typeof val === 'number' ? val : Number(val);
        if (!isNaN(num) && num < 0) {
          newRow[col] = null;
          flaggedByColumn[col] = (flaggedByColumn[col] || 0) + 1;
          totalFlagged++;
        }
      }
    }
    return newRow;
  });

  return {
    updatedDataset: {
      ...dataset,
      rows: newRows
    },
    flaggedByColumn,
    totalFlagged
  };
}

/**
 * Drop selected columns from the dataset.
 */
export function dropColumns(
  dataset: Dataset,
  columnsToDrop: string[]
): {
  updatedDataset: Dataset;
  dropped: string[];
} {
  const dropSet = new Set(columnsToDrop);
  const remainingColumns = dataset.columns.filter(col => !dropSet.has(col));
  const newColumnTypes = { ...dataset.columnTypes };
  for (const col of columnsToDrop) {
    delete newColumnTypes[col];
  }

  const newRows = dataset.rows.map(row => {
    const newRow: DataRow = {};
    for (const col of remainingColumns) {
      newRow[col] = row[col];
    }
    return newRow;
  });

  return {
    updatedDataset: {
      ...dataset,
      columns: remainingColumns,
      rows: newRows,
      columnTypes: newColumnTypes
    },
    dropped: columnsToDrop
  };
}

/**
 * Impute missing values:
 * - Numeric columns filled with Median
 * - Categorical columns filled with Mode
 */
export function imputeMissingValues(
  dataset: Dataset,
  options?: {
    numericStrategy?: 'median' | 'mean';
  }
): {
  updatedDataset: Dataset;
  comparisons: MissingComparison[];
  totalImputed: number;
} {
  const numericStrategy = options?.numericStrategy || 'median';
  const comparisons: MissingComparison[] = [];
  let totalImputed = 0;

  // 1. Calculate imputation values per column
  const imputationMap: Record<string, {
    method: 'median' | 'mode' | 'none';
    value: string | number | null;
    beforeMissing: number;
  }> = {};

  for (const col of dataset.columns) {
    const colType = dataset.columnTypes[col];
    let beforeMissing = 0;

    for (const row of dataset.rows) {
      const v = row[col];
      if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
        beforeMissing++;
      }
    }

    if (beforeMissing === 0) {
      imputationMap[col] = { method: 'none', value: null, beforeMissing: 0 };
      comparisons.push({
        column: col,
        type: colType,
        beforeCount: 0,
        afterCount: 0,
        imputedMethod: 'none',
        imputedValue: null
      });
      continue;
    }

    if (colType === 'numeric') {
      const validNums: number[] = [];
      for (const row of dataset.rows) {
        const v = row[col];
        if (v !== null && v !== undefined && v !== '') {
          const num = typeof v === 'number' ? v : Number(v);
          if (!isNaN(num)) validNums.push(num);
        }
      }

      if (validNums.length === 0) {
        imputationMap[col] = { method: 'none', value: 0, beforeMissing };
      } else {
        validNums.sort((a, b) => a - b);
        let imputedVal: number;
        if (numericStrategy === 'median') {
          const mid = Math.floor(validNums.length / 2);
          imputedVal = validNums.length % 2 === 0
            ? (validNums[mid - 1] + validNums[mid]) / 2
            : validNums[mid];
        } else {
          const sum = validNums.reduce((acc, n) => acc + n, 0);
          imputedVal = Number((sum / validNums.length).toFixed(2));
        }
        imputedVal = Number(imputedVal.toFixed(2));
        imputationMap[col] = { method: 'median', value: imputedVal, beforeMissing };
      }
    } else {
      // Mode for categorical
      const counts: Record<string, number> = {};
      for (const row of dataset.rows) {
        const v = row[col];
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          const str = String(v).trim();
          counts[str] = (counts[str] || 0) + 1;
        }
      }

      let bestCat = 'Unknown';
      let maxCnt = -1;
      for (const [cat, cnt] of Object.entries(counts)) {
        if (cnt > maxCnt) {
          maxCnt = cnt;
          bestCat = cat;
        }
      }
      imputationMap[col] = { method: 'mode', value: bestCat, beforeMissing };
    }
  }

  // 2. Perform replacement
  const newRows = dataset.rows.map(row => {
    const newRow = { ...row };
    for (const col of dataset.columns) {
      const v = row[col];
      const isMissing = v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
      if (isMissing) {
        const info = imputationMap[col];
        if (info && info.value !== null) {
          newRow[col] = info.value;
          totalImputed++;
        }
      }
    }
    return newRow;
  });

  // 3. Build comparisons
  for (const col of dataset.columns) {
    const info = imputationMap[col];
    if (info && info.beforeMissing > 0) {
      comparisons.push({
        column: col,
        type: dataset.columnTypes[col],
        beforeCount: info.beforeMissing,
        afterCount: 0,
        imputedMethod: info.method,
        imputedValue: info.value
      });
    }
  }

  return {
    updatedDataset: {
      ...dataset,
      rows: newRows
    },
    comparisons,
    totalImputed
  };
}

/**
 * Label-encodes an ordinal column using custom ordering provided by the user.
 */
export function labelEncodeOrdinal(
  dataset: Dataset,
  column: string,
  orderedCategories: string[]
): {
  updatedDataset: Dataset;
  mapping: Record<string, number>;
} {
  const mapping: Record<string, number> = {};
  orderedCategories.forEach((cat, idx) => {
    mapping[cat] = idx;
    mapping[cat.toLowerCase()] = idx; // handle case resilience
  });

  const newRows = dataset.rows.map(row => {
    const newRow = { ...row };
    const val = row[column];
    if (val !== null && val !== undefined) {
      const strVal = String(val).trim();
      if (mapping[strVal] !== undefined) {
        newRow[column] = mapping[strVal];
      } else if (mapping[strVal.toLowerCase()] !== undefined) {
        newRow[column] = mapping[strVal.toLowerCase()];
      }
    }
    return newRow;
  });

  return {
    updatedDataset: {
      ...dataset,
      rows: newRows,
      columnTypes: {
        ...dataset.columnTypes,
        [column]: 'numeric'
      }
    },
    mapping
  };
}

/**
 * One-Hot encodes nominal columns into binary dummy columns.
 */
export function oneHotEncodeNominal(
  dataset: Dataset,
  columnsToEncode: string[],
  dropFirst = false
): {
  updatedDataset: Dataset;
  newColumnsAdded: string[];
} {
  let currentDataset = { ...dataset };
  const allNewColumnsAdded: string[] = [];

  for (const col of columnsToEncode) {
    // Collect unique non-null values
    const uniqueVals = Array.from(new Set(
      currentDataset.rows
        .map(r => r[col])
        .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
        .map(v => String(v).trim())
    )).sort();

    if (uniqueVals.length === 0) continue;

    const categoriesToEncode = dropFirst ? uniqueVals.slice(1) : uniqueVals;
    const dummyNames = categoriesToEncode.map(val => {
      const sanitizedVal = val.replace(/[^a-zA-Z0-9]/g, '_');
      return `${col}_${sanitizedVal}`;
    });

    allNewColumnsAdded.push(...dummyNames);

    // Build new rows
    const newRows = currentDataset.rows.map(row => {
      const newRow = { ...row };
      const currentVal = row[col] !== null && row[col] !== undefined
        ? String(row[col]).trim()
        : '';

      categoriesToEncode.forEach((cat, idx) => {
        const dummyName = dummyNames[idx];
        newRow[dummyName] = currentVal === cat ? 1 : 0;
      });

      delete newRow[col]; // remove original nominal column
      return newRow;
    });

    // Update column order and types
    const colIndex = currentDataset.columns.indexOf(col);
    const updatedColumns = [...currentDataset.columns];
    updatedColumns.splice(colIndex, 1, ...dummyNames);

    const updatedTypes = { ...currentDataset.columnTypes };
    delete updatedTypes[col];
    for (const d of dummyNames) {
      updatedTypes[d] = 'numeric';
    }

    currentDataset = {
      ...currentDataset,
      columns: updatedColumns,
      rows: newRows,
      columnTypes: updatedTypes
    };
  }

  return {
    updatedDataset: currentDataset,
    newColumnsAdded: allNewColumnsAdded
  };
}

/**
 * Min-Max scale numeric columns into [targetMin, targetMax] (default [0, 1]).
 */
export function minMaxScaleNumeric(
  dataset: Dataset,
  targetColumns: string[],
  rangeMin = 0,
  rangeMax = 1
): {
  updatedDataset: Dataset;
  summary: ScalingSummary[];
} {
  const summary: ScalingSummary[] = [];
  const colStatsMap: Record<string, { min: number; max: number }> = {};

  // Compute before stats
  for (const col of targetColumns) {
    const beforeStats = calculateNumericStats(col, dataset.rows);
    colStatsMap[col] = { min: beforeStats.min, max: beforeStats.max };
  }

  const newRows = dataset.rows.map(row => {
    const newRow = { ...row };
    for (const col of targetColumns) {
      const val = row[col];
      if (val !== null && val !== undefined) {
        const num = typeof val === 'number' ? val : Number(val);
        if (!isNaN(num)) {
          const { min, max } = colStatsMap[col];
          if (max === min) {
            newRow[col] = rangeMin;
          } else {
            const scaled = ((num - min) / (max - min)) * (rangeMax - rangeMin) + rangeMin;
            newRow[col] = Number(scaled.toFixed(4));
          }
        }
      }
    }
    return newRow;
  });

  // Compute after stats
  for (const col of targetColumns) {
    const before = calculateNumericStats(col, dataset.rows);
    const after = calculateNumericStats(col, newRows);
    summary.push({
      column: col,
      beforeMin: before.min,
      beforeMax: before.max,
      beforeMean: before.mean,
      beforeStd: before.std,
      afterMin: after.min,
      afterMax: after.max,
      afterMean: after.mean,
      afterStd: after.std
    });
  }

  return {
    updatedDataset: {
      ...dataset,
      rows: newRows
    },
    summary
  };
}

/**
 * Generates an academic and professional Markdown Log of the preprocessing pipeline.
 */
export function generateMarkdownLog(
  dataset: Dataset,
  logs: PipelineLogEntry[],
  initialRowCount: number,
  initialColCount: number
): string {
  const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let md = `# Data Preprocessing & ML Readiness Audit Report
**Dataset:** \`${dataset.name}\`  
**Generated:** ${dateStr}  
**Pipeline Status:** Ready for Machine Learning Model Training  
**Final Dimensions:** ${dataset.rows.length} Rows × ${dataset.columns.length} Features (Initial: ${initialRowCount} × ${initialColCount})

---

## Executive Summary
This preprocessing audit log details all data wrangling, cleaning, statistical imputation, feature encoding, scaling, and correlation analyses applied to prepare the dataset for predictive machine learning algorithms (e.g., Logistic Regression, Support Vector Machines, Tree Ensembles, and Multi-Layer Perceptrons).

---

## Pipeline Execution Chronology

`;

  if (logs.length === 0) {
    md += `*No transformation steps executed yet.*\n\n`;
  } else {
    logs.forEach((log, index) => {
      md += `### ${String(index + 1).padStart(2, '0')}. ${log.stepTitle}\n`;
      md += `- **Timestamp:** \`${log.timestamp}\`\n`;
      md += `- **Action Summary:** ${log.actionSummary}\n`;
      if (log.changesCount !== undefined && log.changesCount > 0) {
        md += `- **Modifications Applied:** ${log.changesCount} record modifications\n`;
      }
      md += `\n**Execution Details:**\n`;
      log.details.forEach(item => {
        md += `- ${item}\n`;
      });
      md += `\n**Machine Learning Rationale:**  \n> *${log.mlRationale}*\n\n---\n\n`;
    });
  }

  md += `## Final Prepared Feature Schema\n\n`;
  md += `| # | Feature Name | Inferred ML Data Type | Sample Non-Null Value |\n`;
  md += `|---|--------------|-----------------------|-----------------------|\n`;

  dataset.columns.forEach((col, idx) => {
    const colType = dataset.columnTypes[col];
    let sampleVal: any = 'null';
    for (const r of dataset.rows) {
      if (r[col] !== null && r[col] !== undefined) {
        sampleVal = r[col];
        break;
      }
    }
    md += `| ${idx + 1} | \`${col}\` | ${colType === 'numeric' ? '**Numeric (Continuous/Discrete)**' : 'Categorical'} | \`${sampleVal}\` |\n`;
  });

  md += `\n\n## Recommendations for Model Training\n`;
  md += `1. **Train/Test Splitting:** Partition into 80/20 or 70/30 stratified splits (to preserve target class balance).\n`;
  md += `2. **Model Suitability:** Linear models, KNN, and neural networks will directly benefit from the Min-Max bounded features.\n`;
  md += `3. **Cross-Validation:** Employ 5-Fold Stratified K-Fold to prevent data leakage and evaluate variance.\n\n`;
  md += `*Report generated via Data Preprocessing Studio.*`;

  return md;
}

/**
 * Appends a new data row to the dataset.
 */
export function addCustomRow(
  dataset: Dataset,
  newRow: DataRow
): Dataset {
  return {
    ...dataset,
    rows: [...dataset.rows, newRow]
  };
}

/**
 * Creates and appends an engineered feature column (interaction, ratio, polynomial, or binning).
 */
export function addEngineeredFeature(
  dataset: Dataset,
  config: FeatureEngineeringConfig
): {
  updatedDataset: Dataset;
  featureName: string;
  inferredType: ColumnType;
  description: string;
} {
  const colA = config.colA;
  const colB = config.colB;
  const op = config.operation;
  const colName = config.newColumnName.trim() || `feat_${Date.now()}`;
  let inferredType: ColumnType = 'numeric';
  let description = '';

  const newRows = dataset.rows.map(row => {
    const valA = row[colA];
    const numA = typeof valA === 'number' ? valA : Number(valA);

    let resultVal: string | number | null = null;

    if (op === 'interaction' && colB) {
      const valB = row[colB];
      const numB = typeof valB === 'number' ? valB : Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        if (config.mathOp === 'add') resultVal = numA + numB;
        else if (config.mathOp === 'subtract') resultVal = numA - numB;
        else if (config.mathOp === 'divide') resultVal = numB !== 0 ? Number((numA / numB).toFixed(4)) : null;
        else resultVal = Number((numA * numB).toFixed(4));
      }
      inferredType = 'numeric';
      description = `Computed ${config.mathOp || 'multiply'} between ${colA} and ${colB}`;
    } else if (op === 'ratio' && colB) {
      const valB = row[colB];
      const numB = typeof valB === 'number' ? valB : Number(valB);
      if (!isNaN(numA) && !isNaN(numB) && numB !== 0) {
        resultVal = Number((numA / numB).toFixed(4));
      }
      inferredType = 'numeric';
      description = `Ratio of ${colA} / ${colB}`;
    } else if (op === 'polynomial') {
      const degree = config.degree || 2;
      if (!isNaN(numA)) {
        resultVal = Number(Math.pow(numA, degree).toFixed(4));
      }
      inferredType = 'numeric';
      description = `Polynomial degree ${degree} of ${colA}`;
    } else if (op === 'binning') {
      inferredType = 'categorical';
      const thresholds = config.binThresholds || [30, 45];
      const labels = config.binLabels || ['Low', 'Medium', 'High'];
      if (!isNaN(numA)) {
        let assigned = labels[labels.length - 1];
        for (let i = 0; i < thresholds.length; i++) {
          if (numA < thresholds[i]) {
            assigned = labels[i] || `Bin_${i}`;
            break;
          }
        }
        resultVal = assigned;
      }
      description = `Binned ${colA} into categories [${labels.join(', ')}]`;
    }

    return {
      ...row,
      [colName]: resultVal
    };
  });

  return {
    updatedDataset: {
      ...dataset,
      columns: [...dataset.columns, colName],
      rows: newRows,
      columnTypes: {
        ...dataset.columnTypes,
        [colName]: inferredType
      }
    },
    featureName: colName,
    inferredType,
    description
  };
}

