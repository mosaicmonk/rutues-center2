// app/_layout.tsx

/**
 * ROOT LAYOUT (THIS IS THE TRUE ROOT OF THE APP)
 * ==============================================
 *
 * ✅ This file wraps the ENTIRE application.
 * ✅ Every screen inside the app runs inside this layout.
 *
 * This is where we put:
 * - Global Providers (TaskProvider, CalendarProvider)
 * - App-level navigation container (Stack)
 *
 * If you see errors like:
 * "useTasks must be used inside a TaskProvider"
 *
 * It means this file is missing the provider wrapper.
 *
 * --------------------------------------------------
 * IMPORTANT:
 * Providers MUST go here — NOT in (tabs)/_layout.tsx
 * --------------------------------------------------
 */

import React from "react";
import { Stack } from "expo-router";

// These are GLOBAL STATE providers.
// They must wrap the whole app so every screen can access them.
import { TaskProvider } from "../TaskContext";
import { CalendarProvider } from "../CalendarContext";

export default function RootLayout() {
  return (
    <TaskProvider>
      <CalendarProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </CalendarProvider>
    </TaskProvider>
  );
}