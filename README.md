# 🕋 Umrah Savings Tracker

**Umrah Savings Tracker** is a professional, production-ready, highly polished personal finance web application specifically designed to help Muslims save money for their sacred pilgrimage of Umrah. Built with modern React, Tailwind CSS, Recharts, and Google Firebase, it provides automatic calculations, real-time data synchronization, progress milestone alerts, interactive charts, and rich exports (CSV & printable PDFs).

---

## 🌟 Key Features

* **Real-time Real DB Updates**: Fully integrated with Firebase Firestore and Authentication. Subscribes to real-time listeners for instant dashboard updates without page refreshes.
* **Intelligent Dashboard**: Automatically calculates Goal Amount, Current Savings, Remaining Amount, Progress Percentage, Daily & Monthly Averages, and Estimated Completion Date.
* **Circular & Linear Progress Indicators**: Dynamic SVG gauges and multi-level milestone nodes (25%, 50%, 75%, 100%) celebrating achievements.
* **Automatic Day & Savings Engine**: Select a date and the system instantly identifies the weekday. Compute daily money plus extra sponsors, minus expenses automatically.
* **Separated Analytical Subpages**: Fully isolated reports specifically designed to monitor Gift/Extra contributions and outflow expenses.
* **Stunning Data Visualizations**: Interactive responsive charts including Savings Growth, Monthly Savings, Expense Breakdown, and Sponsor Contributions.
* **Dual Language & Theme Support**: Effortlessly toggle between English and Bangla (`বাংলা`), and transition smoothly between elegant Light and Dark glassmorphic modes.
* **Sleek PDF & CSV Exports**: Instant structured CSV spreadsheet downloads and beautifully styled printable reports formatted for physical printing or PDF generation.

---

## 📁 Project Folder Structure

```text
├── /assets/                    # Visual assets and platform settings
├── /src/
│   ├── /components/            # Modular reusable React UI views
│   │   ├── AuthView.tsx        # Secure register, login, & password reset
│   │   ├── Navbar.tsx          # Responsive navigation & language toggles
│   │   ├── DashboardOverview.tsx # Metrics counters & circular progress UI
│   │   ├── DailyEntryForm.tsx  # Savings and expense calculator form
│   │   ├── ReportsTab.tsx      # Comprehensive monthly & yearly tables
│   │   ├── ExtraMoneyTab.tsx   # Gift & sponsor contribution logs
│   │   ├── ExpenseTab.tsx      # Outflow expense detail lists
│   │   ├── ChartsView.tsx      # Interactive Recharts layouts
│   │   ├── SettingsTab.tsx     # Custom goals, currency, & profile manager
│   │   └── Toast.tsx           # Sleek status and milestone alerts
│   ├── /utils/
│   │   ├── helpers.ts          # Formatting, weekday, and export scripts
│   │   └── translations.ts     # Multi-lingual localization keys
│   ├── firebase.ts             # Firebase client SDK initialization
│   ├── types.ts                # Strict TypeScript interface declarations
│   ├── App.tsx                 # Core parent component & real-time listeners
│   ├── index.css               # Global stylesheets with Tailwind & Fonts
│   └── main.tsx                # Entry point
├── index.html                  # HTML template with SEO meta tags
├── package.json                # Project dependencies
├── tsconfig.json               # Strict TypeScript configuration
└── vite.config.ts              # Vite configurations with alias paths
```

---

## ⚙️ Environment & Local Setup Instructions

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) and [npm](https://www.npmjs.com/) installed on your machine.

### Installation & Run

1. **Clone or Download the Project**:
   Download the source files and extract them to a local folder.

2. **Install Dependencies**:
   Open a terminal in the project directory and run:
   ```bash
   npm install
   ```

3. **Configure Your Own Firebase Project**:
   The application is pre-configured with a sandbox project. To connect to your own Firestore and Auth databases:
   * Create a free project on the [Firebase Console](https://console.firebase.google.com/).
   * Enable **Email/Password Provider** in Firebase Authentication.
   * Provision a **Cloud Firestore** database.
   * Register a new **Web App** in the project settings to get your API Credentials.
   * Open `/src/firebase.ts` and replace the `firebaseConfig` properties with your credentials:
     ```typescript
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
     };
     ```

4. **Launch Local Development Server**:
   Start Vite's super-fast development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000` to start tracking your savings!

---

## 🛡️ Database Security Rules (`firestore.rules`)

To protect your users' private data, apply the following Firestore Rules from the Firebase Console rules editor tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🚀 Deployment Guide

### Option 1: Deploy to Firebase Hosting
1. Install the Firebase CLI tool globally:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and initialize the project:
   ```bash
   firebase login
   firebase init hosting
   ```
   * Choose **Existing Project** and select your created Firebase project.
   * When asked for the public directory, type `dist` (Vite's production build directory).
   * Configure as a single-page app: **Yes**.
3. Compile the production package:
   ```bash
   npm run build
   ```
4. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

---

## 📂 Uploading to Your Own GitHub Repository

1. Initialize git locally:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Umrah Savings Tracker"
   ```
2. Create a new repository on [GitHub](https://github.com/).
3. Connect and push your local branch:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---

*Assalamu Alaikum! May Allah accept your holy intention of visiting His House and grant you an accepted Umrah. Ameen!*
