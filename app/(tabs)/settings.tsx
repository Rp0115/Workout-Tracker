import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import OptionRow from "../../components/settings/OptionRow";
import ProfileHeader from "../../components/settings/ProfileHeader";
import ReAuthModal from "../../components/settings/modals/ReAuthModal";
import UpdateEmailModal from "../../components/settings/modals/UpdateEmailModal";
import UpdatePasswordModal from "../../components/settings/modals/UpdatePasswordModal";
import UserInfoModal from "../../components/settings/modals/UserInfoModal";
import { getStyles } from "../../components/settings/styles";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../firebaseConfig";
import { UserProfile } from "../../types/types";

export default function SettingsScreen() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

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
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={styles.profileName.color} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {userProfile && <ProfileHeader userProfile={userProfile} />}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <OptionRow
          icon="user"
          text="Change User Info"
          onPress={() => setUserInfoModalVisible(true)}
        />
        <OptionRow
          icon="mail"
          text="Change Email Address"
          onPress={handleChangeEmail}
        />
        <OptionRow
          icon="lock"
          text="Change Password"
          onPress={handleChangePassword}
        />
      </View>

      <View style={styles.section}>
        <OptionRow
          isLogout
          icon="log-out"
          text="Log Out"
          onPress={handleLogOut}
        />
      </View>

      {/* --- Render Modals --- */}
      <UserInfoModal
        visible={isUserInfoModalVisible}
        onClose={() => setUserInfoModalVisible(false)}
        userProfile={userProfile}
        onProfileUpdate={(updatedData) => {
          setUserProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
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
  );
}
