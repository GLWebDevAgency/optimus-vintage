import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { SnapToggle } from "../src/index";

function Harness() {
  const [on, setOn] = useState(false);
  return (
    <SnapToggle
      checked={on}
      onChange={setOn}
      label="Mode chine hors ligne"
      description="Synchronise plus tard"
    />
  );
}

describe("SnapToggle", () => {
  it("est un switch étiqueté, décrit, et bascule au clic et aux flèches", () => {
    render(<Harness />);
    const sw = screen.getByRole("switch", { name: "Mode chine hors ligne" });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    expect(sw.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(sw.getAttribute("aria-describedby") ?? "")?.textContent).toBe(
      "Synchronise plus tard",
    );
    fireEvent.click(sw);
    expect(sw.getAttribute("aria-checked")).toBe("true");
    fireEvent.keyDown(sw, { key: "ArrowLeft" });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    fireEvent.keyDown(sw, { key: "ArrowRight" });
    expect(sw.getAttribute("aria-checked")).toBe("true");
  });

  it("sans libellé, exige un aria-label", () => {
    render(<SnapToggle checked onChange={() => {}} aria-label="Notifications" />);
    expect(screen.getByRole("switch", { name: "Notifications" })).toBeTruthy();
  });
});
