"use client";

import { useActionState } from "react";
import { createListAction, type ActionState } from "@/app/app/actions";

const initialActionState: ActionState = {};

export function CreateListForm() {
  const [state, formAction, pending] = useActionState(createListAction, initialActionState);
  const defaultDate = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="grid gap-4 rounded-[26px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Nueva lista</p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Prepara una compra nueva</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Crea una lista con fecha para separar compras semanales, reposiciones rapidas o visitas al mercado.
        </p>
      </div>

      <div className="grid gap-3">
        <input
          type="text"
          name="title"
          placeholder="Compra semanal, fruteria, hogar..."
          className="rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
        />
        <input
          type="date"
          name="shoppingDate"
          defaultValue={defaultDate}
          required
          className="rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
        />
      </div>

      {state.error ? <p className="rounded-2xl bg-[#fff1f1] px-4 py-3 text-sm text-[#b44d4d]">{state.error}</p> : null}
      {state.success ? <p className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creando..." : "Crear y abrir"}
      </button>
    </form>
  );
}
