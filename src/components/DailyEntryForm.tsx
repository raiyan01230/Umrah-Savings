import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, Coins, DollarSign, Wallet, FileText, ChevronRight, Calculator } from "lucide-react";
import { getDayName, formatCurrency } from "../utils/helpers";
import { translations } from "../utils/translations";

interface DailyEntryFormProps {
  onSave: (entry: {
    date: string;
    day: string;
    dailyMoney: number;
    extraMoney: number;
    source: string;
    expense: number;
    notes: string;
  }) => Promise<void>;
  currency: string;
  lang: 'en' | 'bn';
}

export default function DailyEntryForm({ onSave, currency, lang }: DailyEntryFormProps) {
  const t = translations[lang];

  // Set today's date as default in YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getTodayDateString());
  const [day, setDay] = useState("");
  const [dailyMoney, setDailyMoney] = useState<number | "">("");
  const [extraMoney, setExtraMoney] = useState<number | "">("");
  const [source, setSource] = useState("Other");
  const [expense, setExpense] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Automatically update the week day name when the date changes
  useEffect(() => {
    if (date) {
      const calculatedDay = getDayName(date, lang);
      setDay(calculatedDay);
    } else {
      setDay("");
    }
  }, [date, lang]);

  const sourceOptions = [
    { value: "Mother", label: t.mother },
    { value: "Father", label: t.father },
    { value: "Eid", label: t.eid },
    { value: "Gift", label: t.gift },
    { value: "Relative", label: t.relative },
    { value: "Friend", label: t.friend },
    { value: "Other", label: t.other },
  ];

  // Live total calculation for visual help
  const dMoney = Number(dailyMoney) || 0;
  const eMoney = Number(extraMoney) || 0;
  const exp = Number(expense) || 0;
  const todaySavings = dMoney + eMoney - exp;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !day) return;

    setSaving(true);
    try {
      await onSave({
        date,
        day,
        dailyMoney: Number(dailyMoney) || 0,
        extraMoney: Number(extraMoney) || 0,
        source,
        expense: Number(expense) || 0,
        notes: notes.trim(),
      });

      // Reset fields but keep the date as today's default
      setDailyMoney("");
      setExtraMoney("");
      setSource("Other");
      setExpense("");
      setNotes("");
    } catch (err) {
      console.error("Failed to save entry: ", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-md p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
          <div className="p-2.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-sans">
              {t.dailyEntryForm}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              {lang === 'bn' ? 'ওমরাহ ফান্ডে আপনার আজকের এন্ট্রি যোগ করুন' : 'Add your daily financial records for Umrah'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date & Auto Day row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-2">
                {t.date}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-2">
                {t.day} ({lang === 'bn' ? 'স্বয়ংক্রিয়' : 'Automatic'})
              </label>
              <input
                type="text"
                disabled
                value={day}
                className="block w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-sm text-gray-500 font-medium"
              />
            </div>
          </div>

          {/* Daily Money & Extra Money row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-2">
                {t.dailyMoneyReceived} ({currency})
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                  <Coins className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={dailyMoney}
                  onChange={(e) => setDailyMoney(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0.00"
                  className="block w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-2">
                {t.extraMoneyAmount} ({currency})
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={extraMoney}
                  onChange={(e) => setExtraMoney(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0.00"
                  className="block w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Extra Money Source Selector */}
          {eMoney > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-1">
                {t.source} ({lang === 'bn' ? 'অতিরিক্ত অর্থের উৎস' : 'Source of Extra Money'})
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="block w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {sourceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="dark:bg-slate-950">
                    {opt.label}
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          {/* Expense field */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-2">
              {t.expenseAmount} ({currency})
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-500">
                <Wallet className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="0"
                step="any"
                value={expense}
                onChange={(e) => setExpense(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0.00"
                className="block w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-2">
              {t.notes}
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none text-emerald-500">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={lang === 'bn' ? "যেমন: বাবার পক্ষ থেকে হাদিয়া, মায়ের দেয়া হাত খরচ ইত্যাদি..." : "e.g. Gift from father, regular allowance, daily pocket money..."}
                className="block w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* live Total Calculation Indicator box */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              {lang === 'bn' ? 'আজকের মোট সঞ্চয়:' : "Today's Net Savings:"}
            </span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(todaySavings, currency, lang)}
            </span>
          </div>

          {/* Save Button */}
          <div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? t.saving : (
                <>
                  {t.saveEntry}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
