import { Dataset } from '../types';

export const SAMPLE_ATTRITION_CSV = `EmployeeID,Age,Department,Education,City,YearsAtCompany,MonthlyIncome,PerformanceScore,Attrition
EMP-101,41, sales ,Life Sciences,New York,6,5993,4,Yes
EMP-102,49,Research & Development,Medical, Chicago ,10,5130,3,No
EMP-103,37,Sales,Other,New York,7,-3200,3,Yes
EMP-104,33,Research & Development,Life Sciences,Chicago,8,2909,3,No
EMP-105,27,Research & Development,Medical,San Francisco,2,3468,3,No
EMP-106,32, sales ,Life Sciences,San Francisco,7,3068,3,No
EMP-107,59,Research & Development,Medical,Chicago,1,2670,4,No
EMP-108,,Research & Development,Life Sciences,New York,9,9526,4,No
EMP-109,38,Research & Development,Life Sciences,Chicago,10,5237,3,No
EMP-110,36,Research & Development,Medical,San Francisco,7,5725,3,No
EMP-111,35,Research & Development,Medical,New York,5,2426,3,No
EMP-112,29,Research & Development,Life Sciences,San Francisco,9,4193,3,No
EMP-113,31,Research & Development,Life Sciences,Chicago,5,2911,3,No
EMP-114,34,Research & Development,Medical,New York,2,2661,3,No
EMP-115,28,Research & Development,Medical,San Francisco,4,-4150,3,Yes
EMP-116,29,Research & Development,Life Sciences,Chicago,10,9980,3,No
EMP-117,32,Research & Development,Medical,San Francisco,15,3298,4,No
EMP-118,,Research & Development,Medical,Chicago,1,2935,3,Yes
EMP-119,53,SALES,Life Sciences,San Francisco,25,15427,4,No
EMP-120,38,Research & Development,Life Sciences,San Francisco,3,3944,3,No
EMP-121,24,Human Resources,Human Resources,Chicago,1,4011,3,No
EMP-122,36,sales,Life Sciences,Chicago,5,-5200,4,Yes
EMP-123,34,Research & Development,Life Sciences,San Francisco,13,11994,3,No
EMP-124,21,Research & Development,Life Sciences,Chicago,0,1232,3,No
EMP-125,34,Research & Development,Medical,San Francisco,4,2960,3,Yes
EMP-126,39,Research & Development,Life Sciences,San Francisco,10,10725,3,No
EMP-127,32,Research & Development,Life Sciences,Chicago,10,3919,4,Yes
EMP-128,42,Sales,Marketing,San Francisco,9,6825,3,No
EMP-129,44,Research & Development,Medical,San Francisco,22,10248,3,No
EMP-130,46,sales,Marketing,Chicago,15,18947,3,No
EMP-131,30,Research & Development,Medical,San Francisco,4,2853,3,No
EMP-132,43,Human Resources,Human Resources,New York,8,5304,3,No
EMP-133,30,Sales,Marketing,San Francisco,8,5204,3,No
EMP-134,26,Research & Development,Medical,Chicago,5,3110,3,Yes
EMP-135,28,Research & Development,Medical,San Francisco,1,4378,3,Yes
EMP-136,36,Research & Development,Medical,Chicago,6,7000,4,No
EMP-137,45,Sales,Marketing,San Francisco,20,16595,3,No
EMP-138,35,Research & Development,Life Sciences,San Francisco,2,2693,3,No
EMP-139,36,sales,Life Sciences,Chicago,7,5410,4,No
EMP-140,29,Research & Development,Medical,San Francisco,6,3140,3,No
EMP-141,31,Sales,Marketing,New York,7,,3,No
EMP-142,41,sales,Life Sciences,San Francisco,18,19586,3,No
EMP-143,26,Human Resources,Human Resources,San Francisco,4,2850,3,Yes
EMP-144,32,Research & Development,Life Sciences,Chicago,10,6162,3,No
EMP-145,51,Sales,Marketing,San Francisco,4,5441,3,Yes`;

export function getSampleDataset(): Dataset {
  const lines = SAMPLE_ATTRITION_CSV.trim().split('\n');
  const headerLine = lines[0];
  const columns = headerLine.split(',').map(c => c.trim());

  const rows = lines.slice(1).map(line => {
    // split with comma
    const values = line.split(',');
    const rowObj: Record<string, string | number | null> = {};

    columns.forEach((col, idx) => {
      const rawVal = values[idx] !== undefined ? values[idx] : '';
      if (rawVal === '') {
        rowObj[col] = null;
      } else {
        // check if numeric for specific numeric columns
        if (['Age', 'YearsAtCompany', 'MonthlyIncome', 'PerformanceScore'].includes(col)) {
          const num = Number(rawVal.trim());
          rowObj[col] = isNaN(num) ? null : num;
        } else {
          rowObj[col] = rawVal; // preserve raw spacing and casing as requested!
        }
      }
    });

    return rowObj;
  });

  return {
    name: 'employee_attrition_sample.csv',
    columns,
    rows,
    columnTypes: {
      EmployeeID: 'categorical',
      Age: 'numeric',
      Department: 'categorical',
      Education: 'categorical',
      City: 'categorical',
      YearsAtCompany: 'numeric',
      MonthlyIncome: 'numeric',
      PerformanceScore: 'numeric',
      Attrition: 'categorical'
    }
  };
}
