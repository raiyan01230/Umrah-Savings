import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { motion } from "motion/react";
import { Mail, Lock, User, Image, ArrowRight, Compass, ShieldCheck } from "lucide-react";
import defaultAvatar from "../assets/images/user_profile_pic_1783927457570.jpg";

interface AuthViewProps {
  onNotify: (text: string, type: 'success' | 'error' | 'info') => void;
  lang: 'en' | 'bn';
}

const getFriendlyErrorMessage = (error: any, lang: 'en' | 'bn'): string => {
  if (!error) return "";
  const code = error.code || "";
  
  if (code === 'auth/operation-not-allowed') {
    return lang === 'bn' 
      ? "ফায়ারবেস অথেন্টিকেশন ত্রুটি: আপনার ফায়ারবেস কনসোলে 'Email/Password' সাইন-ইন পদ্ধতি নিষ্ক্রিয় করা আছে। দয়া করে Firebase Console -> Authentication -> Sign-in method-এ গিয়ে 'Email/Password' সক্রিয় করুন।"
      : "Firebase Authentication Error: The 'Email/Password' sign-in provider is disabled in your Firebase Console. Please go to Firebase Console -> Authentication -> Sign-in method, and enable 'Email/Password'.";
  }
  
  if (code === 'auth/email-already-in-use') {
    return lang === 'bn'
      ? "এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে।"
      : "This email address is already in use by another account.";
  }
  
  if (code === 'auth/invalid-email') {
    return lang === 'bn'
      ? "দয়া করে একটি সঠিক ইমেল ঠিকানা প্রদান করুন।"
      : "Please enter a valid email address.";
  }
  
  if (code === 'auth/weak-password') {
    return lang === 'bn'
      ? "পাসওয়ার্ডটি অত্যন্ত দুর্বল। এটি কমপক্ষে ৬ অক্ষরের হতে হবে।"
      : "The password is too weak. It must be at least 6 characters.";
  }
  
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return lang === 'bn'
      ? "ভুল ইমেল বা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় চেষ্টা করুন।"
      : "Incorrect email or password. Please try again.";
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
  const [verificationSent, setVerificationSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onNotify(lang === 'bn' ? "লগইন সফল হয়েছে!" : "Logged in successfully!", 'success');
    } catch (error: any) {
      console.error(error);
      onNotify(getFriendlyErrorMessage(error, lang), 'error');
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
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile
      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL || defaultAvatar
      });

      // Send verification email
      await sendEmailVerification(user);
      setVerificationSent(true);

      // Create initial settings and profile doc
      await setDoc(doc(db, "users", user.uid), {
        profile: {
          uid: user.uid,
          email: user.email,
          displayName: displayName,
          photoURL: photoURL || defaultAvatar,
          createdAt: new Date().toISOString()
        },
        settings: {
          goalAmount: 160000,
          currency: "BDT",
          theme: "light",
          language: lang
        }
      });

      onNotify(
        lang === 'bn' 
          ? "নিবন্ধন সফল! ইমেইল ভেরিফিকেশনের জন্য ইনবক্স চেক করুন।" 
          : "Registration successful! Please check your email to verify your account.", 
        'success'
      );
      setMode('login');
    } catch (error: any) {
      console.error(error);
      onNotify(getFriendlyErrorMessage(error, lang), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      onNotify(
        lang === 'bn' 
          ? "পাসওয়ার্ড রিসেট ইমেল পাঠানো হয়েছে!" 
          : "Password reset email sent successfully!", 
        'success'
      );
      setMode('login');
    } catch (error: any) {
      console.error(error);
      onNotify(getFriendlyErrorMessage(error, lang), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Star/Islamic Patterns in background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
        <Compass className="w-96 h-96 text-amber-400 animate-spin-slow" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full space-y-8 bg-white/10 dark:bg-slate-950/40 backdrop-blur-md p-8 rounded-2xl border border-white/20 dark:border-slate-800/80 shadow-2xl"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40">
            <Compass className="h-10 w-10 text-amber-400" />
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white font-sans">
            {lang === 'bn' ? "ওমরাহ সঞ্চয় ট্র্যাকার" : "Umrah Savings Tracker"}
          </h2>
          <p className="mt-2 text-sm text-emerald-200">
            {lang === 'bn' ? "ওমরাহ সঞ্চয় ট্র্যাকার ও সহযোগী" : "Your Companion for Umrah Savings"}
          </p>
        </div>

        {verificationSent && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 p-4 rounded-xl text-emerald-100 text-sm flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">{lang === 'bn' ? 'যাচাইকরণ ইমেল পাঠানো হয়েছে!' : 'Verification Email Sent!'}</span>
              <p className="mt-1 opacity-90">
                {lang === 'bn' 
                  ? 'আপনার অ্যাকাউন্টে লগইন করার পূর্বে অনুগ্রহ করে ইমেলটি যাচাই করুন।' 
                  : 'Please check your email and verify your account before logging in.'}
              </p>
            </div>
          </div>
        )}

        {mode === 'login' && (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md space-y-4">
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
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder={lang === 'bn' ? "ইমেল ঠিকানা" : "Email address"}
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
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder={lang === 'bn' ? "পাসওয়ার্ড" : "Password"}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                {lang === 'bn' ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot your password?"}
              </button>
            </div>

            <div>
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
            </div>

            <div className="text-center text-sm text-emerald-200">
              {lang === 'bn' ? "নতুন অ্যাকাউন্ট প্রয়োজন?" : "Need an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                {lang === 'bn' ? "নিবন্ধন করুন" : "Register Now"}
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form className="mt-8 space-y-4" onSubmit={handleRegister}>
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
                  placeholder={lang === 'bn' ? "পাসওয়ার্ড (কমপক্ষে ৬ ডিজিট)" : "Password (min 6 chars)"}
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

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-emerald-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? (lang === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating Account...') : (lang === 'bn' ? "নিবন্ধন সম্পূর্ণ করুন" : "Complete Registration")}
              </button>
            </div>

            <div className="text-center text-sm text-emerald-200">
              {lang === 'bn' ? "ইতিমধ্যে অ্যাকাউন্ট আছে?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                {lang === 'bn' ? "প্রবেশ করুন" : "Sign In"}
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            <div className="rounded-md space-y-4">
              <p className="text-sm text-emerald-100 text-center">
                {lang === 'bn' 
                  ? "আপনার ইমেল প্রবেশ করুন, আমরা আপনাকে পাসওয়ার্ড রিসেট করার জন্য একটি লিঙ্ক পাঠাব।" 
                  : "Enter your email address and we will send you a link to reset your password."}
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

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-emerald-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? (lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') : (lang === 'bn' ? "রিসেট লিংক পাঠান" : "Send Reset Link")}
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-sm text-amber-400 hover:text-amber-300 transition-colors py-2"
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
