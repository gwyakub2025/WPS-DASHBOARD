import React from 'react';
import { CleanedRow } from '../types';

interface PreviewTableProps {
  title: string;
  rows: CleanedRow[];
}

export const PreviewTable: React.FC<PreviewTableProps> = ({ title, rows }) => {
  return (
    <div className="bg-gw-card border border-gw-line rounded-2xl overflow-hidden shadow-lg flex flex-col h-[400px]">
      <div className="px-4 py-3 border-b border-gw-line font-black text-sm text-gw-text bg-gw-card z-10 sticky top-0 flex justify-between items-center">
        <span>{title}</span>
        <span className="text-xs font-normal text-gw-muted bg-gw-panel px-2 py-1 rounded-md">{rows.length} rows</span>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gw-panel sticky top-0 z-0 text-xs uppercase text-gw-muted">
            <tr>
              <th className="p-3 font-semibold border-b border-gw-line whitespace-nowrap">SNO</th>
              <th className="p-3 font-semibold border-b border-gw-line whitespace-nowrap">Name</th>
              <th className="p-3 font-semibold border-b border-gw-line whitespace-nowrap">Code</th>
              <th className="p-3 font-semibold border-b border-gw-line whitespace-nowrap text-right">Paid</th>
              <th className="p-3 font-semibold border-b border-gw-line whitespace-nowrap text-right">Contract</th>
              <th className="p-3 font-semibold border-b border-gw-line whitespace-nowrap">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gw-line text-xs text-gw-text">
            {rows.length === 0 ? (
               <tr>
                 <td colSpan={6} className="p-8 text-center text-gw-muted italic">No records found.</td>
               </tr>
            ) : (
              rows.slice(0, 100).map((r, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-3">{r.sno}</td>
                  <td className="p-3 max-w-[150px] truncate" title={r.name}>{r.name}</td>
                  <td className="p-3 font-mono text-gw-muted">{r.code}</td>
                  <td className="p-3 text-right font-medium text-gw-ok">{r.paid > 0 ? r.paid.toLocaleString() : '-'}</td>
                  <td className="p-3 text-right font-medium">{r.contract > 0 ? r.contract.toLocaleString() : '-'}</td>
                  <td className="p-3 max-w-[200px] truncate text-gw-muted" title={r.remark}>{r.remark}</td>
                </tr>
              ))
            )}
            {rows.length > 100 && (
              <tr>
                <td colSpan={6} className="p-3 text-center text-gw-muted text-xs bg-gw-panel/50">
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
