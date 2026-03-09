import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const periods = [
  "This Month",
  "Last Month",
  ...["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
];

const map: Record<string, { total: number; ongoing: number; performance: number; absence: number; completed: number }> = Object.fromEntries(
  periods.map((period, i) => [period, { total: 18 + i, ongoing: 9 + (i % 8), performance: 78 + (i % 18), absence: (i % 3) + 1, completed: 11 + i }]),
);

export default function AnalyticsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState("This Month");
  const [open, setOpen] = useState(false);
  const stats = useMemo(() => map[period], [period]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Analytics</Text>
          <View style={{ width: 24 }} />
        </View>

        <Pressable style={styles.dropdown} onPress={() => setOpen((p) => !p)}>
          <Text style={styles.dropdownText}>{period}</Text>
          <Ionicons name="chevron-down" size={16} color="#fff" />
        </Pressable>

        {open && (
          <View style={styles.menu}>
            {periods.map((p) => (
              <Pressable key={p} style={styles.menuItem} onPress={() => { setPeriod(p); setOpen(false); }}>
                <Text style={styles.menuText}>{p}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.card}><Stat label="Total projects" value={stats.total.toString()} color="#7b6bff" /></View>
        <View style={styles.card}><Stat label="On going projects" value={stats.ongoing.toString()} color="#3ad1ff" /></View>
        <View style={styles.card}><Stat label="Performance" value={`${stats.performance}%`} color="#b5ff5a" /></View>
        <View style={styles.card}><Stat label="Absence" value={stats.absence.toString()} color="#ffffff66" /></View>
        <View style={styles.card}><Stat label="Completed projects" value={stats.completed.toString()} color="#8f5bff" /></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
        <Text style={{ color: "#a7a3c2" }}>{label}</Text>
      </View>
      <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700", marginTop: 8 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#070319" },
  container: { padding: 20, gap: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  dropdown: { backgroundColor: "#18122f", borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-between" },
  dropdownText: { color: "#fff" },
  menu: { backgroundColor: "#18122f", borderRadius: 12, maxHeight: 220 },
  menuItem: { padding: 10 },
  menuText: { color: "#fff" },
  card: { backgroundColor: "#18122f", borderRadius: 20, padding: 16 },
});
