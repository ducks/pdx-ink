# Verification

Tested on real Discourse `2026.9.0-latest`, commit
`768a4ed1cd8e6742fe1c1340a9c4ab01318285ec`, in the isolated `pdx-theme` DV container.
The directory plugin checkout was `4efc0cbd4e649a9bd1aae7a8bbe653f32a3ce2b6`.
The current demonstration also includes the bundled directory layout and initials update.
Core's tracked files were unchanged. Production received no theme or content writes.

## Passed

- The layout update passed all 21 directory controller request tests and Ruby
  lint/format checks. The rendered production initials are DZ, DD, SM, FP, and K.
  All seven checked widths from 320px to 1440px showed correct initials without
  clipping or horizontal overflow; see [`tests/initials.json`](../evidence/tests/initials.json).
- Both ZIP archives imported through Discourse's real ZIP importer, with no
  theme-field errors and supported-version status. Theme and component remain separate.
- Discourse's JavaScript lint configuration passed for all theme/component JavaScript.
- Twenty-eight pages per theme captured in light and dark modes at desktop
  1440 x 1100 and mobile 390 x 844:
  directory homepage, welcome topic, Latest, artist, shop, search, and categories.
  All returned HTTP 200, with no page JavaScript errors, broken images, or horizontal
  overflow. Full-page and first-viewport captures are included.
- Production names, biographies, links, visible ordering, styles, affiliations,
  map location, and welcome topic source/date preserved. Five tattooers and one
  shop appear in both versions. The single public production topic is retained;
  no fictional public discussion was added to the presentation.
  Discourse's native category-description and system topics remain.
- Keyboard directory search, specialization filtering, empty-result handling,
  profile Instagram link, and the real shop map popup passed on both viewport sizes.
- Native community search found the production welcome topic on both sizes.
- Keyboard focus entered interactive controls with a visible outline. Native text
  selection opened the quote toolbar and rich-text composer on desktop and mobile;
  the quote draft was edited and discarded through the interface.
- A separate temporary test topic showed a named unread badge on both sizes.
  Each browser authored a real reply, submitted it through the native composer,
  and verified it survived reload. The test topic and drafts were removed afterward.
- PDX Flash and PDX After Hours rendered the expected light/dark values. The
  native Light, Dark, and Auto header menu worked on both sizes, opened by
  keyboard, and persisted its selection to the server-rendered directory.
- Text contrast examples: light body 13.08:1, light muted text 6.81:1, dark body
  13.97:1, dark muted text 7.92:1, and banner text 8.80:1. Input-border contrast
  is at least 3.10:1 in light mode and 3.74:1 in dark mode.

## Accessibility results and limits

Axe-core 4.11.1 checked WCAG 2 A/AA, 2.1 AA, and 2.2 AA rules against five signed-in
surfaces at two viewport sizes in light and dark modes, first with Foundation,
then with PDX Ink. Raw results are in
[`before/accessibility.json`](../evidence/before/accessibility.json) and
[`after/accessibility.json`](../evidence/after/accessibility.json).

| Surface | Desktop light/dark | Mobile light/dark |
| --- | --- | --- |
| Directory homepage | No violations | No violations |
| Topic | Native notification button contains a focusable link | Same notification issue; two native icon buttons lack names |
| Latest | Same notification issue | Same notification issue; native new-topic button lacks a name |
| Search results | Same notification issue | Same notification issue |
| User profile | No violations | Four native profile navigation links lack accessible names |

All remaining findings also occur with Foundation on this exact Discourse
commit. The theme resolves the measured contrast, inline-link distinction,
search-avatar name, home-link name, notification target size, topic-status
target size, and inline category-link target size findings. The remaining
notification markup and seven unnamed mobile controls per color scheme belong
to native core components; this theme retains their behavior without replacing
large components or manipulating their DOM.

A second signed-in scan with a temporary unread topic covers the last-visit
separator and unread navigation links. It also has no contrast, inline-link, or
target-size violations after the fixes. See
[the unread-state audit](../evidence/after-unread/accessibility.json).
The temporary topic was removed before the final public captures.

This is **not a claim of full WCAG conformance**. Automated scans include
incomplete/manual-review rules; testing used Chromium desktop and Chromium mobile
emulation, not physical iOS/Android devices or a screen-reader matrix. The
production site has one public welcome topic and no profile images, so long
multi-author discussion and image-heavy directory content are not represented
in the presentation. Transient multi-post behavior is covered by the separate
posting/unread test.

Primary interaction evidence:

- [`tests/color-modes.json`](../evidence/tests/color-modes.json)
- [`tests/interactions.json`](../evidence/tests/interactions.json)
- [`tests/verification.json`](../evidence/tests/verification.json)
- [`tests/desktop-quote-composer.png`](../evidence/tests/desktop-quote-composer.png)
- [`tests/mobile-quote-composer.png`](../evidence/tests/mobile-quote-composer.png)
- [`tests/desktop-unread.png`](../evidence/tests/desktop-unread.png)
- [`tests/mobile-unread.png`](../evidence/tests/mobile-unread.png)

The interaction report was captured while resolving the accessibility findings;
the final before/after and unread accessibility reports describe the finished theme.
