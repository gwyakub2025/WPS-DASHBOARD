export interface CleanedRow {
  sno: string;
  name: string;
  code: string;
  paid: number;
  contract: number;
  remark: string;
  outstanding: number;
}

export interface DashboardData {
  rows: CleanedRow[];
  kpis: {
    total: number;
    paidCount: number;
    dueCount: number;
    paidTotal: number;
    contractTotal: number;
    outstandingTotal: number;
    paidRatioCount: number;
    paidRatioAmount: number;
  };
  remarkCounts: Record<string, number>;
}

export interface ProcessedWorkbook {
  fileName: string;
  sheetNames: string[];
  sheets: Record<string, CleanedRow[]>; // Cache processed data per sheet
}

export const REMARK_MASTER = [
  "Outside the Country as per salary date",
  "Employees on Probation",
  "PreApproval WorkPermit",
  "Temporary WorkPermit",
  "Cancelled Employees / Under Cancellation Employees",
  "Employees exempted from Exemption Service",
  "Absconding Employees",
  "Employees having Complaint move to court",
  "Unpaid Leave",
  "NEW GT ELECTRONIC WORK PERMIT"
];

export const OTHER_REMARK_KEY = "Other / Unmatched";
