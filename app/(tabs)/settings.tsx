import { Feather } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context"; // <-- Import Added
import ReAuthModal from "../../components/settings/modals/ReAuthModal";
import UpdateEmailModal from "../../components/settings/modals/UpdateEmailModal";
import UpdatePasswordModal from "../../components/settings/modals/UpdatePasswordModal";
import UserInfoModal from "../../components/settings/modals/UserInfoModal";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../firebaseConfig";
import { UserProfile } from "../../types/types";

// --- UNIFIED COLOR PALETTE (from other files) ---
const Colors = {
  light: {
    background: "#F0F2F5",
    card: "#FFFFFF",
    text: "#1C1C1E",
    subtleText: "#6E6E73",
    border: "#E5E7EB",
    primary: "#6D28D9", // Deep Purple
    primaryAccent: "#8B5CF6",
    destructive: "#EF4444",
    success: "#22C55E",
  },
  dark: {
    background: "#111827",
    card: "#1F2937",
    text: "#F9FAFB",
    subtleText: "#9CA3AF",
    border: "#374151",
    primary: "#8B5CF6", // Lighter Purple
    primaryAccent: "#A78BFA",
    destructive: "#F87171",
    success: "#4ADE80",
  },
};

// =================================================================================================
// --- LOCAL COMPONENTS (to use new styles) ---
// =================================================================================================

const ProfileHeader = ({
  userProfile,
  styles,
}: {
  userProfile: UserProfile;
  styles: ReturnType<typeof getStyles>;
}) => {
  if (!userProfile) return null;
  const initial = userProfile.firstName ? userProfile.firstName[0] : "?";

  return (
    <View style={styles.profileHeaderContainer}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.profileName}>
        {userProfile.firstName} {userProfile.lastName}
      </Text>
      <Text style={styles.profileEmail}>{userProfile.email}</Text>
    </View>
  );
};

const OptionRow = ({
  icon,
  text,
  onPress,
  isLogout = false,
  styles,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  text: string;
  onPress: () => void;
  isLogout?: boolean;
  styles: ReturnType<typeof getStyles>;
  colors: (typeof Colors)["light"] | (typeof Colors)["dark"];
}) => {
  const textStyle = isLogout
    ? styles.optionRowTextLogout
    : styles.optionRowText;
  const iconColor = isLogout ? colors.destructive : colors.primary;

  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress}>
      <Feather
        name={icon}
        size={22}
        color={iconColor}
        style={styles.optionRowIcon}
      />
      <Text style={textStyle}>{text}</Text>
    </TouchableOpacity>
  );
};

// =================================================================================================
// --- MAIN SCREEN ---
// =================================================================================================

export default function SettingsScreen() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const colors = Colors[colorScheme]; // Get colors for passing to components

  // State to manage which modal is visible
  const [isUserInfoModalVisible, setUserInfoModalVisible] = useState(false);
  const [isReAuthModalVisible, setReAuthModalVisible] = useState(false);
  const [isUpdateEmailModalVisible, setUpdateEmailModalVisible] =
    useState(false);
  const [isUpdatePasswordModalVisible, setUpdatePasswordModalVisible] =
    useState(false);

  // State to remember which action to perform after re-authentication
  const [nextAction, setNextAction] = useState<"email" | "password" | null>(
    null
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleLogOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert("Error", "Failed to log out.");
    }
  };

  // --- Handlers for multi-step actions ---
  const handleChangeEmail = () => {
    setNextAction("email");
    setReAuthModalVisible(true);
  };

  const handleChangePassword = () => {
    setNextAction("password");
    setReAuthModalVisible(true);
  };

  const onReAuthSuccess = () => {
    setReAuthModalVisible(false); // Close the re-auth modal
    if (nextAction === "email") {
      setUpdateEmailModalVisible(true); // Open the next modal in the flow
    } else if (nextAction === "password") {
      setUpdatePasswordModalVisible(true);
    }
  };

  if (isLoading) {
    return (
      // --- FIX: Wrapped loading state in SafeAreaView ---
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        {/* Use the new primary color for the loading indicator */}
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    // --- FIX: Wrapped main content in SafeAreaView ---
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Pass styles to the new local ProfileHeader component */}
        {userProfile && (
          <ProfileHeader userProfile={userProfile} styles={styles} />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <OptionRow
            icon="user"
            text="Change User Info"
            onPress={() => setUserInfoModalVisible(true)}
            styles={styles}
            colors={colors}
          />
          <OptionRow
            icon="mail"
            text="Change Email Address"
            onPress={handleChangeEmail}
            styles={styles}
            colors={colors}
          />
          <OptionRow
            icon="lock"
            text="Change Password"
            onPress={handleChangePassword}
            styles={styles}
            colors={colors}
          />
        </View>

        <View style={styles.section}>
          <OptionRow
            isLogout
            icon="log-out"
            text="Log Out"
            onPress={handleLogOut}
            styles={styles}
            colors={colors}
          />
        </View>

        {/* --- Render Modals --- */}
        <UserInfoModal
          visible={isUserInfoModalVisible}
          onClose={() => setUserInfoModalVisible(false)}
          userProfile={userProfile}
          onProfileUpdate={(updatedData) => {
            setUserProfile((prev) =>
              prev ? { ...prev, ...updatedData } : null
            );
          }}
        />

        <ReAuthModal
          visible={isReAuthModalVisible}
          onClose={() => setReAuthModalVisible(false)}
          onSuccess={onReAuthSuccess}
        />

        <UpdateEmailModal
          visible={isUpdateEmailModalVisible}
          onClose={() => setUpdateEmailModalVisible(false)}
        />

        <UpdatePasswordModal
          visible={isUpdatePasswordModalVisible}
          onClose={() => setUpdatePasswordModalVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// =================================================================================================
// --- STYLES (now local to this file) ---
// =================================================================================================
const getStyles = (scheme: "light" | "dark") => {
  const colors = Colors[scheme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    section: {
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.subtleText,
      marginBottom: 15,
      paddingHorizontal: 5, // Small padding for alignment
    },
    // Styles for ProfileHeader
    profileHeaderContainer: {
      alignItems: "center",
      paddingVertical: 30,
      paddingHorizontal: 20,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary + "20", // Light primary bg
      marginBottom: 15,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.primary,
    },
    avatarText: {
      fontSize: 40,
      fontWeight: "bold",
      color: colors.primary,
    },
    profileName: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    profileEmail: {
      fontSize: 16,
      color: colors.subtleText,
      marginTop: 4,
    },
    // Styles for OptionRow
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: scheme === "light" ? 0.05 : 0.1,
      shadowRadius: 3,
      elevation: 1,
    },
    optionRowIcon: {
      marginRight: 15,
    },
    optionRowText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
    },
    optionRowTextLogout: {
      fontSize: 16,
      color: colors.destructive,
      fontWeight: "600",
    },
  });
};
