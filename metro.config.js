// Sentry's Metro config adds debug IDs to the bundle, so a crash in a release
// build resolves to a real file and line once source maps are uploaded.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
