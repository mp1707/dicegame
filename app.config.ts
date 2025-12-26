import { ExpoConfig, ConfigContext } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "com.mp17.mpapps.dicegame.dev";
  }
  if (IS_PREVIEW) {
    return "com.mp17.mpapps.dicegame.preview";
  }
  return "com.mp17.mpapps.dicegame";
};

const getAppName = () => {
  if (IS_DEV) {
    return "Dice Game (Dev)";
  }
  if (IS_PREVIEW) {
    return "Dice Game (Preview)";
  }
  return "Dice Game";
};

const SCHEME = IS_DEV
  ? "dicegame-dev"
  : IS_PREVIEW
  ? "dicegame-preview"
  : "dicegame";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "dice-game",
  scheme: SCHEME,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    package: getUniqueIdentifier(),
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: ["expo-dev-client"],
  extra: {
    eas: {
      projectId: "829d31d2-6ecf-43e7-bc3b-af9b4c9cd43b",
    },
  },
  updates: {
    url: "https://u.expo.dev/829d31d2-6ecf-43e7-bc3b-af9b4c9cd43b",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
});
