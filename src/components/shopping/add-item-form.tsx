"use client";

import { useMemo, useState, useTransition } from "react";
import { inferCategoryFromNormalizedName } from "@/lib/shopping/product-category-inference";
import { normalizeProductName } from "@/lib/shopping/normalize-product";
import { ProductCatalogItem, ShoppingDuplicateNotice, ShoppingItem } from "@/types/shopping";

type AddItemFormProps = {
  listId: string;
  catalogProducts: ProductCatalogItem[];
  onItemCreated?: (item: ShoppingItem) => void;
  onOptimisticItemCreated?: (item: ShoppingItem) => void;
  onItemDeleted?: (itemId: string) => void;
};

type CreateItemResponse = {
  item: ShoppingItem;
};

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

export function AddItemForm({ listId, catalogProducts, onItemCreated, onOptimisticItemCreated, onItemDeleted }: AddItemFormProps) {
  const [pending, startTransition] = useTransition();
  const availableProducts = useMemo(() => catalogProducts.filter((product) => product.active !== false), [catalogProducts]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<ShoppingDuplicateNotice | null>(null);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  const normalizedInput = useMemo(() => normalizeProductName(name), [name]);
  const selectedProduct = useMemo(() => availableProducts.find((product) => product.normalizedName === normalizedInput), [availableProducts, normalizedInput]);
  const filteredSuggestions = useMemo(() => {
    if (!normalizedInput) {
      return availableProducts.slice(0, 6);
    }

    return availableProducts
      .filter((product) => product.normalizedName.includes(normalizedInput) || normalizeProductName(product.name).includes(normalizedInput))
      .slice(0, 6);
  }, [availableProducts, normalizedInput]);
  const inferredSection = useMemo(() => {
    if (selectedProduct?.category && selectedProduct.category !== "otros") {
      return selectedProduct.category;
    }

    return normalizedInput ? inferCategoryFromNormalizedName(normalizedInput) : null;
  }, [normalizedInput, selectedProduct]);
  const listReady = !listId.startsWith("temp-list-");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!listReady) {
      setError("La lista se está preparando todavía. Espera un instante.");
      return;
    }

    const itemId = crypto.randomUUID();
    const optimisticItem: ShoppingItem = {
      id: itemId,
      listId,
      name,
      normalizedName: selectedProduct?.normalizedName ?? normalizedInput,
      quantity: quantity || null,
      unit: unit || selectedProduct?.defaultUnit || null,
      section: inferredSection ?? "otros",
      notes: notes || null,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checkedAt: null
    };

    onOptimisticItemCreated?.(optimisticItem);
    setName("");
    setQuantity("");
    setUnit("");
    setNotes("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: itemId,
            listId,
            productId: selectedProduct?.id ?? "",
            name,
            quantity,
            unit: unit || selectedProduct?.defaultUnit || "",
            notes
          })
        });

        const payload = (await response.json()) as Partial<CreateItemResponse> & { error?: string };

        if (!response.ok || !payload.item) {
          throw new Error(payload.error || "No se pudo guardar el producto.");
        }

        onItemCreated?.(payload.item);
        setCreatedItemId(payload.item.id);
        setSuccess("Producto añadido.");

        fetch(`/api/items/duplicate?name=${encodeURIComponent(payload.item.name)}`)
          .then((duplicateResponse) => (duplicateResponse.ok ? duplicateResponse.json() : null))
          .then((duplicatePayload) => {
            if (duplicatePayload?.duplicateNotice) {
              setDuplicateNotice(duplicatePayload.duplicateNotice as ShoppingDuplicateNotice);
            } else {
              setDuplicateNotice(null);
            }
          })
          .catch(() => {
            setDuplicateNotice(null);
          });
      } catch (submitError) {
        onItemDeleted?.(itemId);
        setError(submitError instanceof Error ? submitError.message : "No se pudo guardar el producto.");
      }
    });
  }

  async function handleDeleteFreshItem() {
    if (!createdItemId) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/items/${createdItemId}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          throw new Error("No se pudo eliminar el producto.");
        }

        onItemDeleted?.(createdItemId);
        setCreatedItemId(null);
        setDuplicateNotice(null);
        setSuccess("Producto eliminado.");
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el producto.");
      }
    });
  }

  return (
    <div className="grid gap-4 rounded-[26px] border border-[var(--border)] bg-[rgba(250,249,246,0.9)] p-5">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Añadir producto</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Rellena la lista activa</h3>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[0_10px_24px_rgba(18,40,28,0.05)]">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              placeholder="Huevos, patatas, arroz..."
              required
              className="w-full border-0 bg-transparent px-1 py-2 text-lg font-medium text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {selectedProduct ? (
                <>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                    Producto del catálogo
                  </span>
                  {inferredSection ? (
                    <span className="rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-semibold capitalize text-[var(--muted)]">
                      {inferredSection}
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
                  Producto nuevo: se guardará en tu catálogo
                </span>
              ) : (
                <span className="rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                  {availableProducts.length} productos sugeridos
                </span>
              )}
              {inferredSection ? (
                <span className="rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-semibold capitalize text-[var(--muted)]">
                  Categoría automática: {inferredSection}
                </span>
              ) : null}
            </div>

            {filteredSuggestions.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {filteredSuggestions.map((product) => (
                  <button
                    key={product.normalizedName}
                    type="button"
                    onClick={() => {
                      setName(product.name);
                      if (product.defaultUnit) {
                        setUnit((current) => current || product.defaultUnit || "");
                      }
                    }}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent)] hover:bg-white"
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={quantity}
              onChange={(event) => setQuantity(event.currentTarget.value)}
              placeholder="Cantidad"
              className="rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
            />
            <input
              type="text"
              value={unit}
              onChange={(event) => setUnit(event.currentTarget.value)}
              placeholder="Unidad"
              className="rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
            />
          </div>
          <div className="grid gap-3">
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.currentTarget.value)}
              placeholder="Nota rápida: marca, sin gluten, pasillo..."
              maxLength={240}
              className="rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {error ? <p className="rounded-2xl bg-[#fff1f1] px-4 py-3 text-sm text-[#b44d4d]">{error}</p> : null}
        {success ? <p className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">{success}</p> : null}

        <button
          type="submit"
          disabled={pending || !listReady}
          className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {!listReady ? "Preparando lista..." : pending ? "Añadiendo..." : "Guardar producto"}
        </button>
      </form>

      {duplicateNotice ? (
        <div className="rounded-[22px] border border-[#f2d57e] bg-[#fff7dd] px-4 py-4 text-sm leading-6 text-[#7c6320]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-[#5a4714]">Ya lo habías comprado antes</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7c6320]">
              {duplicateNotice.appearances} veces
            </span>
          </div>
          <p className="mt-2">{duplicateNotice.message}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/80 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c7440]">Última aparición</p>
              <p className="mt-1 font-medium text-[#5a4714]">{formatDate(duplicateNotice.lastSeenAt)}</p>
            </div>
            <div className="rounded-2xl bg-white/80 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c7440]">Contexto</p>
              <p className="mt-1 font-medium text-[#5a4714]">{duplicateNotice.lastListTitle || "Lista anterior"}</p>
              <p className="mt-1 text-xs text-[#7c6320]">
                {duplicateNotice.lastQuantity ? `${duplicateNotice.lastQuantity} ` : ""}
                {duplicateNotice.lastUnit || ""}
                {duplicateNotice.lastStatus === "bought" ? " - marcado como comprado" : ""}
              </p>
            </div>
          </div>
          {createdItemId ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleDeleteFreshItem}
                disabled={pending}
                className="rounded-full border border-[#e0a7a7] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#b44d4d] transition hover:bg-[#fff4f4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Eliminar producto recién añadido
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
