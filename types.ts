export type WPSStatus = 'Paid List' | 'Need to Pay' | 'Excluded';

export interface CleanedRow {
  sno: string;
  name: string;
  code: string;
  paid: number;
  contract: number;
  remark: string;
  outstanding: number;
  status?: WPSStatus;
  rmsId?: string;
  isRmsMatched?: boolean;
}

export interface MasterRecord {
  rmsId: string;
  personCode: string;
  riderName: string;
  nationality?: string;
  mobile?: string;
  email?: string;
  passportNo?: string;
  labourCardNum?: string;
  eidNumber?: string;
  riderStatus?: string;
  project?: string;
  company?: string;
}

export interface MasterDataset {
  fileName: string;
  totalRecords: number;
  byPersonCode: Record<string, MasterRecord>;
  byName: Record<string, MasterRecord>;
  records: MasterRecord[];
}

export interface CleanedRowWithRMS extends CleanedRow {
  rmsId?: string;
  isRmsMatched?: boolean;
  masterRecord?: MasterRecord;
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
    complianceShortfall: number;
    // New fields for sidebar summary
    uncoveredCount: number;    // Employees with remarks (Not Covered)
    eligibleCount: number;     // Total - Remarks (Covered)
    paidComplianceCount: number; // Paid & No Remarks (Meeting WPS)
  };
  remarkCounts: Record<string, number>;
}

export interface ProcessedWorkbook {
  fileName: string;
  sheetNames: string[];
  sheets: Record<string, CleanedRow[]>; // Cache processed data per sheet
}

export const REMARK_MAP: Record<string, string> = {
  "1": "Outside the Country as per salary date",
  "2": "Employees on Probation",
  "3": "PreApproval WorkPermit",
  "4": "Temporary WorkPermit",
  "9": "Cancelled Employees / Under Cancellation Employees",
  "10": "Employees exempted from Exemption Service",
  "11": "Absconding Employees",
  "12": "Employees having Complaint move to court",
  "13": "Unpaid Leave",
  "14": "NEW GT ELECTRONIC WORK PERMIT"
};

export const REMARK_MASTER = Object.values(REMARK_MAP);

export const OTHER_REMARK_KEY = "Other / Unmatched";
