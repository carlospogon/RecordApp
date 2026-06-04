import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateSpacePayload = {
  name?: string;
};

function buildShareCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateSpacePayload;
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Espacio compartido";
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let createdSpace:
    | {
        id: string;
        user_id: string;
        name: string;
        share_code: string;
        created_at: string;
        updated_at: string;
      }
    | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shareCode = buildShareCode();
    const { data, error } = await admin
      .from("shopping_spaces")
      .insert({
        user_id: user.id,
        name,
        share_code: shareCode
      })
      .select("id, user_id, name, share_code, created_at, updated_at")
      .single();

    if (!error && data) {
      createdSpace = data;
      break;
    }

    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (!createdSpace) {
    return NextResponse.json({ error: "No se pudo generar un código único para el espacio." }, { status: 500 });
  }

  return NextResponse.json({
    space: {
      id: createdSpace.id,
      ownerId: createdSpace.user_id,
      name: createdSpace.name,
      shareCode: createdSpace.share_code,
      accessRole: "owner",
      memberCount: 1,
      listCount: 0,
      createdAt: createdSpace.created_at,
      updatedAt: createdSpace.updated_at
    }
  });
}
