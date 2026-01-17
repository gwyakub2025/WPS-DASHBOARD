import React from 'react';
import { UploadCloud, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';

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
  fileName
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <aside className="w-[340px] flex-shrink-0 bg-gradient-to-b from-[#06121f] to-gw-bg border-r border-gw-line p-5 flex flex-col h-screen sticky top-0 overflow-y-auto">
      
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gw-teal to-gw-blue flex items-center justify-center text-[#06121f] font-black text-xl shadow-lg shadow-gw-teal/20">
          GW
        </div>
        <div>
          <div className="font-black text-lg text-white tracking-tight">WPS Dashboard</div>
          <div className="text-[10px] text-gw-muted uppercase tracking-wider font-semibold">Gulf Way Group</div>
        </div>
      </div>

      {/* Upload Card */}
      <div className="bg-gw-card border border-gw-line rounded-2xl p-4 shadow-lg mb-4">
        <div className="text-xs text-gw-muted mb-2 font-bold uppercase tracking-wide">Step 1: Upload</div>
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
          className="w-full bg-gradient-to-r from-gw-teal to-gw-blue hover:from-gw-teal2 hover:to-gw-blue text-gw-bg font-black py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-gw-teal/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <UploadCloud size={18} />}
          {isProcessing ? 'Processing...' : 'Upload XLSX'}
        </button>
        {fileName && (
          <div className="mt-3 text-xs text-gw-ok flex items-center gap-1">
             <FileSpreadsheet size={12} />
             <span className="truncate">{fileName}</span>
          </div>
        )}
      </div>

      {/* Select Tab */}
      <div className="bg-gw-card border border-gw-line rounded-2xl p-4 shadow-lg mb-4">
        <div className="text-xs text-gw-muted mb-2 font-bold uppercase tracking-wide">Step 2: Select Sheet</div>
        <select 
          value={currentSheet}
          onChange={(e) => onSheetChange(e.target.value)}
          disabled={sheetNames.length === 0}
          className="w-full bg-gw-panel border border-gw-line text-gw-text rounded-xl p-3 text-sm focus:outline-none focus:border-gw-teal disabled:opacity-50"
        >
          {sheetNames.length === 0 && <option>Waiting for file...</option>}
          {sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        
        <button
           onClick={onDownloadFull}
           disabled={!currentSheet}
           className="mt-3 w-full border border-gw-line hover:bg-gw-panel text-gw-text py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          Download Full Cleaned (XLSX)
        </button>
      </div>

      {/* Quick Downloads */}
      <div className="bg-gw-card border border-gw-line rounded-2xl p-4 shadow-lg">
        <div className="text-xs text-gw-muted mb-2 font-bold uppercase tracking-wide">Step 3: Quick Exports</div>
        <div className="grid grid-cols-2 gap-2">
          <button 
             onClick={onDownloadPaid}
             disabled={!currentSheet}
             className="border border-gw-line hover:bg-gw-ok/10 hover:border-gw-ok hover:text-gw-ok text-gw-text py-3 px-2 rounded-xl text-xs font-bold transition-colors flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Paid List
          </button>
          <button 
             onClick={onDownloadDue}
             disabled={!currentSheet}
             className="border border-gw-line hover:bg-gw-danger/10 hover:border-gw-danger hover:text-gw-danger text-gw-text py-3 px-2 rounded-xl text-xs font-bold transition-colors flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Need To Pay
          </button>
        </div>
      </div>

      <div className="mt-auto pt-6 text-[10px] text-gw-muted text-center opacity-40">
        &copy; {new Date().getFullYear()} Gulf Way Group<br/>Internal Tool
      </div>
    </aside>
  );
};
