
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProductById, type Product, formatBDT } from "@/lib/bazar";

type ProductDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export default function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const [slug, setSlug] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    params
      .then(({ slug: routeSlug }) => {
        if (active) setSlug(routeSlug);
      })
      .catch(() => {
        if (active) {
          setError("পণ্যের ঠিকানা পড়া যায়নি।");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const result = await getProductById(slug);

        if (active) {
          setProduct(result);
          if (!result) {
            setError("এই পণ্যের তথ্য পাওয়া যায়নি।");
          }
        }
      } catch {
        if (active) {
          setProduct(null);
          setError("পণ্যের তথ্য লোড করা যায়নি। আবার চেষ্টা করো।");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="h-8 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-gray-200" />
        <div className="mt-4 h-20 animate-pulse rounded bg-gray-200" />
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-5xl">🔎</p>
        <h1 className="mt-4 text-2xl font-bold">পণ্যটি পাওয়া যায়নি</h1>
        <p className="mt-2 text-gray-600">
          {error || "এই পণ্যের তথ্য পাওয়া যায়নি।"}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-green-700 px-5 py-3 font-semibold text-white"
        >
          হোমপেজে ফিরে যাও
        </Link>
      </main>
    );
  }

  const minimum = Math.round(product.price * 0.9);
  const maximum = Math.round(product.price * 1.1);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/" className="text-sm font-medium text-green-700">
        ← হোমপেজ
      </Link>

      <section className="mt-5 grid gap-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-2 md:p-10">
        <div className="flex min-h-64 items-center justify-center rounded-2xl bg-green-50">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="max-h-64 max-w-full object-contain"
            />
          ) : (
            <span className="text-8xl">{product.emoji}</span>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-green-700">
            {product.category}
          </p>

          <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>

          <p className="mt-3 text-gray-600">
            {product.description || "এই পণ্যের বর্তমান বাজারদর দেখুন।"}
          </p>

          <p className="mt-6 text-sm text-gray-500">
            বর্তমান প্রদর্শিত দাম
          </p>

          <p className="mt-1 text-4xl font-bold text-green-700">
            ৳{formatBDT(product.price)}
          </p>

          <p className="mt-1 text-sm text-gray-500">{product.unit}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">সর্বনিম্ন</p>
              <p className="mt-1 font-bold">৳{formatBDT(minimum)}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">গড়</p>
              <p className="mt-1 font-bold">
                ৳{formatBDT(product.price)}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">সর্বোচ্চ</p>
              <p className="mt-1 font-bold">৳{formatBDT(maximum)}</p>
            </div>
          </div>

          <p className="mt-5 text-sm text-gray-500">
            দ্রষ্টব্য: API-তে আলাদা সর্বনিম্ন/সর্বোচ্চ দাম না থাকলে এখানে
            আনুমানিক মান দেখানো হচ্ছে; এগুলো বাজারের যাচাইকৃত দাম নয়।
          </p>

          <Link
            href={`/category/${encodeURIComponent(product.categorySlug)}`}
            className="mt-6 inline-block rounded-lg bg-green-700 px-5 py-3 font-semibold text-white"
          >
            এই ক্যাটাগরির পণ্য দেখো
          </Link>
        </div>
      </section>
    </main>
  );
}