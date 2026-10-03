import React, { useState, useMemo, useRef } from 'react';
import { CleanedRowWithRMS, MasterDataset, WPSStatus } from '../types';
import { 
  Search, 
  X, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  RefreshCw, 
  BadgeCheck,
  Layers,
  KeyRound
} from 'lucide-react';

interface RMSTableProps {
  rows: CleanedRowWithRMS[];
  masterDataset: MasterDataset | null;
  onMasterFileUpload: (file: File) => void;
  isProcessingMaster: boolean;
  onDownloadRMS: () => void;
}

export const RMSTable: React.FC<RMSTableProps> = ({
  rows,
  masterDataset,
  onMasterFileUpload,
  isProcessingMaster,
  onDownloadRMS
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchFilter, setMatchFilter] = useState<'All' | 'Matched' | 'Missing'>('All');
  const [wpsStatusFilter, setWpsStatusFilter] = useState<'All' | WPSStatus>('All');
  const [visibleCount, setVisibleCount] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onMasterFileUpload(e.target.files[0]);
    }
  };

  // Compute matched and unmatched statistics
  const stats = useMemo(() => {
    let matchedCount = 0;
    let missingCount = 0;
    rows.forEach(r => {
      if (r.isRmsMatched && r.rmsId) {
        matchedCount++;
      } else {
        missingCount++;
      }
    });
    const total = rows.length;
    const matchPercentage = total > 0 ? ((matchedCount / total) * 100).toFixed(1) : '0';
    return { total, matchedCount, missingCount, matchPercentage };
  }, [rows]);

  // Filter rows by match state, WPS status, and search query
  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rows.filter(r => {
      // 1. Match Filter
      if (matchFilter === 'Matched' && !r.isRmsMatched) return false;
      if (matchFilter === 'Missing' && r.isRmsMatched) return false;

      // 2. WPS Status Filter
      if (wpsStatusFilter !== 'All' && r.status !== wpsStatusFilter) return false;

      // 3. Search Term Filter
      if (!term) return true;
      return (
        (r.rmsId && r.rmsId.toLowerCase().includes(term)) ||
        (r.code && r.code.toLowerCase().includes(term)) ||
        (r.name && r.name.toLowerCase().includes(term)) ||
        (r.masterRecord?.riderName && r.masterRecord.riderName.toLowerCase().includes(term)) ||
        (r.masterRecord?.project && r.masterRecord.project.toLowerCase().includes(term)) ||
        (r.sno && r.sno.toLowerCase().includes(term)) ||
        (r.remark && r.remark.toLowerCase().includes(term)) ||
        (r.status && r.status.toLowerCase().includes(term))
      );
    });
  }, [rows, matchFilter, wpsStatusFilter, searchTerm]);

  const displayedRows = filteredRows.slice(0, visibleCount);

  return (
    <div className="bg-white border-2 border-gw-line rounded-2xl overflow-hidden shadow-md flex flex-col min-h-[550px] h-[640px]">
      
      {/* Hidden Master File Input */}
      <input 
        type="file" 
        accept=".xlsx,.xls" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* TOP HEADER: Title, Stats Bar & Actions */}
      <div className="px-5 py-3.5 border-b-2 border-gw-line bg-white z-10 sticky top-0 flex flex-wrap gap-3 justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="font-black text-sm text-gw-text uppercase tracking-wide border-l-4 border-purple-600 pl-3 flex items-center gap-2">
            <KeyRound size={16} className="text-purple-600" />
            RMS ID Mapping (Person Code Primary Key)
          </span>
          <span className="text-xs font-bold text-white bg-gw-text px-3 py-1 rounded-full shadow-sm">
            {filteredRows.length} {filteredRows.length === 1 ? 'row' : 'rows'}
            {filteredRows.length !== rows.length && ` (of ${rows.length})`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Master File Status Pill */}
          {masterDataset ? (
            <div className="hidden sm:flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-black text-purple-900 shadow-2xs">
              <FileSpreadsheet size={14} className="text-purple-600" />
              <span className="truncate max-w-[180px]" title={masterDataset.fileName}>
                {masterDataset.fileName}
              </span>
              <span className="bg-purple-200/80 text-purple-800 text-[10px] px-1.5 py-0.5 rounded font-mono">
                {masterDataset.totalRecords.toLocaleString()} riders
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingMaster}
                className="text-purple-700 hover:text-purple-950 underline text-[11px] ml-1 cursor-pointer font-bold"
                title="Upload different Master file"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingMaster}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 uppercase tracking-wide cursor-pointer shadow-sm animate-pulse"
            >
              <UploadCloud size={14} />
              {isProcessingMaster ? 'Processing...' : 'Upload Master File'}
            </button>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gw-muted pointer-events-none" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleCount(100);
              }}
              placeholder="Search RMS, Code, Name..."
              className="pl-8 pr-7 py-1.5 bg-gw-bg border border-gw-line rounded-lg text-xs font-bold text-gw-text placeholder:text-gw-muted focus:outline-none focus:border-purple-600 w-48 sm:w-56 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gw-muted hover:text-gw-text p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BANNER 1: If No Master File Uploaded Yet, Show Friendly Dropzone/Guide */}
      {!masterDataset && (
        <div className="p-6 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-slate-50 border-b-2 border-gw-line flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-md border border-purple-200 shrink-0">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-purple-950 uppercase tracking-wide flex items-center gap-2">
                Attach Master File to Resolve RMS IDs
              </h3>
              <p className="text-xs text-purple-800/80 mt-1 max-w-2xl leading-relaxed font-medium">
                Upload your Master Excel sheet containing <strong>RMS ID</strong> (e.g. <span className="font-mono bg-white px-1 py-0.5 rounded border border-purple-200">GWDS-BR-000...</span>) and <strong>PERSON NUMB / Code</strong>. 
                The system will automatically match each WPS employee by their Person Code primary key.
              </p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingMaster}
            className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 uppercase tracking-wide cursor-pointer hover:shadow-lg"
          >
            {isProcessingMaster ? <RefreshCw className="animate-spin" size={16} /> : <UploadCloud size={16} />}
            Select Master Excel File
          </button>
        </div>
      )}

      {/* BANNER 2: KPI Match Summary Strip */}
      {masterDataset && (
        <div className="px-5 py-2.5 bg-gw-bg/80 border-b border-gw-line flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Match Rate Metrics */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-gw-line shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-gw-muted">Match Rate:</span>
              <span className="font-black text-sm text-purple-700 font-mono">{stats.matchPercentage}%</span>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-emerald-200 shadow-2xs">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Matched:</span>
              <span className="font-black text-sm text-emerald-700 font-mono">{stats.matchedCount}</span>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-rose-200 shadow-2xs">
              <AlertCircle size={13} className="text-rose-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">Unmatched:</span>
              <span className="font-black text-sm text-rose-700 font-mono">{stats.missingCount}</span>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-gw-muted mr-1">Filter:</span>
            
            <button 
              onClick={() => { setMatchFilter('All'); setVisibleCount(100); }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                matchFilter === 'All' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'bg-white text-gw-text/70 border border-gw-line hover:text-gw-text'
              }`}
            >
              All ({stats.total})
            </button>

            <button 
              onClick={() => { setMatchFilter('Matched'); setVisibleCount(100); }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                matchFilter === 'Matched' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <BadgeCheck size={12} />
              Matched ({stats.matchedCount})
            </button>

            <button 
              onClick={() => { setMatchFilter('Missing'); setVisibleCount(100); }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                matchFilter === 'Missing' 
                  ? 'bg-rose-600 text-white shadow-sm' 
                  : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle size={12} />
              Missing ({stats.missingCount})
            </button>

            {/* Separator */}
            <div className="h-4 w-px bg-gw-line mx-1"></div>

            {/* WPS Status Pills */}
            <select
              value={wpsStatusFilter}
              onChange={(e) => {
                setWpsStatusFilter(e.target.value as any);
                setVisibleCount(100);
              }}
              className="bg-white border border-gw-line text-gw-text font-bold rounded-md px-2 py-1 text-[11px] cursor-pointer focus:outline-none focus:border-purple-600"
            >
              <option value="All">All WPS Statuses</option>
              <option value="Paid List">Paid List Only</option>
              <option value="Need to Pay">Need to Pay Only</option>
              <option value="Excluded">Excluded Only</option>
            </select>
          </div>
        </div>
      )}

      {/* TABLE BODY */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          {/* Dark Header */}
          <thead className="bg-gw-text sticky top-0 z-0 shadow-lg">
            <tr>
              <th className="p-3.5 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap w-14 border-r border-white/10 text-center">SNO</th>
              <th className="p-3.5 text-xs font-black uppercase tracking-wider text-purple-200 whitespace-nowrap border-r border-white/10 text-center bg-gw-text">
                RMS ID
              </th>
              <th className="p-3.5 text-xs font-black uppercase tracking-wider text-gw-teal whitespace-nowrap border-r border-white/10">
                Person Code (PK)
              </th>
              <th className="p-3.5 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap border-r border-white/10">
                Person Name (WPS)
              </th>
              <th className="p-3.5 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap border-r border-white/10 text-center">
                WPS Status
              </th>
              <th className="p-3.5 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap text-right border-r border-white/10">
                Paid (AED)
              </th>
              <th className="p-3.5 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap text-right border-r border-white/10">
                Contract (AED)
              </th>
              <th className="p-3.5 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap text-right">
                Outstanding (AED)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gw-line text-xs text-gw-text font-bold">
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-14 text-center text-gw-muted italic">
                  {rows.length === 0 
                    ? 'No records loaded.' 
                    : !masterDataset 
                      ? 'Upload a Master file to match RMS IDs, or check your search query.'
                      : 'No records match the active search or filters.'}
                </td>
              </tr>
            ) : (
              displayedRows.map((r, i) => (
                <tr key={`${r.sno}-${r.code}-${i}`} className="hover:bg-purple-50/40 transition-colors even:bg-slate-50/70">
                  <td className="p-3 pl-4 text-gw-muted font-mono text-center">{r.sno}</td>
                  
                  {/* RMS ID Column */}
                  <td className="p-3 text-center whitespace-nowrap">
                    {r.isRmsMatched && r.rmsId ? (
                      <span className="font-mono font-black text-xs px-2.5 py-1 bg-purple-100/80 text-purple-900 border border-purple-300 rounded-md shadow-2xs inline-flex items-center gap-1.5">
                        <BadgeCheck size={13} className="text-purple-700" />
                        {r.rmsId}
                      </span>
                    ) : (
                      <span className="text-[11px] font-black px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-md inline-flex items-center gap-1">
                        <AlertTriangle size={11} className="text-rose-500" />
                        {masterDataset ? 'Not Found' : 'Pending Master'}
                      </span>
                    )}
                  </td>

                  {/* Person Code (Primary Key) */}
                  <td className="p-3 font-mono whitespace-nowrap">
                    <span className="font-mono font-black text-gw-teal2 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {r.code || '-'}
                    </span>
                  </td>

                  {/* Person Name (WPS) */}
                  <td className="p-3 max-w-[240px] truncate" title={r.name}>
                    <span className="font-extrabold text-gw-text">{r.name || '-'}</span>
                  </td>

                  {/* WPS Status Column */}
                  <td className="p-3 text-center whitespace-nowrap">
                    {r.status === 'Paid List' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Paid List
                      </span>
                    )}
                    {r.status === 'Need to Pay' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                        Need to Pay
                      </span>
                    )}
                    {r.status === 'Excluded' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                        Excluded
                      </span>
                    )}
                    {!r.status && <span className="text-gw-muted">-</span>}
                  </td>

                  {/* Paid */}
                  <td className={`p-3 text-right font-mono ${r.paid > 0 ? 'text-gw-ok' : 'text-gw-muted'}`}>
                    {r.paid > 0 ? r.paid.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-'}
                  </td>

                  {/* Contract */}
                  <td className="p-3 text-right font-mono">
                    {r.contract > 0 ? r.contract.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-'}
                  </td>

                  {/* Outstanding */}
                  <td className={`p-3 text-right font-mono ${r.outstanding > 0 ? 'text-gw-danger font-black' : 'text-gw-muted'}`}>
                    {r.outstanding > 0 ? r.outstanding.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TABLE FOOTER */}
      <div className="p-3 bg-gw-panel border-t border-gw-line flex flex-wrap items-center justify-between gap-3 px-6 z-10">
        <span className="text-xs text-gw-muted font-bold">
          Showing <span className="text-gw-text font-black">{Math.min(visibleCount, filteredRows.length)}</span> of <span className="text-gw-text font-black">{filteredRows.length}</span> rows
        </span>
        
        <div className="flex items-center gap-2">
          {filteredRows.length > visibleCount && (
            <>
              <button 
                onClick={() => setVisibleCount(prev => Math.min(prev + 100, filteredRows.length))}
                className="bg-white hover:bg-gw-line/80 border border-gw-line text-gw-text font-black text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <ChevronDown size={14} />
                Show +100 More
              </button>
              <button 
                onClick={() => setVisibleCount(filteredRows.length)}
                className="bg-gw-text hover:bg-black text-white font-black text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Show All ({filteredRows.length})
              </button>
            </>
          )}

          <button
            onClick={onDownloadRMS}
            disabled={rows.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={13} />
            Export RMS Mapped Sheet
          </button>
        </div>
      </div>

    </div>
  );
};
