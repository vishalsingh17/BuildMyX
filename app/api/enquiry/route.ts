import { deliveryAvailable, handleEnquiry } from "@/lib/server/enquiries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(
      { enabled: await deliveryAvailable() },
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
  return handleEnquiry(request);
}
