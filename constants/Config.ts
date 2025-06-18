import Constants from 'expo-constants';

// Environment-based configuration
const ENV = {
  development: {
    BACKEND_URL: 'http://192.168.4.34:5000',
    API_TIMEOUT: 10000,
  },
  staging: {
    BACKEND_URL: 'https://your-staging-backend-url.com',
    API_TIMEOUT: 15000,
  },
  production: {
    BACKEND_URL: 'https://your-production-backend-url.com',
    API_TIMEOUT: 15000,
  },
};

// Determine current environment
const getEnvironment = () => {
  if (__DEV__) return 'development';
  if (Constants.expoConfig?.extra?.environment === 'staging') return 'staging';
  return 'production';
};

const currentEnv = getEnvironment();

export const Config = {
  ...ENV[currentEnv],
  ENVIRONMENT: currentEnv,
  APP_VERSION: Constants.expoConfig?.version || '1.0.0',
  IS_DEV: __DEV__,
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: Config.BACKEND_URL,
  TIMEOUT: Config.API_TIMEOUT,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export default Config;