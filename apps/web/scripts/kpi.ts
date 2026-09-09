/**
 * Indicateurs de pilotage, lus directement dans la base (production : DATABASE_URL).
 *
 *   pnpm --filter @chine/web kpi            # 30 derniers jours
 *   pnpm --filter @chine/web kpi -- 7       # 7 derniers jours
 *
 * Inscriptions, activation (première pièce, première vente), plans et état d'abonnement, MRR
 * estimé, crédits IA consommés, jetons et coût estimé par modèle, ventes de la période.
 * Aucune donnée personnelle affichée. Lecture seule.
 */
import { PLAN_PRICES_EUR, type Plan } from "@chine/domain";
import {
  appraisals,
  authSchema,
  createAppDependencies,
  estimateCostMicroUsd,
  items,
  sales,
  workspaces,
} from "@chine/infrastructure";
import { and, count, countDistinct, eq, gte, sql, sum } from "drizzle-orm";

const arg = process.argv.slice(2).find((a) => /^\d+$/.test(a));
const days = Math.max(1, Number(arg ?? 30));
const since = new Date(Date.now() - days * 86_400_000);
const sinceIso = since.toISOString().slice(0, 10);

const deps = await createAppDependencies(process.env);
const db = deps.database.db;

const eur = (minor: number) => `${(minor / 100).toFixed(2).replace(".", ",")} €`;
const pct = (a: number, b: number) => (b === 0 ? "–" : `${Math.round((a / b) * 100)} %`);
const n = (v: unknown) => Number(v ?? 0);

const [users] = await db.select({ total: count() }).from(authSchema.user);
const [usersRecent] = await db
  .select({ total: count() })
  .from(authSchema.user)
  .where(gte(authSchema.user.createdAt, since));
const [activated] = await db.select({ ws: countDistinct(items.workspaceId) }).from(items);
const [sellers] = await db.select({ ws: countDistinct(sales.workspaceId) }).from(sales);
const byPlan = await db
  .select({ plan: workspaces.plan, total: count() })
  .from(workspaces)
  .groupBy(workspaces.plan);
const byStatus = await db
  .select({ status: workspaces.subscriptionStatus, total: count() })
  .from(workspaces)
  .groupBy(workspaces.subscriptionStatus);
const paid = await db
  .select({ plan: workspaces.plan, interval: workspaces.subscriptionInterval, total: count() })
  .from(workspaces)
  .where(sql`${workspaces.subscriptionStatus} in ('active', 'trialing', 'past_due')`)
  .groupBy(workspaces.plan, workspaces.subscriptionInterval);
const [cancelling] = await db
  .select({ total: count() })
  .from(workspaces)
  .where(eq(workspaces.cancelAtPeriodEnd, true));

let mrrMinor = 0;
for (const row of paid) {
  const price = PLAN_PRICES_EUR[row.plan as Plan];
  if (!price) continue;
  const monthly = row.interval === "year" ? price.yearlyMinor / 12 : price.monthlyMinor;
  mrrMinor += monthly * n(row.total);
}

const ai = await db
  .select({
    model: appraisals.model,
    calls: count(),
    credits: sum(appraisals.credits),
    input: sum(appraisals.inputTokens),
    output: sum(appraisals.outputTokens),
  })
  .from(appraisals)
  .where(gte(appraisals.createdAt, since))
  .groupBy(appraisals.model);
const aiByPlan = await db
  .select({
    plan: workspaces.plan,
    credits: sum(appraisals.credits),
    ws: countDistinct(appraisals.workspaceId),
  })
  .from(appraisals)
  .innerJoin(workspaces, eq(workspaces.id, appraisals.workspaceId))
  .where(gte(appraisals.createdAt, since))
  .groupBy(workspaces.plan);

const [salesAgg] = await db
  .select({
    total: count(),
    gross: sum(sales.grossPriceMinor),
    margin: sql<string>`coalesce(sum(${sales.grossPriceMinor} - ${sales.platformFeesMinor} - ${sales.shippingCostMinor} - ${sales.packagingCostMinor} - ${sales.otherCostsMinor} - ${sales.acquisitionCostMinor}), 0)`,
    ws: countDistinct(sales.workspaceId),
  })
  .from(sales)
  .where(and(gte(sales.soldAt, sinceIso), eq(sales.status, "COMPLETED")));

const lines: string[] = [];
lines.push(
  `Chiné · indicateurs sur ${days} jours (depuis ${sinceIso}) · base ${deps.database.driver}`,
);
lines.push("");
lines.push("Comptes");
lines.push(`  inscrits au total        ${n(users?.total)}`);
lines.push(`  inscrits sur la période  ${n(usersRecent?.total)}`);
lines.push(
  `  activés (≥ 1 pièce)      ${n(activated?.ws)}  (${pct(n(activated?.ws), n(users?.total))})`,
);
lines.push(
  `  vendeurs (≥ 1 vente)     ${n(sellers?.ws)}  (${pct(n(sellers?.ws), n(users?.total))})`,
);
lines.push("");
lines.push("Plans");
for (const row of byPlan) lines.push(`  ${String(row.plan).padEnd(10)} ${n(row.total)}`);
lines.push(
  `  abonnements : ${byStatus.map((r) => `${r.status ?? "aucun"} ${n(r.total)}`).join(" · ")}`,
);
lines.push(`  résiliations programmées ${n(cancelling?.total)}`);
lines.push(`  MRR estimé (TTC)         ${eur(Math.round(mrrMinor))}`);
lines.push("");
lines.push("IA");
let totalCostMicro = 0;
for (const row of ai) {
  const tokens =
    row.input === null || row.output === null
      ? null
      : { input: n(row.input), output: n(row.output) };
  const cost = estimateCostMicroUsd(row.model, tokens);
  totalCostMicro += cost ?? 0;
  lines.push(
    `  ${row.model.padEnd(26)} ${String(n(row.calls)).padStart(6)} appels  ${String(n(row.credits)).padStart(6)} crédits  jetons ${n(row.input)} / ${n(row.output)}  coût ≈ ${cost === null ? "inconnu" : `${(cost / 1e6).toFixed(2)} $`}`,
  );
}
lines.push(`  coût IA estimé total     ${(totalCostMicro / 1e6).toFixed(2)} $`);
for (const row of aiByPlan)
  lines.push(
    `  crédits ${String(row.plan).padEnd(9)} ${n(row.credits)} sur ${n(row.ws)} espaces (${(n(row.credits) / Math.max(1, n(row.ws))).toFixed(1)} par espace)`,
  );
lines.push("");
lines.push("Ventes (encaissées)");
lines.push(`  nombre                   ${n(salesAgg?.total)} sur ${n(salesAgg?.ws)} espaces`);
lines.push(`  chiffre d'affaires brut  ${eur(n(salesAgg?.gross))}`);
lines.push(`  marge nette              ${eur(n(salesAgg?.margin))}`);
console.log(lines.join("\n"));
await deps.database.close();
