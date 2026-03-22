import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";

import { useAuth } from "../features/auth/AuthContext";

export default function AppEntry() {
  const { initialized, isSignedIn, needsTrackingConsent, needsNotificationSetup } = useAuth();

  if (!initialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#8f5bff" size="large" />
        <Text style={styles.text}>Loading Rutues Center...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (needsTrackingConsent) {
    return <Redirect href="/(auth)/tracking-consent" />;
  }

  if (needsNotificationSetup) {
    return <Redirect href="/(auth)/notifications" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070319",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  text: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
