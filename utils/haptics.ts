import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const isWeb = Platform.OS === "web";

const runHaptic = (work: () => Promise<void>) => {
  if (isWeb) return;
  void work().catch(() => {});
};

export const triggerSelectionHaptic = () => {
  runHaptic(Haptics.selectionAsync);
};

export const triggerLightImpact = () => {
  runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
};

export const triggerImpactMedium = () => {
  runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
};

export const triggerNotificationSuccess = () => {
  runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  );
};

export const triggerNotificationWarning = () => {
  runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  );
};
