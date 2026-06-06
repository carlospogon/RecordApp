import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const nextPath = requestUrl.searchParams.get("next");
  const redirectTo = new URL(nextPath && nextPath.startsWith("/") ? nextPath : "/app", requestUrl.origin);

  if (errorDescription) {
    redirectTo.pathname = "/auth";
    redirectTo.searchParams.set("error", "google");
    return NextResponse.redirect(redirectTo);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(redirectTo);
}
