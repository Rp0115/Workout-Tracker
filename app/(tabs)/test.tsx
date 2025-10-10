/**
 * @file test.tsx
 * @description This screen serves as a data visualization dashboard, displaying the user's workout progress and statistics.
 *
 * --- FEATURES ---
 * 1.  Data Fetching: On component mount, it fetches all workout history from both the `workoutHistory` and `workoutQuickHistory` Firestore collections.
 * 2.  Data Processing: The fetched data is processed to calculate key metrics:
 * -   Total workouts and total duration.
 * -   Workout frequency for the current week (displayed in a bar chart).
 * -   Strength progression for the most frequently performed exercise (displayed in a line chart).
 * 3.  Visualizations: Uses `react-native-gifted-charts` to render beautiful and interactive charts.
 * 4.  Dynamic Content: Includes a tab-based view to switch between different timeframes for analysis.
 * 5.  User Feedback: Displays a loading indicator while data is being fetched and an empty state message if no workout history is available.
 */

import { Feather } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";

// --- UNIFIED COLOR PALETTE ---
const Colors = {
  light: {
    background: "#F0F2F5",
    card: "#FFFFFF",
    text: "#1C1C1E",
    subtleText: "#6E6E73",
    border: "#E5E7EB",
    primary: "#6D28D9",
    primaryAccent: "#8B5CF6",
    success: "#22C55E",
    chartLine: "#A78BFA",
    chartPoint: "#FFFFFF",
    chartPointBorder: "#8B5CF6",
  },
  dark: {
    background: "#111827",
    card: "#1F2937",
    text: "#F9FAFB",
    subtleText: "#9CA3AF",
    border: "#374151",
    primary: "#8B5CF6",
    primaryAccent: "#A78BFA",
    success: "#4ADE80",
    chartLine: "#A78BFA",
    chartPoint: "#111827",
    chartPointBorder: "#FFFFFF",
  },
};

// --- TYPE DEFINITIONS ---
interface WorkoutHistory {
  id: string;
  completedAt: Timestamp;
  duration: number; // in seconds
  exercises: {
    name: string;
    sets: { reps: string; weight: string }[];
  }[];
}

interface ChartDataPoint {
  value: number;
  label: string;
}

// --- MAIN SCREEN ---
export default function TestScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [workoutData, setWorkoutData] = useState<WorkoutHistory[]>([]);
  const [activeTab, setActiveTab] = useState("Weekly");

  const fetchWorkoutHistory = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const historyRef = collection(db, "users", user.uid, "workoutHistory");
      const quickHistoryRef = collection(
        db,
        "users",
        user.uid,
        "workoutQuickHistory"
      );

      const historyQuery = query(historyRef, orderBy("completedAt", "desc"));
      const quickHistoryQuery = query(
        quickHistoryRef,
        orderBy("completedAt", "desc")
      );

      const [historySnapshot, quickHistorySnapshot] = await Promise.all([
        getDocs(historyQuery),
        getDocs(quickHistoryQuery),
      ]);

      const combinedHistory = [
        ...historySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as WorkoutHistory)
        ),
        ...quickHistorySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as WorkoutHistory)
        ),
      ].sort((a, b) => b.completedAt.toMillis() - a.completedAt.toMillis());

      setWorkoutData(combinedHistory);
    } catch (error) {
      console.error("Error fetching workout history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkoutHistory();
  }, [fetchWorkoutHistory]);

  // --- DATA PROCESSING ---
  const processedData = React.useMemo(() => {
    if (workoutData.length === 0) return null;

    // Weekly Frequency
    const weeklyData: ChartDataPoint[] = [
      { value: 0, label: "Sun" },
      { value: 0, label: "Mon" },
      { value: 0, label: "Tue" },
      { value: 0, label: "Wed" },
      { value: 0, label: "Thu" },
      { value: 0, label: "Fri" },
      { value: 0, label: "Sat" },
    ];
    const today = new Date();
    const firstDayOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay())
    );
    firstDayOfWeek.setHours(0, 0, 0, 0);

    workoutData.forEach((workout) => {
      const workoutDate = workout.completedAt.toDate();
      if (workoutDate >= firstDayOfWeek) {
        const dayIndex = workoutDate.getDay();
        weeklyData[dayIndex].value += 1;
      }
    });

    // Total Stats
    const totalWorkouts = workoutData.length;
    const totalDurationMinutes = Math.round(
      workoutData.reduce((sum, workout) => sum + (workout.duration || 0), 0) /
        60
    );

    // Exercise Progression
    const exerciseCounts: { [key: string]: number } = {};
    workoutData.forEach((workout) => {
      (workout.exercises || []).forEach((ex) => {
        exerciseCounts[ex.name] = (exerciseCounts[ex.name] || 0) + 1;
      });
    });

    const mostFrequentExercise =
      Object.keys(exerciseCounts).length > 0
        ? Object.keys(exerciseCounts).reduce(
            (a, b) => (exerciseCounts[a] > exerciseCounts[b] ? a : b),
            ""
          )
        : "";

    let progressionData: ChartDataPoint[] = [];
    if (mostFrequentExercise) {
      progressionData = workoutData
        .map((workout) => {
          const exercise = (workout.exercises || []).find(
            (ex) => ex.name === mostFrequentExercise
          );
          if (!exercise) return null;

          const maxWeight = Math.max(
            ...exercise.sets.map((set) => parseFloat(set.weight) || 0)
          );

          return {
            value: maxWeight,
            label: workout.completedAt
              .toDate()
              .toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          };
        })
        .filter(
          (item): item is ChartDataPoint => item !== null && item.value > 0
        )
        .reverse()
        .slice(-10);
    }

    return {
      weeklyData,
      totalWorkouts,
      totalDurationMinutes,
      progressionData,
      mostFrequentExercise,
    };
  }, [workoutData]);

  const customDataPoint = () => {
    return (
      <View
        style={{
          width: 14,
          height: 14,
          backgroundColor: colors.chartPoint,
          borderWidth: 3,
          borderRadius: 7,
          borderColor: colors.chartPointBorder,
        }}
      />
    );
  };

  // --- RENDER ---
  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!processedData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No workout data yet.</Text>
          <Text style={styles.emptySubText}>
            Complete a workout to see your stats!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Your progress at a glance</Text>
        </View>

        <View style={styles.tabContainer}>
          {["Weekly", "Monthly", "All Time"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statRow}>
          <StatCard
            icon="zap"
            value={processedData.totalWorkouts}
            label="Total Workouts"
          />
          <StatCard
            icon="clock"
            value={`${processedData.totalDurationMinutes}m`}
            label="Total Duration"
          />
        </View>

        <ChartCard title="Weekly Frequency">
          <BarChart
            data={processedData.weeklyData}
            barWidth={30}
            barBorderRadius={6}
            frontColor={colors.primary}
            yAxisTextStyle={{ color: colors.subtleText }}
            xAxisLabelTextStyle={{ color: colors.subtleText, fontSize: 12 }}
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={0}
            hideRules
          />
        </ChartCard>

        {processedData.progressionData.length > 1 && (
          <ChartCard
            title={`Progression: ${processedData.mostFrequentExercise}`}
          >
            <LineChart
              data={processedData.progressionData}
              color={colors.chartLine}
              thickness={3}
              startOpacity={0.7}
              endOpacity={0.1}
              spacing={50}
              yAxisTextStyle={{ color: colors.subtleText }}
              xAxisLabelTextStyle={{
                color: colors.subtleText,
                fontSize: 10,
                transform: [{ rotate: "-25deg" }],
              }}
              noOfSections={4}
              yAxisThickness={0}
              xAxisThickness={0}
              customDataPoint={customDataPoint}
            />
          </ChartCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- REUSABLE COMPONENTS ---
const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.chartContainer}>{children}</View>
    </View>
  );
};

const StatCard = ({
  icon,
  value,
  label,
}: {
  icon: any;
  value: string | number;
  label: string;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  return (
    <View style={[styles.card, styles.statCard]}>
      <Feather name={icon} size={24} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

// --- STYLES ---
const getStyles = (scheme: "light" | "dark") => {
  const colors = Colors[scheme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      padding: 20,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: colors.subtleText,
      marginTop: 4,
    },
    tabContainer: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.subtleText,
    },
    activeTabText: {
      color: "#FFFFFF",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: scheme === "light" ? 0.05 : 0.1,
      shadowRadius: 5,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 20,
    },
    chartContainer: {
      height: 200,
      paddingRight: 20, // To prevent labels from being cut off
    },
    statRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 15,
    },
    statCard: {
      flex: 1,
      alignItems: "center",
      gap: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    statLabel: {
      fontSize: 14,
      color: colors.subtleText,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    emptySubText: {
      fontSize: 16,
      color: colors.subtleText,
      marginTop: 8,
      textAlign: "center",
    },
  });
};
