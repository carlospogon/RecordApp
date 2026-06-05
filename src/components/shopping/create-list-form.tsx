"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { buildRepeatedListTitle } from "@/lib/shopping/repeat-title";
import { ShoppingItem, ShoppingList, ShoppingListTemplate, ShoppingSpace } from "@/types/shopping";

type CreateListFormProps = {
  spaces?: ShoppingSpace[];
  selectedSpaceId?: string | null;
  reusableLists?: ShoppingList[];
  templates?: ShoppingListTemplate[];
  onOptimisticListCreated?: (list: ShoppingList) => void;
  onListCreated?: (list: ShoppingList, items?: ShoppingItem[]) => void;
  onListCreationFailed?: (listId: string) => void;
};

export function CreateListForm({
  spaces = [],
  selectedSpaceId = null,
  reusableLists = [],
  templates = [],
  onOptimisticListCreated,
  onListCreated,
  onListCreationFailed
}: CreateListFormProps) {
  const [pending, startTransition] = useTransition();
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [shoppingDate, setShoppingDate] = useState(defaultDate);
  const [title, setTitle] = useState("");
  const [spaceId, setSpaceId] = useState<string>(selectedSpaceId ?? "");
  const [sourceKind, setSourceKind] = useState<"history" | "template">("history");
  const [sourceListId, setSourceListId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const showReminderDate = useMemo(() => shoppingDate > defaultDate, [shoppingDate, defaultDate]);
  const defaultReminderDate = useMemo(() => (showReminderDate ? shoppingDate : ""), [showReminderDate, shoppingDate]);
  const [reminderDate, setReminderDate] = useState(defaultReminderDate);
  const selectedSpace = useMemo(() => spaces.find((entry) => entry.id === spaceId) ?? null, [spaceId, spaces]);
  const selectedSourceList = useMemo(() => reusableLists.find((entry) => entry.id === sourceListId) ?? null, [reusableLists, sourceListId]);
  const selectedTemplate = useMemo(() => templates.find((entry) => entry.id === templateId) ?? null, [templateId, templates]);
  const activeSourceLabel = sourceKind === "template" ? selectedTemplate?.title : selectedSourceList?.title;
  const suggestedTitle = useMemo(() => {
    if (title.trim()) {
      return title.trim();
    }

    if (sourceKind === "template" && selectedTemplate) {
      return selectedTemplate.title.replace(/\s*\(plantilla\)$/i, "").trim() || "Lista de compra";
    }

    if (selectedSourceList) {
      return buildRepeatedListTitle(selectedSourceList.title);
    }

    return "Lista de compra";
  }, [selectedSourceList, selectedTemplate, sourceKind, title]);

  useEffect(() => {
    setReminderDate(defaultReminderDate);
  }, [defaultReminderDate]);

  useEffect(() => {
    setSpaceId(selectedSpaceId ?? "");
  }, [selectedSpaceId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const listId = crypto.randomUUID();
    const now = new Date().toISOString();
    const nextReminderDate = showReminderDate ? reminderDate || shoppingDate : null;
    const optimisticList: ShoppingList = {
      id: listId,
      ownerId: "local-owner",
      spaceId: selectedSpace?.id ?? null,
      spaceName: selectedSpace?.name ?? null,
      shared: Boolean(selectedSpace),
      accessRole: "owner",
      title: title.trim() || selectedTemplate?.title || selectedSourceList?.title || "Lista de compra",
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
    setSourceListId("");
    setTemplateId("");
    setSuccess("Preparando lista...");

    startTransition(async () => {
      try {
        const response =
          sourceKind === "template" && templateId
            ? await fetch(`/api/templates/${templateId}/instantiate`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  listId,
                  title,
                  spaceId: selectedSpace?.id ?? selectedTemplate?.spaceId ?? "",
                  shoppingDate
                })
              })
            : await fetch("/api/lists", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  id: listId,
                  title,
                  sourceListId,
                  spaceId: selectedSpace?.id ?? "",
                  shoppingDate,
                  reminderDate: showReminderDate ? reminderDate || shoppingDate : ""
                })
              });

        const payload = (await response.json()) as { list?: ShoppingList; items?: ShoppingItem[]; error?: string };

        if (!response.ok || !payload.list) {
          throw new Error(payload.error || "No se pudo crear la lista.");
        }

        setSuccess(
          sourceKind === "template" && templateId
            ? "Lista creada desde tu plantilla."
            : sourceListId
              ? "Lista creada con tu compra anterior."
              : "Lista creada."
        );
        onListCreated?.(payload.list, payload.items);
      } catch (submitError) {
        onListCreationFailed?.(listId);
        setError(submitError instanceof Error ? submitError.message : "No se pudo crear la lista.");
        setSuccess(null);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-[26px] border border-[var(--border)] bg-[rgba(250,249,246,0.9)] p-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Nueva lista</p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Prepara una compra nueva</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Crea una lista con fecha para separar compras semanales, reposiciones rápidas o visitas al mercado.
        </p>
      </div>

      {(selectedSourceList || selectedTemplate) && !title.trim() ? (
        <div className="rounded-[18px] border border-[var(--border)] bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Nombre sugerido</p>
          <p className="mt-2 text-sm font-semibold text-[var(--text)]">{suggestedTitle}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            Puedes cambiarlo, pero si no escribes nada usaremos este nombre para que la lista salga ya clara.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3">
        {reusableLists.length > 0 || templates.length > 0 ? (
          <div className="grid gap-2 rounded-[18px] border border-[var(--border)] bg-white px-4 py-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSourceKind("history")}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  sourceKind === "history" ? "bg-[var(--surface-strong)] text-white" : "bg-[var(--surface-soft)] text-[var(--muted)]"
                }`}
              >
                Desde historial
              </button>
              <button
                type="button"
                onClick={() => setSourceKind("template")}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  sourceKind === "template" ? "bg-[var(--surface-strong)] text-white" : "bg-[var(--surface-soft)] text-[var(--muted)]"
                }`}
              >
                Desde plantilla
              </button>
            </div>
            {sourceKind === "history" ? (
              <>
                <label htmlFor="sourceListId" className="text-sm font-semibold text-[var(--text)]">
                  Partir de una lista anterior
                </label>
                <select
                  id="sourceListId"
                  name="sourceListId"
                  value={sourceListId}
                  onChange={(event) => setSourceListId(event.currentTarget.value)}
                  className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                >
                  <option value="">Empezar vacia</option>
                  {reusableLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title} · {list.itemCount ?? 0} productos
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <label htmlFor="templateId" className="text-sm font-semibold text-[var(--text)]">
                  Partir de una plantilla
                </label>
                <select
                  id="templateId"
                  name="templateId"
                  value={templateId}
                  onChange={(event) => setTemplateId(event.currentTarget.value)}
                  className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                >
                  <option value="">Empezar vacia</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title} · {template.itemCount} productos
                    </option>
                  ))}
                </select>
              </>
            )}
            <p className="text-sm leading-6 text-[var(--muted)]">
              {activeSourceLabel
                ? sourceKind === "template"
                  ? "Esta plantilla esta pensada para arrancar compras repetitivas con menos pasos."
                  : "Clonaremos sus productos pendientes para que empieces desde una compra real que ya hiciste."
                : sourceKind === "template"
                  ? "Elige una plantilla guardada para arrancar la lista ya montada."
                  : "Si eliges una lista anterior, la nueva nacera ya rellenada con sus productos."}
            </p>
          </div>
        ) : null}
        <input
          type="text"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          placeholder="Compra semanal, fruteria, hogar..."
          className="rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
        />
        {spaces.length > 0 ? (
          <div className="grid gap-2 rounded-[18px] border border-[var(--border)] bg-white px-4 py-4">
            <label htmlFor="spaceId" className="text-sm font-semibold text-[var(--text)]">
              Espacio
            </label>
            <select
              id="spaceId"
              name="spaceId"
              value={spaceId}
              onChange={(event) => setSpaceId(event.currentTarget.value)}
              className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
            >
              <option value="">Sin espacio</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
            <p className="text-sm leading-6 text-[var(--muted)]">
              {selectedSpace
                ? "Las listas creadas en este espacio se compartirán automáticamente con sus miembros."
                : "Si eliges un espacio, la lista nacerá ya compartida con ese grupo."}
            </p>
          </div>
        ) : null}
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
            <p className="text-sm font-semibold text-[var(--text)]">¿Para cuándo quieres que te recuerde esta lista?</p>
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
        {pending
          ? "Creando..."
          : sourceKind === "template" && templateId
            ? "Crear desde plantilla"
            : sourceListId
              ? "Crear desde historial"
              : "Crear y abrir"}
      </button>
    </form>
  );
}
