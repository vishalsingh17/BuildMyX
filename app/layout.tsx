import { canIndexSite } from "@/lib/launch";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { siteConfig } from "@/lib/site-config";
import { EnquiryProvider } from "@/components/enquiry-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Analytics } from "@/components/analytics";
import "./globals.css";
import "./improvements.css";

const sans = localFont({
  src: [
    {
      path: "../public/fonts/manrope-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/manrope-semibold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/manrope-bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});
const serif = localFont({
  src: "../public/fonts/instrument-serif-italic.ttf",
  variable: "--font-serif",
  weight: "400",
  style: "italic",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  title: "BuildMyX — AI development, practical learning & developer sourcing",
  description:
    "BuildMyAI for AI assistants and automation. BuildMyCareer for live learning and career support. BuildMyTeam for developer sourcing. Start with a clear next step.",
  ...(siteConfig.canonicalUrl
    ? {
        metadataBase: new URL(siteConfig.canonicalUrl),
        alternates: { canonical: siteConfig.canonicalUrl },
      }
    : {}),
  robots: {
    index: canIndexSite(
      siteConfig.canonicalUrl,
      siteConfig.launchApproved,
      process.env.VERCEL_ENV || process.env.CONTEXT || process.env.NODE_ENV,
    ),
    follow: true,
  },
  openGraph: {
    title: "BuildMyX — Build something useful",
    description:
      "Reporting automation, practical data learning and developer sourcing.",
    type: "website",
    siteName: "BuildMyX",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body id="top">
        <EnquiryProvider>
          <Analytics />
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Header />
          {children}
          <Footer />
        </EnquiryProvider>
      </body>
    </html>
  );
}
