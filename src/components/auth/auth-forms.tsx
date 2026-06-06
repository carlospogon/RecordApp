"use client";

import { useActionState, useState } from "react";
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from "next/font/google";
import {
  signInAction,
  signInWithGoogleAction,
  signUpAction,
  type AuthActionState
} from "@/app/auth/actions";

const initialAuthActionState: AuthActionState = {};

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"]
});

const bodyFont = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${displayFont.className} rounded-full bg-[linear-gradient(180deg,#b97055_0%,#ab634a_100%)] px-6 py-4 text-base font-semibold text-white shadow-[0_16px_30px_rgba(134,77,53,0.18)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? "Procesando..." : label}
    </button>
  );
}

function AuthStateMessage({ state }: { state: AuthActionState }) {
  if (state.error) {
    return <p className="rounded-[20px] border border-[#e7c8be] bg-[rgba(255,244,240,0.92)] px-4 py-3 text-sm text-[#a45f4a]">{state.error}</p>;
  }

  if (state.success) {
    return <p className="rounded-[20px] border border-[#d8e2d7] bg-[rgba(246,243,238,0.92)] px-4 py-3 text-sm text-[#4f6a56]">{state.success}</p>;
  }

  return null;
}

export function AuthForms({
  initialMode = "signin",
  inviteCode = ""
}: {
  initialMode?: "signin" | "signup";
  inviteCode?: string;
}) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [signInState, signInFormAction, signInPending] = useActionState(signInAction, initialAuthActionState);
  const [signUpState, signUpFormAction, signUpPending] = useActionState(signUpAction, initialAuthActionState);
  const isSignIn = mode === "signin";
  const redirectPath = inviteCode ? `/app?invite=${encodeURIComponent(inviteCode)}` : "/app";

  return (
    <section className={`rounded-[32px] border border-white/60 bg-[rgba(255,255,255,0.82)] p-6 backdrop-blur-[22px] shadow-[0_30px_70px_rgba(74,97,80,0.10)] sm:p-8 ${bodyFont.className}`}>
      <div className="flex gap-2 rounded-full border border-[#ebe3d2] bg-[rgba(250,249,246,0.72)] p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            isSignIn ? "bg-[#4a6150] text-white shadow-[0_10px_20px_rgba(74,97,80,0.18)]" : "text-[#7c7567] hover:text-[#4a6150]"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            !isSignIn ? "bg-[#4a6150] text-white shadow-[0_10px_20px_rgba(74,97,80,0.18)]" : "text-[#7c7567] hover:text-[#4a6150]"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form action={isSignIn ? signInFormAction : signUpFormAction} className="mt-6 space-y-4">
        <input type="hidden" name="redirectPath" value={redirectPath} />
        <div className="space-y-2">
          <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d766e]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-[20px] border border-[#ece6da] bg-[rgba(250,249,246,0.92)] px-4 py-3 text-sm text-[#1a1c1a] outline-none transition focus:border-[#4a6150]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d766e]">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-[20px] border border-[#ece6da] bg-[rgba(250,249,246,0.92)] px-4 py-3 text-sm text-[#1a1c1a] outline-none transition focus:border-[#4a6150]"
          />
        </div>

        <AuthStateMessage state={isSignIn ? signInState : signUpState} />
        <SubmitButton pending={isSignIn ? signInPending : signUpPending} label={isSignIn ? "Entrar" : "Crear cuenta"} />
      </form>

      <div className="mt-6 border-t border-[#eee7db] pt-6">
        <form action={signInWithGoogleAction}>
          <input type="hidden" name="redirectPath" value={redirectPath} />
          <button
            type="submit"
            className={`${displayFont.className} w-full rounded-full border border-[#ebe3d2] bg-[rgba(255,255,255,0.88)] px-5 py-4 text-base font-semibold text-[#4f574f] transition hover:border-[#4a6150] hover:text-[#4a6150]`}
          >
            Continuar con Google
          </button>
        </form>
      </div>
    </section>
  );
}
