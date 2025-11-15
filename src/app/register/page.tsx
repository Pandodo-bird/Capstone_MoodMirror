"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Enable subtle entrance animations on mount (to match login page)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Avoid SSR/client HTML mismatch by rendering only after mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    setVerificationSent(false);
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Set displayName on the auth profile
      await updateProfile(cred.user, { displayName: username.trim() });
      // Persist username to Firestore
      const db = getFirestore();
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        username: username.trim(),
        createdAt: new Date().toISOString(),
        emailVerified: false,
      });
      
      // Send email verification
      await sendEmailVerification(cred.user);
      setVerificationSent(true);
      
      // Clear form fields
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setUsername("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      setError("No user found. Please try registering again.");
      return;
    }
    
    setResendLoading(true);
    setError("");
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccess("Verification email sent again!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to resend verification email";
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col overflow-hidden relative">
      {/* Background mesh + subtle grid (matching login) */}
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between relative z-10">
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
            className="text-white/90 hover:text-white hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-white/20 hover:border-white/40 relative z-20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
              <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
            </svg>
            Back to Home
          </button>
        </div>
        <div className="absolute -bottom-[1px] left-0 right-0 z-0" aria-hidden>
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-12 fill-white/70">
            <path d="M0,64 C240,16 480,16 720,48 C960,80 1200,80 1440,48 L1440,80 L0,80 Z"></path>
          </svg>
        </div>
      </div>

      {/* Register Form */}
      <div className="flex-1 w-full relative flex items-center justify-center py-12">
        {/* Ambient gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-[-120px] top-10 w-80 h-80 bg-gradient-to-br from-pink-300/40 to-indigo-300/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute left-[-120px] bottom-10 w-80 h-80 bg-gradient-to-br from-purple-300/40 to-yellow-300/40 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className={`relative max-w-md w-full mx-auto px-6 transform transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <div className="p-[1.5px] rounded-[28px] bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300">
            <div className="bg-white/85 backdrop-blur-xl rounded-[26px] shadow-2xl border border-white/60 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6 text-center">
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Create Account</h2>
                <p className="text-indigo-100 text-sm">Join MoodMirror and start your journey</p>
              </div>
              {/* Form */}
              <div className="p-8">
                {!verificationSent ? (
                  <>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                              <path d="M12 12c2.485 0 4.5-2.015 4.5-4.5S14.485 3 12 3 7.5 5.015 7.5 7.5 9.515 12 12 12zm0 1.5c-3.038 0-9 1.522-9 4.5V21h18v-3c0-2.978-5.962-4.5-9-4.5z" />
                            </svg>
                          </span>
                          <input
                            type="text"
                            placeholder="your_username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-gray-900"
                            aria-label="Username"
                          />
                        </div>
                      </div>

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
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-gray-900"
                            aria-label="Password"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25V9H6A2.25 2.25 0 003.75 11.25v7.5A2.25 2.25 0 006 21h12a2.25 2.25 0 002.25-2.25v-7.5A2.25 2.25 0 0018 9h-.75V6.75A5.25 5.25 0 0012 1.5zm-3.75 7.5V6.75a3.75 3.75 0 117.5 0V9H8.25z" clipRule="evenodd" />
                            </svg>
                          </span>
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-gray-900"
                            aria-label="Confirm Password"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">⚠️ {error}</div>
                      )}
                      {success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">✅ {success}</div>
                      )}

                      <button
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[0_12px_24px_-12px_rgba(79,70,229,0.6)] active:scale-[0.99]"
                        onClick={handleRegister}
                        disabled={loading}
                      >
                        {loading ? "Registering..." : "Create account"}
                      </button>
                      <button
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-sm active:scale-[0.99]"
                        onClick={() => router.push("/login")}
                      >
                        Back to login
                      </button>
                    </div>
                    <div className="mt-6 text-center text-xs text-gray-500">
                      By creating an account you agree to reflective, supportive journaling guidelines.
                    </div>
                  </>
                ) : (
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 text-green-700 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                              <path d="M1.5 8.67v6.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                              <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">Check your email!</h3>
                          <p className="text-gray-600 mb-4">
                            We&apos;ve sent a verification link to your email address. Please check your inbox (and spam folder) and click the link to complete your registration.
                          </p>
                          
                          {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">⚠️ {error}</div>
                          )}
                          {success && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">✅ {success}</div>
                          )}

                          <div className="space-y-3">
                            <button
                              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[0_12px_24px_-12px_rgba(79,70,229,0.6)] active:scale-[0.99]"
                              onClick={handleResendVerification}
                              disabled={resendLoading}
                            >
                              {resendLoading ? "Sending..." : "Resend verification email"}
                            </button>
                            <button
                              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-sm active:scale-[0.99]"
                              onClick={() => router.push("/login")}
                            >
                              Back to login
                            </button>
                          </div>
                          
                          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 text-sm">
                              <strong>Can&apos;t find the email?</strong> Check your spam folder or try resending the verification email.
                            </p>
                          </div>
                        </div>
                      )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center text-gray-500 text-xs">
        © {new Date().getFullYear()} MoodMirror — Reflect • Understand • Nourish
      </div>
    </div>
  );
} 