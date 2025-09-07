// import {
//   DarkTheme,
//   DefaultTheme,
//   ThemeProvider,
// } from "@react-navigation/native";
// import { useFonts } from "expo-font";
// import { Stack, router, useSegments } from "expo-router";
// import React, { useEffect, useState } from "react"; // Removed useCallback and SplashScreen
// import "react-native-gesture-handler";
// import "react-native-reanimated";

// import { useColorScheme } from "@/hooks/useColorScheme";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import LoadingScreen from "../components/LoadingScreen";
// import { AuthProvider, useAuth } from "../context/AuthContext";

// // NOTE: All 'expo-splash-screen' logic has been removed.

// function InitialLayout() {
//   const { user, isLoading } = useAuth();
//   const segments = useSegments();
//   const colorScheme = useColorScheme();
//   const [loaded] = useFonts({
//     SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
//   });
//   const [isNavigationReady, setNavigationReady] = useState(false);

//   useEffect(() => {
//     if (isLoading || !loaded) return;

//     const inAuthGroup = segments[0] === "(auth)";

//     if (user && inAuthGroup) {
//       router.replace("/(tabs)");
//     } else if (!user && !inAuthGroup) {
//       router.replace("/(auth)");
//     }
//     setNavigationReady(true);
//   }, [user, segments, isLoading, loaded]);

//   // 2. Render your LoadingScreen component instead of null
//   if (!loaded || isLoading || !isNavigationReady) {
//     return <LoadingScreen />;
//   }

//   // When loading is finished, this part renders as before
//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//         <Stack>
//           <Stack.Screen name="(auth)" options={{ headerShown: false }} />
//           <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//           <Stack.Screen name="+not-found" />
//         </Stack>
//       </ThemeProvider>
//     </GestureHandlerRootView>
//   );
// }

// // Your RootLayout remains the same
// export default function RootLayout() {
//   const colorScheme = useColorScheme();
//   const [loaded] = useFonts({
//     SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
//   });

//   // You can even show the loading screen here for the font loading part
//   if (!loaded) {
//     return <LoadingScreen />;
//   }

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//         <AuthProvider>
//           <InitialLayout />
//         </AuthProvider>
//       </ThemeProvider>
//     </GestureHandlerRootView>
//   );
// }

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
// Import 'memo' for optimization
import React, { memo, useEffect, useState } from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../context/AuthContext";

// 1. Tell the native splash screen to stay visible until we tell it to hide.
// This is the key to preventing the flicker.
SplashScreen.preventAutoHideAsync();

// Wrap InitialLayout in React.memo as a safeguard against potential remounts.
const InitialLayout = memo(function InitialLayout() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const [loaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [isNavigationReady, setNavigationReady] = useState(false);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // This effect handles the core navigation logic.
  useEffect(() => {
    // Wait until both assets and auth are loaded.
    if (isLoading || !loaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (user && inAuthGroup) {
      router.replace("/(tabs)");
    } else if (!user && !inAuthGroup) {
      router.replace("/(auth)");
    }

    // Mark that the initial navigation logic is complete.
    setNavigationReady(true);
  }, [user, segments, isLoading, loaded]);

  // 2. This effect will hide the native splash screen once everything is ready.
  useEffect(() => {
    if (loaded && !isLoading && isNavigationReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isLoading, isNavigationReady]);

  // 3. While waiting, render NOTHING from React. The user will continue to see
  //    the native splash screen configured in your app.json file.
  if (!loaded || isLoading || !isNavigationReady) {
    return null;
  }

  // 4. Once the splash screen is hidden, this main app navigator is rendered.
  //
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
});

// The RootLayout remains minimal. Its only job is to provide the AuthContext.
export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
