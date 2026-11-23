# PDX Ink

An installable Discourse theme and focused editorial component for
**pdx.tattooer.directory**. Coral, lavender, sage, and yellow on an off-white
canvas, with a charcoal dark palette. Bundled Barlow, horizontal search filters,
and colorful first-and-last-initial listing cards keep the directory readable.

The November 23 design refresh takes inspiration from [Damn Zippy](https://www.damnzippy.com/):
space, playful accents, and simple navigation. The star illustration is original;
artist photography and branding have not been copied. This source is installed in
the local `pdx-theme` container at `http://localhost:4301/`. The ZIPs below
are the previous September release and have not been rebuilt for this draft.
Run `node tmp/pdx-ink/scripts/verify-refresh.mjs` inside the container to check
desktop/mobile layouts, light/dark palettes, search, filters, and map popups.
Screenshots and results are written to `evidence/refresh/`.

Built and verified against production's Discourse **2026.9.0-latest**, commit
`768a4ed1cd8e6742fe1c1340a9c4ab01318285ec`. The version validator on that commit
rejects `-latest` in theme metadata, so the installable manifest uses a numeric
minimum of `2026.8.0`. Other releases have not been tested.

The current preview was upgraded on November 23 to Discourse `4b36feff16`
(2026.11.0-latest), Ruby 4.0.9, and PostgreSQL 18.6. Its restored directory is
selected through the native `default_homepage` setting. Browser checks also pass
on this core in desktop/mobile light/dark modes.

## Install

For the current theme, use **Admin > Appearance > Themes > Install > From a Git repository**
with `https://github.com/ducks/pdx-ink` (branch `main`). The repository root contains
`about.json`, as required by Discourse. The PDX Editorial component is a separate
ZIP install; it is not installed automatically from this repository.

### Previous September ZIP release

1. In **Admin > Appearance > Themes**, install `dist/pdx-ink-20260911.zip` using
   **Install > From your device**.
2. Install `dist/pdx-editorial-20260911.zip` the same way. Attach **PDX Editorial**
   to **PDX Ink** in the theme's component list.
3. Select **PDX Flash** as the light palette and **PDX After Hours** as the dark palette.
   Set the site setting **interface color selector** to **header** for the native
   Light/Dark/Auto menu on community pages. Its selection carries over to directory
   pages. Auto follows the system preference; members also have **Preferences > Interface**.
4. Preview PDX Ink. When ready, make it the default theme. To roll back, select
   **Foundation** as the default; the directory records and discussions are unaffected.

The site's existing `discourse-directory` plugin supplies all directory behavior.
No additional plugin or core patch is required. `/directory` remains the homepage;
the community is available at `/latest`. Navigation links in the theme's
`common/header.html` and `common/footer.html` target this site's root-path deployment.
Update these links if installing on a different site or under a URL subfolder.

The filter sidebar, card location rows, and first-and-last initials require the
server-rendered layout update to the existing directory plugin included in
[`patches/discourse-directory-layout.patch`](patches/discourse-directory-layout.patch).
Apply it to plugin commit `4efc0cbd4e649a9bd1aae7a8bbe653f32a3ce2b6` with
`git apply /path/to/pdx-ink/patches/discourse-directory-layout.patch`,
then rebuild Discourse with the updated plugin. The local plugin checkout and
staging already include it. Single-word names keep one initial; shop placeholders
keep their existing behavior. The theme scales the lettering to the card width.

## Editorial configuration

**PDX Editorial > Settings** controls the introduction and optional feature cards
on Latest. `editorial_enabled` turns it off. `features` is an ordered object list
with title, site-relative path, kicker, description, optional image path, alt text,
and visible credit. At most three cards render. The installable component starts
with no selections; the staging setup configures links to the real directory,
shops, and welcome thread.

Selections are labeled **Selected by the editors**. They are manually chosen links,
not popularity rankings or an inference about artists. Only select public
destinations and images you have permission to use. The component does not change
permissions. Invalid external destinations are omitted. Images require alt text.
The theme disables Discourse's built-in welcome banner through a theme-specific
site setting to avoid two competing introductions.

## Reproduce the demonstration

See [the staging guide](docs/STAGING.md). The included snapshot contains the
production site's five tattooers, Heart Eyes Tattoo, public taxonomies, and
welcome topic as read on September 10, 2026. No production credentials, private
topics, member emails, or real member accounts are included.

- [Compare the same staged site before and after](evidence/index.html)
- [Verification details](docs/VERIFICATION.md)
- [Directory design research](docs/DESIGN-REFERENCES.md)
- [Implementation and API references](docs/IMPLEMENTATION.md)
- [Asset and content provenance](docs/PROVENANCE.md)

Theme source is at the repository root; the standalone component is in
`components/pdx-editorial/`. Build installable ZIPs with
`bundle exec ruby scripts/package.rb` from an environment with `rubyzip`.
