import webpush from "web-push";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushPayload = {
  title: string;
  body: string;
  url: string;
};

let vapidConfigured = false;

function ensureVapidConfiguration() {
  if (vapidConfigured) {
    return true;
  }

  if (!env.VAPID_PRIVATE_KEY || !env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_SUBJECT) {
    return false;
  }

  webpush.setVapidDetails(env.VAPID_SUBJECT, env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  vapidConfigured = true;
  return true;
}

export async function sendPushNotificationToUsers(userIds: string[], payload: PushPayload) {
  if (userIds.length === 0 || !ensureVapidConfiguration()) {
    return { sent: 0 };
  }

  const uniqueUserIds = [...new Set(userIds)];
  const supabase = createSupabaseAdminClient();
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", uniqueUserIds);

  if (error || !subscriptions || subscriptions.length === 0) {
    return { sent: 0 };
  }

  let sent = 0;

  for (const subscription of subscriptions as PushSubscriptionRow[]) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        },
        JSON.stringify(payload)
      );
      sent += 1;
    } catch (error) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : null;

      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
      }
    }
  }

  return { sent };
}
