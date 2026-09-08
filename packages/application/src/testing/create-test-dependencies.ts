import type { Plan } from "@chine/domain";
import type { AppDependencies } from "../ports/index.js";
import { FixedClock, InMemorySkuSequence, SequentialIds } from "./clock.js";
import { FakeAppraiser } from "./fake-appraiser.js";
import { InMemoryPhotoStorage, RecordingEventPublisher, StaticBilling } from "./infra-fakes.js";
import { InMemoryItemRepository } from "./item-repository.js";
import {
  InMemoryAppraisalRepository,
  InMemoryListingRepository,
  InMemorySaleRepository,
} from "./sale-repository.js";
import { InMemorySourceRepository } from "./source-repository.js";
import { InMemoryUnitOfWork } from "./unit-of-work.js";
import { InMemoryWorkspaceRepository } from "./workspace-repository.js";

/** Dépendances de test avec leurs types concrets (horloge pilotable, événements enregistrés…). */
export interface TestDependencies extends AppDependencies {
  readonly clock: FixedClock;
  readonly ids: SequentialIds;
  readonly events: RecordingEventPublisher;
  readonly appraiser: FakeAppraiser;
  readonly photos: InMemoryPhotoStorage;
  readonly billing: StaticBilling;
  readonly skuSequence: InMemorySkuSequence;
  readonly workspaces: InMemoryWorkspaceRepository;
  readonly sources: InMemorySourceRepository;
  readonly items: InMemoryItemRepository;
  readonly listings: InMemoryListingRepository;
  readonly sales: InMemorySaleRepository;
  readonly appraisals: InMemoryAppraisalRepository;
}

export interface TestOverrides {
  readonly now?: Date;
  readonly plan?: Plan;
  readonly billingAvailable?: boolean;
}

export function createTestDependencies(overrides: TestOverrides = {}): TestDependencies {
  const workspaces = new InMemoryWorkspaceRepository();
  const sources = new InMemorySourceRepository();
  const items = new InMemoryItemRepository();
  const listings = new InMemoryListingRepository();
  const sales = new InMemorySaleRepository();
  const appraisals = new InMemoryAppraisalRepository();
  const skuSequence = new InMemorySkuSequence();
  const repos = { workspaces, sources, items, listings, sales, appraisals, skuSequence };
  return {
    ...repos,
    clock: new FixedClock(overrides.now),
    ids: new SequentialIds(),
    uow: new InMemoryUnitOfWork(repos, [workspaces, sources, items, listings, sales, appraisals]),
    events: new RecordingEventPublisher(),
    appraiser: new FakeAppraiser(),
    photos: new InMemoryPhotoStorage(),
    billing: new StaticBilling(overrides.plan ?? "FREE", overrides.billingAvailable ?? true),
  };
}
