"use client";

import { AppIcon, Button } from "@chine/ui";
import { type ChangeEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/hooks/i18n";
import { captureFromVideo, type PreparedImage, prepareImage } from "./image";

export type CameraState = "idle" | "starting" | "live" | "denied" | "unavailable" | "off";

interface CameraCaptureProps {
  readonly photo: PreparedImage | null;
  readonly onPhoto: (image: PreparedImage) => void;
  readonly onRetake: () => void;
  readonly onError: (message: string) => void;
  /** Scanline pendant l'expertise IA. */
  readonly scanning?: boolean;
  /** Carte IA superposée en bas de la photo. */
  readonly overlay?: ReactNode;
  readonly disabled?: boolean;
}

const hasMediaDevices = () =>
  typeof navigator !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  (typeof window === "undefined" || window.isSecureContext);

/**
 * Viseur plein cadre : aperçu caméra en direct quand le navigateur le permet, sinon (ou en cas
 * de refus) capture native via `<input type="file" capture="environment">`. La galerie reste
 * toujours accessible.
 */
export function CameraCapture({
  photo,
  onPhoto,
  onRetake,
  onError,
  scanning,
  overlay,
  disabled,
}: CameraCaptureProps) {
  const t = useT();
  const [state, setState] = useState<CameraState>("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const stop = useCallback(() => {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    if (!hasMediaDevices()) {
      setState("unavailable");
      return;
    }
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1600 }, height: { ideal: 2000 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setState("live");
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      setState(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
    }
  }, []);

  // Démarrage automatique quand il n'y a pas encore de photo ; arrêt à la prise de vue et au démontage.
  useEffect(() => {
    if (photo) {
      stop();
      setState((s) => (s === "live" || s === "starting" ? "off" : s));
      return;
    }
    if (state === "idle" || state === "off") void start();
    // `start` et `stop` sont stables ; on ne veut réagir qu'à la présence d'une photo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);
  useEffect(() => stop, [stop]);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      onPhoto(await prepareImage(file));
    } catch {
      onError(t("chine.photoTooLarge"));
    } finally {
      setBusy(false);
    }
  };

  const shoot = async () => {
    const video = videoRef.current;
    if (!video) return;
    setBusy(true);
    try {
      onPhoto(await captureFromVideo(video));
    } catch {
      onError(t("chine.photoTooLarge"));
    } finally {
      setBusy(false);
    }
  };

  const live = state === "live" || state === "starting";

  return (
    <div className="grid gap-2.5">
      <div className="viewfinder enter d2" data-state={photo ? "photo" : state} data-testid="viewfinder">
        {photo ? (
          <img src={photo.previewUrl} alt={t("chine.photoAlt")} />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            aria-label={t("chine.cameraLive")}
            hidden={!live}
          />
        )}
        {!photo && live ? (
          <>
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            <button
              type="button"
              className="shutter"
              onClick={() => void shoot()}
              disabled={busy || disabled || state !== "live"}
              aria-label={t("chine.shoot")}
              data-testid="shutter"
            >
              <AppIcon name="camera" size={26} />
            </button>
          </>
        ) : null}
        {!photo && !live ? (
          <div className="relative z-[1] grid justify-items-center gap-3 px-6 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-[rgba(255,255,255,.08)]">
              <AppIcon name={state === "denied" ? "lock" : "camera"} size={30} />
            </span>
            <p className="text-[13.5px] font-medium opacity-90">
              {state === "denied"
                ? t("pwa.cameraDenied")
                : state === "unavailable"
                  ? t("chine.cameraUnavailable")
                  : t("chine.takePhoto")}
            </p>
            {state === "denied" ? <p className="text-[12px] opacity-70">{t("chine.cameraDeniedBody")}</p> : null}
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => captureInput.current?.click()}
                leading={<AppIcon name="camera" size={16} />}
                className="!bg-bg !text-ink"
                disabled={busy || disabled}
              >
                {t("chine.takePhoto")}
              </Button>
              {state === "unavailable" || state === "denied" ? null : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void start()}
                  className="!text-bg !shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.5)]"
                  disabled={busy || disabled}
                >
                  {t("chine.cameraStart")}
                </Button>
              )}
            </div>
          </div>
        ) : null}
        {photo && scanning ? <span className="scanline" aria-hidden="true" /> : null}
        {photo && overlay ? <div className="photo-ai">{overlay}</div> : null}
        {photo ? (
          <button
            type="button"
            onClick={onRetake}
            disabled={disabled}
            className="absolute right-3 top-3 z-[2] inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[rgba(14,19,38,.72)] px-3 font-ui text-[12px] font-semibold text-white backdrop-blur focus-thread"
          >
            <AppIcon name="refresh" size={14} />
            {t("chine.retake")}
          </button>
        ) : null}
      </div>

      {!photo ? (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => galleryInput.current?.click()}
            disabled={busy || disabled}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md px-1 font-ui text-[13px] font-semibold text-ink-2 hover:text-ink focus-thread"
          >
            <AppIcon name="gallery" size={16} />
            {t("chine.fromGallery")}
          </button>
          {live ? (
            <span className="label">{t("chine.cameraLive")}</span>
          ) : busy ? (
            <span className="label">{t("common.loading")}</span>
          ) : null}
        </div>
      ) : null}

      <input
        ref={captureInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => void handleFile(e)}
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        hidden
        onChange={(e) => void handleFile(e)}
        aria-label={t("chine.choosePhoto")}
        data-testid="photo-input"
      />
    </div>
  );
}
