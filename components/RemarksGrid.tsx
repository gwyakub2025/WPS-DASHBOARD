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

  const Card: React.FC<{ label: string, count: number, isOther?: boolean, idx: number }> = ({ label, count, isOther, idx }) => {
    // Generate a consistent color based on index for the border/highlight
    const colors = [
      'border-blue-500', 'border-purple-500', 'border-pink-500', 'border-indigo-500', 'border-cyan-500', 
      'border-teal-500', 'border-emerald-500', 'border-lime-500', 'border-amber-500', 'border-orange-500'
    ];
    const accentColor = isOther ? 'border-gray-600' : colors[idx % colors.length];

    return (
      <div className={`
        relative group p-4 rounded-xl border-2 flex flex-col justify-between min-h-[160px] transition-all duration-200
        bg-white hover:border-gw-text hover:shadow-xl hover:-translate-y-1
        ${isOther ? 'border-gw-line bg-gw-bg' : 'border-gw-line'}
      `}>
        <div>
          {/* Embossed / Highlighted Label */}
          <div className={`
            text-[10px] font-black text-gw-text mb-3 min-h-[40px] line-clamp-2 uppercase tracking-tight leading-4
            bg-gw-panel rounded-md px-2 py-2 shadow-sm border-l-4 ${accentColor}
          `} title={label}>
            {label}
          </div>
          
          <div className="text-4xl font-black text-gw-text pl-1">
            {count}
          </div>
        </div>
        <button 
          onClick={() => handleDownload(label)}
          disabled={count === 0}
          className={`
            mt-4 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-black w-full border-2
            transition-colors uppercase tracking-wide
            ${count === 0 
              ? 'opacity-40 cursor-not-allowed text-gw-muted border-transparent bg-gw-bg' 
              : 'hover:bg-gw-text hover:text-white hover:border-gw-text text-gw-text border-gw-line cursor-pointer bg-white shadow-sm'}
          `}
        >
          <Download size={12} />
          XLSX
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gw-line rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex items-center gap-2 mb-6 pb-2 border-b-2 border-gw-line">
         <div className="h-6 w-1.5 bg-gw-teal rounded-full"></div>
         <div className="font-black text-sm text-gw-text uppercase tracking-wide">Remarks Breakdown</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {REMARK_MASTER.map((label, i) => (
          <Card key={label} label={label} count={counts[label] || 0} isOther={false} idx={i} />
        ))}
        <Card label={OTHER_REMARK_KEY} count={counts[OTHER_REMARK_KEY] || 0} isOther={true} idx={99} />
      </div>
    </div>
  );
};
