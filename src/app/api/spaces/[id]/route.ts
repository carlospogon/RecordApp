import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: space, error: spaceError } = await supabase
    .from("shopping_spaces")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (spaceError || !space?.id) {
    return NextResponse.json({ error: "No se ha encontrado el espacio." }, { status: 404 });
  }

  if (space.user_id !== user.id) {
    return NextResponse.json({ error: "Solo el owner puede eliminar este espacio." }, { status: 403 });
  }

  const { error } = await supabase.from("shopping_spaces").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
