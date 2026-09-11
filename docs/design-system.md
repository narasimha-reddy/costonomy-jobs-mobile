# Costonomy Jobs — Mobile Design System

The token and component layer for `costonomy-jobs-mobile`. Everything here is
built to sit alongside `costonomy-mobile-app` (the Costonomy ops app) as a
sibling, not a clone — same family, different job.

**Status:** v0.2 — tokens, primitives and every screen for both roles built
and verified end to end against the API (§9).

---

## 1. The one-paragraph version

Costonomy orange (`#FF6000`) stays the brand. Jobs adds a **teal accent**
(`#0D9488`) because the ops app is a single-colour product where orange means
"tap this," while Jobs renders a *hiring pipeline* where colour also has to carry
meaning — where a candidate is. Type, spacing, radius and elevation scales are
lifted unchanged from the ops app. Two things are genuinely new: a script-aware
font layer, because Hindi ships on day one and Source Sans 3 has no Devanagari,
and a domain status ramp bound to the state machines in
`03-state-machines-permissions.md`.

---

## 2. Colour

### Roles

| Token | Value | Use it for |
|---|---|---|
| `primary` | `#FF6000` | Brand marks, and **at most one** CTA per screen — the thing you came to that screen to do. |
| `accent` | `#0D9488` | Progress, pipeline, secondary actions, selected states, focus rings. |
| `success` / `warning` / `danger` / `info` | unchanged from ops app | Semantic feedback only. Never decoration. |
| `background` `#F9FAFB` / `surface` `#FFFFFF` | unchanged | Page vs. card. |
| `surfaceSunken` `#F3F4F6` | new | A surface that sits *back* from `surface` — a kanban column behind its cards. |

**Why teal.** It is complementary to `#FF6000`, so the two never muddy each
other, and it sits far enough from the existing `info` blue (`#2563EB`) and
`chart6` cyan (`#0891B2`) that a badge can't be mistaken for either. If both
orange and teal did the pipeline work, every screen would be an undifferentiated
wall of orange — which is what a hiring inbox with six status columns would
otherwise become.

### The application status ramp

`ApplicationStatusColors` in `constants/colors.ts`. It reads as a journey rather
than a rainbow:

| Status | Colour | Reading |
|---|---|---|
| `APPLIED` | slate `#64748B` | Submitted; employer hasn't acted. Quiet on purpose. |
| `VIEWED` | blue `#2563EB` | Someone looked. |
| `SHORTLISTED` | **teal** `#0D9488` | First real signal — the accent's home. |
| `INTERVIEW` | violet `#7C3AED` | A scheduled event exists. |
| `SELECTED` | indigo `#4F46E5` | Picked; offer pending. |
| `OFFERED` | **orange** `#FF6000` | The brand moment — what the product exists to produce. |
| `OFFER_ACCEPTED` | emerald `#059669` | Nearly there. |
| `JOINED` | green `#16A34A`, **solid fill** | The North Star metric. The only solid badge in the app. |
| `REJECTED` | red `#DC2626` | Terminal, negative. |
| `WITHDRAWN` | grey `#9CA3AF` | Terminal, *neutral* — a candidate withdrawing is not a failure and must not be coloured like one. |
| `DID_NOT_JOIN` | amber (`warning`) | Terminal. Accepted, then didn't turn up: worth noticing, but not the restaurant's rejection, so not red. |

Cool and quiet while nothing has happened → warming through the advancing middle
→ brand orange at the offer → resolving green.

### Rules

1. **Colour is never the only signal.** Every status badge renders an icon and a
   label too. ~1 in 12 men has a colour-vision deficiency, a screen reader gets
   nothing from a background colour, and the SHORTLISTED/INTERVIEW/SELECTED band
   is deliberately adjacent in hue.
2. **One primary CTA per screen.** If two things look equally primary, neither is.
3. **Semantic colours don't decorate.** Amber means "needs attention," not "this
   card is amber-themed."
4. **The candidate never sees an accusatory colour for a GPS quirk.**
   `CheckInStatusColors` is a restaurant/admin palette. Per PRD §9.9 the employee
   sees a plain "Checked in" whatever the verification returned — see the note on
   `CHECKIN_STATUS_DISPLAY` in `lib/status-display.ts`.

---

## 3. Typography

### Two scripts, one scale

`costonomy-mobile-app` sets Source Sans 3 globally via `Text.defaultProps`. That
would be a **silent failure** here: Source Sans 3 has no Devanagari coverage, so
every Hindi string would fall through to Roboto on Android and a system face on
iOS. No error, no crash — the Hindi build would just quietly lose the brand
typeface and look different on each platform.

So the family is resolved per script:

```
Latin (en)        → Source Sans 3
Devanagari (hi)   → Noto Sans Devanagari
```

Components never import `FontFamily` directly. They call:

```tsx
const { font, lineHeight } = useFontFamily();
<Text style={[styles.title, { fontFamily: font('semibold') }]}>…</Text>
```

`useFontFamily` reads `lib/locale.ts` — a tiny module-level store rather than a
context, because the locale is also needed by non-React code (the API client's
`Accept-Language`, date formatting). That store is the seam the real i18n layer
from `07-localization-search-matching.md` §3 plugs into.

**Adding Telugu later** is one row in `SCRIPT_FONTS` plus one font package.
Nothing that consumes these tokens changes.

### Line height is not shared

Devanagari carries marks above (matras, anusvara) *and* below (halant, subscript
conjuncts) the base line. At Latin multipliers those marks collide with the lines
above and below — the single most common way a "translated" app looks broken.

| Density | Latin | Devanagari |
|---|---|---|
| tight | 1.20 | 1.45 |
| normal | 1.50 | 1.70 |
| relaxed | 1.70 | 1.90 |

### Size scale and presets

Sizes are identical to the ops app (`xs 11 → xxxl 34`). A candidate-facing app
doesn't need bigger type so much as more *space* — that's `Spacing`'s job.

Reach for a `TextStyles` preset before inventing a size/weight pair:
`displayLg`, `displayMd`, `titleLg`, `titleMd`, `body`, `bodyStrong`, `caption`,
`captionStrong`, `overline`, `button`. They carry **no colour** — colour is a
semantic decision the call site makes from `Colors`.

### Layout under translation

Hindi runs 20–40% longer than its English source. Consequences that are already
baked into the primitives, and that any new component must honour:

- Button height is a **`minHeight`**, and labels are not `numberOfLines={1}`. A
  two-line button beats a truncated verb.
- No fixed-width buttons or labels sized to an English string.
- `flexShrink` + ellipsis on anything that genuinely can't wrap.
- Add a pseudo-localisation pass (bracket + pad `en.json`) to CI before real
  Hindi copy exists — `10-testing-cicd-seed-data.md` Part A.

---

## 4. Spacing, touch and elevation

4pt scale, identical to the ops app. The real divergence is `Touch`:

> The ops app is used by trained staff on their own device several times a day,
> so it can afford dense 36–40pt rows. Jobs is used by a candidate standing
> outside a restaurant, one-handed, on a cheap phone, once a week.

**Every interactive element has a 48pt minimum target.** 48 satisfies both
Apple's 44 and Material's 48. The one documented exception is `Chip` at 36pt: it
lives in a horizontally scrolling row where 48 would eat the feed, it is padded
generously on the horizontal axis where the thumb actually travels, and it is
never the only route to an action.

Elevation: `flat` (bordered, no shadow) is the default, because a long list of
shadowed cards turns into visual mud. `sm`/`md` are for cards that genuinely
float above content.

---

## 5. Motion

| Token | ms | Use |
|---|---|---|
| `instant` | 120 | Press feedback, chip toggle |
| `fast` | 200 | Fades, disclosure, inline error appearing |
| `base` | 280 | Sheets, screen transitions |
| `slow` | 400 | Full-screen takeovers, check-in success |
| `skeletonPulse` | 1500 | One breath of a loading skeleton |

Two rules this encodes (`05-mobile-screens.md` §6):

1. Anything with cached content gets a **skeleton**, never a full-screen
   blocking spinner.
2. A press acknowledges within `instant`. Slower reads as a dropped tap on the
   mid-range Android hardware this audience carries — and a dropped tap is how
   you lose an application.

---

## 6. Icons

**Ionicons only.** The ops app mixes Ionicons for chrome and Feather for the tab
bar; Jobs standardises on one set so weights and metrics stay consistent and the
bundle carries one icon font.

---

## 7. Components

All in `components/ui/`, all exported from `components/ui/index.ts`.

| Component | Notes |
|---|---|
| `Button` | `primary` / `accent` / `secondary` / `ghost` / `danger` × `sm` / `md` / `lg`. Loading state stays visually enabled — greying out mid-submit reads as "it failed." |
| `Card` | `padding` × `elevation` × `tone`. `tone="accent"` for a callout that must pull the eye out of a uniform list. |
| `StatusBadge` | Generic semantic pill. `label` is **required**. |
| `ApplicationStatusBadge` &c. | Bound to the backend enums via `lib/status-display.ts`. Screens use these, not the generic badge, so colour/icon/wording are decided once. |
| `StatusTimeline` | The `ApplicationDetail` spine. Renders upcoming steps greyed rather than hiding them — someone at SHORTLISTED needs to see the road ahead. Terminal REJECTED/WITHDRAWN **replaces** the pipeline; they are not step nine of eight. |
| `Chip` | Filter and tag primitive. Employee `JobSearch` and restaurant `CandidateSearch` share it *and* its filter vocabulary, on purpose. With both `onPress` and `onRemove`, the × is a *sibling* of the press target, never a child — nested pressables are `<button>` in `<button>` on web. |
| `TextField` | Errors are **inline, under the field** — never a toast or a top-of-screen summary. 2px focus ring, not a hue change alone: at this saturation a hue shift is hard to see on a cheap LCD in daylight. |
| `Avatar` | Initials fallback, not a silhouette — most people never add a photo, and a wall of identical grey silhouettes would make a hiring inbox unscannable. A photo that fails to load (an expired signed URL) falls back to the same initials. |
| `EmptyState` | Must explain *why* it's empty and offer one specific next action. |
| `Skeleton` / `SkeletonCard` / `SkeletonList` | The loading primitive. |
| `ProgressBar` | Profile completion. Amber below `threshold`, teal above, green at 100 — deliberately **not red**: an incomplete profile is a to-do, not an error (PRD Appendix B). |
| `SectionHeader` | "Recommended for you" / "Nearby". |
| `ScreenContainer` | Caps the column on tablet, renders **nothing** on phone so phone layout is provably unchanged. |

### Adding a component

1. Tokens only — no literal hex, no magic numbers. If you need a value that
   isn't a token, add the token.
2. `useFontFamily()`, never a direct `FontFamily` import.
3. An `accessibilityRole` and a real `accessibilityLabel`.
4. 48pt minimum target, or a comment saying why not.
5. Verify at a 40% longer label. If it truncates, it's not done.

---

## 8. What's deliberately not here

- **Dark mode.** The ops app is `userInterfaceStyle: light` and so is this. The
  tokens are grouped so a theme layer could be added later, but no `useTheme()`
  indirection is paid for until it's actually wanted.
- **A UI kit.** Hand-built `StyleSheet.create`, matching the ops app.
- **A `<Text>` wrapper in `components/ui`.** Primitives compose `StyleSheet` +
  tokens, same as the ops app, so code moves between the two repos without
  translation. Screens *do* use one — `components/app/Txt` — see §9.
- **Charts.** Admin dashboards live in `costonomy-jobs-web`. `chart1–8` exist in
  the palette for when they're needed.

---

## 9. Screens

Two layers sit on top of the primitives:

- **`components/ui/`** — the portable primitives above.
- **`components/app/`** — app-specific composition: `Screen` (safe area, scroll,
  sticky footer for the one CTA), `Header`/`LargeTitle`, `Sheet` (bottom sheet),
  `Controls` (list rows, option cards, chip groups, select sheets), `Pieces`
  (job card, tags, amount input, day and time pickers), `HiringCards`,
  `NotificationList`, `TabBar`, `Feedback` (toast, error view), `Media`
  (`EditableAvatar`, `DocumentRow`), `MyDocuments`, `ContactSheet` and `Txt`.

**Action sheets use `ListRow`s, not `OptionCard`s.** An option card has a radio and
means "pick one"; a menu of actions (take a photo, remove) is a list.

**Never nest pressables.** A button inside a button is invalid HTML on web and
ambiguous to screen readers. Where a row has its own trailing action (a document's
"…", a Find Staff card's Contact), the action is a sibling of the row's press
target.

**Why screens use `Txt`.** Forty screens each calling `useFontFamily()` is forty
chances to forget one, and a forgotten one renders Hindi in the platform fallback
face. `Txt` takes a `variant` from the type scale and picks the script-correct
family and line height.

### Route map

| Group | Routes |
|---|---|
| `(auth)` | `welcome` (language) → `phone` → `otp` |
| First run | `intent` (find a job / hire), `onboarding/candidate` (5 steps), `onboarding/restaurant` (2 steps) |
| Candidate tabs | `candidate/` feed · `applications` · `alerts` · `profile` |
| Restaurant tabs | `restaurant/` jobs · `staff` (find staff) · `interviews` · `alerts` · `business` |
| Shared detail | `jobs/[id]`, `jobs/search`, `applications/[id]`, `interviews/[id]`, `offers/[id]`, `check-in`, `settings/*`, `profile/*` |
| Hiring | `hiring/jobs/[id]` (pipeline), `hiring/applications/[id]`, `schedule`, `offer`, `joining`, `job-form`, `restaurant`, `outlets`, `team` |

`Stack.Protected` guards `(auth)` and `(app)` on the session, so signing out, or
a refresh token being rejected, lands on `welcome` without per-screen checks.

### Data

- `lib/api/` — typed client over the `{data, error, meta}` envelope. One retry
  after a `TOKEN_EXPIRED` refresh (single-flight); any other 401 signs out.
- `lib/session.ts` — tokens, the active role (candidate or restaurant) and
  restaurant, in SecureStore (localStorage on web).
- `lib/queries.ts` — React Query keys and hooks per resource. Mutations
  invalidate by key prefix rather than patching caches by hand.
- `lib/media.ts` — picking and uploading. Photos are cropped square, resized to
  720px and re-encoded as JPEG on the phone (a 4 MB camera photo becomes ~150 KB,
  and HEIC becomes something the API accepts). `upload()` asks the API for a signed
  URL, PUTs the file straight to storage, and returns the token that attaches it.
- `lib/format.ts` — rupees with Indian grouping, and dates. The server sends UTC
  `LocalDateTime` without an offset; `parseServerDate` is the only place that
  knows that. Weekday and month names come from the *app* language, never the
  device's.
- `locales/{en,hi}.json` — `npm run lint:locales` checks the two have the same
  keys. `MessageKey` is derived from `en.json`, so a typo'd key is a type error.

### Running it

```bash
# API (dev profile seeds demo data; OTPs are written to its log)
cd ../costonomy-jobs-api && mvn spring-boot:run -Dspring-boot.run.profiles=dev
# App — press w for web, or scan with Expo Go on the same network
npx expo start
```

The API URL defaults to the Expo dev host on port 8080; override with
`EXPO_PUBLIC_API_URL`. Demo logins: owner `+919000000001`, candidate
`+919000000101`.

### Photos, documents and contact

- **Profile photo** — tap the avatar on Profile: camera, gallery, or remove.
- **Restaurant logo** — tap the logo on the Restaurant tab (owners and admins).
- **Resume and certificates** — Profile → *Resume & certificates*. One resume
  (a new one replaces it), any number of certificates, each named. Shared only with
  restaurants the candidate applies to; shown on the restaurant's candidate screen.
- **Contact** — *Show phone number* on a candidate's application, and *Contact* on
  each Find Staff card. The number is fetched only when asked for: every reveal is
  recorded and counts toward a daily limit. Call and WhatsApp from the sheet.

### Not built yet

- **Push.** FCM needs a native build with a Firebase config; the alerts tab
  polls the unread count every 30 seconds instead.
- **In-app chat.** Contact is a phone number until then, as the backlog specifies.
