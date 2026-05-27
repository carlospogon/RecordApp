"use client";

import { useMemo, useState } from "react";
import { AddItemForm } from "@/components/shopping/add-item-form";
import { CreateListForm } from "@/components/shopping/create-list-form";
import { FrequentProductsPanel, ListsPanel, ProductCatalogPanel, RemindersPanel } from "@/components/shopping/history-sidebar";
import { ItemsList } from "@/components/shopping/items-list";
import { ProductCatalogItem, ProductInsight, ReminderSuggestion, ShoppingItem, ShoppingList } from "@/types/shopping";

type TabKey = "list" | "history" | "suggestions";

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

function TabButton({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-[var(--surface-strong)] text-white" : "bg-white text-[var(--muted)] hover:text-[var(--text)]"
      }`}
    >
      {label}
    </button>
  );
}

function MiniTrendCard({
  label,
  value,
  detail,
  bars,
  tone = "neutral"
}: {
  label: string;
  value: string | number;
  detail: string;
  bars: number[];
  tone?: "neutral" | "accent";
}) {
  const max = Math.max(...bars, 1);

  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-[-0.03em] ${tone === "accent" ? "text-[var(--accent-strong)]" : "text-[var(--text)]"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{detail}</p>
      <div className="mt-4 flex h-12 items-end gap-1">
        {bars.map((bar, index) => (
          <div
            key={`${label}-${index}`}
            className={`flex-1 rounded-t-full ${tone === "accent" ? "bg-[var(--accent)]/75" : "bg-[var(--surface-strong)]/75"}`}
            style={{ height: `${Math.max(18, Math.round((bar / max) * 100))}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ListDensityChart({ lists }: { lists: ShoppingList[] }) {
  const recentLists = lists.slice(0, 6).reverse();
  const max = Math.max(...recentLists.map((list) => list.itemCount ?? 0), 1);

  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Ritmo de listas</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text)]">Ultimas compras guardadas</p>
        </div>
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
          {lists.length} listas
        </span>
      </div>
      <div className="mt-5 flex items-end gap-3">
        {recentLists.map((list) => (
          <div key={list.id} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-24 w-full items-end">
              <div
                className="w-full rounded-t-[18px] bg-[linear-gradient(180deg,#41b06e_0%,#1d6f47_100%)]"
                style={{ height: `${Math.max(16, Math.round(((list.itemCount ?? 0) / max) * 100))}%` }}
              />
            </div>
            <p className="text-center text-[11px] font-semibold text-[var(--muted)]">{formatDate(list.shoppingDate).replace(" de ", " ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompletionChart({
  pendingCount,
  boughtCount,
  remindersCount
}: {
  pendingCount: number;
  boughtCount: number;
  remindersCount: number;
}) {
  const total = Math.max(1, pendingCount + boughtCount);
  const boughtPercent = Math.round((boughtCount / total) * 100);
  const pendingPercent = 100 - boughtPercent;

  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Estado de la lista</p>
      <div className="mt-3 h-4 overflow-hidden rounded-full bg-[#edf2ee]">
        <div className="flex h-full w-full">
          <div className="bg-[var(--accent)]" style={{ width: `${boughtPercent}%` }} />
          <div className="bg-[#d8e4da]" style={{ width: `${pendingPercent}%` }} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex items-center justify-between rounded-[16px] bg-[var(--surface-soft)] px-3 py-2">
          <span className="text-[var(--muted)]">Comprados</span>
          <span className="font-semibold text-[var(--text)]">{boughtCount}</span>
        </div>
        <div className="flex items-center justify-between rounded-[16px] bg-[var(--surface-soft)] px-3 py-2">
          <span className="text-[var(--muted)]">Pendientes</span>
          <span className="font-semibold text-[var(--text)]">{pendingCount}</span>
        </div>
        <div className="flex items-center justify-between rounded-[16px] bg-[var(--surface-soft)] px-3 py-2">
          <span className="text-[var(--muted)]">Recordatorios</span>
          <span className="font-semibold text-[var(--text)]">{remindersCount}</span>
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({
  currentList,
  items,
  lists,
  reminders,
  frequentProducts,
  catalogProducts,
  selectedListId,
  userDisplayName
}: {
  currentList: ShoppingList | null;
  items: ShoppingItem[];
  lists: ShoppingList[];
  reminders: ReminderSuggestion[];
  frequentProducts: ProductInsight[];
  catalogProducts: ProductCatalogItem[];
  selectedListId?: string | null;
  userDisplayName: string;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("list");

  const boughtCount = useMemo(() => items.filter((item) => item.status === "bought").length, [items]);
  const pendingCount = items.length - boughtCount;
  const recentListItemCounts = lists.slice(0, 6).map((list) => list.itemCount ?? 0).reverse();
  const recurrentBars = frequentProducts.slice(0, 6).map((product) => product.appearances).reverse();
  const reminderBars = items
    .filter((item) => item.status === "bought")
    .slice(0, 6)
    .map((_, index, array) => array.length - index);

  return (
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
      <section className="rounded-[28px] bg-[var(--surface)] p-4 shadow-[0_16px_40px_rgba(10,24,19,0.12)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-[24px] bg-[linear-gradient(135deg,#f7fbf7_0%,#eef7f1_100%)] p-4 sm:p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Lista seleccionada</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text)]">
              {currentList?.title || "Tu siguiente compra"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {currentList
                ? `Fecha: ${formatDate(currentList.shoppingDate)} - ${currentList.itemCount ?? 0} productos guardados`
                : `${userDisplayName}, crea una lista y empieza a registrar productos, frecuencia y recordatorios.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-[22px] border border-[var(--border)] bg-white p-2">
            <TabButton label="Lista" active={activeTab === "list"} onClick={() => setActiveTab("list")} />
            <TabButton label="Historial" active={activeTab === "history"} onClick={() => setActiveTab("history")} />
            <TabButton label="Sugerencias" active={activeTab === "suggestions"} onClick={() => setActiveTab("suggestions")} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1.25fr_1fr_1fr_1fr]">
          <ListDensityChart lists={lists} />
          <CompletionChart pendingCount={pendingCount} boughtCount={boughtCount} remindersCount={reminders.length} />
          <MiniTrendCard
            label="Productos recurrentes"
            value={frequentProducts.length}
            detail="Lo que mas vuelve a aparecer en tus listas."
            bars={recurrentBars.length > 0 ? recurrentBars : [1, 1, 1, 1, 1, 1]}
          />
          <MiniTrendCard
            label="Ritmo de reposicion"
            value={items.filter((item) => item.status === "bought").length}
            detail="Productos ya comprados y candidatos a sugerencia."
            bars={reminderBars.length > 0 ? reminderBars : [1, 1, 1, 1, 1, 1]}
            tone="accent"
          />
        </div>

        {activeTab === "list" ? (
          <>
            <div className="mt-4 grid gap-4 lg:grid-cols-[0.84fr_1.16fr]">
              <CreateListForm />
              {currentList ? (
                <AddItemForm listId={currentList.id} catalogProducts={catalogProducts} />
              ) : (
                <section className="rounded-[26px] border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Activa tu memoria</p>
                  <p className="mt-3 text-lg font-semibold text-[var(--text)]">Crea tu primera lista para empezar.</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Cuando exista una lista activa podras anadir productos, detectar repetidos y empezar a construir frecuencia real de compra.
                  </p>
                </section>
              )}
            </div>

            <div className="mt-4">
              <ItemsList items={items} />
            </div>
          </>
        ) : null}

        {activeTab === "history" ? (
          <div className="mt-4 grid gap-4">
            <ListsPanel lists={lists} selectedListId={selectedListId} />
            <ProductCatalogPanel catalogProducts={catalogProducts} />
            <FrequentProductsPanel frequentProducts={frequentProducts} />
          </div>
        ) : null}

        {activeTab === "suggestions" ? (
          <div className="mt-4 grid gap-4">
            <RemindersPanel
              reminders={reminders}
              currentListId={currentList?.id}
              frequentProducts={frequentProducts}
              catalogProducts={catalogProducts}
              currentItems={items}
            />
            <FrequentProductsPanel frequentProducts={frequentProducts.slice(0, 4)} />
          </div>
        ) : null}
      </section>

      <div className="grid gap-4">
        <RemindersPanel
          reminders={reminders.slice(0, 2)}
          currentListId={currentList?.id}
          frequentProducts={frequentProducts.slice(0, 4)}
          catalogProducts={catalogProducts}
          currentItems={items}
        />
        <ProductCatalogPanel catalogProducts={catalogProducts.slice(0, 6)} />
        <FrequentProductsPanel frequentProducts={frequentProducts.slice(0, 4)} />
        <ListsPanel lists={lists} selectedListId={selectedListId} pageSize={5} />
      </div>
    </div>
  );
}
