import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const TITLES: Record<string, string> = {
  friends: "Friends",
  invasion: "Invasion",
  attachment: "Attachment",
};

export default function ProjectSettingPage() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const [text, setText] = useState("");

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.title}>{TITLES[key ?? ""] ?? "Project Settings"}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.description}>
            {key === "friends" && "Invite teammates and assign projects."}
            {key === "invasion" && "Manage access protection and intrusion alerts."}
            {key === "attachment" && "Upload and organize files for each project."}
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type update"
            placeholderTextColor="#7a76a0"
            style={styles.input}
          />
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#070319" },
  container: { padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  card: { backgroundColor: "#18122f", borderRadius: 16, padding: 16 },
  description: { color: "#beb8dd", marginBottom: 10 },
  input: { backgroundColor: "#221a3b", borderRadius: 10, color: "#fff", padding: 12 },
  button: { marginTop: 12, backgroundColor: "#8f5bff", borderRadius: 10, padding: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
});
