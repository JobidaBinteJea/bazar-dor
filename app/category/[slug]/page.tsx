
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getProducts, type Product, formatBDT } from "@/lib/bazar";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("default");
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    let active = true;

    getProducts()
      .then((all) => {
        const matches = all.filter((product) => {
          const categorySlug = product.categorySlug.toLowerCase();
          const category = product.category.toLowerCase();

          return (
            categorySlug === slug.toLowerCase() ||
            category === slug.toLowerCase() ||
            categorySlug.replace(/-/g, " ") === slug.toLowerCase().replace(/-/g, " ")
          );
        });

        if (active) {
          setProducts(matches);
          setCategoryName(matches[0]?.category || slug.replace(/-/g, " "));
        }
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const sortedProducts = [...products].sort((a, b) => {
    if (sort === "low") return a.price - b.price;
    if (sort === "high") return b.price - a.price;
    return 0;
  });

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10">
      <Link href="/" className="text-sm font-medium text-green-700">
        ← হোমপেজ
      </Link>

      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-green-700">পণ্য ক্যাটাগরি</p>
          <h1 className="mt-1 text-3xl font-bold capitalize">
            🛒 {categoryName || slug.replace(/-/g, " ")}
          </h1>
          <p className="mt-2 text-gray-600">
            এই ক্যাটাগরির পণ্য ও বর্তমান প্রদর্শিত দাম।
          </p>
        </div>

        <label className="text-sm font-medium">
          দাম অনুযায়ী সাজাও
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-3 sm:w-56"
          >
            <option value="default">ডিফল্ট</option>
            <option value="low">কম দাম থেকে বেশি</option>
            <option value="high">বেশি দাম থেকে কম</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-5xl">📦</p>
          <h2 className="mt-4 text-xl font-bold">এই ক্যাটাগরিতে পণ্য পাওয়া যায়নি</h2>
          <p className="mt-2 text-gray-600">
            ক্যাটাগরির নাম ভুল হতে পারে অথবা API-তে পণ্য নেই।
          </p>
          <Link href="/" className="mt-5 inline-block rounded-lg bg-green-700 px-5 py-3 text-white">
            সব পণ্য দেখো
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedProducts.map((product) => (
            <Link
              key={product.id}
              href={`/product/${encodeURIComponent(product.id)}`}
              className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-28 items-center justify-center rounded-xl bg-green-50 text-6xl">
                {product.emoji}
              </div>
              <p className="mt-4 text-sm text-gray-500">{product.category}</p>
              <h2 className="mt-1 text-lg font-bold">{product.name}</h2>
              <p className="mt-3 text-2xl font-bold text-green-700">
                ৳{formatBDT(product.price)}
              </p>
              <p className="mt-1 text-sm text-gray-500">{product.unit}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-green-700">
                বিস্তারিত দেখো →
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}