"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";
import type { Interest } from "@/lib/site-config";

export function Analytics() {
  const path = usePathname();
  useEffect(() => {
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
