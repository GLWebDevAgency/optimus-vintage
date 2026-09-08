"use client";

import { AppIcon, BigButton, Sheet } from "@chine/ui";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useT } from "@/hooks/i18n";
import { usePrefs } from "@/hooks/prefs";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallContextValue {
  /** Peut-on proposer l'installation (pas déjà installée, plateforme connue) ? */
  readonly available: boolean;
  readonly installed: boolean;
  readonly open: () => void;
}

const InstallContext = createContext<InstallContextValue>({
  available: false,
  installed: false,
  open: () => {},
});

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

const isIos = () =>
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios/i.test(navigator.userAgent);

/**
 * Invitation à installer la PWA : `beforeinstallprompt` sur Android/Chrome, mode d'emploi sur iOS.
 * Ouverte depuis Réglages ou après la première vente ; jamais plus d'une fois par semaine.
 */
export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const [prefs, setPrefs] = usePrefs();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIos());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const available = !installed && (Boolean(deferred) || ios);
  const openSheet = useCallback(() => {
    if (available) setOpen(true);
  }, [available]);

  const close = () => {
    setOpen(false);
    setPrefs({ installDismissedAt: Date.now() });
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferred(null);
    close();
  };

  const value = useMemo<InstallContextValue>(
    () => ({ available, installed, open: openSheet }),
    [available, installed, openSheet],
  );
  void prefs;

  return (
    <InstallContext.Provider value={value}>
      {children}
      <Sheet
        open={open}
        onClose={close}
        title={t("pwa.installSheetTitle")}
        description={deferred ? t("pwa.installAndroidBody") : t("pwa.installBody")}
        footer={
          deferred ? (
            <div className="grid grid-cols-2 gap-2.5">
              <BigButton variant="secondary" onClick={close}>
                {t("pwa.installLater")}
              </BigButton>
              <BigButton onClick={() => void install()} leading={<AppIcon name="plus" size={18} />}>
                {t("pwa.installCta")}
              </BigButton>
            </div>
          ) : (
            <BigButton variant="secondary" onClick={close}>
              {t("common.ok")}
            </BigButton>
          )
        }
      >
        {deferred ? null : (
          <ol className="grid gap-3 py-1 text-[14px] text-ink-2">
            {[t("pwa.installIosStep1"), t("pwa.installIosStep2"), t("pwa.installIosStep3")].map(
              (step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink font-mono text-[11px] font-medium text-bg">
                    {i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ),
            )}
          </ol>
        )}
      </Sheet>
    </InstallContext.Provider>
  );
}

export const useInstallPrompt = (): InstallContextValue => useContext(InstallContext);

/** Ouvre l'invitation une fois, après la première vente sur cet appareil. */
export function useInstallAfterFirstSale() {
  const { available, open } = useInstallPrompt();
  const [prefs] = usePrefs();
  return useCallback(() => {
    const recentlyDismissed =
      prefs.installDismissedAt !== null && Date.now() - prefs.installDismissedAt < 7 * 86_400_000;
    if (available && !recentlyDismissed && prefs.salesRecorded <= 1) {
      window.setTimeout(open, 2400);
    }
  }, [available, open, prefs.installDismissedAt, prefs.salesRecorded]);
}
