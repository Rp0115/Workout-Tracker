import React from "react";
import { Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { WorkoutPlan } from "../../types/types";
import { getStyles } from "./styles";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface PlanCardProps {
  item: WorkoutPlan;
  onPress: () => void;
}

export default function PlanCard({ item, onPress }: PlanCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  return (
    <TouchableOpacity
      style={styles.planCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.planCardTitle}>{item.planName}</Text>
      <View style={styles.planCardDaysContainer}>
        {DAYS_OF_WEEK.map((day) => (
          <View
            key={day}
            style={[
              styles.planCardDay,
              item.selectedDays.includes(day) && styles.planCardDaySelected,
            ]}
          >
            <Text
              style={[
                styles.planCardDayText,
                item.selectedDays.includes(day) &&
                  styles.planCardDayTextSelected,
              ]}
            >
              {day.charAt(0)}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}
