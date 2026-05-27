"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { quickAddReminderItemAction, updateCatalogProductAction, type ActionState } from "@/app/app/actions";
import { getProductVisual } from "@/lib/shopping/product-visuals";
import { getCategoryEstimateDays, getCategoryEstimateLabel } from "@/lib/shopping/product-insights";
import { buildSmartSuggestion } from "@/lib/shopping/smart-recommendations";
import { ProductCatalogItem, ProductCategory, ProductInsight, ReminderSuggestion, ShoppingItem, ShoppingList } from "@/types/shopping";

const initialActionState: ActionState = {};
const productCategories: ProductCategory[] = [
  "fruta",
  "verdura",
  "lacteos",
  "huevos",
  "panaderia",
  "carne",
  "pescado",
  "despensa",
  "bebidas",
  "hogar",
  "otros"
];

function formatDate(value?: string) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function diffInDays(from: Date, to: Date) {
  const delta = to.getTime() - from.getTime();
  return Math.max(0, Math.round(delta / (1000 * 60 * 60 * 24)));
}

function PanelFrame({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_14px_36px_rgba(10,24,19,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{eyebrow}</p>
      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AddAgainButton({
  listId,
  name,
  quantity,
  unit,
  compact = false
}: {
  listId?: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  compact?: boolean;
}) {
  if (!listId) {
    return (
      <span className="inline-flex rounded-full bg-[#eef3ef] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
        Crea una lista activa
      </span>
    );
  }

  return (
    <form action={quickAddReminderItemAction}>
      <input type="hidden" name="listId" value={listId} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="quantity" value={quantity ?? ""} />
      <input type="hidden" name="unit" value={unit ?? ""} />
      <button
        type="submit"
        className={`rounded-full bg-[var(--accent)] font-semibold text-white transition hover:bg-[var(--accent-strong)] ${
          compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"
        }`}
      >
        Anadir otra vez
      </button>
    </form>
  );
}

export function RemindersPanel({
  reminders,
  currentListId,
  frequentProducts,
  catalogProducts,
  currentItems
}: {
  reminders: ReminderSuggestion[];
  currentListId?: string | null;
  frequentProducts: ProductInsight[];
  catalogProducts: ProductCatalogItem[];
  currentItems: ShoppingItem[];
}) {
  const predictedProducts = useMemo(() => {
    const boughtItems = currentItems.filter((item) => item.status === "bought");
    const now = new Date();

    return boughtItems.map((item) => {
      const insight = frequentProducts.find((entry) => entry.normalizedName === item.normalizedName);
      const catalogProduct = catalogProducts.find((product) => product.normalizedName === item.normalizedName);
      const sourceDate = item.checkedAt ?? item.updatedAt ?? item.createdAt;
      const lastPurchaseDate = new Date(sourceDate);
      const estimatedWindowDays = insight?.averageIntervalDays ?? getCategoryEstimateDays(catalogProduct?.category);
      const elapsedDays = diffInDays(lastPurchaseDate, now);
      const progress = Math.min(100, Math.round((elapsedDays / estimatedWindowDays) * 100));
      const remainingPercent = Math.max(0, 100 - progress);

      return {
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        elapsedDays,
        estimatedWindowDays,
        progress,
        remainingPercent,
        hasRealPattern: Boolean(insight?.averageIntervalDays),
        category: catalogProduct?.category,
        estimateSourceLabel: insight?.averageIntervalDays
          ? "Tu ritmo real de compra"
          : `Estimacion por categoria: ${getCategoryEstimateLabel(catalogProduct?.category)}`
      };
    });
  }, [catalogProducts, currentItems, frequentProducts]);
  const smartSuggestion = useMemo(() => buildSmartSuggestion(currentItems, catalogProducts), [catalogProducts, currentItems]);

  return (
    <PanelFrame eyebrow="Recordatorios" title="Sugerencias inteligentes">
      <div className="grid gap-4">
        {smartSuggestion ? (
          <article className="rounded-[24px] bg-[linear-gradient(135deg,#dff6ea_0%,#cceee1_100%)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                  {smartSuggestion.badge}
                </span>
                <h4 className="mt-3 text-lg font-semibold text-[var(--text)]">{smartSuggestion.title}</h4>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{smartSuggestion.body}</p>
              </div>
              <div className={`overflow-hidden rounded-[22px] bg-gradient-to-br ${getProductVisual(smartSuggestion.productName).accentClass}`}>
                <Image
                  src={getProductVisual(smartSuggestion.productName).src}
                  alt={getProductVisual(smartSuggestion.productName).alt}
                  width={116}
                  height={88}
                  className="h-[88px] w-[116px] object-cover"
                />
              </div>
            </div>
            <div className="mt-3 rounded-[18px] bg-white/80 px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text)]">{smartSuggestion.productName}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                {smartSuggestion.quantity ? `${smartSuggestion.quantity} ` : ""}
                {smartSuggestion.unit || "sin unidad sugerida"}
              </p>
            </div>
            <div className="mt-4">
              <AddAgainButton
                listId={currentListId ?? undefined}
                name={smartSuggestion.productName}
                quantity={smartSuggestion.quantity}
                unit={smartSuggestion.unit}
              />
            </div>
          </article>
        ) : null}

        {predictedProducts.length > 0 ? (
        <div className="grid gap-4">
          {predictedProducts.map((product) => (
            <article key={product.itemId} className="rounded-[24px] bg-[linear-gradient(180deg,#f7fbf7_0%,#eef6f0_100%)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-[var(--text)]">{product.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {product.quantity ? `${product.quantity} ` : ""}
                    {product.unit || "Cantidad abierta"}
                  </p>
                </div>
                <div className="grid justify-items-end gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#de6a6a]">
                    {product.remainingPercent}% disponible
                  </span>
                  <div className={`overflow-hidden rounded-[20px] bg-gradient-to-br ${getProductVisual(product.name, product.category).accentClass}`}>
                    <Image
                      src={getProductVisual(product.name, product.category).src}
                      alt={getProductVisual(product.name, product.category).alt}
                      width={104}
                      height={78}
                      className="h-[78px] w-[104px] object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#ffd29f_0%,#f79d4f_100%)]" style={{ width: `${product.progress}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-3 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  <span>Comprado</span>
                  <span className="text-center">En consumo</span>
                  <span className="text-right">Reposicion</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
                  <div className="h-[2px] flex-1 bg-[#d8e5db]" />
                  <span className={`h-3 w-3 rounded-full ${product.progress >= 45 ? "bg-[#f6b26b]" : "bg-[#d8e5db]"}`} />
                  <div className="h-[2px] flex-1 bg-[#d8e5db]" />
                  <span className={`h-3 w-3 rounded-full ${product.progress >= 80 ? "bg-[#de6a6a]" : "bg-[#d8e5db]"}`} />
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Han pasado {product.elapsedDays} dias desde que lo marcaste como comprado.
                  {product.hasRealPattern
                    ? ` Tu ritmo real apunta a unos ${product.estimatedWindowDays} dias.`
                    : ` ${product.estimateSourceLabel} suele moverse en torno a ${product.estimatedWindowDays} dias.`}{" "}
                  {product.progress >= 80
                    ? `Parece que ya va haciendo falta ${product.name.toLowerCase()}, lo anadimos?`
                    : `Todavia deberia quedarte margen antes de reponer ${product.name.toLowerCase()}.`}
                </p>
              </div>

              <div className="mt-4">
                <AddAgainButton
                  listId={currentListId ?? undefined}
                  name={product.name}
                  quantity={product.quantity}
                  unit={product.unit}
                />
              </div>
            </article>
          ))}
        </div>
        ) : reminders.length > 0 ? (
        <div className="grid gap-3">
          {reminders.map((reminder) => (
            <article key={`${reminder.product}-${reminder.estimatedNextPurchaseAt}`} className="rounded-[22px] bg-[var(--surface-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--text)]">{reminder.product}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{reminder.message}</p>
            </article>
          ))}
        </div>
        ) : (
        <div className="rounded-[22px] bg-[var(--surface-soft)] p-4">
          <p className="text-sm font-medium text-[var(--muted)]">
            Marca productos como comprados en tu lista actual y empezaremos a levantar recordatorios con barra de progreso.
          </p>
        </div>
        )}
      </div>
    </PanelFrame>
  );
}

export function FrequentProductsPanel({ frequentProducts }: { frequentProducts: ProductInsight[] }) {
  const topProducts = frequentProducts.slice(0, 6);
  const maxAppearances = Math.max(...topProducts.map((product) => product.appearances), 1);

  return (
    <PanelFrame eyebrow="Resumen" title="Productos frecuentes">
      {frequentProducts.length === 0 ? (
        <p className="text-sm leading-6 text-[var(--muted)]">Aun no tenemos suficiente historial para destacar productos recurrentes.</p>
      ) : (
        <div className="grid gap-4">
          {topProducts.map((product) => (
            <article key={product.normalizedName} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-[var(--text)]">{product.displayName}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                      {product.appearances} veces
                    </span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#5bc17a_0%,#218c57_100%)]"
                      style={{ width: `${Math.max(14, Math.round((product.appearances / maxAppearances) * 100))}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                    <span>Ultima vez: {formatDate(product.lastSeenAt)}</span>
                    <span>{product.averageIntervalDays ? `cada ${product.averageIntervalDays} dias` : "sin patron estable"}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PanelFrame>
  );
}

function CatalogProductCard({ product }: { product: ProductCatalogItem }) {
  const [state, formAction, pending] = useActionState(updateCatalogProductAction, initialActionState);

  return (
    <article className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <form action={formAction} className="grid gap-3">
        <input type="hidden" name="productId" value={product.id ?? ""} />
        <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr]">
          <input
            type="text"
            name="name"
            defaultValue={product.name}
            required
            className="rounded-[16px] border border-[var(--border)] bg-white px-3 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
          />
          <input
            type="text"
            name="defaultUnit"
            defaultValue={product.defaultUnit ?? ""}
            placeholder="Unidad"
            className="rounded-[16px] border border-[var(--border)] bg-white px-3 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
          />
          <select
            name="category"
            defaultValue={product.category ?? "otros"}
            className="rounded-[16px] border border-[var(--border)] bg-white px-3 py-3 text-sm capitalize text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
          >
            {productCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            name="active"
            defaultValue={product.active === false ? "false" : "true"}
            className="rounded-[16px] border border-[var(--border)] bg-white px-3 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
          >
            <option value="true">Activo</option>
            <option value="false">Oculto</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
              {product.source === "catalog" ? "Catalogo" : "Detectado desde historial"}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
              {product.normalizedName}
            </span>
          </div>
          <button
            type="submit"
            disabled={pending || !product.id}
            className="rounded-full bg-[var(--surface-strong)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#1d3028] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Guardando..." : "Guardar"}
          </button>
        </div>

        {state.error ? <p className="text-sm text-[#b44d4d]">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-[var(--accent-strong)]">{state.success}</p> : null}
      </form>
    </article>
  );
}

export function ProductCatalogPanel({ catalogProducts }: { catalogProducts: ProductCatalogItem[] }) {
  return (
    <PanelFrame eyebrow="Catalogo" title="Productos controlados">
      {catalogProducts.length === 0 ? (
        <p className="text-sm leading-6 text-[var(--muted)]">
          Todavia no hay productos en el catalogo. Se iran creando segun anadas nuevas referencias a tus listas.
        </p>
      ) : (
        <div className="grid gap-3">
          {catalogProducts.slice(0, 12).map((product) => (
            <CatalogProductCard key={product.id ?? product.normalizedName} product={product} />
          ))}
        </div>
      )}
    </PanelFrame>
  );
}

export function ListsPanel({
  lists,
  selectedListId,
  pageSize = 5
}: {
  lists: ShoppingList[];
  selectedListId?: string | null;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(lists.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const visibleLists = lists.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const timelineMax = Math.max(...visibleLists.map((list) => list.itemCount ?? 0), 1);

  return (
    <PanelFrame eyebrow="Historial" title="Listas anteriores">
      {lists.length === 0 ? (
        <p className="text-sm leading-6 text-[var(--muted)]">Todavia no hay listas historicas. Crea la primera para empezar a comparar compras.</p>
      ) : (
        <>
          <div className="mb-4 rounded-[22px] bg-[var(--surface-soft)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Linea temporal</p>
            <div className="mt-4 flex items-end gap-3">
              {visibleLists.map((list) => (
                <div key={`${list.id}-timeline`} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-20 w-full items-end">
                    <div
                      className="w-full rounded-t-[16px] bg-[linear-gradient(180deg,#b4dfc0_0%,#58a96f_100%)]"
                      style={{ height: `${Math.max(16, Math.round(((list.itemCount ?? 0) / timelineMax) * 100))}%` }}
                    />
                  </div>
                  <p className="text-center text-[11px] font-semibold text-[var(--muted)]">{formatDate(list.shoppingDate)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {visibleLists.map((list) => {
              const active = selectedListId === list.id;

              return (
                <Link
                  key={list.id}
                  href={`/app?list=${list.id}`}
                  className={`rounded-[22px] border p-4 transition ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--accent)]/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">{list.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{formatDate(list.shoppingDate)}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                      {list.itemCount ?? 0} items
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {lists.length > pageSize ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Pagina {safePage + 1} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </PanelFrame>
  );
}
