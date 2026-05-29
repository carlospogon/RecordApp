import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateListPayload = {
  id?: string;
  title?: string;
  shoppingDate?: string;
  reminderDate?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateListPayload;
  const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : crypto.randomUUID();
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Lista de compra";
  const shoppingDate = typeof body.shoppingDate === "string" ? body.shoppingDate.trim() : "";
  const reminderDate = typeof body.reminderDate === "string" && body.reminderDate.trim() ? body.reminderDate.trim() : null;

  if (!shoppingDate) {
    return NextResponse.json({ error: "Introduce una fecha valida para crear la lista." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({
      id,
      user_id: user.id,
      title,
      shopping_date: shoppingDate,
      reminder_date: reminderDate
    });

  if (error) {
    return NextResponse.json({ error: error?.message ?? "No se pudo crear la lista." }, { status: 500 });
  }

  return NextResponse.json({
    list: {
      id,
      title,
      shoppingDate,
      reminderDate,
      reminderSentAt: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      itemCount: 0
    }
  });
}
