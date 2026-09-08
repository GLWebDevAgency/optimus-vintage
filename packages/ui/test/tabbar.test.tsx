import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { TabBar } from "../src/index";

const FakeLink = ({
  href,
  children,
  className,
  ...rest
}: {
  href: string;
  children?: ReactNode;
  className?: string;
  "aria-current"?: "page";
}) => (
  <a href={href} className={className} data-fake-link="" aria-current={rest["aria-current"]}>
    {children}
  </a>
);

const items = [
  { key: "today", label: "Aujourd'hui", href: "/", icon: "home" as const },
  { key: "stock", label: "Stock", href: "/stock", icon: "tag" as const, badge: 3 },
  { key: "sales", label: "Ventes", href: "/ventes", icon: "receipt" as const },
  { key: "sources", label: "Sources", href: "/sources", icon: "layers" as const },
] as const;

describe("TabBar", () => {
  it("rend quatre liens avec le composant Link injecté et un CTA central", () => {
    render(
      <TabBar
        items={items}
        activeKey="stock"
        cta={{ label: "Chiner", href: "/chiner" }}
        Link={FakeLink}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Navigation principale" });
    const links = nav.querySelectorAll("a[data-fake-link]");
    expect(links.length).toBe(5);
    expect(screen.getByRole("link", { name: /Stock/ }).getAttribute("aria-current")).toBe("page");
    expect(
      screen.getByRole("link", { name: /Aujourd'hui/ }).getAttribute("aria-current"),
    ).toBeNull();
    expect(screen.getByRole("link", { name: /Chiner/ }).getAttribute("href")).toBe("/chiner");
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("le CTA peut être un bouton", () => {
    let clicked = 0;
    render(
      <TabBar
        items={items}
        activeKey="today"
        cta={{ label: "Chiner", onClick: () => clicked++ }}
      />,
    );
    screen.getByRole("button", { name: /Chiner/ }).click();
    expect(clicked).toBe(1);
    expect(screen.getAllByRole("link").length).toBe(4);
  });
});
