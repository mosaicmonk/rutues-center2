import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { useAuth } from "../../features/auth/AuthContext";

const TITLES: Record<string, string> = {
  "personal-information": "Personal information",
  notifications: "Notifications & consent",
  subscribe: "Subscribe",
  security: "Security",
};

export default function SettingsDetailScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const {
    user,
    authBusy,
    saveProfile,
    saveNotificationPreference,
    saveTrackingConsent,
    changePassword,
    requestPasswordReset,
  } = useAuth();
  const title = TITLES[key ?? ""] ?? "Settings";

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [trackingConsent, setTrackingConsent] = useState(user?.trackingConsent ?? false);
  const [pushNotifications, setPushNotifications] = useState(user?.notificationPreference.appEnabled ?? false);
  const [plan, setPlan] = useState("Pro");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    });
    setTrackingConsent(user?.trackingConsent ?? false);
    setPushNotifications(user?.notificationPreference.appEnabled ?? false);
  }, [user]);

  const handleProfileSave = async () => {
    try {
      setError(null);
      setMessage(null);
      await saveProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim().toLowerCase(),
        phone: profileForm.phone.trim(),
      });
      setMessage("Profile updated.");
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Unable to save your profile.");
    }
  };

  const handleNotificationSave = async (value: boolean) => {
    try {
      setError(null);
      setMessage(null);
      await saveNotificationPreference(value);
      setMessage("Notification preference updated.");
    } catch (notificationError) {
      setError(notificationError instanceof Error ? notificationError.message : "Unable to update notifications.");
    }
  };

  const handleTrackingSave = async (value: boolean) => {
    try {
      setError(null);
      setMessage(null);
      await saveTrackingConsent(value);
      setMessage("Tracking consent updated.");
    } catch (trackingError) {
      setError(trackingError instanceof Error ? trackingError.message : "Unable to update tracking consent.");
    }
  };

  const handleChangePassword = async () => {
    try {
      setError(null);
      setMessage(null);
      const responseMessage = await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setMessage(responseMessage);
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : "Unable to update your password.");
    }
  };

  const handleForgotPassword = async () => {
    try {
      setError(null);
      setMessage(null);
      const responseMessage = await requestPasswordReset(user?.email ?? profileForm.email);
      setMessage(responseMessage);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to start password reset.");
    }
  };

  useEffect(() => {
    if (message) {
      Alert.alert(title, message);
    }
  }, [message, title]);

  let body: React.ReactNode;

  if (key === "personal-information") {
    body = (
      <View style={styles.card}>
        <Field label="First name" value={profileForm.firstName} onChangeText={(firstName) => setProfileForm((current) => ({ ...current, firstName }))} />
        <Field label="Last name" value={profileForm.lastName} onChangeText={(lastName) => setProfileForm((current) => ({ ...current, lastName }))} />
        <Field label="Email" value={profileForm.email} onChangeText={(email) => setProfileForm((current) => ({ ...current, email }))} keyboardType="email-address" />
        <Field label="Phone" value={profileForm.phone} onChangeText={(phone) => setProfileForm((current) => ({ ...current, phone }))} keyboardType="phone-pad" />
        <Pressable style={styles.button} onPress={() => void handleProfileSave()} disabled={authBusy}>
          <Text style={styles.buttonText}>{authBusy ? "Saving..." : "Save profile"}</Text>
        </Pressable>
      </View>
    );
  } else if (key === "notifications") {
    body = (
      <View style={styles.card}>
        <RowSwitch
          label="Push notifications"
          description="Lets the app send reminders and updates after your onboarding choice."
          value={pushNotifications}
          onChange={(value) => {
            setPushNotifications(value);
            void handleNotificationSave(value);
          }}
        />
        <RowSwitch
          label="Tracking / analytics"
          description="Stores the onboarding tracking consent choice on your account."
          value={trackingConsent}
          onChange={(value) => {
            setTrackingConsent(value);
            void handleTrackingSave(value);
          }}
        />
        <Text style={styles.metaText}>
          System notification status: {user?.notificationPreference.systemStatus ?? "unknown"}
        </Text>
      </View>
    );
  } else if (key === "subscribe") {
    body = (
      <View style={styles.card}>
        <Text style={styles.label}>Current Plan</Text>
        <Text style={styles.plan}>{plan}</Text>
        <Pressable style={styles.button} onPress={() => setPlan(plan === "Pro" ? "Business" : "Pro")}>
          <Text style={styles.buttonText}>Switch Plan</Text>
        </Pressable>
      </View>
    );
  } else {
    body = (
      <View style={styles.card}>
        <Field label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} secure />
        <Field label="New Password" value={newPassword} onChangeText={setNewPassword} secure />
        <Pressable style={styles.button} onPress={() => void handleChangePassword()}>
          <Text style={styles.buttonText}>Update password</Text>
        </Pressable>
        <Pressable style={styles.ghostButton} onPress={() => void handleForgotPassword()}>
          <Text style={styles.ghostButtonText}>Email me reset instructions</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#fff" /></Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 24 }} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  secure,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  secure?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        style={styles.input}
        placeholderTextColor="#726f9a"
        placeholder={label}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
      />
    </View>
  );
}

function RowSwitch({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRowWrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchDescription}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#070319" },
  container: { padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  card: { backgroundColor: "#18122f", borderRadius: 16, padding: 16 },
  label: { color: "#9e9abb", marginBottom: 6 },
  plan: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 12 },
  input: { backgroundColor: "#221a3b", borderRadius: 10, color: "#fff", padding: 10 },
  button: { marginTop: 10, backgroundColor: "#8f5bff", padding: 12, borderRadius: 10, alignItems: "center" },
  ghostButton: {
    marginTop: 12,
    backgroundColor: "#221a3b",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#342856",
  },
  ghostButtonText: { color: "#d7cdf8", fontWeight: "600" },
  buttonText: { color: "#fff", fontWeight: "600" },
  switchRowWrap: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16, marginVertical: 10 },
  switchLabel: { color: "#fff", fontWeight: "600", marginBottom: 4 },
  switchDescription: { color: "#a8a2c4", lineHeight: 18 },
  metaText: { color: "#9e9abb", marginTop: 12 },
  error: { color: "#ff8fa5", marginBottom: 12 },
});
