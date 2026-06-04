"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { updateItemAction, type ActionState } from "@/app/app/actions";
import { ShoppingItem } from "@/types/shopping";

const initialActionState: ActionState = {};
const sectionLabels: Record<string, string> = {
  fruta: "Fruta",
  verdura: "Verdura",
  lacteos: "Lácteos",
  huevos: "Huevos",
  panaderia: "Panadería",
  carne: "Carne",
  pescado: "Pescado",
  despensa: "Despensa",
  bebidas: "Bebidas",
  hogar: "Hogar",
  otros: "Otros"
};

function groupItemsBySection(items: ShoppingItem[]) {
  return Object.entries(
    items.reduce<Record<string, ShoppingItem[]>>((groups, item) => {
      const key = item.section ?? "otros";
      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(item);
      return groups;
    }, {})
  ).sort(([sectionA], [sectionB]) => {
    if (sectionA === "otros") {
      return 1;
    }

    if (sectionB === "otros") {
      return -1;
    }

    return (sectionLabels[sectionA] ?? sectionA).localeCompare(sectionLabels[sectionB] ?? sectionB, "es");
  });
}

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
      <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
        <select
          name="section"
          defaultValue={item.section ?? "otros"}
          className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
        >
          {Object.entries(sectionLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="notes"
          defaultValue={item.notes ?? ""}
          placeholder="Nota del producto"
          maxLength={240}
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
        const nextStatus: ShoppingItem["status"] = nextChecked ? "bought" : "pending";
        const nextCheckedAt = nextChecked ? new Date().toISOString() : null;
        setOptimisticChecked(nextChecked);
        onToggle(itemId, nextStatus, nextCheckedAt);

        startTransition(async () => {
          try {
            const result = await toggleItemById(itemId);
            onToggle(itemId, result.status, result.checkedAt ?? checkedAt ?? null);
          } catch {
            setOptimisticChecked(!nextChecked);
            onToggle(itemId, checked ? "bought" : "pending", checkedAt ?? null);
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

function PurchaseModeRow({
  item,
  onToggle
}: {
  item: ShoppingItem;
  onToggle: (itemId: string, nextStatus: ShoppingItem["status"], nextCheckedAt: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const bought = item.status === "bought";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const nextStatus: ShoppingItem["status"] = bought ? "pending" : "bought";
        const nextCheckedAt = nextStatus === "bought" ? new Date().toISOString() : null;
        onToggle(item.id, nextStatus, nextCheckedAt);

        startTransition(async () => {
          try {
            const result = await toggleItemById(item.id);
            onToggle(item.id, result.status, result.checkedAt ?? null);
          } catch {
            onToggle(item.id, item.status, item.checkedAt ?? null);
          }
        });
      }}
      className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[22px] border px-4 py-4 text-left transition ${
        bought
          ? "border-[rgba(112,150,130,0.24)] bg-[rgba(112,150,130,0.12)]"
          : "border-[rgba(112,150,130,0.14)] bg-white hover:border-[var(--accent)] hover:bg-[rgba(242,232,213,0.42)]"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full border text-lg font-semibold transition ${
          bought
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[rgba(112,150,130,0.2)] bg-[var(--surface-soft)] text-[var(--accent-strong)]"
        }`}
      >
        {bought ? "✓" : "○"}
      </div>
      <div className="min-w-0">
        <p className={`truncate text-base font-semibold ${bought ? "text-[var(--muted)] line-through" : "text-[var(--text)]"}`}>{item.name}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {item.quantity ? `${item.quantity} ` : ""}
          {item.unit ?? "Sin unidad"}
        </p>
        {item.notes ? <p className="mt-1 text-xs font-medium text-[#94644f]">{item.notes}</p> : null}
      </div>
      <span
        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
          bought ? "bg-white text-[var(--accent-strong)]" : "bg-[var(--surface-soft)] text-[var(--accent-strong)]"
        }`}
      >
        {bought ? "Comprado" : "Pendiente"}
      </span>
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                {sectionLabels[item.section ?? "otros"] ?? "Otros"}
              </span>
              {item.notes ? (
                <span className="rounded-full bg-[#fbf4ec] px-3 py-1 text-xs font-medium text-[#94644f]">{item.notes}</span>
              ) : null}
            </div>
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
  const [viewMode, setViewMode] = useState<"organizada" | "compra">("organizada");
  const [showBoughtInPurchaseMode, setShowBoughtInPurchaseMode] = useState(true);

  if (items.length === 0) {
    return (
      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-soft)] p-6">
        <p className="text-lg font-semibold text-[var(--text)]">Todavía no hay productos en esta lista.</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Empieza añadiendo un producto para activar memoria histórica, frecuencia de compra y recordatorios.
        </p>
      </section>
    );
  }

  const groupedItems = groupItemsBySection(items);
  const pendingCount = items.filter((item) => item.status === "pending").length;
  const boughtCount = items.length - pendingCount;
  const purchaseSections = groupedItems
    .map(([section, sectionItems]) => [
      section,
      sectionItems.filter((item) => (showBoughtInPurchaseMode ? true : item.status === "pending"))
    ] as const)
    .filter(([, sectionItems]) => sectionItems.length > 0);

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Lista de compra</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text)]">
            {viewMode === "organizada" ? "Productos activos" : "Modo compra"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--text)]">{items.length} productos</span>
          <div className="inline-flex rounded-full border border-[var(--border)] bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode("organizada")}
              className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                viewMode === "organizada" ? "bg-[var(--surface-strong)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-soft)]"
              }`}
            >
              Organizada
            </button>
            <button
              type="button"
              onClick={() => setViewMode("compra")}
              className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                viewMode === "compra" ? "bg-[var(--surface-strong)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-soft)]"
              }`}
            >
              Modo compra
            </button>
          </div>
        </div>
      </div>

      {viewMode === "compra" ? (
        <div className="mt-5 grid gap-5">
          <section className="grid gap-3 rounded-[24px] border border-[rgba(112,150,130,0.18)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="grid grid-cols-3 gap-3">
              <article className="rounded-[20px] bg-[var(--surface-soft)] px-3 py-3 text-center">
                <p className="text-2xl font-semibold text-[var(--text)]">{pendingCount}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Pendientes</p>
              </article>
              <article className="rounded-[20px] bg-white px-3 py-3 text-center">
                <p className="text-2xl font-semibold text-[var(--accent-strong)]">{boughtCount}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Comprados</p>
              </article>
              <article className="rounded-[20px] bg-[#fbf4ec] px-3 py-3 text-center">
                <p className="text-2xl font-semibold text-[#94644f]">{purchaseSections.length}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Secciones</p>
              </article>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Vista rápida para supermercado</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Toca una fila para marcarla al instante.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBoughtInPurchaseMode((current) => !current)}
                className="rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)] transition hover:bg-[var(--surface-soft)]"
              >
                {showBoughtInPurchaseMode ? "Ocultar comprados" : "Mostrar comprados"}
              </button>
            </div>
          </section>

          {purchaseSections.map(([section, sectionItems]) => (
            <section key={section} className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Recorrido</p>
                  <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">{sectionLabels[section] ?? "Otros"}</h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                  {sectionItems.length} productos
                </span>
              </div>
              <div className="grid gap-3">
                {sectionItems
                  .slice()
                  .sort((itemA, itemB) => {
                    if (itemA.status === itemB.status) {
                      return itemA.name.localeCompare(itemB.name, "es");
                    }

                    return itemA.status === "pending" ? -1 : 1;
                  })
                  .map((item) => (
                    <PurchaseModeRow key={item.id} item={item} onToggle={onToggle} />
                  ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-5">
          {groupedItems.map(([section, sectionItems]) => (
            <section key={section} className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Sección</p>
                  <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">{sectionLabels[section] ?? "Otros"}</h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                  {sectionItems.length} productos
                </span>
              </div>
              <div className="grid gap-4">
                {sectionItems
                  .slice()
                  .sort((itemA, itemB) => {
                    if (itemA.status === itemB.status) {
                      return itemA.name.localeCompare(itemB.name, "es");
                    }

                    return itemA.status === "pending" ? -1 : 1;
                  })
                  .map((item) => (
                    <ItemCard key={item.id} item={item} onDelete={onDelete} onToggle={onToggle} />
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
