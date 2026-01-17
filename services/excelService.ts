import * as XLSX from 'xlsx';
import { CleanedRow, DashboardData, REMARK_MAP, REMARK_MASTER, OTHER_REMARK_KEY } from '../types';

/**
 * Normalizes a cell value to a string or returns empty string.
 */
const normalizeCell = (v: any): string => {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s;
};

/**
 * Cleans name to English characters only.
 */
const cleanEnglishName = (v: any): string => {
  if (v === null || v === undefined) return "";
  // Allow letters, spaces, and dots (for initials)
  return String(v).replace(/[^A-Za-z \.]+/g, " ").replace(/\s+/g, " ").trim();
};

/**
 * Extracts digits from a value.
 */
const extractDigits = (v: any): string => {
  if (v === null || v === undefined) return "";
  const m = String(v).match(/(\d+)/);
  return m ? m[1] : "";
};

/**
 * Parses a numeric value safely.
 */
const parseNum = (v: any): number => {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  // Remove commas, currency symbols, and 'AED'
  const n = parseFloat(String(v).replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

/**
 * Extracts numeric amounts for Paid/Contract using Regex from a text string.
 */
const extractLabeledAmount = (text: any, labelRegex: RegExp): number | null => {
  if (text === null || text === undefined) return null;
  const s = String(text);
  if (labelRegex.test(s)) {
    // Attempt to find the number after the label
    // Matches: "Label: 1,000" or "Label 1000" or "Label - AED 1000"
    const match = s.match(/[:\-\s]+(?:AED\s*)?([0-9,]+(?:\.[0-9]+)?)/i);
    if (match) {
      return parseNum(match[1]);
    }
  }
  return null;
};

/**
 * Normalizes remark text using the Code Map.
 */
const normalizeRemark = (v: any): string => {
  if (v === null || v === undefined) return "";
  let s = String(v).trim();
  if (!s) return "";

  // 1. Try to extract a leading numeric code (e.g., "1", "12", "1. Outside")
  const codeMatch = s.match(/^(\d+)/);
  if (codeMatch) {
    const code = String(parseInt(codeMatch[1], 10)); // Handle "01" -> "1"
    if (REMARK_MAP[code]) {
      return REMARK_MAP[code];
    }
  }

  // 2. Fallback: Clean up leading numbers/punctuation if no map hit
  s = s.replace(/^\s*\d+\s*[\.\)\:\-]\s*/g, "").trim();
  return s;
};

const matchRemarkToMaster = (remarkText: string): string => {
  if (!remarkText) return "";
  const norm = remarkText.toLowerCase().trim();
  for (const master of REMARK_MASTER) {
    if (norm === master.toLowerCase().trim()) return master;
  }
  return "";
};

export const readExcelFile = async (file: File): Promise<{ sheetNames: string[], workbook: XLSX.WorkBook }> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  return {
    sheetNames: workbook.SheetNames,
    workbook
  };
};

/**
 * Processes a single sheet using a row-merging strategy.
 * Groups rows by SNO to handle records that span 2 lines.
 */
export const processSheet = (workbook: XLSX.WorkBook, sheetName: string): CleanedRow[] => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  // Convert to array of arrays
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: null });

  const map: Record<string, Partial<CleanedRow>> = {};
  let currentSno = "";

  // Iterate all rows (skip header index 0)
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    
    // Column Mapping based on description:
    // Col A (0): SNO
    // Col B (1): Name OR Code
    // Col C (2): Paid OR Contract
    // Col D (3): Remark (sometimes)
    
    const colA = normalizeCell(r[0]);
    const colB = normalizeCell(r[1]);
    const colC = normalizeCell(r[2]);
    const colD = normalizeCell(r[3]);
    const colE = normalizeCell(r[4]); // Fallback check
    const colF = normalizeCell(r[5]); // Fallback check

    // 1. Detect SNO to group records
    // If Col A has a number, it's likely a new record.
    // If Col A is empty, it's a continuation of the previous SNO.
    if (colA && /^\d+$/.test(colA)) {
      currentSno = colA;
    }

    if (!currentSno) continue; // Skip until we find the first SNO

    // Initialize Record if not exists
    if (!map[currentSno]) {
      map[currentSno] = {
        sno: currentSno,
        name: "",
        code: "",
        paid: 0,
        contract: 0,
        remark: "",
        outstanding: 0
      };
    }

    const record = map[currentSno];

    // 2. Process Column B: Name vs Person Code
    // Logic: If it contains letters, it's a Name. If it's purely digits (and usually long), it's a Code.
    if (colB) {
      if (/[A-Za-z]/.test(colB)) {
        // It has letters -> Likely Name
        // Only overwrite if we don't have a name, or if this looks like a "better" name (longer)
        const cleanName = cleanEnglishName(colB);
        if (cleanName.length > (record.name?.length || 0)) {
           record.name = cleanName;
        }
      } else if (/^\d+$/.test(colB.replace(/\s/g, ''))) {
        // Digits only -> Person Code
        // Person codes are usually > 4 digits (e.g. 52345). SNOs are usually short (1, 2, 3).
        // Sometimes Code is in Col B.
        const codeVal = extractDigits(colB);
        if (codeVal.length >= 3) {
            record.code = codeVal;
        }
      }
    }

    // 3. Process Column C: Paid vs Contract
    // Look for explicit labels "Paid:" or "Contract:"
    if (colC) {
      const paidVal = extractLabeledAmount(colC, /Paid|Net|Salary/i);
      const contractVal = extractLabeledAmount(colC, /Contract|Basic|Total/i);

      if (paidVal !== null) {
        record.paid = paidVal;
      }
      if (contractVal !== null) {
        record.contract = contractVal;
      }

      // FALLBACK: If no labels are found (e.g. just numbers "5000"), use row position heuristic?
      // Or assume larger number is Contract?
      // Let's rely on detection. If no label, check if it is a pure number.
      if (paidVal === null && contractVal === null) {
        const pureNum = parseNum(colC);
        if (pureNum > 0) {
           // Heuristic: If we already have Paid, this might be Contract.
           // Usually Paid comes first in Row 1, Contract in Row 2.
           // However, let's look at the "Two Rows" pattern.
           // If this row == currentSno row (new record), assume Paid?
           // If this row != currentSno row (continuation), assume Contract?
           // To do this strictly, we'd need to track if it's the 1st or 2nd row of the SNO.
           // For safety, let's check if the map entry was JUST created.
           // Actually, simpler: If Paid is 0, assign to Paid. Else assign to Contract.
           if (!record.paid) {
             record.paid = pureNum;
           } else {
             record.contract = pureNum;
           }
        }
      }
    }

    // 4. Process Remarks (Col D is primary, but check Col C if it looks like a remark code)
    // Priority: Col D -> Col F -> Col C (if specific remark format)
    let candidateRemark = "";

    // Check Col D
    if (colD) candidateRemark = colD;
    
    // Check Col F (sometimes extracted remarks end up here)
    if (!candidateRemark && colF) candidateRemark = colF;

    // Check Col C (Edge case: sometimes remark code '1' is in Col C if row is otherwise empty)
    if (!candidateRemark && colC) {
       // Only if Col C is strictly a Remark Code or English text that isn't "Paid/Contract"
       const cStr = normalizeCell(colC);
       if (REMARK_MAP[cStr] || (/[A-Za-z]/.test(cStr) && !/Paid|Contract|AED/i.test(cStr))) {
          candidateRemark = cStr;
       }
    }

    if (candidateRemark) {
      const normalized = normalizeRemark(candidateRemark);
      // Only set if we found a valid remark or the cell had substantial text
      if (normalized || candidateRemark.length > 2) {
        record.remark = normalized || candidateRemark; // Use normalized if mapped, else raw text
      }
    }
  }

  // Convert Map to Array
  const result: CleanedRow[] = Object.values(map).map(o => {
    const paid = o.paid || 0;
    const contract = o.contract || 0;
    const outstanding = Math.max(contract - paid, 0);
    return {
      sno: o.sno || "",
      name: o.name || "",
      code: o.code || "",
      paid,
      contract,
      remark: o.remark || "",
      outstanding
    };
  });

  // Sort numerically by SNO
  result.sort((a, b) => {
    const na = parseFloat(a.sno.replace(/,/g, ''));
    const nb = parseFloat(b.sno.replace(/,/g, ''));
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.sno.localeCompare(b.sno);
  });

  return result;
};

export const calculateStats = (rows: CleanedRow[]): DashboardData => {
  let paidCount = 0;
  let paidNoRemarkCount = 0; // Numerator: Paid > 80% AND No Remark
  let dueCount = 0;
  let paidTotal = 0;
  let contractTotal = 0;
  let outstandingTotal = 0;
  
  const remarkCounts: Record<string, number> = {};
  REMARK_MASTER.forEach(r => remarkCounts[r] = 0);
  remarkCounts[OTHER_REMARK_KEY] = 0;

  rows.forEach(r => {
    paidTotal += r.paid;
    contractTotal += r.contract; 

    // Logic: Paid >= 80% of Contract
    const threshold = r.contract * 0.8;
    const isPaid = r.contract === 0 ? true : r.paid >= threshold;
    const hasRemark = !!r.remark && r.remark.trim().length > 0;

    if (isPaid) {
      paidCount++;
      if (!hasRemark) {
        paidNoRemarkCount++;
      }
    } else {
      if (hasRemark) {
        const matched = matchRemarkToMaster(r.remark);
        const key = matched || OTHER_REMARK_KEY;
        remarkCounts[key] = (remarkCounts[key] || 0) + 1;
      } else {
        // No remark, so it is "Need To Pay" (Due)
        dueCount++;
        outstandingTotal += r.outstanding;
      }
    }
  });

  // Numerator: Paid > 80% & Without Remarks
  // Denominator: Total Employees - All Employees With Remarks
  // Note: (Total - All Remarks) is mathematically equal to (PaidNoRemark + DueCount)
  const denominator = paidNoRemarkCount + dueCount;

  // Calculate Shortfall to 80%
  // We need (Paid / Denom) >= 0.8
  // So Paid >= 0.8 * Denom
  const target80 = Math.ceil(denominator * 0.8);
  const shortfall = Math.max(0, target80 - paidNoRemarkCount);

  // New Summary Fields
  // Uncovered = Total Employees - Covered (Denominator)
  // Covered = Denominator
  // Meeting WPS = PaidNoRemarkCount
  const uncoveredCount = rows.length - denominator;

  return {
    rows,
    kpis: {
      total: rows.length,
      paidCount,
      dueCount,
      paidTotal,
      contractTotal,
      outstandingTotal,
      paidRatioCount: denominator ? (paidNoRemarkCount / denominator) : 0,
      complianceShortfall: shortfall,
      uncoveredCount,
      eligibleCount: denominator,
      paidComplianceCount: paidNoRemarkCount
    },
    remarkCounts
  };
};

export const downloadXlsx = (data: CleanedRow[], fileName: string) => {
  const headers = ["SNO", "Person Name", "Person Code", "Paid", "Contract", "Remark", "Outstanding"];
  const wsData = [
    headers,
    ...data.map(r => [r.sno, r.name, r.code, r.paid, r.contract, r.remark, r.outstanding])
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, fileName);
};
