"use client";

import React, { useState, useEffect } from "react";
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
  const [user, setUser] = useState<{ uid: string; email: string | null; displayName: string | null } | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState<{ entryId: number } | null>(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [avoidedFoods, setAvoidedFoods] = useState<Set<string>>(new Set());
  const [avoidingFood, setAvoidingFood] = useState<{ entryId: number; food: string } | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<number | null>(null);
  const [savedEntryIds, setSavedEntryIds] = useState<Set<number>>(new Set());
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
  }, [user, entries.length]);

  // Auto-resize textareas when entries are loaded or text changes
  useEffect(() => {
    entries.forEach(entry => {
      if (entry.textareaRef.current && entry.text) {
        entry.textareaRef.current.style.height = 'auto';
        entry.textareaRef.current.style.height = `${Math.max(120, entry.textareaRef.current.scrollHeight)}px`;
      }
    });
  }, [entries]);

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
            // Check if we need to create a new entry or expand an existing one
            const lastEntry = loadedEntries[loadedEntries.length - 1];
            const lastEntryIsEmpty = !lastEntry.text.trim() && !lastEntry.detectedMood;
            
            // Only create a new entry if we have less than 3 entries and the last entry has content
            if ((lastEntry.text.trim() || lastEntry.detectedMood) && loadedEntries.length < 3) {
              // If last entry has content, create a new empty one and expand it
              const newId = Math.max(...loadedEntries.map(e => e.id)) + 1;
              const newEntry = createNewEntry(newId);
              setEntries([...loadedEntries, newEntry]);
              setExpandedEntryId(newId);
            } else if (lastEntryIsEmpty) {
              // Only expand the last entry if it's empty (not saved yet)
              setExpandedEntryId(lastEntry.id);
              savedIds.delete(lastEntry.id);
              setSavedEntryIds(savedIds);
            } else {
              // All entries are saved and have content - don't expand any by default
              setExpandedEntryId(null);
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
  }, [user, todayStr]);

  // Update food suggestions when avoidedFoods changes (without reloading entries)
  useEffect(() => {
    if (avoidedFoods.size > 0) {
      setEntries(prevEntries => {
        // Only update if there are entries and if any have food suggestions that need filtering
        if (prevEntries.length === 0) return prevEntries;
        
        const hasSuggestionsToFilter = prevEntries.some(entry => 
          entry.foodSuggestions.some(s => avoidedFoods.has(s.name))
        );
        
        if (!hasSuggestionsToFilter) return prevEntries;
        
        return prevEntries.map(entry => ({
          ...entry,
          foodSuggestions: entry.foodSuggestions.filter(suggestion => 
            !avoidedFoods.has(suggestion.name)
          )
        }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avoidedFoods.size]);

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

  const handleSaveEntry = async (entryId: number) => {
    if (!user) {
      updateEntry(entryId, { entryError: "User not authenticated." });
      return;
    }
    
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save entry";
      updateEntry(entryId, {
        entryError: errorMessage,
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
      } catch {
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to clear entry";
      updateEntry(entryId, { entryError: errorMessage });
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to avoid food";
      updateEntry(entryId, { entryError: errorMessage });
    } finally {
      setAvoidingFood(null);
    }
  };

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
         isDarkMode ? "opacity-30" : "opacity-90"
       }`}
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
       className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
         isDarkMode ? "opacity-20" : "opacity-100"
       }`}
       style={{
         backgroundImage:
           `linear-gradient(${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"} 1px, transparent 1px)`,
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
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Ambient gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute right-[-120px] top-0 w-72 h-72 bg-gradient-to-br from-pink-300/40 to-indigo-300/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute left-[-120px] bottom-0 w-72 h-72 bg-gradient-to-br from-purple-300/40 to-yellow-300/40 rounded-full blur-3xl animate-pulse" />
        </div>
        
        {/* Today's Stats Card */}
        {entries.length > 0 && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 shadow-lg border border-indigo-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-xs font-medium mb-1">Today&apos;s Entries</p>
                  <p className="text-3xl font-bold text-white">{entries.filter(e => e.text.trim()).length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 shadow-lg border border-purple-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-medium mb-1">Moods Detected</p>
                  <p className="text-3xl font-bold text-white">{new Set(entries.filter(e => e.detectedMood).map(e => e.detectedMood)).size}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">😊</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 shadow-lg border border-pink-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-xs font-medium mb-1">Food Suggestions</p>
                  <p className="text-3xl font-bold text-white">{entries.reduce((sum, e) => sum + e.foodSuggestions.length, 0)}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🥗</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border overflow-hidden transition-colors duration-300 ${
          isDarkMode 
            ? "bg-gray-800/90 border-gray-700/60" 
            : "bg-white/90 border-white/60"
        }`}>
          {/* Page Header */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 px-6 sm:px-8 py-6 sm:py-7 rounded-t-2xl sm:rounded-t-3xl shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <span className="text-2xl">✨</span>
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                        Today&apos;s Reflection
                      </h2>
                      <p className="text-indigo-100 text-sm sm:text-base mt-1 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V8.25a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                        </svg>
                        {todayStr}
                      </p>
                    </div>
                  </div>
                </div>
                {entries.filter(e => e.text.trim()).length > 0 && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                    <span className="text-white/90 text-sm font-medium">Great progress!</span>
                    <span className="text-2xl">🎉</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
            {/* Motivational Message */}
            {entries.length === 0 || entries.every(e => !e.text.trim()) ? (
              <div className={`text-center py-8 sm:py-12 rounded-xl border-2 border-dashed transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-pink-900/30 border-indigo-700"
                  : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200"
              }`}>
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-gradient-to-br from-indigo-800/50 to-purple-800/50"
                    : "bg-gradient-to-br from-indigo-100 to-purple-100"
                }`}>
                  <span className="text-4xl">💭</span>
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-200" : "text-gray-800"
                }`}>Start Your Journey</h3>
                <p className={`text-sm sm:text-base max-w-md mx-auto transition-colors duration-300 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}>
                  Take a moment to reflect on your day. Your thoughts matter, and every entry helps you understand yourself better.
                </p>
              </div>
            ) : null}

            {/* Render each entry */}
            {entries.map((entry, entryIndex) => {
              const isExpanded = expandedEntryId === entry.id;
              const isSaved = savedEntryIds.has(entry.id);
              
              // Auto-expand empty/new entries
              const isEmpty = !entry.text.trim() && !entry.detectedMood && !entry.polishedReflection;
              const shouldShowExpanded = isExpanded || isEmpty;

              // Summary view for saved/collapsed entries
              if (isSaved && !shouldShowExpanded) {
                return (
                  <div 
                    key={entry.id} 
                    onClick={() => setExpandedEntryId(entry.id)}
                    className={`group rounded-xl sm:rounded-2xl border-2 shadow-md p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${
                      isDarkMode
                        ? "bg-gradient-to-br from-gray-800 via-indigo-900/30 to-purple-900/30 border-indigo-700 hover:shadow-xl hover:border-indigo-600"
                        : "bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/30 border-indigo-200 hover:shadow-xl hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-indigo-700">#{entryIndex + 1}</span>
                          </div>
                          <h3 className={`text-base sm:text-lg font-bold transition-colors duration-300 ${
                            isDarkMode ? "text-indigo-300" : "text-indigo-900"
                          }`}>
                            Entry {entryIndex + 1}
                          </h3>
                          {entry.detectedMood && moodConfig[entry.detectedMood as keyof typeof moodConfig] && (
                            <div className={`inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg ${moodConfig[entry.detectedMood as keyof typeof moodConfig].bgColor} ${moodConfig[entry.detectedMood as keyof typeof moodConfig].borderColor} border-2 shadow-sm`}>
                              <span className="text-lg sm:text-xl mr-1.5">{moodConfig[entry.detectedMood as keyof typeof moodConfig].icon}</span>
                              <span className={`text-xs sm:text-sm font-bold ${moodConfig[entry.detectedMood as keyof typeof moodConfig].textColor}`}>
                                {moodConfig[entry.detectedMood as keyof typeof moodConfig].shortName}
                              </span>
                            </div>
                          )}
                          <div className="ml-auto flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                              ✓ Saved
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm sm:text-base line-clamp-2 font-medium mb-2 transition-colors duration-300 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}>
                          {entry.text || "No text entered"}
                        </p>
                        <div className={`flex items-center gap-4 text-xs sm:text-sm transition-colors duration-300 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {entry.foodSuggestions.length > 0 && (
                            <span className="flex items-center gap-1.5">
                              <span>🥗</span>
                              <span className="font-medium">{entry.foodSuggestions.length} suggestion{entry.foodSuggestions.length !== 1 ? 's' : ''}</span>
                            </span>
                          )}
                          {entry.polishedReflection && (
                            <span className="flex items-center gap-1.5">
                              <span>✨</span>
                              <span className="font-medium">AI Reflection</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`ml-4 transition-colors ${
                        isDarkMode 
                          ? "text-gray-500 group-hover:text-indigo-400" 
                          : "text-gray-400 group-hover:text-indigo-500"
                      }`}>
                        <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              }

              // Full expanded view
              return (
                <div key={entry.id} className={`rounded-xl sm:rounded-2xl border-2 shadow-xl p-5 sm:p-6 lg:p-7 transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-gradient-to-br from-gray-800 via-indigo-900/30 to-purple-900/30 border-indigo-700"
                    : "bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/30 border-indigo-200"
                }`}>
                  {/* Entry Header */}
                  <div className="flex justify-between items-start mb-4 sm:mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-md">
                        <span className="text-lg font-bold text-indigo-700">#{entryIndex + 1}</span>
                      </div>
                      <div>
                        <h3 className={`text-xl sm:text-2xl font-extrabold transition-colors duration-300 ${
                          isDarkMode ? "text-indigo-300" : "text-indigo-900"
                        }`}>
                          Entry {entryIndex + 1}
                        </h3>
                        {isSaved && (
                          <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                            Saved
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setExpandedEntryId(null);
                        }}
                        className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow ${
                          isDarkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Collapse entry"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M18 15l-6-6-6 6" />
                        </svg>
                        Collapse
                      </button>
                      {(entry.text || entry.detectedMood || entry.rawDetectedEmotion || entry.rawReflection || entry.polishedReflection) && (
                        <button
                          onClick={() => setShowClearConfirm({ entryId: entry.id })}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow"
                          title="Clear this entry"
                          disabled={entry.entryLoading || entry.reflectionLoading || clearLoading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Flagged Content Warning */}
                  {entry.flaggedWord && (
                    <div className={`mb-4 p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl shadow-md transition-colors duration-300 ${
                      isDarkMode
                        ? "bg-red-900/30 border-red-700"
                        : "bg-red-50 border-red-300"
                    }`}>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-shrink-0">
                          <span className="text-2xl sm:text-3xl">⚠️</span>
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold text-base sm:text-lg mb-1.5 transition-colors duration-300 ${
                            isDarkMode ? "text-red-300" : "text-red-800"
                          }`}>
                            Content Flagged
                          </h3>
                          <p className={`font-medium text-sm mb-1 transition-colors duration-300 ${
                            isDarkMode ? "text-red-200" : "text-red-700"
                          }`}>
                            Your entry contains flagged content: <span className={`font-bold px-1.5 py-0.5 rounded transition-colors duration-300 ${
                              isDarkMode ? "bg-red-800/50" : "bg-red-100"
                            }`}>&quot;{entry.flaggedWord}&quot;</span>
                          </p>
                          <p className={`text-xs sm:text-sm mt-1.5 transition-colors duration-300 ${
                            isDarkMode ? "text-red-300" : "text-red-600"
                          }`}>
                            Please revise your entry to remove inappropriate content. The entry was not saved to your journal.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User's Text Input - First Section */}
                  <div className="mb-5 sm:mb-6">
                    <label className={`block mb-2.5 text-base sm:text-lg font-bold flex items-center gap-2 transition-colors duration-300 ${
                      isDarkMode ? "text-gray-200" : "text-gray-800"
                    }`}>
                      <span className="text-2xl">💭</span>
                      <span>What&apos;s on your mind today?</span>
                    </label>
                    <div className="relative">
                      <textarea
                        ref={entry.textareaRef}
                        readOnly={isSaved}
                        className={`w-full p-4 sm:p-5 border-2 rounded-xl sm:rounded-2xl transition-all duration-200 resize-none shadow-md min-h-[120px] sm:min-h-[140px] text-sm sm:text-base leading-relaxed ${
                          isSaved 
                            ? isDarkMode
                              ? "border-gray-600 bg-gray-700/50 cursor-not-allowed opacity-75 text-gray-400"
                              : "border-gray-300 bg-gray-50 cursor-not-allowed opacity-75 text-gray-800"
                            : isDarkMode
                              ? "border-indigo-700 bg-gray-800 text-gray-200 hover:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              : "border-indigo-200 bg-white text-gray-800 hover:shadow-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500"
                        }`}
                        style={{ 
                          height: 'auto',
                          minHeight: '120px',
                        }}
                        placeholder={isSaved ? "Entry saved - no longer editable" : "Take a moment to reflect... What made you smile today? What challenges did you face? How are you feeling right now?"}
                        value={entry.text}
                        onChange={(e) => {
                          if (!isSaved) {
                            updateEntry(entry.id, { text: e.target.value });
                            // Auto-resize textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.max(120, e.target.scrollHeight)}px`;
                          }
                        }}
                        onInput={(e) => {
                          if (!isSaved) {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${Math.max(120, target.scrollHeight)}px`;
                          }
                        }}
                      />
                      {entry.text && (
                        <div className={`absolute bottom-3 right-3 text-xs font-medium transition-colors duration-300 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}>
                          {entry.text.length} characters
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider - Only show if there's AI feedback */}
                  {!entry.flaggedWord && (entry.detectedMood || entry.polishedReflection || entry.foodSuggestions.length > 0 || entry.reflectionLoading) && (
                    <div className="mb-4">
                      <div className={`h-px w-full bg-gradient-to-r from-transparent to-transparent transition-colors duration-300 ${
                        isDarkMode ? "via-gray-600" : "via-gray-300"
                      }`}></div>
                    </div>
                  )}

                  {/* AI Feedback Section - Grouped Together */}
                  {!entry.flaggedWord && (entry.detectedMood || entry.polishedReflection || entry.foodSuggestions.length > 0 || entry.reflectionLoading) && (
                    <div className="mb-5 sm:mb-6">
                      <div className={`flex items-center gap-3 mb-4 pb-3 border-b-2 transition-colors duration-300 ${
                        isDarkMode ? "border-indigo-700" : "border-indigo-200"
                      }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                          isDarkMode
                            ? "bg-gradient-to-br from-purple-800/50 to-pink-800/50"
                            : "bg-gradient-to-br from-purple-100 to-pink-100"
                        }`}>
                          <span className="text-2xl">✨</span>
                        </div>
                        <div>
                          <h3 className={`text-lg sm:text-xl font-extrabold transition-colors duration-300 ${
                            isDarkMode ? "text-gray-200" : "text-gray-800"
                          }`}>
                            AI Insights
                          </h3>
                          <p className={`text-xs sm:text-sm transition-colors duration-300 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>Personalized feedback just for you</p>
                        </div>
                      </div>

                      {/* Detected Emotion */}
                      {entry.detectedMood && moodConfig[entry.detectedMood as keyof typeof moodConfig] && (
                        <div className="mb-4 sm:mb-5">
                          <label className={`block mb-2.5 text-sm sm:text-base font-semibold flex items-center gap-2 transition-colors duration-300 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}>
                            <span>🎯</span>
                            <span>Detected Mood</span>
                          </label>
                          <div className="flex items-center">
                            <div className={`inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl ${moodConfig[entry.detectedMood as keyof typeof moodConfig].bgColor} ${moodConfig[entry.detectedMood as keyof typeof moodConfig].borderColor} border-2 shadow-lg`}>
                              <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">{moodConfig[entry.detectedMood as keyof typeof moodConfig].icon}</span>
                              <span className={`font-bold text-base sm:text-lg ${moodConfig[entry.detectedMood as keyof typeof moodConfig].textColor} tracking-wide`}>
                                {moodConfig[entry.detectedMood as keyof typeof moodConfig].shortName}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Reflection */}
                      {(entry.rawReflection || entry.polishedReflection || entry.reflectionLoading) && (
                        <div className="mb-4 sm:mb-5">
                          <label className={`block mb-2.5 text-sm sm:text-base font-semibold flex items-center gap-2 transition-colors duration-300 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}>
                            <span>💡</span>
                            <span>AI Reflection</span>
                          </label>
                          {entry.reflectionLoading ? (
                            <div className={`text-center py-6 sm:py-8 rounded-xl sm:rounded-2xl border-2 shadow-sm transition-colors duration-300 ${
                              isDarkMode
                                ? "bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-700"
                                : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"
                            }`}>
                              <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                              <p className={`text-sm sm:text-base font-medium transition-colors duration-300 ${
                                isDarkMode ? "text-purple-300" : "text-purple-700"
                              }`}>Analyzing your thoughts...</p>
                              <p className={`text-xs sm:text-sm mt-1 transition-colors duration-300 ${
                                isDarkMode ? "text-purple-400" : "text-purple-600"
                              }`}>This may take a few seconds</p>
                            </div>
                          ) : (
                            <div className={`p-4 sm:p-5 border-2 rounded-xl sm:rounded-2xl shadow-md transition-colors duration-300 ${
                              isDarkMode
                                ? "border-purple-700 bg-gradient-to-br from-purple-900/30 via-indigo-900/30 to-pink-900/30"
                                : "border-purple-200 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50"
                            }`}>
                              <p className={`leading-relaxed text-sm sm:text-base font-medium break-words transition-colors duration-300 ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}>
                                {entry.polishedReflection}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Food Suggestions */}
                      {entry.detectedMood && (
                        <div>
                          <label className={`block mb-3 text-sm sm:text-base font-semibold flex items-center gap-2 transition-colors duration-300 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}>
                            <span>🥗</span>
                            <span>Personalized Food Suggestions</span>
                          </label>
                          {entry.reflectionLoading ? (
                            <div className={`text-center py-6 sm:py-8 rounded-xl sm:rounded-2xl border-2 shadow-sm transition-colors duration-300 ${
                              isDarkMode
                                ? "bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-pink-900/30 border-indigo-700"
                                : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200"
                            }`}>
                              <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                              <p className={`font-semibold text-sm sm:text-base mt-2 transition-colors duration-300 ${
                                isDarkMode ? "text-indigo-300" : "text-indigo-700"
                              }`}>Crafting personalized suggestions...</p>
                              <p className={`text-xs sm:text-sm mt-1 transition-colors duration-300 ${
                                isDarkMode ? "text-indigo-400" : "text-indigo-600"
                              }`}>Matching foods to your mood</p>
                            </div>
                          ) : entry.foodSuggestions.length === 0 ? (
                            <div className={`text-center py-6 sm:py-8 rounded-xl sm:rounded-2xl border-2 shadow-sm transition-colors duration-300 ${
                              isDarkMode
                                ? "bg-gradient-to-br from-gray-800/50 via-indigo-900/30 to-purple-900/30 border-gray-700"
                                : "bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 border-gray-200"
                            }`}>
                              <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center transition-colors duration-300 ${
                                isDarkMode ? "bg-gray-700" : "bg-gray-100"
                              }`}>
                                <span className="text-3xl">🍽️</span>
                              </div>
                              <p className={`font-medium text-sm sm:text-base mb-2 transition-colors duration-300 ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}>
                                {avoidedFoods.size > 0 
                                  ? "All food suggestions have been avoided. Remove some avoided foods from your profile to see more suggestions."
                                  : "No food suggestions available yet. Save your entry to generate suggestions."
                                }
                              </p>
                              {avoidedFoods.size > 0 && (
                                <p className={`text-xs sm:text-sm mt-2 px-3 py-1 rounded-full inline-block transition-colors duration-300 ${
                                  isDarkMode ? "text-gray-400 bg-gray-700" : "text-gray-500 bg-gray-100"
                                }`}>
                                  You have {avoidedFoods.size} avoided food{avoidedFoods.size > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3 sm:space-y-3">
                              {entry.foodSuggestions.map((suggestion, index) => (
                                <div 
                                  key={index} 
                                  className={`border-2 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-0.5 ${
                                    isDarkMode
                                      ? "bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-pink-900/30 border-indigo-700"
                                      : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200"
                                  }`}
                                >
                                  <button
                                    onClick={() => updateEntry(entry.id, { expandedFoodIndex: entry.expandedFoodIndex === index ? null : index })}
                                    className={`w-full flex justify-between items-center p-4 sm:p-5 transition-colors duration-200 ${
                                      isDarkMode ? "hover:bg-gray-700/60" : "hover:bg-white/60"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 sm:gap-4 flex-1 text-left">
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-colors duration-300 ${
                                        isDarkMode
                                          ? "bg-gradient-to-br from-indigo-800/50 to-purple-800/50"
                                          : "bg-gradient-to-br from-indigo-100 to-purple-100"
                                      }`}>
                                        <span className="text-2xl sm:text-3xl">🍴</span>
                                      </div>
                                      <div>
                                        <span className={`font-bold text-base sm:text-lg block transition-colors duration-300 ${
                                          isDarkMode ? "text-indigo-300" : "text-indigo-900"
                                        }`}>{suggestion.name}</span>
                                        <span className={`text-xs sm:text-sm transition-colors duration-300 ${
                                          isDarkMode ? "text-gray-400" : "text-gray-500"
                                        }`}>Tap to see why this helps</span>
                                      </div>
                                    </div>
                                    <div className={`transform transition-transform duration-300 ${entry.expandedFoodIndex === index ? 'rotate-180' : ''}`}>
                                      <svg className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-300 ${
                                        isDarkMode ? "text-indigo-400" : "text-indigo-600"
                                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </button>
                                  
                                  {entry.expandedFoodIndex === index && (
                                    <div className={`px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t-2 animate-in slide-in-from-top-2 duration-300 transition-colors duration-300 ${
                                      isDarkMode
                                        ? "border-indigo-700/50 bg-gray-800/70"
                                        : "border-indigo-200/50 bg-white/70"
                                    }`}>
                                      <div className="mb-4">
                                        <p className={`text-sm sm:text-base leading-relaxed font-medium transition-colors duration-300 ${
                                          isDarkMode ? "text-gray-200" : "text-gray-800"
                                        }`}>
                                          {suggestion.reason}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => handleAvoidFood(entry.id, suggestion.name)}
                                        disabled={avoidingFood?.entryId === entry.id && avoidingFood?.food === suggestion.name}
                                        className="w-full px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md border-2 border-red-300"
                                        title="Don't show this food in future suggestions"
                                      >
                                        {avoidingFood?.entryId === entry.id && avoidingFood?.food === suggestion.name ? (
                                          <>
                                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                          </>
                                        ) : (
                                          <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                              <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
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
                  <div className={`mb-3 p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-red-900/30 border-red-700 text-red-300"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}>
                    ⚠️ {entry.entryError}
                  </div>
                )}
                {entry.entrySuccess && (
                  <div className={`mb-3 p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-green-900/30 border-green-700 text-green-300"
                      : "bg-green-50 border-green-200 text-green-700"
                  }`}>
                    ✅ {entry.entrySuccess}
                  </div>
                )}

                {/* Action Buttons */}
                <div className={`mt-5 sm:mt-6 pt-5 sm:pt-6 border-t-2 transition-colors duration-300 ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}>
                  {isSaved ? (
                    <button
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all duration-200 shadow-xl text-base sm:text-lg cursor-default"
                      disabled
                    >
                      <span className="flex items-center justify-center gap-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                        <span>Entry Saved Successfully</span>
                      </span>
                    </button>
                  ) : (
                    <button
                      className="w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:via-purple-700 hover:to-pink-600 text-white px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] text-base sm:text-lg"
                      onClick={() => handleSaveEntry(entry.id)}
                      disabled={entry.entryLoading || entry.reflectionLoading || clearLoading}
                    >
                      {entry.entryLoading || entry.reflectionLoading ? (
                        <span className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>{entry.reflectionLoading ? "Generating AI insights..." : "Saving entry..."}</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                            <path d="M17 21v-8H7v8M7 3v5h8" />
                          </svg>
                          <span>Save Entry & Get AI Insights</span>
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
              );
            })}

            {/* Add Entry Button */}
            {entries.length < 3 && (
              <div className="flex justify-center mt-6 sm:mt-8">
                <button
                  onClick={handleAddEntry}
                  className="group px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 hover:from-indigo-500 hover:via-purple-600 hover:to-pink-600 text-white text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 flex items-center gap-2.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span>Add Another Entry ({entries.length}/3)</span>
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

