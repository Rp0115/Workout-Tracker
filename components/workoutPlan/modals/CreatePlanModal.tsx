import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Colors } from "../../../constants/Colors";
import { getStyles } from "../styles";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CreatePlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    planName: string,
    selectedDays: string[],
    workouts: string[]
  ) => void;
}

export default function CreatePlanModal({
  visible,
  onClose,
  onSave,
}: CreatePlanModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  const [planName, setPlanName] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [workouts, setWorkouts] = useState<string[]>([""]);

  const createModalScrollRef = useRef<ScrollView>(null);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addWorkout = () => {
    setWorkouts((prev) => [...prev, ""]);
    setTimeout(
      () => createModalScrollRef.current?.scrollToEnd({ animated: true }),
      10
    );
  };

  const handleSavePlan = () => {
    if (!planName || selectedDays.length === 0) {
      Alert.alert(
        "Incomplete Plan",
        "Please name your plan and select at least one day."
      );
      return;
    }
    onSave(
      planName,
      selectedDays,
      workouts.filter((w) => w)
    ); // Pass data up to parent
    // Reset state for next time
    setPlanName("");
    setSelectedDays([]);
    setWorkouts([""]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalContainerCenter} onPress={onClose}>
        <View style={styles.modalContentWrapper}>
          <Pressable style={styles.modalContentCenter}>
            <ScrollView
              ref={createModalScrollRef}
              style={{ width: "100%" }}
              contentContainerStyle={styles.createModalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Workout Plan</Text>
                <TouchableOpacity
                  onPress={handleSavePlan}
                  style={styles.saveIconButton}
                >
                  <Feather
                    name="check"
                    size={24}
                    color={styles.saveIcon.color}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Plan Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Strength Training"
                placeholderTextColor={styles.placeholder.color}
                value={planName}
                onChangeText={setPlanName}
              />
              <Text style={styles.label}>Select Days</Text>
              <View style={styles.daysContainer}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      selectedDays.includes(day) && styles.dayButtonSelected,
                    ]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        selectedDays.includes(day) &&
                          styles.dayButtonTextSelected,
                      ]}
                    >
                      {day.charAt(0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Workouts</Text>
              {workouts.map((workout, index) => (
                <View key={index} style={styles.workoutInputContainer}>
                  <TextInput
                    style={styles.workoutInput}
                    placeholder={`Enter workout #${index + 1}`}
                    placeholderTextColor={Colors[colorScheme].subtleText}
                    value={workout}
                    onChangeText={(text) => {
                      const updatedWorkouts = [...workouts];
                      updatedWorkouts[index] = text;
                      setWorkouts(updatedWorkouts);
                    }}
                    // autoFocus={index === workouts.length - 1}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const updatedWorkouts = workouts.filter(
                        (_, i) => i !== index
                      );
                      setWorkouts(updatedWorkouts);
                    }}
                    style={styles.deleteWorkoutButton}
                  >
                    <Feather
                      name="trash-2"
                      size={18}
                      color={Colors[colorScheme].destructive}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={{ alignItems: "center" }}>
                <TouchableOpacity style={styles.addButton} onPress={addWorkout}>
                  <Feather
                    name="plus-circle"
                    size={18}
                    color={styles.addButtonText.color}
                  />
                  <Text style={styles.addButtonText}>Add Workout</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
