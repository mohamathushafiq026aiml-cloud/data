import { ColumnType, DataRow, Dataset } from '../types';

/**
 * Parses raw CSV string into structured columns and rows.
 * Follows RFC 4180 rules for commas, newlines, and escaped quotes.
 */
export function parseCSV(csvText: string, fileName = 'dataset.csv'): Dataset {
  const cleanText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!cleanText) {
    throw new Error('CSV file is empty');
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push last field & row if exists
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length === 0) {
    throw new Error('No data found in CSV');
  }

  const rawColumns = rows[0].map(c => c.trim()).filter(c => c.length > 0);
  if (rawColumns.length === 0) {
    throw new Error('No header columns found in CSV');
  }

  // Ensure unique column names
  const columns: string[] = [];
  const colCountMap = new Map<string, number>();
  for (const rawCol of rawColumns) {
    const count = colCountMap.get(rawCol) || 0;
    colCountMap.set(rawCol, count + 1);
    columns.push(count === 0 ? rawCol : `${rawCol}_${count}`);
  }

  const dataRows: DataRow[] = [];
  const dataLines = rows.slice(1);

  for (const line of dataLines) {
    if (line.length === 1 && line[0].trim() === '') continue; // skip blank lines
    const rowObj: DataRow = {};
    for (let c = 0; c < columns.length; c++) {
      const colName = columns[c];
      const val = line[c] !== undefined ? line[c] : '';
      if (val === '' || val === null || val === undefined) {
        rowObj[colName] = null;
      } else {
        // Try parsing numeric
        const trimmed = val.trim();
        // check if trimmed is numeric (ignoring pure empty)
        if (trimmed !== '' && !isNaN(Number(trimmed)) && !trimmed.startsWith('0x')) {
          rowObj[colName] = Number(trimmed);
        } else {
          rowObj[colName] = val; // preserve raw
        }
      }
    }
    dataRows.push(rowObj);
  }

  const columnTypes = detectColumnTypes(columns, dataRows);

  return {
    name: fileName,
    columns,
    rows: dataRows,
    columnTypes
  };
}

/**
 * Detects whether each column should be treated as numeric or categorical.
 */
export function detectColumnTypes(
  columns: string[],
  rows: DataRow[]
): Record<string, ColumnType> {
  const result: Record<string, ColumnType> = {};

  for (const col of columns) {
    let numericCount = 0;
    let totalNonEmpty = 0;

    for (const row of rows) {
      const val = row[col];
      if (val !== null && val !== undefined && val !== '') {
        totalNonEmpty++;
        if (typeof val === 'number' && !isNaN(val)) {
          numericCount++;
        } else if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val.trim()))) {
          numericCount++;
        }
      }
    }

    // If more than 75% of non-empty values are numeric, infer numeric
    if (totalNonEmpty > 0 && (numericCount / totalNonEmpty) >= 0.75) {
      result[col] = 'numeric';
    } else {
      result[col] = 'categorical';
    }
  }

  return result;
}

/**
 * Serializes columns and rows to RFC 4180 CSV text.
 */
export function exportToCSV(columns: string[], rows: DataRow[]): string {
  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map(escapeCell).join(',');
  const rowLines = rows.map(row => {
    return columns.map(col => escapeCell(row[col])).join(',');
  });

  return [header, ...rowLines].join('\n');
}
