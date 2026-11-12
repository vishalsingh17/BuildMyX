import { ResourcePage } from "@/components/resource-page";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "Reporting automation readiness brief",
  "Prepare a practical automation brief: map the manual task, inputs, quality rules, acceptance criteria and ownership.",
  "/resources/reporting-readiness/",
);
export default function Readiness() {
  return (
    <ResourcePage
      title="Before you automate,"
      emphasis="make the task clear."
      kind="REPORTING READINESS"
      file="/examples/reporting-readiness.md"
      interest="ai"
      cta="Scope a reporting pilot"
      intro="Use this short worksheet to decide whether one recurring reporting task is a useful first automation project."
      sections={[
        [
          "Map the recurring work",
          "What report is produced, who uses it and how often? Describe the manual steps and where time is spent. Record a baseline rather than guessing a saving.",
        ],
        [
          "Identify the source information",
          "List spreadsheets, systems, owners and access constraints. Prepare a small anonymised sample. Keep credentials and confidential records out of an initial enquiry.",
        ],
        [
          "Define a result you can check",
          "Specify required totals, filters, format and delivery location. Pick a known example and its expected output so a pilot can be accepted objectively.",
        ],
        [
          "Decide how exceptions are handled",
          "Which missing values, duplicates or conflicting records should stop processing? Who reviews them? Keep human approval for decisions that need it.",
        ],
        [
          "Assign ownership after handover",
          "Name a workflow owner. Agree hosting, running costs, support duration, change requests and monitoring separately before starting.",
        ],
      ]}
    />
  );
}
