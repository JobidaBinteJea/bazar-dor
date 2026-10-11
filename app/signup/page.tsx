
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "অ্যাকাউন্ট তৈরি করা যায়নি।");
        return;
      }

      router.push("/signin?registered=1");
    } catch {
      setError("সমস্যা হয়েছে। আবার চেষ্টা করো।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-12">
      <form onSubmit={handleSignup} className="w-full max-w-md space-y-5 rounded-2xl border bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm text-green-700">← হোমপেজ</Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">অ্যাকাউন্ট তৈরি করো</h1>
          <p className="mt-2 text-gray-600">বাজার দর-এ যোগ দাও।</p>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          তোমার নাম
          <input
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-lg border p-3"
            placeholder="তোমার নাম"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          ইমেইল
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border p-3"
            placeholder="you@example.com"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          পাসওয়ার্ড
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border p-3"
            placeholder="কমপক্ষে ৮ অক্ষর"
          />
        </label>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="w-full rounded-lg bg-green-700 p-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "সাইন আপ"}
        </button>

        <p className="text-center text-sm text-gray-600">
          আগে অ্যাকাউন্ট আছে?{" "}
          <Link href="/signin" className="font-semibold text-green-700">সাইন ইন করো</Link>
        </p>
      </form>
    </main>
  );
}