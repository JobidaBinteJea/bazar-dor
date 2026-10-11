
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API = "https://openapi.programming-hero.com/api/bazardor";

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
  yesterday: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

type DataRecord = Record<string, unknown>;

function isRecord(value: unknown): value is DataRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function read(
  item: DataRecord,
  keys: string[],
): unknown {
  for (const key of keys) {
    const value = item[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return undefined;
}

function getRows(
  json: unknown,
  keys: string[],
): DataRecord[] {
  if (Array.isArray(json)) {
    return json.filter(isRecord);
  }

  if (!isRecord(json)) {
    return [];
  }

  for (const key of keys) {
    const value = json[key];

    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }

    if (isRecord(value)) {
      const nestedRows = getRows(value, [
        ...keys,
        "value",
        "data",
        "result",
        "results",
        "products",
        "categories",
        "items",
      ]);

      if (nestedRows.length > 0) {
        return nestedRows;
      }
    }
  }

  return [];
}

function numberValue(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value
      .replace(/[০-৯]/g, (digit) =>
        String("০১২৩৪৫৬৭৮৯".indexOf(digit)),
      )
      .replace(/[^\d.-]/g, "");

    const result = Number(normalized);

    return Number.isFinite(result) ? result : 0;
  }

  return 0;
}

function normalizeProduct(
  item: DataRecord,
  index: number,
): Product {
  const rawChange = read(item, [
    "change",
    "changePercent",
    "change_percent",
  ]);

  let change = 0;

  if (isRecord(rawChange)) {
    change = numberValue(read(rawChange, ["pct", "percent"]));
  } else {
    change = numberValue(rawChange);
  }

  const categorySlug = String(
    read(item, ["category", "categorySlug", "category_slug"]) ??
      "other",
  );

  const yesterday = numberValue(
    read(item, ["yesterday", "previousPrice", "previous_price"]),
  );

  return {
    id: (() => {
      const id = read(item, ["id", "_id", "productId"]);
      return typeof id === "string" || typeof id === "number"
        ? id
        : index + 1;
    })(),

    name: String(
      read(item, ["nameBn", "name", "title", "productName"]) ??
        "পণ্যের নাম",
    ),

    slug: String(
      read(item, ["slug", "id", "productId"]) ?? index + 1,
    ),

    category: String(
      read(item, [
        "categoryNameBn",
        "categoryName",
        "category_name",
      ]) ?? categorySlug,
    ),

    categorySlug,

    unit: String(read(item, ["unit"]) ?? "একক"),

    price: numberValue(
      read(item, ["today", "price", "currentPrice", "current_price"]),
    ),

    change,

    emoji: String(
      read(item, ["image", "emoji", "icon"]) ?? "🛒",
    ),

    yesterday,
  };
}

function normalizeCategory(
  item: DataRecord,
  index: number,
): Category {
  return {
    id: String(read(item, ["id"]) ?? index + 1),

    name: String(
      read(item, ["nameBn", "name", "title"]) ?? "অন্যান্য",
    ),

    slug: String(
      read(item, ["slug", "id"]) ?? "other",
    ),

    icon: String(read(item, ["icon", "emoji"]) ?? "🛒"),
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("bn-BD", {
    maximumFractionDigits: 2,
  }).format(value);
}

function ProductCard({ product }: { product: Product }) {
  const isUp = product.change > 0;
  const isDown = product.change < 0;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-4xl">
          {product.emoji}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isUp
              ? "bg-red-50 text-red-600"
              : isDown
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {isUp ? "↑" : isDown ? "↓" : "—"}{" "}
          {formatNumber(Math.abs(product.change))}%
        </span>
      </div>

      <div className="mt-4 flex-1">
        <p className="text-xs text-gray-500">{product.category}</p>

        <h3 className="mt-1 text-lg font-bold text-gray-900">
          {product.name}
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          একক: {product.unit}
        </p>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="text-sm text-gray-500">আজকের বাজারদর</p>

        <p className="mt-1 text-2xl font-extrabold text-green-700">
          ৳{formatNumber(product.price)}
          <span className="ml-1 text-sm font-normal text-gray-500">
            / {product.unit}
          </span>
        </p>

        {product.yesterday > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            গতকাল: ৳{formatNumber(product.yesterday)}
          </p>
        )}

        <Link
          href={`/product/${product.slug}`}
          className="mt-4 block rounded-xl bg-green-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-green-800"
        >
          বিস্তারিত দেখুন
        </Link>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [productResponse, categoryResponse] =
          await Promise.all([
            fetch(`${API}/products`),
            fetch(`${API}/categories`),
          ]);

        if (!productResponse.ok || !categoryResponse.ok) {
          throw new Error("API থেকে তথ্য আনা যায়নি।");
        }

        const [productJson, categoryJson] = await Promise.all([
          productResponse.json(),
          categoryResponse.json(),
        ]);

        const productRows = getRows(productJson, [
          "value",
          "products",
          "items",
          "data",
        ]);

        const categoryRows = getRows(categoryJson, [
          "value",
          "categories",
          "items",
          "data",
        ]);

        const normalizedProducts = productRows.map(
          normalizeProduct,
        );

        const normalizedCategories = categoryRows.map(
          normalizeCategory,
        );

        if (!cancelled) {
          setProducts(normalizedProducts);
          setCategories(normalizedCategories);

          if (normalizedProducts.length === 0) {
            setError("এখন কোনো পণ্যের তথ্য পাওয়া যায়নি।");
          }
        }
      } catch {
        if (!cancelled) {
          setError(
            "তথ্য লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করো।",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((product) => {
        return (
          product.name.toLowerCase().includes(searchText) ||
          product.category.toLowerCase().includes(searchText) ||
          product.categorySlug.toLowerCase().includes(searchText)
        );
      });
    }

    if (selectedCategory !== "all") {
      result = result.filter(
        (product) => product.categorySlug === selectedCategory,
      );
    }

    if (sortBy === "low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "up") {
      result.sort((a, b) => b.change - a.change);
    } else if (sortBy === "down") {
      result.sort((a, b) => a.change - b.change);
    }

    return result;
  }, [products, search, selectedCategory, sortBy]);

  const risingCount = products.filter(
    (product) => product.change > 0,
  ).length;

  const fallingCount = products.filter(
    (product) => product.change < 0,
  ).length;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🛒</span>
            <span className="text-2xl font-extrabold text-green-800">
              বাজার দর
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-700">
            <Link href="/" className="hover:text-green-700">
              হোম
            </Link>
            <Link href="/signin" className="hover:text-green-700">
              সাইন ইন
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-green-700 px-4 py-2.5 text-white hover:bg-green-800"
            >
              অ্যাকাউন্ট তৈরি
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-br from-green-800 to-emerald-600 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 md:items-center md:py-16 lg:px-8">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm">
              🇧🇩 বাংলাদেশের নিত্যপণ্যের বাজারদর
            </p>

            <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
              প্রতিদিনের বাজারদর
              <br />
              জানুন সহজেই
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-green-50 sm:text-lg">
              চাল, ডাল, তেল, সবজি, মাছ ও অন্যান্য নিত্যপ্রয়োজনীয়
              পণ্যের আজকের দাম এবং দামের পরিবর্তন এক জায়গায় দেখুন।
            </p>

            <a
              href="#products"
              className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-bold text-green-800 transition hover:bg-green-50"
            >
              বাজারদর দেখুন ↓
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/20">
              <p className="text-sm text-green-50">মোট পণ্য</p>
              <p className="mt-2 text-3xl font-extrabold">
                {formatNumber(products.length)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/20">
              <p className="text-sm text-green-50">মোট ক্যাটাগরি</p>
              <p className="mt-2 text-3xl font-extrabold">
                {formatNumber(categories.length)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/20">
              <p className="text-sm text-green-50">দাম বেড়েছে</p>
              <p className="mt-2 text-3xl font-extrabold">
                {formatNumber(risingCount)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/20">
              <p className="text-sm text-green-50">দাম কমেছে</p>
              <p className="mt-2 text-3xl font-extrabold">
                {formatNumber(fallingCount)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            পণ্যের বাজারদর
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            পণ্য খুঁজে বের করো, ক্যাটাগরি বেছে নাও এবং দাম তুলনা করো।
          </p>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="পণ্যের নাম লিখে খুঁজুন..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600"
            aria-label="পণ্য সাজান"
          >
            <option value="default">ডিফল্ট সাজানো</option>
            <option value="low">দাম: কম থেকে বেশি</option>
            <option value="high">দাম: বেশি থেকে কম</option>
            <option value="up">দাম বৃদ্ধি অনুযায়ী</option>
            <option value="down">দাম হ্রাস অনুযায়ী</option>
          </select>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selectedCategory === "all"
                ? "border-green-700 bg-green-700 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-green-600"
            }`}
          >
            সব পণ্য
          </button>

          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setSelectedCategory(category.slug)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === category.slug
                  ? "border-green-700 bg-green-700 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-green-600"
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        <div id="products">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-16 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-green-700" />
              <p className="mt-4 font-semibold text-gray-700">
                বাজারদর লোড হচ্ছে...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-10 text-center">
              <p className="font-semibold text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-green-700 px-5 py-2.5 font-semibold text-white hover:bg-green-800"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center">
              <p className="text-lg font-bold">কোনো পণ্য পাওয়া যায়নি</p>
              <p className="mt-2 text-sm text-gray-500">
                অন্য নাম দিয়ে সার্চ করো অথবা অন্য ক্যাটাগরি বেছে নাও।
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setSortBy("default");
                }}
                className="mt-4 rounded-xl bg-green-700 px-5 py-2.5 font-semibold text-white hover:bg-green-800"
              >
                সব পণ্য দেখুন
              </button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-600">
                মোট {formatNumber(filteredProducts.length)}টি পণ্য পাওয়া গেছে
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <footer className="mt-8 bg-gray-900 text-gray-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-center sm:px-6 md:flex-row md:items-center md:justify-between md:text-left lg:px-8">
          <p className="font-bold text-white">🛒 বাজার দর</p>
          <p className="text-sm">
            প্রতিদিনের বাজারদর জানুন সহজে।
          </p>
        </div>
      </footer>
    </main>
  );
}
