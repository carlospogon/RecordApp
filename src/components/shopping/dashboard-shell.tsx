"use client";

import Link from "next/link";
import { finalizeListAction, quickAddReminderItemAction } from "@/app/app/actions";
import { AddItemForm } from "@/components/shopping/add-item-form";
import { CreateListForm } from "@/components/shopping/create-list-form";
import {
  ListsPanel,
  RemindersPanel
} from "@/components/shopping/history-sidebar";
import { ItemsList } from "@/components/shopping/items-list";
import {
  AnalysisBucket,
  AnalysisRecommendation,
  ProductCatalogItem,
  ProductInsight,
  ReminderSuggestion,
  ShoppingAnalysis,
  ShoppingItem,
  ShoppingList
} from "@/types/shopping";

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

function FlowCard({
  currentList,
  catalogProducts
}: {
  currentList: ShoppingList | null;
  catalogProducts: ProductCatalogItem[];
}) {
  if (!currentList) {
    return (
      <section className="rounded-[28px] bg-[linear-gradient(180deg,#f8fcf8_0%,#eef6f0_100%)] p-5 shadow-[0_16px_40px_rgba(18,40,28,0.08)]">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Paso 1</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--text)]">Crea tu primera lista</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Empieza por una lista nueva. En cuanto la crees, pasaras al Paso 2.</p>
        </div>
        <CreateListForm />
      </section>
    );
  }

  return (
    <section className="rounded-[28px] bg-[linear-gradient(180deg,#f8fcf8_0%,#eef6f0_100%)] p-5 shadow-[0_16px_40px_rgba(18,40,28,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Paso 2</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--text)]">{currentList.title || "Lista actual"}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Fecha: {formatDate(currentList.shoppingDate)} - {currentList.itemCount ?? 0} productos guardados
          </p>
        </div>

        <form action={finalizeListAction}>
          <input type="hidden" name="listId" value={currentList.id} />
          <button
            type="submit"
            className="rounded-full border border-[var(--accent)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--accent-soft)]"
          >
            Finalizar lista
          </button>
        </form>
      </div>

      <div className="mt-5">
        <AddItemForm listId={currentList.id} catalogProducts={catalogProducts} />
      </div>
    </section>
  );
}

function SummaryPanel({
  items,
  lists,
  reminders,
  frequentProducts
}: {
  items: ShoppingItem[];
  lists: ShoppingList[];
  reminders: ReminderSuggestion[];
  frequentProducts: ProductInsight[];
}) {
  const boughtCount = items.filter((item) => item.status === "bought").length;
  const pendingCount = items.length - boughtCount;
  const topProducts = frequentProducts.slice(0, 3);

  return (
    <section className="grid gap-4">
      <section className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_14px_36px_rgba(10,24,19,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Resumen</p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Vista general</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            { label: "Lista activa", value: items.length.toString() },
            { label: "Comprados", value: boughtCount.toString() },
            { label: "Pendientes", value: pendingCount.toString() },
            { label: "Historial", value: lists.length.toString() }
          ].map((stat) => (
            <article key={stat.label} className="rounded-[22px] bg-[var(--surface-soft)] p-4">
              <p className="text-2xl font-semibold text-[var(--text)]">{stat.value}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{stat.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_14px_36px_rgba(10,24,19,0.08)]">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Frecuencia</p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Lo que mas repites</h3>
            <div className="mt-4 grid gap-3">
              {topProducts.length > 0 ? (
                topProducts.map((product) => (
                  <article key={product.normalizedName} className="rounded-[22px] bg-[var(--surface-soft)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--text)]">{product.displayName}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                        {product.appearances} veces
                      </span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#5bc17a_0%,#218c57_100%)]"
                        style={{ width: `${Math.max(18, Math.min(100, product.appearances * 18))}%` }}
                      />
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[22px] bg-[var(--surface-soft)] p-4 text-sm leading-6 text-[var(--muted)]">
                  Todavia no hay suficientes productos repetidos para dibujar un patron claro.
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Estado</p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Recordatorios</h3>
            <div className="mt-4 rounded-[22px] bg-[var(--surface-soft)] p-4">
              <p className="text-3xl font-semibold text-[var(--text)]">{reminders.length}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {reminders.length > 0
                  ? "Ya hay productos con reposicion estimada segun tu historial."
                  : "Aun no hay recordatorios cerrados, pero Sugerencias ya puede anticipar lo que estas construyendo ahora."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

function AnalysisAddButton({
  currentListId,
  recommendation
}: {
  currentListId?: string | null;
  recommendation: AnalysisRecommendation;
}) {
  if (!recommendation.productName) {
    return null;
  }

  if (!currentListId) {
    return <span className="rounded-full bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">Crea una lista activa</span>;
  }

  return (
    <form action={quickAddReminderItemAction}>
      <input type="hidden" name="listId" value={currentListId} />
      <input type="hidden" name="name" value={recommendation.productName} />
      <input type="hidden" name="quantity" value={recommendation.quantity ?? ""} />
      <input type="hidden" name="unit" value={recommendation.unit ?? ""} />
      <button
        type="submit"
        className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
      >
        Anadir a la lista
      </button>
    </form>
  );
}

function AnalysisPanel({
  analysis,
  currentListId
}: {
  analysis: ShoppingAnalysis;
  currentListId?: string | null;
}) {
  const circleStops =
    analysis.totalItems > 0
      ? analysis.buckets
          .reduce<{ start: number; segments: string[] }>(
            (acc, bucket) => {
              const next = acc.start + bucket.percentage;
              acc.segments.push(`${bucket.color} ${acc.start}% ${next}%`);
              return { start: next, segments: acc.segments };
            },
            { start: 0, segments: [] }
          )
          .segments.join(", ")
      : "#e7efe9 0% 100%";

  return (
    <section className="grid gap-4">
      <section className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_14px_36px_rgba(10,24,19,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Analisis</p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Tus 3 ultimas listas cerradas</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          RecordApp evalua la distribucion de vegetales, proteinas y carbohidratos para detectar desequilibrios en tu compra reciente.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col items-center justify-center rounded-[24px] bg-[var(--surface-soft)] p-5">
            <div
              className="relative h-48 w-48 rounded-full"
              style={{ background: `conic-gradient(${circleStops})` }}
            >
              <div className="absolute inset-[18%] rounded-full bg-white" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-semibold text-[var(--text)]">{analysis.totalItems}</span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">productos</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">{analysis.consideredListsCount} listas analizadas</p>
          </div>

          <div className="grid gap-3">
            {analysis.buckets.map((bucket: AnalysisBucket) => (
              <article key={bucket.key} className="rounded-[22px] bg-[var(--surface-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: bucket.color }} />
                    <p className="text-sm font-semibold text-[var(--text)]">{bucket.label}</p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--muted)]">{bucket.percentage}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full" style={{ width: `${bucket.percentage}%`, backgroundColor: bucket.color }} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_14px_36px_rgba(10,24,19,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Diagnostico</p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Que deberias equilibrar</h3>
        <div className="mt-4 grid gap-3">
          {analysis.findings.map((finding) => (
            <article key={finding} className="rounded-[22px] bg-[var(--surface-soft)] p-4 text-sm leading-6 text-[var(--muted)]">
              {finding}
            </article>
          ))}
        </div>

        {analysis.recommendations.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {analysis.recommendations.map((recommendation: AnalysisRecommendation) => (
              <article key={recommendation.title} className="rounded-[22px] border border-[var(--border)] bg-[#fcfdfc] p-4">
                <p className="text-sm font-semibold text-[var(--text)]">{recommendation.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{recommendation.body}</p>
                {recommendation.productName ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="rounded-full bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
                      {recommendation.productName}
                      {recommendation.quantity ? ` · ${recommendation.quantity}` : ""}
                      {recommendation.unit ? ` ${recommendation.unit}` : ""}
                    </div>
                    <AnalysisAddButton currentListId={currentListId} recommendation={recommendation} />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}

export function DashboardShell({
  currentList,
  items,
  suggestionItems,
  lists,
  reminders,
  frequentProducts,
  catalogProducts,
  analysis,
  activeTab,
  selectedListId,
  scheduledListReminders,
  pushPublicKey
}: {
  currentList: ShoppingList | null;
  items: ShoppingItem[];
  suggestionItems: ShoppingItem[];
  lists: ShoppingList[];
  reminders: ReminderSuggestion[];
  frequentProducts: ProductInsight[];
  catalogProducts: ProductCatalogItem[];
  analysis: ShoppingAnalysis;
  activeTab: "lista" | "historial" | "sugerencias" | "analisis" | "resumen";
  selectedListId?: string | null;
  scheduledListReminders: { listId: string; title: string; shoppingDate: string; reminderDate: string; isDue: boolean }[];
  pushPublicKey?: string;
  userDisplayName: string;
}) {
  return (
    <div className="mt-5 grid gap-5">
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full flex-nowrap gap-2 rounded-[22px] bg-[linear-gradient(180deg,#f8fcf8_0%,#eef6f0_100%)] p-2 shadow-[0_16px_40px_rgba(18,40,28,0.08)] sm:min-w-0 sm:flex-wrap">
          {[
            { id: "lista", label: "Lista" },
            { id: "historial", label: "Historial" },
            { id: "sugerencias", label: "Sugerencias" },
            { id: "analisis", label: "Analisis" },
            { id: "resumen", label: "Resumen" }
          ].map((tab) => {
            const active = activeTab === tab.id;
            const href = {
              pathname: "/app",
              query: selectedListId ? { list: selectedListId, tab: tab.id } : { tab: tab.id }
            };

            return (
              <Link
                key={tab.id}
                href={href}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  active ? "bg-[var(--surface-strong)] text-white" : "bg-white text-[var(--muted)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {activeTab === "lista" ? (
        <>
          <FlowCard currentList={currentList} catalogProducts={catalogProducts} />
          {currentList ? (
            <section className="rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(18,40,28,0.08)] sm:p-5">
              <ItemsList items={items} />
            </section>
          ) : null}
        </>
      ) : null}

      {activeTab === "historial" ? <ListsPanel lists={lists} selectedListId={currentList?.id ?? null} /> : null}

      {activeTab === "sugerencias" ? (
        <RemindersPanel
          reminders={reminders}
          currentListId={currentList?.id}
          frequentProducts={frequentProducts}
          catalogProducts={catalogProducts}
          currentItems={items}
          suggestionItems={suggestionItems}
          scheduledListReminders={scheduledListReminders}
          pushPublicKey={pushPublicKey}
        />
      ) : null}

      {activeTab === "analisis" ? <AnalysisPanel analysis={analysis} currentListId={currentList?.id} /> : null}

      {activeTab === "resumen" ? (
        <SummaryPanel items={items} lists={lists} reminders={reminders} frequentProducts={frequentProducts} />
      ) : null}
    </div>
  );
}
