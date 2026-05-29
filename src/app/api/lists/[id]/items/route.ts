import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccessibleListForUser } from "@/lib/supabase/shared-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessibleList = await getAccessibleListForUser(id, user.id);

  if (!accessibleList?.id) {
    return NextResponse.json({ error: "No tienes acceso a esta lista." }, { status: 403 });
  }

  const { data, error } = await admin
    .from("shopping_items")
    .select("id, list_id, name, normalized_name, quantity, unit, status, created_at, updated_at, checked_at")
    .eq("list_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: (data ?? []).map((item) => ({
      id: item.id,
      listId: item.list_id,
      name: item.name,
      normalizedName: item.normalized_name,
      quantity: item.quantity,
      unit: item.unit,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      checkedAt: item.checked_at
    }))
  });
}
