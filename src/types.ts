export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
}

export interface UserSettings {
  goalAmount: number;
  currency: string; // e.g. "BDT", "USD", "SAR"
  theme: 'light' | 'dark';
  language: 'en' | 'bn'; // English or Bangla
}

export interface SavingsEntry {
  id: string;
  date: string; // YYYY-MM-DD
  day: string; // Automatically generated day of the week
  dailyMoney: number;
  extraMoney: number;
  source: string; // e.g. "Mother", "Father", "Eid", "Gift", "Relative", "Friend", "Other"
  expense: number;
  todaySavings: number; // calculated: (dailyMoney + extraMoney) - expense
  notes: string;
  createdAt: any; // Firestore Timestamp or ISO string
  updatedAt: any;
}

export interface DashboardStats {
  goalAmount: number;
  currentSavings: number;
  remainingAmount: number;
  progressPercentage: number;
  todaySavings: number;
  thisMonthSavings: number;
  totalExtraMoney: number;
  averageDailySavings: number;
  averageMonthlySavings: number;
  estimatedCompletionDate: string; // e.g. "2026-12-01" or "N/A"
}
