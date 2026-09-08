import {
  asPhotoId,
  type DomainError,
  err,
  type ItemId,
  ok,
  type PhotoId,
  type PhotoRef,
  type Result,
} from "@chine/domain";
import type { ItemDto, PhotoDto } from "../../dto.js";
import { NotFound } from "../../errors.js";
import { toItemDto } from "../../mappers/index.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { omitUndefined } from "../../shared/objects.js";
import { transact } from "../../shared/transaction.js";
import type { UseCase } from "../use-case.js";
import type { PhotoInput } from "./create-item.js";

type Deps = Pick<AppDependencies, "uow" | "events" | "ids" | "clock" | "photos">;
export interface ItemPhotosOutput {
  readonly item: ItemDto;
}

export interface AddItemPhotoCommand extends WorkspaceScoped, PhotoInput {
  readonly itemId: ItemId;
}
export interface AddItemPhotoOutput extends ItemPhotosOutput {
  readonly photo: PhotoDto;
}

/** Rattache une photo déjà téléversée (clé de stockage) à une pièce. */
export class AddItemPhoto implements UseCase<AddItemPhotoCommand, AddItemPhotoOutput> {
  constructor(private readonly deps: Deps) {}
  execute(cmd: AddItemPhotoCommand): Promise<Result<AddItemPhotoOutput, DomainError>> {
    return transact(this.deps, async (repos) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const item = await repos.items.byId(ws.value.id, cmd.itemId);
      if (!item) return err(new NotFound("Item", cmd.itemId));
      const photo: PhotoRef = {
        ...omitUndefined({ width: cmd.width, height: cmd.height, blurhash: cmd.blurhash }),
        id: asPhotoId(this.deps.ids.next()),
        key: cmd.key,
      };
      const now = this.deps.clock.now();
      const added = item.addPhoto(photo, now);
      if (!added.ok) return added;
      await repos.items.save(item);
      const dto = toItemDto(item, { now, publicUrl: (k) => this.deps.photos.publicUrl(k) });
      const photoDto = dto.photos.find((p) => p.id === photo.id);
      if (!photoDto) throw new Error("Photo ajoutée mais absente du DTO");
      return ok({ item: dto, photo: photoDto });
    });
  }
}

export interface RemoveItemPhotoCommand extends WorkspaceScoped {
  readonly itemId: ItemId;
  readonly photoId: PhotoId;
  /** Supprime aussi le fichier du stockage (défaut : oui). */
  readonly deleteFromStorage?: boolean;
}

export class RemoveItemPhoto implements UseCase<RemoveItemPhotoCommand, ItemPhotosOutput> {
  constructor(private readonly deps: Deps) {}
  async execute(cmd: RemoveItemPhotoCommand): Promise<Result<ItemPhotosOutput, DomainError>> {
    let removedKey: string | undefined;
    const result = await transact(this.deps, async (repos) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const item = await repos.items.byId(ws.value.id, cmd.itemId);
      if (!item) return err(new NotFound("Item", cmd.itemId));
      removedKey = item.photos.find((p) => p.id === cmd.photoId)?.key;
      const now = this.deps.clock.now();
      item.removePhoto(cmd.photoId, now);
      await repos.items.save(item);
      return ok({
        item: toItemDto(item, { now, publicUrl: (k) => this.deps.photos.publicUrl(k) }),
      });
    });
    if (result.ok && removedKey && cmd.deleteFromStorage !== false)
      await this.deps.photos.delete(removedKey);
    return result;
  }
}

export interface ReorderItemPhotosCommand extends WorkspaceScoped {
  readonly itemId: ItemId;
  readonly photoIds: readonly PhotoId[];
}

export class ReorderItemPhotos implements UseCase<ReorderItemPhotosCommand, ItemPhotosOutput> {
  constructor(private readonly deps: Deps) {}
  execute(cmd: ReorderItemPhotosCommand): Promise<Result<ItemPhotosOutput, DomainError>> {
    return transact(this.deps, async (repos) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const item = await repos.items.byId(ws.value.id, cmd.itemId);
      if (!item) return err(new NotFound("Item", cmd.itemId));
      const now = this.deps.clock.now();
      item.reorderPhotos(cmd.photoIds, now);
      await repos.items.save(item);
      return ok({
        item: toItemDto(item, { now, publicUrl: (k) => this.deps.photos.publicUrl(k) }),
      });
    });
  }
}
