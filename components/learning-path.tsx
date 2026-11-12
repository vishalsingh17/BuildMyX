import Link from "next/link";
import { EnquiryLink } from "./enquiry-link";
import { Arrow } from "./icons";

/** A scope example, not an advertised scheduled course. */
export function LearningPath() {
  return (
    <section className="learning-path" aria-labelledby="learning-path-heading">
      <div>
        <p className="eyebrow">AN EXAMPLE LEARNING PATH</p>
        <h2 id="learning-path-heading">Learn through a small data project.</h2>
        <p>
          A possible starting point for data engineering: turn a small source
          file into a repeatable, checked report. The actual format,
          prerequisites and depth are agreed for your starting point.
        </p>
        <Link href="/projects/reporting-pipeline/" className="text-link">
          Explore the reporting example <Arrow />
        </Link>
      </div>
      <ol className="learning-path-steps">
        <li>
          <h3>Find your starting point</h3>
          <p>
            Discuss your Python and SQL experience, the work you want to do and
            the fundamentals you need to practise.
          </p>
        </li>
        <li>
          <h3>Build and review</h3>
          <p>
            Work with sample records, check missing values and duplicates, and
            explain the transformations. Use assignment feedback and live
            doubt-clearing to improve the result.
          </p>
        </li>
        <li>
          <h3>Make it repeatable</h3>
          <p>
            Consider reruns, exceptions, tests and a clear handover. Talk
            through your decisions as preparation for project discussions and
            interviews.
          </p>
        </li>
      </ol>
      <div className="learning-registration">
        <p>
          Register your subject, current experience and preferred
          weekend/time-zone availability. Dates, format, prerequisites and any
          fees will be confirmed before you join.
        </p>
        <EnquiryLink interest="learning">
          Register learning interest
        </EnquiryLink>
      </div>
    </section>
  );
}
