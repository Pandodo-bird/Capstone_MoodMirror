"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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
          <div className="hidden sm:flex items-center gap-2">
            <span className="hidden md:block text-indigo-100 text-sm mr-1">Reflect. Understand. Nourish.</span>
            <div className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-full border border-white/20 text-xs flex items-center gap-2">
              <span className="text-white/90">🤖 AI</span>
              <span className="text-white/90">🥗 Nutrition</span>
              <span className="text-white/90">🔗 Mood–Diet</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-[1px] left-0 right-0" aria-hidden>
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-12 fill-white/70">
            <path d="M0,64 C240,16 480,16 720,48 C960,80 1200,80 1440,48 L1440,80 L0,80 Z"></path>
          </svg>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 w-full relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-[-120px] top-10 w-80 h-80 bg-gradient-to-br from-pink-300/40 to-indigo-300/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute left-[-120px] bottom-10 w-80 h-80 bg-gradient-to-br from-purple-300/40 to-yellow-300/40 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-12 sm:py-16">
          <div className={`transform transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            {/* Main Hero Card */}
            <div className="p-[1.5px] rounded-[28px] bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 mb-8">
              <div className="bg-white/85 backdrop-blur-xl rounded-[26px] shadow-2xl border border-white/60 overflow-hidden">
                {/* Hero Banner */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-12 sm:py-16 text-center">
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4">
                    Your AI-Powered Mood Journal
                  </h2>
                  <p className="text-xl sm:text-2xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                    Reflect on your day, understand your emotions, and nourish your well-being with personalized insights.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={() => router.push("/login")}
                      className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg transition-all duration-200 hover:shadow-2xl hover:scale-105 active:scale-100 shadow-lg"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => router.push("/register")}
                      className="px-8 py-4 bg-indigo-600/20 backdrop-blur border-2 border-white/30 text-white rounded-xl font-bold text-lg transition-all duration-200 hover:bg-indigo-600/30 hover:scale-105 active:scale-100"
                    >
                      Create Account
                    </button>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="p-8 md:p-10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    {/* AI Feature */}
                    <div className="text-center rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-6 shadow-sm hover:shadow-md transition-all">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 flex items-center justify-center">
                        <span className="text-3xl">🤖</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">AI Emotion Analysis</h3>
                      <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Capture your day and let AI reflect your feelings with supportive, personalized insights.
                      </p>
                    </div>

                    {/* Nutrition Feature */}
                    <div className="text-center rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-6 shadow-sm hover:shadow-md transition-all">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 text-green-700 flex items-center justify-center">
                        <span className="text-3xl">🥗</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">Personalized Nutrition</h3>
                      <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Get food suggestions tailored to your mood to help you feel your best every day.
                      </p>
                    </div>

                    {/* Mood–Diet Link Feature */}
                    <div className="text-center rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-6 shadow-sm hover:shadow-md transition-all">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700 flex items-center justify-center">
                        <span className="text-3xl">🔗</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">Mood–Diet Connection</h3>
                      <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400" />
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Discover how nutrition and emotions connect across your daily journal entries.
                      </p>
                    </div>
                  </div>

                  {/* Decorative band */}
                  <div className="relative h-16 rounded-2xl overflow-hidden mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/70 via-purple-100/70 to-pink-100/70" />
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "radial-gradient(#a5b4fc 1px, transparent 1px), radial-gradient(#fbcfe8 1px, transparent 1px)",
                        backgroundSize: "16px 16px, 24px 24px",
                        backgroundPosition: "0 0, 8px 8px",
                      }}
                    />
                    <div className="absolute inset-0 opacity-60">
                      <div className="absolute -left-10 -top-6 w-28 h-28 bg-white/60 rounded-full blur-2xl" />
                      <div className="absolute -right-10 -bottom-6 w-28 h-28 bg-white/50 rounded-full blur-2xl" />
                    </div>
                    <div className="relative h-full flex items-center justify-center">
                      <span className="text-xs tracking-wider text-gray-600 uppercase font-semibold">Reflect • Understand • Nourish</span>
                    </div>
                  </div>

                  {/* How It Works */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-xl border border-gray-200 bg-white/70 backdrop-blur p-6 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 text-xl font-bold">1</div>
                      <h4 className="font-semibold text-gray-800 mb-2">Write Your Day</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">Log a short summary of your day and let AI detect your mood automatically.</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white/70 backdrop-blur p-6 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-3 text-xl font-bold">2</div>
                      <h4 className="font-semibold text-gray-800 mb-2">Get AI Reflection</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">Receive supportive insights and reflections tailored to your emotional state.</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white/70 backdrop-blur p-6 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center mb-3 text-xl font-bold">3</div>
                      <h4 className="font-semibold text-gray-800 mb-2">Follow Food Tips</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">Try personalized nutrition suggestions that match your mood and support your well-being.</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Features */}
                <div className="px-8 pb-10">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />
                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                    <span className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">🔒 Private by default</span>
                    <span className="px-4 py-2 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">⚡ Lightweight & fast</span>
                    <span className="px-4 py-2 rounded-full bg-pink-50 text-pink-700 border border-pink-200 font-medium">📅 Daily habit friendly</span>
                  </div>
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
    </div>
  );
}
