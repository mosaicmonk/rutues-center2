import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "../../features/auth/AuthContext";
import { AuthScaffold, authUi } from "../../features/auth/AuthScaffold";

export default function TrackingConsentScreen() {
  const router = useRouter();
  const { saveTrackingConsent, authBusy } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const choose = async (allowTracking: boolean) => {
    setError(null);

    try {
      await saveTrackingConsent(allowTracking);
      router.replace("/");
    } catch (consentError) {
      setError(consentError instanceof Error ? consentError.message : "Unable to save your preference.");
    }
  };

  return (
    <AuthScaffold
      eyebrow="Privacy"
      title="Do you allow tracking / analytics?"
      subtitle="Choose whether optional analytics can be enabled for this account. Your decision is saved to your profile and can be checked later in settings."
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your choice</Text>
        <Text style={styles.cardCopy}>
          • Yes: optional analytics and usage insights can be enabled for product improvements.{"\n"}
          • No: optional tracking stays off while core app functionality continues normally.
        </Text>
      </View>

      {error ? <Text style={authUi.error}>{error}</Text> : null}

      <Pressable style={[authUi.button, authBusy && authUi.buttonDisabled]} onPress={() => choose(true)} disabled={authBusy}>
        <Text style={authUi.buttonText}>Yes, allow tracking</Text>
      </Pressable>
      <Pressable style={[authUi.secondaryButton, styles.secondary, authBusy && authUi.buttonDisabled]} onPress={() => choose(false)} disabled={authBusy}>
        <Text style={authUi.secondaryButtonText}>No, keep tracking off</Text>
      </Pressable>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#140d27",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2d2050",
    marginBottom: 18,
  },
  cardTitle: {
    color: "#ffffff",
    fontWeight: "700",
    marginBottom: 8,
  },
  cardCopy: {
    color: "#b9b0d8",
    lineHeight: 22,
  },
  secondary: {
    marginTop: 12,
  },
});
