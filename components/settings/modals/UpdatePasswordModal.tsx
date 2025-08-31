import { updatePassword } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { getStyles } from "../styles";

interface UpdatePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function UpdatePasswordModal({
  visible,
  onClose,
}: UpdatePasswordModalProps) {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  const handleUpdatePassword = async () => {
    if (!user || !newPassword) {
      Alert.alert("Error", "Please enter a new password.");
      return;
    }
    try {
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Your password has been updated.");
    } catch (error) {
      Alert.alert("Error", "Failed to update password. It may be too weak.");
    } finally {
      onClose();
      setNewPassword("");
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent}>
          <ScrollView
            style={{ width: "100%" }}
            contentContainerStyle={{ alignItems: "center" }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ alignItems: "center", width: "100%" }}>
              <Text style={styles.modalTitle}>New Password</Text>
              <Text style={styles.modalSubtitle}>
                Please enter your new password.
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="New Password"
                placeholderTextColor={styles.modalUserHeading.color}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleUpdatePassword}
              >
                <Text style={styles.modalButtonText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
