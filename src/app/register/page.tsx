"use client";
import { useState } from "react";
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess("Registration successful! You can now log in.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-80 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-black">Register</h1>
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
          className="mb-4 px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="mb-6 px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />
        {error && <div className="text-red-500 mb-2 w-full text-center">{error}</div>}
        {success && <div className="text-green-600 mb-2 w-full text-center">{success}</div>}
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 transition-colors mb-2 disabled:opacity-50"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <button
          className="bg-gray-200 text-black px-4 py-2 rounded w-full hover:bg-gray-300 transition-colors"
          onClick={() => window.location.href = '/'}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
} 