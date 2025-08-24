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
} from "firebase/firestore";

const moods = [
  "Sad/Down",
  "Stressed/Overwhelmed",
  "Anxious/Nervous",
  "Tired/Drained",
  "Happy / Excited / In Love",
  "Grateful / Content / Peaceful",
];

const db = getFirestore();

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function CalendarPage() {
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [journalText, setJournalText] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [entryLoading, setEntryLoading] = useState(false);
  const [entrySuccess, setEntrySuccess] = useState("");
  const [entryError, setEntryError] = useState("");
  const [entries, setEntries] = useState<{ [date: string]: { mood: string; text: string } } | null>(null);
  const [foodSuggestions, setFoodSuggestions] = useState<Array<{ food: string; reason: string }>>([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const router = useRouter();

  // Watch authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setEntries(null);
        router.replace("/");
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

        const newEntries: { [date: string]: { mood: string; text: string } } = {};
        querySnap.forEach((docSnap) => {
          const data = docSnap.data() as { mood: string; text: string; date: string };
          newEntries[data.date] = { mood: data.mood, text: data.text };
        });

        setEntries(newEntries);
      };

      fetchEntries();
    }
  }, [user, calendarMonth, calendarYear]);

  // Fetch food suggestions when mood changes
  useEffect(() => {
    if (selectedMood) {
      fetchFoodSuggestions(selectedMood);
    } else {
      setFoodSuggestions([]);
    }
  }, [selectedMood]);

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
        
        // Select one random suggestion
        if (allSuggestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * allSuggestions.length);
          setFoodSuggestions([allSuggestions[randomIndex]]);
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

  const handleDayClick = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setJournalText(entries?.[dateStr]?.text || "");
    setSelectedMood(entries?.[dateStr]?.mood || "");
    setShowModal(true);
    setEntrySuccess("");
    setEntryError("");
  };

  const handleSaveEntry = async () => {
    if (!selectedDate || !selectedMood) {
      setEntryError("Please select a mood and write something.");
      return;
    }
    setEntryLoading(true);
    setEntryError("");
    setEntrySuccess("");

    try {
      // Save to users/{uid}/journalEntries/{date}
      await setDoc(doc(db, "users", user.uid, "journalEntries", selectedDate), {
        userId: user.uid,
        date: selectedDate,
        mood: selectedMood,
        text: journalText,
      });

      setEntrySuccess("Entry saved!");
      setShowModal(false);

      // Update local state so UI is instant
      setEntries((prev) => ({
        ...prev,
        [selectedDate]: { mood: selectedMood, text: journalText },
      }));
    } catch (err: any) {
      setEntryError(err.message || "Failed to save entry");
    } finally {
      setEntryLoading(false);
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

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const today = new Date();
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">📅</span>
              </div>
              <h1 className="text-2xl font-bold">MoodMirror</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-indigo-100 font-medium">
                Welcome, {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Container */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
            <div className="flex justify-between items-center">
              <button 
                onClick={handlePrevMonth} 
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-all duration-200 backdrop-blur-sm"
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
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-all duration-200 backdrop-blur-sm"
              >
                ›
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-8">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-3 mb-4">
              {weekdayNames.map((day) => (
                <div key={day} className="text-center font-bold text-gray-600 text-sm uppercase tracking-wider py-2">
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
                  dateStr ===
                  `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                
                return (
                  <button
                    key={day}
                    className={`group relative h-24 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                      ${entry 
                        ? "bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 shadow-md" 
                        : "bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-purple-300"
                      }
                      ${isToday ? "ring-4 ring-indigo-400 ring-offset-2" : ""}
                      hover:from-purple-50 hover:to-pink-50`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="absolute top-2 left-2">
                      <span className={`font-bold text-lg ${
                        entry ? "text-purple-800" : "text-gray-700"
                      }`}>
                        {day}
                      </span>
                    </div>
                    {entry && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1">
                          <span className="text-xs font-medium text-purple-700 truncate block">
                            {entry.mood.split(" / ")[0]}
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  📝 Journal Entry
                </h3>
                <button
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl font-bold transition-all duration-200"
                  onClick={() => setShowModal(false)}
                  disabled={entryLoading}
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
            <div className="p-6">
              <div className="mb-4">
                <label className="block mb-2 font-semibold text-gray-700">
                  How are you feeling today? 💭
                </label>
                <select
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all duration-200"
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                >
                  <option value="">Select your mood</option>
                  {moods.map((mood) => (
                    <option key={mood} value={mood}>
                      {mood}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-semibold text-gray-700">
                  What's on your mind? ✍️
                </label>
                <textarea
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all duration-200 resize-none"
                  rows={4}
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
                    <p className="text-gray-500 text-sm">No specific food suggestions for this mood yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {foodSuggestions.map((suggestion, index) => (
                        <div key={index} className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                          <p className="font-medium text-indigo-800">{suggestion.food}</p>
                          <p className="text-indigo-600 text-xs">{suggestion.reason}</p>
                        </div>
                      ))}
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

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-all duration-200"
                  onClick={() => setShowModal(false)}
                  disabled={entryLoading}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  onClick={handleSaveEntry}
                  disabled={entryLoading}
                >
                  {entryLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Saving...
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
    </div>
  );
}
