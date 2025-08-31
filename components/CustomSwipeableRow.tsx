// import { Feather } from "@expo/vector-icons";
// import * as Haptics from "expo-haptics";
// import React, { ReactNode } from "react";
// import { StyleSheet, View, useWindowDimensions } from "react-native";
// import {
//   PanGestureHandler,
//   PanGestureHandlerGestureEvent,
// } from "react-native-gesture-handler";
// import Animated, {
//   Extrapolate, // 1. Add Extrapolate and interpolate
//   interpolate,
//   runOnJS,
//   useAnimatedGestureHandler,
//   useAnimatedStyle,
//   useSharedValue,
//   withTiming,
// } from "react-native-reanimated";
// import { Colors } from "../constants/Colors";

// interface SwipeableRowProps {
//   children: ReactNode;
//   onDelete: () => void;
//   colorScheme?: "light" | "dark";
// }

// type GestureContext = {
//   startX: number;
// };

// const DELETE_THRESHOLD = -90;

// export const CustomSwipeableRow: React.FC<SwipeableRowProps> = ({
//   children,
//   onDelete,
//   colorScheme = "light",
// }) => {
//   const { width: screenWidth } = useWindowDimensions();
//   const translateX = useSharedValue(0);
//   const hapticTriggered = useSharedValue(false);

//   const gestureHandler = useAnimatedGestureHandler<
//     PanGestureHandlerGestureEvent,
//     GestureContext
//   >({
//     onStart: (_, ctx) => {
//       ctx.startX = translateX.value;
//     },
//     onActive: (event, ctx) => {
//       // 1. We no longer need to clamp the value here, as the handler itself will prevent rightward swipes.
//       translateX.value = ctx.startX + event.translationX;

//       if (translateX.value < DELETE_THRESHOLD && !hapticTriggered.value) {
//         runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
//         hapticTriggered.value = true;
//       } else if (translateX.value > DELETE_THRESHOLD && hapticTriggered.value) {
//         hapticTriggered.value = false;
//       }
//     },
//     onEnd: () => {
//       if (translateX.value < DELETE_THRESHOLD) {
//         translateX.value = withTiming(-screenWidth, undefined, (isFinished) => {
//           if (isFinished) {
//             runOnJS(onDelete)();
//           }
//         });
//       } else {
//         translateX.value = withTiming(0);
//       }
//       hapticTriggered.value = false;
//     },
//   });

//   const animatedStyle = useAnimatedStyle(() => ({
//     transform: [{ translateX: translateX.value }],
//   }));

//   const animatedIconContainerStyle = useAnimatedStyle(() => {
//     const opacity =
//       translateX.value < -DELETE_THRESHOLD / 2 ? withTiming(1) : withTiming(0);
//     return { opacity };
//   });

//   // 2. Create a new animated style for the red background.
//   const animatedBackgroundStyle = useAnimatedStyle(() => {
//     // Make the background invisible until the user starts swiping.
//     const opacity = interpolate(
//       translateX.value,
//       [0, -1], // At swipe distance 0, opacity is 0. At -1, it's 1.
//       [0, 1],
//       Extrapolate.CLAMP
//     );
//     return { opacity };
//   });

//   return (
//     <View style={styles.container}>
//       <Animated.View
//         // 3. Apply the new animated opacity style here.
//         style={[
//           styles.deleteAction,
//           { backgroundColor: Colors[colorScheme].destructive },
//           animatedBackgroundStyle,
//         ]}
//       >
//         <Animated.View style={animatedIconContainerStyle}>
//           <Feather name="trash-2" size={24} color="white" />
//         </Animated.View>
//       </Animated.View>
//       <PanGestureHandler
//         // 2. These props are corrected to only allow right-to-left swipes.
//         activeOffsetX={-10} // Activate after dragging 10px to the left
//         failOffsetX={10} // Fail if the user drags 10px to the right
//         onGestureEvent={gestureHandler}
//       >
//         <Animated.View style={animatedStyle}>{children}</Animated.View>
//       </PanGestureHandler>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginBottom: 10,
//     justifyContent: "center",
//   },
//   deleteAction: {
//     position: "absolute",
//     right: 0,
//     top: 0,
//     bottom: 0,
//     width: "100%",
//     justifyContent: "center",
//     alignItems: "flex-end",
//     paddingRight: 30,
//     borderRadius: 10,
//   },
// });

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "../constants/Colors";

interface SwipeableRowProps {
  children: ReactNode;
  onDelete: () => void;
  colorScheme?: "light" | "dark";
}

type GestureContext = {
  startX: number;
};

const DELETE_THRESHOLD = -90;

export const CustomSwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  colorScheme = "light",
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const hapticTriggered = useSharedValue(false);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    GestureContext
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      const newX = ctx.startX + event.translationX;
      translateX.value = Math.min(newX, 0);

      if (translateX.value < DELETE_THRESHOLD && !hapticTriggered.value) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        hapticTriggered.value = true;
      } else if (translateX.value > DELETE_THRESHOLD && hapticTriggered.value) {
        hapticTriggered.value = false;
      }
    },
    onEnd: () => {
      if (translateX.value < DELETE_THRESHOLD) {
        translateX.value = withTiming(-screenWidth, undefined, (isFinished) => {
          if (isFinished) {
            runOnJS(onDelete)();
          }
        });
      } else {
        translateX.value = withTiming(0);
      }
      hapticTriggered.value = false;
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // This is the new animated style for the trash icon.
  const animatedIconContainerStyle = useAnimatedStyle(() => {
    // Fade the icon in quickly as the swipe begins.
    const opacity = interpolate(
      translateX.value,
      [0, -20],
      [0, 1],
      Extrapolate.CLAMP
    );

    // This makes the icon move slower than the swipe (a parallax effect).
    const iconTranslateX = interpolate(
      translateX.value,
      [0, -screenWidth], // As the row moves from 0 to the full screen width...
      [0, -screenWidth / 2 + 30], // ...the icon moves from 0 to the middle of the screen.
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateX: iconTranslateX }],
    };
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, -1],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.deleteAction,
          { backgroundColor: Colors[colorScheme].destructive },
          animatedBackgroundStyle,
        ]}
      >
        <Animated.View style={animatedIconContainerStyle}>
          <Feather name="trash-2" size={24} color="white" />
        </Animated.View>
      </Animated.View>
      <PanGestureHandler
        failOffsetX={10}
        activeOffsetX={-10}
        onGestureEvent={gestureHandler}
      >
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    justifyContent: "center",
  },
  deleteAction: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 30,
    borderRadius: 10,
  },
});
