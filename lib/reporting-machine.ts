import {
  runReport,
  sampleRows,
  type ReportingResult,
  type ReportingRow,
} from "./reporting";

type View = {
  rows: ReportingRow[];
  question: "change" | "checks" | "sources";
  highlight: number[];
};
export type ReportingState = View &
  (
    | { tag: "sample" | "editedWithoutResult"; result: null }
    | { tag: "currentResult" | "staleResult"; result: ReportingResult }
  );
type ReportingEvent =
  | { type: "EDIT"; index: number; amount: string }
  | { type: "RUN" }
  | { type: "RESET" }
  | { type: "QUESTION"; question: View["question"] }
  | { type: "SOURCES"; indexes: number[] };

export function initialReportingState(): ReportingState {
  return {
    tag: "sample",
    rows: sampleRows.map((row) => ({ ...row })),
    result: null,
    question: "change",
    highlight: [],
  };
}
export function reportingReducer(
  state: ReportingState,
  event: ReportingEvent,
): ReportingState {
  switch (event.type) {
    case "EDIT": {
      if (
        !state.rows[event.index] ||
        state.rows[event.index].amount === event.amount
      )
        return state;
      const rows = state.rows.map((row, index) =>
        index === event.index ? { ...row, amount: event.amount } : row,
      );
      return state.result
        ? {
            ...state,
            tag: "staleResult",
            result: state.result,
            rows,
            highlight: [],
          }
        : {
            ...state,
            tag: "editedWithoutResult",
            result: null,
            rows,
            highlight: [],
          };
    }
    case "RUN":
      return {
        ...state,
        tag: "currentResult",
        result: runReport(state.rows),
        highlight: [],
      };
    case "RESET":
      return initialReportingState();
    case "QUESTION":
      return state.tag === "currentResult"
        ? { ...state, question: event.question }
        : state;
    case "SOURCES":
      return state.tag === "currentResult" &&
        event.indexes.length > 0 &&
        event.indexes.every(
          (index) =>
            Number.isInteger(index) && index >= 0 && index < state.rows.length,
        )
        ? { ...state, highlight: [...event.indexes] }
        : state;
  }
}
