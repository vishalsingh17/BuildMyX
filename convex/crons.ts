import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.interval(
  "Remove expired delivery metadata",
  { hours: 1 },
  internal.enquiryDelivery.cleanup,
  {},
);
export default crons;
