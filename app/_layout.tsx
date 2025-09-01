import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Href, Stack, router, useSegments } from "expo-router";
import React, { useEffect } from "react"; // Removed useCallback and SplashScreen
import "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import LoadingScreen from "../components/LoadingScreen";
import { AuthProvider, useAuth } from "../context/AuthContext";

// NOTE: All 'expo-splash-screen' logic has been removed.

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (isLoading || !loaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (user && inAuthGroup) {
      router.replace("/(tabs)" as Href);
    } else if (!user && !inAuthGroup) {
      router.replace("/(auth)" as Href);
    }
  }, [user, segments, isLoading, loaded]);

  // 2. Render your LoadingScreen component instead of null
  if (!loaded || isLoading) {
    return <LoadingScreen />;
  }

  // When loading is finished, this part renders as before
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// Your RootLayout remains the same
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // You can even show the loading screen here for the font loading part
  if (!loaded) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <InitialLayout />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
