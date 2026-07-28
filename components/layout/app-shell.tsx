"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

/**
 * Isolates Design System 2.0 public tokens from legacy admin visuals.
 * Admin CMS keeps pre-DS2 CSS variable values via `.adminApp`.
 */
export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return <div className={isAdmin ? "adminApp" : "publicApp"}>{children}</div>;
}
