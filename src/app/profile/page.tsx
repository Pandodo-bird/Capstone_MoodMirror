"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

const db = getFirestore();

const moodConfig = {
  "Sad/Down": {
    color: "bg-blue-500",
    textColor: "text-blue-800",
    icon: "😢",
    shortName: "Sad"
  },
  "Stressed/Overwhelmed": {
    color: "bg-red-500",
    textColor: "text-red-800",
    icon: "😰",
    shortName: "Stressed"
  },
  "Anxious/Nervous": {
    color: "bg-orange-500",
    textColor: "text-orange-800",
    icon: "😟",
    shortName: "Anxious"
  },
  "Tired/Drained": {
    color: "bg-gray-500",
    textColor: "text-gray-800",
    icon: "😴",
    shortName: "Tired"
  },
  "Happy / Excited / In Love": {
    color: "bg-yellow-500",
    textColor: "text-yellow-800",
    icon: "😊",
    shortName: "Happy"
  },
  "Grateful / Content / Peaceful": {
    color: "bg-green-500",
    textColor: "text-green-800",
    icon: "😌",
    shortName: "Grateful"
  },
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);
  const [monthlyEmotions, setMonthlyEmotions] = useState<{[month: string]: {[emotion: string]: number}}>({});
  const [loading, setLoading] = useState(true);
  const [avoidedFoods, setAvoidedFoods] = useState<Array<{id: string; food: string; avoidedAt: string}>>([]);
  const [avoidedFoodsLoading, setAvoidedFoodsLoading] = useState(false);
  const [removingFood, setRemovingFood] = useState<string | null>(null);
  const router = useRouter();

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
            const firestoreUsername = userDoc.exists() ? (userDoc.data() as any).username : null;
            setDisplayName(firestoreUsername || u.displayName || u.email || "");
          } catch (e) {
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
          const entriesRef = collection(db, "users", user.uid, "journalEntries");
          const q = query(entriesRef, orderBy("date", "desc"));
          const querySnap = await getDocs(q);

          const monthSet = new Set<string>();
          const emotionData: {[month: string]: {[emotion: string]: number}} = {};

          querySnap.forEach((docSnap) => {
            const data = docSnap.data() as { date: string; mood: string };
            const date = new Date(data.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            monthSet.add(monthYear);

            // Count emotions per month
            if (!emotionData[monthYear]) {
              emotionData[monthYear] = {};
            }
            if (!emotionData[monthYear][data.mood]) {
              emotionData[monthYear][data.mood] = 0;
            }
            emotionData[monthYear][data.mood]++;
          });

          const sortedMonths = Array.from(monthSet).sort().reverse();
          setMonths(sortedMonths);
          setMonthlyEmotions(emotionData);
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

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const getMostFrequentEmotion = (monthYear: string) => {
    const emotions = monthlyEmotions[monthYear];
    if (!emotions) return null;
    
    let maxCount = 0;
    let mostFrequent = "";
    
    Object.entries(emotions).forEach(([emotion, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = emotion;
      }
    });
    
    return { emotion: mostFrequent, count: maxCount };
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
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
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">User Profile</h2>
                <p className="text-indigo-100">{displayName || user.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
             {/* User Information */}
            <div className="mb-8">
               <h3 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h3>
              <div className="bg-gray-50 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
                  <p className="text-gray-800 font-medium">{displayName || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <p className="text-gray-800 font-medium">{user.email}</p>
                </div>
               </div>
             </div>

           {/* Journal Activity Section */}
<div className="mb-8 bg-indigo-50 p-6 rounded-xl border border-indigo-200">
  {/* Section Title */}
  <h3 className="text-xl font-semibold text-indigo-900 mb-4">Journal Activity</h3>

  {loading ? (
    // Loading state
    <div className="text-center py-8">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-indigo-600 text-sm mt-3">Loading your journal history...</p>
    </div>
  ) : months.length === 0 ? (
    // No journal entries
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center shadow-sm">
      <div className="text-5xl mb-2">📝</div>
      <h4 className="text-lg font-semibold text-yellow-800 mb-2">No Journal Entries Yet</h4>
      <p className="text-yellow-700">Start your mood tracking journey by creating your first journal entry!</p>
    </div>
  ) : (
    // Journal months grid
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          You've been journaling for <span className="font-semibold text-indigo-600">{months.length}</span> month{months.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {months.map((monthYear, index) => (
          <div
            key={monthYear}
            className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:bg-indigo-100 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-indigo-900">{formatMonthYear(monthYear)}</p>
                <p className="text-sm text-indigo-700">Month {months.length - index}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 text-sm font-semibold">{months.length - index}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>


           {/* Emotion Graph Section */}
<div className="mb-8 bg-indigo-50 p-6 rounded-xl border border-indigo-200">
  {/* Section Title */}
  <h3 className="text-xl font-semibold text-indigo-900 mb-4">Monthly Emotion Trends</h3>

  {months.length === 0 ? (
    // No data available
    <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm">
      <div className="text-4xl mb-2">📊</div>
      <p className="text-gray-600">No data available yet. Start journaling to see your emotion trends!</p>
    </div>
  ) : (
    // Graph container
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header above chart */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">Last {monthsWindow.length} months</p>
        <p className="text-xs text-gray-500">Bar height = total entries</p>
      </div>

      {/* SVG Chart */}
      <div className="relative h-56 w-full">
        <svg viewBox="0 0 360 224" className="w-full h-full">
          {/* Chart background gradient */}
          <defs>
            <linearGradient id="chart-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eef2ff" />
              <stop offset="100%" stopColor="#ffe4f1" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="360" height="224" fill="url(#chart-bg)" />

          {/* Axes */}
          <line x1="24" y1="200" x2="356" y2="200" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="24" y1="16" x2="24" y2="200" stroke="#cbd5e1" strokeWidth="1" />

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
                  <line x1={x + barWidth / 2 - 6} y1={200} x2={x + barWidth / 2 + 6} y2={200} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                </g>
              );
            }
            return (
              <g key={`bar-${i}`}>
                <rect x={x} y={y} width={barWidth} height={h} rx="8" fill={`url(#bar-grad-${i})`} stroke="#e5e7eb" strokeWidth="1" />
                <rect x={x} y={y} width={barWidth} height={h} rx="8" fill="transparent" stroke="rgba(79,70,229,0.12)" strokeWidth="2" />
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
              <text key={`lbl-${i}`} x={cx} y={215} textAnchor="middle" fontSize="10" fill="#374151">{lbl}</text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.keys(moodHexColor).map((emotion) => (
          <div key={emotion} className="flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 rounded-full" style={{ backgroundColor: moodHexColor[emotion] }} />
            <span className="text-xs text-gray-700 truncate">{emotion}</span>
          </div>
        ))}
      </div>
    </div>
  )}
</div>


            {/* Avoided Foods Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Avoided Foods 🚫</h3>
              {avoidedFoodsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-indigo-600 text-sm mt-2">Loading avoided foods...</p>
                </div>
              ) : avoidedFoods.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-2">🍽️</div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">No Avoided Foods</h4>
                  <p className="text-gray-600">You haven't avoided any foods yet. When you avoid a food suggestion in the calendar, it will appear here.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="mb-4">
                    <p className="text-gray-600 mb-2">
                      You have avoided <span className="font-semibold text-red-600">{avoidedFoods.length}</span> food{avoidedFoods.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      These foods won't appear in your future food suggestions. Click "Undo" to allow them again.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {avoidedFoods.map((food) => (
                      <div key={food.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 text-sm">🚫</span>
                          </div>
                          <div>
                            <p className="font-medium text-red-800">{food.food}</p>
                            <p className="text-xs text-red-600">
                              Avoided on {new Date(food.avoidedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAvoidedFood(food.id, food.food)}
                          disabled={removingFood === food.id}
                          className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {removingFood === food.id ? (
                            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <span>↩️</span>
                              <span>Undo</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats - Updated */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">📅</div>
                <h4 className="font-semibold text-blue-800 mb-1">Months Active</h4>
                <p className="text-2xl font-bold text-blue-600">{months.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-semibold text-green-800 mb-1">Consistency</h4>
                <p className="text-2xl font-bold text-green-600">
                  {months.length > 0 ? "Active" : "Getting Started"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
