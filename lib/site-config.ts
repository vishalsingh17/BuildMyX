/** Verified business destinations only. Null settings are never rendered as links. */
export const siteConfig = {
  brand: "BuildMyX",
  founder: "Vishal Singh",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null,
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL?.trim() || null,
  linkedInUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL?.trim() || null,
  canonicalUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || null,
  launchApproved: process.env.NEXT_PUBLIC_LAUNCH_APPROVED !== "false",
  sourceCodeUrl: "https://github.com/vishalsingh17/BuildMyX",
  founderGithubUrl: "https://github.com/vishalsingh17",
  analyticsEndpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT?.trim() || null,
  /** An HTTPS endpoint that validates and delivers enquiries on the server. */
  enquiryEndpoint: process.env.NEXT_PUBLIC_ENQUIRY_ENDPOINT?.trim() || null,
};

// Names cleared by the owner. A canonical production URL is still required for indexing.
export const serviceNames = {
  AI: "BuildMyAI",
  Career: "BuildMyCareer",
  Team: "BuildMyTeam",
} as const;

export type Mode = keyof typeof serviceNames;

export const servicePaths: Record<Mode, string> = {
  AI: "/services/ai/",
  Career: "/services/career/",
  Team: "/services/team/",
};

export const heroModes: Record<
  Mode,
  { sentence: string; cta: string; interest: string }
> = {
  AI: {
    sentence: "Turn recurring spreadsheets into a checked, repeatable report.",
    cta: "Discuss an AI project",
    interest: "ai",
  },
  Career: {
    sentence:
      "Live learning, project feedback and career preparation for data and AI professionals.",
    cta: "Register learning interest",
    interest: "learning",
  },
  Team: {
    sentence:
      "Developer sourcing and technical screening, shaped around your team’s requirements.",
    cta: "Discuss developer needs",
    interest: "hiring",
  },
};

export const interests = [
  { value: "ai", label: "An AI project" },
  { value: "learning", label: "Learning & career support" },
  { value: "hiring", label: "Hiring developers" },
  { value: "developer", label: "Developer introductions" },
] as const;

export type Interest = (typeof interests)[number]["value"];
