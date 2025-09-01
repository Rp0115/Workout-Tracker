import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

export default function LoadingScreen() {
  // 2. Get the current color scheme ('dark', 'light', or null)
  const colorScheme = useColorScheme();

  // 3. Define colors based on the theme
  const containerStyle = {
    backgroundColor: colorScheme === "dark" ? "#121212" : "#FFFFFF",
  };

  const spinnerColor = colorScheme === "dark" ? "#FFFFFF" : "#007AFF";

  return (
    // 4. Apply the dynamic style to the container
    <View style={[styles.container, containerStyle]}>
      <Image
        source={require("../assets/images/react-logo.png")} // Make sure this logo is visible on both dark and light backgrounds
        style={styles.logo}
      />
      {/* 5. Apply the dynamic color to the spinner */}
      <ActivityIndicator size="large" color={spinnerColor} />
    </View>
  );
}

// The static styles that don't change
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
