import Link from "next/link";
import { Arrow } from "@/components/icons";
import { pageMetadata } from "@/lib/metadata";

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
          <h2 id="privacy-delivery">Copying or sending an enquiry</h2>
          <p>
            When the form offers “Copy enquiry”, it prepares the message on your
            device. Nothing is sent to BuildMyX. Your browser confirms when
            copying succeeds, or provides a selectable message when automatic
            copying is unavailable. You decide where to share it.
          </p>
          <p>
            When sending is enabled, “Send enquiry” submits the fields securely
            to the enquiry service. The first-party service uses Resend to send
            the message to the business inbox and attempts a confirmation email
            to you. The form confirms submission only after the email service
            accepts the business message. This is not a guarantee of final inbox
            delivery. If your confirmation email fails after that, the form says
            so without asking you to submit again.
          </p>
          <p>
            Enquiries are used to assess and respond to your request. Submitted
            messages are handled by the business inbox and its email providers
            under their retention settings. To prevent duplicate sends, Convex
            keeps a random submission reference, a protected fingerprint of the
            message, email-provider references and delivery status for 30 days.
            Message contents are not stored in that database. Shared abuse
            controls use a protected fingerprint of the network address; the raw
            address is not stored there. Inactive abuse-control records are
            removed by scheduled cleanup. Hosting, database and email providers
            may retain technical logs under their own settings.
          </p>
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
            There are no advertising pixels. When PostHog is configured, we
            record page views and selected actions, such as choosing a service,
            trying the demo or submitting an enquiry. Events include clean page
            paths and fixed service or resource labels. Names, email addresses,
            form contents, relevant links, URL query strings and referrers are
            excluded.
          </p>
          <p>
            PostHog uses randomly generated identifiers held only in this tab’s
            memory to connect actions within an open visit. Refreshing or
            closing the page clears those identifiers. This configuration does
            not use analytics cookies, local storage or session storage, create
            person profiles, record sessions or automatically capture form
            interactions. Do Not Track and Global Privacy Control disable
            collection.
          </p>
          <p>
            Analytics can be disabled for a deployment. A separately configured
            activity collector receives the same limited event labels without
            PostHog identifiers. Hosting and analytics providers can observe
            network addresses when handling requests; IP-based enrichment is
            disabled in this PostHog configuration. Provider retention settings
            apply.
          </p>
          <p>
            Your browser makes the normal requests needed to load pages,
            scripts, fonts and the optional demonstration video. Fonts are
            served with the site.
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
