"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Interest } from "@/lib/site-config";
import { useEnquiry } from "./enquiry-provider";
import { Arrow } from "./icons";

export function EnquiryLink({
  interest,
  children,
  className = "button",
}: {
  interest: Interest;
  children: React.ReactNode;
  className?: string;
}) {
  const { setInterest } = useEnquiry();
  const pathname = usePathname();
  return (
    <Link
      href={`/?interest=${interest}#enquire`}
      className={className}
      onClick={() => {
        setInterest(interest);
        if (pathname === "/")
          requestAnimationFrame(() =>
            document.getElementById("enquire")?.focus({ preventScroll: true }),
          );
      }}
    >
      {children}
      <Arrow diagonal />
    </Link>
  );
}
