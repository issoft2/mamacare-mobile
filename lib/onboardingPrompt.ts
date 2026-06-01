import { Alert } from "react-native";

export function promptFinishOnboarding(router: any, opts?: { title?: string; message?: string; cancelLabel?: string; confirmLabel?: string; onCancel?: () => void; }) {
  const title = opts?.title ?? "Complete setup to continue";
  const message = opts?.message ?? "Please finish your profile so MumCare can personalise your care.\nYou can do this now or later.";
  const cancelLabel = opts?.cancelLabel ?? "Later";
  const confirmLabel = opts?.confirmLabel ?? "Finish setup";

  Alert.alert(title, message, [
    { text: cancelLabel, style: "cancel", onPress: opts?.onCancel ?? (() => {}) },
    { text: confirmLabel, onPress: () => router.push("/onboarding/profile-setup") },
  ], { cancelable: true });
}

export default promptFinishOnboarding;
