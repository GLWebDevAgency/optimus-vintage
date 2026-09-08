"use client";

import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

interface NextLinkProps {
  href: string;
  className?: string | undefined;
  children?: ReactNode;
  "aria-current"?: "page" | undefined;
  "aria-label"?: string | undefined;
  onClick?: (() => void) | undefined;
}

/** Adaptateur `Link` de Next pour les composants de `@chine/ui` (`LinkComponent`). */
export function NextLink({ href, ...rest }: NextLinkProps) {
  return <Link href={href as Route} {...rest} />;
}
