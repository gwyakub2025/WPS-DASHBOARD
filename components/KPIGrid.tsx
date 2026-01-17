import React from 'react';

interface KPIGridProps {
  kpis: {
    total: number;
    paidCount: number;
    dueCount: number;
    paidTotal: number;
    contractTotal: number;
    outstandingTotal: number;
    paidRatioCount: number;
    paidRatioAmount: number;
  };
}

const formatMoney = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2, style: 'currency', currency: 'AED' });
const formatPct = (n: number) => (n * 100).toFixed(1) + "%";

const KPICard = ({ label, value, isMoney = false }: { label: string, value: string | number, isMoney?: boolean }) => (
  <div className="bg-gw-card border border-gw-line rounded-2xl p-4 shadow-lg flex flex-col justify-center">
    <div className="text-xs text-gw-muted mb-1">{label}</div>
    <div className={`text-lg font-black tracking-tight ${isMoney ? 'text-gw-teal' : 'text-gw-text'}`}>
      {value}
    </div>
  </div>
);

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <KPICard label="Total Records" value={kpis.total} />
      <KPICard label="Paid Count" value={kpis.paidCount} />
      <KPICard label="Need To Pay Count" value={kpis.dueCount} />
      <KPICard label="Paid Total" value={formatMoney(kpis.paidTotal)} isMoney />

      <KPICard label="Contract Total" value={formatMoney(kpis.contractTotal)} isMoney />
      <KPICard label="Outstanding Total" value={formatMoney(kpis.outstandingTotal)} isMoney />
      <KPICard label="Paid Ratio (Count)" value={formatPct(kpis.paidRatioCount)} />
      <KPICard label="Paid Ratio (Amount)" value={formatPct(kpis.paidRatioAmount)} />
    </div>
  );
};
