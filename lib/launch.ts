/** Search indexing belongs to a cleared site with a real HTTPS production URL. */
export function canIndexSite(
  url: string | null,
  approved: boolean,
  stage?: string,
): boolean {
  if (
    !approved ||
    !url ||
    ["preview", "development", "deploy-preview", "branch-deploy"].includes(
      stage ?? "",
    )
  )
    return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname !== "localhost" &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}
