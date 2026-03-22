import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AuthScaffold, authUi } from "../../features/auth/AuthScaffold";

const features = [
  { icon: "shield-checkmark", title: "Secure account", copy: "Create a protected account before entering the workspace." },
  { icon: "analytics", title: "Consent controls", copy: "Choose analytics tracking and notification preferences up front." },
  { icon: "sparkles", title: "Everything else stays separate", copy: "Home, AI planning, Calendar, and Profile continue working in their own feature areas." },
] as const;

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <AuthScaffold
      eyebrow="Welcome"
      title="Rutues Center"
      subtitle="Start with a polished onboarding flow, then enter the app with your account and preferences already set."
    >
      <View style={styles.featureList}>
        {features.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={styles.iconWrap}>
              <Ionicons name={feature.icon} size={18} color="#ffffff" />
            </View>
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureText}>{feature.copy}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable style={authUi.button} onPress={() => router.push("/(auth)/signup")}>
        <Text style={authUi.buttonText}>Create account</Text>
      </Pressable>

      <Pressable style={[authUi.secondaryButton, styles.loginButton]} onPress={() => router.push("/(auth)/login")}>
        <Text style={authUi.secondaryButtonText}>I already have an account</Text>
      </Pressable>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  featureList: {
    gap: 16,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    gap: 14,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#20143c",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    color: "#ffffff",
    fontWeight: "700",
    marginBottom: 4,
  },
  featureText: {
    color: "#ada4cd",
    lineHeight: 20,
  },
  loginButton: {
    marginTop: 12,
  },
});
