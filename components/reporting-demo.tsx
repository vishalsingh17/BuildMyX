"use client";

import { useRef, useReducer } from "react";
import { csv, money } from "@/lib/reporting";
import { track } from "@/lib/analytics";
import {
  initialReportingState,
  reportingReducer,
} from "@/lib/reporting-machine";
import { Arrow } from "./icons";

export function ReportingDemo() {
  const [state, dispatch] = useReducer(
    reportingReducer,
    undefined,
    initialReportingState,
  );
  const { rows, result, question, highlight } = state;
  const dirty =
    state.tag === "staleResult" || state.tag === "editedWithoutResult";
  const report = useRef<HTMLDivElement>(null);
  const edit = (index: number, amount: string) =>
    dispatch({ type: "EDIT", index, amount });
  const run = () => {
    dispatch({ type: "RUN" });
    track("example_run", { resource: "reporting_pipeline" });
    requestAnimationFrame(() => report.current?.focus());
  };
  const source = (indexes: number[]) => {
    if (state.tag !== "currentResult" || !indexes.length) return;
    dispatch({ type: "SOURCES", indexes });
    document.getElementById(`source-${indexes[0]}`)?.focus();
  };
  const download = () => {
    if (!result || dirty) return;
    const text = csv([
      ["Period", "Accepted total GBP", "Source rows"],
      ...result.totals.map((total) => [
        total.week,
        (total.pence / 100).toFixed(2),
        total.sources
          .map((index) => `${rows[index].id} (row ${index + 1})`)
          .join("; "),
      ]),
      ["Flagged rows", result.flagged.length, "Excluded pending review"],
    ]);
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "buildmyx-checked-report.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track("resource_download", { resource: "checked_report" });
  };
  return (
    <section className="working-demo" aria-labelledby="demo-heading">
      <div className="demo-heading">
        <div>
          <p className="eyebrow">01 / TRY THE WORKFLOW</p>
          <h2 id="demo-heading">Messy inputs. A report you can check.</h2>
          <p>
            Edit an amount, run the checks, then follow a total back to its
            rows.
          </p>
        </div>
        <a
          href="/examples/reporting-inputs.csv"
          download
          className="text-link"
          onClick={() =>
            track("resource_download", { resource: "sample_inputs" })
          }
        >
          Download sample CSV <Arrow diagonal />
        </a>
      </div>
      <p className="demo-disclosure">
        Fictional data in GBP. All validation, calculations and guided
        explanations run in your browser. This demo uses no AI model and sends
        no data to BuildMyX.
      </p>
      <div className="demo-workspace">
        <div className="demo-inputs">
          <h3>Source records</h3>
          <p>13 rows · two reporting periods · three issues to find</p>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Editable sample source records"
          >
            <table className="data-table">
              <caption className="sr-only">
                Fictional reporting inputs. Amounts can be edited.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Row / ID</th>
                  <th scope="col">Period</th>
                  <th scope="col">Account</th>
                  <th scope="col">Amount (£)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    id={`source-${index}`}
                    tabIndex={-1}
                    className={
                      highlight.includes(index) ? "source-highlight" : ""
                    }
                  >
                    <th scope="row">
                      <span className="row-index">{index + 1} / </span>
                      {row.id}
                    </th>
                    <td>{row.week}</td>
                    <td>
                      {row.account || (
                        <span className="issue-label">Missing</span>
                      )}
                    </td>
                    <td>
                      <input
                        aria-label={`Amount for row ${index + 1}, ${row.id}`}
                        value={row.amount}
                        onChange={(event) => edit(index, event.target.value)}
                        inputMode="decimal"
                        maxLength={16}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="demo-actions">
            <button className="button" onClick={run}>
              Run checks & report <Arrow />
            </button>
            <button
              className="text-link"
              onClick={() => dispatch({ type: "RESET" })}
            >
              Reset sample
            </button>
          </div>
        </div>
        <div
          className="demo-output"
          ref={report}
          tabIndex={-1}
          aria-label="Report results"
        >
          <p className="eyebrow">02 / CHECKED OUTPUT</p>
          {!result ? (
            <div className="demo-empty">
              <h3>Ready when you are.</h3>
              <p>
                Run the workflow to see checked totals, flagged records and
                their source rows.
              </p>
              <span aria-hidden="true">↗</span>
            </div>
          ) : (
            <>
              <p
                role="status"
                className={dirty ? "demo-warning" : "demo-status"}
              >
                {dirty
                  ? "Inputs changed. Run the checks again to refresh these results."
                  : `${result.accepted.length} accepted · ${result.flagged.length} flagged for review · report ready`}
              </p>
              <div className="report-totals">
                {result.totals.map((total) => (
                  <div key={total.week}>
                    <span>{total.week}</span>
                    <strong>{money(total.pence)}</strong>
                    <button
                      className="text-link"
                      disabled={dirty || !total.sources.length}
                      onClick={() => source(total.sources)}
                    >
                      View {total.sources.length} source rows <Arrow />
                    </button>
                  </div>
                ))}
              </div>
              <h3>What changed?</h3>
              <div
                className="question-buttons"
                role="group"
                aria-label="Explore the checked report"
              >
                {(
                  [
                    ["change", "Compare weeks"],
                    ["checks", "Review issues"],
                    ["sources", "Explain sources"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    aria-pressed={question === key}
                    disabled={dirty}
                    onClick={() =>
                      dispatch({ type: "QUESTION", question: key })
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="computed-answer" aria-live="polite">
                {question === "change" ? (
                  <p>
                    Accepted revenue{" "}
                    {result.change >= 0 ? "increased" : "decreased"} by{" "}
                    <strong>{money(Math.abs(result.change))}</strong>
                    {result.percent === null
                      ? ". A percentage comparison is unavailable because Week 1 totals zero."
                      : ` (${Math.abs(result.percent).toFixed(1)}%) from Week 1 to Week 2.`}{" "}
                    Flagged rows are excluded from both totals.
                  </p>
                ) : question === "checks" ? (
                  <>
                    <p>
                      {result.flagged.length} records need review before
                      inclusion:
                    </p>
                    <ul>
                      {result.flagged.map((row) => (
                        <li key={row.index}>
                          <button
                            className="text-link"
                            disabled={dirty}
                            onClick={() => source([row.index])}
                          >
                            Row {row.index + 1} / {row.id}
                          </button>
                          : {row.reason}.
                        </li>
                      ))}
                    </ul>
                    {!result.flagged.length && (
                      <p>All records passed these checks.</p>
                    )}
                  </>
                ) : (
                  <p>
                    Each total is the sum of accepted source rows for that
                    period. “View source rows” highlights those exact records.
                    Missing accounts, invalid amounts and repeated IDs are
                    excluded for human review; duplicate detection retains the
                    first occurrence. These checks do not prove that source data
                    is complete or correct.
                  </p>
                )}
              </div>
              <button className="text-link" disabled={dirty} onClick={download}>
                Download checked report <Arrow diagonal />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
