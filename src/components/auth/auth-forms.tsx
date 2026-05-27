"use client";

import { useActionState, useState } from "react";
import {
  signInAction,
  signInWithGoogleAction,
  signUpAction,
  type AuthActionState
} from "@/app/auth/actions";

const initialAuthActionState: AuthActionState = {};

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-lime px-5 py-3 text-sm font-semibold text-[#10150f] transition hover:bg-[#e2ff8f] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Procesando..." : label}
    </button>
  );
}

function AuthStateMessage({ state }: { state: AuthActionState }) {
  if (state.error) {
    return <p className="rounded-2xl border border-[#6b2323] bg-[#311515] px-4 py-3 text-sm text-[#ffb0b0]">{state.error}</p>;
  }

  if (state.success) {
    return <p className="rounded-2xl border border-[#2f6547] bg-[#163225] px-4 py-3 text-sm text-[#b7f4cf]">{state.success}</p>;
  }

  return null;
}

export function AuthForms() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInFormAction, signInPending] = useActionState(signInAction, initialAuthActionState);
  const [signUpState, signUpFormAction, signUpPending] = useActionState(signUpAction, initialAuthActionState);
  const isSignIn = mode === "signin";

  return (
    <section className="rounded-[30px] border border-white/10 bg-[#121b18] p-6">
      <div className="flex gap-2 rounded-full border border-white/10 bg-[#101816] p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${isSignIn ? "bg-lime text-[#10150f]" : "text-slate hover:text-white"}`}
        >
          Iniciar sesion
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${!isSignIn ? "bg-lime text-[#10150f]" : "text-slate hover:text-white"}`}
        >
          Crear cuenta
        </button>
      </div>

      <form action={isSignIn ? signInFormAction : signUpFormAction} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-2xl border border-white/10 bg-[#0f1714] px-4 py-3 text-sm text-white outline-none transition focus:border-lime"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
            Contrasena
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-2xl border border-white/10 bg-[#0f1714] px-4 py-3 text-sm text-white outline-none transition focus:border-lime"
          />
        </div>

        <AuthStateMessage state={isSignIn ? signInState : signUpState} />
        <SubmitButton pending={isSignIn ? signInPending : signUpPending} label={isSignIn ? "Entrar" : "Crear cuenta"} />
      </form>

      <div className="mt-6 border-t border-white/10 pt-6">
        <form action={signInWithGoogleAction}>
          <button
            type="submit"
            className="w-full rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-lime hover:text-lime"
          >
            Continuar con Google
          </button>
        </form>
      </div>
    </section>
  );
}
