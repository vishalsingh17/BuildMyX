import Link from "next/link";
import { serviceNames, servicePaths, type Mode } from "@/lib/site-config";
import type { ServicePageData } from "@/lib/services";
import { EnquiryLink } from "./enquiry-link";
import { Arrow } from "./icons";
import { PilotPackage } from "./pilot-package";
import { LearningPath } from "./learning-path";

export function ServicePage({ service }: { service: ServicePageData }) {
  return (
    <main
      id="main"
      tabIndex={-1}
      className={`detail-page detail-${service.mode.toLowerCase()}`}
    >
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/#services">Services</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{serviceNames[service.mode]}</span>
        </nav>
        <section className="detail-hero" aria-labelledby="detail-heading">
          <div className="detail-intro">
            <p className="eyebrow">
              <span className="status-dot" />
              {service.category}
            </p>
            <h1 id="detail-heading">{serviceNames[service.mode]}</h1>
            <p className="detail-promise">
              {service.promise[0]}
              <br />
              <em>{service.promise[1]}</em>
            </p>
            <p className="detail-description">{service.intro}</p>
            <div className="detail-actions">
              <EnquiryLink interest={service.interest}>
                {service.cta}
              </EnquiryLink>
              <a href="#details" className="text-link">
                Explore the service
                <Arrow className="arrow-down" />
              </a>
            </div>
            <p className="detail-audience">{service.audience}</p>
          </div>
          <aside className="service-brief" aria-label={service.asideLabel}>
            <span className="small-label">{service.asideLabel}</span>
            <h2>{service.asideTitle}</h2>
            <dl>
              {service.aside.map(([title, description], index) => (
                <div key={title}>
                  <dt>
                    <span>0{index + 1}</span>
                    {title}
                  </dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
            <span className="brief-mark" aria-hidden="true">
              <Arrow diagonal />
            </span>
          </aside>
        </section>
        {service.mode === "AI" && (
          <>
            <PilotPackage />
            <aside className="service-resource">
              <div>
                <h2>Prepare a useful first brief.</h2>
                <p>
                  Map the manual task, sample inputs, quality rules and the
                  result you want.
                </p>
              </div>
              <Link
                className="text-link"
                href="/resources/reporting-readiness/"
              >
                Reporting readiness worksheet <Arrow />
              </Link>
            </aside>
          </>
        )}
        {service.mode === "Team" && (
          <aside className="service-resource">
            <div>
              <h2>Make the requirement concrete.</h2>
              <p>
                Use the employer brief to capture outcomes, essential skills,
                time-zone overlap, budget and decision steps.
              </p>
            </div>
            <Link className="text-link" href="/resources/hiring-brief/">
              Prepare an employer brief <Arrow />
            </Link>
          </aside>
        )}
        <section
          id="details"
          className="detail-offers section-space"
          tabIndex={-1}
          aria-labelledby="offers-heading"
        >
          <div className="detail-section-heading">
            <p className="eyebrow">
              <span className="section-number">01 /</span> WHAT WE CAN WORK ON
            </p>
            <h2 id="offers-heading">{service.offersTitle}</h2>
            <p>{service.offersIntro}</p>
          </div>
          <dl className="detail-offer-list">
            {service.offers.map(([title, description], index) => (
              <div key={title}>
                <dt>
                  <span>0{index + 1}</span>
                  {title}
                </dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </section>
        {service.mode === "Career" && <LearningPath />}
        <aside className="scope-note">
          <span className="small-label">BEFORE WE START</span>
          <div>
            <h2>{service.noteTitle}</h2>
            <p>{service.note}</p>
          </div>
          <Arrow diagonal />
        </aside>
        {service.mode === "Career" && (
          <div className="detail-subjects">
            <span className="small-label">REGISTER YOUR SUBJECT INTEREST</span>
            <span>Data engineering</span>
            <span>Data science</span>
            <span>Applied AI</span>
          </div>
        )}
        {service.mode === "Team" && (
          <aside className="detail-developer-link">
            <div>
              <h2>A developer looking to connect?</h2>
              <p>
                There’s a separate route to share your skills and interests.
              </p>
            </div>
            <Link href="/developers/" className="text-link">
              Explore developer introductions
              <Arrow diagonal />
            </Link>
          </aside>
        )}
      </div>
      <section
        className="detail-process section-space"
        aria-labelledby="process-heading"
      >
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">
              <span className="section-number">02 /</span> THE NEXT STEP
            </p>
            <h2 id="process-heading">{service.processTitle}</h2>
          </div>
          <ol className="steps">
            {service.process.map(([title, description], index) => (
              <li key={title}>
                <span className="step-number">
                  0{index + 1}
                  <Arrow diagonal={index === 2} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section
        className="faq container section-space detail-faq"
        aria-labelledby="service-faq-heading"
      >
        <div>
          <p className="eyebrow">
            <span className="section-number">03 /</span> GOOD TO KNOW
          </p>
          <h2 id="service-faq-heading">A little more detail.</h2>
        </div>
        <div className="faq-list">
          {service.faqs.map((faq, index) => (
            <details name="service-faq" key={faq.question}>
              <summary>
                <span className="faq-index">0{index + 1}</span>
                <h3>{faq.question}</h3>
                <span className="faq-toggle" aria-hidden="true" />
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="detail-cta" aria-labelledby="next-heading">
        <div className="container">
          <div>
            <p className="eyebrow">LET’S MAKE A START</p>
            <h2 id="next-heading">{service.finalTitle}</h2>
            <p>{service.finalDescription}</p>
          </div>
          <EnquiryLink interest={service.interest}>{service.cta}</EnquiryLink>
        </div>
      </section>
      <nav
        className="related-services container"
        aria-label="Other BuildMyX services"
      >
        <span className="small-label">ALSO AT BUILDMYX</span>
        {(["AI", "Career", "Team"] as Mode[])
          .filter((mode) => mode !== service.mode)
          .map((mode) => (
            <Link key={mode} href={servicePaths[mode]}>
              {serviceNames[mode]}
              <Arrow />
            </Link>
          ))}
      </nav>
    </main>
  );
}
