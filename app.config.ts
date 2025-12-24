import { ExpoConfig, ConfigContext } from "expo/config";

const APP_VARIANT = process.env.APP_VARIANT as
  | "development"
  | "preview"
  | "production"
  | undefined;

const getBundleId = (): string => {
  switch (APP_VARIANT) {
    case "development":
      return "com.mp17.mpapps.dicegame.dev";
    case "preview":
      return "com.mp17.mpapps.dicegame.preview";
    case "production":
    default:
      return "com.mp17.mpapps.dicegame";
  }
};

const getAppName = (): string => {
  switch (APP_VARIANT) {
    case "development":
      return "Dice Game (Dev)";
    case "preview":
      return "Dice Game (Preview)";
    case "production":
    default:
      return "Dice Game";
  }
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "dice-game",
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
    bundleIdentifier: getBundleId(),
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    package: getBundleId(),
  },
  web: {
    favicon: "./assets/favicon.png",
  },
});
