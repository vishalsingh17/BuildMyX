/** Streaming avoids Vercel's 4.5 MB buffered response limit for large indexes. */
export function referenceJsonResponse(
  value: unknown,
  headers: HeadersInit = {},
): Response {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let offset = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }
      const end = Math.min(offset + 32 * 1024, bytes.length);
      controller.enqueue(bytes.subarray(offset, end));
      offset = end;
    },
  });
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  return new Response(body, { headers: responseHeaders });
}
