"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";
import type { Interest } from "@/lib/site-config";

export function Analytics() {
  const path = usePathname();
  const previousPath = useRef<string | null>(null);
  useEffect(() => {
    if (previousPath.current === path) return;
    previousPath.current = path;
    track("page_view");
    const interest = (
      {
        "/services/ai": "ai",
        "/services/career": "learning",
        "/services/team": "hiring",
        "/developers": "developer",
      } as Record<string, Interest>
    )[path.replace(/\/$/, "")];
    if (interest) track("service_view", { interest });
  }, [path]);
  return null;
}
