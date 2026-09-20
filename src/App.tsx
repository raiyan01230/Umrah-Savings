import React, { useState, useEffect, useRef } from "react";
import {
  supabase,
  signOutUser,
  getUserSettings,
  saveUserSettings,
  getUserProfile,
  saveUserProfile,
  updateUserProfile,
  getSavingsEntries,
  addSavingsEntry,
  editSavingsEntry,
  removeSavingsEntry,
  getQuotes,
} from "./supabase";
import { translations } from "./utils/translations";
import defaultAvatar from "./assets/images/user_profile_pic_1783927457570.jpg";
import { defaultIslamicQuotes, IslamicQuote } from "./data/quotesData";
import { safeGetItem } from "./utils/storage";

// Components
import AuthView from "./components/AuthView";
import Navbar from "./components/Navbar";
import DashboardOverview from "./components/DashboardOverview";
import DailyEntryForm from "./components/DailyEntryForm";
import ReportsTab from "./components/ReportsTab";
import ExtraMoneyTab from "./components/ExtraMoneyTab";
import ExpenseTab from "./components/ExpenseTab";
import ChartsView from "./components/ChartsView";
import SettingsTab from "./components/SettingsTab";
import ToastContainer, { ToastMessage } from "./components/Toast";
import PrintPreviewModal from "./components/PrintPreviewModal";

// Types
import { UserProfile, UserSettings, SavingsEntry, DashboardStats } from "./types";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentTab, setTab] = useState<string>("dashboard");

  // App customization state
  const [settings, setSettings] = useState<UserSettings>({
    goalAmount: 160000,
    currency: "BDT",
    theme: "light",
    language: "en"
  });

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [quotes, setQuotes] = useState<IslamicQuote[]>(defaultIslamicQuotes);

  // Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Print Preview configuration state
  const [printConfig, setPrintConfig] = useState<{
    type: "report" | "certificate";
    reportData?: {
      title: string;
      headers: string[];
      rows: string[][];
    };
    certificateData?: {
      userName: string;
      progressPercentage: number;
      currentSavings: number;
      goalAmount: number;
      totalDays: number;
    };
  } | null>(null);

  // First snap flag to prevent alerting initial milestone state
  const isFirstLoad = useRef(true);
  const [lastNotifiedMilestone, setLastNotifiedMilestone] = useState<number | null>(null);

  // Helper to add toast
  const addToast = (text: string, type: 'success' | 'error' | 'info' | 'milestone' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    
    // Auto-remove standard toasts in 5 seconds, milestone in 10 seconds
    const timer = type === 'milestone' ? 10000 : 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, timer);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Supabase Auth State Listener
  useEffect(() => {
    // Check initial session
    const checkInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          const authUser = data.session.user;
          setUser(authUser);
          const userMeta = authUser.user_metadata || {};
          setProfile({
            uid: authUser.id,
            email: authUser.email || "",
            displayName: userMeta.displayName || userMeta.display_name || "Explorer",
            photoURL: userMeta.photoURL || userMeta.photo_url || defaultAvatar,
            createdAt: authUser.created_at || new Date().toISOString()
          });
        } else {
          // Check local fallback user if available
          const raw = safeGetItem("umrah_savings_auth_user_v2");
          if (raw) {
            try {
              const localUser = JSON.parse(raw);
              setUser(localUser);
              setProfile({
                uid: localUser.id,
                email: localUser.email || "",
                displayName: localUser.user_metadata?.displayName || "Explorer",
                photoURL: localUser.user_metadata?.photoURL || defaultAvatar,
                createdAt: localUser.created_at || new Date().toISOString()
              });
            } catch (e) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn("Auth initialization error:", err);
      } finally {
        setAuthChecking(false);
      }
    };

    checkInitialSession();

    // Listen for auth state changes in Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authUser = session.user;
        setUser(authUser);
        const userMeta = authUser.user_metadata || {};
        setProfile({
          uid: authUser.id,
          email: authUser.email || "",
          displayName: userMeta.displayName || userMeta.display_name || "Explorer",
          photoURL: userMeta.photoURL || userMeta.photo_url || defaultAvatar,
          createdAt: authUser.created_at || new Date().toISOString()
        });
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setEntries([]);
      }
      setAuthChecking(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // 2. Load Quotes
  useEffect(() => {
    const fetchQuotesData = async () => {
      const q = await getQuotes();
      if (q && q.length > 0) {
        setQuotes(q);
      }
    };
    fetchQuotesData();
  }, [user]);

  // 3. Load Settings, Profile, & Entries for current authenticated user
  useEffect(() => {
    if (!user) return;
    const userId = user.id || user.uid;

    const loadUserData = async () => {
      try {
        // Load Settings
        const s = await getUserSettings(userId);
        setSettings(s);

        // Load Profile
        const p = await getUserProfile(userId, user.email || "", user.user_metadata);
        if (p) setProfile(p);

        // Load Entries
        const e = await getSavingsEntries(userId);
        setEntries(e);
      } catch (err) {
        console.warn("Error loading user data from Supabase:", err);
      }
    };

    loadUserData();

    // Realtime changes listener on Supabase savings_entries table
    const channel = supabase
      .channel(`savings_entries_changes_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'savings_entries',
          filter: `user_id=eq.${userId}`
        },
        async () => {
          const freshEntries = await getSavingsEntries(userId);
          setEntries(freshEntries);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Handle Light / Dark Theme Apply
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Auto Calculations & Dashboard Metrics
  const stats: DashboardStats = React.useMemo(() => {
    const goal = settings.goalAmount || 160000;
    const current = entries.reduce((sum, entry) => sum + entry.todaySavings, 0);
    const remaining = Math.max(goal - current, 0);
    const progress = Math.min((current / goal) * 100, 100);

    // Today's Savings (Match local today's date)
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySavingsSum = entries
      .filter((entry) => entry.date === todayStr)
      .reduce((sum, entry) => sum + entry.todaySavings, 0);

    // This Month's Savings
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthSavingsSum = entries
      .filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear;
      })
      .reduce((sum, entry) => sum + entry.todaySavings, 0);

    // Total Extra Money
    const totalExtra = entries.reduce((sum, entry) => sum + entry.extraMoney, 0);

    // Averages
    const totalDays = entries.length;
    const avgDaily = totalDays > 0 ? current / totalDays : 0;

    // Monthly aggregation
    const monthlyTotals: Record<string, number> = {};
    entries.forEach((entry) => {
      const dateObj = new Date(entry.date);
      const key = `${dateObj.getMonth()}-${dateObj.getFullYear()}`;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + entry.todaySavings;
    });
    const totalMonths = Object.keys(monthlyTotals).length;
    const avgMonthly = totalMonths > 0 ? Object.values(monthlyTotals).reduce((s, val) => s + val, 0) / totalMonths : 0;

    // Estimated Completion Date calculation
    let estCompDate = "N/A";
    if (avgDaily > 0 && remaining > 0) {
      const daysNeeded = Math.ceil(remaining / avgDaily);
      const estDate = new Date();
      estDate.setDate(estDate.getDate() + daysNeeded);
      
      const locale = settings.language === 'bn' ? 'bn-BD' : 'en-US';
      estCompDate = estDate.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }

    // Milestone Trigger (Only when progress is updated, skipping the very first load)
    if (!isFirstLoad.current) {
      const milestones = [25, 50, 75, 100];
      for (const ms of milestones) {
        if (progress >= ms && (!lastNotifiedMilestone || lastNotifiedMilestone < ms)) {
          const t = translations[settings.language];
          let text = "";
          if (ms === 25) text = t.progressAlert25;
          else if (ms === 50) text = t.progressAlert50;
          else if (ms === 75) text = t.progressAlert75;
          else if (ms === 100) text = t.progressAlert100;

          addToast(text, 'milestone');
          setLastNotifiedMilestone(ms);
          break; // alert once
        }
      }
    } else {
      // Establish baseline milestone to prevent spamming on first load
      const milestones = [25, 50, 75, 100];
      let baseline: number | null = null;
      for (const ms of milestones) {
        if (progress >= ms) {
          baseline = ms;
        }
      }
      setLastNotifiedMilestone(baseline);
      isFirstLoad.current = false;
    }

    return {
      goalAmount: goal,
      currentSavings: current,
      remainingAmount: remaining,
      progressPercentage: progress,
      todaySavings: todaySavingsSum,
      thisMonthSavings: monthSavingsSum,
      totalExtraMoney: totalExtra,
      averageDailySavings: avgDaily,
      averageMonthlySavings: avgMonthly,
      estimatedCompletionDate: estCompDate
    };
  }, [entries, settings.goalAmount, settings.language]);

  // 1. SAVE NEW ENTRY TO SUPABASE
  const handleSaveEntry = async (entry: {
    date: string;
    day: string;
    dailyMoney: number;
    extraMoney: number;
    source: string;
    expense: number;
    notes: string;
  }) => {
    if (!user) return;
    const userId = user.id || user.uid;
    try {
      const created = await addSavingsEntry(userId, entry);
      setEntries((prev) => [created, ...prev.filter((e) => e.id !== created.id)].sort((a, b) => b.date.localeCompare(a.date)));

      addToast(
        settings.language === 'bn' ? "এন্ট্রি সফলভাবে সংরক্ষণ করা হয়েছে!" : "Financial entry added successfully!",
        'success'
      );
      setTab("dashboard");
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to save entry.", 'error');
    }
  };

  // 2. EDIT EXISTING ENTRY IN SUPABASE
  const handleEditEntry = async (id: string, updatedData: {
    date: string;
    day: string;
    dailyMoney: number;
    extraMoney: number;
    source: string;
    expense: number;
    notes: string;
  }) => {
    if (!user) return;
    const userId = user.id || user.uid;
    try {
      await editSavingsEntry(userId, id, updatedData);
      const fresh = await getSavingsEntries(userId);
      setEntries(fresh);

      addToast(
        settings.language === 'bn' ? "এন্ট্রি সফলভাবে আপডেট করা হয়েছে!" : "Financial entry updated successfully!",
        'success'
      );
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to update entry.", 'error');
    }
  };

  // 3. DELETE ENTRY FROM SUPABASE
  const handleDeleteEntry = async (id: string) => {
    if (!user) return;
    const userId = user.id || user.uid;
    try {
      await removeSavingsEntry(userId, id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      addToast(
        settings.language === 'bn' ? "এন্ট্রি মুছে ফেলা হয়েছে!" : "Entry removed successfully!",
        'success'
      );
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to delete entry.", 'error');
    }
  };

  // 4. UPDATE APPLICATION CONFIGURATION SETTINGS
  const handleSaveSettings = async (newSettings: UserSettings) => {
    if (!user) return;
    const userId = user.id || user.uid;
    try {
      setSettings(newSettings);
      await saveUserSettings(userId, newSettings);
      addToast(
        newSettings.language === 'bn' ? "সেটিংস সফলভাবে সংরক্ষিত হয়েছে!" : "Application settings updated!",
        'success'
      );
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to update settings.", 'error');
    }
  };

  // 5. UPDATE USER PROFILE DETAILS
  const handleSaveProfile = async (displayName: string, photoURL: string) => {
    if (!user) return;
    const userId = user.id || user.uid;
    try {
      await updateUserProfile(displayName, photoURL);
      await saveUserProfile(userId, { displayName, photoURL, email: user.email });

      setProfile((prev) => prev ? ({ ...prev, displayName, photoURL }) : {
        uid: userId,
        email: user.email || "",
        displayName,
        photoURL,
        createdAt: new Date().toISOString()
      });

      addToast(
        settings.language === 'bn' ? "প্রোফাইল আপডেট করা হয়েছে!" : "User profile updated successfully!",
        'success'
      );
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to update profile.", 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setUser(null);
      setProfile(null);
      setEntries([]);
      addToast(
        settings.language === 'bn' ? "সাফল্যের সাথে লগ আউট হয়েছে!" : "Signed out successfully!",
        'info'
      );
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Logout failed.", 'error');
    }
  };

  const toggleTheme = async () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
    await handleSaveSettings({
      ...settings,
      theme: nextTheme
    });
  };

  const toggleLanguage = async (nextLang: 'en' | 'bn') => {
    await handleSaveSettings({
      ...settings,
      language: nextLang
    });
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        {/* Spinner */}
        <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 animate-pulse font-mono">
          Bismillahir Rahmanir Rahim...
        </p>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <AuthView onNotify={(text, type) => addToast(text, type)} lang={settings.language} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="print:hidden">
        {/* Toast Notification HUD */}
        <ToastContainer toasts={toasts} onClose={removeToast} />

        {/* Primary Top Header & Nav Rail */}
        <Navbar
          currentTab={currentTab}
          setTab={setTab}
          user={profile ? { ...user, displayName: profile.displayName, photoURL: profile.photoURL } : user}
          onLogout={handleLogout}
          lang={settings.language}
          setLang={toggleLanguage}
          theme={settings.theme}
          toggleTheme={toggleTheme}
        />

        {/* Main Interactive Stage */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          {currentTab === "dashboard" && (
            <div className="space-y-6">
              <DashboardOverview
                stats={stats}
                entries={entries}
                currency={settings.currency}
                lang={settings.language}
                setTab={setTab}
                userName={profile?.displayName || user.user_metadata?.displayName || user.displayName || ""}
                quotes={quotes}
                onTriggerPrintCertificate={(certificateData) => {
                  setPrintConfig({
                    type: "certificate",
                    certificateData
                  });
                }}
              />
              <ChartsView
                entries={entries}
                currency={settings.currency}
                lang={settings.language}
              />
            </div>
          )}

          {currentTab === "newEntry" && (
            <DailyEntryForm
              onSave={handleSaveEntry}
              currency={settings.currency}
              lang={settings.language}
            />
          )}

          {currentTab === "reports" && (
            <ReportsTab
              entries={entries}
              currency={settings.currency}
              lang={settings.language}
              onDeleteEntry={handleDeleteEntry}
              onEditEntry={handleEditEntry}
              onTriggerPrintReport={(reportData) => {
                setPrintConfig({
                  type: "report",
                  reportData
                });
              }}
            />
          )}

          {currentTab === "extraMoney" && (
            <ExtraMoneyTab
              entries={entries}
              currency={settings.currency}
              lang={settings.language}
            />
          )}

          {currentTab === "expenses" && (
            <ExpenseTab
              entries={entries}
              currency={settings.currency}
              lang={settings.language}
            />
          )}

          {currentTab === "settings" && (
            <SettingsTab
              settings={settings}
              profile={profile}
              onSaveSettings={handleSaveSettings}
              onSaveProfile={handleSaveProfile}
              lang={settings.language}
            />
          )}
        </main>

        {/* Desktop/Mobile Global Footer */}
        <footer className="py-6 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 text-center text-xs text-gray-400 dark:text-gray-500 font-mono">
          <p>© {new Date().getFullYear()} {translations[settings.language].appName} • {translations[settings.language].tagline}</p>
          <p className="mt-1 opacity-75">Alhamdulillah for all blessings • May Allah accept your intention</p>
        </footer>
      </div>

      {printConfig && (
        <PrintPreviewModal
          type={printConfig.type}
          lang={settings.language}
          currency={settings.currency}
          reportData={printConfig.reportData}
          certificateData={printConfig.certificateData}
          onClose={() => setPrintConfig(null)}
        />
      )}
    </div>
  );
}
