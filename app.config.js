module.exports = {
  expo: {
    name: "Viandas",
    slug: "viandas-cook",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "viandas",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Viandas usa tu ubicacion para avisar el estado del reparto mientras esta activo.",
        },
      ],
      "@react-native-community/datetimepicker",
      [
        "expo-notifications",
        {
          color: "#DC2626",
        },
      ],
    ],
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#FFF8EE",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.viandas.cook",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        UIBackgroundModes: ["location", "remote-notification"],
        NSLocationWhenInUseUsageDescription:
          "Viandas usa tu ubicacion para enviar actualizaciones durante el reparto.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Viandas usa tu ubicacion en segundo plano solo mientras hay un reparto activo.",
      },
    },
    android: {
      package: "com.viandas.cook",
      googleServicesFile: "./google-services.json",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "POST_NOTIFICATIONS",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFF8EE",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8080",
      router: {},
      eas: {
        projectId: "af955ca6-fe3e-43c7-b5fc-8c68b2ac9b56",
      },
    },
    owner: "lucas-enriquez-dev",
  },
};
