import { AppraisalDto, DashboardDto, ItemDto, PageOf, SaleDto, SourceDto, WorkspaceOverviewDto } from "@chine/contract";
import { expect, it } from "vitest";
import { dashboardDto, demoState, fakeAppraisal, itemDto, overview, saleDto, sourceDto } from "../e2e/fake-api";

it("le faux API respecte les DTOs du contrat", () => {
  const s = demoState("http://localhost:3100", { email: "lea@chine.test", name: "Léa" });
  const report = (label: string, r: { success: boolean; error?: { issues: unknown[] } }) => {
    if (!r.success) console.log(label, JSON.stringify(r.error?.issues, null, 1));
    expect(r.success, label).toBe(true);
  };
  report("overview", WorkspaceOverviewDto.safeParse(overview(s)));
  for (const p of ["month", "30d", "3m", "year"]) report(`dashboard ${p}`, DashboardDto.safeParse(dashboardDto(s, p)));
  report("items", PageOf(ItemDto).safeParse({ items: s.items.map((i) => itemDto(s, i)), total: 1, limit: 50, offset: 0 }));
  for (const src of s.sources) report(`source ${src.id}`, SourceDto.safeParse(sourceDto(s, src)));
  for (const sale of s.sales) report(`sale ${sale.id}`, SaleDto.safeParse(saleDto(s, sale)));
  report("appraisal", AppraisalDto.safeParse(fakeAppraisal(s)));
});
