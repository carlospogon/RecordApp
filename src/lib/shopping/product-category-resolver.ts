import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductCategory } from "@/types/shopping";
import { inferCategoryFromNormalizedName } from "@/lib/shopping/product-category-inference";

type TaxonomyAliasRow = {
  taxonomy?: {
    category?: ProductCategory | null;
  } | null;
};

type TaxonomyRow = {
  category?: ProductCategory | null;
};

export async function resolveGlobalProductCategory(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  normalizedName: string
): Promise<ProductCategory> {
  try {
    const { data: aliasMatch } = await supabase
      .from("product_taxonomy_aliases")
      .select("taxonomy:product_taxonomy(category)")
      .eq("normalized_alias", normalizedName)
      .maybeSingle();

    const aliasCategory = (aliasMatch as TaxonomyAliasRow | null)?.taxonomy?.category;

    if (aliasCategory) {
      return aliasCategory;
    }

    const { data: exactMatch } = await supabase
      .from("product_taxonomy")
      .select("category")
      .eq("normalized_name", normalizedName)
      .maybeSingle();

    const exactCategory = (exactMatch as TaxonomyRow | null)?.category;

    if (exactCategory) {
      return exactCategory;
    }
  } catch {
    return inferCategoryFromNormalizedName(normalizedName);
  }

  return inferCategoryFromNormalizedName(normalizedName);
}
