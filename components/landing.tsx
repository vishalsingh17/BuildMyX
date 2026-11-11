"use client";

import Link from "next/link";
import {
  type Interest,
  serviceNames,
  servicePaths,
  siteConfig,
} from "@/lib/site-config";
import { faqs } from "@/lib/content";
import { useEnquiry } from "./enquiry-provider";
import { ReportingExample } from "./reporting-example";
import { Hero } from "./hero";
import { EnquiryForm } from "./enquiry-form";
import { Arrow } from "./icons";

export function Landing() {
  const { setInterest } = useEnquiry();
  const enquiryLink = (value: Interest, text: string, extra = "") => (
    <a
      className={`text-link ${extra}`}
      href="#enquire"
      onClick={() => setInterest(value)}
    >
      {text}
      <Arrow diagonal />
    </a>
  );

  return (
    <>
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
              <h2 id="services-heading">
                AI projects. Learning goals.
                <br />
                The people to build with.
              </h2>
              <p>
                Choose the starting point that fits your goal.
                <br className="desktop-break" /> We’ll work out the next step
                together.
              </p>
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
              <h3 id="ai-heading">{serviceNames.AI}</h3>
              <p className="service-tagline">
                Less repetitive work. <br />
                More useful information.
              </p>
              <span className="service-audience">
                FOR BUSINESSES & SMALL TEAMS
              </span>
            </div>
            <div className="service-detail">
              <p className="service-lead">AI that works with your business.</p>
              <p>
                Start with a specific problem: information that’s hard to find,
                a report that takes too long, or a workflow that needs too much
                copying and pasting.
              </p>
              <dl className="offer-list">
                <div>
                  <dt>Answers from your own information</dt>
                  <dd>
                    Internal knowledge and data assistants that retrieve
                    information and show the sources behind an answer.
                  </dd>
                </div>
                <div>
                  <dt>Workflows that do the legwork</dt>
                  <dd>
                    Automate repeat tasks, connect data and tools, and use
                    agents to carry out agreed actions.
                  </dd>
                </div>
                <div>
                  <dt>Applications built around the task</dt>
                  <dd>
                    AI-enabled apps, data integrations and reporting automation
                    that fit the way your team works.
                  </dd>
                </div>
              </dl>
              <div className="service-actions">
                {enquiryLink("ai", "Discuss an AI project")}
                <Link
                  href={servicePaths.AI}
                  className="text-link secondary-link"
                >
                  Explore AI services
                  <Arrow />
                </Link>
              </div>
            </div>
            <div className="pilot-strip">
              <span className="small-label">START SMALL. MAKE IT USEFUL.</span>
              <p>
                A scoped pilot, with an agreed problem, deliverables, acceptance
                criteria and support window.
              </p>
              <Arrow diagonal className="pilot-arrow" />
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
              <h3 id="career-heading">{serviceNames.Career}</h3>
              <p className="service-tagline">
                Learn it. Build it. <br />
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
                Live weekend learning, assignments you can put into practice,
                and feedback on the work you build. Initial teaching draws on
                hands-on data engineering experience.
              </p>
              <dl className="offer-list">
                <div>
                  <dt>Learn with support</dt>
                  <dd>
                    Live doubt-clearing, practical assignments and reviewed
                    projects, with a roadmap for what to learn next.
                  </dd>
                </div>
                <div>
                  <dt>Prepare for your next application</dt>
                  <dd>
                    CV and LinkedIn feedback, mock interviews and guidance on
                    your applications.
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
                  href={servicePaths.Career}
                  className="text-link secondary-link"
                >
                  Explore learning & career support
                  <Arrow />
                </Link>
              </div>
              <p className="service-footnote">
                Future workshops & cohorts · Remote · UK / Europe audience
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
              <h3 id="team-heading">{serviceNames.Team}</h3>
              <p className="service-tagline">
                Good people. <br />A considered fit.
              </p>
              <span className="service-audience">
                FOR BUSINESSES BUILDING THEIR TEAMS
              </span>
            </div>
            <div className="service-detail">
              <p className="service-lead">Tell us who your team needs.</p>
              <p>
                Define the role, source relevant developers, assess technical
                fit and coordinate introductions and engagement details around
                your requirements.
              </p>
              <dl className="offer-list">
                <div>
                  <dt>Start with the work and the role</dt>
                  <dd>
                    Clarify skills, responsibilities and ways of working before
                    sourcing and technical assessment.
                  </dd>
                </div>
                <div>
                  <dt>Make the introduction count</dt>
                  <dd>
                    Review fit, meet suitable developers and agree the
                    engagement. Clients pay BuildMyX for developers supplied to
                    their teams, on agreed terms.
                  </dd>
                </div>
              </dl>
              <div className="service-actions">
                {enquiryLink("hiring", "Discuss developer needs")}
                <Link
                  href={servicePaths.Team}
                  className="text-link secondary-link"
                >
                  Explore developer sourcing
                  <Arrow />
                </Link>
              </div>
              <div className="developer-route">
                <p>
                  <strong>A developer looking to connect?</strong> Share your
                  skills and interests. Referrals are introductions when a
                  suitable opportunity and relationship exist.
                </p>
                {enquiryLink("developer", "Introduce yourself")}
                <Link href="/developers/" className="text-link">
                  How developer introductions work
                  <Arrow />
                </Link>
              </div>
            </div>
          </article>
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
              <div>
                <h2 id="approach-heading">
                  A clear next step.
                  <br />
                  Before a big commitment.
                </h2>
              </div>
            </div>
            <ol className="steps">
              <li>
                <span className="step-number">
                  01 <Arrow />
                </span>
                <h3>Share the goal.</h3>
                <p>
                  Tell us about your business problem, learning interests or
                  developer requirements. A short description is enough to
                  begin.
                </p>
              </li>
              <li>
                <span className="step-number">
                  02 <Arrow />
                </span>
                <h3>Agree the shape.</h3>
                <p>
                  For projects, define the pilot and acceptance criteria. For
                  learning, confirm the format and schedule. For hiring, agree
                  the role and engagement.
                </p>
              </li>
              <li>
                <span className="step-number">
                  03 <Arrow diagonal />
                </span>
                <h3>Build, then review.</h3>
                <p>
                  Review delivered work against the scope, get feedback on a
                  learning project, or meet suitable developers and agree what
                  happens next.
                </p>
              </li>
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
              BuildMyX brings together the work I know and the things I want to
              help people build.
            </p>
            <p>
              My background is in Python, SQL, Spark, Databricks, Azure and
              production data pipelines. That experience shapes the approach:
              understand the information, make the work repeatable, and check
              the result.
            </p>
            <div className="expertise-list" aria-label="Technical background">
              <span>Python</span>
              <span>SQL</span>
              <span>Spark</span>
              <span>Databricks</span>
              <span>Azure</span>
            </div>
            <div className="pipeline-example">
              <span className="small-label">
                EXAMPLE PROJECT / A REPORTING PIPELINE
              </span>
              <div className="pipeline">
                <span>Source data</span>
                <Arrow />
                <span>Checks & transforms</span>
                <Arrow />
                <span>Useful report</span>
              </div>
              <p>
                An illustrative pattern: bring data together, check its quality,
                then produce a report that can be reviewed and repeated.
              </p>
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
                Share a little context and take the first step.
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
                <a className="text-link" href={siteConfig.bookingUrl}>
                  Book a conversation
                  <Arrow diagonal />
                </a>
              )}
            </div>
            <EnquiryForm />
          </div>
        </section>
      </main>
    </>
  );
}
