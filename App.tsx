import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { KPIGrid } from './components/KPIGrid';
import { ChartsSection } from './components/ChartsSection';
import { RemarksGrid } from './components/RemarksGrid';
import { PreviewTable } from './components/PreviewTable';
import { RMSTable } from './components/RMSTable';
import { 
  readExcelFile, 
  processSheet, 
  calculateStats, 
  downloadXlsx, 
  readMasterExcelFile, 
  downloadRmsXlsx 
} from './services/excelService';
import { ProcessedWorkbook, DashboardData, CleanedRow, MasterDataset, MasterRecord, CleanedRowWithRMS } from './types';
import { Download, ListChecks, AlertCircle, FileX, Layers, KeyRound } from 'lucide-react';

const INITIAL_DATA: DashboardData = {
  rows: [],
  kpis: {
    total: 0, 
    paidCount: 0, 
    dueCount: 0, 
    paidTotal: 0, 
    contractTotal: 0, 
    outstandingTotal: 0, 
    paidRatioCount: 0, 
    complianceShortfall: 0,
    uncoveredCount: 0,
    eligibleCount: 0,
    paidComplianceCount: 0
  },
  remarkCounts: {}
};

function App() {
  const [workbookData, setWorkbookData] = useState<ProcessedWorkbook | null>(null);
  const [currentSheet, setCurrentSheet] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  
  // Master Fleet / RMS Dataset
  const [masterDataset, setMasterDataset] = useState<MasterDataset | null>(null);
  const [isProcessingMaster, setIsProcessingMaster] = useState(false);

  // Tab State: 'all' | 'paid' | 'due' | 'remarks' | 'rms'
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'due' | 'remarks' | 'rms'>('rms');

  // When sheet changes, re-calculate stats
  useEffect(() => {
    if (!workbookData || !currentSheet) {
      setData(INITIAL_DATA);
      return;
    }

    const rows = processSheet(workbookData.sheets as any, currentSheet);
    const stats = calculateStats(rows);
    setData(stats);
  }, [workbookData, currentSheet]);

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      const { sheetNames, workbook } = await readExcelFile(file);
      
      setWorkbookData({
        fileName: file.name,
        sheetNames,
        sheets: workbook as any 
      });

      if (sheetNames.length > 0) {
        setCurrentSheet(sheetNames[0]);
      }
    } catch (error) {
      console.error("Error reading file", error);
      alert("Failed to read file. Please ensure it is a valid XLSX.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMasterFileUpload = async (file: File) => {
    try {
      setIsProcessingMaster(true);
      const dataset = await readMasterExcelFile(file);
      setMasterDataset(dataset);
    } catch (error) {
      console.error("Error reading master file", error);
      alert("Failed to read master file. Please ensure it is a valid XLSX.");
    } finally {
      setIsProcessingMaster(false);
    }
  };

  /**
   * Classification Helpers matching calculateStats logic
   */
  const checkIsPaid = (r: CleanedRow) => {
    // Rule: Paid >= 85% of Contract
    const threshold = r.contract * 0.85;
    return r.contract === 0 ? true : r.paid >= threshold;
  };

  const checkHasRemark = (r: CleanedRow) => {
    return !!r.remark && r.remark.trim().length > 0;
  };

  const normalizeLookupCode = (val: any): string => {
    if (!val && val !== 0) return '';
    const s = String(val).trim();
    const digits = s.replace(/\D/g, '');
    return digits || s;
  };

  const cleanNameForLookup = (val: any): string => {
    if (!val) return '';
    return String(val).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  };

  const classifyRows = useMemo(() => {
    const all: CleanedRowWithRMS[] = [];
    const paid: CleanedRowWithRMS[] = [];
    const remarks: CleanedRowWithRMS[] = [];
    const due: CleanedRowWithRMS[] = [];
    const rmsRows: CleanedRowWithRMS[] = [];

    data.rows.forEach(r => {
      // Lookup RMS ID and Master data based on Person Code as Primary Key
      let matchedMaster: MasterRecord | undefined = undefined;

      if (masterDataset) {
        const normCode = normalizeLookupCode(r.code);
        if (normCode && masterDataset.byPersonCode[normCode]) {
          matchedMaster = masterDataset.byPersonCode[normCode];
        } else if (r.code && masterDataset.byPersonCode[r.code]) {
          matchedMaster = masterDataset.byPersonCode[r.code];
        } else {
          // Secondary fallback match by name
          const normName = cleanNameForLookup(r.name);
          if (normName && masterDataset.byName[normName]) {
            matchedMaster = masterDataset.byName[normName];
          }
        }
      }

      const rmsId = matchedMaster?.rmsId || undefined;
      const isRmsMatched = !!rmsId;

      let status: 'Paid List' | 'Need to Pay' | 'Excluded';
      if (checkIsPaid(r)) {
        status = 'Paid List';
        const rowWithData: CleanedRowWithRMS = { 
          ...r, 
          status, 
          rmsId, 
          isRmsMatched, 
          masterRecord: matchedMaster 
        };
        paid.push(rowWithData);
        all.push(rowWithData);
        rmsRows.push(rowWithData);
      } else if (checkHasRemark(r)) {
        status = 'Excluded';
        const rowWithData: CleanedRowWithRMS = { 
          ...r, 
          status, 
          rmsId, 
          isRmsMatched, 
          masterRecord: matchedMaster 
        };
        remarks.push(rowWithData);
        all.push(rowWithData);
        rmsRows.push(rowWithData);
      } else {
        status = 'Need to Pay';
        const rowWithData: CleanedRowWithRMS = { 
          ...r, 
          status, 
          rmsId, 
          isRmsMatched, 
          masterRecord: matchedMaster 
        };
        due.push(rowWithData);
        all.push(rowWithData);
        rmsRows.push(rowWithData);
      }
    });

    return { all, paid, remarks, due, rmsRows };
  }, [data.rows, masterDataset]);

  const handleDownloadFull = () => {
    if (!classifyRows.all.length) return;
    downloadXlsx(classifyRows.all, `CLEANED_WITH_STATUS_${currentSheet}_${new Date().toISOString().slice(0,10)}.xlsx`, true);
  };

  const handleDownloadAll = () => {
    downloadXlsx(classifyRows.all, `ALL_EMPLOYEES_STATUS_${currentSheet}.xlsx`, true);
  };

  const handleDownloadPaid = () => {
    downloadXlsx(classifyRows.paid, `PAID_LIST_${currentSheet}.xlsx`, true);
  };

  const handleDownloadDue = () => {
    downloadXlsx(classifyRows.due, `NEED_TO_PAY_${currentSheet}.xlsx`, true);
  };
  
  const handleDownloadRemarksList = () => {
    downloadXlsx(classifyRows.remarks, `EXCLUDED_REMARKS_${currentSheet}.xlsx`, true);
  };

  const handleDownloadRMS = () => {
    downloadRmsXlsx(classifyRows.rmsRows, `RMS_MAPPED_${currentSheet}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="app flex min-h-screen bg-gw-bg text-gw-text font-sans">
      <Sidebar 
        onFileUpload={handleFileUpload}
        isProcessing={isProcessing}
        sheetNames={workbookData?.sheetNames || []}
        currentSheet={currentSheet}
        onSheetChange={setCurrentSheet}
        fileName={workbookData?.fileName || null}
        onDownloadFull={handleDownloadFull}
        onDownloadPaid={handleDownloadPaid}
        onDownloadDue={handleDownloadDue}
        kpis={data.kpis}
        masterFileName={masterDataset?.fileName || null}
        masterRecordCount={masterDataset?.totalRecords || 0}
        onMasterFileUpload={handleMasterFileUpload}
        isProcessingMaster={isProcessingMaster}
        onDownloadRMS={handleDownloadRMS}
      />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto h-screen">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-gw-text mb-1">
            {workbookData ? `Dashboard: ${currentSheet}` : 'Welcome to WPS Dashboard'}
          </h1>
          <p className="text-gw-muted text-sm">
            {workbookData 
              ? 'Real-time analysis of payment data, remarks, and RMS IDs.' 
              : 'Please upload an XLSX file from the sidebar to begin processing.'}
          </p>
        </header>

        {workbookData ? (
          <div className="animate-in fade-in duration-500 pb-12">
            {/* Row 1: KPIs */}
            <KPIGrid kpis={data.kpis} />

            {/* Row 2: Charts */}
            <ChartsSection 
              paidCount={classifyRows.paid.length}
              dueCount={classifyRows.due.length}
              paidAmount={data.kpis.paidTotal}
              outstandingAmount={data.kpis.outstandingTotal}
            />

            {/* Row 3: Remarks Counts */}
            <RemarksGrid rows={data.rows} counts={data.remarkCounts} sheetName={currentSheet} />

            {/* Row 4: Detailed Lists - Tabbed View with All Records Consolidated & RMS ID Mapping */}
            <div className="mt-8">
              <div className="flex items-end gap-1 mb-0 px-2 overflow-x-auto">
                {/* 1. ALL TAB */}
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`flex items-center gap-2.5 px-5 py-4 rounded-t-lg text-sm font-black border-t-4 transition-all relative top-[2px] z-10 cursor-pointer ${
                    activeTab === 'all' 
                      ? 'bg-white border-t-indigo-600 border-x-2 border-gw-line text-indigo-900 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]' 
                      : 'bg-gw-line/50 border-t-transparent border-transparent text-gw-muted hover:text-gw-text hover:bg-white/60 mb-0.5'
                  }`}
                >
                  <Layers size={17} className={activeTab === 'all' ? 'text-indigo-600' : 'text-gw-muted'} />
                  <span className="uppercase tracking-tight whitespace-nowrap">All List</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black leading-none ${
                    activeTab === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gw-line text-gw-text/60'
                  }`}>
                    {classifyRows.all.length}
                  </span>
                </button>

                {/* 2. PAID TAB */}
                <button 
                  onClick={() => setActiveTab('paid')}
                  className={`flex items-center gap-2.5 px-5 py-4 rounded-t-lg text-sm font-black border-t-4 transition-all relative top-[2px] z-10 cursor-pointer ${
                    activeTab === 'paid' 
                      ? 'bg-white border-t-gw-teal border-x-2 border-gw-line text-gw-teal2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]' 
                      : 'bg-gw-line/50 border-t-transparent border-transparent text-gw-muted hover:text-gw-text hover:bg-white/60 mb-0.5'
                  }`}
                >
                  <ListChecks size={17} className={activeTab === 'paid' ? 'text-gw-teal' : 'text-gw-muted'} />
                  <span className="uppercase tracking-tight whitespace-nowrap">Paid List</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black leading-none ${
                    activeTab === 'paid' ? 'bg-gw-teal text-white shadow-sm' : 'bg-gw-line text-gw-text/60'
                  }`}>
                    {classifyRows.paid.length}
                  </span>
                </button>
                
                {/* 3. DUE TAB */}
                <button 
                  onClick={() => setActiveTab('due')}
                  className={`flex items-center gap-2.5 px-5 py-4 rounded-t-lg text-sm font-black border-t-4 transition-all relative top-[2px] z-10 cursor-pointer ${
                    activeTab === 'due' 
                      ? 'bg-white border-t-gw-danger border-x-2 border-gw-line text-red-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]' 
                      : 'bg-gw-line/50 border-t-transparent border-transparent text-gw-muted hover:text-gw-text hover:bg-white/60 mb-0.5'
                  }`}
                >
                  <AlertCircle size={17} className={activeTab === 'due' ? 'text-gw-danger' : 'text-gw-muted'} />
                  <span className="uppercase tracking-tight whitespace-nowrap">Need To Pay</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black leading-none ${
                    activeTab === 'due' ? 'bg-gw-danger text-white shadow-sm' : 'bg-gw-line text-gw-text/60'
                  }`}>
                    {classifyRows.due.length}
                  </span>
                </button>

                {/* 4. REMARKS TAB */}
                <button 
                  onClick={() => setActiveTab('remarks')}
                  className={`flex items-center gap-2.5 px-5 py-4 rounded-t-lg text-sm font-black border-t-4 transition-all relative top-[2px] z-10 cursor-pointer ${
                    activeTab === 'remarks' 
                      ? 'bg-white border-t-orange-500 border-x-2 border-gw-line text-orange-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]' 
                      : 'bg-gw-line/50 border-t-transparent border-transparent text-gw-muted hover:text-gw-text hover:bg-white/60 mb-0.5'
                  }`}
                >
                  <FileX size={17} className={activeTab === 'remarks' ? 'text-orange-500' : 'text-gw-muted'} />
                  <span className="uppercase tracking-tight whitespace-nowrap">Excluded / Remarks</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black leading-none ${
                    activeTab === 'remarks' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gw-line text-gw-text/60'
                  }`}>
                    {classifyRows.remarks.length}
                  </span>
                </button>

                {/* 5. RMS ID TAB (Next to Excluded / Remarks) */}
                <button 
                  onClick={() => setActiveTab('rms')}
                  className={`flex items-center gap-2.5 px-5 py-4 rounded-t-lg text-sm font-black border-t-4 transition-all relative top-[2px] z-10 cursor-pointer ${
                    activeTab === 'rms' 
                      ? 'bg-white border-t-purple-600 border-x-2 border-gw-line text-purple-900 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]' 
                      : 'bg-gw-line/50 border-t-transparent border-transparent text-gw-muted hover:text-gw-text hover:bg-white/60 mb-0.5'
                  }`}
                >
                  <KeyRound size={17} className={activeTab === 'rms' ? 'text-purple-600' : 'text-gw-muted'} />
                  <span className="uppercase tracking-tight whitespace-nowrap">RMS ID Mapping</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black leading-none ${
                    activeTab === 'rms' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {masterDataset 
                      ? `${classifyRows.rmsRows.filter(r => r.isRmsMatched).length} / ${classifyRows.all.length}`
                      : classifyRows.all.length
                    }
                  </span>
                </button>
              </div>

              {/* Main Content Area */}
              <div className="bg-white border-2 border-gw-line rounded-b-2xl rounded-tr-2xl p-1 shadow-sm relative min-h-[480px] z-20">
                {activeTab !== 'rms' && (
                  <div className="absolute top-4 right-4 z-20">
                    <button 
                      onClick={
                        activeTab === 'all' ? handleDownloadAll :
                        activeTab === 'paid' ? handleDownloadPaid :
                        activeTab === 'due' ? handleDownloadDue : 
                        handleDownloadRemarksList
                      }
                      className="bg-gw-teal/10 hover:bg-gw-teal hover:text-white border border-gw-teal/50 text-gw-teal text-xs font-black px-4 py-2 rounded-lg transition-colors flex items-center gap-2 uppercase tracking-wide cursor-pointer shadow-xs"
                    >
                      <Download size={14} />
                      Download This List
                    </button>
                  </div>
                )}
                
                {activeTab === 'all' && (
                  <PreviewTable 
                    title="All Records Consolidated (with Status)" 
                    rows={classifyRows.all} 
                    showStatus={true} 
                  />
                )}
                {activeTab === 'paid' && (
                  <PreviewTable 
                    title="Paid List (>= 85% Contract)" 
                    rows={classifyRows.paid} 
                    showStatus={false} 
                  />
                )}
                {activeTab === 'due' && (
                  <PreviewTable 
                    title="Need To Pay List (WPS Eligible)" 
                    rows={classifyRows.due} 
                    showStatus={false} 
                  />
                )}
                {activeTab === 'remarks' && (
                  <PreviewTable 
                    title="Excluded / Remarks List (Not Paid & Has Remark)" 
                    rows={classifyRows.remarks} 
                    showStatus={false} 
                  />
                )}
                {activeTab === 'rms' && (
                  <RMSTable 
                    rows={classifyRows.rmsRows}
                    masterDataset={masterDataset}
                    onMasterFileUpload={handleMasterFileUpload}
                    isProcessingMaster={isProcessingMaster}
                    onDownloadRMS={handleDownloadRMS}
                  />
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gw-muted border-4 border-dashed border-gw-line rounded-3xl bg-gw-panel/50">
             <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 text-gw-teal shadow-xl border border-gw-line">
               <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
             </div>
             <p className="font-black text-2xl text-gw-text mb-2">No Data Loaded</p>
             <p className="text-sm font-bold opacity-60">Upload a WPS Excel file from the sidebar to begin processing</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
