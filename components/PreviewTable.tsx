import React from 'react';
import { CleanedRow } from '../types';

interface PreviewTableProps {
  title: string;
  rows: CleanedRow[];
}

export const PreviewTable: React.FC<PreviewTableProps> = ({ title, rows }) => {
  return (
    <div className="bg-white border-2 border-gw-line rounded-2xl overflow-hidden shadow-md flex flex-col h-[450px]">
      <div className="px-5 py-4 border-b-2 border-gw-line bg-white z-10 sticky top-0 flex justify-between items-center">
        <span className="font-black text-sm text-gw-text uppercase tracking-wide border-l-4 border-gw-teal pl-3">{title}</span>
        <span className="text-xs font-bold text-white bg-gw-text px-3 py-1.5 rounded-full shadow-sm">{rows.length} rows</span>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          {/* Dark Header for "Radiant" / Effective look */}
          <thead className="bg-gw-text sticky top-0 z-0 shadow-lg">
            <tr>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap w-20 border-r border-white/10">SNO</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap border-r border-white/10">Name</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap border-r border-white/10">Code</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap text-right border-r border-white/10">Paid</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap text-right border-r border-white/10">Contract</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gw-line text-xs text-gw-text font-bold">
            {rows.length === 0 ? (
               <tr>
                 <td colSpan={6} className="p-8 text-center text-gw-muted italic">No records found.</td>
               </tr>
            ) : (
              rows.slice(0, 100).map((r, i) => (
                <tr key={i} className="hover:bg-gw-panel transition-colors even:bg-slate-50">
                  <td className="p-3 pl-4 text-gw-muted font-mono">{r.sno}</td>
                  <td className="p-3 max-w-[150px] truncate" title={r.name}>{r.name}</td>
                  <td className="p-3 font-mono text-gw-teal2">{r.code}</td>
                  <td className={`p-3 text-right ${r.paid > 0 ? 'text-gw-ok' : 'text-gw-muted'}`}>
                    {r.paid > 0 ? r.paid.toLocaleString() : '-'}
                  </td>
                  <td className="p-3 text-right">{r.contract > 0 ? r.contract.toLocaleString() : '-'}</td>
                  <td className="p-3 max-w-[200px] truncate text-gw-text/80" title={r.remark}>{r.remark}</td>
                </tr>
              ))
            )}
            {rows.length > 100 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gw-text font-black text-xs bg-gw-panel border-t border-gw-line">
                  ... {rows.length - 100} more rows hidden in preview ...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
