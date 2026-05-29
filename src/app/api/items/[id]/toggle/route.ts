import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccessibleItemForUser } from "@/lib/supabase/shared-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessibleItem = await getAccessibleItemForUser(id, user.id);

  if (!accessibleItem) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const { data: item, error: readError } = await admin
    .from("shopping_items")
    .select("id, status")
    .eq("id", id)
    .single();

  if (readError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const nextStatus = item.status === "bought" ? "pending" : "bought";
  const checkedAt = nextStatus === "bought" ? new Date().toISOString() : null;
  const { error: updateError } = await admin
    .from("shopping_items")
    .update({
      status: nextStatus,
      checked_at: checkedAt
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ status: nextStatus, checkedAt });
}
