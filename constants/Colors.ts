/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    background: "#F2F2F7",
    card: "#FFFFFF",
    text: "#000000",
    subtleText: "#6E6E73",
    primary: "#007AFF",
    destructive: "#FF3B30",
    separator: "#D1D1D6",
    modalOverlay: "rgba(0,0,0,0.4)",
    modalContent: "#F2F2F7",
    modalInput: "rgba(118, 118, 128, 0.12)",
    modalUserHeading: "#6E6E73",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    danger: "red",
    border: "#D1D1D6",
  },
  dark: {
    background: "#000000",
    card: "#1C1C1E",
    text: "#FFFFFF",
    subtleText: "#A9A9A9",
    primary: "#0A84FF",
    destructive: "#FF3B30",
    separator: "#38383A",
    modalOverlay: "rgba(0,0,0,0.7)",
    modalContent: "#2C2C2E",
    modalInput: "rgba(255, 255, 255, 0.1)",
    modalUserHeading: "#A9A9A9",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    danger: "red",
    border: "#38383A",
  },
};
