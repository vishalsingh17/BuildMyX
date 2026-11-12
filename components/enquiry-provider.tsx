"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  deliverEnquiry,
  prepareEnquiry,
  validateEnquiry,
  type EnquiryErrors,
} from "@/lib/enquiry";
import {
  enquiryBusy,
  enquiryReducer,
  initialEnquiryState,
  type EnquiryEvent,
  type EnquiryState,
  type EnquiryValues,
} from "@/lib/enquiry-machine";
import { track } from "@/lib/analytics";
import {
  interests,
  siteConfig,
  type Interest,
  type Mode,
} from "@/lib/site-config";

type EnquiryContextValue = {
  state: EnquiryState;
  deliveryEndpoint: string | null;
  interest: Interest;
  setInterest: (value: Interest) => void;
  updateField: (field: keyof EnquiryValues, value: string) => void;
  submitEnquiry: (copyOnly?: boolean) => Promise<EnquiryErrors | undefined>;
  startEnquiry: () => void;
  retryDelivery: () => void;
  heroPreference: { mode: "X" | Mode; paused: boolean };
  setHeroPreference: Dispatch<
    SetStateAction<{ mode: "X" | Mode; paused: boolean }>
  >;
};
const EnquiryContext = createContext<EnquiryContextValue | null>(null);

async function copyMessage(message: string, signal: AbortSignal) {
  if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let abort: () => void = () => {};
  try {
    await Promise.race([
      navigator.clipboard.writeText(message),
      new Promise<never>((_, reject) => {
        abort = () => reject(new Error("Copy cancelled"));
        signal.addEventListener("abort", abort, { once: true });
        timeout = setTimeout(
          () => reject(new Error("Clipboard permission timed out")),
          15000,
        );
        if (signal.aborted) abort();
      }),
    ]);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}

/** The draft, attempt identity and action belong to one document, across routes. */
export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    enquiryReducer,
    siteConfig.enquiryEndpoint,
    initialEnquiryState,
  );
  // Mirrors queued reducer events synchronously, guarding rapid repeated actions.
  const snapshot = useRef(state);
  const transition = useCallback((event: EnquiryEvent) => {
    snapshot.current = enquiryReducer(snapshot.current, event);
    dispatch(event);
    return snapshot.current;
  }, []);
  const operations = useRef(new Set<AbortController>());
  useEffect(
    () => () => operations.current.forEach((controller) => controller.abort()),
    [],
  );
  const generation = state.capability.generation;
  useEffect(() => {
    if (siteConfig.enquiryEndpoint) return;
    const controller = new AbortController();
    let disposed = false;
    const timeout = setTimeout(() => controller.abort(), 5000);
    void fetch("/api/enquiry", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Capability request failed");
        const result: unknown = await response.json();
        if (
          !result ||
          typeof result !== "object" ||
          !("enabled" in result) ||
          typeof result.enabled !== "boolean"
        )
          throw new Error("Invalid capability response");
        if (!disposed)
          transition({
            type: "DISCOVERED",
            generation,
            outcome: result.enabled ? "available" : "copyOnly",
          });
      })
      .catch(() => {
        if (!disposed)
          transition({ type: "DISCOVERED", generation, outcome: "error" });
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      disposed = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [generation, transition]);

  const updateField = useCallback(
    (field: keyof EnquiryValues, value: string) => {
      transition({ type: "EDIT", field, value });
    },
    [transition],
  );
  const setInterest = useCallback(
    (value: Interest) => updateField("interest", value),
    [updateField],
  );
  const retryDelivery = useCallback(() => {
    if (!siteConfig.enquiryEndpoint) transition({ type: "RETRY_DISCOVERY" });
  }, [transition]);
  const startEnquiry = useCallback(() => {
    if (snapshot.current.started) return;
    const interest = snapshot.current.values.interest;
    transition({ type: "STARTED" });
    track("enquiry_start", { interest });
  }, [transition]);

  const submitEnquiry = useCallback(
    async (copyOnly = false) => {
      const current = snapshot.current;
      if (enquiryBusy(current)) return;
      const errors = validateEnquiry(current.values);
      if (Object.keys(errors).length) {
        transition({ type: "INVALID", errors });
        return errors;
      }
      const operationId = crypto.randomUUID();
      const endpoint =
        current.capability.tag === "available"
          ? current.capability.endpoint
          : null;
      const controller = new AbortController();
      operations.current.add(controller);
      try {
        if (endpoint && !copyOnly) {
          const next = transition({
            type: "START_SEND",
            operationId,
            submissionId: crypto.randomUUID(),
          });
          if (next.phase.tag !== "sending") return;
          const { attempt } = next.phase;
          try {
            const cached = next.submission?.result;
            const result =
              cached ??
              (await deliverEnquiry(
                endpoint,
                attempt.values,
                attempt.submissionId,
                controller.signal,
              ));
            if (controller.signal.aborted) return;
            transition({ type: "SENT", operationId, result });
            if (!cached)
              track("enquiry_submitted", { interest: attempt.values.interest });
          } catch (error) {
            if (!controller.signal.aborted)
              transition({
                type: "SEND_UNCONFIRMED",
                operationId,
                message:
                  error instanceof Error
                    ? error.message
                    : "Delivery couldn’t be confirmed. Please try again or copy your enquiry.",
              });
          }
        } else {
          const message = prepareEnquiry(current.values);
          transition({ type: "START_COPY", operationId, message });
          try {
            await copyMessage(message, controller.signal);
            if (controller.signal.aborted) return;
            transition({ type: "COPY_FINISHED", operationId, manual: false });
            track("enquiry_copy", { interest: current.values.interest });
          } catch {
            if (!controller.signal.aborted)
              transition({ type: "COPY_FINISHED", operationId, manual: true });
          }
        }
      } finally {
        operations.current.delete(controller);
      }
    },
    [transition],
  );

  const [heroPreference, setHeroPreference] = useState<{
    mode: "X" | Mode;
    paused: boolean;
  }>({ mode: "X", paused: false });
  const value = useMemo(
    () => ({
      state,
      deliveryEndpoint:
        state.capability.tag === "available" ? state.capability.endpoint : null,
      interest: state.values.interest,
      setInterest,
      updateField,
      submitEnquiry,
      startEnquiry,
      retryDelivery,
      heroPreference,
      setHeroPreference,
    }),
    [
      state,
      setInterest,
      updateField,
      submitEnquiry,
      startEnquiry,
      retryDelivery,
      heroPreference,
    ],
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
