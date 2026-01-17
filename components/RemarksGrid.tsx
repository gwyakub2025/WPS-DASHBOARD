import React from 'react';
import { CleanedRow, REMARK_MASTER, OTHER_REMARK_KEY } from '../types';
import { downloadXlsx } from '../services/excelService';
import { Download } from 'lucide-react';

interface RemarksGridProps {
  rows: CleanedRow[];
  counts: Record<string, number>;
  sheetName: string;
}

export const RemarksGrid: React.FC<RemarksGridProps> = ({ rows, counts, sheetName }) => {
  
  const handleDownload = (remarkKey: string) => {
    // Re-filter specifically for this remark (mimicking the matching logic)
    const filtered = rows.filter(r => {
      const isOther = remarkKey === OTHER_REMARK_KEY;
      // We rely on the exact string match from the processed count logic 
      // but simpler here: we need to match the key logic from service.
      // Ideally, the rows would have a `remarkKey` property attached, 
      // but filtering by string text again is safe if logic is consistent.
      
      // Let's use a simpler heuristic: filter by the normalized remark mapping
      // But since we don't have the matcher here, we can just pre-process or
      // re-implement the matcher. 
      // Ideally, we'd pass a downloader function from parent, but let's implement basic matching here.
      
      const rText = r.remark.toLowerCase().trim();
      if (isOther) {
         // Check if it matches any master
         const matchesAny = REMARK_MASTER.some(m => rText === m.toLowerCase().trim());
         return !matchesAny;
      } else {
         return rText === remarkKey.toLowerCase().trim();
      }
    });

    downloadXlsx(filtered, `REMARK_${remarkKey.substring(0,20).replace(/\W/g,'_')}_${sheetName}.xlsx`);
  };

  const Card: React.FC<{ label: string, count: number, isOther?: boolean }> = ({ label, count, isOther }) => (
    <div className={`
      relative group p-4 rounded-xl border border-gw-line flex flex-col justify-between min-h-[140px] transition-all
      ${isOther ? 'bg-gw-panel/50' : 'bg-gw-panel/30'}
      hover:border-gw-teal/50 hover:bg-gw-panel
    `}>
      <div>
        <div className="text-xs text-gw-muted font-medium mb-2 min-h-[32px] line-clamp-2" title={label}>
          {label}
        </div>
        <div className="text-2xl font-black text-gw-text group-hover:text-gw-teal transition-colors">
          {count}
        </div>
      </div>
      <button 
        onClick={() => handleDownload(label)}
        disabled={count === 0}
        className={`
          mt-3 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold w-full border border-gw-line
          transition-colors
          ${count === 0 
            ? 'opacity-50 cursor-not-allowed text-gw-muted' 
            : 'hover:bg-gw-teal hover:text-gw-bg hover:border-gw-teal text-gw-text cursor-pointer'}
        `}
      >
        <Download size={14} />
        Download XLSX
      </button>
    </div>
  );

  return (
    <div className="bg-gw-card border border-gw-line rounded-2xl p-4 shadow-lg mb-6">
      <div className="font-black text-sm text-gw-text mb-4 pb-2 border-b border-gw-line">Remarks Breakdown</div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {REMARK_MASTER.map(label => (
          <Card key={label} label={label} count={counts[label] || 0} isOther={false} />
        ))}
        <Card label={OTHER_REMARK_KEY} count={counts[OTHER_REMARK_KEY] || 0} isOther={true} />
      </div>
    </div>
  );
};