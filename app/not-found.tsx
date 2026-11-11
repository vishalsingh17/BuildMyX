import Link from "next/link";
import { Arrow } from "@/components/icons";

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="not-found container">
      <p className="eyebrow">404 / PAGE NOT FOUND</p>
      <h1>
        Let’s find your
        <br />
        <em>next step.</em>
      </h1>
      <p>
        This address doesn’t lead to a page. You can explore the three services
        or return to your enquiry.
      </p>
      <div className="detail-actions">
        <Link className="button" href="/">
          Back to BuildMyX
          <Arrow />
        </Link>
        <Link href="/#enquire" className="text-link">
          Go to the enquiry form
          <Arrow diagonal />
        </Link>
      </div>
    </main>
  );
}
