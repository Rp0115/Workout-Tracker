/**
 * @file _layout.tsx
 * @description This file serves as the main layout for the tab-based navigation of the app.
 *
 * --- WRAPPERS & PROVIDERS ---
 * 1. WorkoutProvider: This layout is wrapped with the WorkoutProvider to make the global workout state
 * (from WorkoutContext) available to all screens within the tabs.
 *
 * --- COMPONENTS ---
 * 1. AppLayout: A new component introduced to manage the visibility of the MinimizedWorkoutView.
 * - It uses the `useSegments` hook from expo-router to determine the currently active tab.
 * - It conditionally renders the `MinimizedWorkoutView` only when a workout is active AND the user
 * is on a screen other than the 'start' tab.
 *
 * --- NAVIGATION ---
 * - Configures the appearance and behavior of the five main tabs: Home, Workout Plan, Start, Test, and Settings.
 * - Sets up custom tab bar icons, active tint color, and a blur effect background for iOS.
 */
import { Tabs, useSegments } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  MinimizedWorkoutView,
  WorkoutProvider,
  useWorkout,
} from "../../context/WorkoutContext";

// A new component to manage the conditional rendering of the minimized view
const AppLayout = () => {
  const { isWorkoutActive } = useWorkout();
  const segments = useSegments();
  const colorScheme = useColorScheme();

  // The last segment of the path is the current tab name, e.g., 'index', 'start'
  const currentTab = segments[segments.length - 1];

  // Show the minimized view if a workout is active AND we are not on the 'start' tab
  const showMinimizedView = isWorkoutActive && currentTab !== "start";

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: "absolute",
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="workoutPlan"
          options={{
            title: "Workout Plan",
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="list.bullet.clipboard.fill"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="start"
          options={{
            title: "Start",
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="figure.strengthtraining.traditional"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="test"
          options={{
            title: "Test",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="folder.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="person.crop.circle.fill"
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      {showMinimizedView && <MinimizedWorkoutView />}
    </View>
  );
};

// The main export wraps everything in the provider
export default function TabLayout() {
  return (
    <WorkoutProvider>
      <AppLayout />
    </WorkoutProvider>
  );
}
