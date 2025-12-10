import React from 'react';
import { Journal } from '../types';

interface StatsCardsProps {
  data: Journal[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ data }) => {
  const total = data.length;
  const hasAbdc = data.filter(j => j.abdc).length;
  const hasAbs = data.filter(j => j.abs).length;
  const hasJcr = data.filter(j => j.jcr_quartile).length;
  const hasSjr = data.filter(j => j.sjr_quartile).length;

  const cards = [
    { label: 'Total Journals', value: total, color: 'bg-blue-500' },
    { label: 'Com ABDC', value: hasAbdc, color: 'bg-emerald-500' },
    { label: 'Com ABS', value: hasAbs, color: 'bg-teal-500' },
    { label: 'Com JCR', value: hasJcr, color: 'bg-indigo-500' },
    { label: 'Com SJR', value: hasSjr, color: 'bg-violet-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{card.value}</div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${card.color}`}></span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;