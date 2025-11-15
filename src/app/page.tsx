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
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg relative overflow-hidden z-10">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shadow-inner backdrop-blur-sm">
              <span className="text-2xl">📝</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide bg-gradient-to-r from-white via-indigo-100 to-pink-100 bg-clip-text text-transparent drop-shadow-sm">
              MoodMirror
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="hidden lg:block text-indigo-100 text-sm font-medium">Reflect. Understand. Nourish.</span>
            <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-xs flex items-center gap-3 shadow-sm">
              <span className="text-white font-medium">🤖 AI</span>
              <span className="text-white font-medium">🥗 Nutrition</span>
              <span className="text-white font-medium">🔗 Mood–Diet</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-[1px] left-0 right-0 z-0" aria-hidden>
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

        <div className="relative max-w-7xl mx-auto px-6 py-12 sm:py-16 lg:py-20">
          <div className={`transform transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            {/* Main Hero Card */}
            <div className="p-[2px] rounded-[32px] bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 mb-12 shadow-2xl">
              <div className="bg-white/90 backdrop-blur-xl rounded-[30px] shadow-2xl border border-white/60 overflow-hidden">
                {/* Hero Banner */}
                <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 px-8 py-16 sm:py-20 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/30 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
                  </div>
                  <div className="relative z-10">
                    <div className="inline-block mb-4 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                      <span className="text-white/90 text-sm font-semibold">✨ AI-Powered Journaling</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                      Understand Your Emotions,
                      <br />
                      <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
                        Nourish Your Well-Being
                      </span>
                    </h2>
                    <p className="text-lg sm:text-xl md:text-2xl text-indigo-100 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
                      Transform daily reflections into meaningful insights. Let AI help you discover the connection between your mood and nutrition.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <button
                        onClick={() => router.push("/register")}
                        className="group px-10 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-100 shadow-xl hover:bg-indigo-50"
                      >
                        <span className="flex items-center gap-2">
                          Get Started Free
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      </button>
                      <button
                        onClick={() => router.push("/login")}
                        className="px-10 py-4 bg-white/10 backdrop-blur-md border-2 border-white/40 text-white rounded-xl font-bold text-lg transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-100 hover:border-white/60"
                      >
                        Sign In
                      </button>
                    </div>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-300">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                        <span>Free to start</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-300">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                        <span>No credit card</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-300">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                        <span>Privacy first</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="p-8 md:p-12">
                  <div className="text-center mb-12">
                    <h3 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">Powerful Features</h3>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">Everything you need to understand yourself better</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* AI Feature */}
                    <div className="group text-center rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-indigo-50/50 backdrop-blur p-8 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-4xl">🤖</span>
                      </div>
                      <h3 className="font-bold text-xl text-gray-800 mb-3">AI Emotion Analysis</h3>
                      <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
                      <p className="text-gray-600 leading-relaxed">
                        Capture your day and let AI reflect your feelings with supportive, personalized insights that help you understand your emotional patterns.
                      </p>
                    </div>

                    {/* Nutrition Feature */}
                    <div className="group text-center rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-green-50/50 backdrop-blur p-8 shadow-sm hover:shadow-xl hover:border-green-300 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 text-green-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-4xl">🥗</span>
                      </div>
                      <h3 className="font-bold text-xl text-gray-800 mb-3">Personalized Nutrition</h3>
                      <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />
                      <p className="text-gray-600 leading-relaxed">
                        Get food suggestions tailored to your mood to help you feel your best every day. Discover foods that support your emotional well-being.
                      </p>
                    </div>

                    {/* Mood–Diet Link Feature */}
                    <div className="group text-center rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-yellow-50/50 backdrop-blur p-8 shadow-sm hover:shadow-xl hover:border-yellow-300 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-4xl">🔗</span>
                      </div>
                      <h3 className="font-bold text-xl text-gray-800 mb-3">Mood–Diet Connection</h3>
                      <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400" />
                      <p className="text-gray-600 leading-relaxed">
                        Discover how nutrition and emotions connect across your daily journal entries. Track patterns and make informed choices.
                      </p>
                    </div>
                  </div>

                  {/* How It Works */}
                  <div className="mb-12">
                    <div className="text-center mb-10">
                      <h3 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">How It Works</h3>
                      <p className="text-gray-600 text-lg max-w-2xl mx-auto">Simple steps to better self-awareness</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                      {/* Connection lines for desktop */}
                      <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200" />
                      
                      <div className="relative group rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-indigo-50/30 backdrop-blur p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 flex items-center justify-center mb-4 text-2xl font-bold shadow-md group-hover:scale-110 transition-transform">1</div>
                        <h4 className="font-bold text-lg text-gray-800 mb-3">Write Your Day</h4>
                        <p className="text-gray-600 leading-relaxed">Log a short summary of your day and let AI detect your mood automatically with advanced emotion recognition.</p>
                      </div>
                      <div className="relative group rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-purple-50/30 backdrop-blur p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 flex items-center justify-center mb-4 text-2xl font-bold shadow-md group-hover:scale-110 transition-transform">2</div>
                        <h4 className="font-bold text-lg text-gray-800 mb-3">Get AI Reflection</h4>
                        <p className="text-gray-600 leading-relaxed">Receive supportive insights and reflections tailored to your emotional state, helping you understand yourself better.</p>
                      </div>
                      <div className="relative group rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-pink-50/30 backdrop-blur p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700 flex items-center justify-center mb-4 text-2xl font-bold shadow-md group-hover:scale-110 transition-transform">3</div>
                        <h4 className="font-bold text-lg text-gray-800 mb-3">Follow Food Tips</h4>
                        <p className="text-gray-600 leading-relaxed">Try personalized nutrition suggestions that match your mood and support your well-being throughout the day.</p>
                      </div>
                    </div>
                  </div>

                  {/* Benefits Section */}
                  <div className="mb-12">
                    <div className="text-center mb-10">
                      <h3 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">Why Choose MoodMirror?</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-blue-600">
                            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-gray-800 mb-2">Private & Secure</h4>
                        <p className="text-sm text-gray-600">Your thoughts are yours alone</p>
                      </div>
                      <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-purple-600">
                            <path fillRule="evenodd" d="M10.5 3.798a5.25 5.25 0 013.75 0l7.5 2.689A2.25 2.25 0 0122.5 8.69v7.622a2.25 2.25 0 01-1.25 2.011l-7.5 2.689a5.25 5.25 0 01-3.75 0L2.75 18.323A2.25 2.25 0 011.5 16.312V8.69a2.25 2.25 0 011.25-2.011l7.5-2.689zM15 8.25a.75.75 0 00-1.5 0v5.25a.75.75 0 001.5 0V8.25zm-6 0a.75.75 0 01.75-.75h3a.75.75 0 010 1.5H9.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-gray-800 mb-2">AI-Powered</h4>
                        <p className="text-sm text-gray-600">Advanced emotion analysis</p>
                      </div>
                      <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-green-600">
                            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-gray-800 mb-2">Easy to Use</h4>
                        <p className="text-sm text-gray-600">Simple, intuitive interface</p>
                      </div>
                      <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100">
                        <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-yellow-600">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 001.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-gray-800 mb-2">Daily Insights</h4>
                        <p className="text-sm text-gray-600">Track patterns over time</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="px-8 pb-12">
                  <div className="relative rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-12 text-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 left-0 w-64 h-64 bg-white/30 rounded-full blur-3xl" />
                      <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to Start Your Journey?</h3>
                      <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">Join thousands of users who are discovering the connection between their mood and well-being.</p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={() => router.push("/register")}
                          className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-100 shadow-xl"
                        >
                          Create Free Account
                        </button>
                        <button
                          onClick={() => router.push("/login")}
                          className="px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/40 text-white rounded-xl font-bold text-lg transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-100"
                        >
                          Sign In
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Features */}
                <div className="px-8 pb-10">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8" />
                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                    <span className="px-5 py-2.5 rounded-full bg-indigo-50 text-indigo-700 border-2 border-indigo-200 font-semibold shadow-sm hover:shadow-md transition-shadow">🔒 Private by default</span>
                    <span className="px-5 py-2.5 rounded-full bg-purple-50 text-purple-700 border-2 border-purple-200 font-semibold shadow-sm hover:shadow-md transition-shadow">⚡ Lightweight & fast</span>
                    <span className="px-5 py-2.5 rounded-full bg-pink-50 text-pink-700 border-2 border-pink-200 font-semibold shadow-sm hover:shadow-md transition-shadow">📅 Daily habit friendly</span>
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
