import React from "react";
import { Text, useColorScheme, View } from "react-native";
import { UserProfile } from "../../types/types";
import { getStyles } from "./styles";

interface ProfileHeaderProps {
  userProfile: UserProfile;
}

export default function ProfileHeader({ userProfile }: ProfileHeaderProps) {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{userProfile.firstName.charAt(0)}</Text>
      </View>
      <Text style={styles.profileName}>
        {userProfile.firstName} {userProfile.lastName}
      </Text>
      <Text style={styles.profileEmail}>{userProfile.email}</Text>
    </View>
  );
}
