"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

const db = getFirestore();

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ uid: string; email: string | null; displayName: string | null } | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);
  const [monthlyEmotions, setMonthlyEmotions] = useState<{[month: string]: {[emotion: string]: number}}>({});
  const [loading, setLoading] = useState(true);
  const [avoidedFoods, setAvoidedFoods] = useState<Array<{id: string; food: string; avoidedAt: string}>>([]);
  const [avoidedFoodsLoading, setAvoidedFoodsLoading] = useState(false);
  const [removingFood, setRemovingFood] = useState<string | null>(null);
  const [journalStats, setJournalStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalEntries: 0,
    journalingSince: null as Date | null,
  });
  const [showAvoidedFoodsModal, setShowAvoidedFoodsModal] = useState(false);
  // Initialize dark mode from localStorage immediately (with SSR check)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('moodmirror-dark-mode');
      return savedDarkMode === 'true';
    }
    return false;
  });
  const router = useRouter();

  // Save dark mode preference to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('moodmirror-dark-mode', isDarkMode.toString());
    }
  }, [isDarkMode]);

  // Sync dark mode state with localStorage on visibility change (handles navigation)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const syncDarkMode = () => {
        const savedDarkMode = localStorage.getItem('moodmirror-dark-mode');
        if (savedDarkMode !== null) {
          const shouldBeDark = savedDarkMode === 'true';
          if (shouldBeDark !== isDarkMode) {
            setIsDarkMode(shouldBeDark);
          }
        }
      };

      // Sync when page becomes visible (handles navigation back to the page)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          syncDarkMode();
        }
      };
      
      // Sync on storage change (if changed in another tab)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'moodmirror-dark-mode' && e.newValue !== null) {
          setIsDarkMode(e.newValue === 'true');
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('storage', handleStorageChange);

      // Sync on mount (in case component was cached)
      syncDarkMode();

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [isDarkMode]);

  // Watch authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        router.replace("/");
      } else {
        (async () => {
          try {
            const userDoc = await getDoc(doc(db, "users", u.uid));
            const userData = userDoc.exists() ? userDoc.data() : null;
            const firestoreUsername = userData?.username as string | undefined;
            setDisplayName(firestoreUsername || u.displayName || u.email || "");
          } catch {
            setDisplayName(u.displayName || u.email || "");
          }
        })();
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch user's journal months and emotion data
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const monthSet = new Set<string>();
          const emotionData: {[month: string]: {[emotion: string]: number}} = {};
          const datesWithEntries = new Set<string>();
          let totalEntries = 0;
          let earliestDate: Date | null = null;

          // Get all dates in the last year (similar to calendar approach but wider range)
          const now = new Date();
          const startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); // 1 year ago
          const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today
          
          const datesToCheck: string[] = [];
          const currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
            datesToCheck.push(dateStr);
            currentDate.setDate(currentDate.getDate() + 1);
          }

          // Load entries for each date (similar to calendar approach)
          await Promise.all(datesToCheck.map(async (dateStr) => {
            try {
              const entriesRef = collection(db, "users", user.uid, "journalEntries", dateStr, "entries");
              const entriesSnap = await getDocs(entriesRef);
              
              if (!entriesSnap.empty) {
                const date = new Date(dateStr);
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                monthSet.add(monthYear);
                datesWithEntries.add(dateStr);

                // Track earliest date
                if (!earliestDate || date < earliestDate) {
                  earliestDate = date;
                }

                // Process each entry for this date
                entriesSnap.forEach((entryDoc) => {
                  const entryData = entryDoc.data() as { mood?: string; flagged?: boolean };
                  
                  // Skip flagged entries (they shouldn't have moods, but check just in case)
                  if (entryData.flagged || !entryData.mood) return;
                  
                  totalEntries++;
                  
                  // Count emotions per month
                  if (!emotionData[monthYear]) {
                    emotionData[monthYear] = {};
                  }
                  if (!emotionData[monthYear][entryData.mood]) {
                    emotionData[monthYear][entryData.mood] = 0;
                  }
                  emotionData[monthYear][entryData.mood]++;
                });
              }
            } catch {
              // Date document might not exist, which is fine
              // Silently skip - this is expected for most dates
            }
          }));

          // Calculate streaks
          const sortedDates = Array.from(datesWithEntries).sort().reverse();
          let currentStreak = 0;
          let longestStreak = 0;
          let tempStreak = 0;

          // Calculate current streak (from today backwards)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const checkDate = new Date(today);
          
          while (true) {
            const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
            if (datesWithEntries.has(dateStr)) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }

          // Calculate longest streak
          if (sortedDates.length > 0) {
            tempStreak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
              const prevDate = new Date(sortedDates[i - 1]);
              const currDate = new Date(sortedDates[i]);
              const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                tempStreak++;
              } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
              }
            }
            longestStreak = Math.max(longestStreak, tempStreak);
          }

          const sortedMonths = Array.from(monthSet).sort().reverse();
          setMonths(sortedMonths);
          setMonthlyEmotions(emotionData);
          setJournalStats({
            currentStreak,
            longestStreak,
            totalEntries,
            journalingSince: earliestDate,
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [user]);

  // Fetch avoided foods
  useEffect(() => {
    if (user) {
      const fetchAvoidedFoods = async () => {
        setAvoidedFoodsLoading(true);
        try {
          const avoidedFoodsRef = collection(db, "users", user.uid, "avoidedFoods");
          const querySnap = await getDocs(avoidedFoodsRef);
          const foods: Array<{id: string; food: string; avoidedAt: string}> = [];
          
          querySnap.forEach((docSnap) => {
            const data = docSnap.data() as { food: string; avoidedAt: string };
            foods.push({
              id: docSnap.id,
              food: data.food,
              avoidedAt: data.avoidedAt
            });
          });
          
          // Sort by most recently avoided first
          foods.sort((a, b) => new Date(b.avoidedAt).getTime() - new Date(a.avoidedAt).getTime());
          setAvoidedFoods(foods);
        } catch (error) {
          console.error("Error fetching avoided foods:", error);
        } finally {
          setAvoidedFoodsLoading(false);
        }
      };

      fetchAvoidedFoods();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  const handleBackToCalendar = () => {
    router.push("/calendar");
  };

  const handleRemoveAvoidedFood = async (foodId: string, foodName: string) => {
    if (!user) return;
    
    setRemovingFood(foodId);
    try {
      // Delete the avoided food from Firebase
      await deleteDoc(doc(db, "users", user.uid, "avoidedFoods", foodId));
      
      // Update local state
      setAvoidedFoods(prev => prev.filter(food => food.id !== foodId));
      
      console.log(`"${foodName}" removed from avoided foods list`);
    } catch (error) {
      console.error("Error removing avoided food:", error);
    } finally {
      setRemovingFood(null);
    }
  };

  const getTotalEntriesForMonth = (monthYear: string) => {
    const emotions = monthlyEmotions[monthYear];
    if (!emotions) return 0;
    
    return Object.values(emotions).reduce((sum, count) => sum + count, 0);
  };

  // Mood colors to match app palette
  const moodHexColor: Record<string, string> = {
    "Sad/Down": "#3b82f6", // blue-500
    "Stressed/Overwhelmed": "#ef4444", // red-500
    "Anxious/Nervous": "#f59e0b", // amber-500
    "Tired/Drained": "#6b7280", // gray-500
    "Happy / Excited / In Love": "#fbbf24", // yellow-400/500 range
    "Grateful / Content / Peaceful": "#22c55e", // green-500
  };

  // Build last 5 months including months with zero entries
  const buildLastNMonths = (n: number) => {
    const arr: string[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      arr.push(`${y}-${m}`);
    }
    return arr;
  };
  const monthsWindow = buildLastNMonths(5);
  const maxEntriesInWindow = monthsWindow.reduce((max, m) => Math.max(max, getTotalEntriesForMonth(m)), 0);

  if (!user) return null;

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950" 
        : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
    }`}>
      {/* Background mesh + subtle grid */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          isDarkMode ? "opacity-30" : "opacity-60"
        }`}
        style={{
          backgroundImage:
            "radial-gradient(60rem 60rem at 10% -10%, rgba(129, 140, 248, 0.25), transparent 50%)," +
            "radial-gradient(45rem 45rem at 110% 10%, rgba(236, 72, 153, 0.22), transparent 50%)," +
            "radial-gradient(35rem 35rem at 20% 110%, rgba(34, 197, 94, 0.18), transparent 55%)",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          isDarkMode ? "opacity-20" : "opacity-100"
        }`}
        style={{
          backgroundImage:
            `linear-gradient(${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)"} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)"} 1px, transparent 1px)`,
          backgroundSize: "24px 24px, 24px 24px",
          backgroundPosition: "-1px -1px",
        }}
      />
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-xl">👤</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-white via-indigo-100 to-pink-100 bg-clip-text text-transparent drop-shadow-sm">Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30 shadow-sm flex items-center justify-center"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => router.push("/journal")}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30 shadow-sm"
              >
                📝 Journal
              </button>
              <button
                onClick={handleBackToCalendar}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30 shadow-sm"
              >
                📅 Calendar
              </button>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30 shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 relative">
        <div className={`backdrop-blur-xl rounded-3xl shadow-2xl border overflow-hidden transition-colors duration-300 ${
          isDarkMode 
            ? "bg-gray-800/90 border-gray-700/60" 
            : "bg-white/85 border-white/60"
        }`}>
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-white">
                  {(displayName || user.email || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{displayName || user.email}</h2>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
             {/* User Information */}
            <div className="mb-8">
               <h3 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
                 isDarkMode ? "text-gray-200" : "text-gray-800"
               }`}>Account Information</h3>
              <div className={`rounded-xl p-6 transition-colors duration-300 ${
                isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
              }`}>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}>Username</dt>
                    <dd className={`mt-1 font-medium transition-colors duration-300 ${
                      isDarkMode ? "text-gray-200" : "text-gray-800"
                    }`}>{displayName || "-"}</dd>
                  </div>
                  <div>
                    <dt className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}>Email</dt>
                    <dd className={`mt-1 font-medium transition-colors duration-300 ${
                      isDarkMode ? "text-gray-200" : "text-gray-800"
                    }`}>{user.email}</dd>
                  </div>
                </dl>
                
                {/* Food Preferences */}
                <div className={`mt-6 pt-6 border-t transition-colors duration-300 ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}>Food Preferences</p>
                      <p className={`mt-1 transition-colors duration-300 ${
                        isDarkMode ? "text-gray-300" : "text-gray-800"
                      }`}>
                        {avoidedFoodsLoading ? (
                          <span className={isDarkMode ? "text-gray-500" : "text-gray-500"}>Loading...</span>
                        ) : avoidedFoods.length === 0 ? (
                          <span>You haven&apos;t marked any foods to avoid yet.</span>
                        ) : (
                          <span>You have {avoidedFoods.length} food{avoidedFoods.length !== 1 ? 's' : ''} in your preferences list.</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAvoidedFoodsModal(true)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isDarkMode
                          ? "bg-indigo-800/50 hover:bg-indigo-700/50 text-indigo-300"
                          : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                      }`}
                    >
                      Manage List
                    </button>
                  </div>
                </div>
              </div>
             </div>

           {/* Your Activity / Journal Stats */}
            <div className="mb-8">
              <h3 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
                isDarkMode ? "text-gray-200" : "text-gray-800"
              }`}>Your Activity</h3>
              {loading ? (
                <div className={`rounded-xl p-6 text-center transition-colors duration-300 ${
                  isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                }`}>
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className={`text-sm mt-3 transition-colors duration-300 ${
                    isDarkMode ? "text-indigo-400" : "text-indigo-600"
                  }`}>Loading your journal stats...</p>
                </div>
              ) : (
                <div className={`rounded-xl p-6 border transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-700"
                    : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200"
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                      isDarkMode
                        ? "bg-gray-800/50 border-indigo-800"
                        : "bg-white/80 border-indigo-100"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}>Current Streak</span>
                        <span className="text-lg">🔥</span>
                      </div>
                      <p className={`text-2xl font-bold transition-colors duration-300 ${
                        isDarkMode ? "text-indigo-400" : "text-indigo-600"
                      }`}>
                        {journalStats.currentStreak} {journalStats.currentStreak === 1 ? 'Day' : 'Days'}
                      </p>
                      {journalStats.currentStreak > 0 && (
                        <p className={`text-xs mt-1 font-medium transition-colors duration-300 ${
                          isDarkMode ? "text-green-400" : "text-green-600"
                        }`}>Active</p>
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                      isDarkMode
                        ? "bg-gray-800/50 border-indigo-800"
                        : "bg-white/80 border-indigo-100"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}>Longest Streak</span>
                        <span className="text-lg">⭐</span>
                      </div>
                      <p className={`text-2xl font-bold transition-colors duration-300 ${
                        isDarkMode ? "text-purple-400" : "text-purple-600"
                      }`}>
                        {journalStats.longestStreak} {journalStats.longestStreak === 1 ? 'Day' : 'Days'}
                      </p>
                    </div>
                    
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                      isDarkMode
                        ? "bg-gray-800/50 border-indigo-800"
                        : "bg-white/80 border-indigo-100"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}>Total Entries</span>
                        <span className="text-lg">📝</span>
                      </div>
                      <p className={`text-2xl font-bold transition-colors duration-300 ${
                        isDarkMode ? "text-blue-400" : "text-blue-600"
                      }`}>{journalStats.totalEntries}</p>
                    </div>
                    
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                      isDarkMode
                        ? "bg-gray-800/50 border-indigo-800"
                        : "bg-white/80 border-indigo-100"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}>Journaling Since</span>
                        <span className="text-lg">📅</span>
                      </div>
                      <p className={`text-2xl font-bold transition-colors duration-300 ${
                        isDarkMode ? "text-pink-400" : "text-pink-600"
                      }`}>
                        {journalStats.journalingSince
                          ? journalStats.journalingSince.toLocaleString("default", { month: "long", year: "numeric" })
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>


           {/* Emotion Graph Section */}
<div className={`mb-8 p-6 rounded-xl border transition-colors duration-300 ${
  isDarkMode
    ? "bg-indigo-900/30 border-indigo-700"
    : "bg-indigo-50 border-indigo-200"
}`}>
  {/* Section Title */}
  <h3 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
    isDarkMode ? "text-indigo-300" : "text-indigo-900"
  }`}>Monthly Emotion Trends</h3>

  {months.length === 0 ? (
    // No data available
    <div className={`rounded-xl p-6 text-center border shadow-sm transition-colors duration-300 ${
      isDarkMode
        ? "bg-gray-800/50 border-gray-700"
        : "bg-white border-gray-200"
    }`}>
      <div className="text-4xl mb-2">📊</div>
      <p className={`transition-colors duration-300 ${
        isDarkMode ? "text-gray-400" : "text-gray-600"
      }`}>No data available yet. Start journaling to see your emotion trends!</p>
    </div>
  ) : (
    // Graph container
    <div className={`border rounded-xl p-6 shadow-sm transition-colors duration-300 ${
      isDarkMode
        ? "bg-gray-800/50 border-gray-700"
        : "bg-white border-gray-200"
    }`}>
      {/* Header above chart */}
      <div className="mb-4 flex items-center justify-between">
        <p className={`text-sm transition-colors duration-300 ${
          isDarkMode ? "text-gray-400" : "text-gray-600"
        }`}>Last {monthsWindow.length} months</p>
        <p className={`text-xs transition-colors duration-300 ${
          isDarkMode ? "text-gray-500" : "text-gray-500"
        }`}>Bar height = total entries</p>
      </div>

      {/* SVG Chart */}
      <div className="relative h-56 w-full">
        <svg viewBox="0 0 360 224" className="w-full h-full">
          {/* Chart background gradient */}
          <defs>
            <linearGradient id={`chart-bg-${isDarkMode ? 'dark' : 'light'}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDarkMode ? "#1e1b4b" : "#eef2ff"} />
              <stop offset="100%" stopColor={isDarkMode ? "#581c87" : "#ffe4f1"} />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="360" height="224" fill={`url(#chart-bg-${isDarkMode ? 'dark' : 'light'})`} />

          {/* Axes */}
          <line x1="24" y1="200" x2="356" y2="200" stroke={isDarkMode ? "#4b5563" : "#cbd5e1"} strokeWidth="1" />
          <line x1="24" y1="16" x2="24" y2="200" stroke={isDarkMode ? "#4b5563" : "#cbd5e1"} strokeWidth="1" />

          {/* Gradients per month */}
          {monthsWindow.map((m, i) => {
            const emotions = monthlyEmotions[m] || {};
            const total = Object.values(emotions).reduce((s, c) => s + c, 0);
            const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
            const gradId = `bar-grad-${i}`;
            let acc = 0;
            const stops = sorted.map(([emotion, count]) => {
              const start = (acc / Math.max(1, total)) * 100;
              acc += count;
              const end = (acc / Math.max(1, total)) * 100;
              return { color: moodHexColor[emotion] || '#9ca3af', start, end };
            });
            return (
              <defs key={gradId}>
                <linearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
                  {stops.length === 0 ? (
                    <stop offset="0%" stopColor="#e5e7eb" />
                  ) : (
                    stops.flatMap((s, idx) => [
                      <stop key={`a-${idx}`} offset={`${Math.max(0, s.start - 1)}%`} stopColor={s.color} />,
                      <stop key={`b-${idx}`} offset={`${s.start}%`} stopColor={s.color} stopOpacity="0.9" />,
                      <stop key={`c-${idx}`} offset={`${s.end}%`} stopColor={s.color} stopOpacity="0.9" />,
                      <stop key={`d-${idx}`} offset={`${Math.min(100, s.end + 1)}%`} stopColor={s.color} />
                    ])
                  )}
                </linearGradient>
              </defs>
            );
          })}

          {/* Bars */}
          {monthsWindow.map((m, i) => {
            const total = getTotalEntriesForMonth(m);
            const xGap = 360 / (monthsWindow.length + 1);
            const barWidth = Math.min(40, Math.max(20, xGap * 0.5));
            const x = 24 + (i + 1) * xGap - barWidth / 2;
            const h = maxEntriesInWindow ? Math.max(2, (total / maxEntriesInWindow) * 180) : 0;
            const y = 200 - h;
            if (!total) {
              return (
                <g key={`bar-${i}`}>
                  <line x1={x + barWidth / 2 - 6} y1={200} x2={x + barWidth / 2 + 6} y2={200} stroke={isDarkMode ? "#4b5563" : "#cbd5e1"} strokeWidth="2" strokeLinecap="round" />
                </g>
              );
            }
            return (
              <g key={`bar-${i}`}>
                <rect x={x} y={y} width={barWidth} height={h} rx="8" fill={`url(#bar-grad-${i})`} stroke={isDarkMode ? "#374151" : "#e5e7eb"} strokeWidth="1" />
                <rect x={x} y={y} width={barWidth} height={h} rx="8" fill="transparent" stroke={isDarkMode ? "rgba(129,140,248,0.2)" : "rgba(79,70,229,0.12)"} strokeWidth="2" />
              </g>
            );
          })}

          {/* Month labels */}
          {monthsWindow.map((m, i) => {
            const xGap = 360 / (monthsWindow.length + 1);
            const cx = 24 + (i + 1) * xGap;
            const [yStr, mo] = m.split('-');
            const lbl = new Date(parseInt(yStr), parseInt(mo) - 1).toLocaleString('default', { month: 'short' });
            return (
              <text key={`lbl-${i}`} x={cx} y={215} textAnchor="middle" fontSize="10" fill={isDarkMode ? "#9ca3af" : "#374151"}>{lbl}</text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.keys(moodHexColor).map((emotion) => (
          <div key={emotion} className="flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: moodHexColor[emotion] }} />
            <span className={`text-xs truncate transition-colors duration-300 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}>{emotion}</span>
          </div>
        ))}
      </div>
    </div>
  )}
</div>


          </div>
        </div>
      </div>

      {/* Avoided Foods Modal */}
      {showAvoidedFoodsModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAvoidedFoodsModal(false)}
        >
          <div 
            className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col transition-colors duration-300 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Food Preferences</h3>
              <button
                onClick={() => setShowAvoidedFoodsModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className={`p-6 overflow-y-auto flex-1 transition-colors duration-300 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}>
              {avoidedFoodsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className={`text-sm mt-2 transition-colors duration-300 ${
                    isDarkMode ? "text-indigo-400" : "text-indigo-600"
                  }`}>Loading...</p>
                </div>
              ) : avoidedFoods.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`transition-colors duration-300 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>You haven&apos;t marked any foods to avoid yet.</p>
                  <p className={`text-sm mt-2 transition-colors duration-300 ${
                    isDarkMode ? "text-gray-500" : "text-gray-500"
                  }`}>When you avoid a food suggestion in the calendar, it will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {avoidedFoods.map((food) => (
                    <div key={food.id} className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-300 ${
                      isDarkMode
                        ? "bg-gray-700/50 border-gray-600"
                        : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                          isDarkMode ? "bg-indigo-800/50" : "bg-indigo-100"
                        }`}>
                          <span className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? "text-indigo-400" : "text-indigo-600"
                          }`}>🍽️</span>
                        </div>
                        <div>
                          <p className={`font-medium transition-colors duration-300 ${
                            isDarkMode ? "text-gray-200" : "text-gray-800"
                          }`}>{food.food}</p>
                          <p className={`text-xs transition-colors duration-300 ${
                            isDarkMode ? "text-gray-500" : "text-gray-500"
                          }`}>
                            Added on {new Date(food.avoidedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAvoidedFood(food.id, food.food)}
                        disabled={removingFood === food.id}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                          isDarkMode
                            ? "bg-green-800/50 hover:bg-green-700/50 text-green-300"
                            : "bg-green-100 hover:bg-green-200 text-green-700"
                        }`}
                      >
                        {removingFood === food.id ? (
                          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span>↩️</span>
                            <span>Remove</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className={`px-6 py-4 border-t transition-colors duration-300 ${
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-gray-50"
            }`}>
              <button
                onClick={() => setShowAvoidedFoodsModal(false)}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
