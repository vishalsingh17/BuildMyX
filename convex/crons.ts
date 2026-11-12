import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.interval(
  "Remove expired delivery metadata",
  { hours: 1 },
  internal.enquiryDelivery.cleanup,
  {},
);
crons.interval(
  "Queue and check owner notifications",
  { minutes: 5 },
  internal.enquiryNotifications.reconcile,
  {},
);
crons.interval(
  "Remove expired enquiries",
  { hours: 1 },
  internal.enquiries.cleanup,
  {},
);
crons.daily(
  "Remove retained email copies",
  { hourUTC: 2, minuteUTC: 0 },
  internal.enquiryNotifications.cleanupEmailCopies,
  {},
);
export default crons;
