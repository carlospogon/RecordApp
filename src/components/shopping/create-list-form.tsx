"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ShoppingList } from "@/types/shopping";

type CreateListFormProps = {
  onOptimisticListCreated?: (list: ShoppingList) => void;
  onListCreated?: (list: ShoppingList, tempId?: string) => void;
  onListCreationFailed?: (tempId: string) => void;
};

export function CreateListForm({ onOptimisticListCreated, onListCreated, onListCreationFailed }: CreateListFormProps) {
  const [pending, startTransition] = useTransition();
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [shoppingDate, setShoppingDate] = useState(defaultDate);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const showReminderDate = useMemo(() => shoppingDate > defaultDate, [shoppingDate, defaultDate]);
  const defaultReminderDate = useMemo(() => (showReminderDate ? shoppingDate : ""), [showReminderDate, shoppingDate]);
  const [reminderDate, setReminderDate] = useState(defaultReminderDate);

  useEffect(() => {
    setReminderDate(defaultReminderDate);
  }, [defaultReminderDate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const tempId = `temp-list-${Date.now()}`;
    const now = new Date().toISOString();
    const nextReminderDate = showReminderDate ? reminderDate || shoppingDate : null;
    const optimisticList: ShoppingList = {
      id: tempId,
      title: title.trim() || "Lista de compra",
      shoppingDate,
      reminderDate: nextReminderDate,
      reminderSentAt: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      itemCount: 0
    };

    onOptimisticListCreated?.(optimisticList);
    setTitle("");
    setSuccess("Preparando lista...");

    startTransition(async () => {
      try {
        const response = await fetch("/api/lists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title,
            shoppingDate,
            reminderDate: showReminderDate ? reminderDate || shoppingDate : ""
          })
        });

        const payload = (await response.json()) as { list?: ShoppingList; error?: string };

        if (!response.ok || !payload.list) {
          throw new Error(payload.error || "No se pudo crear la lista.");
        }

        setSuccess("Lista creada.");
        onListCreated?.(payload.list, tempId);
      } catch (submitError) {
        onListCreationFailed?.(tempId);
        setError(submitError instanceof Error ? submitError.message : "No se pudo crear la lista.");
        setSuccess(null);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-[26px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
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
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          placeholder="Compra semanal, fruteria, hogar..."
          className="rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
        />
        <input
          type="date"
          name="shoppingDate"
          value={shoppingDate}
          onChange={(event) => setShoppingDate(event.currentTarget.value)}
          required
          className="rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
        />
        {showReminderDate ? (
          <div className="grid gap-2 rounded-[18px] border border-[var(--border)] bg-white px-4 py-4">
            <p className="text-sm font-semibold text-[var(--text)]">Para cuando quieres que te recuerde esta lista?</p>
            <input
              type="date"
              name="reminderDate"
              min={defaultDate}
              max={shoppingDate}
              value={reminderDate || defaultReminderDate}
              onChange={(event) => setReminderDate(event.currentTarget.value)}
              className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
            />
          </div>
        ) : null}
      </div>

      {error ? <p className="rounded-2xl bg-[#fff1f1] px-4 py-3 text-sm text-[#b44d4d]">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">{success}</p> : null}

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
