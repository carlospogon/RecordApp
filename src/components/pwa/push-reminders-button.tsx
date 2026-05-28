"use client";

import { useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function PushRemindersButton({ publicKey }: { publicKey?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubscribe() {
    if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("error");
      setErrorMessage(!publicKey ? "Falta la clave publica VAPID en este despliegue." : "Este navegador no soporta notificaciones push.");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage(null);
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("error");
        setErrorMessage(
          permission === "denied"
            ? "Has bloqueado las notificaciones para esta web."
            : "No se concedio permiso para mostrar notificaciones."
        );
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        }));

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "No se pudo guardar la suscripcion push.");
      }

      setStatus("done");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "No hemos podido registrar este dispositivo para recibir recordatorios push.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={status === "loading" || status === "done"}
        className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Activando..." : status === "done" ? "Push activada" : "Activar notificaciones"}
      </button>
      {status === "error" && errorMessage ? <p className="text-xs text-[#b44d4d]">{errorMessage}</p> : null}
    </div>
  );
}
