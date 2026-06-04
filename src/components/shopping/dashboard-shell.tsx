"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { quickAddReminderItemAction, signOutAction } from "@/app/app/actions";
import { AddItemForm } from "@/components/shopping/add-item-form";
import { CreateListForm } from "@/components/shopping/create-list-form";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { currentAppRelease, developerSignature } from "@/lib/app-release";
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
  ShoppingList,
  ShoppingListInvite,
  ShoppingSpace
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

const navigationItems = [
  { id: "lista", label: "Lista", description: "Compra activa y espacios" },
  { id: "historial", label: "Historial", description: "Listas anteriores" },
  { id: "sugerencias", label: "Sugerencias", description: "Recordatorios y frecuencia" },
  { id: "analisis", label: "Análisis", description: "Lectura de patrones" },
  { id: "resumen", label: "Resumen", description: "Vista general" }
] as const;

const sidebarTabIds = new Set(["analisis", "resumen"]);
const footerTabIds = new Set(["lista", "historial", "sugerencias"]);

function mapRealtimeItem(row: Record<string, unknown>): ShoppingItem {
  return {
    id: String(row.id),
    listId: String(row.list_id),
    name: String(row.name),
    normalizedName: String(row.normalized_name),
    quantity: typeof row.quantity === "string" ? row.quantity : null,
    unit: typeof row.unit === "string" ? row.unit : null,
    section: typeof row.section === "string" ? (row.section as ShoppingItem["section"]) : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    status: row.status === "bought" ? "bought" : "pending",
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    checkedAt: typeof row.checked_at === "string" ? row.checked_at : null
  };
}

function FlowCard({
  currentList,
  currentItemsCount,
  spaces,
  selectedSpaceId,
  catalogProducts,
  onItemCreated,
  onOptimisticItemCreated,
  onItemDeleted,
  onFinalizeList,
  onListCreated,
  onOptimisticListCreated,
  onListCreationFailed,
  onListJoined
}: {
  currentList: ShoppingList | null;
  currentItemsCount: number;
  spaces: ShoppingSpace[];
  selectedSpaceId?: string | null;
  catalogProducts: ProductCatalogItem[];
  onItemCreated: (item: ShoppingItem) => void;
  onOptimisticItemCreated: (item: ShoppingItem) => void;
  onItemDeleted: (itemId: string) => void;
  onFinalizeList: (listId: string) => Promise<void> | void;
  onListCreated: (list: ShoppingList) => void;
  onOptimisticListCreated: (list: ShoppingList) => void;
  onListCreationFailed: (listId: string) => void;
  onListJoined: (list: ShoppingList) => void;
}) {
  const [pendingFinalize, startFinalizeTransition] = useTransition();
  const [shareInvite, setShareInvite] = useState<ShoppingListInvite | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharePending, startShareTransition] = useTransition();
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinPending, startJoinTransition] = useTransition();

  if (!currentList) {
    return (
      <section className="rounded-[28px] border border-[rgba(115,121,114,0.16)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_18px_36px_rgba(74,97,80,0.08)] backdrop-blur-[14px]">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Paso 1</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--text)]">Crea tu primera lista</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Empieza por una lista nueva. En cuanto la crees, pasarás al Paso 2.</p>
        </div>
        <CreateListForm
          spaces={spaces}
          selectedSpaceId={selectedSpaceId}
          onOptimisticListCreated={onOptimisticListCreated}
          onListCreated={onListCreated}
          onListCreationFailed={onListCreationFailed}
        />
        <div className="mt-4 rounded-[26px] border border-[var(--border)] bg-[rgba(250,249,246,0.88)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Unirte a una lista</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Pega un código compartido</h3>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={joinCode}
              onChange={(event) => setJoinCode(event.currentTarget.value.toUpperCase())}
              placeholder="AB12CD34"
              className="flex-1 rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
            />
            <button
              type="button"
              disabled={joinPending || !joinCode.trim()}
              onClick={() => {
                setJoinError(null);
                startJoinTransition(async () => {
                  try {
                    const response = await fetch("/api/lists/join", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({ shareCode: joinCode })
                    });
                    const payload = (await response.json()) as { list?: ShoppingList; error?: string };

                    if (!response.ok || !payload.list) {
                      throw new Error(payload.error || "No se pudo unir a la lista.");
                    }

                    setJoinCode("");
                    onListJoined(payload.list);
                  } catch (error) {
                    setJoinError(error instanceof Error ? error.message : "No se pudo unir a la lista.");
                  }
                });
              }}
              className="rounded-full bg-[var(--surface-strong)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3028] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {joinPending ? "Uniendo..." : "Unirme"}
            </button>
          </div>
          {joinError ? <p className="mt-3 text-sm text-[#b44d4d]">{joinError}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-[rgba(115,121,114,0.16)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_18px_36px_rgba(74,97,80,0.08)] backdrop-blur-[14px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Paso 2</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--text)]">{currentList.title || "Lista actual"}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Fecha: {formatDate(currentList.shoppingDate)} - {currentItemsCount} productos guardados
          </p>
          {currentList.spaceName ? (
            <p className="mt-3 inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
              Espacio · {currentList.spaceName}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentList.accessRole === "owner" && !currentList.spaceId ? (
            <button
              type="button"
              disabled={sharePending}
              onClick={() => {
                setShareError(null);
                startShareTransition(async () => {
                  try {
                    const response = await fetch(`/api/lists/${currentList.id}/share`, {
                      method: "POST"
                    });
                    const payload = (await response.json()) as { invite?: ShoppingListInvite; error?: string };

                    if (!response.ok || !payload.invite) {
                      throw new Error(payload.error || "No se pudo generar el código.");
                    }

                    setShareInvite(payload.invite);
                  } catch (error) {
                    setShareError(error instanceof Error ? error.message : "No se pudo generar el código.");
                  }
                });
              }}
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
            >
              {sharePending ? "Generando..." : "Compartir lista"}
            </button>
          ) : currentList.spaceId ? (
            <span className="rounded-full bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
              Compartida en espacio
            </span>
          ) : currentList.shared ? (
            <span className="rounded-full bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
              Lista compartida
            </span>
          ) : null}
          <button
            type="button"
            disabled={pendingFinalize}
            onClick={() => {
              startFinalizeTransition(async () => {
                await onFinalizeList(currentList.id);
              });
            }}
            className="rounded-full border border-[var(--accent)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--accent-soft)]"
          >
            {pendingFinalize ? "Finalizando..." : "Finalizar lista"}
          </button>
        </div>
      </div>

      {shareInvite ? (
        <div className="mt-4 rounded-[22px] border border-[var(--border)] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Código compartido</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold tracking-[0.2em] text-[var(--text)]">
              {shareInvite.shareCode}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(shareInvite.shareCode)}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
            >
              Copiar
            </button>
          </div>
        </div>
      ) : null}
      {shareError ? <p className="mt-3 text-sm text-[#b44d4d]">{shareError}</p> : null}

      <div className="mt-5">
        <AddItemForm
          listId={currentList.id}
          catalogProducts={catalogProducts}
          onItemCreated={onItemCreated}
          onOptimisticItemCreated={onOptimisticItemCreated}
          onItemDeleted={onItemDeleted}
        />
      </div>
    </section>
  );
}

function SpacesCard({
  spaces,
  selectedSpaceId,
  onSelectSpace,
  onSpaceCreated,
  onSpaceJoined,
  onListsImported,
  onSpaceDeleted
}: {
  spaces: ShoppingSpace[];
  selectedSpaceId?: string | null;
  onSelectSpace: (spaceId: string | null) => void;
  onSpaceCreated: (space: ShoppingSpace) => void;
  onSpaceJoined: (space: ShoppingSpace) => void;
  onListsImported: (lists: ShoppingList[]) => void;
  onSpaceDeleted: (spaceId: string) => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createPending, startCreateTransition] = useTransition();
  const [joinPending, startJoinTransition] = useTransition();
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);

  return (
    <section className="rounded-[28px] border border-[rgba(115,121,114,0.16)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_18px_36px_rgba(74,97,80,0.08)] backdrop-blur-[14px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Espacios</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--text)]">Comparte por grupos estables</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Crea un espacio para una familia, piso o equipo. Las listas que nazcan ahí se compartirán con sus miembros.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateForm((previous) => !previous);
            setError(null);
            setSuccess(null);
          }}
          className="rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--surface-soft)]"
        >
          Crear espacio
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="grid gap-3">
          {spaces.length > 0 ? (
            spaces.map((space) => {
              const active = selectedSpaceId === space.id;

              return (
                <div
                  key={space.id}
                  className={`rounded-[22px] border px-4 py-4 text-left transition ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_12px_24px_rgba(74,97,80,0.10)]"
                      : "border-[var(--border)] bg-white hover:bg-[var(--surface-soft)]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button type="button" onClick={() => onSelectSpace(active ? null : space.id)} className="min-w-0 flex-1 text-left">
                      <p className="text-base font-semibold text-[var(--text)]">{space.name}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Código · {space.shareCode}
                      </p>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                        {space.listCount ?? 0} listas
                      </span>
                      {space.accessRole === "owner" ? (
                        <button
                          type="button"
                          disabled={deletePendingId === space.id}
                          onClick={() => {
                            setError(null);
                            setSuccess(null);
                            setDeletePendingId(space.id);
                            void (async () => {
                              try {
                                const response = await fetch(`/api/spaces/${space.id}`, {
                                  method: "DELETE"
                                });
                                const payload = (await response.json().catch(() => ({}))) as { error?: string };

                                if (!response.ok) {
                                  throw new Error(payload.error || "No se pudo eliminar el espacio.");
                                }

                                onSpaceDeleted(space.id);
                                if (selectedSpaceId === space.id) {
                                  onSelectSpace(null);
                                }
                                setSuccess(`Espacio eliminado: ${space.name}.`);
                              } catch (submitError) {
                                setError(submitError instanceof Error ? submitError.message : "No se pudo eliminar el espacio.");
                              } finally {
                                setDeletePendingId(null);
                              }
                            })();
                          }}
                          className="rounded-full border border-[#e7c8be] bg-[rgba(255,244,240,0.92)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#a45f4a] transition hover:bg-[rgba(255,244,240,1)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletePendingId === space.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    <span>{space.memberCount ?? 0} miembros</span>
                    <span>{space.accessRole === "owner" ? "Owner" : "Miembro"}</span>
                    {active ? <span className="text-[var(--accent-strong)]">Seleccionado para nuevas listas</span> : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm leading-6 text-[var(--muted)]">
              Aún no tienes espacios. Crea uno para agrupar listas compartidas de forma permanente.
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {showCreateForm ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setError(null);
                setSuccess(null);
                startCreateTransition(async () => {
                  try {
                    const response = await fetch("/api/spaces", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({ name: spaceName })
                    });
                    const payload = (await response.json()) as { space?: ShoppingSpace; error?: string };

                    if (!response.ok || !payload.space) {
                      throw new Error(payload.error || "No se pudo crear el espacio.");
                    }

                    onSpaceCreated(payload.space);
                    onSelectSpace(payload.space.id);
                    setSpaceName("");
                    setSuccess(`Espacio creado. Código: ${payload.space.shareCode}`);
                    setShowCreateForm(false);
                  } catch (submitError) {
                    setError(submitError instanceof Error ? submitError.message : "No se pudo crear el espacio.");
                  }
                });
              }}
              className="rounded-[22px] border border-[var(--border)] bg-white p-4"
            >
              <p className="text-sm font-semibold text-[var(--text)]">Nuevo espacio</p>
              <input
                type="text"
                value={spaceName}
                onChange={(event) => setSpaceName(event.currentTarget.value)}
                placeholder="Casa, piso compartido, oficina..."
                className="mt-3 w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={createPending}
                className="mt-3 w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createPending ? "Creando..." : "Guardar espacio"}
              </button>
            </form>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              setSuccess(null);
              startJoinTransition(async () => {
                try {
                  const response = await fetch("/api/spaces/join", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ shareCode: joinCode })
                  });
                  const payload = (await response.json()) as { space?: ShoppingSpace; lists?: ShoppingList[]; error?: string };

                  if (!response.ok || !payload.space) {
                    throw new Error(payload.error || "No se pudo unir al espacio.");
                  }

                  onSpaceJoined(payload.space);
                  onListsImported(payload.lists ?? []);
                  onSelectSpace(payload.space.id);
                  setJoinCode("");
                  setSuccess(`Te has unido a ${payload.space.name}.`);
                } catch (submitError) {
                  setError(submitError instanceof Error ? submitError.message : "No se pudo unir al espacio.");
                }
              });
            }}
            className="rounded-[22px] border border-[var(--border)] bg-white p-4"
          >
            <p className="text-sm font-semibold text-[var(--text)]">Unirme con código</p>
            <input
              type="text"
              value={joinCode}
              onChange={(event) => setJoinCode(event.currentTarget.value.toUpperCase())}
              placeholder="AB12CD34"
              className="mt-3 w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={joinPending || !joinCode.trim()}
              className="mt-3 w-full rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3028] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {joinPending ? "Uniendo..." : "Entrar en espacio"}
            </button>
          </form>

          {error ? <p className="rounded-[18px] bg-[#fff1f1] px-4 py-3 text-sm text-[#b44d4d]">{error}</p> : null}
          {success ? <p className="rounded-[18px] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">{success}</p> : null}
        </div>
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
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Lo que más repites</h3>
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
                  Todavía no hay suficientes productos repetidos para dibujar un patrón claro.
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
                  : "Aún no hay recordatorios cerrados, pero Sugerencias ya puede anticipar lo que estás construyendo ahora."}
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Análisis</p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Tus 3 últimas listas cerradas</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          RecordApp evalúa la distribución de vegetales, proteínas y carbohidratos para detectar desequilibrios en tu compra reciente.
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
                      {recommendation.quantity ? ` Â· ${recommendation.quantity}` : ""}
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
  spaces,
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
  spaces: ShoppingSpace[];
  reminders: ReminderSuggestion[];
  frequentProducts: ProductInsight[];
  catalogProducts: ProductCatalogItem[];
  analysis: ShoppingAnalysis;
  activeTab: "lista" | "historial" | "sugerencias" | "analisis" | "resumen";
  selectedListId?: string | null;
  scheduledListReminders: { listId: string; title: string; shoppingDate: string; reminderDate: string; isDue: boolean }[];
  pushPublicKey?: string;
}) {
  const [localActiveTab, setLocalActiveTab] = useState(activeTab);
  const [localCurrentList, setLocalCurrentList] = useState(currentList);
  const [localItems, setLocalItems] = useState(items);
  const [localLists, setLocalLists] = useState(lists);
  const [localSpaces, setLocalSpaces] = useState(spaces);
  const [localScheduledListReminders, setLocalScheduledListReminders] = useState(scheduledListReminders);
  const [localSelectedListId, setLocalSelectedListId] = useState<string | null>(selectedListId ?? null);
  const [localSelectedSpaceId, setLocalSelectedSpaceId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setLocalActiveTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setLocalCurrentList(currentList);
  }, [currentList]);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    setLocalLists(lists);
  }, [lists]);

  useEffect(() => {
    setLocalSpaces(spaces);
  }, [spaces]);

  useEffect(() => {
    setLocalScheduledListReminders(scheduledListReminders);
  }, [scheduledListReminders]);

  useEffect(() => {
    setLocalSelectedListId(selectedListId ?? null);
  }, [selectedListId]);

  useEffect(() => {
    if (!localCurrentList?.id || localCurrentList.id.startsWith("temp-list-")) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`shopping-items-${localCurrentList.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_items",
          filter: `list_id=eq.${localCurrentList.id}`
        },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const nextItem = mapRealtimeItem(payload.new as Record<string, unknown>);
            let inserted = false;
            setLocalItems((previous) => {
              if (previous.some((item) => item.id === nextItem.id)) {
                return previous.map((item) => (item.id === nextItem.id ? nextItem : item));
              }

              inserted = true;
              return [...previous, nextItem].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            });
            if (inserted) {
              incrementListCount(nextItem.listId, 1);
            }
          }

          if (payload.eventType === "UPDATE" && payload.new) {
            const nextItem = mapRealtimeItem(payload.new as Record<string, unknown>);
            setLocalItems((previous) => previous.map((item) => (item.id === nextItem.id ? nextItem : item)));
          }

          if (payload.eventType === "DELETE" && payload.old) {
            const removedId = String((payload.old as Record<string, unknown>).id);
            let removedListId = "";
            let removed = false;
            setLocalItems((previous) => {
              const itemToRemove = previous.find((item) => item.id === removedId);
              if (!itemToRemove) {
                return previous;
              }

              removedListId = itemToRemove.listId;
              removed = true;
              return previous.filter((item) => item.id !== removedId);
            });
            if (removed) {
              incrementListCount(removedListId, -1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [localCurrentList?.id]);

  useEffect(() => {
    if (!localCurrentList?.id || localCurrentList.id.startsWith("temp-list-") || !localCurrentList.shared) {
      return;
    }

    let cancelled = false;

    const syncItems = async () => {
      try {
        const response = await fetch(`/api/lists/${localCurrentList.id}/items`, {
          cache: "no-store"
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { items?: ShoppingItem[] };

        if (!cancelled && payload.items) {
          setLocalItems(payload.items);
          setLocalCurrentList((previous) =>
            previous && previous.id === localCurrentList.id
              ? {
                  ...previous,
                  itemCount: payload.items?.length ?? 0
                }
              : previous
          );
          setLocalLists((previous) =>
            previous.map((list) =>
              list.id === localCurrentList.id
                ? {
                    ...list,
                    itemCount: payload.items?.length ?? 0
                  }
                : list
            )
          );
        }
      } catch {
        return;
      }
    };

    const interval = window.setInterval(syncItems, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [localCurrentList?.id, localCurrentList?.shared]);

  const localFrequentProducts = useMemo<ProductInsight[]>(() => {
    const appearances = new Map<string, { displayName: string; count: number }>();

    for (const item of localItems) {
      const current = appearances.get(item.normalizedName);
      if (current) {
        current.count += 1;
      } else {
        appearances.set(item.normalizedName, { displayName: item.name, count: 1 });
      }
    }

    return [...appearances.entries()]
      .map(([normalizedName, value]) => ({
        normalizedName,
        displayName: value.displayName,
        appearances: value.count,
        history: []
      }))
      .sort((a, b) => b.appearances - a.appearances)
      .slice(0, 3);
  }, [localItems]);

  function incrementListCount(listId: string, delta: number) {
    setLocalCurrentList((previous) =>
      previous && previous.id === listId
        ? {
            ...previous,
            itemCount: Math.max(0, (previous.itemCount ?? 0) + delta)
          }
        : previous
    );
    setLocalLists((previous) =>
      previous.map((list) =>
        list.id === listId
          ? {
              ...list,
              itemCount: Math.max(0, (list.itemCount ?? 0) + delta)
            }
          : list
      )
    );
  }

  function handleOptimisticItemCreated(item: ShoppingItem) {
    setLocalItems((previous) => [...previous, item]);
    incrementListCount(item.listId, 1);
  }

  function handleItemCreated(item: ShoppingItem) {
    setLocalItems((previous) =>
      previous.some((current) => current.id === item.id)
        ? previous.map((current) => (current.id === item.id ? item : current))
        : [...previous, item]
    );
  }

  function handleItemDeleted(itemId: string) {
    setLocalItems((previous) => {
      const itemToDelete = previous.find((item) => item.id === itemId);
      const next = previous.filter((item) => item.id !== itemId);
      if (next.length !== previous.length) {
        incrementListCount(itemToDelete?.listId ?? "", -1);
      }
      return next;
    });
  }

  function syncListUrl(listId: string | null) {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (listId) {
        url.searchParams.set("list", listId);
      } else {
        url.searchParams.delete("list");
      }
      url.searchParams.set("tab", "lista");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

  function handleOptimisticListCreated(list: ShoppingList) {
    setLocalCurrentList(list);
    setLocalSelectedListId(list.id);
    setLocalItems([]);
    setLocalLists((previous) => [list, ...previous]);
    if (list.spaceId) {
      setLocalSpaces((previous) =>
        previous.map((space) =>
          space.id === list.spaceId
            ? {
                ...space,
                listCount: (space.listCount ?? 0) + 1
              }
            : space
        )
      );
    }

    if (list.reminderDate) {
      const reminderDate = list.reminderDate;
      setLocalScheduledListReminders((previous) => [
        {
          listId: list.id,
          title: list.title,
          shoppingDate: list.shoppingDate,
          reminderDate,
          isDue: reminderDate <= new Date().toISOString().slice(0, 10)
        },
        ...previous
      ]);
    }

    syncListUrl(list.id);
  }

  function handleListCreated(list: ShoppingList) {
    setLocalCurrentList((previous) => (previous?.id === list.id ? list : previous));
    setLocalSelectedListId(list.id);
    setLocalLists((previous) => previous.map((entry) => (entry.id === list.id ? list : entry)));
    setLocalScheduledListReminders((previous) => previous);

    syncListUrl(list.id);
  }

  function handleListCreationFailed(listId: string) {
    const failedList = localLists.find((list) => list.id === listId) ?? (localCurrentList?.id === listId ? localCurrentList : null);
    setLocalLists((previous) => previous.filter((list) => list.id !== listId));
    if (failedList?.spaceId) {
      setLocalSpaces((previous) =>
        previous.map((space) =>
          space.id === failedList.spaceId
            ? {
                ...space,
                listCount: Math.max(0, (space.listCount ?? 0) - 1)
              }
            : space
        )
      );
    }
    setLocalScheduledListReminders((previous) => previous.filter((reminder) => reminder.listId !== listId));
    setLocalCurrentList((previous) => (previous?.id === listId ? null : previous));
    setLocalSelectedListId((previous) => (previous === listId ? null : previous));
    setLocalItems((previous) => (localCurrentList?.id === listId ? [] : previous));
    syncListUrl(null);
  }

  function handleListJoined(list: ShoppingList) {
    setLocalCurrentList(list);
    setLocalSelectedListId(list.id);
    setLocalLists((previous) => (previous.some((entry) => entry.id === list.id) ? previous : [list, ...previous]));
    syncListUrl(list.id);

    fetch(`/api/lists/${list.id}/items`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.items) {
          setLocalItems(payload.items as ShoppingItem[]);
        } else {
          setLocalItems([]);
        }
      })
      .catch(() => {
        setLocalItems([]);
      });
  }

  function handleSpaceCreated(space: ShoppingSpace) {
    setLocalSpaces((previous) => (previous.some((entry) => entry.id === space.id) ? previous : [space, ...previous]));
  }

  function handleSpaceJoined(space: ShoppingSpace) {
    setLocalSpaces((previous) => {
      const existing = previous.find((entry) => entry.id === space.id);
      if (!existing) {
        return [space, ...previous];
      }

      return previous.map((entry) => (entry.id === space.id ? { ...entry, ...space } : entry));
    });
  }

  function handleImportedSpaceLists(importedLists: ShoppingList[]) {
    if (importedLists.length === 0) {
      return;
    }

    setLocalLists((previous) => {
      const byId = new Map(previous.map((list) => [list.id, list]));
      for (const list of importedLists) {
        byId.set(list.id, {
          ...byId.get(list.id),
          ...list
        });
      }
      return [...byId.values()].sort((a, b) => new Date(b.shoppingDate).getTime() - new Date(a.shoppingDate).getTime());
    });
  }

  function handleSpaceDeleted(spaceId: string) {
    setLocalSpaces((previous) => previous.filter((space) => space.id !== spaceId));
    setLocalLists((previous) =>
      previous.map((list) =>
        list.spaceId === spaceId
          ? {
              ...list,
              spaceId: null,
              spaceName: null
            }
          : list
      )
    );
    setLocalCurrentList((previous) =>
      previous?.spaceId === spaceId
        ? {
            ...previous,
            spaceId: null,
            spaceName: null
          }
        : previous
    );
    setLocalSelectedSpaceId((previous) => (previous === spaceId ? null : previous));
  }

  function handleItemToggled(itemId: string, nextStatus: ShoppingItem["status"], nextCheckedAt: string | null) {
    setLocalItems((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: nextStatus,
              checkedAt: nextCheckedAt,
              updatedAt: new Date().toISOString()
            }
          : item
      )
    );
  }

  async function deleteListById(listId: string) {
    const response = await fetch(`/api/lists/${listId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error("No se pudo eliminar la lista.");
    }
  }

  async function handleDeleteLists(listIds: string[]) {
    const uniqueIds = [...new Set(listIds)];
    if (uniqueIds.length === 0) {
      return;
    }

    const previousLists = localLists;
    const previousCurrentList = localCurrentList;
    const previousItems = localItems;
    const previousSpaces = localSpaces;
    const previousScheduledListReminders = localScheduledListReminders;
    const deletedLists = localLists.filter((list) => uniqueIds.includes(list.id));

    setLocalLists((current) => current.filter((list) => !uniqueIds.includes(list.id)));
    setLocalSpaces((current) =>
      current.map((space) => {
        const removedCount = deletedLists.filter((list) => list.spaceId === space.id).length;
        return removedCount > 0
          ? {
              ...space,
              listCount: Math.max(0, (space.listCount ?? 0) - removedCount)
            }
          : space;
      })
    );
    setLocalScheduledListReminders((current) => current.filter((reminder) => !uniqueIds.includes(reminder.listId)));

    if (localCurrentList && uniqueIds.includes(localCurrentList.id)) {
      setLocalCurrentList(null);
      setLocalSelectedListId(null);
      setLocalItems([]);
    }

    try {
      await Promise.all(uniqueIds.map((listId) => deleteListById(listId)));
    } catch {
      setLocalLists(previousLists);
      setLocalCurrentList(previousCurrentList);
      setLocalItems(previousItems);
      setLocalSpaces(previousSpaces);
      setLocalScheduledListReminders(previousScheduledListReminders);
    }
  }

  async function handleFinalizeList(listId: string) {
    const previousCurrentList = localCurrentList;
    const previousItems = localItems;
    const previousLists = localLists;
    const previousScheduledListReminders = localScheduledListReminders;
    const completedAt = new Date().toISOString();

    setLocalLists((current) =>
      current.map((list) =>
        list.id === listId
          ? {
              ...list,
              completedAt
            }
          : list
      )
    );
    setLocalScheduledListReminders((current) => current.filter((reminder) => reminder.listId !== listId));
    setLocalCurrentList(null);
    setLocalSelectedListId(null);
    setLocalItems([]);

    try {
      const response = await fetch(`/api/lists/${listId}/finalize`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("No se pudo finalizar la lista.");
      }
    } catch {
      setLocalCurrentList(previousCurrentList);
      setLocalSelectedListId(previousCurrentList?.id ?? null);
      setLocalItems(previousItems);
      setLocalLists(previousLists);
      setLocalScheduledListReminders(previousScheduledListReminders);
    }
  }

  function handleTabChange(nextTab: typeof activeTab) {
    setLocalActiveTab(nextTab);
    setSidebarOpen(false);

    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("tab", nextTab);

    const listIdForUrl = localSelectedListId ?? localCurrentList?.id ?? null;

    if (listIdForUrl) {
      url.searchParams.set("list", listIdForUrl);
    } else {
      url.searchParams.delete("list");
    }

    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-[rgba(13,21,20,0.36)] lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-[84vw] max-w-[18rem] flex-col border-l border-[rgba(112,150,130,0.18)] bg-[rgba(250,249,246,0.96)] p-4 text-[var(--text)] shadow-[0_24px_60px_rgba(92,112,100,0.18)] backdrop-blur-[18px] transition-transform duration-200 lg:sticky lg:top-5 lg:z-10 lg:h-[calc(100vh-4rem)] lg:w-auto lg:max-w-none lg:translate-x-0 lg:rounded-[28px] lg:border lg:border-[var(--border)] lg:bg-[rgba(255,255,255,0.82)] ${
          sidebarOpen ? "translate-x-0" : "translate-x-[104%]"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[rgba(112,150,130,0.16)] pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Panel</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--text)]">RecordApp</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Análisis, resumen y novedades en una sola vista.</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-full border border-[rgba(112,150,130,0.16)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)] transition hover:bg-[var(--surface-soft)] lg:hidden"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-2">
            {navigationItems.filter((tab) => sidebarTabIds.has(tab.id)).map((tab) => {
              const active = localActiveTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`rounded-[20px] border px-4 py-3 text-left transition ${
                    active
                      ? "border-[rgba(112,150,130,0.34)] bg-[rgba(112,150,130,0.12)] text-[var(--text)] shadow-[0_12px_24px_rgba(112,150,130,0.12)]"
                      : "border-[rgba(112,150,130,0.14)] bg-[rgba(255,255,255,0.72)] text-[var(--text)] hover:bg-[var(--surface-soft)]"
                  }`}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.08em]">{tab.label}</p>
                  <p className={`mt-1 text-sm leading-6 ${active ? "text-[var(--text)]" : "text-[var(--muted)]"}`}>{tab.description}</p>
                </button>
              );
            })}

            <Link
              href="/docs"
              className="rounded-[20px] border border-[rgba(112,150,130,0.14)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-left transition hover:bg-[var(--surface-soft)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text)]">WhatsNew</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Novedades por versión y cambios recientes del producto.</p>
            </Link>
          </div>
        </div>

        <div className="mt-4 border-t border-[rgba(112,150,130,0.16)] pt-4">
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-full border border-[rgba(112,150,130,0.18)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
            >
              Cerrar sesión
            </button>
          </form>
          <div className="mt-3 rounded-[18px] border border-[rgba(112,150,130,0.14)] bg-[var(--surface-soft)] px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Versión</p>
              <p className="text-sm font-semibold text-[var(--accent-strong)]">v{currentAppRelease.version}</p>
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{currentAppRelease.title}</p>
          </div>
          <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{developerSignature}</p>
        </div>
      </aside>

      <div className="grid min-w-0 gap-5 pb-28">
        <div className="flex items-center justify-between rounded-[22px] border border-[rgba(112,150,130,0.14)] bg-[rgba(255,255,255,0.72)] px-4 py-3 shadow-[0_14px_30px_rgba(112,150,130,0.08)] backdrop-blur-[12px] lg:hidden">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Vista</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{navigationItems.find((tab) => tab.id === localActiveTab)?.label}</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(112,150,130,0.16)] bg-[var(--surface-soft)] text-[var(--accent-strong)] transition hover:bg-[rgba(112,150,130,0.14)]"
          >
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-4 rounded-full bg-current" />
              <span className="block h-0.5 w-4 rounded-full bg-current" />
              <span className="block h-0.5 w-4 rounded-full bg-current" />
            </span>
          </button>
        </div>

        {localActiveTab === "lista" ? (
          <>
            <SpacesCard
              spaces={localSpaces}
              selectedSpaceId={localSelectedSpaceId}
              onSelectSpace={setLocalSelectedSpaceId}
              onSpaceCreated={handleSpaceCreated}
              onSpaceJoined={handleSpaceJoined}
              onListsImported={handleImportedSpaceLists}
              onSpaceDeleted={handleSpaceDeleted}
            />
            <FlowCard
              currentList={localCurrentList}
              currentItemsCount={localItems.length}
              spaces={localSpaces}
              selectedSpaceId={localSelectedSpaceId}
              catalogProducts={catalogProducts}
              onItemCreated={handleItemCreated}
              onOptimisticItemCreated={handleOptimisticItemCreated}
              onItemDeleted={handleItemDeleted}
              onFinalizeList={handleFinalizeList}
              onListCreated={handleListCreated}
              onOptimisticListCreated={handleOptimisticListCreated}
              onListCreationFailed={handleListCreationFailed}
              onListJoined={handleListJoined}
            />
            {localCurrentList ? (
              <section className="rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(18,40,28,0.08)] sm:p-5">
                <ItemsList items={localItems} onDelete={handleItemDeleted} onToggle={handleItemToggled} />
              </section>
            ) : null}
          </>
        ) : null}

        {localActiveTab === "historial" ? (
          <ListsPanel lists={localLists} selectedListId={localCurrentList?.id ?? null} onDeleteList={handleDeleteLists} />
        ) : null}

        {localActiveTab === "sugerencias" ? (
          <RemindersPanel
            reminders={reminders}
            currentListId={localCurrentList?.id}
            frequentProducts={frequentProducts}
            catalogProducts={catalogProducts}
            currentItems={localItems}
            suggestionItems={suggestionItems}
            scheduledListReminders={localScheduledListReminders}
            pushPublicKey={pushPublicKey}
          />
        ) : null}

        {localActiveTab === "analisis" ? <AnalysisPanel analysis={analysis} currentListId={localCurrentList?.id} /> : null}

        {localActiveTab === "resumen" ? (
          <SummaryPanel
            items={localItems}
            lists={localLists}
            reminders={reminders}
            frequentProducts={localFrequentProducts.length > 0 ? localFrequentProducts : frequentProducts}
          />
        ) : null}
      </div>

      {isClient
        ? createPortal(
            <div
              className={`fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[100] flex justify-center px-3 transition-all duration-200 sm:px-6 ${
                sidebarOpen ? "pointer-events-none opacity-0 blur-sm" : "pointer-events-none opacity-100"
              }`}
            >
              <div className="pointer-events-auto grid w-[min(100%,34rem)] grid-cols-3 gap-2 rounded-[24px] border border-[rgba(112,150,130,0.14)] bg-[rgba(250,249,246,0.96)] p-2 shadow-[0_20px_40px_rgba(112,150,130,0.18)] backdrop-blur-[18px]">
                {navigationItems.filter((tab) => footerTabIds.has(tab.id)).map((tab) => {
                  const active = localActiveTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={`rounded-[18px] px-3 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-[var(--surface-strong)] text-white shadow-[0_12px_24px_rgba(112,150,130,0.18)]"
                          : "bg-[rgba(255,255,255,0.72)] text-[var(--accent-strong)] hover:bg-[var(--surface-soft)]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
