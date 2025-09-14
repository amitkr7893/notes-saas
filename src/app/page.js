"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      router.push("/notes");
    } else {
      alert(data.error || "Login failed");
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">

    <div className="h-fit w-full max-w-md mb-10 p-6 bg-zinc-900 shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded-lg p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          />
        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded-lg p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
          >
          Log In
        </button>
      </form>
    </div>
    </div>
  );
}
