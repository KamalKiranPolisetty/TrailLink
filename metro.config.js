const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add platform-specific resolver for native modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Handle native modules that don't work on web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add platform-specific extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx'];

// Platform-specific module resolution
config.resolver.alias = {
  ...config.resolver.alias,
  // Add aliases for problematic native modules on web
  'react-native-maps': require.resolve('./utils/platform-shims/maps.js'),
};

module.exports = config;