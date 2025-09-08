import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { collection, getDocs } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

// --- REPLACE THESE IMPORTS ---
import { useAuth } from "../../context/AuthContext";
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
  selectedDays: string[];
  workouts: Workout[];
  order: number;
  icon?: string;
}

interface SetCompletion {
  [exerciseIndex: number]: boolean[];
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
        <Text style={styles.selectableCardTitle}>{plan.planName}</Text>
        <Text style={styles.selectableCardSubtitle}>
          {plan.workouts.length} exercises
        </Text>
      </View>
      <Feather
        name="chevron-right"
        size={24}
        color={styles.selectableCardSubtitle.color}
      />
    </TouchableOpacity>
  );
};

const PreWorkoutView = ({
  allPlans,
  todaysPlan,
  onStartPlan,
  onQuickStart,
}: {
  allPlans: WorkoutPlan[];
  todaysPlan: WorkoutPlan | null;
  onStartPlan: (plan: WorkoutPlan) => void;
  onQuickStart: () => void;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const otherPlans = allPlans.filter((p) => p.id !== todaysPlan?.id);

  return (
    <ScrollView contentContainerStyle={styles.preWorkoutContainer}>
      <Text style={styles.pageTitle}>Start Session</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Suggestion</Text>
        {todaysPlan ? (
          <TouchableOpacity
            style={styles.startCard}
            onPress={() => onStartPlan(todaysPlan)}
          >
            <View style={styles.startCardGradient} />
            <Text style={styles.startCardIcon}>{todaysPlan.icon || "📅"}</Text>
            <Text style={styles.startCardTitle}>{todaysPlan.planName}</Text>
            <Text style={styles.startCardSubtitle}>
              {todaysPlan.workouts.length} exercises
            </Text>
            <View style={styles.startCardPlayButton}>
              <Feather name="play" size={22} color={Colors.light.primary} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.noPlanCard}>
            <Text style={styles.noPlanText}>
              No workout scheduled for today.
            </Text>
            <Text style={styles.noPlanSubText}>
              Choose a plan below or start a quick session.
            </Text>
          </View>
        )}
      </View>

      {otherPlans.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Another Plan</Text>
          {otherPlans.map((plan) => (
            <SelectablePlanCard
              key={plan.id}
              plan={plan}
              onPress={() => onStartPlan(plan)}
            />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onQuickStart}>
          <Feather
            name="plus-circle"
            size={20}
            color={styles.secondaryButtonText.color}
          />
          <Text style={styles.secondaryButtonText}>
            Quick Start Empty Session
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const ActiveWorkoutView = ({
  plan,
  onFinish,
}: {
  plan: WorkoutPlan;
  onFinish: () => void;
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
        { text: "Finish", style: "destructive", onPress: onFinish },
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
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>
          {isResting ? "RESTING" : "ELAPSED TIME"}
        </Text>
        <Text style={styles.timerText}>
          {isResting
            ? `00:${restTimer.time.toString().padStart(2, "0")}`
            : workoutTimer.formattedTime}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 220, paddingTop: 10 }}
      >
        {plan.workouts.map((exercise, exIndex) => (
          <View
            key={exIndex}
            style={[
              styles.exerciseCard,
              currentExerciseIndex === exIndex && styles.exerciseCardActive,
            ]}
          >
            <View style={styles.exerciseHeader}>
              <View>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.sets} sets, {exercise.reps} reps
                </Text>
              </View>
              <Feather name="info" size={22} color={colors.subtleText} />
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
  const [todaysPlan, setTodaysPlan] = useState<WorkoutPlan | null>(null);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);

  const fetchWorkoutPlans = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    // Don't show loader on re-focus, only on initial load
    // setIsLoading(true);
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

      const todayIndex = new Date().getDay();
      const todayShort = DAYS_OF_WEEK[todayIndex];
      const planForToday =
        plans.find((plan) => plan.selectedDays.includes(todayShort)) || null;

      setTodaysPlan(planForToday);
    } catch (error) {
      console.error("Error fetching workout plans: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isFocused) {
      fetchWorkoutPlans();
    }
  }, [isFocused, fetchWorkoutPlans]);

  const handleStartPlan = (plan: WorkoutPlan) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActivePlan(plan);
  };

  const handleQuickStart = () => {
    Alert.alert(
      "Quick Start",
      "This would navigate to a temporary plan creation modal."
    );
  };

  const handleFinishWorkout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActivePlan(null);
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
          <ActiveWorkoutView plan={activePlan} onFinish={handleFinishWorkout} />
        </>
      ) : (
        <PreWorkoutView
          allPlans={allPlans}
          todaysPlan={todaysPlan}
          onStartPlan={handleStartPlan}
          onQuickStart={handleQuickStart}
        />
      )}
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
      marginBottom: 10,
    },
    // Pre-Workout View
    preWorkoutContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 50, // Added margin for bottom nav bar
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
    },
    startCard: {
      backgroundColor: colors.primary,
      padding: 25,
      borderRadius: 24,
      alignItems: "center",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    startCardGradient: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.primaryAccent,
      opacity: 0.3,
      transform: [{ rotate: "-45deg" }, { scale: 2 }],
    },
    startCardIcon: {
      fontSize: 40,
      marginBottom: 10,
    },
    startCardTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    startCardSubtitle: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.9)",
      marginTop: 4,
      marginBottom: 20,
    },
    startCardPlayButton: {
      backgroundColor: "#FFFFFF",
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
    },
    noPlanCard: {
      backgroundColor: colors.card,
      padding: 25,
      borderRadius: 24,
      alignItems: "center",
    },
    noPlanText: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    noPlanSubText: {
      fontSize: 14,
      color: colors.subtleText,
      textAlign: "center",
      marginTop: 8,
    },
    selectableCard: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    selectableCardIcon: {
      fontSize: 24,
      marginRight: 15,
    },
    selectableCardInfo: {
      flex: 1,
    },
    selectableCardTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    selectableCardSubtitle: {
      fontSize: 14,
      color: colors.subtleText,
      marginTop: 2,
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 15,
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 16,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
    },
    // Active Workout View
    activeWorkoutContainer: {
      flex: 1,
    },
    timerContainer: {
      alignItems: "center",
      paddingVertical: 10,
    },
    timerLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.subtleText,
      letterSpacing: 1.5,
      marginBottom: 5,
    },
    timerText: {
      fontSize: 60,
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
      flex: 1,
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
  });
};
