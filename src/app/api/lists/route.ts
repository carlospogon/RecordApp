import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateListPayload = {
  title?: string;
  shoppingDate?: string;
  reminderDate?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateListPayload;
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

  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({
      user_id: user.id,
      title,
      shopping_date: shoppingDate,
      reminder_date: reminderDate
    })
    .select("id, title, shopping_date, reminder_date, reminder_sent_at, created_at, updated_at, completed_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "No se pudo crear la lista." }, { status: 500 });
  }

  return NextResponse.json({
    list: {
      id: data.id,
      title: data.title,
      shoppingDate: data.shopping_date,
      reminderDate: data.reminder_date,
      reminderSentAt: data.reminder_sent_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
      itemCount: 0
    }
  });
}
