import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Button,
  ChipGroup,
  pillStatusOf,
  Receipt,
  Segmented,
  Sheet,
  StatusPill,
  StitchProgress,
  ToastProvider,
  useToast,
} from "../src/index";

describe("composants divers", () => {
  it("Button : loading désactive et annonce aria-busy ; href rend un lien", () => {
    const { rerender } = render(<Button loading>Enregistrer</Button>);
    const btn = screen.getByRole("button");
    expect(btn.hasAttribute("disabled")).toBe(true);
    expect(btn.getAttribute("aria-busy")).toBe("true");
    rerender(
      <Button href="/stock" variant="ghost">
        Voir
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Voir" }).getAttribute("href")).toBe("/stock");
  });

  it("ChipGroup : sélection multiple avec aria-pressed", () => {
    let value: string[] = ["LOT"];
    const { rerender } = render(
      <ChipGroup
        mode="multi"
        value={value}
        onChange={(v) => (value = v)}
        options={[
          { value: "LOT", label: "Lot" },
          { value: "PALLET", label: "Palette" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Lot" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Palette" }));
    expect(value).toEqual(["LOT", "PALLET"]);
    rerender(
      <ChipGroup
        mode="multi"
        value={value}
        onChange={(v) => (value = v)}
        options={[
          { value: "LOT", label: "Lot" },
          { value: "PALLET", label: "Palette" },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lot" }));
    expect(value).toEqual(["PALLET"]);
  });

  it("Segmented : radiogroup navigable aux flèches", () => {
    let value = "all";
    render(
      <Segmented
        value={value}
        onChange={(v) => (value = v)}
        options={[
          { value: "all", label: "Toutes" },
          { value: "LOT", label: "Lots" },
        ]}
        aria-label="Type"
      />,
    );
    const group = screen.getByRole("radiogroup", { name: "Type" });
    expect(screen.getByRole("radio", { name: "Toutes" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(value).toBe("LOT");
  });

  it("StatusPill : mapping des statuts et libellés FR", () => {
    expect(pillStatusOf("LISTED")).toBe("online");
    expect(pillStatusOf("IN_STOCK", true)).toBe("dormant");
    render(<StatusPill status="sold" />);
    expect(screen.getByText("Vendue")).toBeTruthy();
  });

  it("Receipt : montants formatés, signes et tons", () => {
    render(
      <Receipt
        rows={[
          { label: "Prix brut", value: { minor: 7500, currency: "EUR" } },
          { label: "Port", value: { minor: -495, currency: "EUR" } },
          {
            label: "Marge nette",
            value: { minor: 4965, currency: "EUR" },
            total: true,
            signed: true,
          },
          { label: "ROI", value: { ratio: 2.4825 } },
        ]}
      />,
    );
    expect(screen.getByText("75,00")).toBeTruthy();
    expect(screen.getByText("−4,95").className).toMatch(/text-thread/);
    expect(screen.getByText("+49,65").className).toMatch(/text-brass/);
    expect(screen.getByText(/\+248\s%/)).toBeTruthy();
  });

  it("StitchProgress : progressbar bornée", () => {
    render(<StitchProgress value={1.12} label="Palette Eureka" valueLabel="112 % remboursée" />);
    expect(
      screen.getByRole("progressbar", { name: "Palette Eureka" }).getAttribute("aria-valuenow"),
    ).toBe("100");
  });

  it("Sheet : dialogue modal, Échap ferme, focus piégé", () => {
    let open = true;
    const close = () => (open = false);
    render(
      <Sheet open={open} onClose={close} title="Prix brut" portal={false}>
        <button type="button">Un</button>
        <button type="button">Deux</button>
      </Sheet>,
    );
    const dialog = screen.getByRole("dialog", { name: "Prix brut" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const two = screen.getByRole("button", { name: "Deux" });
    two.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement?.textContent).toBe("Un");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(open).toBe(false);
  });

  it("Toast : show/dismiss via useToast", () => {
    function Demo() {
      const { show } = useToast();
      return (
        <button
          type="button"
          onClick={() => show("Ajoutée à la chine", { kind: "success", duration: 0 })}
        >
          go
        </button>
      );
    }
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "go" }));
    expect(screen.getByRole("status").textContent).toContain("Ajoutée à la chine");
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
  });
});

describe("Showcase", () => {
  it("rend tous les composants sans erreur", async () => {
    const { Showcase } = await import("../src/preview/showcase");
    render(<Showcase />);
    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeTruthy();
    expect(screen.getByRole("slider")).toBeTruthy();
    expect(screen.getAllByRole("progressbar").length).toBeGreaterThan(1);
  });
});
