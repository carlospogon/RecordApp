"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setIsInstalled(true);
      setPromptEvent(null);
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!promptEvent) {
      return;
    }

    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  if (isInstalled || !promptEvent) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="w-full rounded-full border border-[#e7dcc9] bg-[linear-gradient(180deg,#f6efde_0%,#efe6d2_100%)] px-5 py-4 text-base font-semibold text-[#6b6251] shadow-[0_10px_24px_rgba(80,68,45,0.08)] transition hover:translate-y-[-1px] hover:shadow-[0_14px_30px_rgba(80,68,45,0.12)]"
    >
      Instalar app
    </button>
  );
}
