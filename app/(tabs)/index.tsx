// import { Image } from "expo-image";
// import { Platform, StyleSheet } from "react-native";

// import { HelloWave } from "@/components/HelloWave";
// import ParallaxScrollView from "@/components/ParallaxScrollView";
// import { ThemedText } from "@/components/ThemedText";
// import { ThemedView } from "@/components/ThemedView";

// export default function HomeScreen() {
//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
//       headerImage={
//         <Image
//           source={require("@/assets/images/partial-react-logo.png")}
//           style={styles.reactLogo}
//         />
//       }
//     >
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText type="title">Welcome!</ThemedText>
//         <HelloWave />
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 1: Try it LOLOLOL</ThemedText>
//         <ThemedText>
//           Edit{" "}
//           <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
//           to see changes. Press{" "}
//           <ThemedText type="defaultSemiBold">
//             {Platform.select({
//               ios: "cmd + d",
//               android: "cmd + m",
//               web: "F12",
//             })}
//           </ThemedText>{" "}
//           to open developer tools.
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 2: Explore</ThemedText>
//         <ThemedText>
//           {`Tap the Explore tab to learn more about what's included in this starter app.`}
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
//         <ThemedText>
//           {`When you're ready, run `}
//           <ThemedText type="defaultSemiBold">
//             npm run reset-project
//           </ThemedText>{" "}
//           to get a fresh <ThemedText type="defaultSemiBold">app</ThemedText>{" "}
//           directory. This will move the current{" "}
//           <ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
//           <ThemedText type="defaultSemiBold">app-example</ThemedText>.
//         </ThemedText>
//       </ThemedView>
//     </ParallaxScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   titleContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   stepContainer: {
//     gap: 8,
//     marginBottom: 8,
//   },
//   reactLogo: {
//     height: 178,
//     width: 290,
//     bottom: 0,
//     left: 0,
//     position: "absolute",
//   },
// });

import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

// --- MOCK/REPLACE THESE IMPORTS ---
// Replace with your actual file paths
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";

// Bauhaus-inspired color palette
const Colors = {
  light: {
    background: "#F5F5F5",
    card: "#FFFFFF",
    text: "#1C1C1E",
    subtleText: "#6E6E73",
    border: "#D1D1D6",
    primary: "#005EB8", // Bauhaus Blue
    accent1: "#F2D027", // Bauhaus Yellow
    accent2: "#D93D1A", // Bauhaus Red
    black: "#000000",
    skeleton: "#E1E1E1",
  },
  dark: {
    background: "#000000",
    card: "#1C1C1E",
    text: "#FFFFFF",
    subtleText: "#8E8E93",
    border: "#3A3A3C",
    primary: "#0A84FF", // Lighter Blue for accessibility
    accent1: "#F2D027", // Bauhaus Yellow
    accent2: "#FF453A", // Lighter Red
    black: "#FFFFFF",
    skeleton: "#2C2C2E",
  },
};
// --- END OF MOCK IMPORTS ---

// --- CONSTANTS ---
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MOTIVATIONAL_MESSAGES = [
  "The only bad workout is the one that didn't happen.",
  "Sweat is just fat crying.",
  "Your body can stand almost anything. It’s your mind that you have to convince.",
  "Success isn't always about greatness. It's about consistency.",
  "Train insane or remain the same.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Don’t limit your challenges. Challenge your limits.",
  "Strive for progress, not perfection.",
  "Excuses don’t burn calories.",
  "It’s not about having time. It’s about making time.",
  "Push yourself because no one else is going to do it for you.",
  "A one-hour workout is 4% of your day. No excuses.",
  "Obsessed is a word the lazy use to describe the dedicated.",
  "Fall in love with the process, and the results will come.",
  "The gym is your sanctuary. Leave the world outside.",
  "Hustle for that muscle.",
  "Be stronger than your strongest excuse.",
  "Wake up. Work out. Look hot. Kick ass.",
  "The body achieves what the mind believes.",
  "You don't have to be extreme, just consistent.",
  "Fitness is not about being better than someone else. It's about being better than you used to be.",
  "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.",
  "Go the extra mile. It's never crowded.",
  "Do something today that your future self will thank you for.",
  "The difference between the impossible and the possible lies in a person’s determination.",
  "Clear your mind of can't.",
  "Your only limit is you.",
  "Pain is temporary. Quitting lasts forever.",
  "You are one workout away from a good mood.",
  "The harder the workout, the greater the feeling of accomplishment.",
  "Eat clean, train dirty.",
  "Discipline is just choosing between what you want now and what you want most.",
  "When you feel like quitting, think about why you started.",
  "Strength does not come from physical capacity. It comes from an indomitable will.",
  "Sore today, strong tomorrow.",
  "It's slow progress, but quitting won't speed it up.",
  "Become a machine.",
  "The secret of getting ahead is getting started.",
  "Make every workout count.",
  "Your future is created by what you do today, not tomorrow.",
  "Don't wish for a good body, work for it.",
  "Champions are made in the gym on days you don't feel like going.",
  "No matter how slow you go, you are still lapping everybody on the couch.",
  "Commit to be fit.",
  "Success starts with self-discipline.",
  "The real workout starts when you want to stop.",
  "One more rep. That's the difference.",
  "Create healthy habits, not restrictions.",
  "Let exercise be your stress reliever, not your chore.",
  "Be the hardest worker in the room.",
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
  borderRadius = 8,
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
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scrollContainer}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <SkeletonBlock width="80%" height={40} borderRadius={12} />
          <SkeletonBlock
            width="60%"
            height={20}
            borderRadius={8}
            style={{ marginTop: 10 }}
          />
        </View>

        {/* Quote Skeleton */}
        <View style={styles.section}>
          <SkeletonBlock
            width={150}
            height={22}
            borderRadius={8}
            style={{ marginBottom: 15 }}
          />
          <View
            style={{
              padding: 20,
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.border,
            }}
          >
            <SkeletonBlock width="100%" height={18} borderRadius={6} />
            <SkeletonBlock
              width="70%"
              height={18}
              borderRadius={6}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>

        {/* Today's Plan Skeleton */}
        <View style={styles.section}>
          <SkeletonBlock
            width={180}
            height={22}
            borderRadius={8}
            style={{ marginBottom: 15 }}
          />
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 20,
              borderWidth: 1.5,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <SkeletonBlock width={50} height={50} borderRadius={25} />
              <View style={{ marginLeft: 15 }}>
                <SkeletonBlock width={150} height={24} borderRadius={8} />
                <SkeletonBlock
                  width={100}
                  height={18}
                  borderRadius={6}
                  style={{ marginTop: 8 }}
                />
              </View>
            </View>
            <SkeletonBlock width="100%" height={50} borderRadius={8} />
          </View>
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
    <View style={styles.quoteContainer}>
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
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1.5 },
      ]}
    >
      <Text style={styles.workoutItemName}>{item.name}</Text>
      <Text style={styles.workoutItemSetsReps}>
        {item.sets} x {item.reps}
      </Text>
    </View>
  );
};

const TodaysWorkoutCard = ({ plan }: { plan: WorkoutPlan }) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];

  return (
    <BauhausCard backgroundColor={colors.accent1} borderColor={colors.black}>
      <View style={styles.todaysPlanHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.black }]}>
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
        {plan.workouts.map((workout, index) => (
          <WorkoutItem
            key={index}
            item={workout}
            isLast={index === plan.workouts.length - 1}
          />
        ))}
      </View>

      <Link href="/(tabs)/workoutPlan" asChild>
        <TouchableOpacity style={styles.startWorkoutButton}>
          <Text style={styles.startWorkoutButtonText}>Begin Session</Text>
          <Feather name="arrow-right" size={20} color={colors.card} />
        </TouchableOpacity>
      </Link>
    </BauhausCard>
  );
};

const RestDayCard = () => {
  const styles = getStyles(useColorScheme() ?? "light");
  return (
    <BauhausCard>
      <View style={styles.restDayContainer}>
        <Text style={styles.restDayIcon}>🧘</Text>
        <Text style={styles.restDayTitle}>Rest Day</Text>
        <Text style={styles.restDaySubtitle}>
          Relax, recover, and get ready for your next session.
        </Text>
      </View>
    </BauhausCard>
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
      <View
        style={[
          styles.iconContainer,
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary + "20",
          },
        ]}
      >
        <Feather name={icon} size={18} color={colors.primary} />
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
  // Mock data for demonstration
  const sessionsCompleted = 12;

  return (
    <BauhausCard>
      <View style={styles.statsContainer}>
        <StatItem label="Workout Plans" value={planCount} icon="clipboard" />
        <StatItem
          label="Sessions Done"
          value={sessionsCompleted}
          icon="check"
        />
      </View>
    </BauhausCard>
  );
};

const QuickAction = ({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  color: string;
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  return (
    <Link href={href as any} asChild>
      <TouchableOpacity style={styles.actionButtonWrapper}>
        <BauhausCard>
          <View style={styles.actionButtonContent}>
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
              <Feather name={icon} size={24} color={colors.card} />
            </View>
            <Text style={styles.actionButtonText}>{label}</Text>
          </View>
        </BauhausCard>
      </TouchableOpacity>
    </Link>
  );
};

const BauhausCard = ({
  children,
  style,
  backgroundColor,
  borderColor,
}: {
  children: React.ReactNode;
  style?: object;
  backgroundColor?: string;
  borderColor?: string;
}) => {
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];

  const cardBg = backgroundColor || colors.card;
  const cardBorder = borderColor || colors.border;

  return (
    <View
      style={[
        {
          backgroundColor: cardBg,
          borderWidth: 1.5,
          borderColor: cardBorder,
          borderRadius: 12,
          padding: 20,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// =================================================================================================
// --- MAIN SCREEN ---
// =================================================================================================

export default function IndexScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);

  // Select a quote once and memoize it
  const motivationalQuote = useMemo(
    () =>
      MOTIVATIONAL_MESSAGES[
        Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
      ],
    []
  );

  const plansCollectionRef = useMemo(() => {
    if (!user) return null;
    return collection(db, "users", user.uid, "workoutPlans");
  }, [user]);

  const fetchWorkoutPlans = useCallback(async () => {
    if (!plansCollectionRef) {
      setIsLoading(false);
      return;
    }
    // Don't set loading to true here to avoid flicker on re-focus
    try {
      const querySnapshot = await getDocs(plansCollectionRef);
      const fetchedPlans = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as WorkoutPlan))
        .sort((a, b) => a.order - b.order);
      setPlans(fetchedPlans);
    } catch (error) {
      console.error("Error fetching workout plans: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [plansCollectionRef]);

  useEffect(() => {
    fetchWorkoutPlans();
  }, [fetchWorkoutPlans]);

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
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* --- HEADER GREETING --- */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.displayName || "Fitness Fan"}
          </Text>
          <Text style={styles.subGreeting}>{dateString}</Text>
        </View>

        {/* --- MOTIVATIONAL QUOTE --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>food for thought</Text>
          <MotivationalQuote quote={motivationalQuote} />
        </View>

        {/* --- TODAY'S PLAN CARD --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>today's agenda</Text>
          {todaysPlan ? (
            <TodaysWorkoutCard plan={todaysPlan} />
          ) : (
            <RestDayCard />
          )}
        </View>

        {/* --- STATS OVERVIEW --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>your progress</Text>
          <StatsOverviewCard planCount={plans.length} />
        </View>

        {/* --- QUICK ACTIONS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>quick actions</Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              href="/(tabs)/workoutPlan"
              label="My Plans"
              icon="list"
              color={colors.primary}
            />
            <QuickAction
              href="/(tabs)/workoutPlan"
              label="Browse"
              icon="search"
              color={colors.accent2}
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
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 30,
    },
    greeting: {
      fontSize: 34,
      fontWeight: "900",
      fontFamily: "System",
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
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 15,
      textTransform: "lowercase", // Bauhaus typography style
      fontFamily: "System",
    },
    iconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25, // Perfect circle
      justifyContent: "center",
      alignItems: "center",
    },
    // Quote Styles
    quoteContainer: {
      padding: 20,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    quoteText: {
      fontSize: 16,
      color: colors.text,
      fontStyle: "italic",
      lineHeight: 24,
    },
    // Today's Plan Styles
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
      fontSize: 22,
      fontWeight: "800",
      color: colors.black,
      fontFamily: "System",
    },
    todaysPlanSubtitle: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.black,
      opacity: 0.7,
    },
    workoutListContainer: {
      marginBottom: 20,
      backgroundColor:
        scheme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
      borderRadius: 8,
    },
    workoutItemContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 15,
      paddingHorizontal: 15,
    },
    workoutItemName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.black,
      flex: 1,
      marginRight: 10,
    },
    workoutItemSetsReps: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.black,
      fontFamily: "System",
    },
    startWorkoutButton: {
      backgroundColor: colors.black,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 16,
      borderRadius: 8,
      gap: 10,
    },
    startWorkoutButtonText: {
      color: colors.card,
      fontSize: 16,
      fontWeight: "700",
      fontFamily: "System",
    },
    // Rest Day Styles
    restDayContainer: {
      alignItems: "center",
      paddingVertical: 20,
    },
    restDayIcon: {
      fontSize: 40,
      marginBottom: 10,
    },
    restDayTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 4,
    },
    restDaySubtitle: {
      fontSize: 16,
      color: colors.subtleText,
      textAlign: "center",
      lineHeight: 22,
    },
    // Stats Styles
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    statItemContainer: {
      alignItems: "flex-start",
      gap: 10,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "900",
      color: colors.text,
    },
    statLabel: {
      fontSize: 14,
      color: colors.subtleText,
      fontWeight: "500",
    },
    // Quick Actions Styles
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
      minHeight: 110,
    },
    actionButtonText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
      marginTop: 10,
    },
  });
};
