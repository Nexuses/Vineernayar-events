"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/lib/constants";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClassName =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_LOGO_URL}
            alt={BRAND_NAME}
            className="h-16 w-full max-w-xs object-contain sm:h-20"
          />
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Admin Login</h1>
          <p className="mt-1 text-sm text-zinc-600">Sign in to manage your events</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error ? (
            <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClassName}
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClassName}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-md bg-brand-500 py-2.5 font-medium text-zinc-900 hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Don&apos;t have an account?{" "}
          <Link href="/admin/signup" className="font-medium text-zinc-900 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
