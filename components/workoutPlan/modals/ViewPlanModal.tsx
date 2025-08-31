import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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
import { WorkoutPlan } from "../../../types/types";
import { getStyles } from "../styles";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ViewPlanModalProps {
  plan: WorkoutPlan | null;
  onClose: () => void;
  onUpdate: (updatedPlan: WorkoutPlan) => void;
  // THIS IS THE FIX: The onDelete function now expects a planId string.
  onDelete: (planId: string) => void;
}

export default function ViewPlanModal({
  plan,
  onClose,
  onUpdate,
  onDelete,
}: ViewPlanModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  const [editingPlan, setEditingPlan] = useState(false);
  const [editedPlanName, setEditedPlanName] = useState("");
  const [editedSelectedDays, setEditedSelectedDays] = useState<string[]>([]);
  const [editedWorkouts, setEditedWorkouts] = useState<string[]>([]);

  useEffect(() => {
    if (plan) {
      setEditedPlanName(plan.planName);
      setEditedSelectedDays([...plan.selectedDays]);
      setEditedWorkouts([...plan.workouts]);
    } else {
      setEditingPlan(false);
    }
  }, [plan]);

  const toggleEditedDay = (day: string) => {
    setEditedSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addEditedWorkout = () => {
    setEditedWorkouts((prev) => [...prev, ""]);
  };

  const updateEditedWorkout = (text: string, index: number) => {
    const newWorkouts = [...editedWorkouts];
    newWorkouts[index] = text;
    setEditedWorkouts(newWorkouts);
  };

  const deleteEditedWorkout = (index: number) => {
    setEditedWorkouts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = () => {
    if (!plan) return;
    const updatedPlan = {
      ...plan,
      planName: editedPlanName,
      selectedDays: editedSelectedDays,
      workouts: editedWorkouts.filter((w) => w),
    };
    onUpdate(updatedPlan);
    setEditingPlan(false);
  };

  const handleDeletePress = () => {
    if (!plan) return;
    Alert.alert(
      "Delete Plan",
      `Are you sure you want to delete "${plan.planName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        // This now correctly calls the onDelete prop with the plan's ID.
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(plan.id),
        },
      ]
    );
  };

  return (
    <Modal
      visible={!!plan}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalContainerCenter} onPress={onClose}>
        <Pressable style={styles.modalContentCenter}>
          {plan && (
            <ScrollView
              style={{ width: "100%" }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ alignItems: "center", width: "100%" }}>
                <View style={styles.modalHeader}>
                  {editingPlan ? (
                    <TextInput
                      style={styles.editableTitle}
                      value={editedPlanName}
                      onChangeText={setEditedPlanName}
                    />
                  ) : (
                    <Text style={styles.modalTitle}>{plan.planName}</Text>
                  )}
                  {editingPlan ? (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={handleSaveEdit}
                    >
                      <Feather
                        name="check"
                        size={24}
                        color={Colors[colorScheme].primary}
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => setEditingPlan(true)}
                    >
                      <Feather
                        name="edit-2"
                        size={20}
                        color={styles.modalTitle.color}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.label}>Active Days</Text>
                <View style={styles.daysContainer}>
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        (editingPlan
                          ? editedSelectedDays
                          : plan.selectedDays
                        ).includes(day) && styles.dayButtonSelected,
                      ]}
                      onPress={() => editingPlan && toggleEditedDay(day)}
                      disabled={!editingPlan}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          (editingPlan
                            ? editedSelectedDays
                            : plan.selectedDays
                          ).includes(day) && styles.dayButtonTextSelected,
                        ]}
                      >
                        {day.charAt(0)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>Workouts</Text>
                {(editingPlan ? editedWorkouts : plan.workouts).map(
                  (workout, index) => (
                    <View key={index} style={styles.workoutItem}>
                      {editingPlan ? (
                        <>
                          <TextInput
                            style={styles.editableWorkoutText}
                            value={workout}
                            onChangeText={(text) =>
                              updateEditedWorkout(text, index)
                            }
                          />
                          <TouchableOpacity
                            onPress={() => deleteEditedWorkout(index)}
                            style={styles.deleteButton}
                          >
                            <Feather
                              name="trash-2"
                              size={18}
                              color={Colors[colorScheme].destructive}
                            />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <Text style={styles.workoutText}>{workout}</Text>
                      )}
                    </View>
                  )
                )}
                {editingPlan && (
                  <>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={addEditedWorkout}
                    >
                      <Feather
                        name="plus-circle"
                        size={18}
                        color={Colors[colorScheme].primary}
                      />
                      <Text style={styles.addButtonText}>Add Workout</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deletePlanButton}
                      onPress={handleDeletePress}
                    >
                      <Text style={styles.deletePlanButtonText}>
                        Delete Plan
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
