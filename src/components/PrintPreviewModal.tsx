import React, { useEffect } from "react";
import { X, Printer, Compass, Award, Calendar, CheckCircle, Heart } from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/helpers";
import { translations } from "../utils/translations";

interface PrintPreviewModalProps {
  type: "report" | "certificate";
  lang: "en" | "bn";
  currency: string;
  onClose: () => void;
  // Report data
  reportData?: {
    title: string;
    headers: string[];
    rows: string[][];
  };
  // Certificate data
  certificateData?: {
    userName: string;
    progressPercentage: number;
    currentSavings: number;
    goalAmount: number;
    totalDays: number;
  };
}

export default function PrintPreviewModal({
  type,
  lang,
  currency,
  onClose,
  reportData,
  certificateData,
}: PrintPreviewModalProps) {
  const t = translations[lang];

  // Auto focus print trigger or add escape key listener to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handlePrintAction = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      {/* CSS Rules for print layout */}
      <style>{`
        @media print {
          /* Hide everything except the print-container */
          body > * {
            display: none !important;
          }
          body > .fixed.inset-0.z-\\[9999\\] {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-paper {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
          }
          .certificate-border {
            border: 10px double #c5a85c !important;
            padding: 20px 30px !important;
          }
        }
      `}</style>

      {/* Control Bar (Hidden on print) */}
      <div className="no-print max-w-4xl w-full mx-auto flex items-center justify-between bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl mb-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Printer className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-sans font-bold text-sm">
              {lang === "bn" ? "প্রিন্ট প্রিভিউ মোড" : "Print Preview Mode"}
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">
              {lang === "bn"
                ? "ডকুমেন্টটি প্রিন্ট বা পিডিএফ সংরক্ষণের জন্য প্রস্তুত"
                : "Ready for physical printing or saving as PDF"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintAction}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {lang === "bn" ? "প্রিন্ট / পিডিএফ ডাউনলোড" : "Print / PDF Download"}
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            title={t.cancel || "Close"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Printable Area */}
      <div className="flex-1 w-full flex items-center justify-center p-2 sm:p-4">
        {/* Paper Container */}
        <div className="print-paper max-w-4xl w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-12 shadow-2xl border border-slate-100 transition-all relative overflow-hidden min-h-[500px]">
          
          {/* 1. REPORT PRINT VIEW */}
          {type === "report" && reportData && (
            <div className="space-y-6 text-left">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-emerald-800 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-900 text-amber-400 p-2.5 rounded-xl">
                    <Compass className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="font-sans font-black text-xl sm:text-2xl text-emerald-900 tracking-tight">
                      {t.appName}
                    </h2>
                    <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider font-mono">
                      {t.tagline}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs font-mono text-slate-500 space-y-0.5">
                  <p>
                    <strong>{lang === "bn" ? "তারিখ:" : "Date:"}</strong> {todayStr}
                  </p>
                  <p>
                    <strong>{lang === "bn" ? "টাইপ:" : "Report:"}</strong> {reportData.title}
                  </p>
                </div>
              </div>

              {/* Title Header */}
              <div className="text-center bg-slate-50 border border-slate-100 py-3 rounded-2xl">
                <h3 className="font-sans font-bold text-lg text-slate-800">
                  {reportData.title}
                </h3>
              </div>

              {/* Table wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-emerald-900 text-white font-bold border border-emerald-950">
                      {reportData.headers.map((header, index) => (
                        <th key={index} className="p-3 border border-emerald-800 text-center first:text-left">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="border border-slate-200 even:bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-2.5 border border-slate-200 text-slate-700 ${
                              cIdx === 0 ? "font-semibold text-slate-900 text-left whitespace-nowrap" : "text-center"
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer / Blessing */}
              <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-gray-400 font-mono gap-4">
                <p>© {new Date().getFullYear()} {t.appName} • {t.tagline}</p>
                <p className="font-semibold text-emerald-800 italic">
                  Alhamdulillah for all blessings • May Allah accept your intentions
                </p>
              </div>
            </div>
          )}

          {/* 2. MILESTONE CERTIFICATE VIEW */}
          {type === "certificate" && certificateData && (
            <div className="certificate-border border-[14px] border-double border-[#c5a85c] p-6 sm:p-12 text-center bg-amber-50/5 relative min-h-[550px] flex flex-col justify-between">
              {/* Corner Ornaments */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#c5a85c]" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#c5a85c]" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#c5a85c]" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#c5a85c]" />

              {/* Bismillah Banner */}
              <div className="text-emerald-900 text-2xl font-semibold mb-4 leading-relaxed font-serif">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>

              {/* App / Logo Identity */}
              <div className="flex items-center justify-center gap-2 mb-4 text-emerald-900">
                <Compass className="w-6 h-6 text-amber-500 animate-spin-slow" />
                <span className="font-sans font-extrabold text-sm tracking-widest uppercase">
                  {t.appName}
                </span>
              </div>

              {/* Main Certificate Title */}
              <div className="space-y-1 mb-6">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-emerald-900 tracking-wide uppercase">
                  {lang === "bn" ? "অগ্রগতি মাইলফলক সনদ" : "Milestone Progress Certificate"}
                </h2>
                <div className="h-0.5 w-32 bg-[#c5a85c] mx-auto" />
                <p className="text-[10px] text-[#c5a85c] font-bold uppercase tracking-widest mt-1.5">
                  {lang === "bn" ? "ওমরাহ সঞ্চয় পথচলা" : "Umrah Savings Journey"}
                </p>
              </div>

              {/* Presentation Text */}
              <div className="space-y-2 mb-6">
                <p className="text-xs italic text-gray-500 font-serif">
                  {lang === "bn" ? "সম্মানের সাথে প্রদান করা হলো" : "This certificate is proudly presented to"}
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-emerald-950 border-b-2 border-dashed border-slate-200 inline-block px-12 py-1">
                  {certificateData.userName || (lang === "bn" ? "ওমরাহ যাত্রী" : "Umrah Pilgrim")}
                </h3>
              </div>

              {/* Achievements Description */}
              <div className="max-w-xl mx-auto mb-6">
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  {lang === "bn" ? (
                    <>
                      ওমরাহ সঞ্চয় লক্ষ্যের{" "}
                      <span className="font-bold text-emerald-700 font-mono">
                        {formatNumber(certificateData.progressPercentage, "bn")}%
                      </span>{" "}
                      সফলভাবে অর্জন করার আত্মিক ও আর্থিক অগ্রগতির একটি গর্বিত স্মারকস্বরূপ এই সনদ প্রদান করা হলো। আল্লাহ আপনার নিয়তকে কবুল করুন।
                    </>
                  ) : (
                    <>
                      In recognition of successfully achieving{" "}
                      <span className="font-bold text-emerald-700">
                        {certificateData.progressPercentage}%
                      </span>{" "}
                      of the Umrah savings goal! This certificate marks your financial and spiritual commitment to embark on the sacred pilgrimage of Umrah.
                    </>
                  )}
                </p>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-4 max-w-lg mx-auto w-full mb-6">
                <div className="text-center">
                  <div className="text-base sm:text-lg font-bold text-emerald-900 font-mono">
                    {formatNumber(certificateData.progressPercentage, lang)}%
                  </div>
                  <div className="text-[9px] uppercase font-bold text-[#c5a85c] tracking-wider mt-0.5">
                    {lang === "bn" ? "অগ্রগতি" : "Progress"}
                  </div>
                </div>
                <div className="text-center border-l border-r border-slate-100">
                  <div className="text-base sm:text-lg font-extrabold text-emerald-900 font-mono">
                    {formatCurrency(certificateData.currentSavings, currency, lang)}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-[#c5a85c] tracking-wider mt-0.5">
                    {lang === "bn" ? "বর্তমান সঞ্চয়" : "Total Saved"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-base sm:text-lg font-bold text-emerald-900 font-mono">
                    {formatNumber(certificateData.totalDays, lang)}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-[#c5a85c] tracking-wider mt-0.5">
                    {lang === "bn" ? "সঞ্চয় দিন" : "Savings Days"}
                  </div>
                </div>
              </div>

              {/* Climax Prayer */}
              <div className="mb-6">
                <p className="font-serif text-sm sm:text-base text-emerald-800 font-semibold italic max-w-md mx-auto leading-relaxed">
                  {lang === "bn"
                    ? "“হে আল্লাহ! আমাদের নিয়তকে কবুল করুন, পবিত্র ওমরাহ সফরকে সহজ করে দিন এবং বাইতুল্লাহর যিয়ারত নসীব করুন। আমীন।”"
                    : '"May Allah accept your pure intentions, facilitate your journey, and grant you the beautiful blessing of visiting the Holy Kaaba. Ameen."'}
                </p>
              </div>

              {/* Footer Stamp / Metadata */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[10px] text-slate-400 font-mono">
                <span>
                  {lang === "bn" ? "ইস্যুর তারিখ:" : "Issued On:"} {todayStr}
                </span>
                <span className="flex items-center gap-1 text-emerald-800 font-bold">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  {lang === "bn" ? "জান্নাতের পথ" : "The Way of Jannah"}
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
