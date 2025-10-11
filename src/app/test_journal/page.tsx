"use client";

import { useState } from "react";

const emotions = {
  sad: "Sad / Down",
  anxious: "Anxious / Nervous",
  stressed: "Stressed / Frustrated",
  tired: "Tired / Drained",
  happy: "Happy / Excited / In Love",
  grateful: "Grateful / Content / Peaceful",
};

type EmotionKey = keyof typeof emotions;

export default function Journal() {
  const [journal, setJournal] = useState("");
  const [rawReflection, setRawReflection] = useState("");
  const [polishedReflection, setPolishedReflection] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey>("sad");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const label = emotions[selectedEmotion];
    const prompt = `${label}: ${journal}`;
    setLoading(true);
    setRawReflection("");
    setPolishedReflection("");

    try {
      const res = await fetch("http://127.0.0.1:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt }),
      });

      const data = await res.json();
      setRawReflection(data.raw_reflection);
      setPolishedReflection(data.polished_reflection);
    } catch (error) {
      console.error("Error generating reflection:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Emotion Dropdown */}
      <select
        className="border rounded-lg p-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-800"
        value={selectedEmotion}
        onChange={(e) => setSelectedEmotion(e.target.value as EmotionKey)}
      >
        {Object.entries(emotions).map(([key, label]) => (
          <option key={key} value={key} className="text-gray-800 bg-white">
            {label}
          </option>
        ))}
      </select>

      {/* Journal Input */}
      <textarea
        className="border rounded-lg p-3 w-full min-h-[100px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
        placeholder="Write your journal entry..."
        value={journal}
        onChange={(e) => setJournal(e.target.value)}
      />

      {/* Submit Button */}
      <button
        className={`w-full px-4 py-2 rounded-lg text-white font-medium ${
          loading
            ? "bg-blue-300 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Reflecting..." : "Reflect"}
      </button>

      {/* Reflection Outputs */}
      {(rawReflection || polishedReflection) && (
        <div className="mt-6 space-y-4">
          {rawReflection && (
            <div className="p-4 border rounded-lg shadow-sm bg-white">
              <h3 className="font-semibold text-gray-700 mb-1">
                Draft Reflection (Local Model):
              </h3>
              <p className="text-gray-800 leading-relaxed">{rawReflection}</p>
            </div>
          )}
          {polishedReflection && (
            <div className="p-4 border rounded-lg shadow-sm bg-blue-50">
              <h3 className="font-semibold text-gray-700 mb-1">
                Polished Reflection (Google Gemini):
              </h3>
              <p className="text-gray-900 leading-relaxed">
                {polishedReflection}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
