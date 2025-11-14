/**
 * @file start.tsx
 * @description This file contains the WorkoutSessionScreen, which is the central hub for starting and tracking workouts.
 *
 * --- CONTEXT INTEGRATION ---
 * - This screen now uses the `useWorkout` hook to access the global workout state.
 * - When a user starts a workout (`handleStartPlan`), it calls `startWorkout(plan)` from the context. This sets the global state and makes the minimized view appear on other tabs.
 * - When a workout is finished or cancelled (`finishWorkout`), it calls `stopWorkout()` to clear the global state and hide the minimized view.
 *
 * --- COMPONENT & MODAL OVERVIEW ---
 *
 * 1.  WorkoutSessionScreen (Main Component):
 * - Manages the overall state, switching between the start view and the active workout view.
 * - Fetches workout plans and workout history from Firebase.
 * - Handles pull-to-refresh functionality.
 * - **NEW**: Uses `useEffect` and `useLocalSearchParams` to check for a `previewPlanId` param and open the preview modal on load.
 *
 * 2.  StartWorkoutView:
 * - The initial screen users see.
 * - Provides options to "Choose Workout Plan" or "Quick Start".
 * - Displays a grid of the 4 most recent unique workouts from history.
 *
 * 3.  ActiveWorkoutView:
 * - The screen for an in-progress workout session.
 * - Allows users to complete sets, edit reps/weight, add/delete sets, and add/delete exercises.
 * - Features a timer and a rest timer.
 * - On finishing, prompts the user to save changes to the original plan if modifications were made.
 *
 * 4.  WorkoutPlanSelectionModal:
 * - Opens when "Choose Workout Plan" is tapped.
 * - Displays all available workout plans in a grid for the user to select.
 *
 * 5.  WorkoutPlanPreviewModal:
 * - Shows a summary of a selected workout plan's exercises before starting.
 * - Can now be triggered automatically by a route param.
 *
 * 6.  ExerciseLibraryModal (Unified Component):
 * - A single, reusable modal for browsing and selecting exercises from the library.
 * - Operates in `mode='pick'` to add exercises to an active workout.
 *
 * 7.  ExerciseDetailModal:
 * - Displays detailed information about a single exercise (muscles, instructions, etc.).
 * - Triggered from the info icon in `ActiveWorkoutView` or `ExerciseLibraryModal`.
 *
 * --- FIREBASE INTEGRATION ---
 *
 * This screen interacts with three main Firestore collections under the user's UID (`/users/{uid}/`):
 *
 * 1.  `workoutPlans` collection:
 * - `fetchWorkoutPlans`: Reads all documents from this collection to display in the `WorkoutPlanSelectionModal`.
 * - `handleUpdateAndFinish`: Updates a specific plan document if the user chooses to save modifications made during a workout session.
 *
 * 2.  `workoutHistory` collection:
 * - `fetchRecentWorkouts`: Reads the last 20 documents from the user's regular workout history.
 * - `finishWorkout`: Creates a new document in this collection when a workout from a plan is completed.
 *
 * 3.  `workoutQuickHistory` collection:
 * - `fetchRecentWorkouts`: Also reads the last 20 documents from the user's quick workout history.
 * - `finishWorkout`: Creates a new document here when a "Quick Start" session is completed, naming it "Quick Workout #[n]".
 */

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router"; // <-- Import useLocalSearchParams
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { useWorkout } from "../../context/WorkoutContext"; // Import the workout context hook
import exercises from "../../exercises.json"; // Import exercise data
import { db } from "../../firebaseConfig";

// --- MODERN COLOR PALETTE ---
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
// --- END OF IMPORTS ---

// --- TYPE DEFINITIONS (from WorkoutContext) ---
interface ActiveWorkout {
  name: string;
  sets: number; // This is a number
  reps: string;
  primaryMuscles?: string[];
}

interface WorkoutPlan {
  id: string;
  planName: string;
  description?: string;
  selectedDays: string[];
  workouts: ActiveWorkout[]; // Uses ActiveWorkout type
  primaryMuscleGroups?: string[];
  order: number;
  icon?: string;
}
// --- End Type Definitions ---

interface WorkoutHistory {
  id: string;
  planId: string;
  planName: string;
  icon?: string;
  completedAt: Timestamp;
  exercises?: { name: string; sets: { reps: string; weight: string }[] }[];
}

// --- NEW TYPES FOR ACTIVE WORKOUT ---
interface SetData {
  reps: string;
  weight: string;
  isComplete: boolean;
}

interface ActiveExercise {
  name: string;
  targetReps: string;
  sets: SetData[];
}

interface Exercise {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
}

// --- TYPES FOR EXERCISE PICKER ---
interface Filters {
  muscle: string | null;
  category: string | null;
  level: string | null;
  equipment: string | null;
  force: string | null;
}

interface ExerciseData {
  muscleGroups: string[];
  categories: string[];
  levels: string[];
  equipment: string[];
  forces: string[];
}

// =================================================================================================
// --- HELPER HOOKS & FUNCTIONS ---
// =================================================================================================
const useTimer = (initialSeconds = 0) => {
  const [time, setTime] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => setIsActive(true);
  const pause = () => setIsActive(false);
  const reset = () => {
    setIsActive(false);
    setTime(initialSeconds);
  };

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, time]); // Syncing behavior with useCountdown

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return {
    time,
    start,
    pause,
    reset,
    isActive,
    formattedTime: formatTime(time),
  };
};

const useCountdown = (initialSeconds: number, onComplete: () => void) => {
  const [time, setTime] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = (seconds?: number) => {
    setTime(seconds || initialSeconds);
    setIsActive(true);
  };

  const stop = () => {
    setIsActive(false);
    setTime(initialSeconds);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    if (isActive && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0 && isActive) {
      setIsActive(false);
      onComplete();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, time, onComplete]);

  return { time, start, stop, isActive };
};

const formatDate = (timestamp: Timestamp) => {
  if (!timestamp) return "";
  const workoutDate = timestamp.toDate();
  const now = new Date();

  // Reset hours, minutes, seconds, and milliseconds to compare dates only
  const startOfWorkoutDate = new Date(
    workoutDate.getFullYear(),
    workoutDate.getMonth(),
    workoutDate.getDate()
  );
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = startOfNow.getTime() - startOfWorkoutDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 6) return `${diffDays} days ago`;
  if (diffDays === 7) return "Last week";

  // Format as MM/DD/YYYY for dates older than a week
  const month = (workoutDate.getMonth() + 1).toString().padStart(2, "0");
  const day = workoutDate.getDate().toString().padStart(2, "0");
  const year = workoutDate.getFullYear();
  return `${month}/${day}/${year}`;
};

// =================================================================================================
// --- REUSABLE UI COMPONENTS ---
// =================================================================================================
const Header = ({ title }: { title: string }) => {
  const styles = getStyles(useColorScheme() ?? "light");
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.pageTitle}>{title}</Text>
    </View>
  );
};

const MusicPlayerCard = () => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  return (
    <View style={styles.musicCard}>
      <View style={styles.musicAlbumArt} />
      <View style={styles.musicInfo}>
        <Text style={styles.musicTitle}>Song Title</Text>
        <Text style={styles.musicArtist}>Artist Name</Text>
      </View>
      <View style={styles.musicControls}>
        <Feather name="rewind" size={24} color={colors.text} />
        <Feather name="pause" size={24} color={colors.text} />
        <Feather name="fast-forward" size={24} color={colors.text} />
      </View>
    </View>
  );
};

const HistoryCard = ({
  item,
  onPress,
}: {
  item: WorkoutHistory;
  onPress: () => void;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  return (
    <TouchableOpacity style={styles.historyCard} onPress={onPress}>
      <Text style={styles.historyCardIcon}>{item.icon || "💪"}</Text>
      <Text style={styles.historyCardTitle} numberOfLines={2}>
        {item.planName}
      </Text>
      <Text style={styles.historyCardDate}>{formatDate(item.completedAt)}</Text>
    </TouchableOpacity>
  );
};

const SelectablePlanCard = ({
  plan,
  onPress,
}: {
  plan: WorkoutPlan;
  onPress: () => void;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  return (
    <TouchableOpacity style={styles.selectableCard} onPress={onPress}>
      <Text style={styles.selectableCardIcon}>{plan.icon || "💪"}</Text>
      <View style={styles.selectableCardInfo}>
        <Text style={styles.selectableCardTitle} numberOfLines={2}>
          {plan.planName}
        </Text>
        <Text style={styles.selectableCardSubtitle} numberOfLines={2}>
          {plan.description || `${plan.workouts.length} exercises`}
        </Text>
        {plan.primaryMuscleGroups && plan.primaryMuscleGroups.length > 0 && (
          <Text style={styles.selectableCardMuscles} numberOfLines={2}>
            {plan.primaryMuscleGroups.join(", ")}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface FilterSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
}

const FilterSelectionModal: React.FC<FilterSelectionModalProps> = ({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.miniModalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.miniModalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.miniModalHeader}>
            <Text style={styles.miniModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
              <Feather name="x" size={24} color={colors.subtleText} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.miniModalOption}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.miniModalOptionText}>{item}</Text>
                {selectedValue === item && (
                  <Feather name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.pickerDivider} />}
          />
          <TouchableOpacity
            style={styles.miniModalClearButton}
            onPress={() => {
              onSelect(null);
              onClose();
            }}
          >
            <Text style={styles.miniModalClearButtonText}>Clear Filter</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

interface FilterButtonProps {
  label: string;
  value: string | null;
  onPress: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  value,
  onPress,
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  const isSelected = value !== null;

  return (
    <TouchableOpacity style={styles.filterButton} onPress={onPress}>
      <Text style={styles.filterButtonLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          style={[
            styles.filterButtonValue,
            isSelected && { color: colors.primary, fontWeight: "600" },
          ]}
          numberOfLines={1}
        >
          {value || "Any"}
        </Text>
        <Feather name="chevron-right" size={18} color={colors.subtleText} />
      </View>
    </TouchableOpacity>
  );
};

interface ExerciseFilterProps {
  filterOptions: ExerciseData;
  selectedFilters: Filters;
  onUpdateFilters: (newFilters: Filters) => void;
}

const ExerciseFilter: React.FC<ExerciseFilterProps> = ({
  filterOptions,
  selectedFilters,
  onUpdateFilters,
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const [activeFilter, setActiveFilter] = useState<keyof Filters | null>(null);

  const handleFilterSelect = (type: keyof Filters, value: string | null) => {
    onUpdateFilters({
      ...selectedFilters,
      [type]: value,
    });
  };

  const hasActiveFilter = Object.values(selectedFilters).some(
    (v) => v !== null
  );

  const getModalProps = () => {
    if (!activeFilter) return null;
    switch (activeFilter) {
      case "muscle":
        return {
          title: "Select Muscle Group",
          options: filterOptions.muscleGroups,
          selectedValue: selectedFilters.muscle,
        };
      case "equipment":
        return {
          title: "Select Equipment",
          options: filterOptions.equipment,
          selectedValue: selectedFilters.equipment,
        };
      case "level":
        return {
          title: "Select Difficulty",
          options: filterOptions.levels,
          selectedValue: selectedFilters.level,
        };
      case "category":
        return {
          title: "Select Category",
          options: filterOptions.categories,
          selectedValue: selectedFilters.category,
        };
      case "force":
        return {
          title: "Select Force Type",
          options: filterOptions.forces,
          selectedValue: selectedFilters.force,
        };
      default:
        return null;
    }
  };

  const modalProps = getModalProps();

  return (
    <View style={styles.modalFilterContainer}>
      <View style={styles.listHeaderContainer}>
        <Text style={styles.subtleTitle}>Filters</Text>
        {hasActiveFilter && (
          <TouchableOpacity
            onPress={() =>
              onUpdateFilters({
                muscle: null,
                category: null,
                level: null,
                equipment: null,
                force: null,
              })
            }
          >
            <Text style={styles.clearFilterText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterButtonsGroup}>
        <FilterButton
          label="Muscle Group"
          value={selectedFilters.muscle}
          onPress={() => setActiveFilter("muscle")}
        />
        <View style={styles.pickerDivider} />
        <FilterButton
          label="Equipment"
          value={selectedFilters.equipment}
          onPress={() => setActiveFilter("equipment")}
        />
        <View style={styles.pickerDivider} />
        <FilterButton
          label="Difficulty"
          value={selectedFilters.level}
          onPress={() => setActiveFilter("level")}
        />
        <View style={styles.pickerDivider} />
        <FilterButton
          label="Category"
          value={selectedFilters.category}
          onPress={() => setActiveFilter("category")}
        />
        <View style={styles.pickerDivider} />
        <FilterButton
          label="Force Type"
          value={selectedFilters.force}
          onPress={() => setActiveFilter("force")}
        />
      </View>

      {modalProps && activeFilter && (
        <FilterSelectionModal
          visible={!!activeFilter}
          onClose={() => setActiveFilter(null)}
          title={modalProps.title}
          options={modalProps.options}
          selectedValue={modalProps.selectedValue}
          onSelect={(value) => {
            handleFilterSelect(activeFilter, value);
          }}
        />
      )}
    </View>
  );
};

// =================================================================================================
// --- SCREEN VIEWS AND MODALS ---
// =================================================================================================

const StartWorkoutView = ({
  onChoosePlan,
  onQuickStart,
  recentWorkouts,
  onPreviewFromHistory,
  onClearHistory,
  refreshing,
  onRefresh,
}: {
  onChoosePlan: () => void;
  onQuickStart: () => void;
  recentWorkouts: WorkoutHistory[];
  onPreviewFromHistory: (historyItem: WorkoutHistory) => void;
  onClearHistory: () => void;
  refreshing: boolean;
  onRefresh: () => void;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  return (
    <ScrollView
      contentContainerStyle={styles.startViewContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.mainContent}>
        <Text style={styles.pageTitle}>Start Session</Text>
        <Text style={styles.startViewSubtitle}>
          Select a workout plan to begin your training.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onChoosePlan}>
          <Feather name="list" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Choose Workout Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 15 }]}
          onPress={onQuickStart}
        >
          <Feather name="plus-circle" size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>
            Quick Start Empty Session
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Get back into it</Text>
        {recentWorkouts.length > 0 ? (
          <>
            <FlatList
              data={recentWorkouts}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              renderItem={({ item }) => (
                <HistoryCard
                  item={item}
                  onPress={() => onPreviewFromHistory(item)}
                />
              )}
            />
            <TouchableOpacity
              style={styles.clearHistoryButton}
              onPress={onClearHistory}
            >
              <Text style={styles.clearHistoryButtonText}>Clear History</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.historyEmpty}>
            <Text style={styles.historyEmptyText}>
              No recent workouts. Finish a session to see it here!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const ActiveWorkoutView = ({
  plan,
  onFinish,
  onViewExerciseDetails,
  onUpdateAndFinish,
  exerciseData,
}: {
  plan: WorkoutPlan;
  onFinish: (
    plan: WorkoutPlan,
    sessionData: ActiveExercise[],
    duration: number
  ) => void;
  onViewExerciseDetails: (exercise: { name: string }) => void;
  onUpdateAndFinish: (
    planId: string,
    updatedData: ActiveExercise[],
    duration: number
  ) => void;
  exerciseData: ExerciseData;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [activeWorkoutData, setActiveWorkoutData] = useState<ActiveExercise[]>(
    []
  );
  const [isResting, setIsResting] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const onRestComplete = useCallback(() => {
    setIsResting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const workoutTimer = useTimer();
  const restTimer = useCountdown(60, onRestComplete);

  useEffect(() => {
    const initialData = plan.workouts.map((w) => ({
      name: w.name,
      targetReps: w.reps,
      sets: Array.from({ length: w.sets }, () => ({
        reps: "",
        weight: "",
        isComplete: false,
      })),
    }));
    setActiveWorkoutData(initialData);

    workoutTimer.start();
    return () => workoutTimer.pause();
  }, [plan]);

  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    field: "reps" | "weight",
    value: string
  ) => {
    const newData = [...activeWorkoutData];
    newData[exIndex].sets[setIndex][field] = value;
    setActiveWorkoutData(newData);
  };

  const handleToggleSet = (exIndex: number, setIndex: number) => {
    if (isResting) {
      setIsResting(false);
      restTimer.stop();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newData = [...activeWorkoutData];
    const currentSet = newData[exIndex].sets[setIndex];
    currentSet.isComplete = !currentSet.isComplete;
    setActiveWorkoutData(newData);

    const allSetsComplete = newData[exIndex].sets.every((s) => s.isComplete);
    if (allSetsComplete && exIndex < activeWorkoutData.length - 1) {
      setTimeout(() => {
        setCurrentExerciseIndex(exIndex + 1);
      }, 300);
    }
  };

  const handleAddSet = (exIndex: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newData = [...activeWorkoutData];
    newData[exIndex].sets.push({ reps: "", weight: "", isComplete: false });
    setActiveWorkoutData(newData);
  };

  const handleDeleteSet = (exIndex: number, setIndex: number) => {
    Alert.alert("Delete Set?", "Are you sure you want to delete this set?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          const newData = [...activeWorkoutData];
          newData[exIndex].sets.splice(setIndex, 1);
          setActiveWorkoutData(newData);
        },
      },
    ]);
  };

  const handleDeleteExercise = (exIndex: number) => {
    Alert.alert(
      "Remove Exercise?",
      "Are you sure you want to remove this exercise from the session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut
            );
            setActiveWorkoutData((prev) =>
              prev.filter((_, index) => index !== exIndex)
            );
          },
        },
      ]
    );
  };

  const handleSelectExercises = (selectedExercises: Exercise[]) => {
    const newExercises = selectedExercises.map((ex) => ({
      name: ex.name,
      targetReps: "8-12", // Default reps
      sets: Array.from({ length: 3 }, () => ({
        reps: "",
        weight: "",
        isComplete: false,
      })),
    }));
    setActiveWorkoutData((prev) => [...prev, ...newExercises]);
    setIsPickerVisible(false);
  };

  const checkForModifications = () => {
    if (plan.id.startsWith("quick-start")) return false;

    if (activeWorkoutData.length !== plan.workouts.length) {
      return true;
    }
    for (let i = 0; i < activeWorkoutData.length; i++) {
      if (activeWorkoutData[i].name !== plan.workouts[i].name) return true;
      if (activeWorkoutData[i].sets.length !== plan.workouts[i].sets) {
        return true;
      }
    }
    return false;
  };

  const handleAttemptFinish = () => {
    const hasChanged = checkForModifications();

    if (hasChanged) {
      Alert.alert(
        "Update Workout Plan?",
        "You've made changes to this workout. Would you like to save them to the original plan?",
        [
          {
            text: "Update & Finish",
            onPress: () =>
              onUpdateAndFinish(plan.id, activeWorkoutData, workoutTimer.time),
          },
          {
            text: "Finish Without Updating",
            onPress: () => onFinish(plan, activeWorkoutData, workoutTimer.time),
            style: "destructive",
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } else {
      Alert.alert(
        "Finish Workout?",
        "Are you sure you want to end this session?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Finish",
            style: "destructive",
            onPress: () => onFinish(plan, activeWorkoutData, workoutTimer.time),
          },
        ]
      );
    }
  };

  if (activeWorkoutData.length === 0 && !plan.id.startsWith("quick-start")) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.activeWorkoutContainer}>
      <ExerciseLibraryModal
        visible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        onSelect={handleSelectExercises}
        exerciseData={exerciseData}
        mode="pick"
      />
      <ScrollView contentContainerStyle={styles.activeWorkoutScrollView}>
        <Header title={plan.planName} />
        <View style={styles.timerContainer}>
          {isResting ? (
            <View>
              <Text style={[styles.timerLabel, { textAlign: "left" }]}>
                REST
              </Text>
              <Text style={styles.timerText}>
                {`00:${restTimer.time.toString().padStart(2, "0")}`}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.timerBlockRight}>
            <Text style={styles.timerLabel}>ELAPSED TIME</Text>
            <Text style={styles.timerText}>{workoutTimer.formattedTime}</Text>
          </View>
        </View>

        {activeWorkoutData.map((exercise, exIndex) => (
          <View
            key={`${exIndex}-${exercise.name}`}
            style={[
              styles.exerciseCard,
              currentExerciseIndex === exIndex && styles.exerciseCardActive,
            ]}
          >
            <View style={styles.exerciseHeader}>
              <TouchableOpacity
                style={styles.deleteExerciseButton}
                onPress={() => handleDeleteExercise(exIndex)}
              >
                <Feather name="trash-2" size={20} color={colors.destructive} />
              </TouchableOpacity>
              <View style={styles.exerciseHeaderTitle}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.sets.length} Sets
                </Text>
              </View>
              <TouchableOpacity
                style={styles.infoIconTouchable}
                onPress={() => onViewExerciseDetails({ name: exercise.name })}
              >
                <Feather name="info" size={22} color={colors.subtleText} />
              </TouchableOpacity>
            </View>

            {/* Sets Header */}
            <View style={styles.setsHeaderRow}>
              <View style={styles.setColSmall}>
                <Text style={styles.setsHeaderText}>Set</Text>
              </View>
              <View style={styles.setColMedium}>
                <Text style={styles.setsHeaderText}>Weight</Text>
              </View>
              <View style={styles.setColMedium}>
                <Text style={styles.setsHeaderText}>Reps</Text>
              </View>
              <View style={styles.setColMedium}>
                <Text style={styles.setsHeaderText}>Done</Text>
              </View>
              <View style={styles.setColSmall} />
            </View>

            {/* Editable Sets */}
            {exercise.sets.map((setData, setIndex) => (
              <View
                key={setIndex}
                style={[
                  styles.setRow,
                  setData.isComplete && styles.setRowComplete,
                ]}
              >
                <View style={styles.setColSmall}>
                  <Text style={styles.setNumberText}>{setIndex + 1}</Text>
                </View>
                <View style={styles.setColMedium}>
                  <TextInput
                    style={styles.setTextInput}
                    placeholder="-"
                    placeholderTextColor={colors.subtleText}
                    keyboardType="numeric"
                    value={setData.weight}
                    onChangeText={(val) =>
                      handleUpdateSet(exIndex, setIndex, "weight", val)
                    }
                  />
                </View>
                <View style={styles.setColMedium}>
                  <TextInput
                    style={styles.setTextInput}
                    placeholder="-"
                    placeholderTextColor={colors.subtleText}
                    keyboardType="numeric"
                    value={setData.reps}
                    onChangeText={(val) =>
                      handleUpdateSet(exIndex, setIndex, "reps", val)
                    }
                  />
                </View>
                <View style={styles.setColMedium}>
                  <TouchableOpacity
                    style={[
                      styles.setCircle,
                      setData.isComplete && styles.setCircleComplete,
                    ]}
                    onPress={() => handleToggleSet(exIndex, setIndex)}
                  >
                    {setData.isComplete && (
                      <Feather name="check" size={20} color={"#fff"} />
                    )}
                  </TouchableOpacity>
                </View>
                <View style={styles.setColSmall}>
                  <TouchableOpacity
                    style={styles.deleteSetButton}
                    onPress={() => handleDeleteSet(exIndex, setIndex)}
                  >
                    <Feather name="x" size={20} color={colors.subtleText} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addSetButton}
              onPress={() => handleAddSet(exIndex)}
            >
              <Feather name="plus" size={16} color={colors.primary} />
              <Text style={styles.addSetButtonText}>Add Set</Text>
            </TouchableOpacity>

            {exercise.sets.every((s) => s.isComplete) &&
              currentExerciseIndex === exIndex &&
              exIndex === activeWorkoutData.length - 1 && (
                <View style={{ marginTop: 20 }}>
                  {isResting ? (
                    <TouchableOpacity
                      style={styles.endRestButton}
                      onPress={() => {
                        setIsResting(false);
                        restTimer.stop();
                      }}
                    >
                      <Feather name="x" size={18} color={colors.destructive} />
                      <Text style={styles.endRestButtonText}>End Rest</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.restButton}
                      onPress={() => {
                        setIsResting(true);
                        restTimer.start();
                      }}
                    >
                      <Feather name="clock" size={18} color={"#fff"} />
                      <Text style={styles.restButtonText}>Start 60s Rest</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
          </View>
        ))}

        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => setIsPickerVisible(true)}
        >
          <Feather name="plus-circle" size={20} color={colors.primary} />
          <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <MusicPlayerCard />
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleAttemptFinish}
          >
            <Text style={styles.finishButtonText}>Finish Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const WorkoutPlanPreviewModal = ({
  visible,
  onClose,
  plan,
  onStart,
}: {
  visible: boolean;
  onClose: () => void;
  plan: WorkoutPlan | null;
  onStart: (plan: WorkoutPlan) => void;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];

  if (!plan) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.previewModalOverlay}>
        <SafeAreaView style={styles.previewModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{plan.planName}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x-circle" size={26} color={colors.subtleText} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={plan.workouts}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            contentContainerStyle={styles.previewListContent}
            ItemSeparatorComponent={() => (
              <View style={styles.previewSeparator} />
            )}
            renderItem={({ item, index }) => (
              <View style={styles.previewExerciseCard}>
                <Text style={styles.previewExerciseNumber}>{index + 1}</Text>
                <View style={styles.previewExerciseInfo}>
                  <Text style={styles.previewExerciseName}>{item.name}</Text>
                  <Text style={styles.previewExerciseDetails}>
                    {item.sets} sets x {item.reps} reps
                  </Text>
                </View>
              </View>
            )}
          />
          <View style={styles.previewFooter}>
            <TouchableOpacity
              style={styles.previewStartButton}
              onPress={() => onStart(plan)}
            >
              <Text style={styles.previewStartButtonText}>Start Workout</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const WorkoutPlanSelectionModal = ({
  visible,
  onClose,
  plans,
  onSelectPlan,
}: {
  visible: boolean;
  onClose: () => void;
  plans: WorkoutPlan[];
  onSelectPlan: (plan: WorkoutPlan) => void;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose a Plan</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x-circle" size={26} color={colors.subtleText} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={plans}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <SelectablePlanCard
                plan={item}
                onPress={() => onSelectPlan(item)}
              />
            )}
            contentContainerStyle={styles.modalListContent}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
};

interface ExerciseDetailModalProps {
  visible: boolean;
  onClose: () => void;
  exercise: Exercise | null;
}

const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  visible,
  onClose,
  exercise,
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  const insets = useSafeAreaInsets();

  if (!exercise) return null;

  const detailItems = [
    { label: "Level", value: exercise.level },
    { label: "Equipment", value: exercise.equipment },
    { label: "Category", value: exercise.category },
    { label: "Force", value: exercise.force },
    { label: "Mechanic", value: exercise.mechanic },
  ].filter((item) => item.value);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.detailModalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} numberOfLines={2}>
            {exercise.name}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x-circle" size={26} color={colors.subtleText} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.detailScrollContainer}>
          <View style={styles.detailTagsContainer}>
            {detailItems.map((item, index) => (
              <View key={index} style={styles.detailTag}>
                <Text style={styles.detailTagLabel}>{item.label}:</Text>
                <Text style={styles.detailTagValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Primary Muscles</Text>
            <Text style={styles.detailText}>
              {exercise.primaryMuscles.join(", ")}
            </Text>
          </View>

          {exercise.secondaryMuscles.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Secondary Muscles</Text>
              <Text style={styles.detailText}>
                {exercise.secondaryMuscles.join(", ")}
              </Text>
            </View>
          )}

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Instructions</Text>
            {exercise.instructions.map((step, index) => (
              <View key={index} style={styles.instructionStep}>
                <Text style={styles.instructionNumber}>{index + 1}.</Text>
                <Text style={styles.instructionText}>{step}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// --- UNIFIED EXERCISE LIBRARY MODAL ---
interface ExerciseLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseData: ExerciseData;
  mode: "explore" | "pick";
  onSelect?: (selectedExercises: Exercise[]) => void;
}

const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({
  visible,
  onClose,
  exerciseData,
  mode,
  onSelect,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  const [filters, setFilters] = useState<Filters>({
    muscle: null,
    category: null,
    level: null,
    equipment: null,
    force: null,
  });

  // Reset state when modal is closed/opened
  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      setSelected([]);
      setFilters({
        muscle: null,
        category: null,
        level: null,
        equipment: null,
        force: null,
      });
    }
  }, [visible]);

  const filteredExercises = useMemo(() => {
    let list = exercises as Exercise[];
    const query = searchQuery.toLowerCase();

    if (filters.muscle) {
      const muscle = filters.muscle.toLowerCase();
      list = list.filter((ex) =>
        ex.primaryMuscles.some((m) => m.toLowerCase() === muscle)
      );
    }
    if (filters.category) {
      const category = filters.category.toLowerCase();
      list = list.filter((ex) => ex.category.toLowerCase() === category);
    }
    if (filters.level) {
      const level = filters.level.toLowerCase();
      list = list.filter((ex) => ex.level.toLowerCase() === level);
    }
    if (filters.equipment) {
      const equipment = filters.equipment.toLowerCase();
      list = list.filter(
        (ex) => ex.equipment && ex.equipment.toLowerCase() === equipment
      );
    }
    if (filters.force) {
      const force = filters.force.toLowerCase();
      list = list.filter((ex) => ex.force && ex.force.toLowerCase() === force);
    }
    if (query) {
      list = list.filter((ex) => ex.name.toLowerCase().includes(query));
    }
    return list;
  }, [searchQuery, filters]);

  const toggleSelection = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((current) =>
      current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId]
    );
  };

  const handleDone = () => {
    if (mode === "pick" && onSelect) {
      const selectedExercises = (exercises as Exercise[]).filter((ex) =>
        selected.includes(ex.id)
      );
      onSelect(selectedExercises);
    }
    onClose();
  };

  const renderItem = ({ item }: { item: Exercise }) => {
    const isSelected = selected.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.pickerRow, isSelected && styles.pickerRowSelected]}
        onPress={() => toggleSelection(item.id)}
      >
        <TouchableOpacity
          style={styles.infoIconTouchable}
          onPress={() => setViewingExercise(item)}
        >
          <Feather name="info" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.pickerRowText}>{item.name}</Text>
          <Text style={styles.pickerSubtitleText}>
            {item.primaryMuscles.join(", ")}
          </Text>
        </View>
        <View
          style={[
            styles.pickerCheckbox,
            isSelected && styles.pickerCheckboxSelected,
          ]}
        >
          {isSelected && <Feather name="check" size={16} color="white" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.detailModalContainer, { paddingTop: insets.top }]}>
        <ExerciseDetailModal
          visible={!!viewingExercise}
          onClose={() => setViewingExercise(null)}
          exercise={viewingExercise}
        />
        <View style={styles.pickerModalHeader}>
          <TouchableOpacity style={styles.pickerHeaderButton} onPress={onClose}>
            <Text style={{ color: colors.primary, fontSize: 17 }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.pickerModalTitle}>Add Exercises</Text>
          <TouchableOpacity
            style={styles.pickerHeaderButton}
            onPress={handleDone}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 17,
                fontWeight: "bold",
              }}
            >
              Done ({selected.length})
            </Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={
            <>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  placeholderTextColor={colors.subtleText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <ExerciseFilter
                filterOptions={exerciseData}
                selectedFilters={filters}
                onUpdateFilters={setFilters}
              />
              <View style={styles.listHeaderContainer}>
                <Text style={styles.subtleTitle}>Exercises</Text>
              </View>
            </>
          }
        />
      </View>
    </Modal>
  );
};

// =================================================================================================
// --- MAIN SCREEN ---
// =================================================================================================
export default function WorkoutSessionScreen() {
  const { user } = useAuth();
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const params = useLocalSearchParams(); // <-- Get route params

  const { startWorkout, stopWorkout, activeWorkout } = useWorkout();

  const [isLoading, setIsLoading] = useState(true);
  const [allPlans, setAllPlans] = useState<WorkoutPlan[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutHistory[]>([]);
  const [isPlanSelectorVisible, setIsPlanSelectorVisible] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<WorkoutPlan | null>(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const exerciseData = useMemo((): ExerciseData => {
    const muscleSet = new Set<string>();
    const categorySet = new Set<string>();
    const levelSet = new Set<string>();
    const equipmentSet = new Set<string>();
    const forceSet = new Set<string>();
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    (exercises as Exercise[]).forEach((exercise) => {
      if (Array.isArray(exercise.primaryMuscles)) {
        exercise.primaryMuscles.forEach((muscle) =>
          muscleSet.add(capitalize(muscle))
        );
      }
      if (exercise.category) categorySet.add(capitalize(exercise.category));
      if (exercise.level) levelSet.add(capitalize(exercise.level));
      if (exercise.equipment) equipmentSet.add(capitalize(exercise.equipment));
      if (exercise.force) forceSet.add(capitalize(exercise.force));
    });
    return {
      muscleGroups: Array.from(muscleSet).sort(),
      categories: Array.from(categorySet).sort(),
      levels: Array.from(levelSet).sort(),
      equipment: Array.from(equipmentSet).sort(),
      forces: Array.from(forceSet).sort(),
    };
  }, []);

  const fetchWorkoutPlans = useCallback(async () => {
    if (!user) return;
    const plansCollectionRef = collection(
      db,
      "users",
      user.uid,
      "workoutPlans"
    );
    try {
      const querySnapshot = await getDocs(plansCollectionRef);
      // Ensure data is parsed into the correct WorkoutPlan type
      const plans = querySnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Transform workouts to ensure 'sets' is a number
            workouts: (data.workouts || []).map((w: any) => ({
              ...w,
              sets: parseInt(String(w.sets), 10) || 0,
            })),
          } as WorkoutPlan;
        })
        .sort((a, b) => a.order - b.order);
      setAllPlans(plans);
    } catch (error) {
      console.error("Error fetching workout plans: ", error);
      Alert.alert(
        "Loading Error",
        "Could not load your workout plans. Please check your connection and try again."
      );
    }
  }, [user]);

  const fetchRecentWorkouts = useCallback(async () => {
    if (!user) return;

    const historyCollectionRef = collection(
      db,
      "users",
      user.uid,
      "workoutHistory"
    );
    const quickHistoryCollectionRef = collection(
      db,
      "users",
      user.uid,
      "workoutQuickHistory"
    );

    const historyQuery = query(
      historyCollectionRef,
      orderBy("completedAt", "desc"),
      limit(20)
    );
    const quickHistoryQuery = query(
      quickHistoryCollectionRef,
      orderBy("completedAt", "desc"),
      limit(20)
    );

    try {
      const [historySnapshot, quickHistorySnapshot] = await Promise.all([
        getDocs(historyQuery),
        getDocs(quickHistoryQuery),
      ]);

      const regularHistory = historySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as WorkoutHistory)
      );
      const quickHistory = quickHistorySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as WorkoutHistory)
      );

      const combinedHistory = [...regularHistory, ...quickHistory].sort(
        (a, b) => b.completedAt.toMillis() - a.completedAt.toMillis()
      );

      const uniqueWorkouts: WorkoutHistory[] = [];
      const seenPlanIds = new Set<string>();
      for (const workout of combinedHistory) {
        if (
          workout.planId.startsWith("quick-start") ||
          !seenPlanIds.has(workout.planId)
        ) {
          uniqueWorkouts.push(workout);
          if (!workout.planId.startsWith("quick-start")) {
            seenPlanIds.add(workout.planId);
          }
        }
        if (uniqueWorkouts.length >= 4) {
          break;
        }
      }
      setRecentWorkouts(uniqueWorkouts);
    } catch (error: any) {
      console.error("Error fetching combined workout history: ", error);
      Alert.alert(
        "Loading Error",
        "Could not load your workout history. Please try again."
      );
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchWorkoutPlans(), fetchRecentWorkouts()]);
      setIsLoading(false);
    };
    if (user) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [user, fetchWorkoutPlans, fetchRecentWorkouts]);

  // --- NEW useEffect to handle incoming preview param ---
  useEffect(() => {
    // Only run if not loading, we have plans, and the param exists
    if (!isLoading && params.previewPlanId && allPlans.length > 0) {
      const planId = params.previewPlanId as string;
      const planToPreview = allPlans.find((p) => p.id === planId);

      if (planToPreview) {
        setPreviewPlan(planToPreview);
        setIsPreviewModalVisible(true);
        // Clear the param so it doesn't trigger again on re-render
        router.setParams({ previewPlanId: "" });
      } else {
        // Handle case where ID is invalid
        Alert.alert(
          "Plan Not Found",
          "The workout plan from your agenda could not be found. It may have been deleted."
        );
        router.setParams({ previewPlanId: "" });
      }
    }
  }, [isLoading, allPlans, params.previewPlanId, router]);
  // --- END OF NEW useEffect ---

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWorkoutPlans(), fetchRecentWorkouts()]);
    setRefreshing(false);
  }, [fetchWorkoutPlans, fetchRecentWorkouts]);

  const handleStartPlan = (plan: WorkoutPlan) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    startWorkout(plan); // Use context to start workout
    setIsPlanSelectorVisible(false);
    setIsPreviewModalVisible(false);
  };

  const handleSelectPlanForPreview = (plan: WorkoutPlan) => {
    setPreviewPlan(plan);
    setIsPlanSelectorVisible(false);
    setIsPreviewModalVisible(true);
  };

  const handlePreviewFromHistory = (historyItem: WorkoutHistory) => {
    if (historyItem.planId.startsWith("quick-start")) {
      // Dynamically create a plan from history to preview/restart
      const workoutsFromHistory: ActiveWorkout[] = (
        historyItem.exercises || []
      ).map((ex) => ({
        name: ex.name,
        sets: ex.sets.length,
        reps: ex.sets[0]?.reps || "8-12", // Best guess for reps target
      }));

      const tempPlan: WorkoutPlan = {
        id: historyItem.id, // Use history doc ID for uniqueness
        planName: historyItem.planName,
        icon: historyItem.icon,
        workouts: workoutsFromHistory,
        order: 999,
        selectedDays: [],
        description: `Workout from ${formatDate(historyItem.completedAt)}`,
      };
      setPreviewPlan(tempPlan);
      setIsPreviewModalVisible(true);
      return;
    }

    // Original logic for regular plans
    const planToPreview = allPlans.find(
      (plan) => plan.id === historyItem.planId
    );
    if (planToPreview) {
      setPreviewPlan(planToPreview);
      setIsPreviewModalVisible(true);
    } else {
      Alert.alert("Plan Not Found", "This workout plan may have been deleted.");
    }
  };

  const handleQuickStart = () => {
    const emptyPlan: WorkoutPlan = {
      id: `quick-start-${Date.now()}`,
      planName: "Quick Workout",
      description: "A workout started on the fly.",
      selectedDays: [],
      workouts: [],
      order: 999,
      icon: "⚡️",
    };
    handleStartPlan(emptyPlan);
  };

  const handleClearHistory = async () => {
    if (!user || recentWorkouts.length === 0) return;

    Alert.alert(
      "Clear Recent Workouts?",
      "Are you sure you want to clear your workout history? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              const historyRef = collection(
                db,
                "users",
                user.uid,
                "workoutHistory"
              );
              const quickHistoryRef = collection(
                db,
                "users",
                user.uid,
                "workoutQuickHistory"
              );

              const batch = writeBatch(db);

              const historySnapshot = await getDocs(query(historyRef));
              historySnapshot.forEach((doc) => batch.delete(doc.ref));

              const quickHistorySnapshot = await getDocs(
                query(quickHistoryRef)
              );
              quickHistorySnapshot.forEach((doc) => batch.delete(doc.ref));

              await batch.commit();
              setRecentWorkouts([]);
            } catch (error) {
              console.error("Error clearing history:", error);
              Alert.alert(
                "Error",
                "Could not clear history. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const finishWorkout = async (
    planToFinish: WorkoutPlan,
    sessionData: ActiveExercise[],
    duration: number
  ) => {
    if (!user) return;

    const completedExercises = sessionData
      .map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets
          .filter((set) => set.isComplete && set.reps && set.weight)
          .map((set) => ({
            reps: set.reps,
            weight: set.weight,
          })),
      }))
      .filter((exercise) => exercise.sets.length > 0);

    if (completedExercises.length === 0) {
      Alert.alert(
        "Empty Workout",
        "Your workout was not saved because no sets were completed."
      );
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      stopWorkout(); // Use context to stop workout
      return;
    }

    const justFinish = async () => {
      let historyDoc: any = {
        planId: planToFinish.id,
        planName: planToFinish.planName,
        icon: planToFinish.icon,
        completedAt: serverTimestamp(),
        duration: duration,
        exercises: completedExercises,
      };

      let collectionRef;

      if (planToFinish.id.startsWith("quick-start")) {
        collectionRef = collection(
          db,
          "users",
          user.uid,
          "workoutQuickHistory"
        );
        const countSnapshot = await getDocs(collectionRef);
        const nextNumber = countSnapshot.size + 1;
        historyDoc.planName = `Quick Workout #${nextNumber}`;
      } else {
        collectionRef = collection(db, "users", user.uid, "workoutHistory");
      }

      try {
        await addDoc(collectionRef, historyDoc);
        fetchRecentWorkouts();
      } catch (error) {
        console.error("Error saving workout history: ", error);
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      stopWorkout(); // Use context to stop workout
    };

    if (planToFinish.id.startsWith("quick-start")) {
      Alert.alert(
        "Save Workout?",
        "Would you like to save this quick workout as a new permanent template?",
        [
          {
            text: "Save as Template",
            onPress: () => {
              const workoutsToPass = sessionData.map((ex) => {
                const libraryDetails = (exercises as Exercise[]).find(
                  (libEx) => libEx.name === ex.name
                );
                return {
                  name: ex.name,
                  sets: ex.sets.length.toString(),
                  reps: ex.targetReps,
                  primaryMuscles: libraryDetails?.primaryMuscles || [],
                };
              });

              router.push({
                pathname: "/(tabs)/workoutPlan",
                params: { exercises: JSON.stringify(workoutsToPass) },
              });

              justFinish();
            },
          },
          { text: "Finish", onPress: () => justFinish(), style: "default" },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } else {
      await justFinish();
    }
  };

  const handleUpdateAndFinish = async (
    planId: string,
    updatedData: ActiveExercise[],
    duration: number
  ) => {
    if (!user) return;

    // This now correctly uses the number 'sets'
    const updatedWorkouts = updatedData.map((ex) => ({
      name: ex.name,
      reps: ex.targetReps,
      sets: ex.sets.length,
    }));

    try {
      const planDocRef = doc(db, "users", user.uid, "workoutPlans", planId);
      await updateDoc(planDocRef, { workouts: updatedWorkouts });
    } catch (error) {
      console.error("Error updating plan:", error);
      Alert.alert("Error", "Could not update the workout plan.");
      return;
    }

    if (activeWorkout) {
      await finishWorkout(activeWorkout as WorkoutPlan, updatedData, duration);
    }
  };

  const handleViewExerciseDetails = (workout: { name: string }) => {
    const exerciseDetails = (exercises as Exercise[]).find(
      (ex) => ex.name.toLowerCase() === workout.name.trim().toLowerCase()
    );

    if (exerciseDetails) {
      setViewingExercise(exerciseDetails);
    } else {
      Alert.alert(
        "Exercise Not Found",
        `"${workout.name}" is not in the exercise library. This might be a custom exercise.`
      );
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {activeWorkout ? (
        <ActiveWorkoutView
          plan={activeWorkout as WorkoutPlan} // Cast here as we know it's active
          onFinish={finishWorkout}
          onUpdateAndFinish={handleUpdateAndFinish}
          onViewExerciseDetails={handleViewExerciseDetails}
          exerciseData={exerciseData}
        />
      ) : (
        <StartWorkoutView
          onChoosePlan={() => setIsPlanSelectorVisible(true)}
          onQuickStart={handleQuickStart}
          recentWorkouts={recentWorkouts}
          onPreviewFromHistory={handlePreviewFromHistory}
          onClearHistory={handleClearHistory}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
      <WorkoutPlanSelectionModal
        visible={isPlanSelectorVisible}
        onClose={() => setIsPlanSelectorVisible(false)}
        plans={allPlans}
        onSelectPlan={handleSelectPlanForPreview}
      />
      <WorkoutPlanPreviewModal
        visible={isPreviewModalVisible}
        onClose={() => setIsPreviewModalVisible(false)}
        plan={previewPlan}
        onStart={handleStartPlan}
      />
      <ExerciseDetailModal
        visible={!!viewingExercise}
        onClose={() => setViewingExercise(null)}
        exercise={viewingExercise}
      />
    </SafeAreaView>
  );
}

// =================================================================================================
// --- STYLES ---
// =================================================================================================
const getStyles = (scheme: "light" | "dark") => {
  const colors = Colors[scheme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Header
    headerContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 10,
    },
    pageTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
    },
    // Start Workout View
    startViewContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
    },
    mainContent: {
      flex: 1,
      minHeight: 500,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 250,
    },
    startViewSubtitle: {
      fontSize: 16,
      color: colors.subtleText,
      textAlign: "center",
      marginTop: 8,
      marginBottom: 30,
    },
    // Grid styles
    gridRow: {
      justifyContent: "space-between",
    },
    selectableCard: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "flex-start",
      marginBottom: 15,
      width: "48%",
      aspectRatio: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: scheme === "light" ? 0.05 : 0.1,
      shadowRadius: 3,
      elevation: 1,
    },
    selectableCardIcon: {
      fontSize: 32,
      marginBottom: 10,
    },
    selectableCardInfo: {
      alignItems: "center",
    },
    selectableCardTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      marginBottom: 4,
    },
    selectableCardSubtitle: {
      fontSize: 13,
      color: colors.subtleText,
      textAlign: "center",
    },
    selectableCardMuscles: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 8,
      textTransform: "capitalize",
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      gap: 10,
      backgroundColor: colors.primary,
      borderRadius: 16,
      width: "100%",
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 15,
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 16,
      width: "100%",
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
    },
    // History Section
    historySection: {
      width: "100%",
      paddingBottom: 40,
    },
    historyTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
    },
    historyCard: {
      backgroundColor: colors.card,
      width: "48%",
      borderRadius: 16,
      marginBottom: 15,
      alignItems: "center",
      justifyContent: "center",
      padding: 15,
      minHeight: 140,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: scheme === "light" ? 0.05 : 0.1,
      shadowRadius: 3,
      elevation: 1,
    },
    historyCardIcon: {
      fontSize: 28,
      marginBottom: 8,
    },
    historyCardTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
    },
    historyCardDate: {
      fontSize: 12,
      color: colors.subtleText,
      marginTop: 4,
    },
    historyEmpty: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 30,
      backgroundColor: colors.card,
      borderRadius: 16,
    },
    historyEmptyText: {
      fontSize: 15,
      color: colors.subtleText,
    },
    clearHistoryButton: {
      marginTop: 5,
      paddingVertical: 4,
      paddingHorizontal: 8,
      alignSelf: "center",
      marginBottom: 30,
    },
    clearHistoryButtonText: {
      color: colors.subtleText,
      fontSize: 14,
      fontWeight: "600",
    },
    // Active Workout View
    activeWorkoutContainer: {
      flex: 1,
    },
    activeWorkoutScrollView: {
      paddingBottom: 60,
    },
    timerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    timerBlockRight: {
      alignItems: "flex-end",
    },
    timerLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.subtleText,
      letterSpacing: 1.5,
      marginBottom: 2,
    },
    timerText: {
      fontSize: 40,
      fontWeight: "bold",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    exerciseCard: {
      backgroundColor: colors.card,
      marginHorizontal: 20,
      marginBottom: 15,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: scheme === "light" ? 0.05 : 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    exerciseCardActive: {
      borderColor: colors.primary,
      borderWidth: 1.5,
      shadowColor: colors.primary,
      shadowOpacity: scheme === "light" ? 0.2 : 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
    exerciseHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
      paddingHorizontal: 5,
    },
    exerciseHeaderTitle: {
      flex: 1,
      alignItems: "center",
    },
    deleteExerciseButton: {
      padding: 5,
    },
    exerciseName: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    exerciseDetails: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.subtleText,
      marginTop: 4,
    },
    // --- New Set Row Styles ---
    setsHeaderRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    setsHeaderText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.subtleText,
      textTransform: "uppercase",
      textAlign: "center",
    },
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
      borderRadius: 8,
      marginBottom: 8,
    },
    setColSmall: {
      flex: 0.6,
      alignItems: "center",
      justifyContent: "center",
    },
    setColMedium: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    setRowComplete: {
      backgroundColor: colors.success + "1A", // Light green background
    },
    setNumberText: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.subtleText,
      textAlign: "center",
    },
    setTextInput: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      width: "90%",
      textAlign: "center",
    },
    setCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    setCircleComplete: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    deleteSetButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    addSetButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.primary + "1A",
      marginTop: 10,
    },
    addSetButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "bold",
    },
    restButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 25,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    restButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    endRestButton: {
      backgroundColor: colors.card,
      paddingVertical: 14,
      borderRadius: 25,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 2,
      borderColor: colors.border,
    },
    endRestButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.destructive,
    },
    addExerciseButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: 15,
      marginHorizontal: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: "dashed",
    },
    addExerciseButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    // Footer
    footer: {
      paddingHorizontal: 20,
      paddingTop: 20,
      marginTop: 15,
    },
    musicCard: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    musicAlbumArt: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.border,
    },
    musicInfo: {
      flex: 1,
      marginLeft: 12,
    },
    musicTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    musicArtist: {
      fontSize: 12,
      color: colors.subtleText,
    },
    musicControls: {
      flexDirection: "row",
      gap: 15,
    },
    finishButton: {
      backgroundColor: colors.destructive,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      shadowColor: colors.destructive,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 8,
    },
    finishButtonText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderRadius: 24,
      width: "100%",
      maxHeight: "85%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    modalListContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    // Preview Modal Styles
    previewModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    previewModalContainer: {
      backgroundColor: colors.background,
      borderRadius: 24,
      width: "90%",
      maxHeight: "70%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    previewListContent: {
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    previewExerciseCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
    },
    previewExerciseNumber: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.subtleText,
      width: 30,
    },
    previewExerciseInfo: {
      flex: 1,
    },
    previewExerciseName: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    previewExerciseDetails: {
      fontSize: 15,
      color: colors.subtleText,
      marginTop: 4,
    },
    previewSeparator: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 30,
    },
    previewFooter: {
      padding: 20,
      paddingBottom: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    previewStartButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
    },
    previewStartButtonText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    // Exercise Detail Modal
    detailModalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    detailScrollContainer: {
      padding: 20,
    },
    detailSection: {
      marginBottom: 24,
    },
    detailSectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
      textTransform: "capitalize",
    },
    detailText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      textTransform: "capitalize",
    },
    instructionStep: {
      flexDirection: "row",
      marginBottom: 12,
    },
    instructionNumber: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.subtleText,
      marginRight: 8,
      fontWeight: "bold",
    },
    instructionText: {
      flex: 1,
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
    },
    detailTagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 24,
    },
    detailTag: {
      backgroundColor: colors.card,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    detailTagLabel: {
      fontSize: 14,
      color: colors.subtleText,
      marginRight: 6,
    },
    detailTagValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    // --- Picker & Filter Styles ---
    pickerModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerHeaderButton: {
      padding: 5,
      minWidth: 60,
      alignItems: "center",
    },
    pickerModalTitle: {
      fontSize: 17,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
      textAlign: "center",
    },
    searchInputContainer: {
      paddingTop: 15,
    },
    searchInput: {
      padding: 12,
      backgroundColor: colors.card,
      borderRadius: 10,
      fontSize: 16,
      color: colors.text,
    },
    pickerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 5,
      backgroundColor: colors.card,
      borderRadius: 10,
    },
    pickerRowSelected: {
      backgroundColor: colors.primary + "20",
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    pickerRowText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
    },
    pickerSubtitleText: {
      fontSize: 14,
      color: colors.subtleText,
      marginTop: 4,
      textTransform: "capitalize",
    },
    pickerCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 10,
      marginRight: 5,
    },
    pickerCheckboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    infoIconTouchable: {
      padding: 10,
      marginRight: 5,
    },
    miniModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    miniModalContainer: {
      backgroundColor: colors.card,
      borderRadius: 15,
      width: "85%",
      maxHeight: "70%",
    },
    miniModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    miniModalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    miniModalOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 15,
      paddingHorizontal: 20,
    },
    miniModalOptionText: {
      fontSize: 16,
      color: colors.text,
      textTransform: "capitalize",
    },
    miniModalClearButton: {
      padding: 15,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    miniModalClearButtonText: {
      fontSize: 16,
      color: colors.destructive,
      fontWeight: "600",
    },
    filterButtonsGroup: {
      marginBottom: 10,
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: "hidden",
    },
    filterButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
    },
    filterButtonLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
    },
    filterButtonValue: {
      fontSize: 16,
      color: colors.subtleText,
      textTransform: "capitalize",
    },
    modalFilterContainer: {
      paddingBottom: 5,
      marginTop: 20,
    },
    listHeaderContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    subtleTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.subtleText,
    },
    clearFilterText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 16,
    },
    pickerDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 15,
    },
  });
};
