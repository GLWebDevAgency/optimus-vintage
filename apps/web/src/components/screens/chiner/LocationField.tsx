"use client";

import type { SupplierKind } from "@chine/contract";
import { AppIcon, ChipGroup, TextInput } from "@chine/ui";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/hooks/i18n";
import { CAPTURE_SUPPLIER_KINDS, label } from "../common/labels";

export type GeoStatus = "idle" | "locating" | "ok" | "denied" | "unavailable";

export interface GeoState {
  readonly status: GeoStatus;
  readonly lat?: number;
  readonly lng?: number;
}

interface LocationFieldProps {
  readonly geo: GeoState;
  readonly onGeo: (g: GeoState) => void;
  readonly labelText: string;
  readonly onLabel: (v: string) => void;
  readonly supplierKind: SupplierKind;
  readonly onSupplierKind: (k: SupplierKind) => void;
  readonly disabled?: boolean;
}

/**
 * Lieu de la chine : position GPS (sans géocodage inverse hors ligne → « Position enregistrée »),
 * libellé saisi par l'utilisateur, type de lieu en pastilles.
 */
export function LocationField({
  geo,
  onGeo,
  labelText,
  onLabel,
  supplierKind,
  onSupplierKind,
  disabled,
}: LocationFieldProps) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const started = useRef(false);

  const locate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onGeo({ status: "unavailable" });
      return;
    }
    onGeo({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => onGeo({ status: "ok", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => onGeo({ status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable" }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  };

  // Une seule tentative automatique au montage ; l'utilisateur peut relancer.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (geo.status === "idle") locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status =
    geo.status === "locating"
      ? t("chine.locationDetecting")
      : geo.status === "ok"
        ? t("chine.locationSaved")
        : geo.status === "denied"
          ? t("chine.locationDenied")
          : geo.status === "unavailable"
            ? t("chine.locationUnavailable")
            : "";

  return (
    <div className="grid gap-2.5">
      <div className="loc enter d4" data-testid="location-row">
        <AppIcon name="pin" size={14} />
        <span className="min-w-0 flex-1 truncate">
          {labelText ? (
            <>
              <b>{labelText}</b>
              {status ? ` · ${status}` : ""}
            </>
          ) : (
            status || t("chine.where")
          )}
        </span>
        {geo.status === "denied" || geo.status === "unavailable" ? (
          <button
            type="button"
            className="small-btn"
            onClick={locate}
            disabled={disabled}
            aria-label={t("chine.locationLocate")}
          >
            <AppIcon name="refresh" size={14} />
          </button>
        ) : null}
        <button
          type="button"
          className="small-btn"
          onClick={() => setEditing((v) => !v)}
          disabled={disabled}
          aria-expanded={editing}
          data-testid="location-edit"
        >
          <AppIcon name="edit" size={14} />
          {t("chine.locationManual")}
        </button>
      </div>
      {editing ? (
        <TextInput
          value={labelText}
          onChange={(e) => onLabel(e.target.value)}
          placeholder={t("chine.locationLabelPlaceholder")}
          maxLength={160}
          leading={<AppIcon name="pin" size={16} />}
          aria-label={t("chine.locationLabel")}
          autoFocus
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setEditing(false);
          }}
          data-testid="location-label"
        />
      ) : null}
      <ChipGroup
        value={supplierKind}
        onChange={(k) => k && onSupplierKind(k)}
        allowEmpty={false}
        size="sm"
        scroll
        aria-label={t("chine.supplierKind")}
        options={CAPTURE_SUPPLIER_KINDS.map((k) => ({ value: k, label: label.supplierKindShort(t, k) }))}
      />
    </div>
  );
}
