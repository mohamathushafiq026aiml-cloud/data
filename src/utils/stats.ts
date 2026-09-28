import { CategoricalStats, ClassBalance, ColumnType, DataRow, FeatureCorrelation, NumericStats } from '../types';

/**
 * Computes descriptive statistics for a numeric column.
 */
export function calculateNumericStats(column: string, rows: DataRow[]): NumericStats {
  const values: number[] = [];
  let missingCount = 0;
  let negativeCount = 0;

  for (const row of rows) {
    const v = row[column];
    if (v === null || v === undefined || v === '') {
      missingCount++;
    } else {
      const num = typeof v === 'number' ? v : Number(v);
      if (isNaN(num)) {
        missingCount++;
      } else {
        values.push(num);
        if (num < 0) {
          negativeCount++;
        }
      }
    }
  }

  const validCount = values.length;
  const totalCount = rows.length;
  const missingPercent = totalCount > 0 ? (missingCount / totalCount) * 100 : 0;

  if (validCount === 0) {
    return {
      column,
      count: totalCount,
      missingCount,
      missingPercent,
      validCount: 0,
      negativeCount: 0,
      mean: 0,
      median: 0,
      std: 0,
      min: 0,
      max: 0
    };
  }

  // Sort for median and percentiles
  values.sort((a, b) => a - b);

  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / validCount;

  let median: number;
  const mid = Math.floor(validCount / 2);
  if (validCount % 2 === 0) {
    median = (values[mid - 1] + values[mid]) / 2;
  } else {
    median = values[mid];
  }

  const variance = validCount > 1
    ? values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (validCount - 1)
    : 0;
  const std = Math.sqrt(variance);

  return {
    column,
    count: totalCount,
    missingCount,
    missingPercent,
    validCount,
    negativeCount,
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    std: Number(std.toFixed(2)),
    min: Number(values[0].toFixed(2)),
    max: Number(values[values.length - 1].toFixed(2))
  };
}

/**
 * Computes descriptive statistics for a categorical column.
 */
export function calculateCategoricalStats(column: string, rows: DataRow[]): CategoricalStats {
  const counts: Record<string, number> = {};
  let missingCount = 0;
  let validCount = 0;

  for (const row of rows) {
    const v = row[column];
    if (v === null || v === undefined || String(v).trim() === '') {
      missingCount++;
    } else {
      const strVal = String(v);
      counts[strVal] = (counts[strVal] || 0) + 1;
      validCount++;
    }
  }

  const totalCount = rows.length;
  const missingPercent = totalCount > 0 ? (missingCount / totalCount) * 100 : 0;

  const distribution = Object.entries(counts)
    .map(([value, count]) => ({
      value,
      count,
      percentage: validCount > 0 ? Number(((count / validCount) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const mode = distribution.length > 0 ? distribution[0].value : 'N/A';
  const modeCount = distribution.length > 0 ? distribution[0].count : 0;

  return {
    column,
    count: totalCount,
    missingCount,
    missingPercent,
    validCount,
    uniqueCount: Object.keys(counts).length,
    mode,
    modeCount,
    distribution
  };
}

/**
 * Computes missing value summary across all columns.
 */
export function calculateMissingSummary(
  columns: string[],
  rows: DataRow[],
  columnTypes: Record<string, ColumnType>
) {
  return columns.map(col => {
    let missing = 0;
    for (const r of rows) {
      const v = r[col];
      if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
        missing++;
      }
    }
    return {
      column: col,
      type: columnTypes[col] || 'categorical',
      missingCount: missing,
      missingPercent: rows.length > 0 ? Number(((missing / rows.length) * 100).toFixed(1)) : 0,
      validCount: rows.length - missing
    };
  });
}

/**
 * Computes target column class balance.
 */
export function calculateClassBalance(targetColumn: string, rows: DataRow[]): ClassBalance {
  const counts: Record<string, number> = {};
  let validCount = 0;

  for (const row of rows) {
    const val = row[targetColumn];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      const strVal = String(val).trim();
      counts[strVal] = (counts[strVal] || 0) + 1;
      validCount++;
    }
  }

  const classes = Object.entries(counts)
    .map(([className, count]) => ({
      className,
      count,
      percentage: validCount > 0 ? Number(((count / validCount) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  let imbalanceRatio = 1;
  let isBalanced = true;

  if (classes.length >= 2) {
    const maxCount = classes[0].count;
    const minCount = classes[classes.length - 1].count;
    imbalanceRatio = minCount > 0 ? Number((maxCount / minCount).toFixed(2)) : maxCount;
    // Imbalance considered significant if ratio > 1.5
    isBalanced = imbalanceRatio <= 1.5;
  }

  return {
    targetColumn,
    totalValid: validCount,
    classes,
    isBalanced,
    imbalanceRatio
  };
}

/**
 * Calculates Pearson Correlation coefficient between two numeric series.
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denomX = n * sumX2 - sumX * sumX;
  const denomY = n * sumY2 - sumY * sumY;

  if (denomX <= 0 || denomY <= 0) return 0;

  const r = numerator / (Math.sqrt(denomX) * Math.sqrt(denomY));
  if (isNaN(r) || !isFinite(r)) return 0;
  return Math.max(-1, Math.min(1, r));
}

/**
 * Computes correlation of all numeric and encoded features with the target column.
 */
export function calculateFeatureCorrelations(
  targetColumn: string,
  columns: string[],
  rows: DataRow[],
  columnTypes: Record<string, ColumnType>
): FeatureCorrelation[] {
  // Extract target numeric vector
  const targetIsNumeric = columnTypes[targetColumn] === 'numeric';

  // Map target to numbers (e.g. if categorical binary, map class 0/1)
  let targetMap: Record<string, number> | null = null;
  if (!targetIsNumeric) {
    const uniqueVals = Array.from(new Set(
      rows.map(r => r[targetColumn])
        .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
        .map(v => String(v).trim())
    ));
    // If binary or small set
    targetMap = {};
    uniqueVals.forEach((val, idx) => {
      targetMap![val] = idx;
    });
  }

  const results: FeatureCorrelation[] = [];

  for (const col of columns) {
    if (col === targetColumn) continue;

    // Check if column is numeric
    const isNum = columnTypes[col] === 'numeric';
    if (!isNum) continue; // only correlate numeric/encoded columns

    const pairedX: number[] = [];
    const pairedY: number[] = [];

    for (const row of rows) {
      const featVal = row[col];
      const targVal = row[targetColumn];

      if (featVal === null || featVal === undefined || targVal === null || targVal === undefined) {
        continue;
      }

      const numFeat = typeof featVal === 'number' ? featVal : Number(featVal);
      if (isNaN(numFeat)) continue;

      let numTarget: number | null = null;
      if (targetIsNumeric) {
        const parsed = typeof targVal === 'number' ? targVal : Number(targVal);
        if (!isNaN(parsed)) numTarget = parsed;
      } else if (targetMap) {
        const cleanTarg = String(targVal).trim();
        if (targetMap[cleanTarg] !== undefined) {
          numTarget = targetMap[cleanTarg];
        }
      }

      if (numTarget !== null) {
        pairedX.push(numFeat);
        pairedY.push(numTarget);
      }
    }

    if (pairedX.length >= 3) {
      const r = pearsonCorrelation(pairedX, pairedY);
      const absR = Math.abs(r);
      const roundedR = Number(r.toFixed(3));
      const roundedAbsR = Number(absR.toFixed(3));

      let strength: 'Strong' | 'Moderate' | 'Weak' = 'Weak';
      if (roundedAbsR >= 0.5) strength = 'Strong';
      else if (roundedAbsR >= 0.2) strength = 'Moderate';

      let direction: 'Positive' | 'Negative' | 'Neutral' = 'Neutral';
      if (roundedR > 0.05) direction = 'Positive';
      else if (roundedR < -0.05) direction = 'Negative';

      results.push({
        feature: col,
        correlation: roundedR,
        absCorrelation: roundedAbsR,
        strength,
        direction,
        sampleSize: pairedX.length
      });
    }
  }

  // Sort by absolute correlation descending
  return results.sort((a, b) => b.absCorrelation - a.absCorrelation);
}
