import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
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

interface ReAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReAuthModal({
  visible,
  onClose,
  onSuccess,
}: ReAuthModalProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  const handleReauthentication = async () => {
    if (!user || !user.email) {
      Alert.alert("Error", "No valid user found for re-authentication.");
      return;
    }
    if (!password) {
      Alert.alert("Error", "Please enter your password.");
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      setPassword(""); // Clear password after use
      onSuccess(); // Proceed to the next step (e.g., open the next modal)
    } catch (error) {
      Alert.alert(
        "Authentication Failed",
        "The password you entered is incorrect."
      );
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
              <Text style={styles.modalTitle}>Enter Password</Text>
              <Text style={styles.modalSubtitle}>
                Please enter your current password to continue.
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Current Password"
                placeholderTextColor={styles.modalUserHeading.color}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleReauthentication}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
