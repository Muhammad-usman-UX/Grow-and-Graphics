import "server-only";
import { getAdminClient, isSupabaseConfigured } from "./supabase/admin";

export interface PublicReview {
  rating: number;
  name: string;
  comment: string;
  product: string;
}

export interface ReviewSummary {
  count: number;
  average: number;
  items: PublicReview[];
}

/** Approved reviews only. Never throws: the site must load even if the database is not set up yet. */
export async function getReviewSummary(product?: string): Promise<ReviewSummary> {
  const empty = { count: 0, average: 0, items: [] };
  if (!isSupabaseConfigured()) return empty;
  try {
    let q = getAdminClient()
      .from("reviews")
      .select("rating,name,comment,product")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (product) q = q.eq("product", product);
    const { data, error } = await q;
    if (error || !data || data.length === 0) return empty;
    const sum = data.reduce((s, r) => s + r.rating, 0);
    return { count: data.length, average: Math.round((sum / data.length) * 10) / 10, items: data.slice(0, 6) as PublicReview[] };
  } catch {
    return empty;
  }
}
