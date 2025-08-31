import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
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
import RNPickerSelect from "react-native-picker-select";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebaseConfig";
import { UserProfile } from "../../../types/types";
import { getStyles, pickerSelectStyles } from "../styles";

interface UserInfoModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onProfileUpdate: (updatedProfile: Partial<UserProfile>) => void;
}

export default function UserInfoModal({
  visible,
  onClose,
  userProfile,
  onProfileUpdate,
}: UserInfoModalProps) {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  const [editedFirstName, setEditedFirstName] = useState("");
  const [editedLastName, setEditedLastName] = useState("");
  const [editedAge, setEditedAge] = useState("");
  const [editedSex, setEditedSex] = useState("");
  const [editedWorkoutFrequency, setEditedWorkoutFrequency] = useState("");

  const sexPickerRef = useRef<React.ElementRef<typeof RNPickerSelect>>(null);
  const workoutPickerRef =
    useRef<React.ElementRef<typeof RNPickerSelect>>(null);

  useEffect(() => {
    if (userProfile) {
      setEditedFirstName(userProfile.firstName);
      setEditedLastName(userProfile.lastName);
      setEditedAge(userProfile.age);
      setEditedSex(userProfile.sex);
      setEditedWorkoutFrequency(userProfile.workoutFrequency);
    }
  }, [userProfile, visible]);

  const handleUpdateUserInfo = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const updatedData = {
        firstName: editedFirstName,
        lastName: editedLastName,
        age: editedAge,
        sex: editedSex,
        workoutFrequency: editedWorkoutFrequency,
      };
      await updateDoc(userDocRef, updatedData);
      onProfileUpdate(updatedData);
      Alert.alert("Success", "Your profile has been updated.");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      onClose();
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
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Text style={styles.modalUserHeading}>First Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editedFirstName}
                onChangeText={setEditedFirstName}
              />
              <Text style={styles.modalUserHeading}>Last Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editedLastName}
                onChangeText={setEditedLastName}
              />
              <Text style={styles.modalUserHeading}>Age</Text>
              <TextInput
                style={styles.modalInput}
                value={editedAge}
                onChangeText={setEditedAge}
                keyboardType="number-pad"
              />
              <Text style={styles.modalUserHeading}>Sex</Text>
              <Pressable
                onPress={() => sexPickerRef.current?.togglePicker()}
                style={styles.modalInput}
              >
                <RNPickerSelect
                  ref={sexPickerRef}
                  onValueChange={setEditedSex}
                  items={[
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                    { label: "Other", value: "other" },
                  ]}
                  value={editedSex}
                  style={pickerSelectStyles(colorScheme)}
                  placeholder={{ label: "Select your sex...", value: null }}
                  textInputProps={{ pointerEvents: "none" }}
                />
              </Pressable>
              <Text style={styles.modalUserHeading}>Workout Frequency</Text>
              <Pressable
                onPress={() => workoutPickerRef.current?.togglePicker()}
                style={styles.modalInput}
              >
                <RNPickerSelect
                  ref={workoutPickerRef}
                  onValueChange={setEditedWorkoutFrequency}
                  items={[
                    { label: "Daily", value: "daily" },
                    { label: "A few times a week", value: "weekly" },
                    { label: "Once a week", value: "once_a_week" },
                    { label: "Rarely", value: "rarely" },
                    { label: "Never", value: "never" },
                  ]}
                  value={editedWorkoutFrequency}
                  style={pickerSelectStyles(colorScheme)}
                  placeholder={{
                    label: "How often do you work out?",
                    value: null,
                  }}
                  textInputProps={{ pointerEvents: "none" }}
                />
              </Pressable>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleUpdateUserInfo}
              >
                <Text style={styles.modalButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
