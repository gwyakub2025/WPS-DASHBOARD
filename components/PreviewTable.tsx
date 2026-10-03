import React, { useState, useMemo } from 'react';
import { CleanedRow, WPSStatus } from '../types';
import { Search, X, ChevronDown, CheckCircle2, AlertCircle, FileX } from 'lucide-react';

interface PreviewTableProps {
  title: string;
  rows: CleanedRow[];
  showStatus?: boolean;
}

export const PreviewTable: React.FC<PreviewTableProps> = ({ title, rows, showStatus = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | WPSStatus>('All');
  const [visibleCount, setVisibleCount] = useState(100);

  // Auto-detect status column if any row has a status or explicitly requested
  const hasStatusColumn = showStatus || rows.some(r => !!r.status);

  // Filter rows based on search and status filter
  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rows.filter(r => {
      // 1. Status Filter
      if (statusFilter !== 'All' && r.status !== statusFilter) {
        return false;
      }
      // 2. Search Term Filter
      if (!term) return true;
      return (
        (r.sno && r.sno.toLowerCase().includes(term)) ||
        (r.name && r.name.toLowerCase().includes(term)) ||
        (r.code && r.code.toLowerCase().includes(term)) ||
        (r.remark && r.remark.toLowerCase().includes(term)) ||
        (r.status && r.status.toLowerCase().includes(term))
      );
    });
  }, [rows, searchTerm, statusFilter]);

  const displayedRows = filteredRows.slice(0, visibleCount);

  // Status counts for filter chips
  const counts = useMemo(() => {
    let paidCount = 0;
    let dueCount = 0;
    let excludedCount = 0;
    rows.forEach(r => {
      if (r.status === 'Paid List') paidCount++;
      else if (r.status === 'Need to Pay') dueCount++;
      else if (r.status === 'Excluded') excludedCount++;
    });
    return { paidCount, dueCount, excludedCount, total: rows.length };
  }, [rows]);

  return (
    <div className="bg-white border-2 border-gw-line rounded-2xl overflow-hidden shadow-md flex flex-col min-h-[500px] h-[580px]">
      {/* Table Top Header: Title & Stats */}
      <div className="px-5 py-3.5 border-b-2 border-gw-line bg-white z-10 sticky top-0 flex flex-wrap gap-3 justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="font-black text-sm text-gw-text uppercase tracking-wide border-l-4 border-gw-teal pl-3">
            {title}
          </span>
          <span className="text-xs font-bold text-white bg-gw-text px-3 py-1 rounded-full shadow-sm">
            {filteredRows.length} {filteredRows.length === 1 ? 'row' : 'rows'}
            {filteredRows.length !== rows.length && ` (of ${rows.length})`}
          </span>
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gw-muted pointer-events-none" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleCount(100);
              }}
              placeholder="Search Name, Code, SNO..."
              className="pl-8 pr-7 py-1.5 bg-gw-bg border border-gw-line rounded-lg text-xs font-bold text-gw-text placeholder:text-gw-muted focus:outline-none focus:border-gw-text w-48 sm:w-64 transition-all"
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

      {/* Optional Status Filter Subheader (when viewing All List with Statuses) */}
      {hasStatusColumn && counts.total > 0 && (
        <div className="px-5 py-2.5 bg-gw-bg/60 border-b border-gw-line flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="text-[11px] font-black uppercase tracking-wider text-gw-muted mr-1">Filter by Status:</span>
          
          <button 
            onClick={() => { setStatusFilter('All'); setVisibleCount(100); }}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              statusFilter === 'All' 
                ? 'bg-gw-text text-white shadow-sm' 
                : 'bg-white text-gw-muted border border-gw-line hover:text-gw-text'
            }`}
          >
            All ({counts.total})
          </button>

          <button 
            onClick={() => { setStatusFilter('Paid List'); setVisibleCount(100); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              statusFilter === 'Paid List' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 size={13} className={statusFilter === 'Paid List' ? 'text-white' : 'text-emerald-600'} />
            Paid List ({counts.paidCount})
          </button>

          <button 
            onClick={() => { setStatusFilter('Need to Pay'); setVisibleCount(100); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              statusFilter === 'Need to Pay' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'bg-white text-rose-800 border border-rose-300 hover:bg-rose-50'
            }`}
          >
            <AlertCircle size={13} className={statusFilter === 'Need to Pay' ? 'text-white' : 'text-rose-600'} />
            Need to Pay ({counts.dueCount})
          </button>

          <button 
            onClick={() => { setStatusFilter('Excluded'); setVisibleCount(100); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              statusFilter === 'Excluded' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-50'
            }`}
          >
            <FileX size={13} className={statusFilter === 'Excluded' ? 'text-white' : 'text-amber-600'} />
            Excluded ({counts.excludedCount})
          </button>
        </div>
      )}

      {/* Main Table Body */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          {/* Dark Header for "Radiant" / Effective look */}
          <thead className="bg-gw-text sticky top-0 z-0 shadow-lg">
            <tr>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap w-16 border-r border-white/10 text-center">SNO</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap border-r border-white/10">Name</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap border-r border-white/10">Code</th>
              {hasStatusColumn && (
                <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap border-r border-white/10 text-center">
                  Status
                </th>
              )}
              <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap text-right border-r border-white/10">Paid (AED)</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap text-right border-r border-white/10">Contract (AED)</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gw-line text-xs text-gw-text font-bold">
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={hasStatusColumn ? 7 : 6} className="p-12 text-center text-gw-muted italic">
                  {rows.length === 0 ? 'No records found in this dataset.' : 'No records match the active search or status filter.'}
                </td>
              </tr>
            ) : (
              displayedRows.map((r, i) => (
                <tr key={`${r.sno}-${r.code}-${i}`} className="hover:bg-gw-panel transition-colors even:bg-slate-50/70">
                  <td className="p-3 pl-4 text-gw-muted font-mono text-center">{r.sno}</td>
                  <td className="p-3 max-w-[200px] truncate" title={r.name}>
                    <span className="font-extrabold text-gw-text">{r.name || '-'}</span>
                  </td>
                  <td className="p-3 font-mono text-gw-teal2">{r.code || '-'}</td>
                  
                  {/* Status Column */}
                  {hasStatusColumn && (
                    <td className="p-3 text-center whitespace-nowrap">
                      {r.status === 'Paid List' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          Paid List
                        </span>
                      )}
                      {r.status === 'Need to Pay' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                          Need to Pay
                        </span>
                      )}
                      {r.status === 'Excluded' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                          Excluded
                        </span>
                      )}
                      {!r.status && <span className="text-gw-muted">-</span>}
                    </td>
                  )}

                  <td className={`p-3 text-right font-mono ${r.paid > 0 ? 'text-gw-ok' : 'text-gw-muted'}`}>
                    {r.paid > 0 ? r.paid.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {r.contract > 0 ? r.contract.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="p-3 max-w-[260px] truncate text-gw-text/80" title={r.remark}>
                    {r.remark || <span className="text-gw-muted/40 font-normal">None</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Pagination / Load More */}
      {filteredRows.length > visibleCount && (
        <div className="p-3 bg-gw-panel border-t border-gw-line flex items-center justify-between px-6 z-10">
          <span className="text-xs text-gw-muted font-bold">
            Showing <span className="text-gw-text font-black">{visibleCount}</span> of <span className="text-gw-text font-black">{filteredRows.length}</span> rows
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setVisibleCount(prev => Math.min(prev + 100, filteredRows.length))}
              className="bg-white hover:bg-gw-line/80 border border-gw-line text-gw-text font-black text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <ChevronDown size={14} />
              Show +100 More
            </button>
            <button 
              onClick={() => setVisibleCount(filteredRows.length)}
              className="bg-gw-text hover:bg-black text-white font-black text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Show All ({filteredRows.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
