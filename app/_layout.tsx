import React from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { TaskProvider } from "../TaskContext";
import { CalendarProvider } from "../CalendarContext";
import { AuthProvider } from "../features/auth/AuthContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <TaskProvider>
          <CalendarProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="analytics" />
              <Stack.Screen name="settings/[key]" />
              <Stack.Screen name="project-settings/[key]" />
            </Stack>
          </CalendarProvider>
        </TaskProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
