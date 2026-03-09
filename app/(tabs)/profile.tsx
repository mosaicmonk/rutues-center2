import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * Profile / Upcoming screen
 * Matches the aesthetic of your reference:
 * - Gradient-like dark background
 * - Analytics card
 * - Account settings card
 * - Project settings card
 */
export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* ===== Header ===== */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.circleButton}>
            <Ionicons name="chevron-back" size={18} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Upcoming</Text>

          <TouchableOpacity style={styles.circleButton}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* ===== User row ===== */}
        <View style={styles.userCard}>
          <View style={styles.userRow}>
            {/* Avatar placeholder – you can swap with logo later */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>RC</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>Rutues Center</Text>
              <Text style={styles.userEmail}>user@rutues.app</Text>
            </View>

            <View style={styles.proPill}>
              <Text style={styles.proText}>Pro</Text>
            </View>
          </View>
        </View>

        {/* ===== Analytics ===== */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Analytics</Text>
            <View style={styles.dropdownRow}>
              <Text style={styles.dropdownText}>This Month</Text>
              <Ionicons name="chevron-down" size={14} color="#a7a3c2" />
            </View>
          </View>

          {/* Progress bar style line */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressSegment, { flex: 2, backgroundColor: '#7b6bff' }]} />
            <View style={[styles.progressSegment, { flex: 2, backgroundColor: '#3ad1ff' }]} />
            <View style={[styles.progressSegment, { flex: 2, backgroundColor: '#b5ff5a' }]} />
            <View style={[styles.progressSegment, { flex: 1, backgroundColor: '#ffffff33' }]} />
          </View>

          {/* Stats rows */}
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsCol}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#7b6bff' }]} />
                <Text style={styles.legendLabel}>Total projects</Text>
              </View>
              <Text style={styles.analyticsValue}>22</Text>

              <View style={[styles.legendRow, { marginTop: 10 }]}>
                <View style={[styles.legendDot, { backgroundColor: '#3ad1ff' }]} />
                <Text style={styles.legendLabel}>On going projects</Text>
              </View>
              <Text style={styles.analyticsValue}>13</Text>
            </View>

            <View style={styles.analyticsCol}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#b5ff5a' }]} />
                <Text style={styles.legendLabel}>Performance</Text>
              </View>
              <Text style={styles.analyticsValue}>90%</Text>

              <View style={[styles.legendRow, { marginTop: 10 }]}>
                <View style={[styles.legendDot, { backgroundColor: '#ffffff66' }]} />
                <Text style={styles.legendLabel}>Absence</Text>
              </View>
              <Text style={styles.analyticsValue}>1</Text>
            </View>
          </View>
        </View>

        {/* ===== Account settings ===== */}
        <Text style={styles.sectionTitle}>Account settings</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="person-circle-outline"
            label="Personal information"
          />
          <SettingsRow icon="notifications-outline" label="Notification" />
          <SettingsRow icon="add-circle-outline" label="Subscribe" />
          <SettingsRow icon="shield-checkmark-outline" label="Security" isLast />
        </View>

        {/* ===== Project settings ===== */}
        <Text style={styles.sectionTitle}>Project setting</Text>
        <View style={styles.card}>
          <SettingsRow icon="people-outline" label="Friends" />
          <SettingsRow icon="shield-outline" label="Invasion" />
          <SettingsRow icon="attach-outline" label="Attachment" />
          <SettingsRow icon="sparkles-outline" label="Privacy AI" />
          <SettingsRow icon="lock-closed-outline" label="Password" isLast />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Small reusable row for each setting item
 */
interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isLast?: boolean;
}

function SettingsRow({ icon, label, isLast }: SettingsRowProps) {
  return (
    <View
      style={[
        styles.settingsRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2c2643' },
      ]}
    >
      <View style={styles.settingsLeft}>
        <View style={styles.settingsIconCircle}>
          <Ionicons name={icon} size={18} color="#ffffff" />
        </View>
        <Text style={styles.settingsLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#6d668f" />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#070319', // deep background
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  circleButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#18122f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },

  // User card
  userCard: {
    backgroundColor: '#18122f',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#8f5bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    color: '#a7a3c2',
    fontSize: 13,
    marginTop: 2,
  },
  proPill: {
    backgroundColor: '#8f5bff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  proText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Generic card
  card: {
    backgroundColor: '#18122f',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },

  // Analytics
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dropdownText: {
    color: '#a7a3c2',
    fontSize: 12,
  },
  progressBarBg: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#241c3d',
    marginBottom: 14,
  },
  progressSegment: {
    height: '100%',
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  analyticsCol: {
    flex: 1,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: '#a7a3c2',
    fontSize: 12,
  },
  analyticsValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },

  // Sections
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },

  // Settings rows
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#221a3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    color: '#ffffff',
    fontSize: 14,
  },
});
