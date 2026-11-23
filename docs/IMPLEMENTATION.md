# Implementation

## Target inspected before implementation

Production's public generator meta tag reported Discourse `2026.9.0-latest`,
commit `768a4ed1cd8e6742fe1c1340a9c4ab01318285ec`. Staging was checked out to this
exact commit, dependencies installed, and migrations run before visual tests.

The existing directory uses server-rendered ERB in core's `no_ember` layout.
That layout includes theme styles, `header.html`, and `footer.html`. The theme
styles the plugin's `.directory-*` classes; it never changes models or routes.
The plugin index adds a toolbar, a labeled filter aside, and a result header.
Cards show the existing neighborhood data separately from specialization tags,
with a profile link label. Directory search, map pins, filtering, taxonomy, affiliations, and links remain
the plugin's existing features.

Person-card initials use a small update to the existing plugin's ERB helper and
card partial. It takes the first and last word of the curated display name, or
one initial for a single-word name. This behavior is server-rendered; the theme
only scales its typography using the card's inline-size container. The plugin
update and its request test are bundled in `patches/`.

Community additions use `apiInitializer` and `api.renderInOutlet`:

- `home-logo-contents`: renders the compact wordmark inside the existing home link.
- `search-results-topic-avatar-wrapper`: retains the native avatar helper and user
  card behavior while giving the target core's unnamed avatar link an accessible name.
- `discovery-list-controls-above`: renders a Glimmer component only on unfiltered
  `discovery.latest`. The component uses Ember's router service and outlet args.
- The existing `interface_color_selector=header` site setting enables core's
  Light/Dark/Auto menu. Its cookie also applies to the server-rendered directory.
- `theme_site_settings.enable_welcome_banner`: disables the standard welcome
  banner for this theme only.

The non-Ember header retains its original accessible link and site-name image;
a CSS mask supplies the theme wordmark visually. Core's accessible image remains
in the accessibility tree. The mask is a bundled SVG, with no external request.

No MutationObserver, DOM rewrites, `modifyClass`, replacement topic-list renderer,
new plugin, or core patch is used. The composer and topic actions retain native
Discourse behavior. CSS is based on semantic, existing class hooks and custom
properties, with a narrow set of structural overrides. There is no build step
for the theme itself, no remote font request, and no runtime dependency outside
Discourse. Barlow fonts are bundled as theme assets. A system sans-serif fallback is used
while they load. Palette-specific custom properties are compiled in
`common/color_definitions.scss` using the target core's `dark-light-choose`; the
light and dark palettes are assigned through Discourse's theme configuration.

## Primary references

- [Discourse theme development](https://meta.discourse.org/t/developing-discourse-themes-theme-components/93648)
- [Using outlets](https://meta.discourse.org/t/theme-developer-tutorial-4-using-outlets-to-insert-and-replace-content/357799)
- [Target's no_ember layout](https://github.com/discourse/discourse/blob/768a4ed1cd8e6742fe1c1340a9c4ab01318285ec/app/views/layouts/no_ember.html.erb)
- [Target's plugin API](https://github.com/discourse/discourse/blob/768a4ed1cd8e6742fe1c1340a9c4ab01318285ec/frontend/discourse/app/lib/plugin-api.gjs)
- [Target's color-mode service](https://github.com/discourse/discourse/blob/768a4ed1cd8e6742fe1c1340a9c4ab01318285ec/frontend/discourse/app/services/interface-color.js)
- [Target's discovery outlets](https://github.com/discourse/discourse/blob/768a4ed1cd8e6742fe1c1340a9c4ab01318285ec/frontend/discourse/app/components/discovery/layout.gjs)

On upgrades, re-import on staging and run the browser checks. Pay particular
attention to topic-list, composer, and directory class changes.
