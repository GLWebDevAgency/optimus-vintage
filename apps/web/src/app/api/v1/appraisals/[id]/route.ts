import { toAppraisalDto } from "@chine/application";
import { routes } from "@chine/contract";
import { asAppraisalId, asWorkspaceId } from "@chine/domain";
import { mapAppraisal } from "@/lib/api/mappers";
import { fail, notFound } from "@/lib/api/respond";
import { sendDto } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Relire une expertise (scopée à l'espace courant). */
export const GET = withAuth<{ id: string }>(async (_req, ctx) => {
  const appraisal = await ctx.deps.appraisals.byId(
    asWorkspaceId(ctx.workspaceId),
    asAppraisalId(ctx.params.id),
  );
  if (!appraisal) return fail(notFound("Expertise"));
  return sendDto(
    "GET /appraisals/:id",
    routes.getAppraisal.response,
    mapAppraisal(toAppraisalDto(appraisal)),
  );
});
