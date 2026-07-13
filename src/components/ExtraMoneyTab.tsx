import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Gift, Calendar, Search, ArrowUpRight, DollarSign } from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/helpers";
import { translations } from "../utils/translations";
import { SavingsEntry } from "../types";

interface ExtraMoneyTabProps {
  entries: SavingsEntry[];
  currency: string;
  lang: 'en' | 'bn';
}

export default function ExtraMoneyTab({ entries, currency, lang }: ExtraMoneyTabProps) {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState("");

  // Filter entries to only show ones with extraMoney
  const extraMoneyEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.extraMoney > 0)
      .filter((entry) => {
        return (
          entry.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.date.includes(searchTerm)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, searchTerm]);

  // Aggregate sum of extra money
  const totalExtraSum = useMemo(() => {
    return extraMoneyEntries.reduce((sum, entry) => sum + entry.extraMoney, 0);
  }, [extraMoneyEntries]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header and overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Box Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-6 rounded-3xl border border-indigo-800 shadow-lg md:col-span-1"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-white/10 rounded-xl text-indigo-300">
              <Gift className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/30">
              {lang === 'bn' ? 'মোট উপহার' : 'Total Gifts'}
            </span>
          </div>
          <div className="mt-5">
            <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider font-mono">
              {t.totalExtraMoney}
            </p>
            <h3 className="text-3xl font-extrabold mt-1 font-sans">
              {formatCurrency(totalExtraSum, currency, lang)}
            </h3>
            <p className="text-[11px] text-indigo-300 mt-2">
              {lang === 'bn' 
                ? `মোট ${formatNumber(extraMoneyEntries.length, lang)}টি উৎস থেকে সংগৃহীত অতিরিক্ত অর্থ` 
                : `Accumulated from ${formatNumber(extraMoneyEntries.length, lang)} extra contribution sources`}
            </p>
          </div>
        </motion.div>

        {/* Search bar and info card */}
        <div className="md:col-span-2 flex flex-col justify-between gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center justify-between h-full">
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t.extraMoneyReport}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                {lang === 'bn' 
                  ? "মা, বাবা, ঈদ, আত্মীয়, প্রিয়জন এবং উপহার থেকে পাওয়া অর্থ আপনার ওমরাহ লক্ষ্যপূরণকে সহজ এবং দ্রুততর করে তুলছে।" 
                  : "Contributions from generous sponsors, family gifts, or Eid bonuses boost your savings goal significantly."}
              </p>
            </div>
            <div className="hidden sm:block p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20">
              <ArrowUpRight className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Input bar */}
      <div className="relative max-w-md">
        <Search className="absolute inset-y-0 left-3 h-full w-4 text-gray-400 flex items-center pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={lang === 'bn' ? "উৎস অথবা বিবরণ দিয়ে খুঁজুন..." : "Search by sponsor, notes..."}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Reports Table / Card Deck */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {extraMoneyEntries.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-gray-500">
            <p className="text-sm font-medium">{t.noExtraMoney}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-widest font-mono border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6">{t.date}</th>
                  <th className="py-4 px-6">{t.day}</th>
                  <th className="py-4 px-6">{t.source}</th>
                  <th className="py-4 px-6 text-right">{t.extraMoneyAmount}</th>
                  <th className="py-4 px-6">{t.notes} (Reason / Context)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-gray-700 dark:text-gray-300">
                {extraMoneyEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-semibold whitespace-nowrap flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {entry.date}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-400 dark:text-gray-500">{entry.day}</td>
                    <td className="py-4 px-6 font-medium text-slate-800 dark:text-slate-200">
                      <span className="inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {entry.source}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(entry.extraMoney, currency, lang)}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-400 dark:text-gray-500 max-w-[300px] truncate">
                      {entry.notes || (lang === 'bn' ? 'কোন নোট নেই' : 'No details provided')}
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
