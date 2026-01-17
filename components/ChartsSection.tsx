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
      <div className="bg-gw-text text-white p-3 rounded-lg shadow-xl text-xs border border-white/10">
        <p className="font-black mb-1 text-sm">{payload[0].name}</p>
        <p className="font-mono">{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  accentColor: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, accentColor }) => (
  <div className={`bg-white border border-gw-line rounded-2xl p-0 shadow-sm flex flex-col overflow-hidden border-t-4 ${accentColor}`}>
     <div className="px-5 py-4 border-b border-gw-line bg-gw-bg/50">
        <div className="font-black text-sm text-gw-text uppercase tracking-wider">{title}</div>
     </div>
     <div className="h-64 w-full mt-4 pr-4">
       {children}
     </div>
  </div>
);

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <ChartContainer title="Paid vs Need To Pay (Count)" accentColor="border-gw-teal">
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
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }} />
            </PieChart>
          </ResponsiveContainer>
      </ChartContainer>

      <ChartContainer title="Paid vs Outstanding (Amount)" accentColor="border-blue-600">
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
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }} />
            </PieChart>
          </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
