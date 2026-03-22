import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../features/auth/AuthContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, rememberMe } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.trim() || "RC" : "RC"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user ? `${user.firstName} ${user.lastName}` : "Guest"}</Text>
              <Text style={styles.email}>{user?.email ?? "Not signed in"}</Text>
            </View>
          </View>

          <View style={styles.pillRow}>
            <StatusPill label={user?.trackingConsent ? "Tracking: On" : "Tracking: Off"} icon="analytics-outline" />
            <StatusPill
              label={user?.notificationPreference.appEnabled ? "Notifications: On" : "Notifications: Off"}
              icon="notifications-outline"
            />
            <StatusPill label={rememberMe ? "Remembered device" : "Session only"} icon="key-outline" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          <SettingsRow icon="person-circle-outline" label="Personal information" onPress={() => router.push("/settings/personal-information")} />
          <SettingsRow icon="notifications-outline" label="Notifications & consent" onPress={() => router.push("/settings/notifications")} />
          <SettingsRow icon="add-circle-outline" label="Subscribe" onPress={() => router.push("/settings/subscribe")} />
          <SettingsRow icon="shield-checkmark-outline" label="Security" onPress={() => router.push("/settings/security")} isLast />
        </View>

        <Text style={styles.sectionTitle}>Project settings</Text>
        <View style={styles.card}>
          <SettingsRow icon="people-outline" label="Friends" onPress={() => router.push("/project-settings/friends")} />
          <SettingsRow icon="shield-outline" label="Invasion" onPress={() => router.push("/project-settings/invasion")} />
          <SettingsRow icon="attach-outline" label="Attachment" onPress={() => router.push("/project-settings/attachment")} isLast />
        </View>

        <Pressable style={styles.logoutButton} onPress={() => void logout()}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusPill({ label, icon }: { label: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={14} color="#d2c5ff" />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.settingsRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#2c2643" },
      ]}
    >
      <View style={styles.settingsLeft}>
        <View style={styles.settingsIconCircle}>
          <Ionicons name={icon} size={18} color="#ffffff" />
        </View>
        <Text style={styles.settingsLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#6d668f" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#070319" },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  sectionTitle: { color: "#ffffff", fontSize: 15, fontWeight: "700", marginBottom: 10 },
  profileCard: { backgroundColor: "#18122f", borderRadius: 24, padding: 18, marginBottom: 16 },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#8f5bff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  name: { color: "#ffffff", fontSize: 20, fontWeight: "700" },
  email: { color: "#a7a3c2", marginTop: 4 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#221a3b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: { color: "#d9d2f5", fontSize: 12, fontWeight: "600" },
  card: { backgroundColor: "#18122f", borderRadius: 24, padding: 16, marginBottom: 16 },
  settingsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  settingsLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingsIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#221a3b", alignItems: "center", justifyContent: "center" },
  settingsLabel: { color: "#ffffff", fontSize: 14 },
  logoutButton: {
    backgroundColor: "#2a173f",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4b2c67",
  },
  logoutText: { color: "#ffb9c8", fontWeight: "700" },
});
