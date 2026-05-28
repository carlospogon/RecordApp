import { NextResponse } from "next/server";
import webpush from "web-push";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DueListRow = {
  id: string;
  user_id: string;
  title: string;
  shopping_date: string;
  reminder_date: string;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function GET(request: Request) {
  if (env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!env.VAPID_PRIVATE_KEY || !env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_SUBJECT) {
    return NextResponse.json({ error: "Missing VAPID configuration" }, { status: 500 });
  }

  webpush.setVapidDetails(env.VAPID_SUBJECT, env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

  const supabase = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: dueLists, error } = await supabase
    .from("shopping_lists")
    .select("id, user_id, title, shopping_date, reminder_date")
    .lte("reminder_date", today)
    .is("reminder_sent_at", null)
    .is("completed_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const list of (dueLists ?? []) as DueListRow[]) {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", list.user_id);

    let delivered = false;

    for (const subscription of (subscriptions ?? []) as PushSubscriptionRow[]) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          JSON.stringify({
            title: "RecordApp",
            body: `Recuerda que tienes una lista de la compra pendiente para ${list.shopping_date}.`,
            url: `/app?list=${list.id}&tab=sugerencias`
          })
        );
        delivered = true;
      } catch {
        // Ignore individual subscription failures in MVP.
      }
    }

    if (delivered) {
      await supabase
        .from("shopping_lists")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", list.id);
      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
