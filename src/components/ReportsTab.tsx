import React, { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Trash2, 
  Calendar, 
  Coins, 
  Wallet, 
  ChevronRight, 
  ChevronLeft,
  FileSpreadsheet,
  Pencil,
  X,
  Plus,
  DollarSign
} from "lucide-react";
import { formatCurrency, formatNumber, downloadCSV, getDayName } from "../utils/helpers";
import { translations } from "../utils/translations";
import { SavingsEntry } from "../types";

interface ReportsTabProps {
  entries: SavingsEntry[];
  currency: string;
  lang: 'en' | 'bn';
  onDeleteEntry: (id: string) => Promise<void>;
  onEditEntry: (id: string, updatedData: {
    date: string;
    day: string;
    dailyMoney: number;
    extraMoney: number;
    source: string;
    expense: number;
    notes: string;
  }) => Promise<void>;
  onTriggerPrintReport?: (data: { title: string; headers: string[]; rows: string[][] }) => void;
}

export default function ReportsTab({
  entries,
  currency,
  lang,
  onDeleteEntry,
  onEditEntry,
  onTriggerPrintReport
}: ReportsTabProps) {
  const t = translations[lang];

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeReportTab, setActiveReportTab] = useState<'all' | 'monthly' | 'yearly'>('all');

  // Editing state
  const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editDailyMoney, setEditDailyMoney] = useState<number | "">("");
  const [editExtraMoney, setEditExtraMoney] = useState<number | "">("");
  const [editSource, setEditSource] = useState("Other");
  const [editExpense, setEditExpense] = useState<number | "">("");
  const [editNotes, setEditNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Auto update day of week in modal on date change
  useEffect(() => {
    if (editDate) {
      setEditDay(getDayName(editDate, lang));
    }
  }, [editDate, lang]);

  // Sync state when editingEntry is chosen
  useEffect(() => {
    if (editingEntry) {
      setEditDate(editingEntry.date);
      setEditDay(editingEntry.day);
      setEditDailyMoney(editingEntry.dailyMoney);
      setEditExtraMoney(editingEntry.extraMoney);
      setEditSource(editingEntry.source || "Other");
      setEditExpense(editingEntry.expense);
      setEditNotes(editingEntry.notes || "");
    }
  }, [editingEntry]);

  // Helper to check if a date is within this week
  const isThisWeek = (dateStr: string) => {
    const entryDate = new Date(dateStr);
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    firstDayOfWeek.setHours(0, 0, 0, 0);
    return entryDate >= firstDayOfWeek;
  };

  // Helper to check if a date is within this month
  const isThisMonth = (dateStr: string) => {
    const entryDate = new Date(dateStr);
    const today = new Date();
    return entryDate.getMonth() === today.getMonth() && entryDate.getFullYear() === today.getFullYear();
  };

  // 1. Filtered & Searched Entries
  const processedEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search term filter
      const matchesSearch = 
        entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.day.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.date.includes(searchTerm) ||
        entry.todaySavings.toString().includes(searchTerm) ||
        entry.expense.toString().includes(searchTerm);

      // Date range filter
      let matchesDate = true;
      const todayStr = new Date().toISOString().split('T')[0];

      if (dateFilter === 'today') {
        matchesDate = entry.date === todayStr;
      } else if (dateFilter === 'week') {
        matchesDate = isThisWeek(entry.date);
      } else if (dateFilter === 'month') {
        matchesDate = isThisMonth(entry.date);
      } else if (dateFilter === 'custom') {
        const entryDate = new Date(entry.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && end) {
          matchesDate = entryDate >= start && entryDate <= end;
        } else if (start) {
          matchesDate = entryDate >= start;
        } else if (end) {
          matchesDate = entryDate <= end;
        }
      }

      return matchesSearch && matchesDate;
    }).sort((a, b) => b.date.localeCompare(a.date)); // Sort descending by date
  }, [entries, searchTerm, dateFilter, startDate, endDate]);

  // 2. Group by Month Report
  const monthlyReports = useMemo(() => {
    const groups: Record<string, {
      monthKey: string;
      totalIncome: number;
      totalExpenses: number;
      totalSaved: number;
      extraMoney: number;
      count: number;
    }> = {};

    entries.forEach((entry) => {
      const dateObj = new Date(entry.date);
      const year = dateObj.getFullYear();
      const monthIndex = dateObj.getMonth();
      const monthName = dateObj.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'long' });
      const key = `${monthName} ${year}`;

      if (!groups[key]) {
        groups[key] = {
          monthKey: key,
          totalIncome: 0,
          totalExpenses: 0,
          totalSaved: 0,
          extraMoney: 0,
          count: 0
        };
      }

      const income = entry.dailyMoney + entry.extraMoney;
      groups[key].totalIncome += income;
      groups[key].totalExpenses += entry.expense;
      groups[key].totalSaved += entry.todaySavings;
      groups[key].extraMoney += entry.extraMoney;
      groups[key].count += 1;
    });

    return Object.values(groups);
  }, [entries, lang]);

  // 3. Group by Year Report
  const yearlyReports = useMemo(() => {
    const groups: Record<string, {
      yearKey: string;
      totalIncome: number;
      totalExpenses: number;
      totalSaved: number;
      extraMoney: number;
      count: number;
    }> = {};

    entries.forEach((entry) => {
      const dateObj = new Date(entry.date);
      const year = dateObj.getFullYear().toString();

      if (!groups[year]) {
        groups[year] = {
          yearKey: year,
          totalIncome: 0,
          totalExpenses: 0,
          totalSaved: 0,
          extraMoney: 0,
          count: 0
        };
      }

      const income = entry.dailyMoney + entry.extraMoney;
      groups[year].totalIncome += income;
      groups[year].totalExpenses += entry.expense;
      groups[year].totalSaved += entry.todaySavings;
      groups[year].extraMoney += entry.extraMoney;
      groups[year].count += 1;
    });

    return Object.values(groups);
  }, [entries]);

  // Export handlers
  const handleExportCSV = () => {
    if (activeReportTab === 'all') {
      const headers = ["Date", "Day", "Daily Money", "Extra Money", "Source", "Expense", "Savings", "Notes"];
      const rows = processedEntries.map(e => [
        e.date, e.day, e.dailyMoney, e.extraMoney, e.source, e.expense, e.todaySavings, e.notes
      ]);
      downloadCSV("umrah_savings_entries.csv", [headers, ...rows]);
    } else if (activeReportTab === 'monthly') {
      const headers = ["Month", "Total Income", "Total Expenses", "Total Saved", "Extra Money", "Average Saved"];
      const rows = monthlyReports.map(m => [
        m.monthKey, m.totalIncome, m.totalExpenses, m.totalSaved, m.extraMoney, m.totalSaved / m.count
      ]);
      downloadCSV("umrah_monthly_report.csv", [headers, ...rows]);
    } else {
      const headers = ["Year", "Total Income", "Total Expenses", "Total Saved", "Extra Money", "Average Saved"];
      const rows = yearlyReports.map(y => [
        y.yearKey, y.totalIncome, y.totalExpenses, y.totalSaved, y.extraMoney, y.totalSaved / y.count
      ]);
      downloadCSV("umrah_yearly_report.csv", [headers, ...rows]);
    }
  };

  const handlePrint = () => {
    if (onTriggerPrintReport) {
      if (activeReportTab === 'all') {
        const headers = [t.date, t.day, t.dailyMoneyReceived, t.extraMoneyAmount, t.source, t.expenseAmount, t.todaySavings, t.notes];
        const rows = processedEntries.map(e => [
          e.date, e.day, formatCurrency(e.dailyMoney, currency, lang), formatCurrency(e.extraMoney, currency, lang), e.source, formatCurrency(e.expense, currency, lang), formatCurrency(e.todaySavings, currency, lang), e.notes
        ]);
        onTriggerPrintReport({
          title: lang === 'bn' ? "ওমরাহ সঞ্চয় এন্ট্রি তালিকা" : "Umrah Savings Entries",
          headers,
          rows
        });
      } else if (activeReportTab === 'monthly') {
        const headers = [lang === 'bn' ? "মাস" : "Month", t.totalIncome, t.totalExpenses, t.totalSaved, t.totalExtraMoney, t.avgSaving];
        const rows = monthlyReports.map(m => [
          m.monthKey, formatCurrency(m.totalIncome, currency, lang), formatCurrency(m.totalExpenses, currency, lang), formatCurrency(m.totalSaved, currency, lang), formatCurrency(m.extraMoney, currency, lang), formatCurrency(m.totalSaved / m.count, currency, lang)
        ]);
        onTriggerPrintReport({
          title: t.monthlyReport,
          headers,
          rows
        });
      } else {
        const headers = [lang === 'bn' ? "বছর" : "Year", t.totalIncome, t.totalExpenses, t.totalSaved, t.totalExtraMoney, t.avgSaving];
        const rows = yearlyReports.map(y => [
          y.yearKey, formatCurrency(y.totalIncome, currency, lang), formatCurrency(y.totalExpenses, currency, lang), formatCurrency(y.totalSaved, currency, lang), formatCurrency(y.extraMoney, currency, lang), formatCurrency(y.totalSaved / y.count, currency, lang)
        ]);
        onTriggerPrintReport({
          title: t.yearlyReport,
          headers,
          rows
        });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Controller Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        {/* Toggle Report Tabs */}
        <div className="flex items-center space-x-1 bg-gray-50 dark:bg-slate-950 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveReportTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeReportTab === 'all'
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {lang === 'bn' ? 'সকল এন্ট্রি' : 'All Entries'}
          </button>
          <button
            onClick={() => setActiveReportTab('monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeReportTab === 'monthly'
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {t.monthlyReport}
          </button>
          <button
            onClick={() => setActiveReportTab('yearly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeReportTab === 'yearly'
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {t.yearlyReport}
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'এক্সেল / CSV' : 'CSV'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/15 border border-emerald-600/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'পিডিএফ প্রিন্ট' : 'PDF / Print'}
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS PANEL (Only visible on "All Entries" tab) */}
      {activeReportTab === 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800/80 pb-3">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono">
              {t.searchAndFilter}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="absolute inset-y-0 left-3 h-full w-4 text-gray-400 flex items-center pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Filter Selection */}
            <div className="md:col-span-4">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all" className="dark:bg-slate-950">{t.all}</option>
                <option value="today" className="dark:bg-slate-950">{t.today}</option>
                <option value="week" className="dark:bg-slate-950">{t.thisWeek}</option>
                <option value="month" className="dark:bg-slate-950">{t.thisMonth}</option>
                <option value="custom" className="dark:bg-slate-950">{t.custom}</option>
              </select>
            </div>
          </div>

          {/* Custom Date Inputs */}
          {dateFilter === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2"
            >
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-1">
                  {lang === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-1">
                  {lang === 'bn' ? 'শেষের তারিখ' : 'End Date'}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-xs text-gray-900 dark:text-white"
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* REPORTS VIEWS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {/* VIEW 1: ALL ENTRIES HISTORICAL TABLE */}
        {activeReportTab === 'all' && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {processedEntries.length === 0 ? (
              <div className="p-12 text-center text-gray-400 dark:text-gray-500">
                <p className="text-sm font-medium">{t.noEntries}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-widest font-mono border-b border-slate-100 dark:border-slate-800">
                      <th className="py-4 px-6">{t.date}</th>
                      <th className="py-4 px-6">{t.day}</th>
                      <th className="py-4 px-6 text-right">{t.dailyMoneyReceived}</th>
                      <th className="py-4 px-6 text-right">{t.extraMoneyAmount}</th>
                      <th className="py-4 px-6">{t.source}</th>
                      <th className="py-4 px-6 text-right">{t.expenseAmount}</th>
                      <th className="py-4 px-6 text-right">{t.todaySavings}</th>
                      <th className="py-4 px-6">{t.notes}</th>
                      <th className="py-4 px-6 text-center">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-gray-700 dark:text-gray-300">
                    {processedEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 font-semibold whitespace-nowrap">{entry.date}</td>
                        <td className="py-4 px-6 text-xs font-medium text-gray-400 dark:text-gray-500">{entry.day}</td>
                        <td className="py-4 px-6 text-right font-mono">{formatCurrency(entry.dailyMoney, currency, lang)}</td>
                        <td className="py-4 px-6 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {entry.extraMoney > 0 ? formatCurrency(entry.extraMoney, currency, lang) : "—"}
                        </td>
                        <td className="py-4 px-6">
                          {entry.extraMoney > 0 ? (
                            <span className="inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {entry.source}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-rose-600 dark:text-rose-400">
                          {entry.expense > 0 ? formatCurrency(entry.expense, currency, lang) : "—"}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(entry.todaySavings, currency, lang)}
                        </td>
                        <td className="py-4 px-6 max-w-[200px] truncate text-xs text-gray-400 dark:text-gray-500" title={entry.notes}>
                          {entry.notes || "—"}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingEntry(entry)}
                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors inline-flex"
                              title={t.edit || "Edit"}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(lang === 'bn' ? "আপনি কি নিশ্চিতভাবে এই এন্ট্রিটি মুছতে চান?" : "Are you sure you want to delete this entry?")) {
                                  onDeleteEntry(entry.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors inline-flex"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: GROUPED MONTHLY REPORT */}
        {activeReportTab === 'monthly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-widest font-mono border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6">{lang === 'bn' ? "মাস" : "Month"}</th>
                  <th className="py-4 px-6 text-right">{t.totalIncome}</th>
                  <th className="py-4 px-6 text-right">{t.totalExpenses}</th>
                  <th className="py-4 px-6 text-right">{t.totalSaved}</th>
                  <th className="py-4 px-6 text-right">{t.totalExtraMoney}</th>
                  <th className="py-4 px-6 text-right">{t.avgSaving}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-gray-700 dark:text-gray-300">
                {monthlyReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400 dark:text-gray-500">
                      {lang === 'bn' ? "কোন মাসিক ডাটা পাওয়া যায়নি" : "No monthly data available."}
                    </td>
                  </tr>
                ) : (
                  monthlyReports.map((report) => (
                    <tr key={report.monthKey} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-semibold whitespace-nowrap flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        {report.monthKey}
                      </td>
                      <td className="py-4 px-6 text-right font-mono">{formatCurrency(report.totalIncome, currency, lang)}</td>
                      <td className="py-4 px-6 text-right font-mono text-rose-600 dark:text-rose-400">
                        {formatCurrency(report.totalExpenses, currency, lang)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(report.totalSaved, currency, lang)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(report.extraMoney, currency, lang)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium text-amber-600 dark:text-amber-400">
                        {formatCurrency(report.totalSaved / report.count, currency, lang)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 3: YEARLY REPORT SUMMARY */}
        {activeReportTab === 'yearly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-widest font-mono border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6">{lang === 'bn' ? "বছর" : "Year"}</th>
                  <th className="py-4 px-6 text-right">{t.totalIncome}</th>
                  <th className="py-4 px-6 text-right">{t.totalExpenses}</th>
                  <th className="py-4 px-6 text-right">{t.totalSaved}</th>
                  <th className="py-4 px-6 text-right">{t.totalExtraMoney}</th>
                  <th className="py-4 px-6 text-right">{t.avgSaving}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-gray-700 dark:text-gray-300">
                {yearlyReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400 dark:text-gray-500">
                      {lang === 'bn' ? "কোন বার্ষিক ডাটা পাওয়া যায়নি" : "No yearly data available."}
                    </td>
                  </tr>
                ) : (
                  yearlyReports.map((report) => (
                    <tr key={report.yearKey} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-semibold whitespace-nowrap flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        {formatNumber(Number(report.yearKey), lang)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono">{formatCurrency(report.totalIncome, currency, lang)}</td>
                      <td className="py-4 px-6 text-right font-mono text-rose-600 dark:text-rose-400">
                        {formatCurrency(report.totalExpenses, currency, lang)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(report.totalSaved, currency, lang)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(report.extraMoney, currency, lang)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium text-amber-600 dark:text-amber-400">
                        {formatCurrency(report.totalSaved / report.count, currency, lang)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT ENTRY MODAL */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl w-full max-w-xl overflow-hidden relative text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white">
              <div className="flex items-center gap-2.5">
                <Pencil className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold font-sans">
                  {t.editEntry || "Edit Entry"}
                </h3>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsUpdating(true);
                try {
                  await onEditEntry(editingEntry.id, {
                    date: editDate,
                    day: editDay,
                    dailyMoney: Number(editDailyMoney) || 0,
                    extraMoney: Number(editExtraMoney) || 0,
                    source: editSource,
                    expense: Number(editExpense) || 0,
                    notes: editNotes.trim()
                  });
                  setEditingEntry(null);
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsUpdating(false);
                }
              }}
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              {/* Date & Day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-1.5">
                    {t.date}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute inset-y-0 left-3 h-full w-4 text-emerald-500 flex items-center pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-1.5">
                    {t.day}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editDay}
                    className="block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-sm text-gray-500 font-medium"
                  />
                </div>
              </div>

              {/* Daily Money & Extra Money */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-1.5">
                    {t.dailyMoneyReceived} ({currency})
                  </label>
                  <div className="relative">
                    <Coins className="absolute inset-y-0 left-3 h-full w-4 text-emerald-500 flex items-center pointer-events-none" />
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editDailyMoney}
                      onChange={(e) => setEditDailyMoney(e.target.value === "" ? "" : Number(e.target.value))}
                      className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-1.5">
                    {t.extraMoneyAmount} ({currency})
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute inset-y-0 left-3 h-full w-4 text-emerald-500 flex items-center pointer-events-none" />
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editExtraMoney}
                      onChange={(e) => setEditExtraMoney(e.target.value === "" ? "" : Number(e.target.value))}
                      className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Extra Money Source */}
              {Number(editExtraMoney) > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono">
                    {t.source}
                  </label>
                  <select
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Mother" className="dark:bg-slate-950">{t.mother}</option>
                    <option value="Father" className="dark:bg-slate-950">{t.father}</option>
                    <option value="Eid" className="dark:bg-slate-950">{t.eid}</option>
                    <option value="Gift" className="dark:bg-slate-950">{t.gift}</option>
                    <option value="Relative" className="dark:bg-slate-950">{t.relative}</option>
                    <option value="Friend" className="dark:bg-slate-950">{t.friend}</option>
                    <option value="Other" className="dark:bg-slate-950">{t.other}</option>
                  </select>
                </div>
              )}

              {/* Expense */}
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-1.5">
                  {t.expenseAmount} ({currency})
                </label>
                <div className="relative">
                  <Wallet className="absolute inset-y-0 left-3 h-full w-4 text-rose-500 flex items-center pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editExpense}
                    onChange={(e) => setEditExpense(e.target.value === "" ? "" : Number(e.target.value))}
                    className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-1.5">
                  {t.notes}
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Live Savings calculation */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  {lang === 'bn' ? 'সংশোধিত মোট সঞ্চয়:' : "Updated Net Savings:"}
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency((Number(editDailyMoney) || 0) + (Number(editExtraMoney) || 0) - (Number(editExpense) || 0), currency, lang)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? (t.saving || "Saving...") : (t.update || "Update")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
