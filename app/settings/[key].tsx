import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

const TITLES: Record<string, string> = {
  "personal-information": "Personal information",
  notifications: "Notifications",
  subscribe: "Subscribe",
  security: "Security",
};

export default function SettingsDetailScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const title = TITLES[key ?? ""] ?? "Settings";

  const [name, setName] = useState("Rutues Center");
  const [email, setEmail] = useState("user@rutues.app");
  const [sms, setSms] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [plan, setPlan] = useState("Pro");

  const body = useMemo(() => {
    if (key === "personal-information") {
      return (
        <View style={styles.card}>
          <Field label="Name" value={name} onChangeText={setName} />
          <Field label="Email" value={email} onChangeText={setEmail} />
        </View>
      );
    }

    if (key === "notifications") {
      return (
        <View style={styles.card}>
          <RowSwitch label="Push notifications" value={sms} onChange={setSms} />
          <RowSwitch label="Email updates" value={emailNotifs} onChange={setEmailNotifs} />
        </View>
      );
    }

    if (key === "subscribe") {
      return (
        <View style={styles.card}>
          <Text style={styles.label}>Current Plan</Text>
          <Text style={styles.plan}>{plan}</Text>
          <Pressable style={styles.button} onPress={() => setPlan(plan === "Pro" ? "Business" : "Pro")}> 
            <Text style={styles.buttonText}>Switch Plan</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Field label="Current Password" value="" secure />
        <Field label="New Password" value="" secure />
        <Pressable style={styles.button}><Text style={styles.buttonText}>Update Password</Text></Pressable>
      </View>
    );
  }, [email, emailNotifs, key, name, plan, sms]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#fff" /></Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 24 }} />
        </View>
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, secure }: { label: string; value: string; onChangeText?: (v: string) => void; secure?: boolean }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} secureTextEntry={secure} style={styles.input} placeholderTextColor="#726f9a" placeholder={label} />
    </View>
  );
}

function RowSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
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
  buttonText: { color: "#fff", fontWeight: "600" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 10 },
  switchLabel: { color: "#fff" },
});
