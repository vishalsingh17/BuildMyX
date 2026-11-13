# Development and production releases

BuildMyX uses one codebase and two separate deployments. Code and schema move through development before production; customer records and secrets are never copied between them.

| Environment | Git branch | Website                             | Convex                         |
| ----------- | ---------- | ----------------------------------- | ------------------------------ |
| Development | `dev`      | Vercel Preview deployment for `dev` | `tacit-badger-38`              |
| Production  | `main`     | https://build-my-x.vercel.app/      | `kindhearted-hippopotamus-469` |

## What “green flag” means

1. Push changes to `dev`. Vercel builds that commit’s preview website, deploys its backend to development, then publishes the preview.
2. Open a release pull request from `dev` to `main`. `Quality checks` runs TypeScript, unit/Convex tests, the build and production-browser journeys. `Release source` rejects releases from other branches or forks. The `Vercel` check must also be green, proving that the development backend and preview build completed.
3. Review the actual development preview, including a test enquiry in the development database. **Manually merge the release PR using “Create a merge commit” to give the green flag.** Nothing auto-merges a release PR.
4. Vercel builds the production website from the same source tree, deploys its matching backend, then publishes the website. A failed website build cannot change database functions; a backend deployment failure blocks website publication. New schemas must remain compatible with the currently live website while a release builds.
5. After Vercel reports a successful production deployment, `Sync development after release` fast-forwards `dev` to the released commit when possible. It never force-pushes or overwrites newer work. If development has moved ahead, merge `main` into `dev` before preparing the next release.

A failed development check, missing deployment key or unapproved release PR must not reach `main`. The GitHub branch rule described below is required to enforce this; workflow files alone cannot prevent a user from directly pushing to an unprotected branch.

## One-time account setup

These settings need account access and are not stored in Git. Do not approve the first release PR until the branch rule and Vercel keys are configured.

### GitHub branch protection

With a GitHub CLI account/token that has repository **Administration: write** and **Contents: read**, run from this checkout:

```sh
npm ci
npm run release:protect
npm run release:check
```

The setup requires a release pull request, the `Quality checks`, `Release source` and `Vercel` checks, an up-to-date branch, resolved discussions and administrator enforcement on `main`. Force pushes and deletion are disabled. Existing required checks, reviewer counts and actor restrictions are preserved. The sole owner can merge their own checked release PR; a second reviewer is not required by default. The merge itself is the manual approval.

Alternatively configure the same rule in [GitHub branch settings](https://github.com/vishalsingh17/BuildMyX/settings/branches). A 403 “Resource not accessible by integration” means the connected app/token lacks this permission, even if the account itself is a repository administrator. Do not mistake a prepared setup script for an active branch rule.

### Vercel deployment keys

Keep Vercel’s production branch set to `main`. Add a different deployment-scoped `CONVEX_DEPLOY_KEY` to each Vercel environment:

| Vercel scope          | Key must start with                   | Deployment       |
| --------------------- | ------------------------------------- | ---------------- |
| Preview, branch `dev` | `dev:tacit-badger-38\|`               | Development only |
| Production            | `prod:kindhearted-hippopotamus-469\|` | Production only  |

Generate keys in the matching Convex deployment’s settings. The CLI can also save each key to a private local file without printing it:

```sh
umask 077
npx convex deployment token create vercel-development --deployment vishal-singh-6dda1:buildmyx:dev/vishal-singh --save-env /tmp/buildmyx-vercel-development.env
npx convex deployment token create vercel-production --deployment vishal-singh-6dda1:buildmyx:production --save-env /tmp/buildmyx-vercel-production.env
```

Transfer only each file’s `CONVEX_DEPLOY_KEY` value to the matching **Vercel project → Settings → Environment Variables** scope, then remove those temporary files. Never put keys in public `NEXT_PUBLIC_*` variables, pull requests or chat. Use deployment keys, not project-wide keys. If these named keys already exist, manage or rotate them in Convex rather than generating untracked duplicates.

The GitHub browser check uses the Playwright **Google Chrome** channel for the MP4 walkthrough’s media support. It reports progress and has an eight-minute step limit; media and HTTP waits also have explicit timeouts. Local checks can use an installed Chromium or `PLAYWRIGHT_CHANNEL=chrome` when Google Chrome is installed.

`vercel.json` makes `npm run build:deploy` the Vercel build command and allows deployments from `dev` and `main`. The build validates the branch and exact key target before running Convex. It also supplies the matching backend URLs to the website build. Vercel’s Preview runtime defaults to development; Production defaults to production. A development runtime refuses the known production backend URL. Set `APP_ENV=production` explicitly when running a production server outside Vercel.

Redeploy the `dev` preview after saving its key, then check its URL under **Vercel → Deployments → dev**. Its URL is assigned by Vercel; use the actual deployment link shown there.

### Environment differences

- Local work and Preview use the development database. Production uses the production database.
- Development builds disable PostHog and search indexing. Production retains its existing analytics and indexing settings.
- Email credentials stay in the corresponding Convex deployment. Keep `ENQUIRY_EMAIL_TEST_MODE=true` in development and use only test recipients. Production notifications remain unconfigured until Resend is set up.
- `npm run build` and `npm test` validate code without deploying any backend. `npm run build:deploy` is a deployment command and refuses to run without the Vercel target, expected branch and correct deployment key.

## First release and daily use

The initial workflow configuration lives on `dev` and should be reviewed as a release PR. Set up the required account settings, wait for the CI and development preview checks, then review the preview before marking a draft release ready and merging it.

For later changes, update `dev`, let the checks run and use another `dev` → `main` release PR. Never push app changes directly to `main`, copy production data into development, or disable the required checks to make a release pass. An emergency release still goes through development verification and a deliberate merge.

Both environments will run the approved source tree after promotion. Development may then advance with new work while production stays on the last approved release; that is expected. Fix a failed release on `dev` and repeat the process. A frontend rollback does not roll back database schemas or records.
