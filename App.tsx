import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { KPIGrid } from './components/KPIGrid';
import { ChartsSection } from './components/ChartsSection';
import { RemarksGrid } from './components/RemarksGrid';
import { PreviewTable } from './components/PreviewTable';
import { readExcelFile, processSheet, calculateStats, downloadXlsx } from './services/excelService';
import { ProcessedWorkbook, DashboardData } from './types';

const INITIAL_DATA: DashboardData = {
  rows: [],
  kpis: {
    total: 0, paidCount: 0, dueCount: 0, paidTotal: 0, contractTotal: 0, outstandingTotal: 0, paidRatioCount: 0, paidRatioAmount: 0
  },
  remarkCounts: {}
};

function App() {
  const [workbookData, setWorkbookData] = useState<ProcessedWorkbook | null>(null);
  const [currentSheet, setCurrentSheet] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<DashboardData>(INITIAL_DATA);

  // When sheet changes, re-calculate stats
  useEffect(() => {
    if (!workbookData || !currentSheet) {
      setData(INITIAL_DATA);
      return;
    }

    const rows = processSheet(workbookData.sheets as any, currentSheet); // 'sheets' is actually the raw workbook object in our simplified types, wait.
    // Correction: In `readExcelFile`, we returned `{ sheetNames, workbook }`.
    // We should pass the workbook object to processSheet.
    // Let's adjust the state to hold the raw workbook properly.
    
    // Actually, to optimize, we should probably memoize the workbook.
  }, [currentSheet, workbookData]);


  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      const { sheetNames, workbook } = await readExcelFile(file);
      
      // Store raw workbook in state (it's not serializable for redux but fine for React state usually, or use a ref. State is fine for this size)
      // To strictly follow types, let's just store what we need. 
      // We will store the `XLSX.Workbook` object in a separate ref or state that allows any.
      setWorkbookData({
        fileName: file.name,
        sheetNames,
        sheets: workbook as any // storing the raw workbook object here for simplicity in this demo
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

  // Compute derived data when workbook or sheet changes
  useEffect(() => {
    if (workbookData && currentSheet) {
      const rawWorkbook = workbookData.sheets as any; // Cast back to XLSX.Workbook
      const cleanedRows = processSheet(rawWorkbook, currentSheet);
      const stats = calculateStats(cleanedRows);
      setData(stats);
    }
  }, [workbookData, currentSheet]);


  const handleDownloadFull = () => {
    if (!data.rows.length) return;
    downloadXlsx(data.rows, `CLEANED_${currentSheet}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleDownloadPaid = () => {
    const paid = data.rows.filter(r => r.paid > 0);
    downloadXlsx(paid, `PAID_${currentSheet}.xlsx`);
  };

  const handleDownloadDue = () => {
    const due = data.rows.filter(r => r.outstanding > 0);
    downloadXlsx(due, `DUE_${currentSheet}.xlsx`);
  };

  const paidRows = useMemo(() => data.rows.filter(r => r.paid > 0), [data.rows]);
  const dueRows = useMemo(() => data.rows.filter(r => r.outstanding > 0), [data.rows]);

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
      />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto h-screen">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-white mb-1">
            {workbookData ? `Dashboard: ${currentSheet}` : 'Welcome to WPS Dashboard'}
          </h1>
          <p className="text-gw-muted text-sm">
            {workbookData 
              ? 'Real-time analysis of payment data and remarks.' 
              : 'Please upload an XLSX file from the sidebar to begin processing.'}
          </p>
        </header>

        {workbookData ? (
          <div className="animate-in fade-in duration-500">
            {/* Row 1: KPIs */}
            <KPIGrid kpis={data.kpis} />

            {/* Row 2: Charts */}
            <ChartsSection 
              paidCount={data.kpis.paidCount}
              dueCount={data.kpis.dueCount}
              paidAmount={data.kpis.paidTotal}
              outstandingAmount={data.kpis.outstandingTotal}
            />

            {/* Row 3: Remarks */}
            <RemarksGrid rows={data.rows} counts={data.remarkCounts} sheetName={currentSheet} />

            {/* Row 4: Tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
              <PreviewTable title="Paid List (Preview)" rows={paidRows} />
              <PreviewTable title="Need To Pay List (Preview)" rows={dueRows} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gw-muted border-2 border-dashed border-gw-line rounded-3xl bg-gw-panel/20">
             <div className="w-16 h-16 bg-gw-card rounded-2xl flex items-center justify-center mb-4 text-gw-teal shadow-lg shadow-gw-teal/10">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
             </div>
             <p className="font-bold text-lg">No Data Loaded</p>
             <p className="text-xs opacity-70">Upload an Excel file to see the magic happen</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
