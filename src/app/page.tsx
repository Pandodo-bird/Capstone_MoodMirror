"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/calendar");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-80 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-black">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mb-4 px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mb-6 px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />
        {error && <div className="text-red-500 mb-2 w-full text-center">{error}</div>}
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 transition-colors mb-2 disabled:opacity-50"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <button
          className="bg-gray-200 text-black px-4 py-2 rounded w-full hover:bg-gray-300 transition-colors"
          onClick={() => window.location.href = '/register'}
        >
          Register
        </button>
      </div>
    </div>
  );
}
