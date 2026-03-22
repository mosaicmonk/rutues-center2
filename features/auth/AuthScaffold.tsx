import React, { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function AuthScaffold({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <LinearGradient colors={["#05030d", "#12081f", "#1a1235"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.heroCard}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <View style={styles.formCard}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export const authUi = StyleSheet.create({
  label: {
    color: "#d1caee",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#160f2b",
    borderWidth: 1,
    borderColor: "#312056",
    color: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 15,
  },
  helper: {
    color: "#9f95c5",
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    backgroundColor: "#8f5bff",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8f5bff",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#312056",
    backgroundColor: "#120c23",
  },
  secondaryButtonText: {
    color: "#e4ddff",
    fontSize: 15,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  link: {
    color: "#bba5ff",
    fontWeight: "700",
  },
  error: {
    color: "#ff8fa5",
    marginBottom: 14,
  },
  success: {
    color: "#8ee7bb",
    marginBottom: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4c3b78",
    backgroundColor: "#120c23",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#8f5bff",
    borderColor: "#8f5bff",
  },
});

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingVertical: 20,
    justifyContent: "center",
  },
  heroCard: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  eyebrow: {
    color: "#bda4ff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 12,
  },
  subtitle: {
    color: "#b8afd9",
    fontSize: 15,
    lineHeight: 23,
  },
  formCard: {
    backgroundColor: "rgba(13, 9, 24, 0.92)",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#261a43",
  },
});
