import React from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { TaskProvider } from "../TaskContext";
import { CalendarProvider } from "../CalendarContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TaskProvider>
        <CalendarProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="analytics" />
            <Stack.Screen name="settings/[key]" />
            <Stack.Screen name="project-settings/[key]" />
          </Stack>
        </CalendarProvider>
      </TaskProvider>
    </GestureHandlerRootView>
  );
}
