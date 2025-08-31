import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, useColorScheme } from "react-native";
import { getStyles } from "./styles";

interface OptionRowProps {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  onPress: () => void;
  isLogout?: boolean;
}

export default function OptionRow({
  icon,
  text,
  onPress,
  isLogout = false,
}: OptionRowProps) {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  const textStyle = isLogout ? styles.logoutText : styles.optionText;
  const rowStyle = isLogout ? styles.logoutButton : styles.optionRow;
  const iconColor = isLogout
    ? styles.logoutText.color
    : styles.optionIcon.color;

  return (
    <TouchableOpacity style={rowStyle} onPress={onPress}>
      <Feather
        name={icon}
        size={20}
        color={iconColor}
        style={isLogout ? styles.logoutIcon : {}}
      />
      <Text style={textStyle}>{text}</Text>
      {!isLogout && (
        <Feather
          name="chevron-right"
          size={20}
          color={styles.optionIcon.color}
        />
      )}
    </TouchableOpacity>
  );
}
