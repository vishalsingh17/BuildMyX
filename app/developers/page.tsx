import Link from "next/link";
import { EnquiryLink } from "@/components/enquiry-link";
import { Arrow } from "@/components/icons";
import { pageMetadata } from "@/lib/metadata";
import { servicePaths, serviceNames } from "@/lib/site-config";

export const metadata = pageMetadata(
  "Developer introductions",
  "Share your developer skills, experience and interests with BuildMyTeam. Introductions happen when a suitable opportunity and relationship exist.",
  "/developers/",
);

export default function Developers() {
  return (
    <main id="main" tabIndex={-1} className="detail-page developer-page">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={servicePaths.Team}>{serviceNames.Team}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">For developers</span>
        </nav>
        <section className="detail-hero" aria-labelledby="developers-heading">
          <div className="detail-intro">
            <p className="eyebrow">
              <span className="status-dot" />
              {serviceNames.Team.toUpperCase()} / FOR DEVELOPERS
            </p>
            <h1 id="developers-heading" className="developer-title">
              Good work starts
              <br />
              with an <em>introduction.</em>
            </h1>
            <p className="detail-description">
              Tell us what you work with, the experience you bring and the kind
              of work you’re interested in. When a suitable opportunity and
              relationship exist, we can discuss an introduction.
            </p>
            <div className="detail-actions">
              <EnquiryLink interest="developer">Introduce yourself</EnquiryLink>
              <a className="text-link" href="#developer-details">
                What to include
                <Arrow className="arrow-down" />
              </a>
            </div>
            <p className="detail-audience">
              Interest registration · No open roles advertised
            </p>
          </div>
          <aside className="service-brief developer-brief">
            <span className="small-label">A USEFUL INTRODUCTION</span>
            <h2>
              A little context
              <br />
              goes a long way.
            </h2>
            <dl>
              <div>
                <dt>
                  <span>01</span>Your work
                </dt>
                <dd>Core skills and relevant project experience.</dd>
              </div>
              <div>
                <dt>
                  <span>02</span>Your interests
                </dt>
                <dd>The roles and problems you want to work on.</dd>
              </div>
              <div>
                <dt>
                  <span>03</span>Your availability
                </dt>
                <dd>Location, time zone and preferred engagement.</dd>
              </div>
            </dl>
            <span className="brief-mark" aria-hidden="true">
              <Arrow diagonal />
            </span>
          </aside>
        </section>
        <section
          id="developer-details"
          className="detail-offers section-space"
          tabIndex={-1}
          aria-labelledby="developer-details-heading"
        >
          <div className="detail-section-heading">
            <p className="eyebrow">
              <span className="section-number">01 /</span> YOUR STARTING POINT
            </p>
            <h2 id="developer-details-heading">
              Tell us about
              <br />
              the work you do.
            </h2>
            <p>
              A short introduction is enough. Relevant links are optional; use
              them if they help show your experience.
            </p>
          </div>
          <dl className="detail-offer-list">
            <div>
              <dt>
                <span>01</span>Skills and experience
              </dt>
              <dd>
                Describe your main technologies, the kind of systems you have
                worked on and the responsibilities you have taken on.
              </dd>
            </div>
            <div>
              <dt>
                <span>02</span>Evidence of your work
              </dt>
              <dd>
                A portfolio, project, GitHub or professional profile link can
                give context. Share only information you are comfortable
                including in an initial enquiry.
              </dd>
            </div>
            <div>
              <dt>
                <span>03</span>Work you are looking for
              </dt>
              <dd>
                Tell us the roles or projects that interest you, your
                availability, location or time zone and the type of engagement
                you prefer.
              </dd>
            </div>
          </dl>
        </section>
        <aside className="scope-note">
          <span className="small-label">SET EXPECTATIONS</span>
          <div>
            <h2>An introduction depends on a suitable fit.</h2>
            <p>
              This is a way to express interest, rather than an application for
              an advertised role. Referrals are introductions when a suitable
              opportunity and relationship exist. Any introduction, assessment
              or engagement would be discussed with you; employment decisions
              belong to hiring employers.
            </p>
          </div>
          <Arrow diagonal />
        </aside>
        <section
          className="developer-next section-space"
          aria-labelledby="developer-next-heading"
        >
          <div>
            <p className="eyebrow">
              <span className="section-number">02 /</span> WHAT HAPPENS NEXT
            </p>
            <h2 id="developer-next-heading">
              Context first.
              <br />A conversation when there’s a fit.
            </h2>
          </div>
          <ol className="developer-next-list">
            <li>
              <strong>Share your introduction.</strong>
              <p>
                Use the enquiry form’s developer selection and describe your
                skills, interests and availability.
              </p>
            </li>
            <li>
              <strong>Discuss a relevant requirement.</strong>
              <p>
                If a suitable opportunity and relationship exist, discuss the
                work and technical requirements before an introduction.
              </p>
            </li>
            <li>
              <strong>Consider the next step.</strong>
              <p>
                Review fit, assessment and engagement details before deciding
                whether to proceed.
              </p>
            </li>
          </ol>
        </section>
      </div>
      <section className="detail-cta" aria-labelledby="developer-cta-heading">
        <div className="container">
          <div>
            <p className="eyebrow">LET’S MAKE A START</p>
            <h2 id="developer-cta-heading">
              What would you like to build next?
            </h2>
            <p>
              Share your skills, experience and the kind of work that interests
              you.
            </p>
          </div>
          <EnquiryLink interest="developer">Introduce yourself</EnquiryLink>
        </div>
      </section>
      <div className="container employer-return">
        <p>Looking for developers for your business?</p>
        <Link href={servicePaths.Team} className="text-link">
          Explore {serviceNames.Team}
          <Arrow diagonal />
        </Link>
      </div>
    </main>
  );
}
