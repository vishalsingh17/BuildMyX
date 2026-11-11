/** Verified business destinations only. Null settings are never rendered as links. */
export const siteConfig = {
  brand: "BuildMyX",
  founder: "Vishal Singh",
  contactEmail: null as string | null,
  bookingUrl: null as string | null,
  linkedInUrl: null as string | null,
  canonicalUrl: null as string | null,
  /** An HTTPS endpoint that validates and delivers enquiries on the server. */
  enquiryEndpoint: null as string | null,
};

// Working names: complete naming clearance before making the site public.
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
    sentence:
      "AI assistants and automation, connected to the data and tools your business uses.",
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
