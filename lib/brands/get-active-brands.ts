import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type PublicBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  country: string | null;
  websiteUrl: string | null;
  description: string | null;
};

type BrandRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  website_url: string | null;
  description: string | null;
};

function mapBrand(row: BrandRow): PublicBrand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    country: row.country,
    websiteUrl: row.website_url,
    description: row.description,
  };
}

export async function getActiveBrands(): Promise<PublicBrand[]> {
  if (!getSupabaseEnv()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, country, website_url, description")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error || !data) {
      console.error("[brands] getActiveBrands failed:", error?.message);
      return [];
    }

    return data.map((row) => mapBrand(row as BrandRow));
  } catch (error) {
    console.error("[brands] getActiveBrands exception:", error);
    return [];
  }
}

export async function getActiveBrandBySlug(slug: string): Promise<PublicBrand | null> {
  if (!slug || !getSupabaseEnv()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, country, website_url, description")
      .eq("is_active", true)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("[brands] getActiveBrandBySlug failed:", error.message);
      return null;
    }

    if (!data) return null;
    return mapBrand(data as BrandRow);
  } catch (error) {
    console.error("[brands] getActiveBrandBySlug exception:", error);
    return null;
  }
}
