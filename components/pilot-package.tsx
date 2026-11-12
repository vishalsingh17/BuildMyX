import Link from "next/link";
import { EnquiryLink } from "./enquiry-link";
import { Arrow } from "./icons";

export function PilotPackage() {
  return (
    <section
      className="pilot-package"
      id="pilot"
      aria-labelledby="pilot-heading"
    >
      <div>
        <p className="eyebrow">A FOCUSED FIRST PROJECT</p>
        <h2 id="pilot-heading">
          One reporting workflow.
          <br />
          <em>A clear way forward.</em>
        </h2>
        <p>
          For small teams repeatedly cleaning spreadsheets, rebuilding the same
          report or checking figures by hand.
        </p>
        <div className="detail-actions">
          <EnquiryLink interest="ai">Scope a reporting pilot</EnquiryLink>
          <Link href="/projects/reporting-pipeline/" className="text-link">
            Try the working example <Arrow />
          </Link>
        </div>
        <p className="pilot-price">
          Quoted after scoping. The fee, timeline and acceptance criteria are
          agreed before work starts.
        </p>
      </div>
      <div className="pilot-deliverables">
        <h3>What we agree together</h3>
        <dl>
          <div>
            <dt>A defined input and output</dt>
            <dd>
              One recurring workflow, its data sources, a sample input and the
              report your team needs.
            </dd>
          </div>
          <div>
            <dt>Checks you can review</dt>
            <dd>
              Validation rules, exception handling and traceable calculations
              tested against an agreed sample.
            </dd>
          </div>
          <div>
            <dt>A usable handover</dt>
            <dd>
              Working code or workflow, setup instructions, a walkthrough and a
              named person to take ownership.
            </dd>
          </div>
          <div>
            <dt>Support with clear limits</dt>
            <dd>
              An agreed defect support window. Ongoing monitoring, changes and
              maintenance can be scoped separately.
            </dd>
          </div>
        </dl>
        <p>
          Additional integrations, hosting, model usage and continuing support
          are scoped explicitly. An AI assistant is included only when it helps
          the agreed task.
        </p>
      </div>
    </section>
  );
}
