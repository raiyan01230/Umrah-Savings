import React from "react";
import { motion } from "motion/react";
import { 
  Compass, 
  Target, 
  Coins, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Hourglass, 
  Gift, 
  Heart,
  ChevronRight,
  ChevronLeft,
  Shuffle,
  Printer
} from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/helpers";
import { translations } from "../utils/translations";
import { DashboardStats, SavingsEntry } from "../types";
import { defaultIslamicQuotes, IslamicQuote } from "../data/quotesData";

interface DashboardOverviewProps {
  stats: DashboardStats;
  entries: SavingsEntry[];
  currency: string;
  lang: 'en' | 'bn';
  setTab: (tab: string) => void;
  userName?: string;
  quotes?: IslamicQuote[];
}

export default function DashboardOverview({
  stats,
  entries,
  currency,
  lang,
  setTab,
  userName,
  quotes
}: DashboardOverviewProps) {
  const t = translations[lang];

  // Beautiful circular progress parameters
  const radius = 50;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(stats.progressPercentage, 100) / 100) * circumference;

  const handlePrintCertificate = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const title = lang === 'bn' ? "ওমরাহ সঞ্চয় মাইলফলক সনদ" : "Umrah Savings Progress Certificate";
    const name = userName || (lang === 'bn' ? "ওমরাহ যাত্রী" : "Umrah Pilgrim");
    const progressText = lang === 'bn' 
      ? `ওমরাহ সঞ্চয় লক্ষ্যের ${formatNumber(Math.round(stats.progressPercentage), 'bn')}% অর্জন করার সফল স্মারক`
      : `In recognition of successfully achieving ${Math.round(stats.progressPercentage)}% of the Umrah savings goal!`;

    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Amiri&family=Inter:wght@400;600;700&display=swap');
            body {
              background-color: #fcfbf7;
              color: #1c2c22;
              font-family: 'Inter', sans-serif;
              padding: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
            }
            .certificate-container {
              border: 15px double #c5a85c;
              padding: 50px 70px;
              max-width: 800px;
              width: 100%;
              background: white;
              box-shadow: 0 4px 30px rgba(0,0,0,0.03);
              text-align: center;
              position: relative;
              background-image: radial-gradient(circle, #fbfaf5 1px, transparent 1px);
              background-size: 20px 20px;
            }
            .gold-corner {
              position: absolute;
              width: 50px;
              height: 50px;
              border: 3px solid #c5a85c;
            }
            .top-left { top: 15px; left: 15px; border-right: none; border-bottom: none; }
            .top-right { top: 15px; right: 15px; border-left: none; border-bottom: none; }
            .bottom-left { bottom: 15px; left: 15px; border-right: none; border-top: none; }
            .bottom-right { bottom: 15px; right: 15px; border-left: none; border-top: none; }
            
            .header-bismillah {
              font-family: 'Amiri', serif;
              font-size: 24px;
              color: #064e3b;
              margin-bottom: 20px;
              letter-spacing: 1px;
            }
            .cert-title {
              font-family: 'Cinzel', serif;
              font-size: 28px;
              font-weight: 700;
              color: #064e3b;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 10px;
            }
            .cert-subtitle {
              font-size: 13px;
              color: #c5a85c;
              text-transform: uppercase;
              letter-spacing: 3px;
              font-weight: 700;
              margin-bottom: 40px;
            }
            .presented-to {
              font-size: 14px;
              font-style: italic;
              color: #666;
              margin-bottom: 15px;
            }
            .recipient-name {
              font-family: 'Cinzel', serif;
              font-size: 32px;
              font-weight: 700;
              color: #064e3b;
              border-bottom: 2px solid #e5e7eb;
              display: inline-block;
              padding-bottom: 8px;
              margin-bottom: 30px;
              min-width: 300px;
            }
            .description {
              font-size: 16px;
              line-height: 1.6;
              color: #374151;
              margin-bottom: 40px;
              max-width: 600px;
              margin-left: auto;
              margin-right: auto;
            }
            .stats-grid {
              display: grid;
              grid-template-cols: repeat(3, 1fr);
              gap: 20px;
              max-width: 500px;
              margin: 0 auto 40px auto;
              border-top: 1px solid #f3f4f6;
              border-bottom: 1px solid #f3f4f6;
              padding: 20px 0;
            }
            .stat-box {
              text-align: center;
            }
            .stat-value {
              font-size: 18px;
              font-weight: 700;
              color: #064e3b;
            }
            .stat-label {
              font-size: 10px;
              text-transform: uppercase;
              color: #c5a85c;
              letter-spacing: 1px;
              margin-top: 5px;
              font-weight: 600;
            }
            .footer-prayer {
              font-family: 'Amiri', serif;
              font-size: 18px;
              color: #064e3b;
              line-height: 1.6;
              margin-bottom: 30px;
              font-style: italic;
            }
            .footer-watermark {
              font-size: 11px;
              color: #9ca3af;
              font-family: monospace;
            }
            @media print {
              body { background: white; padding: 0; }
              .certificate-container { border-color: #c5a85c !important; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="gold-corner top-left"></div>
            <div class="gold-corner top-right"></div>
            <div class="gold-corner bottom-left"></div>
            <div class="gold-corner bottom-right"></div>
            
            <div class="header-bismillah">بِسْمِ اللَّهِ الرَّحْمَٰনِ الرَّحِيمِ</div>
            <div class="cert-title">\${lang === 'bn' ? 'মাইলফলক অগ্রগতি সনদ' : 'Milestone Certificate'}</div>
            <div class="cert-subtitle">\${lang === 'bn' ? 'ওমরাহ সঞ্চয় পথচলা' : 'Umrah Savings Journey'}</div>
            
            <div class="presented-to">\${lang === 'bn' ? 'সম্মানের সাথে প্রদান করা হলো' : 'This certificate is proudly presented to'}</div>
            <div class="recipient-name">\${name}</div>
            
            <div class="description">
              \${progressText}
            </div>
            
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value">\${formatNumber(Math.round(stats.progressPercentage), lang)}%</div>
                <div class="stat-label">\${lang === 'bn' ? 'সম্পূর্ণ অগ্রগতি' : 'Progress'}</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">\${formatCurrency(stats.currentSavings, currency, lang)}</div>
                <div class="stat-label">\${lang === 'bn' ? 'বর্তমান সঞ্চয়' : 'Total Saved'}</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">\${formatNumber(entries.length, lang)} \${lang === 'bn' ? 'দিন' : 'Days'}</div>
                <div class="stat-label">\${lang === 'bn' ? 'মোট লগ ইন' : 'Logged Days'}</div>
              </div>
            </div>
            
            <div class="footer-prayer">
              \${lang === 'bn' 
                ? '“হে আল্লাহ! আমাদের নিয়তকে কবুল করুন, পবিত্র ওমরাহ সফরকে সহজ করে দিন এবং বাইতুল্লাহর যিয়ারত নসীব করুন। আমীন।”' 
                : '"May Allah accept your pure intentions, facilitate your journey, and make it easy for you to visit the Holy Kaaba. Ameen."'}
            </div>
            
            <div class="footer-watermark">
              \${lang === 'bn' ? 'ওমরাহ সঞ্চয় ট্র্যাকার' : 'Umrah Savings Tracker'} • \${new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Motivational verses/Hadith for Umrah journey
  const quotesList = quotes && quotes.length > 0 ? quotes : defaultIslamicQuotes;
  const [currentQuoteIndex, setCurrentQuoteIndex] = React.useState(0);
  const [isSpinning, setIsSpinning] = React.useState(false);

  // Auto rotate quote index based on current hour/day to ensure it changes regularly on loading
  React.useEffect(() => {
    if (quotesList.length > 0) {
      const currentHour = new Date().getHours();
      const currentDay = new Date().getDate();
      const initialIdx = (currentDay + currentHour) % quotesList.length;
      setCurrentQuoteIndex(initialIdx);
    }
  }, [quotesList.length]);

  // Automatic slideshow/rotation every 45 seconds to keep it dynamic while user stays on dashboard
  React.useEffect(() => {
    if (quotesList.length === 0) return;
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotesList.length);
    }, 45000); // 45 seconds rotation
    return () => clearInterval(interval);
  }, [quotesList.length]);

  const activeQuote = quotesList[currentQuoteIndex] || quotesList[0] || defaultIslamicQuotes[0];

  const handleNextQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % quotesList.length);
  };

  const handlePrevQuote = () => {
    setCurrentQuoteIndex((prev) => (prev - 1 + quotesList.length) % quotesList.length);
  };

  const handleShuffleQuote = () => {
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 600);
    const randIdx = Math.floor(Math.random() * quotesList.length);
    setCurrentQuoteIndex(randIdx);
  };

  const statCards = [
    {
      id: "goalAmount",
      title: t.goalAmount,
      value: formatCurrency(stats.goalAmount, currency, lang),
      icon: Target,
      color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/5",
      iconColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      id: "currentSavings",
      title: t.currentSavings,
      value: formatCurrency(stats.currentSavings, currency, lang),
      icon: Coins,
      color: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 dark:bg-amber-500/5",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
      id: "remainingAmount",
      title: t.remainingAmount,
      value: formatCurrency(stats.remainingAmount, currency, lang),
      icon: Hourglass,
      color: "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400 dark:bg-rose-500/5",
      iconColor: "text-rose-600 dark:text-rose-400"
    },
    {
      id: "todaySavings",
      title: t.todaySavings,
      value: formatCurrency(stats.todaySavings, currency, lang),
      icon: DollarSign,
      color: "bg-teal-500/10 border-teal-500/20 text-teal-700 dark:text-teal-400 dark:bg-teal-500/5",
      iconColor: "text-teal-600 dark:text-teal-400"
    },
    {
      id: "thisMonthSavings",
      title: t.thisMonthSavings,
      value: formatCurrency(stats.thisMonthSavings, currency, lang),
      icon: Calendar,
      color: "bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-400 dark:bg-sky-500/5",
      iconColor: "text-sky-600 dark:text-sky-400"
    },
    {
      id: "totalExtraMoney",
      title: t.totalExtraMoney,
      value: formatCurrency(stats.totalExtraMoney, currency, lang),
      icon: Gift,
      color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400 dark:bg-indigo-500/5",
      iconColor: "text-indigo-600 dark:text-indigo-400"
    },
    {
      id: "avgDaily",
      title: t.avgDaily,
      value: formatCurrency(stats.averageDailySavings, currency, lang),
      icon: TrendingUp,
      color: "bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-400 dark:bg-violet-500/5",
      iconColor: "text-violet-600 dark:text-violet-400"
    },
    {
      id: "avgMonthly",
      title: t.avgMonthly,
      value: formatCurrency(stats.averageMonthlySavings, currency, lang),
      icon: TrendingUp,
      color: "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-400 dark:bg-fuchsia-500/5",
      iconColor: "text-fuchsia-600 dark:text-fuchsia-400"
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Dynamic Jannah Header / Islamic Wisdom Box */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/50"
      >
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-5 pointer-events-none">
          <Compass className="w-80 h-80 rotate-12" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-4 flex-grow">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                <Compass className="w-3.5 h-3.5" />
                {lang === 'bn' ? 'ওমরাহ পথচলা' : 'Journey of Intent'}
              </span>

              {/* Quote Control Actions */}
              <div className="flex items-center gap-1.5 bg-black/20 border border-white/5 rounded-full px-2 py-0.5 ml-auto md:ml-0">
                <button
                  onClick={handlePrevQuote}
                  className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title={lang === 'bn' ? "পূর্ববর্তী আয়াত" : "Previous Verse"}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={handleShuffleQuote}
                  className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title={lang === 'bn' ? "এলোমেলো পরিবর্তন" : "Shuffle Verse"}
                >
                  <Shuffle className={`w-3 h-3 ${isSpinning ? "animate-spin" : ""}`} />
                </button>

                <button
                  onClick={handleNextQuote}
                  className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title={lang === 'bn' ? "পরবর্তী আয়াত" : "Next Verse"}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <span className="text-[10px] text-amber-400/80 font-bold font-mono px-1 border-l border-white/10 ml-0.5">
                  {formatNumber(currentQuoteIndex + 1, lang)} / {formatNumber(quotesList.length, lang)}
                </span>
              </div>
            </div>

            {/* Smooth Animated Quote text wrapper */}
            <motion.div
              key={currentQuoteIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 min-h-[4.5rem] flex flex-col justify-center text-left"
            >
              <p className="text-sm sm:text-base italic font-medium leading-relaxed text-emerald-100">
                "{lang === 'bn' ? activeQuote.bn : activeQuote.en}"
              </p>
              <p className="text-xs text-amber-400 font-semibold font-mono tracking-wide">
                — {activeQuote.source}
              </p>
            </motion.div>
          </div>

          {/* Quick Action Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setTab("newEntry")}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-bold text-sm shadow-lg shadow-amber-500/10 transition-all duration-200 cursor-pointer"
            >
              {t.newEntry}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Progress Panel (Circular & Linear Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Gauge: Circular */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center relative"
        >
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-mono mb-4">
            {lang === 'bn' ? 'অগ্রগতি বৃত্তাকার' : 'Circular Progress'}
          </h3>

          <div className="relative flex items-center justify-center">
            <svg
              height={radius * 2}
              width={radius * 2}
              className="transform -rotate-90"
            >
              <circle
                stroke="rgba(16, 185, 129, 0.08)"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke="#d97706" // Gold / Amber
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + " " + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white font-sans">
                {formatNumber(Math.round(stats.progressPercentage), lang)}%
              </span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider font-mono">
                {lang === 'bn' ? 'সম্পূর্ণ' : 'Completed'}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {formatCurrency(stats.currentSavings, currency, lang)} / {formatCurrency(stats.goalAmount, currency, lang)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {lang === 'bn' 
                ? `${formatCurrency(stats.remainingAmount, currency, lang)} ওমরাহর জন্য প্রয়োজন` 
                : `${formatCurrency(stats.remainingAmount, currency, lang)} needed for Umrah`}
            </p>
            {stats.progressPercentage > 0 && (
              <button
                onClick={handlePrintCertificate}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                {lang === 'bn' ? 'অগ্রগতি সনদ প্রিন্ট করুন' : 'Print Progress Certificate'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Progress Grid: Linear with Milestones */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-mono mb-4">
              {lang === 'bn' ? 'ওমরাহ সঞ্চয় মাইলফলক' : 'Umrah Savings Milestones'}
            </h3>

            {/* Custom Linear Progress with Milestone Nodes */}
            <div className="relative mt-8 mb-10 px-2">
              {/* Active Bar */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-emerald-500/10 dark:bg-slate-800 rounded-full" />
              <div 
                className="absolute top-1/2 -translate-y-1/2 left-0 h-2 bg-gradient-to-r from-emerald-600 to-amber-500 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(stats.progressPercentage, 100)}%` }}
              />

              {/* Milestone Nodes */}
              {[0, 25, 50, 75, 100].map((node) => {
                const isActive = stats.progressPercentage >= node;
                const percentStyle = { left: `${node}%` };
                return (
                  <div
                    key={node}
                    style={percentStyle}
                    className="absolute top-1/2 -translate-y-1/2 transform -translate-x-1/2 flex flex-col items-center"
                  >
                    <div 
                      className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive 
                          ? "bg-amber-400 border-emerald-700 text-emerald-950 scale-110 shadow-sm" 
                          : "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      <span className="text-[8px] font-bold font-mono">
                        {node === 100 ? "🕋" : formatNumber(node, lang)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-gray-400 dark:text-gray-500 mt-4">
                      {node}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core Info Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider font-mono">
                {t.estCompletion}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {stats.estimatedCompletionDate === "N/A" 
                    ? (lang === 'bn' ? "অপর্যাপ্ত ডাটা" : "Insufficient Data")
                    : stats.estimatedCompletionDate}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider font-mono">
                {lang === 'bn' ? 'মোট লগ ইন দিন' : 'Total Logged Days'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Hourglass className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {formatNumber(entries.length, lang)} {lang === 'bn' ? "দিন" : "days"}
                </span>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider font-mono">
                {lang === 'bn' ? 'সঞ্চয় লক্ষ্যমাত্রা' : 'Current Priority'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {lang === 'bn' ? "মাক্কাহ সফর" : "Journey to Makkah"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.04 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className={`p-3.5 rounded-xl ${card.color} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono">
                  {card.title}
                </p>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-1 font-sans">
                  {card.value}
                </h4>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
