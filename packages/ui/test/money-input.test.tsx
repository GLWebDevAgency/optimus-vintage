import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field, formatMoneyInput, MoneyInput, parseMoneyInput } from "../src/index.js";

describe("parseMoneyInput", () => {
  it("accepte la virgule française, le point et les espaces", () => {
    expect(parseMoneyInput("12,50")).toBe(1250);
    expect(parseMoneyInput("12.5")).toBe(1250);
    expect(parseMoneyInput(" 1 234,00 ")).toBe(123_400);
    expect(parseMoneyInput("20")).toBe(2000);
    expect(parseMoneyInput("0,05")).toBe(5);
    expect(parseMoneyInput(",5")).toBe(50);
  });
  it("renvoie null pour vide et undefined pour invalide", () => {
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput("abc")).toBeUndefined();
    expect(parseMoneyInput("12,345")).toBeUndefined();
    expect(parseMoneyInput("1.2.3")).toBeUndefined();
  });
  it("respecte les devises sans décimales", () => {
    expect(parseMoneyInput("1500", "JPY")).toBe(1500);
    expect(parseMoneyInput("15,5", "JPY")).toBeUndefined();
    expect(formatMoneyInput(1500, "JPY")).toBe("1500");
    expect(formatMoneyInput(2050, "EUR")).toBe("20,50");
    expect(formatMoneyInput(null)).toBe("");
  });
});

function Harness({ onChange }: { onChange: (m: number | null) => void }) {
  const [v, setV] = useState<number | null>(2000);
  return (
    <Field label="Prix payé" hint="En euros">
      <MoneyInput
        valueMinor={v}
        onChangeMinor={(m) => {
          setV(m);
          onChange(m);
        }}
      />
    </Field>
  );
}

describe("MoneyInput", () => {
  it("affiche la valeur contrôlée en virgule et renvoie des unités mineures", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByLabelText("Prix payé") as HTMLInputElement;
    expect(input.value).toBe("20,00");
    expect(input.getAttribute("inputmode")).toBe("decimal");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "49,65" } });
    expect(onChange).toHaveBeenLastCalledWith(4965);
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
    fireEvent.change(input, { target: { value: "12,5" } });
    expect(onChange).toHaveBeenLastCalledWith(1250);
    fireEvent.blur(input);
    expect(input.value).toBe("12,50");
  });

  it("signale une saisie invalide sans émettre, et refuse le négatif", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByLabelText("Prix payé") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "12,345" } });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(input, { target: { value: "-5" } });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.getAttribute("aria-describedby")).toMatch(/hint/);
  });
});
