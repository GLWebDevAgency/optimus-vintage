"use client";

import type { ItemDto } from "@chine/contract";
import { BigButton, Button, PhotoGrid, Sheet, useToast } from "@chine/ui";
import { type ChangeEvent, useRef, useState } from "react";
import { useAddItemPhoto, useRemoveItemPhoto, useReorderItemPhotos } from "@/hooks/api";
import { useT } from "@/hooks/i18n";
import { prepareImage } from "../chiner/image";
import { useErrorMessage } from "../common/ErrorState";

const MAX_PHOTOS = 8;

/** Photos de la pièce : ajout (caméra ou galerie), retrait, réordonnancement (« Mettre en première »). */
export function ItemPhotos({ item }: { item: ItemDto }) {
  const t = useT();
  const { show } = useToast();
  const describe = useErrorMessage();
  const add = useAddItemPhoto(item.id);
  const remove = useRemoveItemPhoto(item.id);
  const reorder = useReorderItemPhotos(item.id);
  const input = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const tempUrl = URL.createObjectURL(file);
    setUploading(tempUrl);
    try {
      const img = await prepareImage(file);
      await add.mutateAsync({ blob: img.blob, mimeType: img.mimeType, width: img.width, height: img.height });
      URL.revokeObjectURL(img.previewUrl);
      show(t("items.photoAdded"), { kind: "success" });
    } catch (err) {
      show(describe(err), { kind: "error" });
    } finally {
      URL.revokeObjectURL(tempUrl);
      setUploading(null);
    }
  };

  const photos = [
    ...item.photos.map((p) => ({ id: p.id, src: p.thumbnailUrl ?? p.url })),
    ...(uploading ? [{ id: "uploading", src: uploading, loading: true }] : []),
  ];
  const current = item.photos.find((p) => p.id === selected);
  const index = item.photos.findIndex((p) => p.id === selected);

  const makeFirst = async () => {
    if (!current) return;
    const ids = [current.id, ...item.photos.filter((p) => p.id !== current.id).map((p) => p.id)];
    setSelected(null);
    try {
      await reorder.mutateAsync(ids);
    } catch (err) {
      show(describe(err), { kind: "error" });
    }
  };
  const removeCurrent = async () => {
    if (!current) return;
    setSelected(null);
    try {
      await remove.mutateAsync(current.id);
      show(t("items.photoRemoved"), { kind: "success" });
    } catch (err) {
      show(describe(err), { kind: "error" });
    }
  };

  return (
    <div className="grid gap-2">
      <PhotoGrid
        photos={photos}
        max={MAX_PHOTOS}
        onAdd={() => input.current?.click()}
        addLabel={t("common.add")}
        onOpen={(id) => id !== "uploading" && setSelected(id)}
      />
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => void onFile(e)}
        aria-label={t("items.photos")}
        data-testid="item-photo-input"
      />
      <Sheet
        open={Boolean(current)}
        onClose={() => setSelected(null)}
        title={`${t("items.photos")} · ${index + 1}/${item.photos.length}`}
        footer={
          <div className="grid grid-cols-2 gap-2.5">
            <BigButton variant="secondary" onClick={() => void removeCurrent()} loading={remove.isPending}>
              {t("common.remove")}
            </BigButton>
            <BigButton onClick={() => void makeFirst()} disabled={index === 0} loading={reorder.isPending}>
              Principale
            </BigButton>
          </div>
        }
      >
        {current ? (
          <div className="grid gap-3 py-1">
            <img src={current.url} alt="" className="max-h-[52dvh] w-full rounded-card object-contain bg-surface-2" />
            <div className="flex justify-between">
              <Button
                size="sm"
                variant="ghost"
                disabled={index <= 0}
                onClick={() => setSelected(item.photos[index - 1]?.id ?? null)}
              >
                ←
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={index >= item.photos.length - 1}
                onClick={() => setSelected(item.photos[index + 1]?.id ?? null)}
              >
                →
              </Button>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
