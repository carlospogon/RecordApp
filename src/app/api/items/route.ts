import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findDuplicateNotice } from "@/lib/supabase/queries";
import { normalizeProductName } from "@/lib/shopping/normalize-product";

type CreateItemPayload = {
  listId?: string;
  productId?: string;
  name?: string;
  quantity?: string;
  unit?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateItemPayload;
  const listId = typeof body.listId === "string" ? body.listId : "";
  const productId = typeof body.productId === "string" ? body.productId : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const quantity = typeof body.quantity === "string" ? body.quantity.trim() : "";
  const unit = typeof body.unit === "string" ? body.unit.trim() : "";

  if (!listId || !name) {
    return NextResponse.json({ error: "Completa al menos el nombre del producto." }, { status: 400 });
  }

  const normalizedName = normalizeProductName(name);

  if (!normalizedName) {
    return NextResponse.json({ error: "El producto no es valido." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const duplicateNotice = await findDuplicateNotice(name);
  let finalUnit = unit || null;

  try {
    if (productId) {
      const { data: catalogProduct } = await supabase
        .from("shopping_products")
        .select("default_unit")
        .eq("id", productId)
        .eq("user_id", user.id)
        .maybeSingle();

      finalUnit = unit || catalogProduct?.default_unit || null;
    } else {
      const { data: existingProduct } = await supabase
        .from("shopping_products")
        .select("id, default_unit")
        .eq("normalized_name", normalizedName)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProduct) {
        finalUnit = unit || existingProduct.default_unit || null;
      } else {
        await supabase.from("shopping_products").insert({
          user_id: user.id,
          name,
          normalized_name: normalizedName,
          default_unit: unit || null,
          category: "otros",
          active: true
        });
      }
    }
  } catch {
    finalUnit = unit || null;
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("shopping_items")
    .insert({
      list_id: listId,
      user_id: user.id,
      name,
      normalized_name: normalizedName,
      quantity: quantity || null,
      unit: finalUnit,
      status: "pending"
    })
    .select("id, list_id, name, normalized_name, quantity, unit, status, created_at, updated_at, checked_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "No se pudo crear el producto." }, { status: 500 });
  }

  return NextResponse.json({
    item: {
      id: data.id,
      listId: data.list_id,
      name: data.name,
      normalizedName: data.normalized_name,
      quantity: data.quantity,
      unit: data.unit,
      status: data.status,
      createdAt: data.created_at ?? now,
      updatedAt: data.updated_at ?? now,
      checkedAt: data.checked_at
    },
    duplicateNotice
  });
}
