import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartsSectionProps {
  paidCount: number;
  dueCount: number;
  paidAmount: number;
  outstandingAmount: number;
}

const COLORS_COUNT = ['#19c6d4', '#ff5c7a']; // Teal (Paid), Danger (Due)
const COLORS_AMOUNT = ['#2e7bdc', '#ff5c7a']; // Blue (Paid), Danger (Outstanding)

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gw-panel border border-gw-line p-2 rounded shadow-xl text-xs">
        <p className="font-bold text-gw-text">{`${payload[0].name}: ${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({ paidCount, dueCount, paidAmount, outstandingAmount }) => {
  const dataCount = [
    { name: 'Paid', value: paidCount },
    { name: 'Need To Pay', value: dueCount },
  ];

  const dataAmount = [
    { name: 'Paid', value: Math.round(paidAmount) },
    { name: 'Outstanding', value: Math.round(outstandingAmount) },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-gw-card border border-gw-line rounded-2xl p-1 shadow-lg flex flex-col">
        <div className="px-4 py-3 border-b border-gw-line font-black text-sm text-gw-text">Paid vs Need To Pay (Count)</div>
        <div className="h-64 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataCount}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {dataCount.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_COUNT[index % COLORS_COUNT.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a7bdd6' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gw-card border border-gw-line rounded-2xl p-1 shadow-lg flex flex-col">
        <div className="px-4 py-3 border-b border-gw-line font-black text-sm text-gw-text">Paid vs Outstanding (Amount)</div>
        <div className="h-64 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataAmount}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {dataAmount.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_AMOUNT[index % COLORS_AMOUNT.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a7bdd6' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
