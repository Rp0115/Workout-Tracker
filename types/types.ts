export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  sex: string;
  workoutFrequency: string;
}

export interface WorkoutPlan {
  id: string; // Firestore document ID
  planName: string;
  selectedDays: string[];
  workouts: string[];
}
