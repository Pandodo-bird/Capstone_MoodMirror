"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  setDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

const moods = [
  "Sad/Down",
  "Stressed/Overwhelmed",
  "Anxious/Nervous",
  "Tired/Drained",
  "Happy / Excited / In Love",
  "Grateful / Content / Peaceful",
];

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
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [journalText, setJournalText] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [entryLoading, setEntryLoading] = useState(false);
  const [entrySuccess, setEntrySuccess] = useState("");
  const [entryError, setEntryError] = useState("");
  const [entries, setEntries] = useState<{ [date: string]: { mood: string; text: string; polishedReflection?: string } } | null>(null);
  const [foodSuggestions, setFoodSuggestions] = useState<Array<{ food: string; reason: string }>>([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [rawReflection, setRawReflection] = useState("");
  const [polishedReflection, setPolishedReflection] = useState("");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [avoidedFoods, setAvoidedFoods] = useState<Set<string>>(new Set());
  const [avoidingFood, setAvoidingFood] = useState(false);
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

  // Fetch all entries for the current month
  useEffect(() => {
    if (user) {
      const fetchEntries = async () => {
        const startOfMonth = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-01`;
        const endOfMonth = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(getDaysInMonth(calendarYear, calendarMonth)).padStart(2, "0")}`;

        const entriesRef = collection(db, "users", user.uid, "journalEntries");
        const q = query(entriesRef, where("date", ">=", startOfMonth), where("date", "<=", endOfMonth));
        const querySnap = await getDocs(q);

        const newEntries: { [date: string]: { mood: string; text: string; polishedReflection?: string } } = {};
        querySnap.forEach((docSnap) => {
          const data = docSnap.data() as { mood: string; text: string; date: string; polishedReflection?: string };
          newEntries[data.date] = {
            mood: data.mood,
            text: data.text,
            polishedReflection: data.polishedReflection,
          };
        });

        setEntries(newEntries);
      };

      fetchEntries();
    }
  }, [user, calendarMonth, calendarYear]);

  // Fetch avoided foods for the user
  useEffect(() => {
    if (user) {
      const fetchAvoidedFoods = async () => {
        try {
          const avoidedFoodsRef = collection(db, "users", user.uid, "avoidedFoods");
          const querySnap = await getDocs(avoidedFoodsRef);
          const avoidedSet = new Set<string>();
          
          querySnap.forEach((docSnap) => {
            const data = docSnap.data() as { food: string };
            avoidedSet.add(data.food);
          });
          
          setAvoidedFoods(avoidedSet);
        } catch (error) {
          console.error("Error fetching avoided foods:", error);
        }
      };

      fetchAvoidedFoods();
    }
  }, [user]);

  // Fetch food suggestions when mood changes
  useEffect(() => {
    if (selectedMood) {
      fetchFoodSuggestions(selectedMood);
    } else {
      setFoodSuggestions([]);
    }
  }, [selectedMood, avoidedFoods]);

  const fetchFoodSuggestions = async (mood: string) => {
    setFoodLoading(true);
    try {
      // Replace all forward slashes with underscores to match the document ID format
      const moodDocId = mood.replace(/\//g, "_");
      
      // Get the mood document from mood_foods collection
      const moodDocRef = doc(db, "mood_foods", moodDocId);
      const moodDoc = await getDoc(moodDocRef);
      
      if (moodDoc.exists()) {
        const data = moodDoc.data();
        const allSuggestions: Array<{ food: string; reason: string }> = [];
        
        // Extract all food suggestions from the document fields
        Object.keys(data).forEach((key) => {
          if (data[key] && typeof data[key] === 'object' && 'food' in data[key] && 'reason' in data[key]) {
            allSuggestions.push({
              food: data[key].food,
              reason: data[key].reason
            });
          }
        });
        
        // Filter out avoided foods
        const availableSuggestions = allSuggestions.filter(suggestion => 
          !avoidedFoods.has(suggestion.food)
        );
        
        // Select one random suggestion from available (non-avoided) foods
        if (availableSuggestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableSuggestions.length);
          setFoodSuggestions([availableSuggestions[randomIndex]]);
        } else if (allSuggestions.length > 0) {
          // If all foods are avoided, show a message
          setFoodSuggestions([]);
        } else {
          setFoodSuggestions([]);
        }
      } else {
        setFoodSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching food suggestions:", error);
      setFoodSuggestions([]);
    } finally {
      setFoodLoading(false);
    }
  };

  const handleDayClick = async (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setJournalText(entries?.[dateStr]?.text || "");
    setSelectedMood(entries?.[dateStr]?.mood || "");
    setPolishedReflection(entries?.[dateStr]?.polishedReflection || "");
    setRawReflection("");
    setShowModal(true);
    setEntrySuccess("");
    setEntryError("");
    try {
      if (user) {
        const rawRefDocRef = doc(db, "users", user.uid, "journalEntries", dateStr, "details", "ai");
        const rawRefDoc = await getDoc(rawRefDocRef);
        if (rawRefDoc.exists()) {
          const rawData = rawRefDoc.data() as { rawReflection?: string };
          setRawReflection(rawData.rawReflection || "");
        }
      }
    } catch (e) {
      console.error("Error fetching raw reflection:", e);
    }
  };

  const handleSaveEntry = async () => {
    if (!selectedDate || !selectedMood) {
      setEntryError("Please select a mood and write something.");
      return;
    }
    setEntryLoading(true);
    setReflectionLoading(true);
    setEntryError("");
    setEntrySuccess("");

    try {
      // First save the basic entry to Firebase
      await setDoc(doc(db, "users", user.uid, "journalEntries", selectedDate), {
        userId: user.uid,
        date: selectedDate,
        mood: selectedMood,
        text: journalText,
      });

      // Generate reflection using FastAPI
      const prompt = `${selectedMood}: ${journalText}`;
      try {
        const res = await fetch("http://127.0.0.1:8000/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: prompt }),
        });

        const data = await res.json();
        const newRawReflection = data.raw_reflection;
        const newPolishedReflection = data.polished_reflection;

        // Update Firebase: store polished reflection on the main doc
        await setDoc(doc(db, "users", user.uid, "journalEntries", selectedDate), {
          userId: user.uid,
          date: selectedDate,
          mood: selectedMood,
          text: journalText,
          polishedReflection: newPolishedReflection,
        });

        // Store raw reflection in a subdocument under this entry
        await setDoc(doc(db, "users", user.uid, "journalEntries", selectedDate, "details", "ai"), {
          rawReflection: newRawReflection,
          generatedAt: new Date().toISOString(),
        });

        // Update local state
        setRawReflection(newRawReflection);
        setPolishedReflection(newPolishedReflection);
        setEntries((prev) => ({
          ...prev,
          [selectedDate]: {
            mood: selectedMood,
            text: journalText,
            polishedReflection: newPolishedReflection,
          },
        }));

        setEntrySuccess("Entry saved with reflection generated!");
      } catch (reflectionError) {
        console.error("Error generating reflection:", reflectionError);
        // Still show success for the basic entry, but mention reflection failed
        setEntrySuccess("Entry saved! (Reflection generation failed)");
      }
    } catch (err: any) {
      setEntryError(err.message || "Failed to save entry");
    } finally {
      setEntryLoading(false);
      setReflectionLoading(false);
    }
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

  const handleClearEntry = async () => {
    if (!selectedDate || !user) return;
    
    setClearLoading(true);
    setEntryError("");
    setEntrySuccess("");

    try {
      // Delete the document from Firebase
      await deleteDoc(doc(db, "users", user.uid, "journalEntries", selectedDate));

      // Also delete the raw reflection subdocument if it exists
      try {
        await deleteDoc(doc(db, "users", user.uid, "journalEntries", selectedDate, "details", "ai"));
      } catch (subErr) {
        // Best-effort; ignore if missing
      }

      // Update local state to remove the entry
      setEntries((prev) => {
        if (!prev) return prev;
        const newEntries = { ...prev };
        delete newEntries[selectedDate];
        return newEntries;
      });

      // Clear the modal form
      setJournalText("");
      setSelectedMood("");
      setRawReflection("");
      setPolishedReflection("");
      setFoodSuggestions([]);

      setEntrySuccess("Entry cleared successfully!");
      setShowClearConfirm(false);
    } catch (err: any) {
      setEntryError(err.message || "Failed to clear entry");
    } finally {
      setClearLoading(false);
    }
  };

  const handleAvoidFood = async (foodToAvoid: string) => {
    if (!user) return;
    
    setAvoidingFood(true);
    setEntryError("");
    setEntrySuccess("");

    try {
      // Add the food to avoided foods collection in Firebase
      const avoidedFoodRef = doc(db, "users", user.uid, "avoidedFoods", foodToAvoid.replace(/\s+/g, "_"));
      await setDoc(avoidedFoodRef, {
        food: foodToAvoid,
        userId: user.uid,
        avoidedAt: new Date().toISOString()
      });

      // Update local state
      setAvoidedFoods(prev => new Set([...prev, foodToAvoid]));

      // Remove the avoided food from current suggestions
      setFoodSuggestions(prev => prev.filter(suggestion => suggestion.food !== foodToAvoid));

      setEntrySuccess(`"${foodToAvoid}" added to your avoided foods list!`);
    } catch (err: any) {
      setEntryError(err.message || "Failed to avoid food");
    } finally {
      setAvoidingFood(false);
    }
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
      <div className="relative max-w-6xl mx-auto px-6 py-8">
        {/* Ambient gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute right-[-120px] top-0 w-72 h-72 bg-gradient-to-br from-pink-300/40 to-indigo-300/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute left-[-120px] bottom-0 w-72 h-72 bg-gradient-to-br from-purple-300/40 to-yellow-300/40 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-7 rounded-2xl shadow-lg relative">
  {/* Month Navigation */}
  <div className="flex justify-between items-center">
    <button
      onClick={handlePrevMonth}
      className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-all duration-200 backdrop-blur-sm shadow"
    >
      ‹
    </button>

    <h2 className="text-3xl font-bold text-white tracking-wide">
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
  <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 opacity-80 shadow-inner" />

  {/* Month Quick Stats */}
  <div className="mt-4 flex flex-wrap items-center gap-3">
    {(() => {
      const entryList = Object.values(entries || {});
      const totalEntriesThisMonth = entryList.length;

      // Count moods
      const moodCounts: { [k: string]: number } = {};
      entryList.forEach((e) => {
        if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      });

      // Get all moods present this month, sorted by frequency
      const moodsThisMonth = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);

      return (
        <>
          {/* Total entries pill */}
          <span className="px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white/95 text-sm font-medium backdrop-blur-sm shadow-sm">
            {totalEntriesThisMonth} {totalEntriesThisMonth === 1 ? "entry" : "entries"} this month
          </span>

          {/* Individual mood pills */}
          {moodsThisMonth.map(([moodKey, count]) => {
            const moodInfo = moodConfig[moodKey as keyof typeof moodConfig];
            if (!moodInfo) return null;

            return (
              <span
                key={moodKey}
                className="px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white/95 text-sm font-semibold backdrop-blur-sm flex items-center gap-2 shadow-sm hover:scale-105 transition-transform duration-200"
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
          <div className="p-8">
            {/* Mood Legend */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center tracking-wide">Mood Legend</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(moodConfig).map(([mood, config]) => (
                  <div key={mood} className={`flex items-center px-3 py-2 rounded-lg ${config.bgColor} ${config.borderColor} border shadow-sm`}>
                    <span className="text-lg mr-2">{config.icon}</span>
                    <span className={`text-xs font-medium ${config.textColor} truncate tracking-wide`}>
                      {config.shortName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative band under legend */}
            <div className="relative h-12 rounded-xl overflow-hidden mb-6">
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
            <div className="grid grid-cols-7 gap-3 mb-4">
              {weekdayNames.map((day) => (
                <div key={day} className="text-center font-bold text-gray-700 text-xs sm:text-sm uppercase tracking-wider py-2 bg-gradient-to-br from-white to-indigo-50 rounded-lg border border-gray-200 shadow-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={"empty-" + i} className="h-24"></div>
              ))}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const entry = entries?.[dateStr];
                const isToday =
                  dateStr === todayStr;
                const isFuture = dateStr > todayStr;
                
                const moodInfo = entry?.mood ? moodConfig[entry.mood as keyof typeof moodConfig] : null;
                
                return (
                  <button
                    key={day}
                    className={`group relative h-28 rounded-2xl transition-all duration-300
                      ${!isFuture ? "transform hover:scale-[1.04] hover:shadow-xl" : "opacity-50 cursor-not-allowed"}
                      ${!isFuture && entry && moodInfo
                        ? `bg-gradient-to-br ${moodInfo.bgColor} border-2 ${moodInfo.borderColor} shadow-md`
                        : "bg-gradient-to-br from-indigo-50 to-pink-50 border-2 border-indigo-200"}
                      ${!isFuture && !entry ? "hover:border-purple-300 hover:ring-2 hover:ring-indigo-100" : ""}
                      ${isToday ? "ring-4 ring-indigo-400 ring-offset-2" : ""}
                      ${!isFuture && entry && moodInfo ? `hover:${moodInfo.bgColor}` : (!isFuture ? "hover:from-purple-50 hover:to-pink-50" : "")}`}
                    onClick={() => { if (!isFuture) handleDayClick(day); }}
                  >
                    <div className="absolute top-2 left-2">
                      <span className={`font-bold text-lg ${
                        !isFuture && entry && moodInfo ? moodInfo.textColor : "text-gray-700"
                      }`}>
                        {day}
                      </span>
                    </div>
                    {!isFuture && entry && moodInfo && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1.5 flex items-center justify-center shadow ring-1 ring-white/60">
                          <span className="text-lg mr-1">{moodInfo.icon}</span>
                          <span className={`text-xs font-semibold ${moodInfo.textColor} truncate tracking-wide`}>
                            {moodInfo.shortName}
                          </span>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-start justify-center bg-black/60 backdrop-blur-sm z-50 p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_24px_60px_-15px_rgba(79,70,229,0.5)] w-full max-w-2xl max-h-[96vh] transform transition-all duration-300 scale-100 flex flex-col my-3 sm:my-10">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  📝 Journal Entry
                </h3>
                <button
                  className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl font-bold transition-all duration-200 shadow"
                  onClick={() => {
                    setShowModal(false);
                    setRawReflection("");
                    setPolishedReflection("");
                  }}
                  disabled={entryLoading || reflectionLoading}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <p className="text-indigo-100 text-sm mt-1">
                {selectedDate}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block mb-2 font-semibold text-gray-700">
                  How are you feeling today? 💭
                </label>
                <select
                  className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all duration-200 bg-white"
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                >
                  <option value="">Select your mood</option>
                  {moods.map((mood) => {
                    const moodInfo = moodConfig[mood as keyof typeof moodConfig];
                    return (
                      <option key={mood} value={mood}>
                        {moodInfo.icon} {mood}
                      </option>
                    );
                  })}
                </select>
                
                {/* Selected Mood Visual Indicator */}
                {selectedMood && moodConfig[selectedMood as keyof typeof moodConfig] && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className={`inline-flex items-center px-5 py-2.5 rounded-xl ${moodConfig[selectedMood as keyof typeof moodConfig].bgColor} ${moodConfig[selectedMood as keyof typeof moodConfig].borderColor} border-2 shadow-sm`}>
                      <span className="text-2xl mr-2">{moodConfig[selectedMood as keyof typeof moodConfig].icon}</span>
                      <span className={`font-semibold ${moodConfig[selectedMood as keyof typeof moodConfig].textColor} tracking-wide`}>
                        {moodConfig[selectedMood as keyof typeof moodConfig].shortName}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-semibold text-gray-700">
                  What's on your mind? ✍️
                </label>
                <textarea
                  className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all duration-200 resize-none bg-white"
                  rows={6}
                  placeholder="Write your thoughts, feelings, or anything you'd like to remember..."
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                />
              </div>

              {/* Food Suggestions */}
              {selectedMood && (
                <div className="mb-6">
                  <label className="block mb-2 font-semibold text-gray-700">
                    Food Suggestions 🍽️
                  </label>
                  {foodLoading ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-indigo-600 text-sm mt-2">Loading food suggestions...</p>
                    </div>
                  ) : foodSuggestions.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm mb-2">
                        {avoidedFoods.size > 0 
                          ? "All food suggestions for this mood have been avoided. Try a different mood or remove some avoided foods from your profile."
                          : "No specific food suggestions for this mood yet."
                        }
                      </p>
                      {avoidedFoods.size > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-400 mb-2">
                            You have {avoidedFoods.size} avoided food{avoidedFoods.size > 1 ? 's' : ''}
                          </p>
                          <button
                            onClick={() => fetchFoodSuggestions(selectedMood)}
                            disabled={foodLoading}
                            className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 shadow-sm"
                          >
                            🔄 Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {foodSuggestions.map((suggestion, index) => (
                        <div key={index} className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-indigo-800">{suggestion.food}</p>
                              <p className="text-indigo-600 text-xs mt-1">{suggestion.reason}</p>
                            </div>
                            <button
                              onClick={() => handleAvoidFood(suggestion.food)}
                              disabled={avoidingFood}
                              className="ml-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
                              title="Avoid this food in future recommendations"
                            >
                              {avoidingFood ? (
                                <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <span>🚫</span>
                                  <span>Avoid</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reflection Display */}
              {(rawReflection || polishedReflection || reflectionLoading) && (
                <div className="mb-6">
                  <label className="block mb-2 font-semibold text-gray-700">
                    AI Reflection 🤖
                  </label>
                  {reflectionLoading ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-purple-600 text-sm mt-2">Generating reflection...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/*rawReflection && (
                        <div className="p-3 sm:p-4 border rounded-lg shadow-sm bg-white">
                          <h4 className="font-semibold text-gray-700 mb-2 text-sm">
                            Your AI Reflection:
                          </h4>
                          <p className="text-gray-800 leading-relaxed text-sm break-words">{rawReflection}</p>
                        </div>
                      )*/}
                      {polishedReflection && (
                        <div className="p-3 sm:p-4 border rounded-lg shadow-sm bg-purple-50">
                          <h4 className="font-semibold text-gray-700 mb-2 text-sm">
                           Reflection:
                          </h4>
                          <p className="text-gray-900 leading-relaxed text-sm break-words">
                            {polishedReflection}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Status Messages */}
              {entryError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  ⚠️ {entryError}
                </div>
              )}
              {entrySuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✅ {entrySuccess}
                </div>
              )}

            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="p-4 sm:p-6 pt-0 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex-shrink-0">
              {/* Clear Entry Button - Only show if there's existing data */}
              {(journalText || selectedMood || rawReflection || polishedReflection) && (
                <div className="mb-3">
                  <button
                    className="w-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-red-200"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={entryLoading || reflectionLoading || clearLoading}
                  >
                    🗑️ Clear Entry for {selectedDate}
                  </button>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-all duration-200"
                  onClick={() => {
                    setShowModal(false);
                    setRawReflection("");
                    setPolishedReflection("");
                    setShowClearConfirm(false);
                  }}
                  disabled={entryLoading || reflectionLoading || clearLoading}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  onClick={handleSaveEntry}
                  disabled={entryLoading || reflectionLoading || clearLoading}
                >
                  {entryLoading || reflectionLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      {reflectionLoading ? "Generating reflection..." : "Saving..."}
                    </span>
                  ) : (
                    "Save Entry"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-100">
            {/* Dialog Header */}
            <div className="bg-red-50 px-6 py-4 rounded-t-2xl border-b border-red-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <h3 className="text-lg font-bold text-red-800">
                  Clear Entry
                </h3>
              </div>
            </div>

            {/* Dialog Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to clear all data for <strong>{selectedDate}</strong>? 
                This will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 mb-6 space-y-1">
                <li>• Journal entry text</li>
                <li>• Mood selection</li>
                <li>• AI reflections</li>
                <li>• All associated data</li>
              </ul>
              <p className="text-red-600 text-sm font-medium">
                This action cannot be undone.
              </p>
            </div>

            {/* Dialog Actions */}
            <div className="px-6 pb-6">
              <div className="flex gap-3">
                <button
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all duration-200"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearLoading}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleClearEntry}
                  disabled={clearLoading}
                >
                  {clearLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Clearing...
                    </span>
                  ) : (
                    "Clear Entry"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
