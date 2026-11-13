<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Owner release policy

- Work on `dev` or a feature branch targeting `dev`. `main` is production.
- Do not push app changes directly to `main` or automatically merge a release PR.
- Before promotion, require the development checks and development Vercel preview to pass, and have the owner review development and give the green flag. The documented approval is manually merging a `dev` → `main` release PR.
- Keep a release in draft while required account settings, checks or development verification are incomplete. Account setup confirmation is not approval to release.
- Use the matching deployment-scoped Convex key. Keep production records and secrets separate from development.
- Verify that the GitHub branch protection is active; workflow files alone do not enforce it. Report permission/configuration blockers without bypassing the gate.
- Follow [the environment and release guide](docs/environments-and-releases.md). Production deployment commands also follow the installed Convex deployment guard.
