import React, { useMemo } from "react";
import { motion } from "motion/react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { formatCurrency, formatNumber } from "../utils/helpers";
import { translations } from "../utils/translations";
import { SavingsEntry } from "../types";

interface ChartsViewProps {
  entries: SavingsEntry[];
  currency: string;
  lang: 'en' | 'bn';
}

export default function ChartsView({ entries, currency, lang }: ChartsViewProps) {
  const t = translations[lang];

  const hasData = entries.length > 0;

  // 1. Savings Growth Line Chart (Sorted Chronologically)
  const growthData = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    let accumulated = 0;
    return sorted.map((entry) => {
      accumulated += entry.todaySavings;
      return {
        date: entry.date,
        Savings: accumulated
      };
    });
  }, [entries]);

  // 2. Monthly Savings Bar Chart
  const monthlyBarData = useMemo(() => {
    const monthlyGroups: Record<string, number> = {};
    
    entries.forEach((entry) => {
      const dateObj = new Date(entry.date);
      const mName = dateObj.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'short' });
      const year = dateObj.getFullYear().toString().substring(2);
      const key = `${mName} '${year}`;
      
      monthlyGroups[key] = (monthlyGroups[key] || 0) + entry.todaySavings;
    });

    return Object.entries(monthlyGroups).map(([month, value]) => ({
      Month: month,
      Amount: value
    }));
  }, [entries, lang]);

  // 3. Extra Money Sources Pie Chart
  const extraMoneyPieData = useMemo(() => {
    const sourceGroups: Record<string, number> = {};
    
    entries.forEach((entry) => {
      if (entry.extraMoney > 0) {
        // Translate source labels for the chart legend
        let label = entry.source;
        if (lang === 'bn') {
          const dict: Record<string, string> = {
            'Mother': 'মা',
            'Father': 'বাবা',
            'Eid': 'ঈদ',
            'Gift': 'উপহার',
            'Relative': 'আত্মীয়',
            'Friend': 'বন্ধু',
            'Other': 'অন্যান্য'
          };
          label = dict[entry.source] || entry.source;
        }
        sourceGroups[label] = (sourceGroups[label] || 0) + entry.extraMoney;
      }
    });

    return Object.entries(sourceGroups).map(([source, value]) => ({
      name: source,
      value: value
    }));
  }, [entries, lang]);

  // 4. Expense Pie Chart (Grouped by keywords in notes, fallback to source/general categories)
  const expensePieData = useMemo(() => {
    const categoryGroups: Record<string, number> = {};
    
    entries.forEach((entry) => {
      if (entry.expense > 0) {
        const noteText = entry.notes.toLowerCase();
        let cat = lang === 'bn' ? 'অন্যান্য খরচ' : 'General / Other';
        
        // Simple note keyword tagging
        if (noteText.includes('food') || noteText.includes('খাবার') || noteText.includes('রেস্টুরেন্ট')) {
          cat = lang === 'bn' ? 'খাবার' : 'Food & Dining';
        } else if (noteText.includes('travel') || noteText.includes('ভাড়া') || noteText.includes('রিকশা') || noteText.includes('গাড়ি')) {
          cat = lang === 'bn' ? 'যাতায়াত' : 'Travel / Commute';
        } else if (noteText.includes('gift') || noteText.includes('হাদিয়া') || noteText.includes('উপহার')) {
          cat = lang === 'bn' ? 'উপহার' : 'Gifts Given';
        } else if (noteText.includes('bill') || noteText.includes('কারেন্ট') || noteText.includes('মোবাইল')) {
          cat = lang === 'bn' ? 'বিল পরিশোধ' : 'Utilities & Bills';
        } else if (entry.notes) {
          // If no keyword match, capitalize first 15 chars of notes
          cat = entry.notes.substring(0, 15) + (entry.notes.length > 15 ? '...' : '');
        }
        
        categoryGroups[cat] = (categoryGroups[cat] || 0) + entry.expense;
      }
    });

    return Object.entries(categoryGroups).map(([cat, value]) => ({
      name: cat,
      value: value
    }));
  }, [entries, lang]);

  // Colors Palette for Pie Charts
  const COLORS = ["#059669", "#d97706", "#4f46e5", "#dc2626", "#2563eb", "#0891b2", "#7c3aed"];

  if (!hasData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400 dark:text-gray-500">
        <p className="text-base font-semibold">
          {lang === 'bn' ? 'বিশ্লেষণ দেখার জন্য অনুগ্রহ করে প্রথমে কিছু এন্ট্রি যোগ করুন!' : 'Add daily entry records first to generate data visualizations!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Savings Growth Line Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm"
        >
          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-mono mb-6">
            {t.savingsGrowth} ({currency})
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value), currency, lang), t.currentSavings]}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Savings" 
                  stroke="#d97706" 
                  strokeWidth={3} 
                  dot={{ r: 4, stroke: '#d97706', strokeWidth: 2, fill: '#fff' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 2. Monthly Savings Bar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm"
        >
          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-mono mb-6">
            {t.monthlySavings} ({currency})
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                <XAxis dataKey="Month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value), currency, lang), t.todaySavings]}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="Amount" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 3. Expense Breakdown Pie Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm"
        >
          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-mono mb-4">
            {t.expenseBreakdown} ({currency})
          </h4>
          <div className="h-72 flex flex-col sm:flex-row items-center justify-between">
            {expensePieData.length === 0 ? (
              <div className="w-full flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">
                {lang === 'bn' ? 'কোন খরচের বিবরণ নেই' : 'No expenses recorded to map.'}
              </div>
            ) : (
              <>
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value), currency, lang)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col gap-2 pl-4 max-h-64 overflow-y-auto">
                  {expensePieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[130px]">{entry.name}</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white font-mono ml-auto">
                        {formatCurrency(entry.value, currency, lang)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* 4. Extra Money Sources Pie Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm"
        >
          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-mono mb-4">
            {lang === 'bn' ? 'অতিরিক্ত অর্থের অবদানের উৎসসমূহ' : 'Extra Money Contribution Sources'}
          </h4>
          <div className="h-72 flex flex-col sm:flex-row items-center justify-between">
            {extraMoneyPieData.length === 0 ? (
              <div className="w-full flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">
                {lang === 'bn' ? 'কোন অতিরিক্ত অর্থ উপহার নেই' : 'No extra gifts received to map.'}
              </div>
            ) : (
              <>
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={extraMoneyPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {extraMoneyPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value), currency, lang)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col gap-2 pl-4 max-h-64 overflow-y-auto">
                  {extraMoneyPieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[130px]">{entry.name}</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white font-mono ml-auto">
                        {formatCurrency(entry.value, currency, lang)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
