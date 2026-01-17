import React from 'react';
import { Info } from 'lucide-react';

interface KPIGridProps {
  kpis: {
    total: number;
    paidCount: number;
    dueCount: number;
    paidTotal: number;
    contractTotal: number;
    outstandingTotal: number;
    paidRatioCount: number;
    complianceShortfall: number;
  };
}

const formatMoney = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2, style: 'currency', currency: 'AED' });
const formatPct = (n: number) => (n * 100).toFixed(1) + "%";

// Enhanced KPI Card with Top Accent Border
const KPICard = ({ 
  label, 
  value, 
  isMoney = false, 
  tooltip,
  accentColor = "border-gw-text" // Default accent
}: { 
  label: string, 
  value: string | number, 
  isMoney?: boolean, 
  tooltip?: string,
  accentColor?: string
}) => (
  <div 
    className={`
      bg-white border border-gw-line rounded-xl p-5 shadow-sm flex flex-col justify-center relative group cursor-help transition-all hover:-translate-y-1 hover:shadow-xl
      border-t-4 ${accentColor}
    `}
    title={tooltip}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="text-[10px] font-black uppercase tracking-wider text-gw-muted group-hover:text-gw-text transition-colors">{label}</div>
      {tooltip && <Info size={12} className="text-gw-line group-hover:text-gw-teal transition-colors" />}
    </div>
    <div className={`text-2xl font-black tracking-tighter truncate ${isMoney ? 'text-gw-teal2' : 'text-gw-text'}`}>
      {value}
    </div>
  </div>
);

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <KPICard 
        label="Total Records" 
        value={kpis.total} 
        tooltip="Total number of rows extracted from the sheet."
        accentColor="border-blue-500"
      />
      <KPICard 
        label="Paid Count" 
        value={kpis.paidCount} 
        tooltip="Number of employees where Paid Amount is at least 80% of Contract Value."
        accentColor="border-gw-ok"
      />
      <KPICard 
        label="Need To Pay Count" 
        value={kpis.dueCount} 
        tooltip="Number of employees who have not been paid enough and have no remark."
        accentColor="border-gw-danger"
      />
      <KPICard 
        label="Paid Ratio" 
        value={formatPct(kpis.paidRatioCount)} 
        tooltip="Formula: Paid (>80%) without remarks / (Total Employees - Remarks)"
        accentColor="border-yellow-500"
      />

      <KPICard 
        label="Paid Total" 
        value={formatMoney(kpis.paidTotal)} 
        isMoney 
        tooltip="Sum of all Paid amounts extracted."
        accentColor="border-gw-ok"
      />
      <KPICard 
        label="Contract Total" 
        value={formatMoney(kpis.contractTotal)} 
        isMoney 
        tooltip="Sum of all Contract amounts extracted."
        accentColor="border-blue-800"
      />
      <KPICard 
        label="Outstanding Total" 
        value={formatMoney(kpis.outstandingTotal)} 
        isMoney 
        tooltip="Total discrepancy (Contract - Paid) for those who are underpaid."
        accentColor="border-gw-danger"
      />
      <KPICard 
        label="Shortfall (Count)" 
        value={kpis.complianceShortfall} 
        tooltip="Number of employees you MUST pay to reach 80% compliance."
        accentColor="border-gw-text"
      />
    </div>
  );
};
