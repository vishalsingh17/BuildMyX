import { deliveryConfig, handleEnquiry } from "@/lib/server/enquiries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { enabled: !!deliveryConfig() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  return handleEnquiry(request);
}
