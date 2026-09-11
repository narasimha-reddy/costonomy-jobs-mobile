// Native modules that have no JS implementation under Jest.
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));
jest.mock('@sentry/react-native', () => ({ init: jest.fn(), setUser: jest.fn(), wrap: (c: unknown) => c }));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
