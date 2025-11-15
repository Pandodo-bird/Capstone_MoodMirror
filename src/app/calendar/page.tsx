"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  getDoc,
} from "firebase/firestore";

const moodConfig = {
  "Sad/Down": {
    color: "from-blue-400 to-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    textColor: "text-blue-800",
    icon: "😢",
    shortName: "Sad"
  },
  "Stressed/Overwhelmed": {
    color: "from-red-400 to-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    textColor: "text-red-800",
    icon: "😰",
    shortName: "Stressed"
  },
  "Anxious/Nervous": {
    color: "from-orange-400 to-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
    textColor: "text-orange-800",
    icon: "😟",
    shortName: "Anxious"
  },
  "Tired/Drained": {
    color: "from-gray-400 to-gray-600",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    textColor: "text-gray-800",
    icon: "😴",
    shortName: "Tired"
  },
  "Happy / Excited / In Love": {
    color: "from-yellow-400 to-yellow-600",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-300",
    textColor: "text-yellow-800",
    icon: "😊",
    shortName: "Happy"
  },
  "Grateful / Content / Peaceful": {
    color: "from-green-400 to-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
    textColor: "text-green-800",
    icon: "😌",
    shortName: "Grateful"
  },
};

const db = getFirestore();

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function CalendarPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null; displayName: string | null } | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [entries, setEntries] = useState<{ [date: string]: Array<{ entryId: number; mood: string; text: string; polishedReflection?: string; rawReflection?: string; detectedEmotion?: string; flaggedWord?: string | null }> } | null>(null);
  const [selectedDateEntries, setSelectedDateEntries] = useState<Array<{ entryId: number; mood: string; text: string; polishedReflection?: string; rawReflection?: string; detectedEmotion?: string; flaggedWord?: string | null }>>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [monthlyEmotions, setMonthlyEmotions] = useState<{[month: string]: {[emotion: string]: number}}>({});
  const router = useRouter();

  // Watch authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setEntries(null);
        router.replace("/");
      } else {
        // Resolve preferred display name: Firestore username > Auth displayName > email
        (async () => {
          try {
            const userDocRef = doc(db, "users", u.uid);
            const userDoc = await getDoc(userDocRef);
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

  // Fetch all entries for the current month
  useEffect(() => {
    if (user) {
      const fetchEntries = async () => {
        const startOfMonth = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-01`;
        const endOfMonth = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(getDaysInMonth(calendarYear, calendarMonth)).padStart(2, "0")}`;

        // Get all dates in the month
        const datesInMonth: string[] = [];
        for (let day = 1; day <= getDaysInMonth(calendarYear, calendarMonth); day++) {
          const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          if (dateStr >= startOfMonth && dateStr <= endOfMonth) {
            datesInMonth.push(dateStr);
          }
        }

        const newEntries: { [date: string]: Array<{ entryId: number; mood: string; text: string; polishedReflection?: string; rawReflection?: string; detectedEmotion?: string; flaggedWord?: string | null }> } = {};

        // Load entries for each date in the month
        await Promise.all(datesInMonth.map(async (dateStr) => {
          try {
            const entriesRef = collection(db, "users", user.uid, "journalEntries", dateStr, "entries");
            const entriesSnap = await getDocs(entriesRef);
            
            if (!entriesSnap.empty) {
              const dateEntries: Array<{ entryId: number; mood: string; text: string; polishedReflection?: string; rawReflection?: string; detectedEmotion?: string; flaggedWord?: string | null }> = [];
              
              // Load all entries for this date
              await Promise.all(Array.from(entriesSnap.docs).map(async (docSnap) => {
                const data = docSnap.data();
                const entryId = parseInt(docSnap.id);
                
                // Skip flagged entries (they shouldn't be saved, but check just in case)
                if (data.flagged) return;
                
                const entry: { entryId: number; mood: string; text: string; polishedReflection?: string; rawReflection?: string; detectedEmotion?: string; flaggedWord?: string | null } = {
                  entryId,
                  mood: data.mood || "",
                  text: data.text || "",
                  polishedReflection: data.polishedReflection || "",
                };

                // Load AI details
                try {
                  const aiDetailsRef = doc(db, "users", user.uid, "journalEntries", dateStr, "entries", docSnap.id, "details", "ai");
                  const aiDetailsDoc = await getDoc(aiDetailsRef);
                  if (aiDetailsDoc.exists()) {
                    const aiData = aiDetailsDoc.data();
                    entry.rawReflection = aiData.rawReflection || "";
                    entry.detectedEmotion = aiData.detectedEmotion || "";
                    entry.flaggedWord = aiData.flaggedWord || null;
                  }
                } catch (e) {
                  console.error("Error loading AI details:", e);
                }

                dateEntries.push(entry);
              }));

              // Sort by entryId and only add if there are valid entries
              if (dateEntries.length > 0) {
                dateEntries.sort((a, b) => a.entryId - b.entryId);
                newEntries[dateStr] = dateEntries;
              }
            }
          } catch (e) {
            // Date document might not exist, which is fine
            console.error(`Error loading entries for ${dateStr}:`, e);
          }
        }));

        setEntries(newEntries);
      };

      fetchEntries();
    }
  }, [user, calendarMonth, calendarYear]);

  // Fetch monthly emotion trends for the last 5 months
  useEffect(() => {
    if (user) {
      const fetchMonthlyEmotions = async () => {
        try {
          const emotionData: {[month: string]: {[emotion: string]: number}} = {};
          
          // Get last 5 months
          const monthsToCheck: string[] = [];
          const now = new Date();
          for (let i = 4; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            monthsToCheck.push(monthYear);
          }

          // Get all dates in these months
          const datesToCheck: string[] = [];
          monthsToCheck.forEach(monthYear => {
            const [year, month] = monthYear.split('-');
            const daysInMonth = getDaysInMonth(parseInt(year), parseInt(month) - 1);
            for (let day = 1; day <= daysInMonth; day++) {
              const dateStr = `${year}-${month}-${String(day).padStart(2, "0")}`;
              datesToCheck.push(dateStr);
            }
          });

          // Load entries for each date
          await Promise.all(datesToCheck.map(async (dateStr) => {
            try {
              const entriesRef = collection(db, "users", user.uid, "journalEntries", dateStr, "entries");
              const entriesSnap = await getDocs(entriesRef);
              
              if (!entriesSnap.empty) {
                const date = new Date(dateStr);
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

                // Process each entry for this date
                entriesSnap.forEach((entryDoc) => {
                  const entryData = entryDoc.data() as { mood?: string; flagged?: boolean };
                  
                  // Skip flagged entries
                  if (entryData.flagged || !entryData.mood) return;
                  
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
              // Silently skip
            }
          }));

          setMonthlyEmotions(emotionData);
        } catch (error) {
          console.error("Error fetching monthly emotions:", error);
        }
      };

      fetchMonthlyEmotions();
    }
  }, [user]);


  const handleDayClick = async (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    
    // Load all entries for this date
    const dateEntries = entries?.[dateStr] || [];
    if (dateEntries.length > 0) {
      setSelectedDateEntries(dateEntries);
    } else {
      setSelectedDateEntries([]);
    }
    
    setActiveTab(0); // Reset to first tab
    setShowModal(true);
  };


  // Calendar navigation
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear(calendarYear - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear(calendarYear + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  // Format date for modal header
  const formatDateForModal = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("default", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
  };


  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Background mesh + subtle grid */}
      <div
       className="pointer-events-none absolute inset-0 opacity-90"
       style={{
         backgroundImage:
           "radial-gradient(60rem 60rem at 10% -10%, rgba(129, 140, 248, 0.45), transparent 50%)," +
           "radial-gradient(45rem 45rem at 110% 10%, rgba(236, 72, 153, 0.4), transparent 50%)," +
           "radial-gradient(35rem 35rem at 20% 110%, rgba(34, 197, 94, 0.35), transparent 55%)",
         backgroundRepeat: "no-repeat",
         backgroundBlendMode: "screen",
       }}
     />
     <div
       className="pointer-events-none absolute inset-0"
       style={{
         backgroundImage:
           "linear-gradient(rgba(0,0,0,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.07) 1px, transparent 1px)",
         backgroundSize: "24px 24px, 24px 24px",
         backgroundPosition: "-1px -1px",
        }}
      />
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-xl">📅</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-white via-indigo-100 to-pink-100 bg-clip-text text-transparent drop-shadow-sm">
                MoodMirror
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="hidden md:inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1 text-indigo-100">
                <span className="opacity-90">Welcome</span>
                <span className="font-semibold text-white/95">{displayName || user.email}</span>
              </span>
              <button
                onClick={() => router.push("/journal")}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30 shadow-sm"
              >
                📝 New Entry
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30 shadow-sm"
              >
                👤 Profile
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
      {/* Decorative wave divider */}
<div className="relative" aria-hidden="true">
  <svg
    viewBox="0 0 1440 80"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-12"
  >
    <defs>
      <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.6" />
        <stop offset="50%" stopColor="#fcd5e5" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#f0fdfa" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <path
      d="M0,64 C240,16 480,16 720,48 C960,80 1200,80 1440,48 L1440,80 L0,80 Z"
      fill="url(#waveGradient)"
    />
  </svg>
</div>


      {/* Main Calendar Container */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Ambient gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute right-[-120px] top-0 w-72 h-72 bg-gradient-to-br from-pink-300/40 to-indigo-300/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute left-[-120px] bottom-0 w-72 h-72 bg-gradient-to-br from-purple-300/40 to-yellow-300/40 rounded-full blur-3xl animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5 rounded-2xl shadow-lg relative">
  {/* Month Navigation */}
  <div className="flex justify-between items-center">
    <button
      onClick={handlePrevMonth}
      className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-all duration-200 backdrop-blur-sm shadow"
    >
      ‹
    </button>

    <h2 className="text-2xl font-bold text-white tracking-wide">
      {new Date(calendarYear, calendarMonth).toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}
    </h2>

    <button
      onClick={handleNextMonth}
      className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-all duration-200 backdrop-blur-sm shadow"
    >
      ›
    </button>
  </div>

  {/* Gradient Separator */}
  <div className="mt-2 h-0.5 rounded-full bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 opacity-80 shadow-inner" />

  {/* Month Quick Stats */}
  <div className="mt-3 flex flex-wrap items-center gap-2">
      {(() => {
        const allDateEntries = Object.values(entries || {});
        const totalEntriesThisMonth = allDateEntries.reduce((sum, dateEntries) => sum + dateEntries.length, 0);

        // Count moods from all entries
        const moodCounts: { [k: string]: number } = {};
        allDateEntries.forEach((dateEntries) => {
          dateEntries.forEach((e) => {
            if (e.mood && !e.flaggedWord) {
              moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
            }
          });
        });

      // Get all moods present this month, sorted by frequency
      const moodsThisMonth = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);

      return (
        <>
          {/* Total entries pill */}
          <span className="px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white/95 text-xs font-medium backdrop-blur-sm shadow-sm">
            {totalEntriesThisMonth} {totalEntriesThisMonth === 1 ? "entry" : "entries"} this month
          </span>

          {/* Individual mood pills */}
          {moodsThisMonth.map(([moodKey, count]) => {
            const moodInfo = moodConfig[moodKey as keyof typeof moodConfig];
            if (!moodInfo) return null;

            return (
              <span
                key={moodKey}
                className="px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white/95 text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform duration-200"
              >
                <span>{moodInfo.icon}</span>
                <span>{moodInfo.shortName}</span>
                <span className="opacity-80">({count})</span>
              </span>
            );
          })}
        </>
      );
    })()}
  </div>
</div>


          {/* Calendar Grid */}
          <div className="p-6">
            {/* Mood Legend */}
            <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 text-center tracking-wide">Mood Legend</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {Object.entries(moodConfig).map(([mood, config]) => (
                  <div key={mood} className={`flex items-center px-2 py-1.5 rounded-lg ${config.bgColor} ${config.borderColor} border shadow-sm`}>
                    <span className="text-sm mr-1.5">{config.icon}</span>
                    <span className={`text-xs font-medium ${config.textColor} truncate tracking-wide`}>
                      {config.shortName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative band under legend */}
            <div className="relative h-8 rounded-xl overflow-hidden mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/70 via-purple-100/70 to-pink-100/70" />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "radial-gradient(#a5b4fc 1px, transparent 1px), radial-gradient(#fbcfe8 1px, transparent 1px)",
                  backgroundSize: "16px 16px, 24px 24px",
                  backgroundPosition: "0 0, 8px 8px",
                }}
              />
              <div className="absolute inset-0 opacity-60">
                <div className="absolute -left-8 -top-6 w-20 h-20 bg-white/60 rounded-full blur-2xl" />
                <div className="absolute -right-8 -bottom-6 w-20 h-20 bg-white/50 rounded-full blur-2xl" />
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {weekdayNames.map((day) => (
                <div key={day} className="text-center font-bold text-gray-700 text-xs uppercase tracking-wider py-1.5 bg-gradient-to-br from-white to-indigo-50 rounded-lg border border-gray-200 shadow-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={"empty-" + i} className="h-24"></div>
              ))}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dateEntries = entries?.[dateStr] || [];
                const hasEntries = dateEntries.length > 0;
                // Use first entry's mood for calendar display
                const firstEntry = dateEntries.length > 0 ? dateEntries[0] : null;
                const moodInfo = firstEntry?.mood ? moodConfig[firstEntry.mood as keyof typeof moodConfig] : null;
                const isToday = dateStr === todayStr;
                const isFuture = dateStr > todayStr;
                
                return (
                  <button
                    key={day}
                    className={`group relative h-20 rounded-xl transition-all duration-300
                      ${isFuture ? "opacity-50 cursor-not-allowed" : hasEntries ? "transform hover:scale-[1.04] hover:shadow-xl cursor-pointer" : "cursor-default"}
                      ${!isFuture && hasEntries && moodInfo
                        ? `bg-gradient-to-br ${moodInfo.bgColor} border-2 ${moodInfo.borderColor} shadow-md`
                        : "bg-gradient-to-br from-indigo-50 to-pink-50 border-2 border-indigo-200"}
                      ${isToday ? "ring-4 ring-indigo-400 ring-offset-2" : ""}
                      ${!isFuture && hasEntries && moodInfo ? `hover:${moodInfo.bgColor}` : ""}`}
                    onClick={() => { if (!isFuture && hasEntries) handleDayClick(day); }}
                  >
                    <div className="absolute top-1 left-1.5">
                      <span className={`font-bold text-sm ${
                        !isFuture && hasEntries && moodInfo ? moodInfo.textColor : "text-gray-700"
                      }`}>
                        {day}
                      </span>
                    </div>
                    {!isFuture && hasEntries && moodInfo && (
                      <div className="absolute bottom-1 left-1.5 right-1.5">
                        <div className="bg-white/90 backdrop-blur-sm rounded-md px-1.5 py-1 flex items-center justify-center shadow ring-1 ring-white/60">
                          <span className="text-sm mr-0.5">{moodInfo.icon}</span>
                          <span className={`text-xs font-semibold ${moodInfo.textColor} truncate tracking-wide`}>
                            {moodInfo.shortName}
                          </span>
                          {dateEntries.length > 1 && (
                            <span className="ml-0.5 text-xs opacity-75">({dateEntries.length})</span>
                          )}
                        </div>
                      </div>
                    )}
                    {isToday && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
          </div>

          {/* Monthly Emotion Trends Section - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
              {/* Section Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5 rounded-t-3xl">
                <h3 className="text-xl font-bold text-white">Monthly Emotion Trends</h3>
                <p className="text-indigo-100 text-xs mt-1">Last 5 months</p>
              </div>

              {/* Graph Content */}
              <div className="p-6">
                {(() => {
                  // Build last 5 months
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
                  const getTotalEntriesForMonth = (monthYear: string) => {
                    const emotions = monthlyEmotions[monthYear];
                    if (!emotions) return 0;
                    return Object.values(emotions).reduce((sum, count) => sum + count, 0);
                  };
                  const maxEntriesInWindow = monthsWindow.reduce((max, m) => Math.max(max, getTotalEntriesForMonth(m)), 0);

                  // Mood colors
                  const moodHexColor: Record<string, string> = {
                    "Sad/Down": "#3b82f6",
                    "Stressed/Overwhelmed": "#ef4444",
                    "Anxious/Nervous": "#f59e0b",
                    "Tired/Drained": "#6b7280",
                    "Happy / Excited / In Love": "#fbbf24",
                    "Grateful / Content / Peaceful": "#22c55e",
                  };

                  return (
                    <>
                      {/* SVG Chart */}
                      <div className="relative h-48 w-full mb-4">
                        <svg viewBox="0 0 360 192" className="w-full h-full">
                          <defs>
                            <linearGradient id="chart-bg-small" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#eef2ff" />
                              <stop offset="100%" stopColor="#ffe4f1" />
                            </linearGradient>
                          </defs>
                          <rect x="0" y="0" width="360" height="192" fill="url(#chart-bg-small)" />

                          {/* Axes */}
                          <line x1="20" y1="172" x2="340" y2="172" stroke="#cbd5e1" strokeWidth="1" />
                          <line x1="20" y1="12" x2="20" y2="172" stroke="#cbd5e1" strokeWidth="1" />

                          {/* Gradients per month */}
                          {monthsWindow.map((m, i) => {
                            const emotions = monthlyEmotions[m] || {};
                            const total = Object.values(emotions).reduce((s, c) => s + c, 0);
                            const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
                            const gradId = `bar-grad-small-${i}`;
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
                            const barWidth = Math.min(30, Math.max(15, xGap * 0.4));
                            const x = 20 + (i + 1) * xGap - barWidth / 2;
                            const h = maxEntriesInWindow ? Math.max(2, (total / maxEntriesInWindow) * 150) : 0;
                            const y = 172 - h;
                            if (!total) {
                              return (
                                <g key={`bar-small-${i}`}>
                                  <line x1={x + barWidth / 2 - 4} y1={172} x2={x + barWidth / 2 + 4} y2={172} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                                </g>
                              );
                            }
                            return (
                              <g key={`bar-small-${i}`}>
                                <rect x={x} y={y} width={barWidth} height={h} rx="6" fill={`url(#bar-grad-small-${i})`} stroke="#e5e7eb" strokeWidth="1" />
                                <rect x={x} y={y} width={barWidth} height={h} rx="6" fill="transparent" stroke="rgba(79,70,229,0.12)" strokeWidth="2" />
                              </g>
                            );
                          })}

                          {/* Month labels */}
                          {monthsWindow.map((m, i) => {
                            const xGap = 360 / (monthsWindow.length + 1);
                            const cx = 20 + (i + 1) * xGap;
                            const [yStr, mo] = m.split('-');
                            const lbl = new Date(parseInt(yStr), parseInt(mo) - 1).toLocaleString('default', { month: 'short' });
                            return (
                              <text key={`lbl-small-${i}`} x={cx} y={188} textAnchor="middle" fontSize="9" fill="#374151">{lbl}</text>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Legend */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {Object.keys(moodHexColor).map((emotion) => (
                          <div key={emotion} className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: moodHexColor[emotion] }} />
                            <span className="text-xs text-gray-700 truncate">{emotion}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Quick Stats & Insights Card */}
            <div className="mt-6 bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
              {/* Section Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-3 rounded-t-3xl">
                <h3 className="text-lg font-bold text-white">Quick Stats & Insights</h3>
                <p className="text-purple-100 text-xs">Your mood journey at a glance</p>
              </div>

              {/* Stats Content */}
              <div className="p-4">
                {(() => {
                  // Calculate this week's dates
                  const today = new Date();
                  const currentDay = today.getDay();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - currentDay);
                  const weekDates: string[] = [];
                  for (let i = 0; i < 7; i++) {
                    const date = new Date(startOfWeek);
                    date.setDate(startOfWeek.getDate() + i);
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                    weekDates.push(dateStr);
                  }

                  // Get this week's entries
                  const thisWeekEntries = weekDates.flatMap(dateStr => entries?.[dateStr] || []);
                  
                  // Calculate stats
                  const allDateEntries = Object.values(entries || {});
                  
                  // This month's entries (entries object already contains only current month)
                  const thisMonthEntriesCount = allDateEntries.reduce((sum, dateEntries) => sum + dateEntries.length, 0);
                  
                  // Count moods from all entries (for most common mood and balance)
                  const allMoodCounts: { [k: string]: number } = {};
                  allDateEntries.forEach((dateEntries) => {
                    dateEntries.forEach((e) => {
                      if (e.mood && !e.flaggedWord) {
                        allMoodCounts[e.mood] = (allMoodCounts[e.mood] || 0) + 1;
                      }
                    });
                  });

                  // This week's mood counts
                  const weekMoodCounts: { [k: string]: number } = {};
                  thisWeekEntries.forEach((e) => {
                    if (e.mood && !e.flaggedWord) {
                      weekMoodCounts[e.mood] = (weekMoodCounts[e.mood] || 0) + 1;
                    }
                  });

                  // Find most common mood
                  const mostCommonMood = Object.entries(allMoodCounts).sort((a, b) => b[1] - a[1])[0];
                  const mostCommonMoodInfo = mostCommonMood ? moodConfig[mostCommonMood[0] as keyof typeof moodConfig] : null;

                  // Calculate positive vs negative mood ratio
                  const positiveMoods = ["Happy / Excited / In Love", "Grateful / Content / Peaceful"];
                  const negativeMoods = ["Sad/Down", "Stressed/Overwhelmed", "Anxious/Nervous", "Tired/Drained"];
                  
                  let positiveCount = 0;
                  let negativeCount = 0;
                  Object.entries(allMoodCounts).forEach(([mood, count]) => {
                    if (positiveMoods.includes(mood)) {
                      positiveCount += count;
                    } else if (negativeMoods.includes(mood)) {
                      negativeCount += count;
                    }
                  });

                  const totalMoodEntries = positiveCount + negativeCount;
                  const positivePercentage = totalMoodEntries > 0 ? Math.round((positiveCount / totalMoodEntries) * 100) : 0;
                  const negativePercentage = totalMoodEntries > 0 ? Math.round((negativeCount / totalMoodEntries) * 100) : 0;

                  return (
                    <div className="space-y-2.5">
                      {/* This Month's Entries */}
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-2.5 border border-indigo-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-medium text-gray-600 mb-0.5">This Month</p>
                            <p className="text-lg font-bold text-indigo-900">{thisMonthEntriesCount}</p>
                            <p className="text-[10px] text-gray-500">entries</p>
                          </div>
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-base">📊</span>
                          </div>
                        </div>
                      </div>

                      {/* Most Common Mood */}
                      {mostCommonMood && mostCommonMoodInfo && (
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-2.5 border border-yellow-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-medium text-gray-600 mb-0.5">Most Common</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">{mostCommonMoodInfo.icon}</span>
                                <span className={`font-bold text-sm ${mostCommonMoodInfo.textColor}`}>
                                  {mostCommonMoodInfo.shortName}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5">{mostCommonMood[1]}x</p>
                            </div>
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-base">⭐</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* This Week Summary */}
                      {thisWeekEntries.length > 0 && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2.5 border border-green-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-[10px] font-medium text-gray-600 mb-0.5">This Week</p>
                              <p className="text-sm font-bold text-green-900">{thisWeekEntries.length} entries</p>
                            </div>
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-base">📅</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(weekMoodCounts).slice(0, 3).map(([mood, count]) => {
                              const moodInfo = moodConfig[mood as keyof typeof moodConfig];
                              if (!moodInfo) return null;
                              return (
                                <div key={mood} className={`inline-flex items-center px-1.5 py-0.5 rounded-md ${moodInfo.bgColor} ${moodInfo.borderColor} border`}>
                                  <span className="text-xs mr-0.5">{moodInfo.icon}</span>
                                  <span className={`text-[10px] font-semibold ${moodInfo.textColor}`}>
                                    {moodInfo.shortName} ({count})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Mood Balance */}
                      {totalMoodEntries > 0 && (
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-2.5 border border-blue-200 shadow-sm">
                          <p className="text-[10px] font-medium text-gray-600 mb-2">Mood Balance</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-green-700 font-medium">✨ Uplifting</span>
                              <span className="text-green-700 font-bold">{positivePercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${positivePercentage}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-red-700 font-medium">😴 Draining</span>
                              <span className="text-red-700 font-bold">{negativePercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-red-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${negativePercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Empty State */}
                      {thisMonthEntriesCount === 0 && (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-xs mb-1.5">No entries this month</p>
                          <button
                            onClick={() => router.push("/journal")}
                            className="text-indigo-600 hover:text-indigo-700 text-xs font-medium underline"
                          >
                            Start your first entry →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal - Read Only */}
      {showModal && (
        <div className="fixed inset-0 flex items-start justify-center bg-black/60 backdrop-blur-sm z-50 p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_24px_60px_-15px_rgba(79,70,229,0.5)] w-full max-w-2xl max-h-[96vh] transform transition-all duration-300 scale-100 flex flex-col my-3 sm:my-10">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  Entries for {formatDateForModal(selectedDate)}
                </h3>
                <button
                  className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl font-bold transition-all duration-200 shadow"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedDateEntries([]);
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body - Read Only */}
            <div className="flex-1 overflow-y-auto">
              {selectedDateEntries.length === 0 ? (
                <div className="p-6 sm:p-8 text-center py-8">
                  <p className="text-gray-500 text-sm">
                    No entries found for this date.
                  </p>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="border-b border-gray-200 px-6 pt-4">
                    <div className="flex gap-2">
                      {selectedDateEntries.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveTab(index)}
                          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all duration-200 ${
                            activeTab === index
                              ? "bg-white text-indigo-600 border-t border-l border-r border-gray-200 -mb-px"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Entry {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6 sm:p-8">
                    {selectedDateEntries[activeTab] && (() => {
                      const entry = selectedDateEntries[activeTab];
                      const moodInfo = entry.mood && !entry.flaggedWord ? moodConfig[entry.mood as keyof typeof moodConfig] : null;

                      return (
                        <div className="space-y-6">
                          {/* Flagged Content Warning */}
                          {entry.flaggedWord && (
                            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                              <div className="flex items-start gap-2">
                                <span className="text-2xl">⚠️</span>
                                <div className="flex-1">
                                  <p className="text-red-700 font-medium text-sm">
                                    Flagged content: <span className="font-bold">&quot;{entry.flaggedWord}&quot;</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Mood Tag - At the top */}
                          {moodInfo && (
                            <div className="flex justify-start">
                              <div className={`inline-flex items-center px-4 py-2 rounded-xl ${moodInfo.bgColor} ${moodInfo.borderColor} border-2 shadow-sm`}>
                                <span className="text-xl mr-2">{moodInfo.icon}</span>
                                <span className={`font-semibold text-sm ${moodInfo.textColor} tracking-wide`}>
                                  {moodInfo.shortName}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Journal Text - As blockquote */}
                          {entry.text && (
                            <blockquote className="border-l-4 border-indigo-300 pl-4 py-2 text-gray-700 italic">
                              <p className="whitespace-pre-wrap break-words leading-relaxed">
                                {entry.text}
                              </p>
                            </blockquote>
                          )}

                          {/* AI Reflection - Combined label and text */}
                          {entry.flaggedWord && entry.rawReflection && (
                            <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                              <p className="text-red-900 leading-relaxed break-words">
                                <span className="font-semibold">AI Message: </span>
                                {entry.rawReflection}
                              </p>
                            </div>
                          )}

                          {!entry.flaggedWord && entry.polishedReflection && (
                            <div className="p-4 border rounded-lg bg-purple-50">
                              <p className="text-gray-900 leading-relaxed break-words">
                                <span className="font-semibold">AI Reflection: </span>
                                {entry.polishedReflection}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
