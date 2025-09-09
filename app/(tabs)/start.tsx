import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import { useAuth } from "../../context/AuthContext";
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

// --- TYPE DEFINITIONS ---
interface Workout {
  name: string;
  sets: number;
  reps: string;
}

interface WorkoutPlan {
  id: string;
  planName: string;
  description?: string;
  selectedDays: string[];
  workouts: Workout[];
  primaryMuscleGroups?: string[];
  order: number;
  icon?: string;
}

interface WorkoutHistory {
  id: string;
  planId: string;
  planName: string;
  icon?: string;
  completedAt: Timestamp;
}

interface SetCompletion {
  [exerciseIndex: number]: boolean[];
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
  }, [isActive]);

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
  const pause = () => setIsActive(false);

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

  return { time, start, pause, isActive };
};

const formatDate = (timestamp: Timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// =================================================================================================
// --- UI COMPONENTS ---
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

// =================================================================================================
// --- SCREEN VIEWS ---
// =================================================================================================

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

const StartWorkoutView = ({
  onChoosePlan,
  onQuickStart,
  recentWorkouts,
  onPreviewFromHistory,
  onClearHistory,
}: {
  onChoosePlan: () => void;
  onQuickStart: () => void;
  recentWorkouts: WorkoutHistory[];
  onPreviewFromHistory: (historyItem: WorkoutHistory) => void;
  onClearHistory: () => void;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  return (
    <ScrollView contentContainerStyle={styles.startViewContainer}>
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
}: {
  plan: WorkoutPlan;
  onFinish: (finishedPlan: WorkoutPlan) => void;
  onViewExerciseDetails: (exercise: Workout) => void;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [setCompletion, setSetCompletion] = useState<SetCompletion>({});
  const [isResting, setIsResting] = useState(false);

  const workoutTimer = useTimer();
  const restTimer = useCountdown(60, () => {
    setIsResting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  });

  useEffect(() => {
    workoutTimer.start();
    return () => workoutTimer.pause();
  }, []);

  const handleToggleSet = (exerciseIndex: number, setIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newCompletion = { ...setCompletion };
    if (!newCompletion[exerciseIndex]) {
      newCompletion[exerciseIndex] = [];
    }
    newCompletion[exerciseIndex][setIndex] =
      !newCompletion[exerciseIndex][setIndex];

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSetCompletion(newCompletion);

    const currentWorkout = plan.workouts[exerciseIndex];
    const allSetsComplete =
      newCompletion[exerciseIndex]?.filter(Boolean).length ===
      currentWorkout.sets;

    if (allSetsComplete && exerciseIndex < plan.workouts.length - 1) {
      setTimeout(() => {
        setCurrentExerciseIndex(exerciseIndex + 1);
      }, 300);
    }
  };

  const handleStartRest = () => {
    setIsResting(true);
    restTimer.start(60);
  };

  const handleFinishWorkout = () => {
    Alert.alert(
      "Finish Workout?",
      "Are you sure you want to end this session?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Finish", style: "destructive", onPress: () => onFinish(plan) },
      ]
    );
  };

  const completedSetsForCurrent =
    setCompletion[currentExerciseIndex]?.filter(Boolean).length || 0;
  const totalSetsForCurrent = plan.workouts[currentExerciseIndex].sets;
  const isCurrentExerciseComplete =
    completedSetsForCurrent === totalSetsForCurrent;

  return (
    <View style={styles.activeWorkoutContainer}>
      <ScrollView contentContainerStyle={styles.activeWorkoutScrollView}>
        <View style={styles.timerContainer}>
          <View>
            <Text style={styles.timerLabel}>
              {isResting ? "RESTING" : "ELAPSED TIME"}
            </Text>
            <Text style={styles.timerText}>
              {isResting
                ? `00:${restTimer.time.toString().padStart(2, "0")}`
                : workoutTimer.formattedTime}
            </Text>
          </View>
        </View>

        {plan.workouts.map((exercise, exIndex) => (
          <View
            key={exIndex}
            style={[
              styles.exerciseCard,
              currentExerciseIndex === exIndex && styles.exerciseCardActive,
            ]}
          >
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.sets} sets, {exercise.reps} reps
                </Text>
              </View>
              <TouchableOpacity onPress={() => onViewExerciseDetails(exercise)}>
                <Feather name="info" size={22} color={colors.subtleText} />
              </TouchableOpacity>
            </View>
            <View style={styles.setsContainer}>
              {Array.from({ length: Number(exercise.sets) || 0 }).map(
                (_, setIndex) => {
                  const isComplete =
                    setCompletion[exIndex]?.[setIndex] || false;
                  return (
                    <TouchableOpacity
                      key={setIndex}
                      style={[
                        styles.setCircle,
                        isComplete && styles.setCircleComplete,
                      ]}
                      onPress={() => handleToggleSet(exIndex, setIndex)}
                    >
                      {isComplete ? (
                        <Feather name="check" size={20} color={"#fff"} />
                      ) : (
                        <Text style={styles.setText}>{setIndex + 1}</Text>
                      )}
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
            {isCurrentExerciseComplete &&
              currentExerciseIndex === exIndex &&
              !isResting && (
                <TouchableOpacity
                  style={styles.restButton}
                  onPress={handleStartRest}
                >
                  <Feather name="clock" size={18} color={"#fff"} />
                  <Text style={styles.restButtonText}>Start 60s Rest</Text>
                </TouchableOpacity>
              )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <MusicPlayerCard />
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinishWorkout}
        >
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </TouchableOpacity>
      </View>
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

const ExerciseDetailModal = ({
  visible,
  onClose,
  exercise,
}: {
  visible: boolean;
  onClose: () => void;
  exercise: Exercise | null;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];

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
      <SafeAreaView style={styles.detailModalContainer}>
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
      </SafeAreaView>
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
  const isFocused = useIsFocused();

  const [isLoading, setIsLoading] = useState(true);
  const [allPlans, setAllPlans] = useState<WorkoutPlan[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutHistory[]>([]);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [isPlanSelectorVisible, setIsPlanSelectorVisible] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<WorkoutPlan | null>(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

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
      const plans = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as WorkoutPlan))
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
    const q = query(
      historyCollectionRef,
      orderBy("completedAt", "desc"),
      limit(20)
    );
    try {
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as WorkoutHistory)
      );

      const uniqueWorkouts: WorkoutHistory[] = [];
      const seenPlanIds = new Set<string>();
      for (const workout of history) {
        if (!seenPlanIds.has(workout.planId)) {
          uniqueWorkouts.push(workout);
          seenPlanIds.add(workout.planId);
        }
        if (uniqueWorkouts.length >= 4) {
          break;
        }
      }
      setRecentWorkouts(uniqueWorkouts);
    } catch (error: any) {
      console.error("Error fetching workout history: ", error);
      let errorMessage =
        "Could not load your workout history. Please check your connection and try again.";
      // Check for the specific Firestore index error message
      if (
        error.message &&
        (error.message.includes("firestore/failed-precondition") ||
          error.message.includes("requires an index"))
      ) {
        errorMessage =
          "A database index is required for this feature. Please check the developer console for a link to create it.";
      }
      Alert.alert("Loading Error", errorMessage);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchWorkoutPlans(), fetchRecentWorkouts()]);
      setIsLoading(false);
    };
    if (isFocused && user) {
      loadData();
    } else if (!user) {
      setIsLoading(false);
    }
  }, [isFocused, user, fetchWorkoutPlans, fetchRecentWorkouts]);

  const handleStartPlan = (plan: WorkoutPlan) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActivePlan(plan);
    setIsPlanSelectorVisible(false);
    setIsPreviewModalVisible(false);
  };

  const handleSelectPlanForPreview = (plan: WorkoutPlan) => {
    setPreviewPlan(plan);
    setIsPlanSelectorVisible(false);
    setIsPreviewModalVisible(true);
  };

  const handlePreviewFromHistory = (historyItem: WorkoutHistory) => {
    const planToPreview = allPlans.find(
      (plan) => plan.id === historyItem.planId
    );
    if (planToPreview) {
      setPreviewPlan(planToPreview);
      setIsPreviewModalVisible(true);
    } else {
      Alert.alert(
        "Plan Not Found",
        "This workout plan may have been deleted. Please choose another from the list."
      );
    }
  };

  const handleQuickStart = () => {
    Alert.alert(
      "Quick Start",
      "This would navigate to a temporary plan creation modal."
    );
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
            try {
              const historyCollectionRef = collection(
                db,
                "users",
                user.uid,
                "workoutHistory"
              );
              const batch = writeBatch(db);
              const querySnapshot = await getDocs(query(historyCollectionRef));
              querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
              });
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

  const handleFinishWorkout = async (finishedPlan: WorkoutPlan) => {
    if (!user) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const historyDoc = {
      planId: finishedPlan.id,
      planName: finishedPlan.planName,
      icon: finishedPlan.icon,
      completedAt: serverTimestamp(),
    };

    try {
      const historyCollectionRef = collection(
        db,
        "users",
        user.uid,
        "workoutHistory"
      );
      await addDoc(historyCollectionRef, historyDoc);
      fetchRecentWorkouts();
    } catch (error) {
      console.error("Error saving workout history: ", error);
    }

    setActivePlan(null);
  };

  const handleViewExerciseDetails = (workout: Workout) => {
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
      {activePlan ? (
        <>
          <Header title={activePlan.planName} />
          <ActiveWorkoutView
            plan={activePlan}
            onFinish={handleFinishWorkout}
            onViewExerciseDetails={handleViewExerciseDetails}
          />
        </>
      ) : (
        <StartWorkoutView
          onChoosePlan={() => setIsPlanSelectorVisible(true)}
          onQuickStart={handleQuickStart}
          recentWorkouts={recentWorkouts}
          onPreviewFromHistory={handlePreviewFromHistory}
          onClearHistory={handleClearHistory}
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
      paddingBottom: 220, // Ensures content doesn't hide behind footer
    },
    timerContainer: {
      alignItems: "flex-end",
      paddingVertical: 10,
      paddingHorizontal: 20,
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
      padding: 20,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: scheme === "light" ? 0.05 : 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    exerciseCardActive: {
      borderColor: colors.primary,
      borderWidth: 1,
      shadowColor: colors.primary,
      shadowOpacity: scheme === "light" ? 0.2 : 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
    exerciseHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
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
    setsContainer: {
      flexDirection: "row",
      gap: 12,
      flexWrap: "wrap",
    },
    setCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
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
    setText: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.subtleText,
    },
    restButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 25,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 20,
    },
    restButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    // Footer
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      paddingBottom: 30,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
  });
};
