import { verifyBeforeUpdateEmail } from "firebase/auth";
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

interface UpdateEmailModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function UpdateEmailModal({
  visible,
  onClose,
}: UpdateEmailModalProps) {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  const handleUpdateEmail = async () => {
    if (!user || !newEmail) {
      Alert.alert("Error", "Please enter a new email address.");
      return;
    }
    try {
      await verifyBeforeUpdateEmail(user, newEmail);
      Alert.alert(
        "Verification Sent",
        `A verification link has been sent to ${newEmail}. Please click the link to finalize your email change.`
      );
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Update Failed", "This email address is already in use.");
      } else {
        Alert.alert("Error", "An unexpected error occurred.");
      }
    } finally {
      onClose();
      setNewEmail("");
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
              <Text style={styles.modalTitle}>New Email</Text>
              <Text style={styles.modalSubtitle}>
                Please enter your new email address.
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="New Email Address"
                placeholderTextColor={styles.modalUserHeading.color}
                keyboardType="email-address"
                autoCapitalize="none"
                value={newEmail}
                onChangeText={setNewEmail}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleUpdateEmail}
              >
                <Text style={styles.modalButtonText}>Update Email</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
