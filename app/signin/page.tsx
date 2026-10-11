
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SigninPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message || "ইমেইল বা পাসওয়ার্ড সঠিক নয়।");
        return;
      }

      const next = searchParams.get("next");
      const destination =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/";

      router.replace(destination);
      router.refresh();
    } catch {
      setError("সাইন ইন করা যায়নি। আবার চেষ্টা করো।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-12">
      <form onSubmit={handleSignin} className="w-full max-w-md space-y-5 rounded-2xl border bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm text-green-700">← হোমপেজ</Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">সাইন ইন</h1>
          <p className="mt-2 text-gray-600">তোমার Bazar Dor account-এ প্রবেশ করো।</p>
        </div>

        {searchParams.get("registered") === "1" && (
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            অ্যাকাউন্ট তৈরি হয়েছে। এখন সাইন ইন করো।
          </p>
        )}

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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border p-3"
            placeholder="তোমার পাসওয়ার্ড"
          />
        </label>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="w-full rounded-lg bg-green-700 p-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "সাইন ইন হচ্ছে..." : "সাইন ইন"}
        </button>

        <p className="text-center text-sm text-gray-600">
          নতুন ব্যবহারকারী?{" "}
          <Link href="/signup" className="font-semibold text-green-700">অ্যাকাউন্ট তৈরি করো</Link>
        </p>
      </form>
    </main>
  );
}