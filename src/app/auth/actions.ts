"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
};

const authSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(6)
});

export async function signInAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? ""
  });

  if (!parsed.success) {
    return { error: "Introduce un email valido y una contrasena de al menos 6 caracteres." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  redirect("/app");
}

export async function signUpAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? ""
  });

  if (!parsed.success) {
    return { error: "Introduce un email valido y una contrasena de al menos 6 caracteres." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return { error: error.message };
  }

  return {
    success: "Cuenta creada. Si tu proyecto requiere confirmacion por email, revisa tu bandeja antes de iniciar sesion."
  };
}

async function buildAuthCallbackUrl() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = headerStore.get("host");

  if (origin) {
    return `${origin}/auth/callback`;
  }

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}/auth/callback`;
  }

  if (host) {
    return `http://${host}/auth/callback`;
  }

  return "http://localhost:3000/auth/callback";
}

export async function signInWithGoogleAction() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: await buildAuthCallbackUrl()
    }
  });

  if (error) {
    redirect("/auth?error=google");
  }

  redirect(data.url as never);
}
