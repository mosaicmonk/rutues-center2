import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "../../features/auth/AuthContext";
import { AuthScaffold, authUi } from "../../features/auth/AuthScaffold";

export default function NotificationOnboardingScreen() {
  const router = useRouter();
  const { completeNotificationSetup, authBusy } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChoice = async (allowNotifications: boolean) => {
    setError(null);

    try {
      const status = await completeNotificationSetup(allowNotifications);
      if (allowNotifications && status !== "granted") {
        setMessage(
          status === "unsupported"
            ? "Notification settings were opened or require platform support. You can revisit this any time in settings."
            : "Notifications stayed off for now. You can enable them later in settings."
        );
      }
      router.replace("/");
    } catch (notificationError) {
      setError(notificationError instanceof Error ? notificationError.message : "Unable to save your preference.");
    }
  };

  return (
    <AuthScaffold
      eyebrow="Notifications"
      title="Stay in the loop"
      subtitle="Before the device prompt, decide whether you want reminders and updates. If you continue, the app will trigger the platform permission flow when available."
    >
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Why notifications?</Text>
        <Text style={styles.noteText}>
          Get reminders for upcoming tasks, planner updates, and account alerts without changing your core app experience.
        </Text>
      </View>

      {error ? <Text style={authUi.error}>{error}</Text> : null}
      {message ? <Text style={authUi.success}>{message}</Text> : null}

      <Pressable style={[authUi.button, authBusy && authUi.buttonDisabled]} onPress={() => handleChoice(true)} disabled={authBusy}>
        <Text style={authUi.buttonText}>Turn on notifications</Text>
      </Pressable>
      <Pressable style={[authUi.secondaryButton, styles.secondary, authBusy && authUi.buttonDisabled]} onPress={() => handleChoice(false)} disabled={authBusy}>
        <Text style={authUi.secondaryButtonText}>Not now</Text>
      </Pressable>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  noteCard: {
    backgroundColor: "#140d27",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2d2050",
    marginBottom: 18,
  },
  noteTitle: {
    color: "#ffffff",
    fontWeight: "700",
    marginBottom: 8,
  },
  noteText: {
    color: "#b9b0d8",
    lineHeight: 22,
  },
  secondary: {
    marginTop: 12,
  },
});
