# Reproduce staging

## Current preview (November 23)

`pdx-theme` now runs at `http://localhost:4301/` on core `4b36feff16`, Ruby 4.0.9,
and PostgreSQL 18.6. Its database and uploads were restored from the previous
preview, retaining five tattooers, one shop, eight accounts, and PDX Ink.
`default_homepage=directory` serves the directory directly at `/`;
`discourse_directory_as_homepage` is off. `SiteSetting.port` is `4301`.

The previous container is stopped as `pdx-theme-before-core-20261123`.
Database and file backups are under
`~/.local/state/pdx-ink/20261123/core-upgrade/pdx-core-upgrade/`.
The old container retains port 4300 in dv's allocation, so the replacement uses 4301.

For browser checks inside the container, run the loopback proxy with
`PDX_HOST_PORT=4301 node tmp/pdx-ink/scripts/staging-proxy.mjs`, then
`PDX_BASE_URL=http://localhost:4301 node tmp/pdx-ink/scripts/verify-refresh.mjs`.
The steps below document the original September preview reproduction.

Use a fresh local Discourse development instance. The importer refuses production
and requires development's local mail transport at `localhost:1025`. It never
imports SMTP credentials or production accounts. Instagram sync is disabled;
maps use the coordinates already present in the public snapshot.

The captured dataset is deliberately small and exact: five tattooers, one shop,
one public welcome discussion. Native Discourse category-description and system
topics remain. The importer is scoped to this snapshot, not a general database
backup/restore tool. It stops if a future snapshot adds images or additional post
authors, rather than silently losing data or attribution. Production record IDs
and visible ordering are preserved; topic links are resolved from staging IDs.

## Container used for verification

Use the local `discourse-directory` checkout with the included directory layout and initials
update. If starting from its unmodified pinned commit
`4efc0cbd4e649a9bd1aae7a8bbe653f32a3ce2b6`, apply
`patches/discourse-directory-layout.patch` with `git apply` first.

```sh
~/discourse/dv/dv start pdx-theme --host-starting-port 4300
~/discourse/dv/dv run --name pdx-theme -- bash -lc '
  git fetch origin 768a4ed1cd8e6742fe1c1340a9c4ab01318285ec
  git checkout --detach 768a4ed1cd8e6742fe1c1340a9c4ab01318285ec
  bundle install
  pnpm install --frozen-lockfile
'
~/discourse/dv/dv copy ~/dev/discourse-directory pdx-theme:/var/www/discourse/plugins/
~/discourse/dv/dv copy ~/dev/pdx-ink pdx-theme:/var/www/discourse/tmp/
~/discourse/dv/dv run --name pdx-theme -- bin/rails db:migrate
~/discourse/dv/dv run --name pdx-theme --root -- bash -lc 'sed -i "s/^HOME=/DISABLE_MINI_PROFILER=1 HOME=/" /etc/service/rails/run'
~/discourse/dv/dv run --name pdx-theme --root -- sv restart /etc/service/rails /etc/service/ember
```

Inside `/var/www/discourse`, run:

```sh
PDX_DEMO=1 bin/rails runner tmp/pdx-ink/demo/seed.rb
PDX_DEMO=1 bin/rails runner tmp/pdx-ink/demo/install.rb
PDX_DEMO=1 bin/rails runner tmp/pdx-ink/demo/session.rb
```

The installer selects both palettes and enables the native community-header color
selector. Theme activation remains a separate step.

The seed can be rerun. It updates only the snapshot records, matching site settings,
and local test account. Start with a fresh container because it is not intended to
replace an unrelated populated staging database. `session.json` contains a local
test-account session, is excluded from git, and must not be published.

If capturing from inside the container, start the loopback proxy in another shell:

```sh
node tmp/pdx-ink/scripts/staging-proxy.mjs
```

This lets the container's browser resolve the same `localhost:4300` URLs that
Discourse advertises to the host. It proxies to the real Rails server at port 3000;
it does not substitute HTML or mock API responses. From the host, staging is at
`http://localhost:4300/directory`.

## Browser verification and captures

The DV image provides Playwright and Chromium. Install the accessibility checker
in a separate temporary tools directory:

```sh
npm install --prefix /tmp/pdx-test-tools axe-core@4.11.1 --no-audit --no-fund
PDX_DEMO=1 PDX_THEME=foundation bin/rails runner tmp/pdx-ink/demo/activate.rb
PDX_PHASE=before node tmp/pdx-ink/scripts/capture.mjs
PDX_PHASE=before PDX_COLOR_SCHEME=dark node tmp/pdx-ink/scripts/capture.mjs
PDX_PHASE=before node tmp/pdx-ink/scripts/audit-accessibility.mjs
PDX_DEMO=1 PDX_THEME=ink bin/rails runner tmp/pdx-ink/demo/activate.rb
node tmp/pdx-ink/scripts/verify-initials.mjs
node tmp/pdx-ink/scripts/verify-color-modes.mjs
node tmp/pdx-ink/scripts/verify.mjs
node tmp/pdx-ink/scripts/interactions.mjs
PDX_PHASE=after node tmp/pdx-ink/scripts/capture.mjs
PDX_PHASE=after PDX_COLOR_SCHEME=dark node tmp/pdx-ink/scripts/capture.mjs
PDX_PHASE=after node tmp/pdx-ink/scripts/audit-accessibility.mjs
bundle exec ruby tmp/pdx-ink/scripts/package.rb
PDX_DEMO=1 bin/rails runner tmp/pdx-ink/demo/verify-package.rb
```

The interaction script creates a clearly labeled temporary topic, verifies unread
badges and persisted browser-authored replies on desktop and mobile, then removes
the topic and test-account drafts. The matched community captures are made with
that temporary topic absent. If interrupted, run
`PDX_DEMO=1 bin/rails runner tmp/pdx-ink/demo/cleanup-tests.rb` before capturing.

Copy `tmp/pdx-ink/evidence/` and `tmp/pdx-ink/dist/` back to this repository to
refresh the deliverables. Open `evidence/index.html` for a local comparison.

`scripts/snapshot-production.mjs` performs read-only public requests to refresh
directory and public topic data. The included `welcome-source.json` records the
exact raw welcome text read through the owner's MCP connection. Refresh that raw
source too if the production topic changes. The default workflow reproduces the
included snapshot and needs no production credentials.
