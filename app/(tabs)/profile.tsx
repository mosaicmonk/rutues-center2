import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const monthFilters = [
  "This Month",
  "Last Month",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const analyticsByMonth: Record<string, { total: number; ongoing: number; performance: string; absence: number }> = {
  "This Month": { total: 22, ongoing: 13, performance: "90%", absence: 1 },
  "Last Month": { total: 18, ongoing: 9, performance: "83%", absence: 2 },
  January: { total: 14, ongoing: 8, performance: "80%", absence: 3 },
  February: { total: 16, ongoing: 9, performance: "81%", absence: 2 },
  March: { total: 17, ongoing: 10, performance: "84%", absence: 2 },
  April: { total: 20, ongoing: 11, performance: "87%", absence: 1 },
  May: { total: 21, ongoing: 12, performance: "88%", absence: 1 },
  June: { total: 22, ongoing: 13, performance: "90%", absence: 1 },
  July: { total: 19, ongoing: 10, performance: "85%", absence: 2 },
  August: { total: 18, ongoing: 9, performance: "84%", absence: 2 },
  September: { total: 20, ongoing: 11, performance: "87%", absence: 2 },
  October: { total: 23, ongoing: 14, performance: "92%", absence: 1 },
  November: { total: 24, ongoing: 15, performance: "93%", absence: 1 },
  December: { total: 25, ongoing: 16, performance: "94%", absence: 1 },
};

export default function ProfileScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState("This Month");
  const [showFilter, setShowFilter] = useState(false);

  const stats = useMemo(() => analyticsByMonth[selectedMonth], [selectedMonth]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Account settings</Text>

        <Pressable style={styles.card} onPress={() => router.push("/analytics")}> 
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Analytics</Text>
            <Pressable style={styles.dropdownRow} onPress={() => setShowFilter((p) => !p)}>
              <Text style={styles.dropdownText}>{selectedMonth}</Text>
              <Ionicons name="chevron-down" size={14} color="#a7a3c2" />
            </Pressable>
          </View>

          {showFilter ? (
            <View style={styles.monthMenu}>
              {monthFilters.map((month) => (
                <Pressable
                  key={month}
                  style={styles.monthOption}
                  onPress={() => {
                    setSelectedMonth(month);
                    setShowFilter(false);
                  }}
                >
                  <Text style={styles.monthText}>{month}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.progressBarBg}>
            <View style={[styles.progressSegment, { flex: 2, backgroundColor: "#7b6bff" }]} />
            <View style={[styles.progressSegment, { flex: 2, backgroundColor: "#3ad1ff" }]} />
            <View style={[styles.progressSegment, { flex: 2, backgroundColor: "#b5ff5a" }]} />
            <View style={[styles.progressSegment, { flex: 1, backgroundColor: "#ffffff33" }]} />
          </View>

          <View style={styles.analyticsRow}>
            <View style={styles.analyticsCol}>
              <Legend label="Total projects" color="#7b6bff" value={stats.total.toString()} />
              <Legend label="On going projects" color="#3ad1ff" value={stats.ongoing.toString()} />
            </View>
            <View style={styles.analyticsCol}>
              <Legend label="Performance" color="#b5ff5a" value={stats.performance} />
              <Legend label="Absence" color="#ffffff66" value={stats.absence.toString()} />
            </View>
          </View>
        </Pressable>

        <View style={styles.card}>
          <SettingsRow icon="person-circle-outline" label="Personal information" onPress={() => router.push("/settings/personal-information")} />
          <SettingsRow icon="notifications-outline" label="Notification" onPress={() => router.push("/settings/notifications")} />
          <SettingsRow icon="add-circle-outline" label="Subscribe" onPress={() => router.push("/settings/subscribe")} />
          <SettingsRow icon="shield-checkmark-outline" label="Security" onPress={() => router.push("/settings/security")} isLast />
        </View>

        <Text style={styles.sectionTitle}>Project settings</Text>
        <View style={styles.card}>
          <SettingsRow icon="people-outline" label="Friends" onPress={() => router.push("/project-settings/friends")} />
          <SettingsRow icon="shield-outline" label="Invasion" onPress={() => router.push("/project-settings/invasion")} />
          <SettingsRow icon="attach-outline" label="Attachment" onPress={() => router.push("/project-settings/attachment")} isLast />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
      </View>
      <Text style={styles.analyticsValue}>{value}</Text>
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
  card: { backgroundColor: "#18122f", borderRadius: 24, padding: 16, marginBottom: 16 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  dropdownRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dropdownText: { color: "#a7a3c2", fontSize: 12 },
  monthMenu: { backgroundColor: "#211a3b", borderRadius: 12, marginBottom: 12, maxHeight: 200 },
  monthOption: { paddingHorizontal: 10, paddingVertical: 8 },
  monthText: { color: "#fff" },
  progressBarBg: { flexDirection: "row", height: 8, borderRadius: 499, overflow: "hidden", backgroundColor: "#241c3d", marginBottom: 14 },
  progressSegment: { height: "100%" },
  analyticsRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  analyticsCol: { flex: 1 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: "#a7a3c2", fontSize: 12 },
  analyticsValue: { color: "#ffffff", fontSize: 16, fontWeight: "600", marginTop: 2 },
  settingsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  settingsLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingsIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#221a3b", alignItems: "center", justifyContent: "center" },
  settingsLabel: { color: "#ffffff", fontSize: 14 },
});
