/**
 * @file WorkoutContext.tsx
 * @description This file defines the global state management for an active workout session using React Context.
 *
 * --- CONTEXT & PROVIDER ---
 * 1. WorkoutContext: The React context that will hold the active workout's state.
 * 2. WorkoutProvider: A component that wraps the application to provide the workout state to all its children.
 * - Manages the 'activeWorkout' state.
 * - Provides `startWorkout` which now transforms the incoming plan to ensure `sets` is a number.
 * - Provides `stopWorkout` to clear the session.
 *
 * --- COMPONENTS ---
 * 1. MinimizedWorkoutView: A small, floating component that appears on screen when a workout is active.
 * - It displays the current workout's name and is draggable.
 * - Uses React Native's PanResponder API to handle touch gestures.
 * - When dragged and released, it calculates the nearest of the four screen corners and animates (snaps) into that position.
 *
 * --- HOOKS ---
 * 1. useWorkout: A custom hook that simplifies accessing the workout context from any component within the provider.
 */
import { useRouter } from "expo-router";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

// --- TYPE DEFINITIONS ---

// Input types: The plan object that can be passed to startWorkout.
// This is flexible and allows 'sets' to be a string (from index.tsx) or a number.
interface InputWorkout {
  name: string;
  sets: string | number;
  reps: string;
  primaryMuscles?: string[];
}

interface InputWorkoutPlan {
  id: string;
  planName: string;
  description?: string;
  selectedDays?: string[];
  workouts: InputWorkout[];
  primaryMuscleGroups?: string[];
  order?: number;
  icon?: string;
}

// Internal types: The format used *within* the context and expected by start.tsx.
// 'sets' is guaranteed to be a number.
interface ActiveWorkout {
  name: string;
  sets: number;
  reps: string;
  primaryMuscles?: string[];
}

interface WorkoutPlan {
  id: string;
  planName: string;
  description?: string;
  selectedDays?: string[];
  workouts: ActiveWorkout[];
  primaryMuscleGroups?: string[];
  order?: number;
  icon?: string;
}

interface WorkoutContextType {
  activeWorkout: WorkoutPlan | null;
  isWorkoutActive: boolean;
  startWorkout: (plan: InputWorkoutPlan) => void; // Takes the flexible input type
  stopWorkout: () => void;
}

// --- CONTEXT CREATION ---
const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// --- CONSTANTS & HELPERS ---
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const PADDING = 20; // Padding from the screen edges
const TOP_OFFSET = 50; // Space for the status bar
const BOTTOM_OFFSET = 110; // Increased space for the tab bar
const VIEW_SIZE = 90; // The fixed size of the draggable view

// Colors for the minimized view
const Colors = {
  light: {
    card: "#FFFFFF",
    text: "#1C1C1E",
    primary: "#6D28D9",
    shadow: "#000",
  },
  dark: {
    card: "#1F2937",
    text: "#F9FAFB",
    primary: "#8B5CF6",
    shadow: "#000",
  },
};

// --- DRAGGABLE MINIMIZED VIEW COMPONENT ---
export const MinimizedWorkoutView = () => {
  const { activeWorkout } = useWorkout();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  // Set the initial position to the bottom right corner.
  const initialPosition = {
    x: screenWidth - VIEW_SIZE - PADDING,
    y: screenHeight - VIEW_SIZE - BOTTOM_OFFSET,
  };

  const pan = useRef(new Animated.ValueXY(initialPosition)).current;

  useEffect(() => {
    // When a new workout starts, reset the position to the default.
    if (activeWorkout) {
      Animated.spring(pan, {
        toValue: initialPosition,
        useNativeDriver: false,
      }).start();
    }
  }, [activeWorkout, initialPosition.x, initialPosition.y]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        const releasePos = {
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        };

        const corners = {
          topLeft: { x: PADDING, y: TOP_OFFSET },
          topRight: {
            x: screenWidth - VIEW_SIZE - PADDING,
            y: TOP_OFFSET,
          },
          bottomLeft: {
            x: PADDING,
            y: screenHeight - VIEW_SIZE - BOTTOM_OFFSET,
          },
          bottomRight: {
            x: screenWidth - VIEW_SIZE - PADDING,
            y: screenHeight - VIEW_SIZE - BOTTOM_OFFSET,
          },
        };

        let closestCorner = "bottomRight";
        let minDistance = Infinity;

        for (const [key, cornerPos] of Object.entries(corners)) {
          const distance = Math.sqrt(
            Math.pow(releasePos.x - cornerPos.x, 2) +
              Math.pow(releasePos.y - cornerPos.y, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestCorner = key;
          }
        }

        Animated.spring(pan, {
          toValue: (corners as any)[closestCorner],
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  if (!activeWorkout) {
    return null;
  }

  const handlePress = () => {
    router.push("/(tabs)/start");
  };

  return (
    <Animated.View
      style={[styles.container, pan.getLayout()]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity onPress={handlePress} style={styles.touchableArea}>
        <View style={styles.content}>
          <Text style={styles.icon}>{activeWorkout.icon || "💪"}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {activeWorkout.planName}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- STYLES ---
const getStyles = (scheme: "light" | "dark") => {
  const colors = Colors[scheme];
  return StyleSheet.create({
    container: {
      position: "absolute",
      width: VIEW_SIZE,
      height: VIEW_SIZE,
      backgroundColor: colors.card,
      borderRadius: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 10,
      borderWidth: 1.5,
      borderColor: colors.primary + "50",
      justifyContent: "center",
      alignItems: "center",
    },
    touchableArea: {
      flex: 1,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
    },
    icon: {
      fontSize: 28,
    },
    title: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      paddingHorizontal: 4,
    },
    subtitle: {
      // This style is no longer used but kept for reference
      fontSize: 13,
      color: colors.primary,
      fontWeight: "500",
    },
  });
};

// --- PROVIDER COMPONENT ---
export const WorkoutProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeWorkout, setActiveWorkout] = useState<WorkoutPlan | null>(null);

  // --- UPDATED FUNCTION ---
  const startWorkout = (plan: InputWorkoutPlan) => {
    // Transform the plan to the internal format
    const transformedPlan: WorkoutPlan = {
      ...plan,
      workouts: plan.workouts.map((w) => ({
        ...w,
        // Ensure 'sets' is a number, converting from string if necessary
        sets: parseInt(String(w.sets), 10) || 0,
      })),
    };
    setActiveWorkout(transformedPlan);
  };

  const stopWorkout = () => {
    setActiveWorkout(null);
  };

  const value = {
    activeWorkout,
    isWorkoutActive: !!activeWorkout,
    startWorkout,
    stopWorkout,
  };

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
};

// --- CUSTOM HOOK ---
export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
};
