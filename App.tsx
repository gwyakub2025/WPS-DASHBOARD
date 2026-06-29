import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { KPIGrid } from './components/KPIGrid';
import { ChartsSection } from './components/ChartsSection';
import { RemarksGrid } from './components/RemarksGrid';
import { PreviewTable } from './components/PreviewTable';
import { readExcelFile, processSheet, calculateStats, downloadXlsx } from './services/excelService';
import { ProcessedWorkbook, DashboardData, REMARK_MASTER, CleanedRow } from './types';
import { Download, ListChecks, AlertCircle, FileX } from 'lucide-react';

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
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'paid' | 'due' | 'remarks'>('paid');

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

  const classifyRows = useMemo(() => {
    const paid: CleanedRow[] = [];
    const remarks: CleanedRow[] = [];
    const due: CleanedRow[] = [];

    data.rows.forEach(r => {
      if (checkIsPaid(r)) {
        paid.push(r);
      } else if (checkHasRemark(r)) {
        remarks.push(r);
      } else {
        due.push(r);
      }
    });

    return { paid, remarks, due };
  }, [data.rows]);

  const handleDownloadFull = () => {
    if (!data.rows.length) return;
    downloadXlsx(data.rows, `CLEANED_${currentSheet}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleDownloadPaid = () => {
    downloadXlsx(classifyRows.paid, `PAID_LIST_${currentSheet}.xlsx`);
  };

  const handleDownloadDue = () => {
    downloadXlsx(classifyRows.due, `NEED_TO_PAY_${currentSheet}.xlsx`);
  };
  
  const handleDownloadRemarksList = () => {
    downloadXlsx(classifyRows.remarks, `EXCLUDED_REMARKS_${currentSheet}.xlsx`);
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
      />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto h-screen">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-gw-text mb-1">
            {workbookData ? `Dashboard: ${currentSheet}` : 'Welcome to WPS Dashboard'}
          </h1>
          <p className="text-gw-muted text-sm">
            {workbookData 
              ? 'Real-time analysis of payment data and remarks.' 
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

            {/* Row 4: Detailed Lists - Tabbed View */}
            <div className="mt-8">
              <div className="flex items-end gap-1 mb-0 px-2">
                {/* PAID TAB */}
                <button 
                  onClick={() => setActiveTab('paid')}
                  className={`flex items-center gap-3 px-6 py-4 rounded-t-lg text-sm font-black border-t-4 transition-all relative top-[2px] z-10 ${
                    activeTab === 'paid' 
                      ? 'bg-white border-t-gw-teal border-x-2 border-gw-line text-gw-teal2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]' 
                      : 'bg-gw-line/50 border-t-transparent border-transparent text-gw-muted hover:text-gw-text hover:bg-white/60 mb-0.5'
                  }`}
                >
                  <ListChecks size={18} className={activeTab === 'paid' ? 'text-gw-teal' : 'text-gw-muted'} />
                  <span className="uppercase tracking-tight">Paid List</span>
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-black leading-none ${
                    activeTab === 'paid' ? 'bg-gw-teal text-white shadow-sm' : 'bg-gw-line text-gw-text/60'
                  }`}>
                    {classifyRows.paid.length}
                  </span>
                </button>
                
                {/* DUE TAB */}
                <button 
                  onClick={() => setActiveTab('due')}
                  className={`flex items-center gap-3 px-6 py-4 rounded-t-lg text-sm font-black border-t-4 transition-all relative top-[2px] z-10 ${
                    activeTab === 'due' 
                      ? 'bg-white border-t-gw-danger border-x-2 border-gw-line text-red-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]' 
                      : 'bg-gw-line/50 border-t-transparent border-transparent text-gw-muted hover:text-gw-text hover:bg-white/60 mb-0.5'
                  }`}
                >
                  <AlertCircle size={18} className={activeTab === 'due' ? 'text-gw-danger' : 'text-gw-muted'} />
                  <span className="uppercase tracking-tight">Need To Pay</span>
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-black leading-none ${
                    activeTab === 'due' ? 'bg-gw-danger text-white shadow-sm' : 'bg-gw-line text-gw-text/60'
                  }`}>
                    {classifyRows.due.length}
                  </span>
                </button>

                {/* REMARKS TAB */}
                <button 
                  onClick={() => setActiveTab('remarks')}
                  className={`flex items-center gap-3 px-6 py-4 rounded-t-lg text-sm font-black border-t-4 transition-all relative top-[2px] z-10 ${
                    activeTab === 'remarks' 
                      ? 'bg-white border-t-orange-500 border-x-2 border-gw-line text-orange-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]' 
                      : 'bg-gw-line/50 border-t-transparent border-transparent text-gw-muted hover:text-gw-text hover:bg-white/60 mb-0.5'
                  }`}
                >
                  <FileX size={18} className={activeTab === 'remarks' ? 'text-orange-500' : 'text-gw-muted'} />
                  <span className="uppercase tracking-tight">Excluded / Remarks</span>
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-black leading-none ${
                    activeTab === 'remarks' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gw-line text-gw-text/60'
                  }`}>
                    {classifyRows.remarks.length}
                  </span>
                </button>
              </div>

              {/* Main Content Area */}
              <div className="bg-white border-2 border-gw-line rounded-b-2xl rounded-tr-2xl p-1 shadow-sm relative min-h-[450px] z-20">
                <div className="absolute top-4 right-4 z-20">
                    <button 
                      onClick={
                        activeTab === 'paid' ? handleDownloadPaid :
                        activeTab === 'due' ? handleDownloadDue : 
                        handleDownloadRemarksList
                      }
                      className="bg-gw-teal/10 hover:bg-gw-teal hover:text-white border border-gw-teal/50 text-gw-teal text-xs font-black px-4 py-2 rounded-lg transition-colors flex items-center gap-2 uppercase tracking-wide"
                    >
                      <Download size={14} />
                      Download This List
                    </button>
                  </div>
                
                {activeTab === 'paid' && (
                  <PreviewTable title="Paid List (>= 85% Contract)" rows={classifyRows.paid} />
                )}
                {activeTab === 'due' && (
                  <PreviewTable title="Need To Pay List (WPS Eligible)" rows={classifyRows.due} />
                )}
                {activeTab === 'remarks' && (
                  <PreviewTable title="Excluded / Remarks List (Not Paid & Has Remark)" rows={classifyRows.remarks} />
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
             <p className="text-sm font-bold opacity-60">Upload an Excel file to see the magic happen</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
