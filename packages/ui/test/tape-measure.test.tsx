import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { TapeMeasure } from "../src/index.js";

function Harness({
  onChange,
  reduced = true,
}: {
  onChange: (m: number) => void;
  reduced?: boolean;
}) {
  const [v, setV] = useState(2000);
  return (
    <div data-reduced={reduced}>
      <TapeMeasure
        valueMinor={v}
        onChange={(m) => {
          setV(m);
          onChange(m);
        }}
        min={0}
        max={50}
      />
    </div>
  );
}

describe("TapeMeasure", () => {
  it("expose un slider accessible avec la valeur courante", () => {
    render(<Harness onChange={() => {}} />);
    const slider = screen.getByRole("slider", { name: "Prix payé" });
    expect(slider.getAttribute("aria-valuenow")).toBe("20");
    expect(slider.getAttribute("aria-valuemin")).toBe("0");
    expect(slider.getAttribute("aria-valuemax")).toBe("50");
    expect(slider.getAttribute("aria-valuetext")).toMatch(/^20\s€$/);
    expect(slider.getAttribute("tabindex")).toBe("0");
  });

  it("répond au clavier : flèches ±1, PageUp/Down ±5, Home/End, et vibre", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(2100);
    fireEvent.keyDown(slider, { key: "PageUp" });
    expect(onChange).toHaveBeenLastCalledWith(2600);
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith(2500);
    fireEvent.keyDown(slider, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith(5000);
    fireEvent.keyDown(slider, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(slider.getAttribute("aria-valuenow")).toBe("0");
    expect(navigator.vibrate).toHaveBeenCalled();
  });

  it("ne dépasse pas les bornes et ignore les touches sans effet", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "End" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider.getAttribute("aria-valuenow")).toBe("50");
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(slider, { key: "a" });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("la molette avance d'une unité", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.wheel(slider, { deltaY: 40 });
    expect(onChange).toHaveBeenLastCalledWith(2100);
    fireEvent.wheel(slider, { deltaY: -40 });
    expect(onChange).toHaveBeenLastCalledWith(2000);
  });
});
