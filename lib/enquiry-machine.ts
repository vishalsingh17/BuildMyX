import { normalizeEnquiry, type Enquiry, type EnquiryErrors } from "./enquiry";
import { interests, type Interest } from "./site-config";

export type EnquiryValues = Omit<Enquiry, "interest"> & { interest: Interest };
export type DeliveryResult = import("./enquiry-fields").EnquirySubmissionResult;
type Attempt = { operationId: string; revision: number; values: EnquiryValues };
type SendAttempt = Attempt & { submissionId: string; body: string };
export type EnquiryPhase =
  | { tag: "editing" }
  | { tag: "sending"; attempt: SendAttempt }
  | { tag: "submitted"; attempt: SendAttempt; result: DeliveryResult }
  | { tag: "deliveryUnconfirmed"; attempt: SendAttempt; message: string }
  | {
      tag: "copying" | "copied" | "manualCopy";
      attempt: Attempt;
      message: string;
    };
export type DeliveryCapability =
  | { tag: "checking"; generation: number }
  | { tag: "available"; generation: number; endpoint: string }
  | { tag: "copyOnly" | "error"; generation: number };
export type EnquiryState = {
  values: EnquiryValues;
  revision: number;
  errors: EnquiryErrors;
  phase: EnquiryPhase;
  capability: DeliveryCapability;
  submission: { body: string; id: string; result?: DeliveryResult } | null;
  started: boolean;
};
export type EnquiryEvent =
  | { type: "EDIT"; field: keyof EnquiryValues; value: string }
  | { type: "INVALID"; errors: EnquiryErrors }
  | { type: "START_SEND"; operationId: string; submissionId: string }
  | { type: "SENT"; operationId: string; result: DeliveryResult }
  | { type: "SEND_UNCONFIRMED"; operationId: string; message: string }
  | { type: "START_COPY"; operationId: string; message: string }
  | { type: "COPY_FINISHED"; operationId: string; manual: boolean }
  | { type: "STARTED" }
  | { type: "RETRY_DISCOVERY" }
  | {
      type: "DISCOVERED";
      generation: number;
      outcome: "available" | "copyOnly" | "error";
    };

export function initialEnquiryState(endpoint: string | null): EnquiryState {
  return {
    values: {
      name: "",
      email: "",
      interest: "ai",
      description: "",
      company: "",
      links: "",
    },
    revision: 0,
    errors: {},
    phase: { tag: "editing" },
    capability: endpoint
      ? { tag: "available", endpoint, generation: 0 }
      : { tag: "checking", generation: 0 },
    submission: null,
    started: false,
  };
}
export function enquiryBusy(state: EnquiryState) {
  return state.phase.tag === "sending" || state.phase.tag === "copying";
}
export function enquiryBody(values: EnquiryValues) {
  return JSON.stringify(normalizeEnquiry(values));
}
export function enquiryReducer(
  state: EnquiryState,
  event: EnquiryEvent,
): EnquiryState {
  switch (event.type) {
    case "EDIT": {
      if (state.values[event.field] === event.value) return state;
      if (
        event.field === "interest" &&
        !interests.some((item) => item.value === event.value)
      )
        return state;
      const errors = { ...state.errors };
      delete errors[event.field];
      return {
        ...state,
        values: { ...state.values, [event.field]: event.value },
        revision: state.revision + 1,
        errors,
        phase: enquiryBusy(state) ? state.phase : { tag: "editing" },
      };
    }
    case "INVALID":
      return enquiryBusy(state)
        ? state
        : { ...state, errors: event.errors, phase: { tag: "editing" } };
    case "START_SEND": {
      if (enquiryBusy(state)) return state;
      const values = normalizeEnquiry(state.values) as EnquiryValues;
      const body = enquiryBody(values);
      const submission =
        state.submission?.body === body
          ? state.submission
          : { body, id: event.submissionId };
      return {
        ...state,
        errors: {},
        submission,
        phase: {
          tag: "sending",
          attempt: {
            operationId: event.operationId,
            revision: state.revision,
            values,
            body,
            submissionId: submission.id,
          },
        },
      };
    }
    case "SENT": {
      if (
        state.phase.tag !== "sending" ||
        state.phase.attempt.operationId !== event.operationId
      )
        return state;
      const { attempt } = state.phase;
      return {
        ...state,
        submission: {
          body: attempt.body,
          id: attempt.submissionId,
          result: event.result,
        },
        phase:
          attempt.revision === state.revision
            ? { tag: "submitted", attempt, result: event.result }
            : { tag: "editing" },
      };
    }
    case "SEND_UNCONFIRMED":
      if (
        state.phase.tag !== "sending" ||
        state.phase.attempt.operationId !== event.operationId
      )
        return state;
      return {
        ...state,
        phase:
          state.phase.attempt.revision === state.revision
            ? {
                tag: "deliveryUnconfirmed",
                attempt: state.phase.attempt,
                message: event.message,
              }
            : { tag: "editing" },
      };
    case "START_COPY":
      if (enquiryBusy(state)) return state;
      return {
        ...state,
        errors: {},
        phase: {
          tag: "copying",
          attempt: {
            operationId: event.operationId,
            revision: state.revision,
            values: { ...state.values },
          },
          message: event.message,
        },
      };
    case "COPY_FINISHED":
      if (
        state.phase.tag !== "copying" ||
        state.phase.attempt.operationId !== event.operationId
      )
        return state;
      return {
        ...state,
        phase:
          state.phase.attempt.revision === state.revision
            ? { ...state.phase, tag: event.manual ? "manualCopy" : "copied" }
            : { tag: "editing" },
      };
    case "STARTED":
      return state.started ? state : { ...state, started: true };
    case "RETRY_DISCOVERY":
      return {
        ...state,
        capability: {
          tag: "checking",
          generation: state.capability.generation + 1,
        },
      };
    case "DISCOVERED":
      if (
        state.capability.tag !== "checking" ||
        state.capability.generation !== event.generation
      )
        return state;
      return {
        ...state,
        capability:
          event.outcome === "available"
            ? {
                tag: "available",
                generation: event.generation,
                endpoint: "/api/enquiry",
              }
            : { tag: event.outcome, generation: event.generation },
      };
  }
}
