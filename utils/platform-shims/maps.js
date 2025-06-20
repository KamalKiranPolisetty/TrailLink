import { Platform } from 'react-native';

// Platform-specific shim for react-native-maps
if (Platform.OS === 'web') {
  // Web fallback - simple div component
  module.exports = {
    default: ({ children, style, ...props }) => {
      const React = require('react');
      const { View, Text } = require('react-native');
      
      return React.createElement(View, {
        style: [
          {
            backgroundColor: '#f0f0f0',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
          },
          style
        ]
      }, [
        React.createElement(Text, { key: 'map-placeholder' }, 'Map not available on web'),
        children
      ]);
    },
    Marker: ({ children, ...props }) => {
      const React = require('react');
      const { View } = require('react-native');
      return React.createElement(View, props, children);
    }
  };
} else {
  // Native platforms - use actual react-native-maps
  module.exports = require('react-native-maps');
}