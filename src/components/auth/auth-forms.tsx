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
      className="rounded-full bg-[linear-gradient(180deg,#11814f_0%,#0c6c42_100%)] px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Procesando..." : label}
    </button>
  );
}

function AuthStateMessage({ state }: { state: AuthActionState }) {
  if (state.error) {
    return <p className="rounded-2xl border border-[#e9b1b1] bg-[#fff3f3] px-4 py-3 text-sm text-[#b44d4d]">{state.error}</p>;
  }

  if (state.success) {
    return <p className="rounded-2xl border border-[#cfe7d8] bg-[#eff8f2] px-4 py-3 text-sm text-[#1e6d45]">{state.success}</p>;
  }

  return null;
}

export function AuthForms({ initialMode = "signin" }: { initialMode?: "signin" | "signup" }) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [signInState, signInFormAction, signInPending] = useActionState(signInAction, initialAuthActionState);
  const [signUpState, signUpFormAction, signUpPending] = useActionState(signUpAction, initialAuthActionState);
  const isSignIn = mode === "signin";

  return (
    <section className="rounded-[30px] border border-[#d7e7db] bg-white/92 p-6 shadow-[0_24px_50px_rgba(23,54,38,0.08)]">
      <div className="flex gap-2 rounded-full border border-[#d7e7db] bg-[#f7fbf8] p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            isSignIn ? "bg-[#dbff5e] text-[#13261f]" : "text-[#6f8d7d] hover:text-[#173025]"
          }`}
        >
          Iniciar sesion
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            !isSignIn ? "bg-[#dbff5e] text-[#13261f]" : "text-[#6f8d7d] hover:text-[#173025]"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form action={isSignIn ? signInFormAction : signUpFormAction} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f8d7d]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-2xl border border-[#d7e7db] bg-[#f9fcfa] px-4 py-3 text-sm text-[#173025] outline-none transition focus:border-[#1d8f59]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f8d7d]">
            Contrasena
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-2xl border border-[#d7e7db] bg-[#f9fcfa] px-4 py-3 text-sm text-[#173025] outline-none transition focus:border-[#1d8f59]"
          />
        </div>

        <AuthStateMessage state={isSignIn ? signInState : signUpState} />
        <SubmitButton pending={isSignIn ? signInPending : signUpPending} label={isSignIn ? "Entrar" : "Crear cuenta"} />
      </form>

      <div className="mt-6 border-t border-[#e1ece4] pt-6">
        <form action={signInWithGoogleAction}>
          <button
            type="submit"
            className="w-full rounded-full border border-[#d7e7db] bg-white px-5 py-3 text-sm font-semibold text-[#173025] transition hover:border-[#1d8f59] hover:text-[#1d8f59]"
          >
            Continuar con Google
          </button>
        </form>
      </div>
    </section>
  );
}
