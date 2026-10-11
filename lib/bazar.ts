
const API = "https://openapi.programming-hero.com/api/bazardor";

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  price: number;
  unit: string;
  emoji: string;
  change: number;
  image?: string;
  description?: string;
};

function getRows(json: any, keys: string[] = []): any[] {
  if (Array.isArray(json)) return json;

  if (!json || typeof json !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(json[key])) return json[key];
  }

  for (const key of ["data", "result", "results", "products", "categories"]) {
    if (Array.isArray(json[key])) return json[key];

    if (json[key] && typeof json[key] === "object") {
      const nested = getRows(json[key], keys);
      if (nested.length) return nested;
    }
  }

  return [];
}

function toNumber(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return Number(value.replace(/[^\d.-]/g, "")) || 0;
  }
  return 0;
}

export function normalizeProduct(item: any): Product {
  const category =
    typeof item.category === "object"
      ? item.category?.name || item.category?.title || ""
      : item.category || item.categoryName || item.category_name || "";

  const name =
    item.name ||
    item.title ||
    item.productName ||
    item.product_name ||
    "পণ্যের নাম পাওয়া যায়নি";

  const id = String(item.id ?? item._id ?? item.productId ?? item.product_id ?? name);

  const slug = String(
    item.slug ||
      name
        .toLowerCase()
        .trim()
        .replace(/[^\w\u0980-\u09FF]+/g, "-")
        .replace(/^-|-$/g, "")
  );

  return {
    id,
    name,
    slug,
    category: String(category || "অন্যান্য"),
    categorySlug: String(
      item.categorySlug ||
        item.category_slug ||
        (typeof item.category === "object" ? item.category?.slug : "") ||
        category
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
    ),
    price: toNumber(
      item.price ??
        item.currentPrice ??
        item.current_price ??
        item.averagePrice ??
        item.average_price ??
        item.avgPrice ??
        item.avg_price
    ),
    unit: String(item.unit || item.unitName || item.unit_name || "প্রতি কেজি"),
    emoji: String(item.emoji || item.icon || "🛒"),
    change: toNumber(
      item.change ??
        item.changePercent ??
        item.change_percentage ??
        item.priceChange ??
        item.percentageChange
    ),
    image: item.image || item.imageUrl || item.image_url || "",
    description: item.description || item.details || "",
  };
}

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API}/products`, {
    cache: "no-store",
  });

  if (!response.ok) throw new Error("পণ্যের তথ্য লোড করা যায়নি");

  const json = await response.json();
  return getRows(json, ["products", "items"]).map(normalizeProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API}/products/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });

    if (response.ok) {
      const json = await response.json();
      const item =
        json?.data?.product ||
        json?.data ||
        json?.product ||
        json?.result ||
        json;

      if (item && typeof item === "object" && !Array.isArray(item)) {
        const product = normalizeProduct(item);
        if (product.name !== "পণ্যের নাম পাওয়া যায়নি") return product;
      }
    }
  } catch {
    // নিচে সব পণ্যের তালিকা থেকে খোঁজার চেষ্টা হবে
  }

  const products = await getProducts();
  return products.find((product) => product.id === id || product.slug === id) || null;
}

export function formatBDT(value: number): string {
  return new Intl.NumberFormat("bn-BD", {
    maximumFractionDigits: 2,
  }).format(value);
}