
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: string | number;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  unit: string;
  price: number;
  change: number;
  emoji: string;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

const API = "https://openapi.programming-hero.com/api/bazardor";

const bnNumber = (value: number) =>
  new Intl.NumberFormat("bn-BD", {
    maximumFractionDigits: 2,
  }).format(value);

function read(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return undefined;
}

function getRows(json: unknown, keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(json)) {
    return json.filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    );
  }

  if (!json || typeof json !== "object") return [];

  const obj = json as Record<string, unknown>;

  for (const key of keys) {
    if (Array.isArray(obj[key])) {
      return getRows(obj[key], keys);
    }
  }

  for (const key of ["data", "result", "results"]) {
    if (obj[key] && typeof obj[key] === "object") {
      const rows = getRows(obj[key], keys);
      if (rows.length) return rows;
    }
  }

  return [];
}

function numberValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[,\s৳ টাকা]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

const icons = ["🍚", "🥔", "🧅", "🍅", "🌶️", "🐟", "🍗", "🥚", "🧄", "🫘", "🥕"];

function normalizeProduct(
  item: Record<string, unknown>,
  index: number
): Product {
  const id = read(item, ["id", "_id", "productId"]) ?? index + 1;
  const name = String(
    read(item, ["name", "title", "productName", "product_name"]) ??
      "পণ্যের নাম পাওয়া যায়নি"
  );
  const categoryValue = read(item, ["category", "categoryName"]);
  const categoryObject =
    typeof categoryValue === "object" && categoryValue !== null
      ? (categoryValue as Record<string, unknown>)
      : null;

  const category = String(
    (categoryObject
      ? read(categoryObject, ["name", "title"])
      : categoryValue) ?? "অন্যান্য"
  );

  const categorySlug = String(
    (categoryObject ? read(categoryObject, ["slug", "id"]) : undefined) ??
      read(item, ["categorySlug", "category_slug"]) ??
      category
  )
    .toLowerCase()
    .replace(/\s+/g, "-");

  const rawPrice = read(item, [
    "price",
    "currentPrice",
    "current_price",
    "averagePrice",
    "average_price",
    "avgPrice",
  ]);

  const rawChange = read(item, [
    "change",
    "changePercent",
    "change_percentage",
    "priceChange",
    "percentageChange",
  ]);

  return {
    id: id as string | number,
    name,
    slug: String(read(item, ["slug"]) ?? id),
    category,
    categorySlug,
    unit: String(read(item, ["unit", "unitName"]) ?? "প্রতি কেজি"),
    price: numberValue(rawPrice),
    change: numberValue(rawChange),
    emoji: String(read(item, ["emoji", "icon"]) ?? icons[index % icons.length]),
  };
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("default");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [productResponse, categoryResponse] = await Promise.all([
          fetch(`${API}/products`),
          fetch(`${API}/categories`),
        ]);

        if (!productResponse.ok || !categoryResponse.ok) {
          throw new Error("API থেকে তথ্য আনা যায়নি।");
        }

        const productJson: unknown = await productResponse.json();
        const categoryJson: unknown = await categoryResponse.json();

        const productRows = getRows(productJson, [
          "products",
          "items",
          "data",
        ]);

        const categoryRows = getRows(categoryJson, [
          "categories",
          "items",
          "data",
        ]);

        setProducts(productRows.map(normalizeProduct));

        setCategories(
          categoryRows.map((item, index) => ({
            id: String(read(item, ["id", "_id"]) ?? index),
            name: String(read(item, ["name", "title"]) ?? "অন্যান্য"),
            slug: String(
              read(item, ["slug", "id", "_id"]) ?? "other"
            ),
            icon: String(read(item, ["icon", "emoji"]) ?? "🛒"),
          }))
        );
      } catch (err) {
        console.error("Bazar Dor API error:", err);
        setError(
          "পণ্যের তথ্য লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।"
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const sortedProducts = [...products].sort((a, b) => {
    if (sort === "low") return a.price - b.price;
    if (sort === "high") return b.price - a.price;
    return 0;
  });

  const rising = products.filter((p) => p.change > 0).slice(0, 6);
  const falling = products
    .filter((p) => p.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 6);

  const today = new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(new Date());

  function ProductCard({ product }: { product: Product }) {
    return (
      <Link
        href={`/product/${product.slug}`}
        className="group rounded-2xl border border-green-100 bg-white p-4 transition hover:-translate-y-1 hover:border-green-400 hover:shadow-lg"
      >
        <div className="flex h-24 items-center justify-center rounded-xl bg-green-50 text-5xl">
          {product.emoji}
        </div>

        <h3 className="mt-3 font-bold text-gray-900 group-hover:text-green-800">
          {product.name}
        </h3>

        <p className="mt-1 text-sm text-gray-500">{product.unit}</p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs text-gray-500">আজকের দাম</p>
            <p className="font-bold text-gray-900">
              {bnNumber(product.price)} টাকা
            </p>
          </div>

          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
              product.change > 0
                ? "bg-green-100 text-green-800"
                : product.change < 0
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {product.change > 0
              ? "▲"
              : product.change < 0
                ? "▼"
                : "—"}{" "}
            {bnNumber(Math.abs(product.change))}%
          </span>
        </div>
      </Link>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-green-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-2xl font-black text-green-800">
            🛒 বাজার দর
            <span className="mt-1 block text-xs font-normal text-gray-500">
              {today}
            </span>
          </Link>

          <div className="flex gap-2">
            <Link
              href="/signin"
              className="rounded-full border border-green-700 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50"
            >
              সাইন ইন
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900"
            >
              সাইন আপ
            </Link>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          <Link
            href="/"
            className="shrink-0 rounded-full bg-green-800 px-4 py-2 text-sm text-white"
          >
            সব পণ্য
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="shrink-0 rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-green-100"
            >
              {category.icon} {category.name}
            </Link>
          ))}
        </nav>
      </header>

      <div className="overflow-hidden border-y border-green-100 bg-green-50 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-x-8 gap-y-2 px-4 text-sm">
          {products.slice(0, 6).map((product) => (
            <span key={product.id} className="whitespace-nowrap">
              {product.emoji} {product.name}{" "}
              <strong>{bnNumber(product.price)} টাকা</strong>{" "}
              <span
                className={
                  product.change > 0
                    ? "text-green-700"
                    : product.change < 0
                      ? "text-red-600"
                      : "text-gray-500"
                }
              >
                {product.change > 0
                  ? "▲"
                  : product.change < 0
                    ? "▼"
                    : "—"}{" "}
                {bnNumber(Math.abs(product.change))}%
              </span>
            </span>
          ))}
          {!loading && products.length === 0 && (
            <span>বাজারদরের তথ্য লোড হলে এখানে দেখা যাবে।</span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <section className="grid items-center gap-8 overflow-hidden rounded-3xl bg-gradient-to-r from-green-100 via-white to-lime-100 p-6 sm:p-10 md:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-green-200 px-3 py-1 text-sm font-semibold text-green-900">
              স্মার্ট বাজার, স্মার্ট আপনি
            </span>
            <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              আজকের বাজারদরের সঠিক তথ্য এক নজরে!
            </h1>
            <p className="mt-4 max-w-lg leading-7 text-gray-600">
              নিত্যপ্রয়োজনীয় পণ্যের দাম দেখুন, বিভিন্ন পণ্যের বাজারদর জানুন
              এবং সচেতন সিদ্ধান্ত নিন।
            </p>
            <a
              href="#সব-পণ্য"
              className="mt-6 inline-flex rounded-full bg-green-800 px-6 py-3 font-bold text-white transition hover:bg-green-900"
            >
              ↓ সব পণ্য দেখুন
            </a>
          </div>
          <div className="flex min-h-52 items-center justify-center rounded-2xl bg-white/60 text-8xl sm:text-9xl">
            🥬 🥕 🧅
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
            <h2 className="mb-4 text-xl font-extrabold text-green-900">
              🟢 আজ দাম বেড়েছে ▲
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-32 animate-pulse rounded-xl bg-white"
                    />
                  ))
                : rising.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
            {!loading && rising.length === 0 && (
              <p className="text-sm text-gray-600">
                API-তে দাম বৃদ্ধির তথ্য পাওয়া যায়নি।
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
            <h2 className="mb-4 text-xl font-extrabold text-red-800">
              🔻 আজ দাম কমেছে ▼
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-32 animate-pulse rounded-xl bg-white"
                    />
                  ))
                : falling.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
            {!loading && falling.length === 0 && (
              <p className="text-sm text-gray-600">
                API-তে দাম কমার তথ্য পাওয়া যায়নি।
              </p>
            )}
          </div>
        </section>

        <section id="সব-পণ্য" className="scroll-mt-40 py-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">🛍️ সব পণ্য</h2>
              <p className="mt-2 text-gray-600">
                নিত্যপ্রয়োজনীয় পণ্যের বাজারদর এক জায়গায় দেখুন।
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              সাজান:
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2"
              >
                <option value="default">ডিফল্ট</option>
                <option value="low">দাম: কম থেকে বেশি</option>
                <option value="high">দাম: বেশি থেকে কম</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-white"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-2xl bg-gray-200"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <p className="py-8 text-center text-gray-600">
              কোনো পণ্যের তথ্য পাওয়া যায়নি।
            </p>
          )}
        </section>
      </div>

      <footer className="bg-green-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 py-6 text-sm sm:flex-row">
          <p>🛒 বাজার দর — প্রয়োজনীয় পণ্যের দাম এক নজরে।</p>
          <p className="text-green-100">
            সকল দাম সম্ভাব্য; বাজার অবস্থার ওপর নির্ভর করে পরিবর্তিত হয়।
          </p>
        </div>
      </footer>
    </main>
  );
}