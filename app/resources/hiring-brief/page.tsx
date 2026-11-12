import { ResourcePage } from "@/components/resource-page";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "Prepare a developer hiring brief",
  "Clarify outcomes, technical skills, budget, location and engagement terms before developer sourcing with BuildMyTeam.",
  "/resources/hiring-brief/",
);
export default function HiringBrief() {
  return (
    <ResourcePage
      title="A clearer role."
      emphasis="A better starting point."
      kind="EMPLOYER BRIEF"
      file="/examples/developer-hiring-brief.md"
      interest="hiring"
      cta="Discuss developer needs"
      intro="Define the work and the practical constraints before a search starts. This brief helps BuildMyTeam assess whether it can support your requirement."
      sections={[
        [
          "What should this person deliver?",
          "Describe the product, current team, responsibilities and the first useful outcome. Explain whether you need individual delivery, technical leadership or a mix.",
        ],
        [
          "Which skills are essential?",
          "Separate must-have production experience from skills that can be learned. Include the stack, seniority and how technical fit should be assessed.",
        ],
        [
          "How will the engagement work?",
          "State location or remote policy, time-zone overlap, hours, expected duration and start window. Include any access, security or eligibility requirements.",
        ],
        [
          "What budget and decision process apply?",
          "Share a budget or rate range, who will review candidates and the interview stages. Commercial terms and payment to BuildMyX are agreed before supply.",
        ],
        [
          "What needs confirming before an introduction?",
          "Agree assessment criteria, consent to share candidate information, availability and responsibilities. Sourcing does not guarantee that a suitable developer is available.",
        ],
      ]}
    />
  );
}
