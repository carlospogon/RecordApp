"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { updateItemAction, type ActionState } from "@/app/app/actions";
import { ShoppingItem } from "@/types/shopping";

const initialActionState: ActionState = {};

function formatDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

async function deleteItemById(itemId: string) {
  const response = await fetch(`/api/items/${itemId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("No se pudo eliminar el producto.");
  }
}

async function toggleItemById(itemId: string) {
  const response = await fetch(`/api/items/${itemId}/toggle`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar el estado.");
  }

  return (await response.json()) as { status: ShoppingItem["status"]; checkedAt: string | null };
}

function EditItemForm({ item }: { item: ShoppingItem }) {
  const [state, formAction, pending] = useActionState(updateItemAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-3 rounded-[20px] border border-[var(--border)] bg-white p-4">
      <input type="hidden" name="itemId" value={item.id} />
      <input
        type="text"
        name="name"
        defaultValue={item.name}
        required
        className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          name="quantity"
          defaultValue={item.quantity ?? ""}
          placeholder="Cantidad"
          className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
        />
        <input
          type="text"
          name="unit"
          defaultValue={item.unit ?? ""}
          placeholder="Unidad"
          className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
        />
      </div>
      {state.error ? <p className="text-sm text-[#b44d4d]">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="justify-self-start rounded-full bg-[var(--surface-strong)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#1d3028] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

function ItemStatusPill({ status }: { status: ShoppingItem["status"] }) {
  const bought = status === "bought";

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
        bought ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "bg-[#f1f4ef] text-[var(--muted)]"
      }`}
    >
      {bought ? "Comprado" : "Pendiente"}
    </span>
  );
}

function ToggleItemCheckbox({
  itemId,
  checked,
  checkedAt,
  onToggle
}: {
  itemId: string;
  checked: boolean;
  checkedAt?: string | null;
  onToggle: (itemId: string, nextStatus: ShoppingItem["status"], nextCheckedAt: string | null) => void;
}) {
  const [optimisticChecked, setOptimisticChecked] = useState(checked);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setOptimisticChecked(checked);
  }, [checked]);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={optimisticChecked}
      aria-label={optimisticChecked ? "Marcar como pendiente" : "Marcar como comprado"}
      disabled={pending}
      onClick={() => {
        const nextChecked = !optimisticChecked;
        setOptimisticChecked(nextChecked);

        startTransition(async () => {
          try {
            const result = await toggleItemById(itemId);
            onToggle(itemId, result.status, result.checkedAt ?? checkedAt ?? null);
          } catch {
            setOptimisticChecked(!nextChecked);
          }
        });
      }}
      className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full border transition disabled:opacity-60 ${
        optimisticChecked
          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent-strong)]"
          : "border-[var(--border)] bg-white text-transparent hover:border-[var(--accent)]/40"
      }`}
    >
      <span
        className={`h-3 w-3 rounded-full transition ${
          optimisticChecked ? "bg-[var(--accent)] shadow-[0_0_0_3px_rgba(15,143,90,0.12)]" : "bg-[#d9e3db]"
        }`}
      />
    </button>
  );
}

function DeleteItemButton({ itemId, onDelete }: { itemId: string; onDelete: (itemId: string) => void }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await deleteItemById(itemId);
          onDelete(itemId);
        });
      }}
      className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#b44d4d] transition hover:border-[#e0a7a7] hover:bg-[#fff4f4] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}

function ItemCard({
  item,
  onDelete,
  onToggle
}: {
  item: ShoppingItem;
  onDelete: (itemId: string) => void;
  onToggle: (itemId: string, nextStatus: ShoppingItem["status"], nextCheckedAt: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const bought = item.status === "bought";
  const checkedLabel = formatDateTime(item.checkedAt);

  return (
    <article
      className={`rounded-[24px] border p-4 shadow-[0_10px_24px_rgba(12,28,22,0.06)] transition ${
        bought ? "border-[var(--accent)]/20 bg-[#f6fcf8]" : "border-[var(--border)] bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <ToggleItemCheckbox itemId={item.id} checked={bought} checkedAt={item.checkedAt} onToggle={onToggle} />
          <div className="min-w-0">
            <p className={`truncate text-base font-semibold ${bought ? "text-[var(--muted)] line-through" : "text-[var(--text)]"}`}>
              {item.name}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {item.quantity ? `${item.quantity} ` : ""}
              {item.unit ?? "Sin unidad"}
            </p>
            {checkedLabel ? (
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                Marcado el {checkedLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ItemStatusPill status={item.status} />
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
          >
            {editing ? "Cerrar" : "Editar"}
          </button>
          <DeleteItemButton itemId={item.id} onDelete={onDelete} />
        </div>
      </div>

      {editing ? (
        <div className="mt-4">
          <EditItemForm item={item} />
        </div>
      ) : null}
    </article>
  );
}

export function ItemsList({
  items,
  onDelete,
  onToggle
}: {
  items: ShoppingItem[];
  onDelete: (itemId: string) => void;
  onToggle: (itemId: string, nextStatus: ShoppingItem["status"], nextCheckedAt: string | null) => void;
}) {
  if (items.length === 0) {
    return (
      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-soft)] p-6">
        <p className="text-lg font-semibold text-[var(--text)]">Todavia no hay productos en esta lista.</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Empieza anadiendo un producto para activar memoria historica, frecuencia de compra y recordatorios.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Lista de compra</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text)]">Productos activos</h2>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--text)]">{items.length} productos</span>
      </div>

        <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onDelete={onDelete} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}
