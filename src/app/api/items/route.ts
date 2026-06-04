import { NextResponse } from "next/server";
import { logShoppingActivity } from "@/lib/shopping/activity-log";
import { resolveGlobalProductCategory } from "@/lib/shopping/product-category-resolver";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeProductName } from "@/lib/shopping/normalize-product";
import { getAccessibleListForUser } from "@/lib/supabase/shared-access";

type CreateItemPayload = {
  id?: string;
  listId?: string;
  productId?: string;
  name?: string;
  quantity?: string;
  unit?: string;
  section?: string;
  notes?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateItemPayload;
  const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : crypto.randomUUID();
  const listId = typeof body.listId === "string" ? body.listId : "";
  const productId = typeof body.productId === "string" ? body.productId : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const quantity = typeof body.quantity === "string" ? body.quantity.trim() : "";
  const unit = typeof body.unit === "string" ? body.unit.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (!listId || !name) {
    return NextResponse.json({ error: "Completa al menos el nombre del producto." }, { status: 400 });
  }

  const normalizedName = normalizeProductName(name);

  if (!normalizedName) {
    return NextResponse.json({ error: "El producto no es válido." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessibleList = await getAccessibleListForUser(listId, user.id);

  if (!accessibleList?.id) {
    return NextResponse.json({ error: "No tienes acceso a esta lista." }, { status: 403 });
  }

  let finalUnit = unit || null;
  let finalSection = "";

  try {
    if (productId) {
      const { data: catalogProduct } = await supabase
        .from("shopping_products")
        .select("default_unit, category")
        .eq("id", productId)
        .eq("user_id", user.id)
        .maybeSingle();

      finalUnit = unit || catalogProduct?.default_unit || null;
      finalSection =
        catalogProduct?.category && catalogProduct.category !== "otros"
          ? catalogProduct.category
          : await resolveGlobalProductCategory(supabase, normalizedName);
      if (productId && finalSection && finalSection !== "otros" && catalogProduct?.category !== finalSection) {
        await supabase.from("shopping_products").update({ category: finalSection }).eq("id", productId).eq("user_id", user.id);
      }
      const now = new Date().toISOString();
      const { error } = await admin
        .from("shopping_items")
        .insert({
          id,
          list_id: listId,
          user_id: user.id,
          name,
          normalized_name: normalizedName,
          quantity: quantity || null,
          unit: finalUnit,
          section: finalSection || "otros",
          notes: notes || null,
          assigned_to_user_id: null,
          status: "pending"
        });

      if (error) {
        return NextResponse.json({ error: error?.message ?? "No se pudo crear el producto." }, { status: 500 });
      }

      await logShoppingActivity({
        listId,
        actorUserId: user.id,
        eventType: "item_added",
        itemId: id,
        spaceId: accessibleList.spaceId ?? null,
        subjectName: name
      });

      return NextResponse.json({
        item: {
          id,
          listId,
          name,
          normalizedName,
          quantity: quantity || null,
          unit: finalUnit,
          section: finalSection || "otros",
          notes: notes || null,
          assignedToUserId: null,
          status: "pending",
          createdAt: now,
          updatedAt: now,
          checkedAt: null
        }
      });
    } else {
      const { data: existingProduct } = await supabase
        .from("shopping_products")
        .select("id, default_unit, category")
        .eq("normalized_name", normalizedName)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProduct) {
        finalUnit = unit || existingProduct.default_unit || null;
        finalSection =
          existingProduct.category && existingProduct.category !== "otros"
            ? existingProduct.category
            : await resolveGlobalProductCategory(supabase, normalizedName);
        if (finalSection && finalSection !== "otros" && existingProduct.category !== finalSection) {
          await supabase.from("shopping_products").update({ category: finalSection }).eq("id", existingProduct.id).eq("user_id", user.id);
        }
        const now = new Date().toISOString();
        const { error } = await admin
          .from("shopping_items")
          .insert({
            id,
            list_id: listId,
            user_id: user.id,
            name,
            normalized_name: normalizedName,
            quantity: quantity || null,
            unit: finalUnit,
            section: finalSection || "otros",
            notes: notes || null,
            assigned_to_user_id: null,
            status: "pending"
          });

        if (error) {
          return NextResponse.json({ error: error?.message ?? "No se pudo crear el producto." }, { status: 500 });
        }

        await logShoppingActivity({
          listId,
          actorUserId: user.id,
          eventType: "item_added",
          itemId: id,
          spaceId: accessibleList.spaceId ?? null,
          subjectName: name
        });

        return NextResponse.json({
          item: {
            id,
            listId,
            name,
            normalizedName,
            quantity: quantity || null,
            unit: finalUnit,
            section: finalSection || "otros",
            notes: notes || null,
            assignedToUserId: null,
            status: "pending",
            createdAt: now,
            updatedAt: now,
            checkedAt: null
          }
        });
      } else {
        finalSection = await resolveGlobalProductCategory(supabase, normalizedName);
        await supabase.from("shopping_products").insert({
          user_id: user.id,
          name,
          normalized_name: normalizedName,
          default_unit: unit || null,
          category: finalSection || "otros",
          active: true
        });
      }
    }
  } catch {
    finalUnit = unit || null;
  }

  if (!finalSection) {
    finalSection = await resolveGlobalProductCategory(supabase, normalizedName);
  }
  const now = new Date().toISOString();
  const { error } = await admin
    .from("shopping_items")
    .insert({
      id,
      list_id: listId,
      user_id: user.id,
      name,
      normalized_name: normalizedName,
      quantity: quantity || null,
      unit: finalUnit,
      section: finalSection,
      notes: notes || null,
      assigned_to_user_id: null,
      status: "pending"
    });

  if (error) {
    return NextResponse.json({ error: error?.message ?? "No se pudo crear el producto." }, { status: 500 });
  }

  await logShoppingActivity({
    listId,
    actorUserId: user.id,
    eventType: "item_added",
    itemId: id,
    spaceId: accessibleList.spaceId ?? null,
    subjectName: name
  });

  return NextResponse.json({
    item: {
      id,
      listId,
      name,
      normalizedName,
      quantity: quantity || null,
      unit: finalUnit,
      section: finalSection,
      notes: notes || null,
      assignedToUserId: null,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      checkedAt: null
    }
  });
}
