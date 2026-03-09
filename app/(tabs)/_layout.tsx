// app/(tabs)/_layout.tsx

/**
 * TABS LAYOUT (NOT ROOT)
 * =======================
 * This file defines the BOTTOM TAB NAVIGATION.
 *
 * ❌ This is NOT the root layout.
 * ❌ Do NOT put providers here.
 *
 * This layout controls the tab bar:
 * Home | AI | Calendar | Profile
 *
 * Each tab corresponds to a file inside:
 * app/(tabs)/
 *
 * - app/(tabs)/index.tsx     -> "Home"
 * - app/(tabs)/ai.tsx        -> "AI"
 * - app/(tabs)/calendar.tsx  -> "Calendar"
 * - app/(tabs)/profile.tsx   -> "Profile"
 */

import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#8f5bff",
        tabBarInactiveTintColor: "#7a73c2",
        tabBarStyle: {
          backgroundColor: "#0b0b12",
          borderTopColor: "#1c1c2e",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ai"
        options={{
          title: "AI",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}