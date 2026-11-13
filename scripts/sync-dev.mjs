import { pathToFileURL } from "node:url";

export async function syncDevelopment(
  { repository, token, mainSha },
  fetcher = fetch,
) {
  if (
    repository !== "vishalsingh17/BuildMyX" ||
    !/^[a-f0-9]{40}$/.test(mainSha ?? "") ||
    !token
  )
    throw new Error(
      "Expected BuildMyX repository, main commit and workflow token.",
    );
  const request = async (path, method = "GET", body) => {
    const response = await fetcher(
      `https://api.github.com/repos/${repository}/${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    // A developer may advance dev while the sync is running. Never force the update.
    if (method === "PATCH" && response.status === 422) return { skipped: true };
    if (!response.ok)
      throw new Error(`GitHub ${method} ${path} failed (${response.status}).`);
    return response.json();
  };
  const main = await request("git/ref/heads/main");
  if (main.object.sha !== mainSha)
    return "This deployment is not the current production commit; no branches changed.";
  const dev = await request("git/ref/heads/dev");
  if (dev.object.sha === mainSha)
    return "Development already matches production.";
  const comparison = await request(`compare/${dev.object.sha}...${mainSha}`);
  if (comparison.status !== "ahead")
    return "Development contains newer work; no commits were overwritten. Merge main into dev before its next release.";
  const result = await request("git/refs/heads/dev", "PATCH", {
    sha: mainSha,
    force: false,
  });
  if (result.skipped) {
    const current = await request("git/ref/heads/dev");
    if (current.object.sha !== dev.object.sha)
      return "Development advanced during synchronization; no commits were overwritten.";
    throw new Error(
      "GitHub rejected development synchronization. Check its branch rules and workflow permissions.",
    );
  }
  return "Development fast-forwarded to the approved production commit.";
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(
    await syncDevelopment({
      repository: process.env.GITHUB_REPOSITORY,
      token: process.env.GH_TOKEN,
      mainSha: process.env.RELEASE_SHA,
    }),
  );
}
