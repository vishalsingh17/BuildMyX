import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";
import { ReportingDemo } from "@/components/reporting-demo";
import { PilotPackage } from "@/components/pilot-package";
import { Arrow } from "@/components/icons";
export const metadata = pageMetadata(
  "Try a checked reporting workflow",
  "Edit fictional reporting data, detect quality issues, calculate totals and trace results to source rows in a working browser demo.",
  "/projects/reporting-pipeline/",
);
export default function ReportingPage() {
  return (
    <main id="main" tabIndex={-1} className="resource-page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/projects/">Working examples</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Reporting workflow</span>
      </nav>
      <header className="resource-hero">
        <p className="eyebrow">BUILDMYAI / WORKING EXAMPLE</p>
        <h1>
          Follow the numbers.
          <br />
          <em>Trust the process.</em>
        </h1>
        <p>
          See a repeatable reporting workflow turn imperfect records into totals
          with visible checks and sources. Try it yourself below.
        </p>
        <a
          className="text-link"
          href={`${siteConfig.sourceCodeUrl}/blob/main/lib/reporting.ts`}
        >
          Inspect the calculation code <Arrow diagonal />
        </a>
      </header>
      <ReportingDemo />
      <section
        className="demo-walkthrough"
        aria-labelledby="walkthrough-heading"
      >
        <div>
          <p className="eyebrow">WATCH THE WORKFLOW</p>
          <h2 id="walkthrough-heading">A short, actual walkthrough.</h2>
          <p>The recording uses this same demo and fictional data.</p>
          <ol className="plain-list">
            <li>
              Run checks to exclude a missing account, an invalid amount and a
              duplicate ID.
            </li>
            <li>Compare £4,200 with £5,000 and inspect the source records.</li>
            <li>Change an input, rerun and verify the new total.</li>
          </ol>
        </div>
        <video
          controls
          preload="none"
          poster="/demos/reporting-poster.jpg"
          aria-label="Reporting workflow demonstration"
        >
          <source src="/demos/reporting-walkthrough.mp4" type="video/mp4" />
          <track
            default
            kind="captions"
            src="/demos/reporting-captions.vtt"
            srcLang="en"
            label="English"
          />
          Your browser does not support this video. Follow the written steps
          alongside it.
        </video>
      </section>
      <section className="demo-boundaries">
        <h2>What this proves — and what a pilot adds.</h2>
        <p>
          This example demonstrates deterministic validation, aggregation and
          source tracing in the browser. It does not connect to business
          systems, process confidential data or call an AI model. A real pilot
          would agree access, security, data rules and acceptance tests for your
          workflow. A language-model explanation would need separate grounding
          and evaluation.
        </p>
      </section>
      <PilotPackage />
    </main>
  );
}
