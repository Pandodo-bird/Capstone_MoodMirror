"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  setDoc,
  doc,
  collection,
  getDocs,
  getDoc,
  deleteDoc,
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

// Function to map API detected emotions to our mood config
function mapDetectedEmotionToMood(detectedEmotion: string): string {
  const emotionMap: { [key: string]: string } = {
    // Direct mood category matches (in case API returns the full category name)
    'sad/down': 'Sad/Down',
    'sad / down': 'Sad/Down',
    'sad down': 'Sad/Down',
    
    'anxious/nervous': 'Anxious/Nervous',
    'anxious / nervous': 'Anxious/Nervous',
    'anxious nervous': 'Anxious/Nervous',
    
    'stressed/overwhelmed': 'Stressed/Overwhelmed',
    'stressed / overwhelmed': 'Stressed/Overwhelmed',
    'stressed overwhelmed': 'Stressed/Overwhelmed',
    'stressed/frustrated': 'Stressed/Overwhelmed',
    'stressed / frustrated': 'Stressed/Overwhelmed',
    'stressed frustrated': 'Stressed/Overwhelmed',
    
    'tired/drained': 'Tired/Drained',
    'tired / drained': 'Tired/Drained',
    'tired drained': 'Tired/Drained',
    
    'happy / excited / in love': 'Happy / Excited / In Love',
    'happy/excited/in love': 'Happy / Excited / In Love',
    'happy excited in love': 'Happy / Excited / In Love',
    'happy / excited in love': 'Happy / Excited / In Love',
    'happy excited / in love': 'Happy / Excited / In Love',
    
    'grateful / content / peaceful': 'Grateful / Content / Peaceful',
    'grateful/content/peaceful': 'Grateful / Content / Peaceful',
    'grateful content peaceful': 'Grateful / Content / Peaceful',
    'grateful / content peaceful': 'Grateful / Content / Peaceful',
    'grateful content / peaceful': 'Grateful / Content / Peaceful',
    
    // Sad/Down emotions
    'sad': 'Sad/Down',
    'down': 'Sad/Down',
    'depressed': 'Sad/Down',
    'melancholy': 'Sad/Down',
    'blue': 'Sad/Down',
    'gloomy': 'Sad/Down',
    'unhappy': 'Sad/Down',
    'miserable': 'Sad/Down',
    'sorrowful': 'Sad/Down',
    
    // Anxious/Nervous emotions
    'anxious': 'Anxious/Nervous',
    'nervous': 'Anxious/Nervous',
    'worried': 'Anxious/Nervous',
    'uneasy': 'Anxious/Nervous',
    'restless': 'Anxious/Nervous',
    'apprehensive': 'Anxious/Nervous',
    'fearful': 'Anxious/Nervous',
    'panicked': 'Anxious/Nervous',
    'jittery': 'Anxious/Nervous',
    
    // Stressed/Overwhelmed emotions
    'stressed': 'Stressed/Overwhelmed',
    'overwhelmed': 'Stressed/Overwhelmed',
    'frustrated': 'Stressed/Overwhelmed',
    'pressured': 'Stressed/Overwhelmed',
    'burdened': 'Stressed/Overwhelmed',
    'swamped': 'Stressed/Overwhelmed',
    'strained': 'Stressed/Overwhelmed',
    'tense': 'Stressed/Overwhelmed',
    'burned out': 'Stressed/Overwhelmed',
    
    // Tired/Drained emotions
    'tired': 'Tired/Drained',
    'drained': 'Tired/Drained',
    'exhausted': 'Tired/Drained',
    'fatigued': 'Tired/Drained',
    'weary': 'Tired/Drained',
    'spent': 'Tired/Drained',
    'worn out': 'Tired/Drained',
    'lethargic': 'Tired/Drained',
    'sluggish': 'Tired/Drained',
    
    // Happy/Excited/In Love emotions
    'happy': 'Happy / Excited / In Love',
    'excited': 'Happy / Excited / In Love',
    'joyful': 'Happy / Excited / In Love',
    'cheerful': 'Happy / Excited / In Love',
    'elated': 'Happy / Excited / In Love',
    'thrilled': 'Happy / Excited / In Love',
    'ecstatic': 'Happy / Excited / In Love',
    'euphoric': 'Happy / Excited / In Love',
    'blissful': 'Happy / Excited / In Love',
    'in love': 'Happy / Excited / In Love',
    'romantic': 'Happy / Excited / In Love',
    'passionate': 'Happy / Excited / In Love',
    
    // Grateful/Content/Peaceful emotions
    'grateful': 'Grateful / Content / Peaceful',
    'content': 'Grateful / Content / Peaceful',
    'peaceful': 'Grateful / Content / Peaceful',
    'calm': 'Grateful / Content / Peaceful',
    'serene': 'Grateful / Content / Peaceful',
    'tranquil': 'Grateful / Content / Peaceful',
    'satisfied': 'Grateful / Content / Peaceful',
    'fulfilled': 'Grateful / Content / Peaceful',
    'appreciative': 'Grateful / Content / Peaceful',
    'mindful': 'Grateful / Content / Peaceful',
    'zen': 'Grateful / Content / Peaceful'
  };
  
  const lowerEmotion = detectedEmotion.toLowerCase().trim();
  
  // First try exact match
  if (emotionMap[lowerEmotion]) {
    return emotionMap[lowerEmotion];
  }
  
  // If no exact match, try to find partial matches
  const partialMatches = {
    'sad': 'Sad/Down',
    'down': 'Sad/Down',
    'anxious': 'Anxious/Nervous',
    'nervous': 'Anxious/Nervous',
    'stressed': 'Stressed/Overwhelmed',
    'overwhelmed': 'Stressed/Overwhelmed',
    'frustrated': 'Stressed/Overwhelmed',
    'tired': 'Tired/Drained',
    'drained': 'Tired/Drained',
    'happy': 'Happy / Excited / In Love',
    'excited': 'Happy / Excited / In Love',
    'grateful': 'Grateful / Content / Peaceful',
    'content': 'Grateful / Content / Peaceful',
    'peaceful': 'Grateful / Content / Peaceful'
  };
  
  // Check if any of the partial matches are contained in the detected emotion
  for (const [key, value] of Object.entries(partialMatches)) {
    if (lowerEmotion.includes(key)) {
      return value;
    }
  }
  
  return 'Happy / Excited / In Love'; // Default fallback
}

interface JournalEntry {
  id: number;
  text: string;
  detectedMood: string;
  rawDetectedEmotion: string;
  rawReflection: string;
  polishedReflection: string;
  foodSuggestions: Array<{ name: string; reason: string }>;
  flaggedWord: string | null;
  expandedFoodIndex: number | null;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  entryLoading: boolean;
  reflectionLoading: boolean;
  entryError: string;
  entrySuccess: string;
}

export default function JournalPage() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState<{ entryId: number } | null>(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [avoidedFoods, setAvoidedFoods] = useState<Set<string>>(new Set());
  const [avoidingFood, setAvoidingFood] = useState<{ entryId: number; food: string } | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<number | null>(null);
  const [savedEntryIds, setSavedEntryIds] = useState<Set<number>>(new Set());
  const router = useRouter();

  // Get today's date string
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Initialize a new entry
  const createNewEntry = (id: number): JournalEntry => ({
    id,
    text: "",
    detectedMood: "",
    rawDetectedEmotion: "",
    rawReflection: "",
    polishedReflection: "",
    foodSuggestions: [],
    flaggedWord: null,
    expandedFoodIndex: null,
    textareaRef: React.createRef<HTMLTextAreaElement>(),
    entryLoading: false,
    reflectionLoading: false,
    entryError: "",
    entrySuccess: "",
  });

  // Initialize with one empty entry if no entries exist
  useEffect(() => {
    if (user && entries.length === 0) {
      const newEntry = createNewEntry(0);
      setEntries([newEntry]);
      setExpandedEntryId(0); // Expand the first empty entry
    }
  }, [user]);

  // Auto-resize textareas when entries are loaded or text changes
  useEffect(() => {
    entries.forEach(entry => {
      if (entry.textareaRef.current && entry.text) {
        entry.textareaRef.current.style.height = 'auto';
        entry.textareaRef.current.style.height = `${Math.max(120, entry.textareaRef.current.scrollHeight)}px`;
      }
    });
  }, [entries.map(e => e.text).join(',')]);

  // Watch authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
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

  // Load existing entries for today if they exist
  useEffect(() => {
    if (user) {
      const loadTodayEntries = async () => {
        try {
          // Load entries from subcollection
          const entriesRef = collection(db, "users", user.uid, "journalEntries", todayStr, "entries");
          const entriesSnap = await getDocs(entriesRef);
          
          if (entriesSnap.empty) {
            // No entries found, initialize with one empty entry
            setEntries([createNewEntry(0)]);
            return;
          }

          const loadedEntries: JournalEntry[] = [];
          const entryPromises: Promise<void>[] = [];

          entriesSnap.forEach((docSnap) => {
            const data = docSnap.data();
            const entryId = parseInt(docSnap.id);
            
            const entry: JournalEntry = {
              id: entryId,
              text: data.text || "",
              detectedMood: data.mood || "",
              rawDetectedEmotion: "",
              rawReflection: "",
              polishedReflection: data.polishedReflection || "",
              foodSuggestions: [],
              flaggedWord: data.flaggedWord || null,
              expandedFoodIndex: null,
              textareaRef: React.createRef<HTMLTextAreaElement>(),
              entryLoading: false,
              reflectionLoading: false,
              entryError: "",
              entrySuccess: "",
            };

            // Load AI details for this entry
            const loadAIDetails = async () => {
              try {
                const aiDetailsRef = doc(db, "users", user.uid, "journalEntries", todayStr, "entries", docSnap.id, "details", "ai");
                const aiDetailsDoc = await getDoc(aiDetailsRef);
                if (aiDetailsDoc.exists()) {
                  const aiData = aiDetailsDoc.data();
                  entry.rawReflection = aiData.rawReflection || "";
                  entry.rawDetectedEmotion = aiData.detectedEmotion || "";
                  
                  if (aiData.flaggedWord) {
                    entry.flaggedWord = aiData.flaggedWord;
                  } else if (aiData.foodSuggestions) {
                    // Filter food suggestions
                    const filtered = aiData.foodSuggestions.filter((s: { name: string; reason: string }) => 
                      !avoidedFoods.has(s.name)
                    );
                    entry.foodSuggestions = filtered;
                  }
                }
              } catch (e) {
                console.error("Error loading AI details:", e);
              }
            };

            entryPromises.push(loadAIDetails());
            loadedEntries.push(entry);
          });

          // Wait for all AI details to load
          await Promise.all(entryPromises);

          // Sort by entry ID
          loadedEntries.sort((a, b) => a.id - b.id);
          
          // If no entries loaded, create one empty entry
          if (loadedEntries.length === 0) {
            const newEntry = createNewEntry(0);
            setEntries([newEntry]);
            setExpandedEntryId(0);
          } else {
            setEntries(loadedEntries);
            // Mark all loaded entries as saved (they should be collapsed)
            const savedIds = new Set(loadedEntries.map(e => e.id));
            setSavedEntryIds(savedIds);
            // Expand the last entry if it has content, otherwise expand the first empty one
            const lastEntry = loadedEntries[loadedEntries.length - 1];
            if (lastEntry.text.trim() || lastEntry.detectedMood) {
              // If last entry has content, create a new empty one and expand it
              const newId = Math.max(...loadedEntries.map(e => e.id)) + 1;
              const newEntry = createNewEntry(newId);
              setEntries([...loadedEntries, newEntry]);
              setExpandedEntryId(newId);
            } else {
              // Expand the last entry if it's empty
              setExpandedEntryId(lastEntry.id);
              savedIds.delete(lastEntry.id);
              setSavedEntryIds(savedIds);
            }
          }
        } catch (e) {
          console.error("Error loading today's entries:", e);
          // Initialize with one empty entry on error
          setEntries([createNewEntry(0)]);
        }
      };
      
      loadTodayEntries();
    }
  }, [user, todayStr, avoidedFoods]);


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

  // Helper function to update a specific entry
  const updateEntry = (entryId: number, updates: Partial<JournalEntry>) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, ...updates } : entry
    ));
  };

  // Add a new entry (up to 3)
  const handleAddEntry = () => {
    if (entries.length >= 3) return;
    const newId = entries.length > 0 ? Math.max(...entries.map(e => e.id)) + 1 : 0;
    setEntries(prev => [...prev, createNewEntry(newId)]);
    setExpandedEntryId(newId); // Expand the new entry
  };

  // Remove an entry
  const handleRemoveEntry = (entryId: number) => {
    if (entries.length <= 1) return; // Keep at least one entry
    setEntries(prev => prev.filter(entry => entry.id !== entryId));
  };

  const handleSaveEntry = async (entryId: number) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry || !entry.text.trim()) {
      updateEntry(entryId, { entryError: "Please write something in your journal entry." });
      return;
    }

    updateEntry(entryId, { entryLoading: true, reflectionLoading: true, entryError: "", entrySuccess: "" });

    try {
      // Generate reflection using FastAPI
      try {
        // Convert avoided foods Set to array for API request
        const avoidedFoodsArray = Array.from(avoidedFoods);
        
        const res = await fetch("https://pandorasx-moodmirrorapi.hf.space/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: entry.text,
            avoided_foods: avoidedFoodsArray
          }),
        });

        const data = await res.json();
        const flaggedWordData = data.flagged_word;
        
        // Check if content is flagged
        if (flaggedWordData) {
          // Content is flagged - don't process emotion/mood, don't save to database, but show raw_reflection
          const flaggedRawReflection = data.raw_reflection || "";
          
          updateEntry(entryId, {
            flaggedWord: flaggedWordData,
            detectedMood: "",
            rawDetectedEmotion: "",
            rawReflection: flaggedRawReflection,
            polishedReflection: "",
            foodSuggestions: [],
            entryError: "",
            entryLoading: false,
            reflectionLoading: false,
          });
          
          // Do NOT save to database when content is flagged
          return;
        }
        
        // Content is not flagged - proceed with normal processing
        const detectedEmotion = data.detected_emotion;
        const newRawReflection = data.raw_reflection;
        const newPolishedReflection = data.polished_reflection;
        const apiFoodSuggestions = data.food_suggestions || [];
        
        // Map the detected emotion to our mood config
        const mappedMood = mapDetectedEmotionToMood(detectedEmotion);

        // Filter out avoided foods from API suggestions
        const filteredFoodSuggestions = apiFoodSuggestions.filter((suggestion: { name: string; reason: string }) => 
          !avoidedFoods.has(suggestion.name)
        );

        // Save the complete entry to Firebase
        const entryDocRef = doc(db, "users", user.uid, "journalEntries", todayStr, "entries", entryId.toString());
        await setDoc(entryDocRef, {
          userId: user.uid,
          date: todayStr,
          entryId: entryId,
          mood: mappedMood,
          text: entry.text,
          polishedReflection: newPolishedReflection,
          flagged: false,
        });

        // Store raw reflection, detected emotion, and food suggestions in a subdocument
        await setDoc(doc(db, "users", user.uid, "journalEntries", todayStr, "entries", entryId.toString(), "details", "ai"), {
          rawReflection: newRawReflection,
          detectedEmotion: detectedEmotion,
          foodSuggestions: apiFoodSuggestions,
          generatedAt: new Date().toISOString(),
        });

        // Update local state
        updateEntry(entryId, {
          detectedMood: mappedMood,
          rawDetectedEmotion: detectedEmotion,
          rawReflection: newRawReflection,
          polishedReflection: newPolishedReflection,
          foodSuggestions: filteredFoodSuggestions,
          flaggedWord: null,
          entrySuccess: `Entry saved! AI detected: ${moodConfig[mappedMood as keyof typeof moodConfig].shortName}`,
          entryLoading: false,
          reflectionLoading: false,
        });

        // Mark as saved and collapse the entry
        setSavedEntryIds(prev => new Set([...prev, entryId]));
        setExpandedEntryId(null); // Collapse this entry
      } catch (reflectionError) {
        console.error("Error generating reflection:", reflectionError);
        updateEntry(entryId, {
          entryError: "Failed to generate reflection. Please try again.",
          entryLoading: false,
          reflectionLoading: false,
        });
      }
    } catch (err: any) {
      updateEntry(entryId, {
        entryError: err.message || "Failed to save entry",
        entryLoading: false,
        reflectionLoading: false,
      });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  const handleClearEntry = async (entryId: number) => {
    if (!user) return;
    
    setClearLoading(true);

    try {
      // Delete the entry document from Firebase
      await deleteDoc(doc(db, "users", user.uid, "journalEntries", todayStr, "entries", entryId.toString()));

      // Also delete the AI details subdocument if it exists
      try {
        await deleteDoc(doc(db, "users", user.uid, "journalEntries", todayStr, "entries", entryId.toString(), "details", "ai"));
      } catch (subErr) {
        // Best-effort; ignore if missing
      }

      // Clear the entry in local state
      updateEntry(entryId, {
        text: "",
        detectedMood: "",
        rawDetectedEmotion: "",
        rawReflection: "",
        polishedReflection: "",
        foodSuggestions: [],
        flaggedWord: null,
        entrySuccess: "Entry cleared successfully!",
      });

      // Remove from saved entries and expand it
      setSavedEntryIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
      setExpandedEntryId(entryId);

      setShowClearConfirm(null);
    } catch (err: any) {
      updateEntry(entryId, { entryError: err.message || "Failed to clear entry" });
    } finally {
      setClearLoading(false);
    }
  };

  const handleAvoidFood = async (entryId: number, foodToAvoid: string) => {
    if (!user) return;
    
    setAvoidingFood({ entryId, food: foodToAvoid });

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

      // Remove the avoided food from current suggestions for this entry (frontend only, no API call)
      const entry = entries.find(e => e.id === entryId);
      if (entry) {
        updateEntry(entryId, {
          foodSuggestions: entry.foodSuggestions.filter(suggestion => suggestion.name !== foodToAvoid),
          entrySuccess: `"${foodToAvoid}" added to your avoided foods list!`,
        });
      }
    } catch (err: any) {
      updateEntry(entryId, { entryError: err.message || "Failed to avoid food" });
    } finally {
      setAvoidingFood(null);
    }
  };

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
                <span className="text-xl">📝</span>
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
                onClick={() => router.push("/calendar")}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30 shadow-sm"
              >
                📅 Calendar
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

      {/* Main Content Container */}
      <div className="relative max-w-4xl mx-auto px-6 py-8">
        {/* Ambient gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute right-[-120px] top-0 w-72 h-72 bg-gradient-to-br from-pink-300/40 to-indigo-300/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute left-[-120px] bottom-0 w-72 h-72 bg-gradient-to-br from-purple-300/40 to-yellow-300/40 rounded-full blur-3xl animate-pulse" />
        </div>
        
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-7 rounded-2xl shadow-lg relative">
            <h2 className="text-3xl font-bold text-white tracking-wide">
              Journal Entry for Today
            </h2>
            <p className="text-indigo-100 text-sm mt-2">
              {todayStr}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Render each entry */}
            {entries.map((entry, entryIndex) => {
              const isExpanded = expandedEntryId === entry.id;
              const isSaved = savedEntryIds.has(entry.id);
              const hasContent = entry.text.trim() || entry.detectedMood || entry.polishedReflection;
              
              // Auto-expand empty/new entries
              const isEmpty = !entry.text.trim() && !entry.detectedMood && !entry.polishedReflection;
              const shouldShowExpanded = isExpanded || isEmpty;

              // Summary view for saved/collapsed entries
              if (isSaved && !shouldShowExpanded) {
                return (
                  <div 
                    key={entry.id} 
                    onClick={() => setExpandedEntryId(entry.id)}
                    className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl border-2 border-indigo-100 shadow-md p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-indigo-900">
                            Entry {entryIndex + 1}
                          </h3>
                          {entry.detectedMood && moodConfig[entry.detectedMood as keyof typeof moodConfig] && (
                            <div className={`inline-flex items-center px-3 py-1 rounded-lg ${moodConfig[entry.detectedMood as keyof typeof moodConfig].bgColor} ${moodConfig[entry.detectedMood as keyof typeof moodConfig].borderColor} border`}>
                              <span className="text-lg mr-1">{moodConfig[entry.detectedMood as keyof typeof moodConfig].icon}</span>
                              <span className={`text-xs font-semibold ${moodConfig[entry.detectedMood as keyof typeof moodConfig].textColor}`}>
                                {moodConfig[entry.detectedMood as keyof typeof moodConfig].shortName}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {entry.text || "No text entered"}
                        </p>
                        {entry.foodSuggestions.length > 0 && (
                          <p className="text-xs text-indigo-600 mt-2">
                            {entry.foodSuggestions.length} food suggestion{entry.foodSuggestions.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              }

              // Full expanded view
              return (
                <div key={entry.id} className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl border-2 border-indigo-100 shadow-lg p-6">
                  {/* Entry Header */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-indigo-900">
                      Entry {entryIndex + 1}
                    </h3>
                    <div className="flex items-center gap-2">
                      {isSaved && (
                        <button
                          onClick={() => {
                            setExpandedEntryId(null);
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-all duration-200"
                          title="Collapse entry"
                        >
                          ↓ Collapse
                        </button>
                      )}
                      {entries.length > 1 && (
                        <button
                          onClick={() => handleRemoveEntry(entry.id)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-lg transition-all duration-200"
                          title="Remove this entry"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Flagged Content Warning */}
                  {entry.flaggedWord && (
                    <div className="mb-6 p-5 bg-red-50 border-2 border-red-300 rounded-xl shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <span className="text-3xl">⚠️</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-red-800 mb-2">
                            Content Flagged
                          </h3>
                          <p className="text-red-700 font-medium mb-1">
                            Your entry contains flagged content: <span className="font-bold bg-red-100 px-2 py-1 rounded">"{entry.flaggedWord}"</span>
                          </p>
                          <p className="text-red-600 text-sm mt-2">
                            Please revise your entry to remove inappropriate content. The entry was not saved to your journal.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User's Text Input - First Section */}
                  <div className="mb-6">
                    <label className="block mb-2 font-semibold text-gray-700">
                      What's on your mind? 👇
                    </label>
                    <textarea
                      ref={entry.textareaRef}
                      className="w-full p-4 border-2 border-indigo-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all duration-200 resize-none bg-white shadow-sm hover:shadow-md min-h-[120px]"
                      style={{ 
                        height: 'auto',
                        minHeight: '120px',
                      }}
                      placeholder="Write your thoughts, feelings, or anything you'd like to remember..."
                      value={entry.text}
                      onChange={(e) => {
                        updateEntry(entry.id, { text: e.target.value });
                        // Auto-resize textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.max(120, e.target.scrollHeight)}px`;
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.max(120, target.scrollHeight)}px`;
                      }}
                    />
                  </div>

                  {/* Divider - Only show if there's AI feedback */}
                  {!entry.flaggedWord && (entry.detectedMood || entry.polishedReflection || entry.foodSuggestions.length > 0 || entry.reflectionLoading) && (
                    <div className="mb-6">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    </div>
                  )}

                  {/* AI Feedback Section - Grouped Together */}
                  {!entry.flaggedWord && (entry.detectedMood || entry.polishedReflection || entry.foodSuggestions.length > 0 || entry.reflectionLoading) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>✨</span>
                        <span>MoodMirror's Feedback</span>
                      </h3>

                      {/* Detected Emotion */}
                      {entry.detectedMood && moodConfig[entry.detectedMood as keyof typeof moodConfig] && (
                        <div className="mb-4">
                          <label className="block mb-2 text-sm font-medium text-gray-600">
                            Detected Emotion:
                          </label>
                          <div className="flex items-center">
                            <div className={`inline-flex items-center px-4 py-2 rounded-xl ${moodConfig[entry.detectedMood as keyof typeof moodConfig].bgColor} ${moodConfig[entry.detectedMood as keyof typeof moodConfig].borderColor} border-2 shadow-sm`}>
                              <span className="text-xl mr-2">{moodConfig[entry.detectedMood as keyof typeof moodConfig].icon}</span>
                              <span className={`font-semibold ${moodConfig[entry.detectedMood as keyof typeof moodConfig].textColor} tracking-wide`}>
                                {moodConfig[entry.detectedMood as keyof typeof moodConfig].shortName}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Reflection */}
                      {(entry.rawReflection || entry.polishedReflection || entry.reflectionLoading) && (
                        <div className="mb-4">
                          <label className="block mb-2 text-sm font-medium text-gray-600">
                            AI Reflection:
                          </label>
                          {entry.reflectionLoading ? (
                            <div className="text-center py-4 bg-purple-50 rounded-lg border border-purple-200">
                              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <p className="text-purple-600 text-sm mt-2">Generating reflection...</p>
                            </div>
                          ) : (
                            <div className="p-3 sm:p-4 border rounded-lg shadow-sm bg-purple-50">
                              <p className="text-gray-900 leading-relaxed text-sm break-words">
                                {entry.polishedReflection}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Food Suggestions */}
                      {entry.detectedMood && (
                        <div>
                          <label className="block mb-3 text-sm font-medium text-gray-600">
                            Food Suggestions:
                          </label>
                          {entry.reflectionLoading ? (
                            <div className="text-center py-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <p className="text-indigo-600 font-medium mt-3">Generating personalized food suggestions...</p>
                            </div>
                          ) : entry.foodSuggestions.length === 0 ? (
                            <div className="text-center py-6 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border-2 border-gray-200">
                              <p className="text-gray-600 font-medium mb-2">
                                {avoidedFoods.size > 0 
                                  ? "All food suggestions have been avoided. Remove some avoided foods from your profile to see more suggestions."
                                  : "No food suggestions available yet. Save your entry to generate suggestions."
                                }
                              </p>
                              {avoidedFoods.size > 0 && (
                                <p className="text-sm text-gray-500 mt-2">
                                  You have {avoidedFoods.size} avoided food{avoidedFoods.size > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {entry.foodSuggestions.map((suggestion, index) => (
                                <div 
                                  key={index} 
                                  className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                                >
                                  <button
                                    onClick={() => updateEntry(entry.id, { expandedFoodIndex: entry.expandedFoodIndex === index ? null : index })}
                                    className="w-full flex justify-between items-center p-4 hover:bg-white/50 transition-colors duration-200"
                                  >
                                    <div className="flex items-center gap-3 flex-1 text-left">
                                      <span className="text-2xl">🍴</span>
                                      <span className="font-bold text-lg text-indigo-900">{suggestion.name}</span>
                                    </div>
                                    <div className={`transform transition-transform duration-300 ${entry.expandedFoodIndex === index ? 'rotate-180' : ''}`}>
                                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </button>
                                  
                                  {entry.expandedFoodIndex === index && (
                                    <div className="px-4 pb-4 pt-2 border-t border-indigo-200/50 bg-white/60 animate-in slide-in-from-top-2 duration-300">
                                      <p className="text-base text-gray-700 leading-relaxed font-medium mb-4">
                                        {suggestion.reason}
                                      </p>
                                      <button
                                        onClick={() => handleAvoidFood(entry.id, suggestion.name)}
                                        disabled={avoidingFood?.entryId === entry.id && avoidingFood?.food === suggestion.name}
                                        className="w-full px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow border border-red-300"
                                        title="Don't show this food in future suggestions"
                                      >
                                        {avoidingFood?.entryId === entry.id && avoidingFood?.food === suggestion.name ? (
                                          <>
                                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                          </>
                                        ) : (
                                          <>
                                            <span>🚫</span>
                                            <span>Remove Suggestion</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                {/* Status Messages */}
                {entry.entryError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    ⚠️ {entry.entryError}
                  </div>
                )}
                {entry.entrySuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    ✅ {entry.entrySuccess}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  {(entry.text || entry.detectedMood || entry.rawDetectedEmotion || entry.rawReflection || entry.polishedReflection) && (
                    <div className="mb-3">
                      <button
                        className="w-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-red-200"
                        onClick={() => setShowClearConfirm({ entryId: entry.id })}
                        disabled={entry.entryLoading || entry.reflectionLoading || clearLoading}
                      >
                        🗑️ Clear Entry {entryIndex + 1}
                      </button>
                    </div>
                  )}
                  
                  <button
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    onClick={() => handleSaveEntry(entry.id)}
                    disabled={entry.entryLoading || entry.reflectionLoading || clearLoading}
                  >
                    {entry.entryLoading || entry.reflectionLoading ? (
                      <span className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        {entry.reflectionLoading ? "Generating reflection..." : "Saving..."}
                      </span>
                    ) : (
                      "Save Entry"
                    )}
                  </button>
                </div>
              </div>
              );
            })}

            {/* Add Entry Button */}
            {entries.length < 3 && (
              <div className="flex justify-center">
                <button
                  onClick={handleAddEntry}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  ➕ Add Another Entry ({entries.length}/3)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
                Are you sure you want to clear this entry? 
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
                  onClick={() => setShowClearConfirm(null)}
                  disabled={clearLoading}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleClearEntry(showClearConfirm.entryId)}
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

