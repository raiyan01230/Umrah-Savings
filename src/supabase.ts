import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { UserProfile, UserSettings, SavingsEntry } from "./types";
import defaultAvatar from "./assets/images/user_profile_pic_1783927457570.jpg";
import { defaultIslamicQuotes, IslamicQuote } from "./data/quotesData";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dnqeshylcqxpsetihsgg.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Initialize Supabase Client
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || "placeholder-anon-key-for-initialization"
);

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.trim().length > 10 && !SUPABASE_ANON_KEY.includes("placeholder"));
};

// Local storage fallback keys for seamless demo or offline testing
const LOCAL_STORAGE_ENTRIES_KEY = "umrah_savings_entries_v2";
const LOCAL_STORAGE_SETTINGS_KEY = "umrah_savings_settings_v2";
const LOCAL_STORAGE_PROFILE_KEY = "umrah_savings_profile_v2";
const LOCAL_STORAGE_USER_KEY = "umrah_savings_auth_user_v2";

/* =========================================================
   AUTH UTILITIES
   ========================================================= */

export async function signUpUser(
  email: string,
  password: string,
  displayName: string,
  photoURL?: string
) {
  if (!isSupabaseConfigured()) {
    // Local fallback for quick preview if keys are not yet input in settings
    const mockUser: User = {
      id: "local_user_" + Date.now(),
      app_metadata: {},
      user_metadata: { displayName, photoURL: photoURL || defaultAvatar },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: email,
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
    return { data: { user: mockUser, session: null }, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        displayName: displayName,
        photoURL: photoURL || defaultAvatar,
      },
    },
  });

  if (error) throw error;

  // Insert initial profile and settings
  if (data.user) {
    try {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email,
        display_name: displayName,
        photo_url: photoURL || defaultAvatar,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await supabase.from("user_settings").upsert({
        user_id: data.user.id,
        goal_amount: 160000,
        currency: "BDT",
        theme: "light",
        language: "en",
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Could not insert initial profile row to Supabase table:", e);
    }
  }

  return { data, error: null };
}

export async function signInAsGuest(displayName: string = "Umrah Pilgrim") {
  const guestId = "guest_user_" + Date.now();
  const guestUser: User = {
    id: guestId,
    app_metadata: {},
    user_metadata: { displayName, photoURL: defaultAvatar },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email: "guest@umrahsavings.app",
  };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(guestUser));
  return { data: { user: guestUser, session: null }, error: null };
}

export async function signInUser(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (raw) {
      const mockUser = JSON.parse(raw);
      if (mockUser.email === email) {
        return { data: { user: mockUser, session: null }, error: null };
      }
    }
    // Create guest/demo session
    const mockUser: User = {
      id: "local_user_1",
      app_metadata: {},
      user_metadata: { displayName: email.split("@")[0] || "Explorer", photoURL: defaultAvatar },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: email,
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
    return { data: { user: mockUser, session: null }, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
  return { data, error: null };
}

export async function signOutUser() {
  if (!isSupabaseConfigured()) {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    return { error: null };
  }
  return await supabase.auth.signOut();
}

export async function resetPasswordForUser(email: string) {
  if (!isSupabaseConfigured()) {
    return { data: {}, error: null };
  }
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return { data, error: null };
}

export async function updateUserProfile(displayName: string, photoURL?: string) {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      u.user_metadata = { ...u.user_metadata, displayName, photoURL: photoURL || defaultAvatar };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(u));
    }
    return { data: {}, error: null };
  }

  const { data, error } = await supabase.auth.updateUser({
    data: {
      displayName,
      photoURL: photoURL || defaultAvatar,
    },
  });

  if (error) throw error;
  return { data, error: null };
}

/* =========================================================
   DATABASE QUERIES & CRUD
   ========================================================= */

// 1. User Settings
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const defaultSettings: UserSettings = {
    goalAmount: 160000,
    currency: "BDT",
    theme: "light",
    language: "en",
  };

  if (!isSupabaseConfigured()) {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_SETTINGS_KEY}_${userId}`);
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  }

  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return defaultSettings;
    }

    return {
      goalAmount: Number(data.goal_amount) || 160000,
      currency: data.currency || "BDT",
      theme: (data.theme as 'light' | 'dark') || "light",
      language: (data.language as 'en' | 'bn') || "en",
    };
  } catch (err) {
    console.warn("Error getting user settings from Supabase, falling back to defaults:", err);
    return defaultSettings;
  }
}

export async function saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
  // Always update local cache
  localStorage.setItem(`${LOCAL_STORAGE_SETTINGS_KEY}_${userId}`, JSON.stringify(settings));

  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from("user_settings").upsert({
      user_id: userId,
      goal_amount: settings.goalAmount,
      currency: settings.currency,
      theme: settings.theme,
      language: settings.language,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Could not save settings to Supabase table:", err);
  }
}

// 2. User Profile
export async function getUserProfile(userId: string, fallbackEmail: string = ""): Promise<UserProfile> {
  const defaultProf: UserProfile = {
    uid: userId,
    email: fallbackEmail,
    displayName: "Explorer",
    photoURL: defaultAvatar,
    createdAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PROFILE_KEY}_${userId}`);
    if (saved) {
      try {
        return { ...defaultProf, ...JSON.parse(saved) };
      } catch (e) {
        return defaultProf;
      }
    }
    return defaultProf;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      return defaultProf;
    }

    return {
      uid: data.id,
      email: data.email || fallbackEmail,
      displayName: data.display_name || "Explorer",
      photoURL: data.photo_url || defaultAvatar,
      createdAt: data.created_at || new Date().toISOString(),
    };
  } catch (err) {
    console.warn("Error getting user profile from Supabase:", err);
    return defaultProf;
  }
}

export async function saveUserProfile(userId: string, profile: { displayName: string; photoURL: string; email?: string }): Promise<void> {
  localStorage.setItem(
    `${LOCAL_STORAGE_PROFILE_KEY}_${userId}`,
    JSON.stringify({ ...profile, uid: userId, createdAt: new Date().toISOString() })
  );

  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from("profiles").upsert({
      id: userId,
      display_name: profile.displayName,
      photo_url: profile.photoURL,
      email: profile.email,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Could not save profile to Supabase table:", err);
  }
}

// 3. Savings Entries
export async function getSavingsEntries(userId: string): Promise<SavingsEntry[]> {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_ENTRIES_KEY}_${userId}`);
    if (raw) {
      try {
        const parsed: SavingsEntry[] = JSON.parse(raw);
        return parsed.sort((a, b) => b.date.localeCompare(a.date));
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("savings_entries")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      console.warn("Supabase query error for savings_entries:", error);
      // Fallback to local cache if table is not yet created
      const raw = localStorage.getItem(`${LOCAL_STORAGE_ENTRIES_KEY}_${userId}`);
      return raw ? JSON.parse(raw) : [];
    }

    const mapped: SavingsEntry[] = (data || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      day: row.day,
      dailyMoney: Number(row.daily_money) || 0,
      extraMoney: Number(row.extra_money) || 0,
      source: row.source || "Other",
      expense: Number(row.expense) || 0,
      todaySavings: Number(row.today_savings) || 0,
      notes: row.notes || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Cache to local storage
    localStorage.setItem(`${LOCAL_STORAGE_ENTRIES_KEY}_${userId}`, JSON.stringify(mapped));
    return mapped;
  } catch (err) {
    console.warn("Failed to fetch savings entries from Supabase:", err);
    const raw = localStorage.getItem(`${LOCAL_STORAGE_ENTRIES_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function addSavingsEntry(
  userId: string,
  entry: {
    date: string;
    day: string;
    dailyMoney: number;
    extraMoney: number;
    source: string;
    expense: number;
    notes: string;
  }
): Promise<SavingsEntry> {
  const todaySavings = entry.dailyMoney + entry.extraMoney - entry.expense;
  const newId = "entry_" + Date.now().toString() + "_" + Math.random().toString(36).substring(2, 7);

  const newEntry: SavingsEntry = {
    id: newId,
    date: entry.date,
    day: entry.day,
    dailyMoney: entry.dailyMoney,
    extraMoney: entry.extraMoney,
    source: entry.source || "Other",
    expense: entry.expense,
    todaySavings,
    notes: entry.notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Local storage save
  const existing = await getSavingsEntries(userId);
  const updatedList = [newEntry, ...existing.filter((e) => e.id !== newId)].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  localStorage.setItem(`${LOCAL_STORAGE_ENTRIES_KEY}_${userId}`, JSON.stringify(updatedList));

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("savings_entries").insert({
        id: newId,
        user_id: userId,
        date: entry.date,
        day: entry.day,
        daily_money: entry.dailyMoney,
        extra_money: entry.extraMoney,
        source: entry.source || "Other",
        expense: entry.expense,
        today_savings: todaySavings,
        notes: entry.notes || "",
        created_at: newEntry.createdAt,
        updated_at: newEntry.updatedAt,
      });

      if (error) {
        console.warn("Error inserting entry into Supabase table:", error);
      }
    } catch (e) {
      console.warn("Could not insert into Supabase table:", e);
    }
  }

  return newEntry;
}

export async function editSavingsEntry(
  userId: string,
  id: string,
  updatedData: {
    date: string;
    day: string;
    dailyMoney: number;
    extraMoney: number;
    source: string;
    expense: number;
    notes: string;
  }
): Promise<void> {
  const todaySavings = updatedData.dailyMoney + updatedData.extraMoney - updatedData.expense;
  const now = new Date().toISOString();

  // Local storage update
  const existing = await getSavingsEntries(userId);
  const updatedList = existing.map((e) => {
    if (e.id === id) {
      return {
        ...e,
        ...updatedData,
        todaySavings,
        updatedAt: now,
      };
    }
    return e;
  }).sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(`${LOCAL_STORAGE_ENTRIES_KEY}_${userId}`, JSON.stringify(updatedList));

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from("savings_entries")
        .update({
          date: updatedData.date,
          day: updatedData.day,
          daily_money: updatedData.dailyMoney,
          extra_money: updatedData.extraMoney,
          source: updatedData.source || "Other",
          expense: updatedData.expense,
          today_savings: todaySavings,
          notes: updatedData.notes || "",
          updated_at: now,
        })
        .eq("id", id)
        .eq("user_id", userId);
    } catch (e) {
      console.warn("Could not update Supabase entry:", e);
    }
  }
}

export async function removeSavingsEntry(userId: string, id: string): Promise<void> {
  // Local storage removal
  const existing = await getSavingsEntries(userId);
  const filtered = existing.filter((e) => e.id !== id);
  localStorage.setItem(`${LOCAL_STORAGE_ENTRIES_KEY}_${userId}`, JSON.stringify(filtered));

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from("savings_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
    } catch (e) {
      console.warn("Could not delete Supabase entry:", e);
    }
  }
}

// 4. Quotes
export async function getQuotes(): Promise<IslamicQuote[]> {
  if (!isSupabaseConfigured()) {
    return defaultIslamicQuotes;
  }

  try {
    const { data, error } = await supabase.from("quotes").select("*");
    if (error || !data || data.length === 0) {
      // Seed quotes if table is empty
      try {
        for (const q of defaultIslamicQuotes) {
          await supabase.from("quotes").upsert({
            id: q.id,
            en: q.en,
            bn: q.bn,
            source: q.source,
          });
        }
      } catch (seedErr) {
        console.warn("Could not seed quotes in Supabase:", seedErr);
      }
      return defaultIslamicQuotes;
    }

    return data.map((q: any) => ({
      id: q.id,
      en: q.en,
      bn: q.bn,
      source: q.source,
    }));
  } catch (err) {
    return defaultIslamicQuotes;
  }
}
