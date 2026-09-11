# costonomy-jobs-mobile — TODO

What is still open, as of 11 Sept 2026. Items are ordered within each section by
what blocks the most.

## Push notifications — waiting on Firebase setup

The API side is built (`costonomy-jobs-api/docs/push-fcm.md`). Until this is done
the Alerts tab polls the unread count every 30 seconds.

**To provide:**
- [ ] Firebase project ID
- [ ] Android app registered with package `com.costonomy.jobs` → `google-services.json`
- [ ] iOS app registered with bundle ID `com.costonomy.jobs` → `GoogleService-Info.plist`
- [ ] APNs key (.p8) created in the Apple Developer account and uploaded to Firebase
      (Project settings → Cloud Messaging), with its Key ID and Team ID
- [ ] Service account key (JSON), role *Firebase Cloud Messaging API Admin* only;
      *Firebase Cloud Messaging API* (V1) enabled in Google Cloud. Store outside the
      repos; set as `FCM_SERVICE_ACCOUNT_JSON` on the server
- [ ] Expo account signed in (`npx eas login`), and a test phone (Android is quickest)
- [ ] Confirm `com.costonomy.jobs` as the permanent app id

**Then build:**
- [ ] `eas.json` and a development build (push does not work in Expo Go)
- [ ] `expo-notifications` for permission and display; `@react-native-firebase/messaging`
      for the token (iOS must send an FCM token, not the raw APNs token)
- [ ] Add the `expo-notifications` plugin with `icon: ./assets/notification-icon.png`
      (already drawn) and `color: #FF6000`
- [ ] `POST /devices` after sign-in and on token refresh; send the token on logout
- [ ] Route a tapped notification by `entityType` / `entityId`, same as the Alerts list
- [ ] Ask for notification permission at a moment that explains itself (after the
      first application or first job posted), not on first launch

## Before a store release

- [x] App icon, adaptive icon, splash, notification icon and favicon
- [x] Account deletion — Settings → Delete account (`POST /users/me/delete-request`)
- [x] Build profiles (`eas.json`: development, preview, production). A release build
      refuses to start without an https `EXPO_PUBLIC_API_URL`
- [ ] **To provide:** the staging and production API URLs, then
      `eas env:create --environment preview|production --name EXPO_PUBLIC_API_URL`
- [ ] Run on real Android and iOS phones: camera, document picker, location check-in
      and secure storage have only been exercised on web
- [x] Crash reporting — Sentry in the app and the API, off until a DSN is set; no
      personal data, phone numbers masked, signed-URL query strings stripped
- [ ] **To provide:** a Sentry project for each (app, API) → `EXPO_PUBLIC_SENTRY_DSN`
      in the EAS environments, `SENTRY_DSN` on the server; `SENTRY_AUTH_TOKEN` in EAS
      for source-map upload

## Gaps against the screen spec (`05-mobile-screens.md`) — done

- [x] Find Staff filters: area, skills/cuisine, expected pay, joining time; one-tap
      "widen your search" suggestions when nothing matches
- [x] Job search filters: pay, skills
- [x] Skill level (learning / good / expert)
- [x] Edit a work-history entry, with an optional description
- [x] Change a team member's role or outlets (ownership only by an owner)
- [x] "Job posted — share it" after posting, and Share in the job menu

## Quality

- [x] Automated tests — `npm test` (Jest): formatting, translations, the API client's
      session handling, uploads, crash-report scrubbing, Chip and Avatar
- [x] Offline state: one app-wide banner; queries pause offline and refetch on reconnect

## P1 from the backlog

- [x] In-app messages — one thread per application, in the Inbox tab (Updates · Messages).
      The phone-number reveal stays for Find Staff candidates who have not applied
- [x] Repost a closed job — job menu → Repost job, opens the copy to review and post
- [x] Post one vacancy to several outlets at once — pick more than one outlet on the job form
