import * as XLSX from 'xlsx';
import { CleanedRow, DashboardData, REMARK_MASTER, OTHER_REMARK_KEY } from '../types';

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
  return String(v).replace(/[^A-Za-z ]+/g, " ").replace(/\s+/g, " ").trim();
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
 * Extracts numeric amounts for Paid/Contract using Regex.
 */
const extractAmount = (text: any, key: string): number => {
  if (text === null || text === undefined) return 0;
  const s = String(text);
  // Matches "Key: 1,000.00" or "Key - AED 500"
  const re = new RegExp(key + "\\s*[:\\-]?\\s*(?:AED\\s*)?([0-9][0-9,]*(?:\\.[0-9]+)?)", "i");
  const m = s.match(re);
  if (!m) return 0;
  const numStr = m[1].replace(/,/g, "");
  const val = parseFloat(numStr);
  return isNaN(val) ? 0 : val;
};

/**
 * Normalizes remark text.
 */
const normalizeRemark = (v: any): string => {
  if (v === null || v === undefined) return "";
  let s = String(v).replace(/\s+/g, " ").trim();
  // Remove leading numbering like "11.", "12)", "13 -", "14:"
  s = s.replace(/^\s*\d+\s*[\.\)\:\-]\s*/g, "").trim();
  return s;
};

const matchRemarkToMaster = (remarkText: string): string => {
  if (!remarkText) return "";
  const norm = normalizeRemark(remarkText).toLowerCase();
  for (const master of REMARK_MASTER) {
    const mNorm = master.toLowerCase().trim();
    if (norm === mNorm) return master;
  }
  return "";
};

/**
 * Reads an Excel file and returns sheet names and workbook object.
 */
export const readExcelFile = async (file: File): Promise<{ sheetNames: string[], workbook: XLSX.WorkBook }> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  return {
    sheetNames: workbook.SheetNames,
    workbook
  };
};

/**
 * Processes a single sheet from the workbook using the specific cleaning logic.
 */
export const processSheet = (workbook: XLSX.WorkBook, sheetName: string): CleanedRow[] => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  // Convert to array of arrays
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: null });

  const map: Record<string, Partial<CleanedRow>> = {};
  let currentSno = "";
  let currentName = "";
  let currentCode = "";
  let currentRemark = "";

  // Skip header row (index 0), start at 1
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const snoRaw = r[0]; // Col A
    const colB = r[1];   // Col B
    const colC = r[2];   // Col C
    const colD = r[3];   // Col D

    // 1. Forward-fill SNO
    const snoCandidate = normalizeCell(snoRaw);
    if (snoCandidate) {
      currentSno = snoCandidate;
    }

    // 2. Forward-fill Name/Code
    const name = cleanEnglishName(colB);
    const code = extractDigits(colB);
    if (name) currentName = name;
    if (code) currentCode = code;

    // 3. Forward-fill Remark
    const remark = normalizeRemark(colD);
    if (remark) currentRemark = remark;

    if (!currentSno) continue;

    // Initialize or Update Record
    if (!map[currentSno]) {
      map[currentSno] = {
        sno: currentSno,
        name: currentName,
        code: currentCode,
        remark: currentRemark,
        paid: 0,
        contract: 0,
        outstanding: 0
      };
    } else {
      // Update missing fields if subsequent rows have better data
      if (!map[currentSno].name && currentName) map[currentSno].name = currentName;
      if (!map[currentSno].code && currentCode) map[currentSno].code = currentCode;
      if (!map[currentSno].remark && currentRemark) map[currentSno].remark = currentRemark;
    }

    // Extract Amounts
    const paidVal = extractAmount(colC, "Paid");
    const contractVal = extractAmount(colC, "Contract");

    // Only update if we found a value (assuming multiple rows might contain different parts, 
    // but the original logic implies we prefer the first found or accumulated. 
    // The legacy code used `if (paid && !map[sno].paid)`, so first non-zero wins).
    if (paidVal > 0 && !map[currentSno].paid) map[currentSno].paid = paidVal;
    if (contractVal > 0 && !map[currentSno].contract) map[currentSno].contract = contractVal;
    
    // Also re-check remark in case it appeared late
    if (remark && !map[currentSno].remark) map[currentSno].remark = remark;
  }

  // Convert map to array and calculate outstanding
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

  // Sort by SNO (numeric if possible)
  result.sort((a, b) => {
    const na = parseFloat(a.sno.replace(/,/g, ''));
    const nb = parseFloat(b.sno.replace(/,/g, ''));
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.sno.localeCompare(b.sno);
  });

  return result;
};

/**
 * Aggregates stats from cleaned rows.
 */
export const calculateStats = (rows: CleanedRow[]): DashboardData => {
  let paidCount = 0;
  let dueCount = 0;
  let paidTotal = 0;
  let contractTotal = 0;
  
  const remarkCounts: Record<string, number> = {};
  REMARK_MASTER.forEach(r => remarkCounts[r] = 0);
  remarkCounts[OTHER_REMARK_KEY] = 0;

  rows.forEach(r => {
    paidTotal += r.paid;
    contractTotal += r.contract;

    if (r.paid > 0) paidCount++;
    if (r.outstanding > 0) dueCount++;

    const matched = matchRemarkToMaster(r.remark);
    const key = matched || OTHER_REMARK_KEY;
    remarkCounts[key] = (remarkCounts[key] || 0) + 1;
  });

  const outstandingTotal = Math.max(contractTotal - paidTotal, 0);

  return {
    rows,
    kpis: {
      total: rows.length,
      paidCount,
      dueCount,
      paidTotal,
      contractTotal,
      outstandingTotal,
      paidRatioCount: rows.length ? (paidCount / rows.length) : 0,
      paidRatioAmount: contractTotal ? (paidTotal / contractTotal) : 0
    },
    remarkCounts
  };
};

/**
 * Exports data to XLSX.
 */
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
