/**
 * @file index.tsx
 * @description This is the main dashboard or home screen for the application.
 *
 * --- COMPONENT OVERVIEW ---
 *
 * 1.  IndexScreen (Main Component):
 * - Displays a personalized greeting to the user.
 * - Fetches the user's first name from the `/users/{uid}` document in Firestore.
 * - Shows a random motivational quote.
 * - Displays a "Today's Agenda" card which either shows the scheduled workout plan for the current day or a "Rest Day" card.
 * - Provides a "Stats Overview" card with metrics like total plans and sessions completed.
 * - Includes "Quick Actions" to navigate to other parts of the app, like viewing workout plans.
 *
 * --- FIREBASE INTEGRATION ---
 *
 * This screen interacts with two main Firestore collections:
 *
 * 1.  `users` collection:
 * - `fetchUserData`: On load, it fetches the document corresponding to the logged-in user's UID (`/users/{uid}`). It reads the `firstName` field to personalize the greeting message.
 *
 * 2.  `workoutPlans` collection (under the user's UID):
 * - `fetchUserData`: Reads all documents from `/users/{uid}/workoutPlans` to determine if there is a plan scheduled for the current day of the week.
 */
import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
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
    primary: "#6D28D9", // Deep Purple
    primaryAccent: "#8B5CF6",
    destructive: "#EF4444",
    success: "#22C55E",
    skeleton: "#E1E1E1",
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
    skeleton: "#2C2C2E",
  },
};

// --- CONSTANTS ---
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MOTIVATIONAL_MESSAGES = [
  "The only bad workout is the one that didn't happen.",
  "Sweat is just fat crying.",
  "Your body can stand almost anything. It’s your mind that you have to convince.",
  "Success isn't always about greatness. It's about consistency.",
  "Train insane or remain the same.",
];

// --- TYPE DEFINITIONS ---
interface Workout {
  name: string;
  sets: string;
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

// =================================================================================================
// --- LOADING SKELETON COMPONENTS ---
// =================================================================================================

const SkeletonBlock = ({
  width,
  height,
  borderRadius = 12,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) => {
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

const LoadingSkeleton = () => {
  const styles = getStyles(useColorScheme() ?? "light");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scrollContainer}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <SkeletonBlock width="80%" height={40} />
          <SkeletonBlock width="60%" height={20} style={{ marginTop: 10 }} />
        </View>

        {/* Quote Skeleton */}
        <View style={styles.section}>
          <SkeletonBlock width={150} height={26} style={{ marginBottom: 15 }} />
          <SkeletonBlock width="100%" height={100} borderRadius={16} />
        </View>

        {/* Today's Plan Skeleton */}
        <View style={styles.section}>
          <SkeletonBlock width={180} height={26} style={{ marginBottom: 15 }} />
          <SkeletonBlock width="100%" height={200} borderRadius={16} />
        </View>
      </View>
    </SafeAreaView>
  );
};

// =================================================================================================
// --- UI COMPONENTS ---
// =================================================================================================
const MotivationalQuote = ({ quote }: { quote: string }) => {
  const styles = getStyles(useColorScheme() ?? "light");
  return (
    <View style={styles.card}>
      <Text style={styles.quoteText}>“{quote}”</Text>
    </View>
  );
};

const WorkoutItem = ({ item, isLast }: { item: Workout; isLast: boolean }) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  return (
    <View
      style={[
        styles.workoutItemContainer,
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
      ]}
    >
      <Text style={styles.workoutItemName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.workoutItemSetsReps}>
        {item.sets} x {item.reps}
      </Text>
    </View>
  );
};

const TodaysWorkoutCard = ({ plan }: { plan: WorkoutPlan }) => {
  const styles = getStyles(useColorScheme() ?? "light");

  return (
    <View style={styles.card}>
      <View style={styles.todaysPlanHeader}>
        <View style={styles.iconContainer}>
          <Text style={styles.todaysPlanIcon}>{plan.icon || "💪"}</Text>
        </View>
        <View style={styles.todaysPlanTextContainer}>
          <Text style={styles.todaysPlanTitle}>{plan.planName}</Text>
          <Text style={styles.todaysPlanSubtitle}>
            {plan.workouts.length} exercises scheduled
          </Text>
        </View>
      </View>

      <View style={styles.workoutListContainer}>
        {plan.workouts.slice(0, 4).map((workout, index) => (
          <WorkoutItem
            key={index}
            item={workout}
            isLast={index === plan.workouts.length - 1 || index === 3}
          />
        ))}
      </View>

      <Link href="/(tabs)/start" asChild>
        <TouchableOpacity style={styles.primaryButton}>
          <Feather name="play" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Begin Session</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const RestDayCard = () => {
  const styles = getStyles(useColorScheme() ?? "light");
  return (
    <View style={[styles.card, styles.restDayContainer]}>
      <Text style={styles.restDayIcon}>🧘</Text>
      <Text style={styles.restDayTitle}>Rest Day</Text>
      <Text style={styles.restDaySubtitle}>
        Relax, recover, and get ready for your next session.
      </Text>
    </View>
  );
};

const StatItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof Feather>["name"];
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  return (
    <View style={styles.statItemContainer}>
      <View style={styles.statIconBG}>
        <Feather name={icon} size={22} color={colors.primary} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
};

const StatsOverviewCard = ({ planCount }: { planCount: number }) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const sessionsCompleted = 12; // This can be replaced with actual data later

  return (
    <View style={styles.card}>
      <View style={styles.statsContainer}>
        <StatItem label="Workout Plans" value={planCount} icon="clipboard" />
        <StatItem
          label="Sessions Done"
          value={sessionsCompleted}
          icon="check-circle"
        />
      </View>
    </View>
  );
};

const QuickAction = ({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  return (
    <Link href={href as any} asChild>
      <TouchableOpacity style={styles.actionButtonWrapper}>
        <View style={[styles.card, styles.actionButtonContent]}>
          <Feather name={icon} size={24} color={colors.primary} />
          <Text style={styles.actionButtonText}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

// =================================================================================================
// --- MAIN SCREEN ---
// =================================================================================================

export default function IndexScreen() {
  const { user } = useAuth();
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [userName, setUserName] = useState("Fitness Fan");

  const motivationalQuote = useMemo(
    () =>
      MOTIVATIONAL_MESSAGES[
        Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
      ],
    []
  );

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserName(userData.firstName || "Fitness Fan");
      }
      // Also fetch workout plans
      const plansCollectionRef = collection(
        db,
        "users",
        user.uid,
        "workoutPlans"
      );
      const querySnapshot = await getDocs(plansCollectionRef);
      const fetchedPlans = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as WorkoutPlan))
        .sort((a, b) => a.order - b.order);
      setPlans(fetchedPlans);
    } catch (error) {
      console.error("Error fetching user data and plans: ", error);
    }
  }, [user]);

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      await fetchUserData();
      setIsLoading(false);
    };
    if (user) {
      initialLoad();
    } else {
      setIsLoading(false);
    }
  }, [user, fetchUserData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, [fetchUserData]);

  const todaysPlan = useMemo(() => {
    const todayIndex = new Date().getDay();
    const todayShort = DAYS_OF_WEEK[todayIndex];
    return plans.find((plan) => plan.selectedDays.includes(todayShort)) || null;
  }, [plans]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
        {/* --- HEADER GREETING --- */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {userName}</Text>
          <Text style={styles.subGreeting}>{dateString}</Text>
        </View>

        {/* --- MOTIVATIONAL QUOTE --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food for Thought</Text>
          <MotivationalQuote quote={motivationalQuote} />
        </View>

        {/* --- TODAY'S PLAN CARD --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Agenda</Text>
          {todaysPlan ? (
            <TodaysWorkoutCard plan={todaysPlan} />
          ) : (
            <RestDayCard />
          )}
        </View>

        {/* --- STATS OVERVIEW --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <StatsOverviewCard planCount={plans.length} />
        </View>

        {/* --- QUICK ACTIONS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              href="/(tabs)/workoutPlan"
              label="My Plans"
              icon="list"
            />
            <QuickAction
              href="/(tabs)/workoutPlan"
              label="Explore"
              icon="search"
            />
          </View>
        </View>
      </ScrollView>
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
    scrollContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 30,
    },
    greeting: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
    },
    subGreeting: {
      fontSize: 16,
      color: colors.subtleText,
      marginTop: 4,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: scheme === "light" ? 0.05 : 0.1,
      shadowRadius: 5,
      elevation: 2,
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
    iconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primary + "1A",
    },
    quoteText: {
      fontSize: 16,
      color: colors.text,
      fontStyle: "italic",
      lineHeight: 24,
    },
    todaysPlanHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    todaysPlanIcon: {
      fontSize: 24,
    },
    todaysPlanTextContainer: {
      marginLeft: 15,
      flex: 1,
    },
    todaysPlanTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    todaysPlanSubtitle: {
      fontSize: 14,
      color: colors.subtleText,
      marginTop: 2,
    },
    workoutListContainer: {
      marginBottom: 20,
    },
    workoutItemContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    workoutItemName: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      flex: 1,
      marginRight: 10,
    },
    workoutItemSetsReps: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.subtleText,
    },
    restDayContainer: {
      alignItems: "center",
      paddingVertical: 30,
    },
    restDayIcon: {
      fontSize: 40,
      marginBottom: 15,
    },
    restDayTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    restDaySubtitle: {
      fontSize: 15,
      color: colors.subtleText,
      textAlign: "center",
      lineHeight: 22,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    statItemContainer: {
      alignItems: "center",
      gap: 12,
    },
    statIconBG: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primary + "1A",
    },
    statValue: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
    },
    statLabel: {
      fontSize: 14,
      color: colors.subtleText,
      fontWeight: "500",
    },
    actionsGrid: {
      flexDirection: "row",
      gap: 15,
    },
    actionButtonWrapper: {
      flex: 1,
    },
    actionButtonContent: {
      alignItems: "flex-start",
      justifyContent: "space-between",
      minHeight: 120,
    },
    actionButtonText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "bold",
    },
  });
};
