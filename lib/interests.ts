export const interests = [
  { value: "ai", label: "An AI project" },
  { value: "learning", label: "Learning & career support" },
  { value: "hiring", label: "Hiring developers" },
  { value: "developer", label: "Developer introductions" },
] as const;

export type Interest = (typeof interests)[number]["value"];
