"use client";

import { useActionState, useMemo, useState } from "react";
import { createItemAction, deleteItemAction, type ActionState } from "@/app/app/actions";
import { ProductCatalogItem } from "@/types/shopping";

const initialActionState: ActionState = {};

function formatDate(value?: string) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function AddItemForm({
  listId,
  catalogProducts
}: {
  listId: string;
  catalogProducts: ProductCatalogItem[];
}) {
  const [state, formAction, pending] = useActionState(createItemAction, initialActionState);
  const availableProducts = useMemo(() => catalogProducts.filter((product) => product.active !== false), [catalogProducts]);
  const [name, setName] = useState("");
  const selectedProduct = useMemo(
    () => availableProducts.find((product) => product.name.toLowerCase() === name.trim().toLowerCase()),
    [availableProducts, name]
  );

  return (
    <div className="grid gap-4 rounded-[26px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="listId" value={listId} />
        <input type="hidden" name="productId" value={selectedProduct?.id ?? ""} />

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Anadir producto</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Rellena la lista activa</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Busca primero en tu catalogo de productos. Si no existe, lo guardaremos para reutilizarlo y mejorar futuras sugerencias.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[22px] border border-[var(--border)] bg-white p-3">
            <input
              type="text"
              name="name"
              list="recordapp-product-catalog"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              placeholder="Huevos, patatas, arroz..."
              required
              className="w-full border-0 bg-transparent px-1 py-2 text-sm text-[var(--text)] outline-none"
            />
            <datalist id="recordapp-product-catalog">
              {availableProducts.map((product) => (
                <option key={product.normalizedName} value={product.name} />
              ))}
            </datalist>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {selectedProduct ? (
                <>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                    Producto del catalogo
                  </span>
                  {selectedProduct.category ? (
                    <span className="rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-semibold capitalize text-[var(--muted)]">
                      {selectedProduct.category}
                    </span>
                  ) : null}
                  {selectedProduct.defaultUnit ? (
                    <span className="rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                      Unidad sugerida: {selectedProduct.defaultUnit}
                    </span>
                  ) : null}
                </>
              ) : name.trim() ? (
                <span className="rounded-full bg-[#fff7dd] px-3 py-1 text-xs font-semibold text-[#7c6320]">
                  Producto nuevo: se guardara en tu catalogo
                </span>
              ) : (
                <span className="rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                  {availableProducts.length} productos sugeridos
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="quantity"
              placeholder="Cantidad"
              className="rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
            />
            <input
              type="text"
              name="unit"
              defaultValue={selectedProduct?.defaultUnit ?? ""}
              placeholder="Unidad"
              className="rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {state.error ? <p className="rounded-2xl bg-[#fff1f1] px-4 py-3 text-sm text-[#b44d4d]">{state.error}</p> : null}
        {state.success ? <p className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">{state.success}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Anadiendo..." : "Guardar producto"}
        </button>
      </form>

      {state.duplicateNotice ? (
        <div className="rounded-[22px] border border-[#f2d57e] bg-[#fff7dd] px-4 py-4 text-sm leading-6 text-[#7c6320]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-[#5a4714]">Ya lo habias comprado antes</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7c6320]">
              {state.duplicateNotice.appearances} veces
            </span>
          </div>
          <p className="mt-2">{state.duplicateNotice.message}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/80 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c7440]">Ultima aparicion</p>
              <p className="mt-1 font-medium text-[#5a4714]">{formatDate(state.duplicateNotice.lastSeenAt)}</p>
            </div>
            <div className="rounded-2xl bg-white/80 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c7440]">Contexto</p>
              <p className="mt-1 font-medium text-[#5a4714]">{state.duplicateNotice.lastListTitle || "Lista anterior"}</p>
              <p className="mt-1 text-xs text-[#7c6320]">
                {state.duplicateNotice.lastQuantity ? `${state.duplicateNotice.lastQuantity} ` : ""}
                {state.duplicateNotice.lastUnit || ""}
                {state.duplicateNotice.lastStatus === "bought" ? " - marcado como comprado" : ""}
              </p>
            </div>
          </div>
          {state.createdItemId ? (
            <div className="mt-4">
              <form action={deleteItemAction}>
                <input type="hidden" name="itemId" value={state.createdItemId} />
                <button
                  type="submit"
                  className="rounded-full border border-[#e0a7a7] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#b44d4d] transition hover:bg-[#fff4f4]"
                >
                  Eliminar producto recien anadido
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
