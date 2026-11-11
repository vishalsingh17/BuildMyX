import Link from "next/link";
import { Arrow } from "@/components/icons";
import { pageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata = pageMetadata(
  "Privacy & enquiries",
  "How the BuildMyX enquiry form handles your details, draft and clipboard message.",
  "/privacy/",
);

export default function Privacy() {
  return (
    <main id="main" tabIndex={-1} className="information-page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Privacy & enquiries</span>
      </nav>
      <header className="information-heading">
        <p className="eyebrow">A LITTLE CLARITY</p>
        <h1>
          Your details.
          <br />
          <em>Your enquiry.</em>
        </h1>
        <p>
          This explains what the enquiry form does with the information you
          enter.
        </p>
      </header>
      <div className="information-content">
        <section aria-labelledby="privacy-information">
          <h2 id="privacy-information">What the form asks for</h2>
          <p>
            Your name, email address, area of interest and a short description
            are required. Company and relevant links are optional. Share the
            context needed for the enquiry; please leave out confidential
            business information and sensitive personal details.
          </p>
        </section>
        <section aria-labelledby="privacy-draft">
          <h2 id="privacy-draft">Your draft while you browse</h2>
          <p>
            Your draft is held in memory in the open browser tab. Following the
            website’s links lets you read about a service and return to the form
            with your entries intact. It is not saved to cookies, local storage
            or session storage. Refreshing or closing the page clears that
            draft.
          </p>
        </section>
        <section aria-labelledby="privacy-delivery">
          <h2 id="privacy-delivery">
            {siteConfig.enquiryEndpoint
              ? "When you send an enquiry"
              : "When you copy an enquiry"}
          </h2>
          {siteConfig.enquiryEndpoint ? (
            <p>
              Submitting the form sends the details you entered to the
              configured enquiry service so BuildMyX can respond. Delivery is
              confirmed only after a successful response. If delivery cannot be
              confirmed, the form keeps your entries and offers a copy option.
            </p>
          ) : (
            <>
              <p>
                The form currently prepares a message on your device. It does
                not send your enquiry to BuildMyX. “Copy enquiry” asks your
                browser to put that message on your clipboard and confirms only
                when the copy succeeds.
              </p>
              <p>
                If automatic copying is unavailable, a selectable version
                appears in the form. You decide where to paste or share the
                message. Once shared through another service, that service’s
                handling of the message also applies.
              </p>
            </>
          )}
        </section>
        <section aria-labelledby="privacy-controls">
          <h2 id="privacy-controls">What you control</h2>
          <p>
            You can edit your entries, change the service selection or leave the
            page without submitting anything. Copying a message does not deliver
            it. Your clipboard may keep copied content after you leave this
            site; manage it using your device’s controls.
          </p>
        </section>
        <section aria-labelledby="privacy-tracking">
          <h2 id="privacy-tracking">Website activity</h2>
          <p>
            This site includes no advertising pixels or analytics integration.
            Your browser still makes the normal requests needed to load the
            website’s pages, scripts and fonts. Fonts are served with the site
            rather than requested from a third-party font service.
          </p>
        </section>
        <Link href="/#enquire" className="text-link">
          Back to your enquiry
          <Arrow />
        </Link>
      </div>
    </main>
  );
}
