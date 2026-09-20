import React, { useState } from "react";
import { motion } from "motion/react";
import { Settings, Target, Coins, ShieldCheck, Palette, Languages, Camera, User, Upload } from "lucide-react";
import { translations } from "../utils/translations";
import { UserSettings } from "../types";
import defaultAvatar from "../assets/images/user_profile_pic_1783927457570.jpg";
import { compressImage } from "../utils/storage";

interface SettingsTabProps {
  settings: UserSettings;
  profile: any;
  onSaveSettings: (settings: UserSettings) => Promise<void>;
  onSaveProfile: (displayName: string, photoURL: string) => Promise<void>;
  lang: 'en' | 'bn';
}

export default function SettingsTab({
  settings,
  profile,
  onSaveSettings,
  onSaveProfile,
  lang
}: SettingsTabProps) {
  const t = translations[lang];

  // Settings states
  const [goalAmount, setGoalAmount] = useState<number>(settings.goalAmount || 160000);
  const [currency, setCurrency] = useState<string>(settings.currency || "BDT");
  const [theme, setTheme] = useState<'light' | 'dark'>(settings.theme || "light");
  const [currentLang, setCurrentLang] = useState<'en' | 'bn'>(settings.language || "en");

  // Profile states
  const [displayName, setDisplayName] = useState<string>(profile?.displayName || "");
  const [photoURL, setPhotoURL] = useState<string>(profile?.photoURL || "");

  // Sync state when profile or settings props update from database
  React.useEffect(() => {
    if (profile?.displayName) setDisplayName(profile.displayName);
    if (profile?.photoURL) setPhotoURL(profile.photoURL);
  }, [profile?.displayName, profile?.photoURL]);

  React.useEffect(() => {
    if (settings.goalAmount) setGoalAmount(settings.goalAmount);
    if (settings.currency) setCurrency(settings.currency);
    if (settings.theme) setTheme(settings.theme);
    if (settings.language) setCurrentLang(settings.language);
  }, [settings.goalAmount, settings.currency, settings.theme, settings.language]);

  const [savingSettings, setSavingSettings] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 250, 250, 0.7);
      setPhotoURL(compressed);
    } catch (err) {
      console.warn("Error compressing image in settings:", err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await onSaveSettings({
        goalAmount,
        currency,
        theme,
        language: currentLang
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await onSaveProfile(displayName, photoURL);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const currencies = [
    { code: "BDT", name: lang === 'bn' ? "বাংলাদেশী টাকা" : "Bangladeshi Taka" },
    { code: "USD", name: lang === 'bn' ? "ইউএস ডলার" : "US Dollar" },
    { code: "SAR", name: lang === 'bn' ? "সৌদি রিয়াল" : "Saudi Riyal" },
    { code: "EUR", name: lang === 'bn' ? "ইউরো" : "Euro" },
    { code: "GBP", name: lang === 'bn' ? "ব্রিটিশ পাউন্ড" : "British Pound" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* COLUMN 1: ACCOUNT PROFILE SETTINGS */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col justify-between"
      >
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t.profile}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                {lang === 'bn' ? 'আপনার প্রোফাইল তথ্য পরিবর্তন করুন' : 'Change your account display details'}
              </p>
            </div>
          </div>

          {/* Picture preview & upload */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="relative group">
              <img
                src={photoURL || defaultAvatar}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500/20 shadow-md"
              />
              <input
                type="file"
                accept="image/*"
                id="settings-avatar-file-input"
                className="hidden"
                onChange={handleImageFileUpload}
              />
              <label
                htmlFor="settings-avatar-file-input"
                className="absolute bottom-0 right-0 p-2 bg-emerald-600 hover:bg-emerald-500 rounded-full text-white shadow cursor-pointer transition-transform hover:scale-110"
                title={lang === 'bn' ? "গ্যালারি থেকে ছবি আপলোড করুন" : "Upload photo from gallery"}
              >
                <Camera className="w-4 h-4" />
              </label>
            </div>

            <label
              htmlFor="settings-avatar-file-input"
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors border border-emerald-200 dark:border-emerald-800"
            >
              <Upload className="w-3.5 h-3.5" />
              {lang === 'bn' ? "গ্যালারি থেকে ছবি নির্বাচন করুন" : "Upload from Gallery"}
            </label>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              {profile?.email}
            </p>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-2">
              {t.displayName}
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="block w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-2">
              {t.photoUrl}
            </label>
            <input
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://..."
              className="block w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full py-3 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors text-sm"
          >
            {savingProfile ? t.saving : t.updateProfile}
          </button>
        </form>
      </motion.div>

      {/* COLUMN 2: APPLICATION SETTINGS (GOAL, CURRENCY, THEME) */}
      <motion.div
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm p-6 sm:p-8"
      >
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t.settings}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                {lang === 'bn' ? 'ওমরাহ সঞ্চয় লক্ষ্যমাত্রা ও থিম সেটিংস' : 'Configure savings parameters & visual themes'}
              </p>
            </div>
          </div>

          {/* Goal Amount */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-2">
              {t.goalAmount}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                <Target className="w-4 h-4" />
              </div>
              <input
                type="number"
                required
                min="1"
                value={goalAmount}
                onChange={(e) => setGoalAmount(Number(e.target.value) || 0)}
                className="block w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Currency selection */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-2">
              {t.currency}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                <Coins className="w-4 h-4" />
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code} className="dark:bg-slate-950">
                    {curr.code} — {curr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Language selection toggle */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-2">
              {t.language}
            </label>
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-950 p-1 rounded-xl w-fit border border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentLang('en')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  currentLang === 'en'
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setCurrentLang('bn')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  currentLang === 'bn'
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                বাংলা (Bangla)
              </button>
            </div>
          </div>

          {/* Theme selection toggles */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono mb-2">
              {t.theme}
            </label>
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-950 p-1 rounded-xl w-fit border border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  theme === 'light'
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {t.light}
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  theme === 'dark'
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {t.dark}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md transition-colors text-sm flex items-center justify-center gap-2"
          >
            {savingSettings ? t.saving : t.saveSettings}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
