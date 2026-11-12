import {
  intakeAvailable,
  handleEnquiryIntake,
} from "@/lib/server/enquiry-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(
      { enabled: await intakeAvailable() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { enabled: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  return handleEnquiryIntake(request);
}
