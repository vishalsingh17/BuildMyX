export const requiredChecks = ["Quality checks", "Release source", "Vercel"];
type Protection = {
  required_status_checks?: {
    strict?: boolean;
    contexts?: string[];
    checks?: { context: string; app_id?: number | null }[];
  };
  enforce_admins?: { enabled: boolean };
  required_pull_request_reviews?: {
    dismissal_restrictions?: {
      users?: { login: string }[];
      teams?: { slug: string }[];
    };
    dismiss_stale_reviews?: boolean;
    require_code_owner_reviews?: boolean;
    required_approving_review_count?: number;
    require_last_push_approval?: boolean;
    bypass_pull_request_allowances?: {
      users?: { login: string }[];
      teams?: { slug: string }[];
      apps?: { slug: string }[];
    };
  };
  restrictions?: {
    users?: { login: string }[];
    teams?: { slug: string }[];
    apps?: { slug: string }[];
  };
  required_linear_history?: { enabled: boolean };
  block_creations?: { enabled: boolean };
  lock_branch?: { enabled: boolean };
  allow_fork_syncing?: { enabled: boolean };
  required_conversation_resolution?: { enabled: boolean };
};
function actors(value: NonNullable<Protection["restrictions"]>) {
  return {
    users: value.users?.map((user) => user.login) ?? [],
    teams: value.teams?.map((team) => team.slug) ?? [],
    apps: value.apps?.map((app) => app.slug) ?? [],
  };
}
export function releaseProtection(existing: Protection | null) {
  const checks =
    existing?.required_status_checks?.checks?.map((check) => ({ ...check })) ??
    [];
  for (const context of existing?.required_status_checks?.contexts ?? [])
    if (!checks.some((check) => check.context === context))
      checks.push({ context });
  for (const context of requiredChecks)
    if (!checks.some((check) => check.context === context))
      checks.push({ context });
  const reviews = existing?.required_pull_request_reviews;
  return {
    required_status_checks: { strict: true, checks },
    enforce_admins: true,
    required_pull_request_reviews: {
      // Merging the checked release PR is the owner's green flag; a sole owner can merge their own PR.
      dismiss_stale_reviews: true,
      require_code_owner_reviews: reviews?.require_code_owner_reviews ?? false,
      required_approving_review_count:
        reviews?.required_approving_review_count ?? 0,
      require_last_push_approval: reviews?.require_last_push_approval ?? false,
      ...(reviews?.dismissal_restrictions
        ? {
            dismissal_restrictions: {
              users:
                reviews.dismissal_restrictions.users?.map(
                  (user) => user.login,
                ) ?? [],
              teams:
                reviews.dismissal_restrictions.teams?.map(
                  (team) => team.slug,
                ) ?? [],
            },
          }
        : {}),
      ...(reviews?.bypass_pull_request_allowances
        ? {
            bypass_pull_request_allowances: actors(
              reviews.bypass_pull_request_allowances,
            ),
          }
        : {}),
    },
    restrictions: existing?.restrictions ? actors(existing.restrictions) : null,
    required_linear_history:
      existing?.required_linear_history?.enabled ?? false,
    block_creations: existing?.block_creations?.enabled ?? false,
    lock_branch: existing?.lock_branch?.enabled ?? false,
    allow_fork_syncing: existing?.allow_fork_syncing?.enabled ?? false,
    required_conversation_resolution: true,
    allow_force_pushes: false,
    allow_deletions: false,
  };
}
export function releaseIsProtected(value: Protection | null) {
  const checks = value?.required_status_checks;
  return Boolean(
    value?.enforce_admins?.enabled &&
    value.required_pull_request_reviews &&
    checks?.strict &&
    requiredChecks.every(
      (context) =>
        checks.contexts?.includes(context) ||
        checks.checks?.some((check) => check.context === context),
    ),
  );
}
