import React, { useState } from "react";
import { signInUser, signUpUser, resetPasswordForUser, signInAsGuest } from "../supabase";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, Image, ArrowRight, Compass, ShieldCheck, UserCheck, AlertCircle, Sparkles } from "lucide-react";
import defaultAvatar from "../assets/images/user_profile_pic_1783927457570.jpg";

interface AuthViewProps {
  onNotify: (text: string, type: 'success' | 'error' | 'info') => void;
  lang: 'en' | 'bn';
}

const getFriendlyErrorMessage = (error: any, lang: 'en' | 'bn'): string => {
  if (!error) return "";
  const msg = (error.message || "").toLowerCase();
  
  if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
    return lang === 'bn' 
      ? "ইমেল বা পাসওয়ার্ড সঠিক নয়। যদি আপনার অ্যাকাউন্ট না থাকে, তবে অনুগ্রহ করে 'নিবন্ধন করুন'।"
      : "Invalid email or password. If you don't have an account yet, please click 'Register Now'.";
  }
  
  if (msg.includes("user already registered") || msg.includes("already exists")) {
    return lang === 'bn'
      ? "এই ইমেইলটি ইতিমধ্যে নিবন্ধিত হয়েছে। দয়া করে লগইন করুন।"
      : "This email address is already registered. Please sign in.";
  }
  
  if (msg.includes("valid email") || msg.includes("invalid format")) {
    return lang === 'bn'
      ? "দয়া করে একটি সঠিক ইমেল ঠিকানা প্রদান করুন।"
      : "Please enter a valid email address.";
  }
  
  if (msg.includes("password should be at least") || msg.includes("weak")) {
    return lang === 'bn'
      ? "পাসওয়ার্ডটি কমপক্ষে ৬ অক্ষরের হতে হবে।"
      : "Password must be at least 6 characters.";
  }

  return error.message || (lang === 'bn' ? "একটি ত্রুটি ঘটেছে। দয়া করে আবার চেষ্টা করুন।" : "An error occurred. Please try again.");
};

export default function AuthView({ onNotify, lang }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [lastAuthError, setLastAuthError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setLastAuthError(null);
    try {
      await signInUser(email, password);
      onNotify(lang === 'bn' ? "লগইন সফল হয়েছে!" : "Logged in successfully!", 'success');
    } catch (error: any) {
      console.error(error);
      const friendly = getFriendlyErrorMessage(error, lang);
      setLastAuthError(friendly);
      onNotify(friendly, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) return;
    if (password !== confirmPassword) {
      onNotify(lang === 'bn' ? "পাসওয়ার্ড মিলছে না!" : "Passwords do not match!", 'error');
      return;
    }
    setLoading(true);
    setLastAuthError(null);
    try {
      const { data } = await signUpUser(email, password, displayName, photoURL || defaultAvatar);
      
      if (data?.session) {
        onNotify(lang === 'bn' ? "অ্যাকাউন্ট তৈরি সফল হয়েছে!" : "Account created successfully!", 'success');
      } else {
        setVerificationSent(true);
        onNotify(
          lang === 'bn' 
            ? "নিবন্ধন সফল! ইমেইল নিশ্চিত করার জন্য আপনার ইনবক্স চেক করুন।" 
            : "Registration successful! Please check your inbox to confirm your email.", 
          'success'
        );
      }
      setMode('login');
    } catch (error: any) {
      console.error(error);
      const friendly = getFriendlyErrorMessage(error, lang);
      setLastAuthError(friendly);
      onNotify(friendly, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      await signInAsGuest(lang === 'bn' ? "ওমরাহ যাত্রী" : "Umrah Pilgrim");
      onNotify(
        lang === 'bn' 
          ? "অতিথি মোডে সফলভাবে প্রবেশ করা হয়েছে!" 
          : "Entered in Guest / Demo mode successfully!", 
        'success'
      );
    } catch (err: any) {
      onNotify(err.message || "Guest login failed", 'error');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setLastAuthError(null);
    try {
      await resetPasswordForUser(email);
      onNotify(
        lang === 'bn' 
          ? "পাসওয়ার্ড রিসেট ইমেল পাঠানো হয়েছে!" 
          : "Password reset email sent successfully!", 
        'success'
      );
      setMode('login');
    } catch (error: any) {
      console.error(error);
      const friendly = getFriendlyErrorMessage(error, lang);
      setLastAuthError(friendly);
      onNotify(friendly, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background visual */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
        <Compass className="w-96 h-96 text-amber-400 animate-spin-slow" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full space-y-6 bg-white/10 dark:bg-slate-950/40 backdrop-blur-md p-8 rounded-2xl border border-white/20 dark:border-slate-800/80 shadow-2xl"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 shadow-inner">
            <Compass className="h-10 w-10 text-amber-400" />
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white font-sans">
            {lang === 'bn' ? "ওমরাহ সঞ্চয় ট্র্যাকার" : "Umrah Savings Tracker"}
          </h2>
          <p className="mt-2 text-sm text-emerald-200">
            {lang === 'bn' ? "আপনার ওমরাহর স্বপ্ন বাস্তবায়নের পথ" : "Track & achieve your sacred pilgrimage goals"}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex rounded-xl bg-black/20 p-1 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => { setMode('login'); setLastAuthError(null); }}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              mode === 'login' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-emerald-200 hover:text-white'
            }`}
          >
            {lang === 'bn' ? "প্রবেশ করুন (লগইন)" : "Sign In"}
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setLastAuthError(null); }}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              mode === 'register' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-emerald-200 hover:text-white'
            }`}
          >
            {lang === 'bn' ? "নতুন অ্যাকাউন্ট" : "Register"}
          </button>
        </div>

        {verificationSent && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 p-4 rounded-xl text-emerald-100 text-sm flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">{lang === 'bn' ? 'যাচাইকরণ ইমেল পাঠানো হয়েছে!' : 'Verification Email Sent!'}</span>
              <p className="mt-1 opacity-90 text-xs">
                {lang === 'bn' 
                  ? 'আপনার অ্যাকাউন্টে লগইন করার পূর্বে অনুগ্রহ করে ইমেলটি যাচাই করুন।' 
                  : 'Please check your email and verify your account before logging in.'}
              </p>
            </div>
          </div>
        )}

        {/* Inline Error Helper Card if credentials fail */}
        <AnimatePresence>
          {lastAuthError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-500/15 border border-amber-400/30 p-3.5 rounded-xl text-amber-200 text-xs flex gap-2.5 items-start"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <p className="font-medium text-amber-100">{lastAuthError}</p>
                {mode === 'login' && (
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDisplayName(email.split('@')[0] || "Pilgrim");
                        setMode('register');
                        setLastAuthError(null);
                      }}
                      className="underline font-semibold text-amber-300 hover:text-white text-xs inline-flex items-center gap-1"
                    >
                      {lang === 'bn' ? "👉 এখনই এই ইমেইল দিয়ে নিবন্ধন করুন" : "👉 Create new account with this email"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {mode === 'login' && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="rounded-md space-y-3">
              <div>
                <label className="sr-only">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-emerald-300" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setLastAuthError(null); }}
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder={lang === 'bn' ? "আপনার ইমেল ঠিকানা" : "Email address"}
                  />
                </div>
              </div>
              <div>
                <label className="sr-only">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-emerald-300" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLastAuthError(null); }}
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder={lang === 'bn' ? "পাসওয়ার্ড" : "Password"}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setLastAuthError(null); }}
                className="font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                {lang === 'bn' ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot password?"}
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-emerald-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? (lang === 'bn' ? 'প্রবেশ করা হচ্ছে...' : 'Signing in...') : (
                  <span className="flex items-center gap-2">
                    {lang === 'bn' ? "প্রবেশ করুন" : "Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>

              {/* Guest Login Option */}
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={guestLoading || loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 hover:text-white text-xs font-medium transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {guestLoading 
                  ? (lang === 'bn' ? 'প্রবেশ হচ্ছে...' : 'Entering...') 
                  : (lang === 'bn' ? 'গেস্ট / ডেমো মোডে প্রবেশ করুন' : 'Instant Guest / Demo Mode')}
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form className="space-y-3.5" onSubmit={handleRegister}>
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-emerald-300" />
                </div>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder={lang === 'bn' ? "আপনার পূর্ণ নাম" : "Your Full Name"}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-emerald-300" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder={lang === 'bn' ? "ইমেল ঠিকানা" : "Email Address"}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Image className="h-5 w-5 text-emerald-300" />
                </div>
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder={lang === 'bn' ? "প্রোফাইল ছবি ইউআরএল (ঐচ্ছিক)" : "Profile Picture URL (Optional)"}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-emerald-300" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder={lang === 'bn' ? "পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" : "Password (min 6 chars)"}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-emerald-300" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder={lang === 'bn' ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm Password"}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-emerald-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? (lang === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating Account...') : (
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    {lang === 'bn' ? "নিবন্ধন সম্পন্ন করুন" : "Complete Registration"}
                  </span>
                )}
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form className="space-y-4" onSubmit={handleForgotPassword}>
            <div className="rounded-md space-y-3">
              <p className="text-xs text-emerald-100 text-center leading-relaxed">
                {lang === 'bn' 
                  ? "আপনার ইমেল প্রবেশ করুন, আমরা আপনাকে পাসওয়ার্ড রিসেট করার জন্য একটি লিঙ্ক পাঠাব।" 
                  : "Enter your registered email address and we will send you a password reset link."}
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-emerald-300" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder={lang === 'bn' ? "ইমেল ঠিকানা" : "Email address"}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-emerald-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? (lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') : (lang === 'bn' ? "রিসেট লিংক পাঠান" : "Send Reset Link")}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setLastAuthError(null); }}
                className="w-full text-center text-xs text-amber-400 hover:text-amber-300 transition-colors py-1.5"
              >
                {lang === 'bn' ? "লগইন এ ফিরে যান" : "Back to Sign In"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
