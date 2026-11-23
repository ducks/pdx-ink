# Asset and content provenance

| Item | Source | Use |
| --- | --- | --- |
| Five tattooers, one shop, biographies, Instagram links, taxonomy, and map coordinates | Public pages on `https://pdx.tattooer.directory`, captured 2026-09-10; full URLs are recorded in `demo/production/snapshot.json` | Local staging copy, explicitly requested by the site owner |
| Welcome topic | Public topic `/t/5`; raw source read through the owner's Discourse MCP connection and saved in `demo/welcome-source.json` | Staging copy preserves system attribution, text, and date |
| Wordmark SVG | Original vector typography and simple star mark created for this theme; `assets/wordmark.svg` | Bundled theme identity; no third-party artwork |
| Barlow Regular, Barlow SemiBold, Barlow Condensed Bold | [Google Fonts Barlow](https://github.com/google/fonts/tree/main/ofl/barlow), [Barlow Condensed](https://github.com/google/fonts/tree/main/ofl/barlowcondensed), by Jeremy Tribby; downloaded 2026-09-11 | Unmodified TTF files bundled under the SIL Open Font License in `assets/fonts/OFL.txt`; no external font requests |
| Four-point ornament SVG | Original geometric vector authored for this theme, `assets/ornament.svg` | Decorative banner and initials panels; no third-party tattoo design |
| Core logo, avatars, emoji, and icons | The matching Discourse installation | Native Discourse assets and behavior |
| Map tiles | Existing directory configuration, OpenStreetMap tile service | Attribution retained by the existing Leaflet map |
| Before/after images | Playwright screenshots of the same local Discourse database | Evidence only; no compositing or fabricated UI |

Production had no tattooer or shop images in this snapshot. The theme uses the
first-and-last-initial placeholders. No generated tattoo artwork, scraped Instagram
image, invented artist, endorsement, review, booking status, or fictional
discussion appears in the delivered demonstration.

Site content remains the property of its respective owners. The snapshot is
included for this site's staging/review workflow, not as an openly licensed
content dataset. Obtain appropriate permission before distributing it publicly.

The font binaries and original SVGs are recorded in the root `SHA256SUMS`.
Directory-theme references informed the layout; their code, images, and branding
are not included. See [design research](DESIGN-REFERENCES.md).
