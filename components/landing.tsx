"use client";
import Link from "next/link";
import { type Interest, siteConfig } from "@/lib/site-config";
import { faqs } from "@/lib/content";
import { track } from "@/lib/analytics";
import { useEnquiry } from "./enquiry-provider";
import { ReportingExample } from "./reporting-example";
import { PilotPackage } from "./pilot-package";
import { Hero } from "./hero";
import { EnquiryForm } from "./enquiry-form";
import { Arrow } from "./icons";

export function Landing() {
  const { setInterest } = useEnquiry();
  const enquiryLink = (value: Interest, text: string) => (
    <a
      className="text-link"
      href="#enquire"
      onClick={() => {
        setInterest(value);
        track("cta_click", { interest: value, placement: "home_service" });
      }}
    >
      {text}
      <Arrow diagonal />
    </a>
  );
  return (
    <main id="main" tabIndex={-1}>
      <Hero onInterest={setInterest} />
      <section
        id="services"
        className="services container section-space"
        aria-labelledby="services-heading"
      >
        <div className="section-heading">
          <p className="eyebrow">
            <span className="section-number">01 /</span> WHAT WE DO
          </p>
          <div>
            <h2>
              Make the work easier.
              <br />
              Build what comes next.
            </h2>
            <p>Three starting points. Each with a clear next step.</p>
          </div>
        </div>
        <article
          id="ai"
          className="service service-ai"
          tabIndex={-1}
          aria-labelledby="ai-heading"
        >
          <div className="service-identity">
            <span className="service-number">01</span>
            <p className="service-category">
              <span className="status-dot" /> AI DEVELOPMENT
            </p>
            <h3 id="ai-heading">BuildMyAI</h3>
            <p className="service-tagline">
              Less repetitive work.
              <br />
              More useful information.
            </p>
            <span className="service-audience">
              FOR BUSINESSES & SMALL TEAMS
            </span>
          </div>
          <div className="service-detail">
            <p className="service-lead">
              Start with the report you rebuild every week.
            </p>
            <p>
              Bring scattered data together, check its quality and create a
              repeatable output. Extend the workflow with grounded answers or
              AI-enabled tools when the task calls for them.
            </p>
            <dl className="offer-list">
              <div>
                <dt>Reporting & workflow automation</dt>
                <dd>
                  Data integrations, repeatable reports and agreed actions
                  across your tools.
                </dd>
              </div>
              <div>
                <dt>Assistants & applications</dt>
                <dd>
                  Find answers in your information, show sources and build
                  around the way your team works.
                </dd>
              </div>
            </dl>
            <div className="service-actions">
              {enquiryLink("ai", "Discuss an AI project")}
              <Link href="/services/ai/" className="text-link secondary-link">
                Explore AI services <Arrow />
              </Link>
            </div>
          </div>
          <ReportingExample />
        </article>
        <article
          id="career"
          className="service service-career"
          tabIndex={-1}
          aria-labelledby="career-heading"
        >
          <div className="service-identity">
            <span className="service-number">02</span>
            <p className="service-category">LEARNING & CAREER DEVELOPMENT</p>
            <h3 id="career-heading">BuildMyCareer</h3>
            <p className="service-tagline">
              Learn it. Build it.
              <br />
              Talk through what’s next.
            </p>
            <span className="service-audience">
              FOR ASPIRING & WORKING PROFESSIONALS
            </span>
          </div>
          <div className="service-detail">
            <p className="service-lead">
              Practical learning, with someone to ask.
            </p>
            <p>
              Future live weekend learning, practical assignments, reviewed
              projects and doubt-clearing. Initial teaching draws on hands-on
              data engineering experience.
            </p>
            <dl className="offer-list">
              <div>
                <dt>A path from practice to preparation</dt>
                <dd>
                  Project feedback and a learning roadmap, plus CV and LinkedIn
                  reviews, mock interviews and application guidance.
                </dd>
              </div>
            </dl>
            <div className="subject-tags" aria-label="Subject interests">
              <span>Data engineering</span>
              <span>Data science</span>
              <span>Applied AI</span>
            </div>
            <div className="service-actions">
              {enquiryLink("learning", "Register learning interest")}
              <Link
                href="/services/career/"
                className="text-link secondary-link"
              >
                Explore learning & career support <Arrow />
              </Link>
            </div>
            <p className="service-footnote">
              Future workshops & cohorts · Remote · UK / Europe audience
              <br />
              Dates, format and any fees confirmed before you join.
            </p>
          </div>
        </article>
        <article
          id="team"
          className="service service-team"
          tabIndex={-1}
          aria-labelledby="team-heading"
        >
          <div className="service-identity">
            <span className="service-number">03</span>
            <p className="service-category">DEVELOPER SOURCING</p>
            <h3 id="team-heading">BuildMyTeam</h3>
            <p className="service-tagline">
              Good people.
              <br />A considered fit.
            </p>
            <span className="service-audience">
              FOR BUSINESSES BUILDING THEIR TEAMS
            </span>
          </div>
          <div className="service-detail">
            <p className="service-lead">
              Define the work. Find the right skills.
            </p>
            <p>
              Clarify your role, source relevant developers, assess technical
              fit and coordinate introductions. Clients pay BuildMyX for
              developers supplied to their teams on agreed terms.
            </p>
            <div className="service-actions">
              {enquiryLink("hiring", "Discuss developer needs")}
              <Link href="/services/team/" className="text-link secondary-link">
                Explore developer sourcing <Arrow />
              </Link>
            </div>
            <Link
              href="/resources/hiring-brief/"
              className="text-link brief-link"
            >
              Prepare an employer brief <Arrow />
            </Link>
            <div className="developer-route">
              <p>
                <strong>A developer looking to connect?</strong> Share your
                skills and interests. Introductions depend on a suitable
                opportunity, fit and relationship.
              </p>
              {enquiryLink("developer", "Introduce yourself")}
              <Link href="/developers/" className="text-link">
                How developer introductions work <Arrow />
              </Link>
            </div>
          </div>
        </article>
        <PilotPackage />
      </section>
      <section
        id="approach"
        className="approach section-space"
        tabIndex={-1}
        aria-labelledby="approach-heading"
      >
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">
              <span className="section-number">02 /</span> HOW WE START
            </p>
            <h2 id="approach-heading">
              A clear next step.
              <br />
              Before a big commitment.
            </h2>
          </div>
          <ol className="steps">
            {[
              [
                "Share the goal.",
                "Describe your recurring task, learning starting point or developer requirement. A short summary is enough to begin.",
              ],
              [
                "Agree the shape.",
                "Confirm project scope and acceptance criteria, a suitable learning format, or the role and engagement terms.",
              ],
              [
                "Build, then review.",
                "Review the result against the scope, get feedback on your work, or meet suitable developers and agree what comes next.",
              ],
            ].map(([title, description], index) => (
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
        className="founder container section-space"
        aria-labelledby="founder-heading"
      >
        <div className="founder-intro">
          <p className="eyebrow">
            <span className="section-number">03 /</span> THE PERSON BEHIND THE
            WORK
          </p>
          <h2 id="founder-heading">
            Technical by background.
            <br />
            <em>Practical by nature.</em>
          </h2>
          <div className="founder-signature">
            <span className="founder-monogram" aria-hidden="true">
              VS
            </span>
            <div>
              <strong>Vishal Singh</strong>
              <span>Founder, BuildMyX</span>
            </div>
          </div>
        </div>
        <div className="founder-detail">
          <p className="founder-lead">
            Understand the information. Make the work repeatable. Check the
            result.
          </p>
          <p>
            My background is in Python, SQL, Spark, Databricks, Azure and
            production data pipelines. That experience shapes the projects and
            learning support at BuildMyX.
          </p>
          <div className="expertise-list" aria-label="Technical background">
            {["Python", "SQL", "Spark", "Databricks", "Azure"].map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
          <div className="founder-links">
            <a href={siteConfig.founderGithubUrl} className="text-link">
              Vishal on GitHub <Arrow diagonal />
            </a>
            <Link href="/projects/" className="text-link">
              Explore the working example <Arrow />
            </Link>
            {siteConfig.linkedInUrl && (
              <a href={siteConfig.linkedInUrl} className="text-link">
                LinkedIn <Arrow diagonal />
              </a>
            )}
          </div>
        </div>
      </section>
      <section
        className="faq container section-space"
        aria-labelledby="faq-heading"
      >
        <div>
          <p className="eyebrow">
            <span className="section-number">04 /</span> A FEW DETAILS
          </p>
          <h2 id="faq-heading">Before we talk.</h2>
          <p>What to expect from the first step.</p>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details key={faq.question} name="faq">
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
      <section
        id="enquire"
        className="enquiry section-space"
        tabIndex={-1}
        aria-labelledby="enquiry-heading"
      >
        <div className="container enquiry-layout">
          <div className="enquiry-intro">
            <p className="eyebrow">
              <span className="section-number">05 /</span> LET’S MAKE A START
            </p>
            <h2 id="enquiry-heading">
              What’s your <em>X?</em>
            </h2>
            <p>
              A task you want to simplify.
              <br />
              Something you want to learn.
              <br />
              Someone your team needs.
            </p>
            <p className="enquiry-subtext">
              Share a little context. We’ll review fit and clarify the next step
              before any commitment.
            </p>
            <div className="enquiry-mark" aria-hidden="true">
              <Arrow diagonal />
            </div>
            {siteConfig.contactEmail && (
              <a
                className="text-link"
                href={`mailto:${siteConfig.contactEmail}`}
              >
                {siteConfig.contactEmail}
                <Arrow diagonal />
              </a>
            )}
            {siteConfig.bookingUrl && (
              <a
                className="text-link"
                href={siteConfig.bookingUrl}
                onClick={() => track("booking_click", { placement: "contact" })}
              >
                Book a conversation <Arrow diagonal />
              </a>
            )}
          </div>
          <EnquiryForm />
        </div>
      </section>
    </main>
  );
}
