"use client";

import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useSearchParams } from "next/navigation";
import type { Enquiry } from "@/lib/enquiry";
import {
  interests,
  siteConfig,
  type Interest,
  type Mode,
} from "@/lib/site-config";

type Draft = Omit<Enquiry, "interest">;
type EnquiryContextValue = {
  deliveryEndpoint: string | null;
  interest: Interest;
  setInterest: Dispatch<SetStateAction<Interest>>;
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
  heroPreference: { mode: "X" | Mode; paused: boolean };
  setHeroPreference: Dispatch<
    SetStateAction<{ mode: "X" | Mode; paused: boolean }>
  >;
};
const EnquiryContext = createContext<EnquiryContextValue | null>(null);

/** A tab-local draft survives client navigation. No cookies or browser storage. */
export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [deliveryEndpoint, setDeliveryEndpoint] = useState(
    siteConfig.enquiryEndpoint,
  );
  useEffect(() => {
    if (siteConfig.enquiryEndpoint) return;
    const controller = new AbortController();
    fetch("/api/enquiry", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (result?.enabled === true) setDeliveryEndpoint("/api/enquiry");
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const [interest, setInterest] = useState<Interest>("ai");
  const [heroPreference, setHeroPreference] = useState<{
    mode: "X" | Mode;
    paused: boolean;
  }>({ mode: "X", paused: false });
  const [draft, setDraft] = useState<Draft>({
    name: "",
    email: "",
    description: "",
    company: "",
    links: "",
  });
  const value = useMemo(
    () => ({
      deliveryEndpoint,
      interest,
      setInterest,
      draft,
      setDraft,
      heroPreference,
      setHeroPreference,
    }),
    [interest, draft, heroPreference, deliveryEndpoint],
  );
  return (
    <EnquiryContext.Provider value={value}>
      <Suspense fallback={null}>
        <InterestFromUrl />
      </Suspense>
      {children}
    </EnquiryContext.Provider>
  );
}

function InterestFromUrl() {
  const search = useSearchParams();
  const value = search.get("interest");
  const { setInterest } = useEnquiry();
  useEffect(() => {
    if (interests.some((item) => item.value === value))
      setInterest(value as Interest);
  }, [value, setInterest]);
  return null;
}

export function useEnquiry() {
  const value = useContext(EnquiryContext);
  if (!value)
    throw new Error("Enquiry components must be inside EnquiryProvider.");
  return value;
}
