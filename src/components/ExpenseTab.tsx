import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Wallet, Calendar, Search, Filter, TrendingDown } from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/helpers";
import { translations } from "../utils/translations";
import { SavingsEntry } from "../types";

interface ExpenseTabProps {
  entries: SavingsEntry[];
  currency: string;
  lang: 'en' | 'bn';
}

export default function ExpenseTab({ entries, currency, lang }: ExpenseTabProps) {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState("");
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Helper filters
  const isThisWeek = (dateStr: string) => {
    const entryDate = new Date(dateStr);
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    firstDayOfWeek.setHours(0, 0, 0, 0);
    return entryDate >= firstDayOfWeek;
  };

  const isThisMonth = (dateStr: string) => {
    const entryDate = new Date(dateStr);
    const today = new Date();
    return entryDate.getMonth() === today.getMonth() && entryDate.getFullYear() === today.getFullYear();
  };

  const expenseEntries = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return entries
      .filter((entry) => entry.expense > 0)
      .filter((entry) => {
        // Search filter
        const matchesSearch = 
          entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.date.includes(searchTerm) ||
          entry.day.toLowerCase().includes(searchTerm.toLowerCase());

        // Select range filter
        let matchesRange = true;
        if (expenseFilter === 'today') {
          matchesRange = entry.date === todayStr;
        } else if (expenseFilter === 'week') {
          matchesRange = isThisWeek(entry.date);
        } else if (expenseFilter === 'month') {
          matchesRange = isThisMonth(entry.date);
        }

        return matchesSearch && matchesRange;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, searchTerm, expenseFilter]);

  // Total aggregate
  const totalExpenseSum = useMemo(() => {
    return expenseEntries.reduce((sum, entry) => sum + entry.expense, 0);
  }, [expenseEntries]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header and overview metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Expense Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-rose-900 to-rose-950 text-white p-6 rounded-3xl border border-rose-800 shadow-lg md:col-span-1"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-white/10 rounded-xl text-rose-300">
              <Wallet className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-500/30">
              {lang === 'bn' ? 'ব্যয় নজরদারি' : 'Expenses Outflow'}
            </span>
          </div>
          <div className="mt-5">
            <p className="text-xs text-rose-200 uppercase font-bold tracking-wider font-mono">
              {t.totalExpenses}
            </p>
            <h3 className="text-3xl font-extrabold mt-1 font-sans">
              {formatCurrency(totalExpenseSum, currency, lang)}
            </h3>
            <p className="text-[11px] text-rose-300 mt-2">
              {lang === 'bn' 
                ? `মোট ${formatNumber(expenseEntries.length, lang)}টি খরচের এন্ট্রি রেকর্ড করা হয়েছে` 
                : `Aggregated across ${formatNumber(expenseEntries.length, lang)} expense entries`}
            </p>
          </div>
        </motion.div>

        {/* Informative summary banner */}
        <div className="md:col-span-2 flex flex-col justify-between gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center justify-between h-full">
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-sans">
                {t.expenseReport}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed font-sans">
                {lang === 'bn' 
                  ? "ওমরাহযাত্রার সঞ্চয়কে মসৃণ ও নিরবচ্ছিন্ন রাখার জন্য অপ্রয়োজনীয় খরচ নিয়ন্ত্রণ করা অপরিহার্য। প্রতিটি ব্যয়ের খতিয়ান রেখে মিতব্যয়ী হোন।" 
                  : "Tracking and containing unnecessary expenses directly enhances your daily net savings, accelerating your path to the holy land of Makkah."}
              </p>
            </div>
            <div className="hidden sm:block p-4 bg-rose-500/10 rounded-2xl text-rose-500 border border-rose-500/20">
              <TrendingDown className="w-8 h-8 animate-bounce" />
            </div>
          </div>
        </div>
      </div>

      {/* Control panel (Search & Filter selection) */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
        <div className="relative flex-grow">
          <Search className="absolute inset-y-0 left-3 h-full w-4 text-gray-400 flex items-center pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'bn' ? "ব্যয়ের বিবরণ বা নোট দিয়ে খুঁজুন..." : "Search expenses..."}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-1 bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-100 dark:border-slate-800">
          <button
            onClick={() => setExpenseFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              expenseFilter === 'all'
                ? "bg-rose-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-950 dark:hover:text-white"
            }`}
          >
            {t.all}
          </button>
          <button
            onClick={() => setExpenseFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              expenseFilter === 'today'
                ? "bg-rose-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-950 dark:hover:text-white"
            }`}
          >
            {t.today}
          </button>
          <button
            onClick={() => setExpenseFilter('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              expenseFilter === 'week'
                ? "bg-rose-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-950 dark:hover:text-white"
            }`}
          >
            {t.thisWeek}
          </button>
          <button
            onClick={() => setExpenseFilter('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              expenseFilter === 'month'
                ? "bg-rose-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-950 dark:hover:text-white"
            }`}
          >
            {t.thisMonth}
          </button>
        </div>
      </div>

      {/* Table block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {expenseEntries.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-gray-500">
            <p className="text-sm font-medium">{t.noExpenses}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-widest font-mono border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6">{t.date}</th>
                  <th className="py-4 px-6">{t.day}</th>
                  <th className="py-4 px-6 text-right">{t.expenseAmount}</th>
                  <th className="py-4 px-6">{t.notes} (Spent on)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-gray-700 dark:text-gray-300">
                {expenseEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-semibold whitespace-nowrap flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-rose-500" />
                      {entry.date}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-400 dark:text-gray-500">{entry.day}</td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(entry.expense, currency, lang)}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-400 dark:text-gray-500 max-w-[400px] truncate">
                      {entry.notes || (lang === 'bn' ? 'কোন তথ্য নেই' : 'Regular expense')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
