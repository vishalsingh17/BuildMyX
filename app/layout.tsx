import type { Metadata } from "next";
import localFont from "next/font/local";
import { siteConfig } from "@/lib/site-config";
import { EnquiryProvider } from "@/components/enquiry-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

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
  robots: { index: false, follow: false }, // Enable after naming clearance and a public launch.
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body id="top">
        <EnquiryProvider>
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
