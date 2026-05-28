"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findDuplicateNotice, requireAuthenticatedUser } from "@/lib/supabase/queries";
import { normalizeProductName } from "@/lib/shopping/normalize-product";
import { ProductCategory, ShoppingDuplicateNotice } from "@/types/shopping";

const createListSchema = z.object({
  title: z.string().trim().max(120).optional(),
  shoppingDate: z.string().trim().min(1),
  reminderDate: z.string().trim().optional()
});

const createItemSchema = z.object({
  listId: z.string().uuid(),
  productId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().max(40).optional(),
  unit: z.string().trim().max(40).optional()
});

const itemIdSchema = z.object({
  itemId: z.string().uuid()
});

const quickAddItemSchema = z.object({
  listId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().max(40).optional(),
  unit: z.string().trim().max(40).optional()
});

const updateItemSchema = z.object({
  itemId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().max(40).optional(),
  unit: z.string().trim().max(40).optional()
});

const updateCatalogProductSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  defaultUnit: z.string().trim().max(40).optional(),
  category: z.enum(["fruta", "verdura", "lacteos", "huevos", "panaderia", "carne", "pescado", "despensa", "bebidas", "hogar", "otros"]),
  active: z.enum(["true", "false"])
});

type ActionState = {
  error?: string;
  success?: string;
  duplicateMessage?: string;
  duplicateNotice?: ShoppingDuplicateNotice | null;
  createdItemId?: string;
};

function emptyActionState(): ActionState {
  return {};
}

async function getUserOrThrow() {
  const user = await requireAuthenticatedUser();

  if (!user) {
    throw new Error("Debes iniciar sesion para usar RecordApp.");
  }

  return user;
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function getInitialActionState() {
  return emptyActionState();
}

export type { ActionState };

export async function createListAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createListSchema.safeParse({
    title: formData.get("title") ?? "",
    shoppingDate: formData.get("shoppingDate") ?? "",
    reminderDate: formData.get("reminderDate") ?? ""
  });

  if (!parsed.success) {
    return { error: "Introduce una fecha valida para crear la lista." };
  }

  const user = await getUserOrThrow();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({
      user_id: user.id,
      title: parsed.data.title || "Lista de compra",
      shopping_date: parsed.data.shoppingDate,
      reminder_date: parsed.data.reminderDate || null
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app");
  redirect(data?.id ? `/app?list=${data.id}` : "/app");
}

export async function finalizeListAction(formData: FormData) {
  const listId = formData.get("listId");

  if (typeof listId !== "string" || !listId) {
    return;
  }

  await getUserOrThrow();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("shopping_lists")
    .update({
      completed_at: new Date().toISOString()
    })
    .eq("id", listId);

  revalidatePath("/app");
  redirect("/app");
}

export async function createItemAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createItemSchema.safeParse({
    listId: formData.get("listId") ?? "",
    productId: formData.get("productId") ?? "",
    name: formData.get("name") ?? "",
    quantity: formData.get("quantity") ?? "",
    unit: formData.get("unit") ?? ""
  });

  if (!parsed.success) {
    return { error: "Completa al menos el nombre del producto." };
  }

  const user = await getUserOrThrow();
  const normalizedName = normalizeProductName(parsed.data.name);

  if (!normalizedName) {
    return { error: "El producto no es valido." };
  }

  const duplicateNotice = await findDuplicateNotice(parsed.data.name);
  const supabase = await createSupabaseServerClient();
  let finalUnit = parsed.data.unit || null;

  try {
    if (parsed.data.productId) {
      const { data: catalogProduct } = await supabase
        .from("shopping_products")
        .select("default_unit")
        .eq("id", parsed.data.productId)
        .maybeSingle();

      finalUnit = parsed.data.unit || catalogProduct?.default_unit || null;
    } else {
      const { data: existingProduct } = await supabase
        .from("shopping_products")
        .select("id, default_unit")
        .eq("normalized_name", normalizedName)
        .maybeSingle();

      if (existingProduct) {
        finalUnit = parsed.data.unit || existingProduct.default_unit || null;
      } else {
        await supabase.from("shopping_products").insert({
          user_id: user.id,
          name: parsed.data.name,
          normalized_name: normalizedName,
          default_unit: parsed.data.unit || null,
          category: "otros",
          active: true
        });
      }
    }
  } catch {
    finalUnit = parsed.data.unit || null;
  }

  const { data, error } = await supabase
    .from("shopping_items")
    .insert({
      list_id: parsed.data.listId,
      user_id: user.id,
      name: parsed.data.name,
      normalized_name: normalizedName,
      quantity: parsed.data.quantity || null,
      unit: finalUnit,
      status: "pending"
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app");
  return {
    success: "Producto anadido.",
    duplicateMessage: duplicateNotice?.message,
    duplicateNotice,
    createdItemId: data?.id
  };
}

export async function quickAddReminderItemAction(formData: FormData) {
  const parsed = quickAddItemSchema.safeParse({
    listId: formData.get("listId") ?? "",
    name: formData.get("name") ?? "",
    quantity: formData.get("quantity") ?? "",
    unit: formData.get("unit") ?? ""
  });

  if (!parsed.success) {
    return;
  }

  const user = await getUserOrThrow();
  const normalizedName = normalizeProductName(parsed.data.name);

  if (!normalizedName) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("shopping_items").insert({
    list_id: parsed.data.listId,
    user_id: user.id,
    name: parsed.data.name,
    normalized_name: normalizedName,
    quantity: parsed.data.quantity || null,
    unit: parsed.data.unit || null,
    status: "pending"
  });

  revalidatePath("/app");
}

export async function toggleItemStatusAction(formData: FormData) {
  const parsed = itemIdSchema.safeParse({
    itemId: formData.get("itemId") ?? ""
  });

  if (!parsed.success) {
    return;
  }

  await getUserOrThrow();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("shopping_items")
    .select("id, status")
    .eq("id", parsed.data.itemId)
    .single();

  if (!data) {
    return;
  }

  const nextStatus = data.status === "bought" ? "pending" : "bought";
  await supabase
    .from("shopping_items")
    .update({
      status: nextStatus,
      checked_at: nextStatus === "bought" ? new Date().toISOString() : null
    })
    .eq("id", parsed.data.itemId);

  revalidatePath("/app");
}

export async function deleteItemAction(formData: FormData) {
  const parsed = itemIdSchema.safeParse({
    itemId: formData.get("itemId") ?? ""
  });

  if (!parsed.success) {
    return;
  }

  await getUserOrThrow();
  const supabase = await createSupabaseServerClient();
  await supabase.from("shopping_items").delete().eq("id", parsed.data.itemId);
  revalidatePath("/app");
}

export async function updateItemAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updateItemSchema.safeParse({
    itemId: formData.get("itemId") ?? "",
    name: formData.get("name") ?? "",
    quantity: formData.get("quantity") ?? "",
    unit: formData.get("unit") ?? ""
  });

  if (!parsed.success) {
    return { error: "No se pudo actualizar el producto." };
  }

  await getUserOrThrow();
  const normalizedName = normalizeProductName(parsed.data.name);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("shopping_items")
    .update({
      name: parsed.data.name,
      normalized_name: normalizedName,
      quantity: parsed.data.quantity || null,
      unit: parsed.data.unit || null
    })
    .eq("id", parsed.data.itemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app");
  return { success: "Producto actualizado." };
}

export async function updateCatalogProductAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updateCatalogProductSchema.safeParse({
    productId: formData.get("productId") ?? "",
    name: formData.get("name") ?? "",
    defaultUnit: formData.get("defaultUnit") ?? "",
    category: formData.get("category") ?? "otros",
    active: formData.get("active") ?? "true"
  });

  if (!parsed.success) {
    return { error: "No se pudo actualizar el producto del catalogo." };
  }

  await getUserOrThrow();
  const normalizedName = normalizeProductName(parsed.data.name);

  if (!normalizedName) {
    return { error: "El nombre del producto no es valido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("shopping_products")
    .update({
      name: parsed.data.name,
      normalized_name: normalizedName,
      default_unit: parsed.data.defaultUnit || null,
      category: parsed.data.category as ProductCategory,
      active: parsed.data.active === "true"
    })
    .eq("id", parsed.data.productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app");
  return { success: "Producto del catalogo actualizado." };
}
