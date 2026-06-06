"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { inferCategoryFromNormalizedName } from "@/lib/shopping/product-category-inference";
import { normalizeProductName } from "@/lib/shopping/normalize-product";
import { ProductCatalogItem, ShoppingDuplicateNotice, ShoppingItem, ShoppingMember } from "@/types/shopping";

type AddItemFormProps = {
  listId: string;
  catalogProducts: ProductCatalogItem[];
  currentItems?: ShoppingItem[];
  members?: ShoppingMember[];
  onItemCreated?: (item: ShoppingItem) => void;
  onOptimisticItemCreated?: (item: ShoppingItem) => void;
  onItemDeleted?: (itemId: string) => void;
};

type CreateItemResponse = {
  item: ShoppingItem;
};

type SpeechRecognitionResultLike = {
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const spokenNumberMap: Record<string, string> = {
  un: "1",
  una: "1",
  uno: "1",
  dos: "2",
  tres: "3",
  cuatro: "4",
  cinco: "5",
  seis: "6",
  siete: "7",
  ocho: "8",
  nueve: "9",
  diez: "10",
  media: "0.5"
};

const knownVoiceUnits = new Set([
  "kg",
  "kilo",
  "kilos",
  "g",
  "gramo",
  "gramos",
  "l",
  "litro",
  "litros",
  "ml",
  "docena",
  "docenas",
  "unidad",
  "unidades",
  "uds",
  "ud",
  "paquete",
  "paquetes",
  "bolsa",
  "bolsas",
  "bote",
  "botes",
  "botella",
  "botellas",
  "barra",
  "barras",
  "lata",
  "latas",
  "pack",
  "caja",
  "cajas",
  "bandeja",
  "bandejas"
]);

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
  catalogProducts,
  currentItems = [],
  members = [],
  onItemCreated,
  onOptimisticItemCreated,
  onItemDeleted
}: AddItemFormProps) {
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
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
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
  const duplicateItemsInCurrentList = useMemo(
    () => (normalizedInput ? currentItems.filter((item) => item.normalizedName === normalizedInput) : []),
    [currentItems, normalizedInput]
  );
  const duplicateAssignees = useMemo(() => {
    const assigneeNames = duplicateItemsInCurrentList
      .map((item) => members.find((member) => member.userId === item.assignedToUserId)?.displayName ?? null)
      .filter((value): value is string => Boolean(value));

    return [...new Set(assigneeNames)];
  }, [duplicateItemsInCurrentList, members]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setVoiceSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  function splitVoiceTranscript(transcript: string) {
    return [
      ...new Set(
        transcript
          .replace(/\s+y\s+/gi, ", ")
          .replace(/[.;\n]+/g, ",")
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
      )
    ];
  }

  function parseVoiceItem(rawValue: string) {
    const cleanedValue = rawValue
      .trim()
      .replace(/\bde el\b/gi, "del")
      .replace(/\s+/g, " ");
    const tokens = cleanedValue.split(" ").filter(Boolean);

    if (tokens.length === 0) {
      return { name: "" };
    }

    let quantityToken = "";
    let unitToken = "";
    let nameStartIndex = 0;

    const firstToken = tokens[0]?.toLowerCase() ?? "";

    if (/^\d+([.,]\d+)?$/.test(firstToken)) {
      quantityToken = firstToken.replace(",", ".");
      nameStartIndex = 1;
    } else if (spokenNumberMap[firstToken]) {
      quantityToken = spokenNumberMap[firstToken];
      nameStartIndex = 1;
    }

    const candidateUnit = tokens[nameStartIndex]?.toLowerCase() ?? "";

    if (candidateUnit && knownVoiceUnits.has(candidateUnit)) {
      unitToken = candidateUnit;
      nameStartIndex += 1;
    }

    let parsedName = tokens.slice(nameStartIndex).join(" ").trim();
    parsedName = parsedName.replace(/^(de|del|la|el|los|las)\s+/i, "").trim();

    if (!parsedName) {
      parsedName = cleanedValue;
      quantityToken = "";
      unitToken = "";
    }

    return {
      name: parsedName,
      quantity: quantityToken || undefined,
      unit: unitToken || undefined
    };
  }

  async function createItemWithOptimistic(fields: { name: string; quantity?: string; unit?: string; notes?: string }) {
    const nextName = fields.name.trim();

    if (!nextName) {
      return { ok: false as const };
    }

    const nextNormalizedName = normalizeProductName(nextName);
    const matchedProduct = availableProducts.find((product) => product.normalizedName === nextNormalizedName) ?? null;
    const matchedSection =
      matchedProduct?.category && matchedProduct.category !== "otros"
        ? matchedProduct.category
        : nextNormalizedName
          ? inferCategoryFromNormalizedName(nextNormalizedName)
          : "otros";
    const itemId = crypto.randomUUID();
    const optimisticItem: ShoppingItem = {
      id: itemId,
      listId,
      name: nextName,
      normalizedName: matchedProduct?.normalizedName ?? nextNormalizedName,
      quantity: fields.quantity?.trim() || null,
      unit: fields.unit?.trim() || matchedProduct?.defaultUnit || null,
      section: matchedSection ?? "otros",
      notes: fields.notes?.trim() || null,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checkedAt: null
    };

    onOptimisticItemCreated?.(optimisticItem);

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: itemId,
          listId,
          productId: matchedProduct?.id ?? "",
          name: nextName,
          quantity: fields.quantity?.trim() ?? "",
          unit: fields.unit?.trim() || matchedProduct?.defaultUnit || "",
          notes: fields.notes?.trim() ?? ""
        })
      });

      const payload = (await response.json()) as Partial<CreateItemResponse> & { error?: string };

      if (!response.ok || !payload.item) {
        throw new Error(payload.error || "No se pudo guardar el producto.");
      }

      onItemCreated?.(payload.item);
      return { ok: true as const, item: payload.item };
    } catch {
      onItemDeleted?.(itemId);
      return { ok: false as const };
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!listReady) {
      setError("La lista se estÃ¡ preparando todavÃ­a. Espera un instante.");
      return;
    }

    const formName = name;
    const formQuantity = quantity;
    const formUnit = unit;
    const formNotes = notes;
    setName("");
    setQuantity("");
    setUnit("");
    setNotes("");

    startTransition(async () => {
      const result = await createItemWithOptimistic({
        name: formName,
        quantity: formQuantity,
        unit: formUnit,
        notes: formNotes
      });

      if (!result.ok) {
        setError("No se pudo guardar el producto.");
        return;
      }

      setCreatedItemId(result.item.id);
      setSuccess("Producto aÃ±adido.");

      fetch(`/api/items/duplicate?name=${encodeURIComponent(result.item.name)}`)
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
    });
  }

  function handleVoiceCapture() {
    if (typeof window === "undefined") {
      return;
    }

    if (voiceListening) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      setError("Este navegador no soporta transcripciÃ³n de voz.");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "es-ES";
    recognitionRef.current = recognition;
    setVoiceDraft("");
    setError(null);
    setSuccess(null);
    setVoiceListening(true);

    let latestTranscript = "";

    recognition.onresult = (event) => {
      let nextTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        nextTranscript += event.results[index]?.[0]?.transcript ?? "";
      }

      latestTranscript = nextTranscript.trim();
      setVoiceDraft(latestTranscript);
    };

    recognition.onerror = () => {
      setVoiceListening(false);
      setError("No hemos podido entender la nota de voz. Inténtalo otra vez.");
    };

    recognition.onend = () => {
      setVoiceListening(false);

      if (!latestTranscript) {
        return;
      }

      const detectedItems = splitVoiceTranscript(latestTranscript);

      startTransition(async () => {
        let createdCount = 0;

        for (const detectedItem of detectedItems) {
          const parsedItem = parseVoiceItem(detectedItem);
          const result = await createItemWithOptimistic(parsedItem);
          if (result.ok) {
            createdCount += 1;
          }
        }

        if (createdCount > 0) {
          setSuccess(
            createdCount === 1
              ? `Nota transcrita y 1 producto añadido: ${detectedItems[0]}.`
              : `Nota transcrita y ${createdCount} productos añadidos desde voz.`
          );
        } else {
          setError("La nota se transcribió, pero no pudimos añadir productos válidos.");
        }

        setVoiceDraft("");
      });
    };

    recognition.start();
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">AÃ±adir producto</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">Rellena la lista activa</h3>
        </div>

        <div className="rounded-[22px] border border-[var(--border)] bg-white p-4 shadow-[0_10px_24px_rgba(18,40,28,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Nota de voz</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Di productos separados por pausas o por "y". RecordApp intentará transcribirlos y añadirlos automáticamente.
              </p>
            </div>
            <button
              type="button"
              onClick={handleVoiceCapture}
              disabled={pending || !listReady || !voiceSupported}
              className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!voiceSupported ? "Voz no disponible" : voiceListening ? "Detener grabación" : "Añadir por voz"}
            </button>
          </div>
          {voiceDraft ? (
            <div className="mt-3 rounded-[18px] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)]">
              <span className="font-semibold text-[var(--accent-strong)]">Transcribiendo:</span> {voiceDraft}
            </div>
          ) : null}
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

        {duplicateItemsInCurrentList.length > 0 ? (
          <div className="rounded-[22px] border border-[#f0d7a3] bg-[#fff8ea] px-4 py-4 text-sm leading-6 text-[#7b5b1d]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-[#5c4312]">Este producto ya está en la lista activa</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7b5b1d]">
                {duplicateItemsInCurrentList.length} coincidencias
              </span>
            </div>
            <p className="mt-2">
              Revisa si conviene fusionarlo antes de añadirlo otra vez{duplicateAssignees.length > 0 ? ` o si ya lo está llevando ${duplicateAssignees.join(", ")}.` : "."}
            </p>
          </div>
        ) : null}

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
