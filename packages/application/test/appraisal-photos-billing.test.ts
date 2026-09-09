import { asAppraisalId, asWorkspaceId, unwrap } from "@chine/domain";
import { describe, expect, it } from "vitest";
import {
  AppraiseImage,
  BillingUnavailable,
  FeatureLocked,
  OpenBillingPortal,
  PrepareUpload,
  QuotaExceeded,
  StartCheckout,
  UploadPhotoBytes,
  ValidationFailed,
} from "../src/index.js";
import { createTestDependencies } from "../src/testing/index.js";
import { expectErr, setup } from "./helpers.js";

describe("AppraiseImage", () => {
  it("existe dès le plan FREE (10 par mois) ; le texte d'annonce est verrouillé (→ PREMIUM)", async () => {
    const s = await setup({ plan: "FREE" });
    const free = unwrap(
      await new AppraiseImage(s.deps).execute({
        ...s.scope,
        imageBase64: "AAAA",
        mimeType: "image/jpeg",
      }),
    );
    expect(free.usage).toMatchObject({ used: 1, limit: 10, remaining: 9 });
    const e = expectErr(
      await new AppraiseImage(s.deps).execute({
        ...s.scope,
        imageBase64: "AAAA",
        mimeType: "image/jpeg",
        wantListingCopy: true,
      }),
      FeatureLocked,
    );
    expect(e.details).toMatchObject({ feature: "AI_LISTING_COPY", minimumPlan: "PREMIUM" });
    expect(s.deps.appraiser.requests).toHaveLength(1);
  });

  it("renvoie et persiste l'expertise (Lacoste 60/75/85), avec le texte d'annonce sur demande", async () => {
    const s = await setup({ plan: "PREMIUM" });
    const uc = new AppraiseImage(s.deps);
    const r = unwrap(
      await uc.execute({
        ...s.scope,
        imageBase64: "AAAA",
        mimeType: "image/jpeg",
        hints: { purchasePriceMinor: 2000 },
      }),
    );
    expect(r.appraisal.identification.brand).toBe("Lacoste");
    expect([
      r.appraisal.price.low.minor,
      r.appraisal.price.mid.minor,
      r.appraisal.price.high.minor,
    ]).toEqual([6000, 7500, 8500]);
    expect(r.appraisal.price.retailNew?.minor).toBe(25000);
    expect(r.appraisal.listingCopy).toBeNull();
    expect(r.usage).toMatchObject({ used: 1, limit: 100, remaining: 99 });
    expect(
      await s.deps.appraisals.byId(s.scope.workspaceId, asAppraisalId(r.appraisal.id)),
    ).toBeDefined();
    expect(s.deps.appraiser.requests[0]).toMatchObject({
      currency: "EUR",
      locale: "fr",
      hints: { purchasePriceMinor: 2000 },
    });
    const withCopy = unwrap(
      await uc.execute({
        ...s.scope,
        imageBase64: "AAAA",
        mimeType: "image/png",
        wantListingCopy: true,
      }),
    );
    expect(withCopy.appraisal.listingCopy?.hashtags).toContain("#lacoste");
  });

  it("applique le quota mensuel d'expertises", async () => {
    const s = await setup({ plan: "PREMIUM" });
    const uc = new AppraiseImage(s.deps);
    for (let i = 0; i < 100; i++)
      unwrap(await uc.execute({ ...s.scope, imageBase64: "A", mimeType: "image/jpeg" }));
    const e = expectErr(
      await uc.execute({ ...s.scope, imageBase64: "A", mimeType: "image/jpeg" }),
      QuotaExceeded,
    );
    expect(e.details).toMatchObject({
      resource: "aiCreditsPerMonth",
      used: 100,
      limit: 100,
      upgradeTo: "PRO",
    });
  });
});

describe("Photos", () => {
  it("prépare un upload direct et téléverse côté serveur", async () => {
    const s = await setup();
    const target = unwrap(
      await new PrepareUpload(s.deps).execute({ ...s.scope, mimeType: "image/webp" }),
    );
    expect(target).toMatchObject({
      method: "PUT",
      uploadUrl: expect.stringContaining(target.key),
      publicUrl: `memory://photos/${target.key}`,
    });
    expectErr(
      await new PrepareUpload(s.deps).execute({ ...s.scope, mimeType: "image/gif" }),
      ValidationFailed,
    );
    const up = unwrap(
      await new UploadPhotoBytes(s.deps).execute({
        ...s.scope,
        bytes: new Uint8Array([1, 2, 3]),
        mimeType: "image/jpeg",
      }),
    );
    expect(up.key.endsWith(".jpg")).toBe(true);
    expect(s.deps.photos.objects.get(up.key)?.bytes).toEqual(new Uint8Array([1, 2, 3]));
    expectErr(
      await new UploadPhotoBytes(s.deps).execute({
        ...s.scope,
        bytes: new Uint8Array(),
        mimeType: "image/jpeg",
      }),
      ValidationFailed,
    );
  });
});

describe("Billing", () => {
  it("renvoie les URLs de paiement et de portail, ou BillingUnavailable", async () => {
    const s = await setup();
    const checkout = unwrap(
      await new StartCheckout(s.deps).execute({
        ...s.scope,
        plan: "PREMIUM",
        interval: "yearly",
        returnUrl: "https://app/return",
      }),
    );
    expect(checkout.url).toContain("/PREMIUM/yearly");
    const portal = unwrap(
      await new OpenBillingPortal(s.deps).execute({ ...s.scope, returnUrl: "https://app/return" }),
    );
    expect(portal.url).toContain("/portal/");
    const offline = createTestDependencies({ billingAvailable: false });
    const ws = await s.deps.workspaces.byId(s.scope.workspaceId);
    if (!ws) throw new Error("espace absent");
    await offline.workspaces.save(ws);
    expectErr(
      await new StartCheckout(offline).execute({
        ...s.scope,
        plan: "PRO",
        interval: "monthly",
        returnUrl: "x",
      }),
      BillingUnavailable,
    );
    expectErr(
      await new StartCheckout(offline).execute({
        ...s.scope,
        workspaceId: asWorkspaceId("ghost"),
        plan: "PRO",
        interval: "monthly",
        returnUrl: "x",
      }),
      Object,
    );
  });
});
