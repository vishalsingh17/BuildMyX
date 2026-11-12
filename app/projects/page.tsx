import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";
import { EnquiryLink } from "@/components/enquiry-link";
import { Arrow } from "@/components/icons";
export const metadata = pageMetadata(
  "Working examples of reporting automation",
  "Try a real sample-data reporting workflow: editable inputs, validation, checked totals and source tracing. Explore a focused BuildMyAI pilot.",
  "/projects/",
);
export default function ProjectsPage() {
  return (
    <main id="main" tabIndex={-1} className="resource-page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Working examples</span>
      </nav>
      <header className="resource-hero">
        <p className="eyebrow">SEE THE WORK, THEN START THE CONVERSATION</p>
        <h1>
          Useful work.
          <br />
          <em>Open to inspection.</em>
        </h1>
        <p>
          Try a functioning example, inspect its inputs and see how the result
          was produced. These are demonstrations using fictional data, not
          client case studies.
        </p>
      </header>
      <article className="project-feature">
        <div>
          <span className="small-label">01 / REPORTING & DATA QUALITY</span>
          <h2>From recurring spreadsheets to a checked report.</h2>
          <p>
            A small reporting pipeline that finds missing values and duplicate
            records, calculates weekly totals and links each result to its
            source rows.
          </p>
          <ul className="plain-list">
            <li>Edit the sample inputs and rerun the workflow.</li>
            <li>Review three deliberately seeded data issues.</li>
            <li>Download a report with its source references.</li>
          </ul>
          <Link className="button" href="/projects/reporting-pipeline/">
            Try the reporting workflow <Arrow diagonal />
          </Link>
        </div>
        <div className="project-visual" aria-label="Example workflow stages">
          <span>13 source records</span>
          <Arrow className="arrow-down" />
          <span>Validation + exception review</span>
          <Arrow className="arrow-down" />
          <strong>2 traceable weekly totals</strong>
          <small>Fictional data · working calculations</small>
        </div>
      </article>
      <aside className="resource-next">
        <div>
          <h2>Does this resemble a task in your team?</h2>
          <p>
            Share the recurring work, where its inputs live and what a useful
            output would look like.
          </p>
        </div>
        <EnquiryLink interest="ai">Discuss your workflow</EnquiryLink>
      </aside>
    </main>
  );
}
