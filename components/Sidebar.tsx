import React from 'react';
import { UploadCloud, FileSpreadsheet, Download, RefreshCw, Settings, Info, KeyRound, CheckCircle2 } from 'lucide-react';
import { DashboardData } from '../types';

interface SidebarProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  sheetNames: string[];
  currentSheet: string;
  onSheetChange: (sheet: string) => void;
  onDownloadFull: () => void;
  onDownloadPaid: () => void;
  onDownloadDue: () => void;
  fileName: string | null;
  kpis?: DashboardData['kpis'];
  // Master File Props
  masterFileName?: string | null;
  masterRecordCount?: number;
  onMasterFileUpload?: (file: File) => void;
  isProcessingMaster?: boolean;
  onDownloadRMS?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onFileUpload,
  isProcessing,
  sheetNames,
  currentSheet,
  onSheetChange,
  onDownloadFull,
  onDownloadPaid,
  onDownloadDue,
  fileName,
  kpis,
  masterFileName,
  masterRecordCount = 0,
  onMasterFileUpload,
  isProcessingMaster = false,
  onDownloadRMS
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const masterFileInputRef = React.useRef<HTMLInputElement>(null);
  const [showControls, setShowControls] = React.useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleMasterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onMasterFileUpload) {
      onMasterFileUpload(e.target.files[0]);
    }
  };

  // Enhanced Summary Item as a distinct card
  const SummaryCard = ({ label, val, colorClass = "text-gw-text", borderColor = "border-gw-line" }: { label: string, val: string | number, colorClass?: string, borderColor?: string }) => (
    <div className={`flex justify-between items-center p-3 mb-2 bg-white border-l-4 ${borderColor} border-y border-r border-gw-line rounded-r-lg shadow-sm hover:shadow-md transition-all group`}>
      <span className="text-xs font-black text-gw-muted uppercase tracking-tight group-hover:text-gw-text transition-colors">{label}</span>
      <span className={`text-sm font-black ${colorClass}`}>{val}</span>
    </div>
  );

  const hasData = kpis && kpis.total > 0;
  const ratio = hasData ? Math.round(kpis.paidRatioCount * 100) : 0;
  const isBlocked = ratio < 85;

  return (
    <aside className="w-[380px] flex-shrink-0 bg-white border-r border-gw-line flex flex-col h-screen sticky top-0 shadow-2xl z-20 overflow-y-auto">
      
      {/* 1. Header Section: Active Sheet */}
      <div className="p-6 pb-5 border-b-2 border-gw-line bg-gw-bg/30">
        <div className="flex items-center gap-2 mb-2">
           <div className="h-2 w-2 bg-gw-teal rounded-full animate-pulse"></div>
           <div className="text-[10px] uppercase font-black text-gw-muted tracking-widest">
             Active Sheet
           </div>
        </div>
        
        <div className="text-xl font-black text-gw-text truncate leading-tight drop-shadow-sm" title={currentSheet}>
           {currentSheet || "No Sheet Selected"}
        </div>
        
        {fileName && (
           <div className="flex items-center gap-2 mt-3 p-2 bg-white rounded border border-gw-line text-[10px] text-gw-teal2 font-bold uppercase tracking-wider shadow-sm">
             <FileSpreadsheet size={14} className="text-gw-teal" />
             <span className="truncate max-w-[260px]">{fileName}</span>
           </div>
        )}

        {masterFileName && (
           <div className="flex items-center gap-2 mt-2 p-2 bg-purple-50 rounded border border-purple-200 text-[10px] text-purple-900 font-bold uppercase tracking-wider shadow-2xs">
             <KeyRound size={13} className="text-purple-600 shrink-0" />
             <span className="truncate max-w-[200px]" title={masterFileName}>{masterFileName}</span>
             <span className="ml-auto bg-purple-200/80 px-1.5 py-0.5 rounded text-[9px] font-mono shrink-0">
               {masterRecordCount} riders
             </span>
           </div>
        )}
      </div>

      {/* 2. WPS Summary Section */}
      {hasData && (
        <div className="px-5 mt-6 animate-in slide-in-from-left-4 duration-500">
          <div className="mb-3 flex items-center gap-2">
             <div className="p-1 bg-gw-text rounded text-white">
               <Settings size={12} />
             </div>
             <span className="text-xs font-black text-gw-text uppercase tracking-wide">WPS Summary</span>
          </div>
            
          <SummaryCard 
            label="Total Employees" 
            val={kpis.total}
            borderColor="border-gw-text"
          />
          <SummaryCard 
            label="Not Covered" 
            val={kpis.uncoveredCount}
            colorClass="text-orange-600"
            borderColor="border-orange-400"
          />
          <SummaryCard 
            label="Covered (Eligible)" 
            val={kpis.eligibleCount} 
            colorClass="text-blue-600"
            borderColor="border-blue-400"
          />
          <SummaryCard 
            label="Meeting WPS" 
            val={kpis.paidComplianceCount} 
            colorClass="text-gw-ok"
            borderColor="border-gw-ok"
          />
        </div>
      )}

      {/* 3. Status & Ratio Section */}
      {hasData && (
        <div className="px-5 mt-4 animate-in slide-in-from-left-4 duration-500 delay-100">
           <div className="bg-white border border-gw-line rounded-xl p-4 shadow-sm grid grid-cols-2 gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-gw-danger"></div>

              {/* Ratio */}
              <div className="flex flex-col gap-2">
                 <div className="text-[10px] font-black text-gw-text uppercase tracking-wide">
                   Count Ratio
                 </div>
                 <div className="relative h-12 w-full rounded-lg overflow-hidden bg-gw-line shadow-inner border border-gw-line group">
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow"
                      style={{ width: '100%' }}
                    >
                      {ratio}%
                    </div>
                 </div>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-2">
                 <div className="text-[10px] font-black text-gw-text uppercase tracking-wide">
                   WPS Status
                 </div>
                 <div className={`
                    h-12 w-full rounded-lg flex items-center justify-center font-black text-white shadow-md text-sm border-2 border-white ring-2 ring-opacity-50
                    ${isBlocked ? 'bg-gw-danger ring-gw-danger' : 'bg-[#1e5832] ring-[#1e5832]'} 
                 `}>
                   {isBlocked ? 'BLOCKED' : 'NOT BLOCKED'}
                 </div>
              </div>

           </div>
        </div>
      )}

      {/* 4. Required For 85% Card */}
      {hasData && (
        <div className="px-5 mt-4 mb-6 animate-in slide-in-from-left-4 duration-500 delay-200">
           <div className="bg-gradient-to-br from-white to-gw-bg border-2 border-gw-line rounded-xl p-5 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group hover:border-gw-text">
              
              <div className="mb-4">
                <div className="bg-gw-text text-white px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md inline-flex items-center gap-2">
                   REQUIRED COUNT FOR 85%
                   <Info size={12} className="text-gw-teal"/>
                </div>
              </div>
              
              <div className="flex items-baseline gap-1">
                <div className="text-6xl font-black text-gw-text tracking-tighter drop-shadow-sm">
                  {kpis.complianceShortfall}
                </div>
              </div>
              
              <div className="mt-2 text-[11px] text-gw-muted font-bold uppercase tracking-tight border-t border-gw-line pt-2">
                 Employees needed to reach compliance.
              </div>
           </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1 min-h-[20px]"></div>

      {/* 5. Controls Section */}
      <div className="bg-gw-panel border-t-2 border-gw-line p-5">
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer group"
          onClick={() => setShowControls(!showControls)}
        >
          <div className="text-xs font-black uppercase tracking-wide text-gw-text flex items-center gap-2 group-hover:text-gw-teal transition-colors">
            <Settings size={14} />
            Data Controls
          </div>
          <div className="text-[10px] font-bold text-gw-muted bg-white px-2 py-0.5 rounded border border-gw-line shadow-sm">{showControls ? 'Hide' : 'Show'}</div>
        </div>

        {showControls && (
          <div className="animate-in slide-in-from-bottom-2 duration-300">
            {/* WPS File Upload */}
            <div className="bg-white border-2 border-gw-line rounded-xl p-3 shadow-sm mb-3 hover:border-gw-text transition-colors">
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full bg-gw-text hover:bg-black text-white font-black py-3 px-4 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wide cursor-pointer"
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={14} /> : <UploadCloud size={14} />}
                {hasData ? 'Upload New WPS File' : 'Upload WPS XLSX'}
              </button>
            </div>

            {/* Master File Upload (for RMS ID lookup) */}
            <div className="bg-white border-2 border-purple-200 rounded-xl p-3 shadow-sm mb-3 hover:border-purple-500 transition-colors">
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                ref={masterFileInputRef}
                onChange={handleMasterFileChange}
                className="hidden"
              />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <KeyRound size={12} className="text-purple-600" />
                  Master Fleet Data
                </span>
                {masterFileName && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 size={10} />
                    Active
                  </span>
                )}
              </div>
              <button 
                onClick={() => masterFileInputRef.current?.click()}
                disabled={isProcessingMaster}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-2.5 px-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 text-[11px] uppercase tracking-wide cursor-pointer"
              >
                {isProcessingMaster ? <RefreshCw className="animate-spin" size={13} /> : <UploadCloud size={13} />}
                {masterFileName ? 'Replace Master File' : 'Attach Master File (RMS)'}
              </button>
            </div>

            {/* Sheet Select & Full Export */}
            <div className="bg-white border-2 border-gw-line rounded-xl p-3 shadow-sm mb-3 hover:border-gw-text transition-colors">
              <select 
                value={currentSheet}
                onChange={(e) => onSheetChange(e.target.value)}
                disabled={sheetNames.length === 0}
                className="w-full bg-gw-bg border border-gw-line text-gw-text font-bold rounded-lg p-2 text-xs focus:outline-none focus:border-gw-text mb-2 cursor-pointer"
              >
                {sheetNames.length === 0 && <option>Waiting for file...</option>}
                {sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
               <button
                onClick={onDownloadFull}
                disabled={!currentSheet}
                className="w-full border-2 border-gw-line hover:bg-gw-bg text-gw-text hover:text-gw-teal hover:border-gw-teal py-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={12} />
                Download Full (With Status)
              </button>
            </div>

            {/* Quick Exports Grid */}
             <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={onDownloadPaid}
                  disabled={!currentSheet}
                  className="bg-white border-2 border-gw-line hover:bg-gw-text hover:text-white text-gw-text py-2 rounded-xl text-[10px] font-black transition-all flex flex-col items-center gap-1 uppercase tracking-tight shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  Paid List
                </button>
                <button 
                  onClick={onDownloadDue}
                  disabled={!currentSheet}
                  className="bg-white border-2 border-gw-line hover:bg-gw-danger hover:text-white text-gw-text py-2 rounded-xl text-[10px] font-black transition-all flex flex-col items-center gap-1 uppercase tracking-tight shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  Need To Pay
                </button>
              </div>

              {onDownloadRMS && (
                <button
                  onClick={onDownloadRMS}
                  disabled={!currentSheet}
                  className="w-full mt-2 bg-white border-2 border-purple-300 hover:bg-purple-600 hover:text-white text-purple-900 py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-tight shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <KeyRound size={13} />
                  Export RMS Mapped Sheet
                </button>
              )}
          </div>
        )}
      </div>
      
    </aside>
  );
};
