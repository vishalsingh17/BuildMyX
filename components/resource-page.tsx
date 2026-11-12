"use client";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { EnquiryLink } from "./enquiry-link";
import { Arrow } from "./icons";
import type { Interest } from "@/lib/site-config";
export function ResourcePage({
  title,
  emphasis,
  intro,
  kind,
  file,
  sections,
  interest,
  cta,
}: {
  title: string;
  emphasis: string;
  intro: string;
  kind: string;
  file: string;
  sections: [string, string][];
  interest: Interest;
  cta: string;
}) {
  return (
    <main id="main" tabIndex={-1} className="resource-page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{kind}</span>
      </nav>
      <header className="resource-hero">
        <p className="eyebrow">A USEFUL STARTING POINT / {kind}</p>
        <h1>
          {title}
          <br />
          <em>{emphasis}</em>
        </h1>
        <p>{intro}</p>
        <a
          href={file}
          download
          className="text-link"
          onClick={() =>
            track("resource_download", {
              resource:
                interest === "hiring"
                  ? "employer_brief"
                  : "reporting_readiness",
            })
          }
        >
          Download the editable brief <Arrow diagonal />
        </a>
      </header>
      <ol className="resource-checklist">
        {sections.map(([heading, text], index) => (
          <li key={heading}>
            <span className="section-number">0{index + 1}</span>
            <div>
              <h2>{heading}</h2>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <aside className="resource-next">
        <div>
          <h2>Ready to talk it through?</h2>
          <p>
            Use the brief to prepare your enquiry. A short summary is enough to
            start; keep sensitive information out of the first message.
          </p>
        </div>
        <EnquiryLink interest={interest}>{cta}</EnquiryLink>
      </aside>
    </main>
  );
}
