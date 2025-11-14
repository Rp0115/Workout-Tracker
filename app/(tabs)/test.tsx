/**
 * @file test.tsx
 * @description This screen serves as a data visualization dashboard, displaying the user's workout progress and statistics.
 *
 * --- FEATURES ---
 * 1.  Data Fetching: On component mount, it fetches all workout history from both the `workoutHistory` and `workoutQuickHistory` Firestore collections.
 * 2.  Data Processing: The fetched data is processed to calculate key metrics:
 * -   Total workouts and duration (Weekly, Monthly, Yearly).
 * -   Bar chart and Line Chart horizontal rules no longer overflow.
 * -   Strength progression for the most frequently performed exercise.
 * 3.  Visualizations: Uses `react-native-gifted-charts` to render beautiful and interactive charts.
 * 4.  Dynamic Content: The Stat Cards and Bar Chart now update when the "Weekly", "Monthly", or "Yearly" tabs are toggled.
 * 5.  User Feedback: Displays a loading indicator while data is being fetched and an empty state message if no workout history is available.
 * 6.  Drill-down: Users can tap on a bar in the chart to see a modal with details for that day/month.
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
  Modal,
  Pressable,
  RefreshControl,
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
  planName?: string;
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

interface WorkoutDrilldown {
  name: string;
  duration: number; // in seconds
}

interface DayDetail {
  label: string;
  workoutCount: number;
  totalDuration: number; // Total seconds for this day
  workouts: WorkoutDrilldown[];
  fullDate: Date; // To display in the modal
}

interface ChartBar extends DayDetail {
  value: number; // The dynamic value (in minutes or hours) for the bar height
}

// --- HELPER FUNCTIONS ---
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

const calculateYAxis = (data: DayDetail[]) => {
  const maxDurationInSeconds = Math.max(...data.map((d) => d.totalDuration));
  // Use minutes if max is < 2 hours, otherwise use hours
  const useMinutes = maxDurationInSeconds < 7200;
  const yAxisTitle = useMinutes ? "Minutes" : "Hours";
  const yAxisSuffix = useMinutes ? "m" : "h";

  let maxValue = useMinutes
    ? maxDurationInSeconds / 60
    : maxDurationInSeconds / 3600;

  let stepValue: number | undefined;

  if (maxValue === 0) {
    if (useMinutes) {
      maxValue = 60;
      stepValue = 15;
    } else {
      maxValue = 2;
      stepValue = 0.5;
    }
  } else if (useMinutes) {
    maxValue = Math.ceil(maxValue / 15) * 15;
    stepValue = 15;
  } else {
    // For hours
    maxValue = Math.ceil(maxValue * 2) / 2; // Round up to nearest 0.5
    stepValue = 0.5;
  }

  const formatYLabel = (label: string) => {
    if (useMinutes) {
      return Math.round(Number(label)).toString();
    }
    return Number(label).toFixed(1); // 1 decimal for hours
  };

  return {
    useMinutes,
    yAxisTitle,
    yAxisSuffix,
    formatYLabel,
    maxValue,
    stepValue,
    noOfSections: undefined,
  };
};
// --- END HELPER FUNCTIONS ---

// --- MAIN SCREEN ---
export default function TestScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workoutData, setWorkoutData] = useState<WorkoutHistory[]>([]);
  const [activeTab, setActiveTab] = useState("Weekly");

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<ChartBar | null>(null);

  const fetchWorkoutHistory = useCallback(async () => {
    if (!user) {
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
    }
  }, [user]);

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      await fetchWorkoutHistory();
      setIsLoading(false);
    };

    if (user) {
      initialLoad();
    } else {
      setIsLoading(false);
    }
  }, [fetchWorkoutHistory, user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWorkoutHistory();
    setRefreshing(false);
  }, [fetchWorkoutHistory]);

  // --- DATA PROCESSING (HEAVILY MODIFIED) ---
  const processedData = React.useMemo(() => {
    if (workoutData.length === 0) return null;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // --- 1. Weekly Data ---
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const firstDayOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const weeklyData: DayDetail[] = dayLabels.map((label, index) => {
      const date = new Date(firstDayOfWeek);
      date.setDate(date.getDate() + index);
      return {
        label: label,
        workoutCount: 0,
        totalDuration: 0,
        workouts: [],
        fullDate: date,
      };
    });

    // --- 2. Monthly Data ---
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthlyData: DayDetail[] = Array.from(
      { length: daysInMonth },
      (_, i) => {
        const date = new Date(currentYear, currentMonth, i + 1);
        return {
          label: (i + 1).toString(), // Label is "1", "2", ... "31"
          workoutCount: 0,
          totalDuration: 0,
          workouts: [],
          fullDate: date,
        };
      }
    );

    // --- 3. Yearly Data ---
    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const yearlyData: DayDetail[] = monthLabels.map((label, index) => ({
      label: label,
      workoutCount: 0,
      totalDuration: 0,
      workouts: [],
      fullDate: new Date(currentYear, index, 1), // Date is just for the modal title
    }));

    let yearlyTotalWorkouts = 0;
    let yearlyTotalDurationSeconds = 0;

    // --- 4. Process All Data ---
    workoutData.forEach((workout) => {
      const workoutDate = workout.completedAt.toDate();
      const workoutName =
        workout.planName || workout.exercises?.[0]?.name || "Unnamed Workout";

      // Add to Weekly
      if (workoutDate >= firstDayOfWeek) {
        const dayIndex = workoutDate.getDay();
        weeklyData[dayIndex].workoutCount += 1;
        weeklyData[dayIndex].totalDuration += workout.duration || 0;
        weeklyData[dayIndex].workouts.push({
          name: workoutName,
          duration: workout.duration || 0,
        });
      }

      // Add to Monthly
      if (
        workoutDate.getMonth() === currentMonth &&
        workoutDate.getFullYear() === currentYear
      ) {
        const dayOfMonth = workoutDate.getDate(); // 1-31
        monthlyData[dayOfMonth - 1].workoutCount += 1;
        monthlyData[dayOfMonth - 1].totalDuration += workout.duration || 0;
        monthlyData[dayOfMonth - 1].workouts.push({
          name: workoutName,
          duration: workout.duration || 0,
        });
      }

      // Add to Yearly
      if (workoutDate.getFullYear() === currentYear) {
        const monthIndex = workoutDate.getMonth();
        yearlyData[monthIndex].workoutCount += 1;
        yearlyData[monthIndex].totalDuration += workout.duration || 0;
        yearlyData[monthIndex].workouts.push({
          name: workoutName,
          duration: workout.duration || 0,
        });
        // Also add to yearly totals
        yearlyTotalWorkouts += 1;
        yearlyTotalDurationSeconds += workout.duration || 0;
      }
    });

    // --- 5. Calculate Tab-Specific Totals ---
    const weeklyTotalWorkouts = weeklyData.reduce(
      (sum, day) => sum + day.workoutCount,
      0
    );
    const weeklyTotalDurationSeconds = weeklyData.reduce(
      (sum, day) => sum + day.totalDuration,
      0
    );
    const monthlyTotalWorkouts = monthlyData.reduce(
      (sum, day) => sum + day.workoutCount,
      0
    );
    const monthlyTotalDurationSeconds = monthlyData.reduce(
      (sum, day) => sum + day.totalDuration,
      0
    );

    // --- 6. Exercise Progression (All Time) ---
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
      monthlyData,
      yearlyData,

      weeklyTotalWorkouts,
      weeklyTotalDurationSeconds,
      monthlyTotalWorkouts,
      monthlyTotalDurationSeconds,
      yearlyTotalWorkouts,
      yearlyTotalDurationSeconds,

      progressionData,
      mostFrequentExercise,
    };
  }, [workoutData]);

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
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Analytics</Text>
          </View>
          <View style={styles.center}>
            <Text style={styles.emptyText}>No workout data yet.</Text>
            <Text style={styles.emptySubText}>
              Complete a workout to see your stats!
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- DYNAMIC DATA PREPARATION ---

  // 1. Determine which data to show
  let activeDayData: DayDetail[];
  let barWidth = 25;
  let spacing = 10;
  let chartTitle = "Weekly";

  if (activeTab === "Weekly") {
    activeDayData = processedData.weeklyData;
    barWidth = 25;
    spacing = 10;
    chartTitle = "Weekly";
  } else if (activeTab === "Monthly") {
    activeDayData = processedData.monthlyData;
    barWidth = 12;
    spacing = 15;
    chartTitle = "Monthly";
  } else {
    // Yearly
    activeDayData = processedData.yearlyData;
    barWidth = 18;
    spacing = 12;
    chartTitle = "Yearly";
  }

  // 2. Get Y-Axis properties based on that data
  const yAxisProps = calculateYAxis(activeDayData);

  // 3. Create the final chart data with the correct 'value'
  const finalChartData = activeDayData.map((day) => ({
    ...day,
    value: yAxisProps.useMinutes
      ? day.totalDuration / 60
      : day.totalDuration / 3600,
  }));

  // 4. Determine Stat Card values
  let displayTotalWorkouts = 0;
  let displayTotalDurationMinutes = 0;

  if (activeTab === "Weekly") {
    displayTotalWorkouts = processedData.weeklyTotalWorkouts;
    displayTotalDurationMinutes = Math.round(
      processedData.weeklyTotalDurationSeconds / 60
    );
  } else if (activeTab === "Monthly") {
    displayTotalWorkouts = processedData.monthlyTotalWorkouts;
    displayTotalDurationMinutes = Math.round(
      processedData.monthlyTotalDurationSeconds / 60
    );
  } else {
    // Yearly
    displayTotalWorkouts = processedData.yearlyTotalWorkouts;
    displayTotalDurationMinutes = Math.round(
      processedData.yearlyTotalDurationSeconds / 60
    );
  }

  // Handler for bar press
  const handleBarPress = (item: ChartBar) => {
    if (item.workoutCount === 0) return;
    setSelectedDayData(item);
    setIsDetailModalVisible(true);
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Your progress at a glance</Text>
        </View>

        <View style={styles.tabContainer}>
          {/* --- MODIFIED: Renamed "All Time" to "Yearly" --- */}
          {["Weekly", "Monthly", "Yearly"].map((tab) => (
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
            value={displayTotalWorkouts}
            label="Total Workouts"
          />
          <StatCard
            icon="clock"
            value={`${displayTotalDurationMinutes}m`}
            label="Total Duration"
          />
        </View>

        {/* --- MODIFIED: BarChart --- */}
        <ChartCard title={`${chartTitle} Duration (${yAxisProps.yAxisTitle})`}>
          <BarChart
            data={finalChartData}
            barWidth={barWidth}
            spacing={spacing}
            barBorderRadius={6}
            frontColor={colors.primary}
            yAxisTextStyle={styles.yAxisLabelStyle}
            xAxisLabelTextStyle={{ color: colors.subtleText, fontSize: 12 }}
            noOfSections={yAxisProps.noOfSections}
            stepValue={yAxisProps.stepValue}
            maxValue={yAxisProps.maxValue}
            yAxisThickness={0}
            xAxisThickness={0}
            rulesColor={colors.border}
            rulesType="solid"
            onPress={handleBarPress}
            yAxisLabelSuffix={` ${yAxisProps.yAxisSuffix}`}
            formatYLabel={yAxisProps.formatYLabel}
            paddingRight={40} // <-- FIX APPLIED
          />
        </ChartCard>

        {/* --- MODIFIED: LineChart --- */}
        {/* Now shown on "Yearly" tab */}
        {activeTab === "Yearly" && processedData.progressionData.length > 1 && (
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
              yAxisTextStyle={styles.yAxisLabelStyle}
              yAxisLabelSuffix=" lbs"
              xAxisLabelTextStyle={{
                color: colors.subtleText,
                fontSize: 10,
                transform: [{ rotate: "-25deg" }],
              }}
              noOfSections={4}
              yAxisThickness={0}
              xAxisThickness={0}
              customDataPoint={customDataPoint}
              rulesColor={colors.border}
              rulesType="solid"
              paddingRight={40} // <-- FIX APPLIED
            />
          </ChartCard>
        )}
      </ScrollView>

      <WorkoutDayDetailModal
        visible={isDetailModalVisible}
        onClose={() => setIsDetailModalVisible(false)}
        data={selectedDayData}
        styles={styles}
        colors={colors}
      />
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

// --- MODIFIED: Modal Component ---
const WorkoutDayDetailModal = ({
  visible,
  onClose,
  data,
  styles,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  data: ChartBar | null;
  styles: ReturnType<typeof getStyles>;
  colors: (typeof Colors)["light" | "dark"];
}) => {
  if (!data) return null;

  // --- MODIFIED: Modal title is now dynamic ---
  let dateString = data.fullDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // If the label is a month name (e.g., "Jan"), format as "Month Year"
  if (data.label.length === 3 && isNaN(Number(data.label))) {
    dateString = data.fullDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{dateString}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x-circle" size={26} color={colors.subtleText} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>
              Total Duration: {formatDuration(data.totalDuration)}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.modalSectionTitle}>
              Workouts ({data.workoutCount})
            </Text>
            {data.workouts.map((workout, index) => (
              <View key={index} style={styles.workoutRow}>
                <Text style={styles.workoutName} numberOfLines={1}>
                  {workout.name}
                </Text>
                <Text style={styles.workoutDuration}>
                  {formatDuration(workout.duration)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
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
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 40,
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
    // --- MODIFIED: chartContainer Style ---
    chartContainer: {
      height: 220,
      // paddingRight: 20, // <-- REMOVED
      paddingBottom: 20,
    },
    // --- END MODIFICATION ---
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
    yAxisLabelStyle: {
      color: colors.subtleText,
      fontSize: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderRadius: 24,
      width: "90%",
      maxHeight: "60%",
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 15,
      marginBottom: 15,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    modalContent: {
      paddingBottom: 20,
    },
    modalSectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.subtleText,
      marginBottom: 10,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 15,
    },
    workoutRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    workoutName: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
      marginRight: 10,
    },
    workoutDuration: {
      fontSize: 16,
      color: colors.subtleText,
      fontWeight: "500",
    },
  });
};
