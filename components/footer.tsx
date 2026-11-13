import Link from "next/link";
import { serviceNames, servicePaths, siteConfig } from "@/lib/site-config";
import { Brand } from "./brand";
import { Arrow } from "./icons";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link href="/" className="brand-link" aria-label="BuildMyX home">
              <Brand />
            </Link>
            <p>Build something useful.</p>
          </div>
          <nav aria-label="Footer navigation">
            <Link href={servicePaths.AI}>{serviceNames.AI}</Link>
            <Link href={servicePaths.Career}>{serviceNames.Career}</Link>
            <Link href={servicePaths.Team}>{serviceNames.Team}</Link>
            <Link href="/projects/">Working examples</Link>
            <Link href="/resources/reporting-readiness/">
              Reporting readiness
            </Link>
            <Link href="/resources/hiring-brief/">Employer brief</Link>
            <a href="/learn/" target="_blank" rel="noopener noreferrer">
              Free learning library ↗
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <Link href="/developers/">For developers</Link>
            <Link href="/#approach">Our approach</Link>
            <Link href="/#enquire">Contact</Link>
            {siteConfig.linkedInUrl && (
              <a href={siteConfig.linkedInUrl}>
                LinkedIn
                <Arrow diagonal />
              </a>
            )}
          </nav>
          <a href="#top" className="back-top">
            BACK TO TOP <Arrow className="arrow-up" />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getUTCFullYear()} BuildMyX</span>
          <span>AI development. Practical learning. Developer sourcing.</span>
          <Link href="/privacy/">Privacy & enquiries</Link>
        </div>
      </div>
    </footer>
  );
}
