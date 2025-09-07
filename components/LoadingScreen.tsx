import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { Colors } from "../constants/Colors"; // 1. Import your Colors object

export default function LoadingScreen() {
  // 2. Get the current color scheme ('dark' or 'light')
  const colorScheme = useColorScheme() ?? "light"; // Use 'light' as a fallback

  // 3. Select the entire color palette for the current theme
  const themeColors = Colors[colorScheme];

  return (
    // 4. Apply the background color from your theme
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <Image
        source={require("../assets/images/react-logo.png")}
        style={styles.logo}
      />
      {/* 5. Apply the tint color (for spinners/accents) from your theme */}
      <ActivityIndicator size="large" color={themeColors.tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 20,
  },
});
