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
  password: z.string().trim().min(6),
  redirectPath: z.string().trim().optional()
});

function getSafeRedirectPath(value: string | undefined) {
  if (!value || !value.startsWith("/")) {
    return "/app";
  }

  return value;
}

export async function signInAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    redirectPath: formData.get("redirectPath") ?? ""
  });

  if (!parsed.success) {
    return { error: "Introduce un email válido y una contraseña de al menos 6 caracteres." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    return { error: error.message };
  }

  redirect(getSafeRedirectPath(parsed.data.redirectPath) as never);
}

export async function signUpAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    redirectPath: formData.get("redirectPath") ?? ""
  });

  if (!parsed.success) {
    return { error: "Introduce un email válido y una contraseña de al menos 6 caracteres." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect(getSafeRedirectPath(parsed.data.redirectPath) as never);
  }

  return {
    success: "Cuenta creada. Si tu proyecto requiere confirmación por email, revisa tu bandeja antes de iniciar sesión. Después vuelve a este acceso para abrir tu invitación."
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

export async function signInWithGoogleAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const redirectPath = getSafeRedirectPath(typeof formData.get("redirectPath") === "string" ? String(formData.get("redirectPath")) : "/app");
  const callbackUrl = new URL(await buildAuthCallbackUrl());
  callbackUrl.searchParams.set("next", redirectPath);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString()
    }
  });

  if (error) {
    redirect("/auth?error=google");
  }

  redirect(data.url as never);
}
