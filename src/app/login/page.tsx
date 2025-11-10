"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  const handleLogin = async () => {
    setError("");
    setSuccess("");
    setNeedsVerification(false);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        setNeedsVerification(true);
        setError("Please verify your email address before logging in. Check your inbox and spam folder.");
        await auth.signOut();
        return;
      }
      
      router.push("/journal");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    
    setResendLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (user.emailVerified) {
        setSuccess("Your email is already verified! You can now log in.");
        setNeedsVerification(false);
        await auth.signOut();
        return;
      }
      
      await sendEmailVerification(user);
      setSuccess("Verification email sent! Please check your inbox and spam folder.");
      await auth.signOut();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to resend verification email";
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setResetLoading(true);
    setError("");
    setSuccess("");

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSuccess(true);
      setSuccess("Password reset email sent! Please check your inbox and spam folder.");
    } catch (err) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/user-not-found') {
        setError("No account found with this email address.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else {
        setError(error.message || "Failed to send password reset email.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleShowForgotPassword = () => {
    setShowForgotPassword(true);
    setResetEmail(email);
    setError("");
    setSuccess("");
    setResetSuccess(false);
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setError("");
    setSuccess("");
    setResetSuccess(false);
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col overflow-hidden relative">
      {/* Background mesh + subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(60rem 60rem at 10% -10%, rgba(129, 140, 248, 0.25), transparent 50%)," +
            "radial-gradient(45rem 45rem at 110% 10%, rgba(236, 72, 153, 0.22), transparent 50%)," +
            "radial-gradient(35rem 35rem at 20% 110%, rgba(34, 197, 94, 0.18), transparent 55%)",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)",
          backgroundSize: "24px 24px, 24px 24px",
          backgroundPosition: "-1px -1px",
        }}
      />

      {/* Top Brand Bar */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between relative">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shadow-inner">
              <span className="text-xl">📝</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-white via-indigo-100 to-pink-100 bg-clip-text text-transparent drop-shadow-sm">
              MoodMirror
            </h1>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-white/90 hover:text-white text-sm font-medium transition-colors"
          >
            ← Back to Home
          </button>
        </div>
        <div className="absolute -bottom-[1px] left-0 right-0" aria-hidden>
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-12 fill-white/70">
            <path d="M0,64 C240,16 480,16 720,48 C960,80 1200,80 1440,48 L1440,80 L0,80 Z"></path>
          </svg>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 w-full relative flex items-center justify-center py-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-[-120px] top-10 w-80 h-80 bg-gradient-to-br from-pink-300/40 to-indigo-300/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute left-[-120px] bottom-10 w-80 h-80 bg-gradient-to-br from-purple-300/40 to-yellow-300/40 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className={`relative max-w-md w-full mx-auto px-6 transform transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <div className="p-[1.5px] rounded-[28px] bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300">
            <div className="bg-white/85 backdrop-blur-xl rounded-[26px] shadow-2xl border border-white/60 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6 text-center">
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Welcome Back</h2>
                <p className="text-indigo-100 text-sm">Sign in to continue your journey</p>
              </div>

              {/* Form */}
              <div className="p-8">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M1.5 8.67v6.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-9.3 5.27a3 3 0 01-3 0L1.5 8.67z" />
                          <path d="M22.5 6.75v-.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.75l9.3 5.27a3 3 0 003 0l8.7-4.98z" />
                        </svg>
                      </span>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-gray-900"
                        aria-label="Email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25V9H6A2.25 2.25 0 003.75 11.25v7.5A2.25 2.25 0 006 21h12a2.25 2.25 0 002.25-2.25v-7.5A2.25 2.25 0 0018 9h-.75V6.75A5.25 5.25 0 0012 1.5zm-3.75 7.5V6.75a3.75 3.75 0 117.5 0V9H8.25z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-gray-900"
                        aria-label="Password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 px-2 flex items-center text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M3.53 2.47a.75.75 0 10-1.06 1.06l18 18a.75.75 0 101.06-1.06l-2.158-2.158A11.64 11.64 0 0021.75 12C20.86 9.39 17.26 4.5 12 4.5c-1.22 0-2.35.27-3.37.73L3.53 2.47zM7.06 6l2.03 2.03A5.25 5.25 0 0117.97 16.9l1.28 1.28A10.14 10.14 0 0020.25 12c-.74-2.04-3.79-6.75-8.25-6.75-1.76 0-3.27.6-4.94 1.7z" />
                            <path d="M15.53 12.75a3.75 3.75 0 01-3.28 3.28l3.28-3.28zM8.47 11.25l-2.5-2.5C4.06 10.36 2.95 11.88 2.25 12c.89 2.61 4.49 7.5 9.75 7.5 1.11 0 2.16-.2 3.13-.56l-2.74-2.74a5.25 5.25 0 01-3.92-3.95z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M12 4.5c5.26 0 8.86 4.89 9.75 7.5-.89 2.61-4.49 7.5-9.75 7.5S3.14 14.61 2.25 12C3.14 9.39 6.74 4.5 12 4.5zm0 3a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      ⚠️ {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                      ✅ {success}
                    </div>
                  )}

                  {needsVerification && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M1.5 8.67v6.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                            <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-blue-800 text-sm font-medium mb-2">Email Verification Required</p>
                          <p className="text-blue-700 text-sm mb-3">
                            Please check your email and click the verification link to complete your account setup.
                          </p>
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleResendVerification}
                            disabled={resendLoading}
                          >
                            {resendLoading ? "Sending..." : "Resend verification email"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[0_12px_24px_-12px_rgba(79,70,229,0.6)] active:scale-[0.99]"
                    onClick={handleLogin}
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>

                  <button
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-sm active:scale-[0.99]"
                    onClick={() => router.push('/register')}
                  >
                    Create an account
                  </button>

                  <div className="flex items-center justify-center">
                    <button 
                      className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                      onClick={handleShowForgotPassword}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <div className="mt-6 text-center text-xs text-gray-500">
                  By continuing you agree to MoodMirror&apos;s guidelines for reflective, supportive journaling.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center text-gray-500 text-xs">
        © {new Date().getFullYear()} MoodMirror — Reflect • Understand • Nourish
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Reset Password</h3>
                <button
                  onClick={handleCloseForgotPassword}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {!resetSuccess ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25V9H6A2.25 2.25 0 003.75 11.25v7.5A2.25 2.25 0 006 21h12a2.25 2.25 0 002.25-2.25v-7.5A2.25 2.25 0 0018 9h-.75V6.75A5.25 5.25 0 0012 1.5zm-3.75 7.5V6.75a3.75 3.75 0 117.5 0V9H8.25z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Enter your email address and we&apos;ll send you a link to reset your password.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M1.5 8.67v6.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-9.3 5.27a3 3 0 01-3 0L1.5 8.67z" />
                            <path d="M22.5 6.75v-.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.75l9.3 5.27a3 3 0 003 0l8.7-4.98z" />
                          </svg>
                        </span>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-gray-900"
                          aria-label="Email for password reset"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        ⚠️ {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleCloseForgotPassword}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleForgotPassword}
                        disabled={resetLoading}
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resetLoading ? "Sending..." : "Send Reset Email"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 text-green-700 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Email Sent!</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    We&apos;ve sent a password reset link to <strong>{resetEmail}</strong>. Please check your inbox and spam folder.
                  </p>
                  
                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
                      ✅ {success}
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={handleForgotPassword}
                      disabled={resetLoading}
                      className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      {resetLoading ? "Sending..." : "Resend reset email"}
                    </button>
                    <button
                      onClick={handleCloseForgotPassword}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    >
                      Back to login
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

