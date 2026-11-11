"use client";

import { useState } from "react";
import { Arrow } from "./icons";

const examples = [
  {
    label: "Summarise",
    question: "What changed in this week’s report?",
    answer:
      "Compare reporting periods, flag the differences and explain which information contributed to each change.",
    source: "Weekly report · comparison rows",
  },
  {
    label: "Explain",
    question: "What information is behind that change?",
    answer:
      "Trace a finding back to the relevant spreadsheet rows, with references a person can open and check.",
    source: "Source spreadsheets · referenced rows",
  },
  {
    label: "Review",
    question: "What needs a closer look?",
    answer:
      "Flag missing or inconsistent inputs so a person can review them before relying on the report.",
    source: "Data checks · review notes",
  },
];

export function ReportingExample() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];
  return (
    <div className="ai-example">
      <div className="example-description">
        <span className="small-label">
          ILLUSTRATIVE WORKFLOW / REPORTING ASSISTANT
        </span>
        <h4>
          From spreadsheets <br />
          to a clearer answer.
        </h4>
        <p>
          Bring recurring spreadsheets into a repeatable report, then ask an
          assistant to explain the information behind it.
        </p>
        <p className="example-invitation">
          Choose a question to explore the workflow.
        </p>
      </div>
      <div className="report-example">
        <div className="report-source">
          <svg
            className="document-symbol"
            width="22"
            height="25"
            viewBox="0 0 22 25"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 2h11l5 5v16H3V2Z M14 2v6h5 M6 12h10 M6 16h10 M6 20h7"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
          <div>
            <strong>Weekly reporting</strong>
            <span>Spreadsheets · Agreed business sources</span>
          </div>
          <span className="source-tag">EXAMPLE</span>
        </div>
        <div
          className="example-controls"
          role="group"
          aria-label="Choose an example question"
        >
          {examples.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="example-response" aria-live="polite" aria-atomic="true">
          <p className="example-question">“{example.question}”</p>
          <div className="example-answer">
            <Arrow className="answer-mark" />
            <div>
              <p>{example.answer}</p>
              <span className="source-reference">
                <Arrow diagonal />
                {example.source}
              </span>
            </div>
          </div>
        </div>
        <p className="example-caption">
          An example of what could be built. No live data or AI responses.
        </p>
      </div>
    </div>
  );
}
