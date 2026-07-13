import React, { useState } from "react";
import { Compass, Menu, X, LayoutDashboard, FileSpreadsheet, PlusCircle, DollarSign, Wallet, Settings, LogOut, Sun, Moon, Languages } from "lucide-react";
import { translations } from "../utils/translations";
import defaultAvatar from "../assets/images/user_profile_pic_1783927457570.jpg";

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  lang: 'en' | 'bn';
  setLang: (lang: 'en' | 'bn') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Navbar({
  currentTab,
  setTab,
  user,
  onLogout,
  lang,
  setLang,
  theme,
  toggleTheme
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang];

  const menuItems = [
    { id: "dashboard", label: t.dashboard, icon: LayoutDashboard },
    { id: "newEntry", label: t.newEntry, icon: PlusCircle },
    { id: "reports", label: t.reports, icon: FileSpreadsheet },
    { id: "extraMoney", label: t.extraMoney, icon: DollarSign },
    { id: "expenses", label: t.expenses, icon: Wallet },
    { id: "settings", label: t.settings, icon: Settings },
  ];

  return (
    <nav className="bg-emerald-900 text-white sticky top-0 z-40 border-b border-emerald-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTab("dashboard")}>
            <div className="bg-amber-400 p-2 rounded-xl text-emerald-950 shadow-inner">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-lg md:text-xl tracking-tight text-white flex items-center gap-1">
                {t.appName}
              </h1>
              <p className="text-[10px] text-emerald-200 hidden sm:block font-mono tracking-wide">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-amber-500 text-emerald-950 font-semibold shadow-md"
                      : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Quick Controls & Profile */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-emerald-100 hover:bg-emerald-800 hover:text-white transition-colors"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-emerald-700/80 bg-emerald-850 text-emerald-100 hover:bg-emerald-800 transition-colors"
            >
              <Languages className="w-3.5 h-3.5" />
              {lang === 'en' ? "বাংলা" : "English"}
            </button>

            {/* Profile Dropdown */}
            {user && (
              <div className="flex items-center gap-2 border-l border-emerald-800 pl-4">
                <img
                  src={user.photoURL || defaultAvatar}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-amber-400 object-cover shadow-inner"
                />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-white max-w-[120px] truncate">
                    {user.displayName || "User"}
                  </p>
                  <button
                    onClick={onLogout}
                    className="text-[10px] text-emerald-300 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    {t.logout}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Quick Lang Toggle on Mobile header */}
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1 p-1 px-2 text-xs font-semibold rounded-lg bg-emerald-800 text-emerald-100 mr-1"
            >
              {lang === 'en' ? "বাং" : "EN"}
            </button>

            <button
              onClick={toggleTheme}
              className="p-1 rounded-lg text-emerald-100 mr-1"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-emerald-100 hover:bg-emerald-800 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-emerald-950 border-t border-emerald-850 animate-fade-in">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive
                      ? "bg-amber-500 text-emerald-950 font-bold"
                      : "text-emerald-100 hover:bg-emerald-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}

            {/* Profile info & logout for mobile */}
            {user && (
              <div className="pt-4 pb-2 border-t border-emerald-900 mt-4 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={user.photoURL || defaultAvatar}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-xs text-emerald-300">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-950/40"
                >
                  <LogOut className="w-4 h-4" />
                  {t.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
