import Link from "next/link";
import { Arrow } from "./icons";

export function ReportingExample() {
  return (
    <aside
      className="proof-teaser"
      aria-label="Try the working reporting example"
    >
      <div>
        <span className="small-label">WORKING EXAMPLE / FICTIONAL DATA</span>
        <h4>
          Don’t just read about it.
          <br />
          Follow the numbers.
        </h4>
        <p>
          Edit source records, find data quality issues and trace each weekly
          total back to its inputs.
        </p>
        <Link href="/projects/reporting-pipeline/" className="text-link">
          Try the reporting workflow <Arrow diagonal />
        </Link>
      </div>
      <div className="proof-figures">
        <span>13 records in</span>
        <Arrow />
        <span>3 issues flagged</span>
        <Arrow />
        <strong>2 checked totals</strong>
      </div>
    </aside>
  );
}
