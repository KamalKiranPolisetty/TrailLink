import { Platform } from 'react-native';

// Platform-specific utilities
export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isNative = Platform.OS !== 'web';

// Safe platform-specific imports
export const safeImport = async (nativeModule: () => Promise<any>, webFallback?: any) => {
  if (isWeb) {
    return webFallback || null;
  }
  try {
    return await nativeModule();
  } catch (error) {
    console.warn('Failed to import native module:', error);
    return webFallback || null;
  }
};

// Platform-specific component wrapper
export const PlatformComponent = ({ 
  native, 
  web, 
  children 
}: { 
  native?: React.ComponentType<any>; 
  web?: React.ComponentType<any>; 
  children?: React.ReactNode;
}) => {
  if (isWeb && web) {
    const WebComponent = web;
    return <WebComponent>{children}</WebComponent>;
  }
  
  if (isNative && native) {
    const NativeComponent = native;
    return <NativeComponent>{children}</NativeComponent>;
  }
  
  return children || null;
};

// Safe haptic feedback
export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (isNative) {
    try {
      const Haptics = await import('expo-haptics');
      const feedbackType = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      }[type];
      
      await Haptics.impactAsync(feedbackType);
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }
};

// Safe location services
export const getLocationPermission = async () => {
  if (isNative) {
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.warn('Location services not available:', error);
      return false;
    }
  }
  return false;
};

export const getCurrentLocation = async () => {
  if (isNative) {
    try {
      const Location = await import('expo-location');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      return location.coords;
    } catch (error) {
      console.warn('Failed to get location:', error);
      return null;
    }
  }
  return null;
};