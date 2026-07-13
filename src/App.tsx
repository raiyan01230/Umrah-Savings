import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { doc, onSnapshot, setDoc, deleteDoc, collection } from "firebase/firestore";
import { auth, db } from "./firebase";
import { translations } from "./utils/translations";
import defaultAvatar from "./assets/images/user_profile_pic_1783927457570.jpg";
import { defaultIslamicQuotes, IslamicQuote } from "./data/quotesData";

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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
        setProfile({
          uid: authUser.uid,
          email: authUser.email || "",
          displayName: authUser.displayName || "Explorer",
          photoURL: authUser.photoURL || defaultAvatar,
          createdAt: new Date().toISOString()
        });
      } else {
        setUser(null);
        setProfile(null);
        setEntries([]);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync / Seed Quotes with Firestore
  useEffect(() => {
    if (!user) return;

    const quotesColRef = collection(db, "quotes");
    
    // Subscribe/Listen to quotes from Firestore
    const unsubscribe = onSnapshot(quotesColRef, async (colSnap) => {
      if (colSnap.empty) {
        // If empty, let's seed the database in the background!
        try {
          console.log("Seeding Islamic quotes to Firestore...");
          for (let i = 0; i < defaultIslamicQuotes.length; i++) {
            const quote = defaultIslamicQuotes[i];
            const qDocRef = doc(db, "quotes", `quote_${i + 1}`);
            await setDoc(qDocRef, quote);
          }
        } catch (err) {
          console.error("Error seeding quotes to Firestore:", err);
        }
      } else {
        const fetchedQuotes: IslamicQuote[] = [];
        colSnap.forEach((doc) => {
          const data = doc.data();
          fetchedQuotes.push({
            id: doc.id,
            en: data.en,
            bn: data.bn,
            source: data.source
          });
        });
        // Sort them by their ID key suffix to maintain proper sequential order
        fetchedQuotes.sort((a, b) => {
          const numA = parseInt(a.id?.replace("quote_", "") || "0", 10);
          const numB = parseInt(b.id?.replace("quote_", "") || "0", 10);
          return numA - numB;
        });
        setQuotes(fetchedQuotes);
      }
    }, (error) => {
      // Handle permission/connection issues gracefully without crashing
      console.warn("Firestore Quotes loading fallback to local default:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Settings & Profile Listener + Initial Setup
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.profile) {
          setProfile(data.profile);
        }
      } else {
        // Document doesn't exist, let's initialize it
        const initialPayload = {
          profile: {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "Explorer",
            photoURL: user.photoURL || defaultAvatar,
            createdAt: new Date().toISOString()
          },
          settings: {
            goalAmount: 160000,
            currency: "BDT",
            theme: "light",
            language: "en"
          }
        };
        await setDoc(userDocRef, initialPayload);
        setSettings(initialPayload.settings);
        setProfile(initialPayload.profile);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Realtime Entries Listener
  useEffect(() => {
    if (!user) return;

    const entriesColRef = collection(db, "users", user.uid, "entries");
    const unsubscribe = onSnapshot(entriesColRef, (colSnap) => {
      const fetchedEntries: SavingsEntry[] = [];
      colSnap.forEach((doc) => {
        const data = doc.data();
        fetchedEntries.push({
          id: doc.id,
          date: data.date,
          day: data.day,
          dailyMoney: data.dailyMoney || 0,
          extraMoney: data.extraMoney || 0,
          source: data.source || "Other",
          expense: data.expense || 0,
          todaySavings: data.todaySavings || 0,
          notes: data.notes || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      // Sort entries by date descending for UI display
      const sorted = fetchedEntries.sort((a, b) => b.date.localeCompare(a.date));
      setEntries(sorted);
    });

    return () => unsubscribe();
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

  // 1. SAVE NEW ENTRY TO FIRESTORE
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
    try {
      // Calculate today's savings
      const todaySavings = entry.dailyMoney + entry.extraMoney - entry.expense;

      // Unique entry id based on timestamp + rand
      const entryId = Date.now().toString();

      await setDoc(doc(db, "users", user.uid, "entries", entryId), {
        ...entry,
        todaySavings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      addToast(
        settings.language === 'bn' ? "এন্ট্রি সফলভাবে সংরক্ষণ করা হয়েছে!" : "Financial entry added successfully!",
        'success'
      );
      setTab("dashboard"); // Go back to dashboard to see real-time updates!
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to save entry.", 'error');
    }
  };

  // 1.5 EDIT EXISTING ENTRY IN FIRESTORE
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
    try {
      const todaySavings = updatedData.dailyMoney + updatedData.extraMoney - updatedData.expense;
      await setDoc(doc(db, "users", user.uid, "entries", id), {
        ...updatedData,
        todaySavings,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      addToast(
        settings.language === 'bn' ? "এন্ট্রি সফলভাবে আপডেট করা হয়েছে!" : "Financial entry updated successfully!",
        'success'
      );
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to update entry.", 'error');
    }
  };

  // 2. DELETE ENTRY FROM FIRESTORE
  const handleDeleteEntry = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "entries", id));
      addToast(
        settings.language === 'bn' ? "এন্ট্রি মুছে ফেলা হয়েছে!" : "Entry removed successfully!",
        'success'
      );
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to delete entry.", 'error');
    }
  };

  // 3. UPDATE APPLICATION CONFIGURATION SETTINGS
  const handleSaveSettings = async (newSettings: UserSettings) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { settings: newSettings }, { merge: true });
      addToast(
        newSettings.language === 'bn' ? "সেটিংস সফলভাবে সংরক্ষিত হয়েছে!" : "Application settings updated!",
        'success'
      );
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to update settings.", 'error');
    }
  };

  // 4. UPDATE USER PROFILE DETAILS
  const handleSaveProfile = async (displayName: string, photoURL: string) => {
    if (!user) return;
    try {
      // Update Auth Profile
      await updateProfile(auth.currentUser!, {
        displayName,
        photoURL
      });

      // Update User Doc Profile
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        profile: {
          uid: user.uid,
          email: user.email || "",
          displayName,
          photoURL,
          updatedAt: new Date().toISOString()
        }
      }, { merge: true });

      setUser({
        ...auth.currentUser
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
      await signOut(auth);
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
        {/* Spinner or beautiful custom loading dome */}
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
      {/* Toast Notification HUD */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Primary Top Header & Nav Rail */}
      <Navbar
        currentTab={currentTab}
        setTab={setTab}
        user={user}
        onLogout={handleLogout}
        lang={settings.language}
        setLang={toggleLanguage}
        theme={settings.theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Interactive Stage */}
      <main className="pb-16">
        {currentTab === "dashboard" && (
          <div className="space-y-6">
            <DashboardOverview
              stats={stats}
              entries={entries}
              currency={settings.currency}
              lang={settings.language}
              setTab={setTab}
              userName={profile?.displayName || user.displayName || ""}
              quotes={quotes}
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
  );
}
