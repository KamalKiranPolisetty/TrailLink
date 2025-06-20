module.exports = {
  expo: {
    name: "TrailLink",
    slug: "traillink",
    platforms: ["ios", "android"],
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "traillink",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.traillink.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "We need your location to show nearby treks and provide navigation.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "We need your location to show nearby treks and provide navigation.",
        NSCameraUsageDescription: "We need camera access to let you take photos for your trek posts.",
        NSPhotoLibraryUsageDescription: "We need photo library access to let you select images for your trek posts."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.traillink.app",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow TrailLink to use your location to show nearby treks and provide navigation."
        }
      ],
      "expo-secure-store",
      [
        "expo-image-picker",
        {
          photosPermission: "The app accesses your photos to let you share them in trek posts."
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "your-eas-project-id-here"
      }
    }
  }
};