// import { Feather } from "@expo/vector-icons";
// import * as Haptics from "expo-haptics";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDocs,
//   updateDoc,
// } from "firebase/firestore";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Animated,
//   FlatList,
//   Modal,
//   Pressable,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   useColorScheme,
// } from "react-native";
// import DraggableFlatList, {
//   RenderItemParams,
// } from "react-native-draggable-flatlist";
// import {
//   GestureHandlerRootView,
//   Swipeable,
// } from "react-native-gesture-handler";
// import { Colors } from "../../constants/Colors";
// import { useAuth } from "../../context/AuthContext";
// import { db } from "../../firebaseConfig";

// const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// interface Workout {
//   id: string;
//   name: string;
//   sets: string;
//   reps: string;
// }

// interface WorkoutPlan {
//   id: string; // Firestore document ID
//   planName: string;
//   selectedDays: string[];
//   workouts: Workout[];
// }

// export default function WorkoutPlanScreen() {
//   const { user } = useAuth();
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);

//   // --- State Management ---
//   const [isLoading, setIsLoading] = useState(true);
//   const [isCreateModalVisible, setCreateModalVisible] = useState(false);
//   const [planName, setPlanName] = useState("");
//   const [selectedDays, setSelectedDays] = useState<string[]>([]);
//   const [workouts, setWorkouts] = useState<Workout[]>([]);
//   const [savedPlans, setSavedPlans] = useState<WorkoutPlan[]>([]);
//   const [viewingPlan, setViewingPlan] = useState<WorkoutPlan | null>(null);
//   const [editingPlan, setEditingPlan] = useState(false);
//   const [editedPlanName, setEditedPlanName] = useState("");
//   const [editedSelectedDays, setEditedSelectedDays] = useState<string[]>([]);
//   const [editedWorkouts, setEditedWorkouts] = useState<Workout[]>([]);

//   // --- Firestore Functions ---
//   const fetchWorkoutPlans = async () => {
//     if (!user) return;
//     setIsLoading(true);
//     try {
//       const plansCollectionRef = collection(
//         db,
//         "users",
//         user.uid,
//         "workoutPlans"
//       );
//       const querySnapshot = await getDocs(plansCollectionRef);
//       const plans = querySnapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       })) as WorkoutPlan[];
//       setSavedPlans(plans);
//     } catch (error) {
//       console.error("Error fetching workout plans: ", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchWorkoutPlans();
//   }, [user]);

//   const handleSavePlan = async () => {
//     if (!user || !planName || selectedDays.length === 0) {
//       Alert.alert(
//         "Incomplete Plan",
//         "Please name your plan and select at least one day."
//       );
//       return;
//     }
//     try {
//       await addDoc(collection(db, "users", user.uid, "workoutPlans"), {
//         planName,
//         selectedDays,
//         workouts,
//       });
//       setCreateModalVisible(false);
//       fetchWorkoutPlans();
//     } catch (error) {
//       console.error("Error saving plan: ", error);
//     }
//   };

//   const handleSaveEdit = async () => {
//     if (!user || !viewingPlan) return;
//     try {
//       await updateDoc(
//         doc(db, "users", user.uid, "workoutPlans", viewingPlan.id),
//         {
//           planName: editedPlanName,
//           selectedDays: editedSelectedDays,
//           workouts: editedWorkouts,
//         }
//       );
//       setEditingPlan(false);
//       fetchWorkoutPlans();
//       setViewingPlan(null);
//     } catch (error) {
//       console.error("Error updating plan: ", error);
//     }
//   };

//   const handleDeletePlan = async () => {
//     if (!user || !viewingPlan) return;
//     Alert.alert(
//       "Delete Plan",
//       `Are you sure you want to delete "${viewingPlan.planName}"? This action cannot be undone.`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               await deleteDoc(
//                 doc(db, "users", user.uid, "workoutPlans", viewingPlan.id)
//               );
//               setViewingPlan(null);
//               fetchWorkoutPlans();
//             } catch (error) {
//               console.error("Error deleting plan: ", error);
//             }
//           },
//         },
//       ]
//     );
//   };

//   // --- UI Helper Functions ---
//   const toggleDay = (day: string) => {
//     setSelectedDays((prev) =>
//       prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
//     );
//   };

//   const toggleEditedDay = (day: string) => {
//     setEditedSelectedDays((prev) =>
//       prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
//     );
//   };

//   const addWorkout = () => {
//     const newWorkout = {
//       id: `workout-${Date.now()}`,
//       name: "",
//       sets: "",
//       reps: "",
//     };
//     setWorkouts((prev) => [...prev, newWorkout]);
//   };

//   const addEditedWorkout = () => {
//     const newWorkout = {
//       id: `workout-${Date.now()}`,
//       name: "",
//       sets: "",
//       reps: "",
//     };
//     setEditedWorkouts((prev) => [...prev, newWorkout]);
//   };

//   const handleEditPress = () => {
//     if (viewingPlan) {
//       setEditingPlan(true);
//       setEditedPlanName(viewingPlan.planName);
//       setEditedSelectedDays([...viewingPlan.selectedDays]);
//       const workoutsWithIds = viewingPlan.workouts.map((w, i) => ({
//         ...w,
//         id: w.id || `workout-${Date.now()}-${i}`,
//       }));
//       setEditedWorkouts(workoutsWithIds);
//     }
//   };

//   // --- Reusable Render Functions ---

//   // 🎨 Renders the red "delete" action for the swipe gesture
//   const renderRightActions = (
//     progress: Animated.AnimatedInterpolation<number>,
//     onPress: () => void
//   ) => {
//     const trans = progress.interpolate({
//       inputRange: [0, 1],
//       outputRange: [80, 0],
//       extrapolate: "clamp",
//     });
//     return (
//       <TouchableOpacity onPress={onPress} style={styles.deleteActionContainer}>
//         <Animated.View
//           style={[styles.deleteAction, { transform: [{ translateX: trans }] }]}
//         >
//           <Feather name="trash-2" size={24} color="white" />
//         </Animated.View>
//       </TouchableOpacity>
//     );
//   };

//   // 📝 Renders an editable workout row for both modals
//   const renderEditableItem = (
//     { item, drag, isActive, getIndex }: RenderItemParams<Workout>,
//     workoutState: Workout[],
//     setWorkoutState: React.Dispatch<React.SetStateAction<Workout[]>>
//   ) => {
//     const index = getIndex();
//     if (index === undefined) return null;

//     const handleDelete = () => {
//       const updated = workoutState.filter((_, i) => i !== index);
//       setWorkoutState(updated);
//     };

//     const updateWorkout = (field: "name" | "sets" | "reps", value: string) => {
//       const updated = [...workoutState];
//       updated[index][field] = value;
//       setWorkoutState(updated);
//     };

//     return (
//       <Swipeable
//         renderRightActions={(progress) =>
//           renderRightActions(progress, handleDelete)
//         }
//         onSwipeableWillOpen={() =>
//           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
//         }
//         overshootRight={false}
//       >
//         <View
//           style={[
//             styles.workoutInputContainer,
//             isActive && styles.workoutItemActive,
//           ]}
//         >
//           <TouchableOpacity
//             onLongPress={drag}
//             delayLongPress={150}
//             style={styles.dragHandle}
//           >
//             <Feather
//               name="menu"
//               size={24}
//               color={styles.dragHandleIcon.color}
//             />
//           </TouchableOpacity>
//           <TextInput
//             style={styles.workoutInput}
//             placeholder="Workout Name"
//             placeholderTextColor={Colors[colorScheme].subtleText}
//             value={item.name}
//             onChangeText={(text) => updateWorkout("name", text)}
//           />
//           <TextInput
//             style={styles.setsRepsInput}
//             placeholder="S"
//             placeholderTextColor={Colors[colorScheme].subtleText}
//             value={item.sets}
//             keyboardType="numeric"
//             onChangeText={(text) => updateWorkout("sets", text)}
//           />
//           <TextInput
//             style={styles.setsRepsInput}
//             placeholder="R"
//             placeholderTextColor={Colors[colorScheme].subtleText}
//             value={item.reps}
//             keyboardType="numeric"
//             onChangeText={(text) => updateWorkout("reps", text)}
//           />
//         </View>
//       </Swipeable>
//     );
//   };

//   // --- Main Component Return ---

//   if (isLoading) {
//     return (
//       <View style={[styles.container, { justifyContent: "center" }]}>
//         <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
//       </View>
//     );
//   }

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <View style={styles.container}>
//         <FlatList
//           data={savedPlans}
//           renderItem={({ item }) => (
//             <TouchableOpacity
//               style={styles.planCard}
//               onPress={() => setViewingPlan(item)}
//             >
//               <Text style={styles.planCardTitle}>{item.planName}</Text>
//               <View style={styles.planCardDaysContainer}>
//                 {DAYS_OF_WEEK.map((day) => (
//                   <View
//                     key={day}
//                     style={[
//                       styles.planCardDay,
//                       item.selectedDays.includes(day) &&
//                         styles.planCardDaySelected,
//                     ]}
//                   >
//                     <Text
//                       style={[
//                         styles.planCardDayText,
//                         item.selectedDays.includes(day) &&
//                           styles.planCardDayTextSelected,
//                       ]}
//                     >
//                       {day.charAt(0)}
//                     </Text>
//                   </View>
//                 ))}
//               </View>
//             </TouchableOpacity>
//           )}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.planListContent}
//           ListHeaderComponent={
//             <Text style={styles.pageTitle}>My Workout Plans</Text>
//           }
//           ListEmptyComponent={
//             <View style={styles.emptyContainer}>
//               <Text style={styles.emptyText}>No workout plans yet.</Text>
//               <Text style={styles.emptySubText}>
//                 Tap the '+' button to get started!
//               </Text>
//             </View>
//           }
//         />

//         <TouchableOpacity
//           style={styles.fab}
//           onPress={() => {
//             setPlanName("");
//             setSelectedDays([]);
//             setWorkouts([]);
//             setCreateModalVisible(true);
//           }}
//         >
//           <Feather name="plus" size={28} color="#FFFFFF" />
//         </TouchableOpacity>

//         {/* VIEW / EDIT Modal ⬇️ */}
//         <Modal visible={!!viewingPlan} transparent animationType="fade">
//           <Pressable
//             style={styles.modalBackdrop}
//             onPress={() => {
//               setViewingPlan(null);
//               setEditingPlan(false);
//             }}
//           />
//           <View style={styles.modalOuterContainer}>
//             <View style={styles.modalContentContainer}>
//               {viewingPlan &&
//                 (editingPlan ? (
//                   // Draggable list for editing mode
//                   <DraggableFlatList
//                     data={editedWorkouts}
//                     onDragEnd={({ data }) => setEditedWorkouts(data)}
//                     keyExtractor={(item) => item.id}
//                     renderItem={(props) =>
//                       renderEditableItem(
//                         props,
//                         editedWorkouts,
//                         setEditedWorkouts
//                       )
//                     }
//                     ListHeaderComponent={
//                       <>
//                         <View style={styles.modalHeader}>
//                           <TextInput
//                             style={styles.editableTitle}
//                             value={editedPlanName}
//                             onChangeText={setEditedPlanName}
//                           />
//                           <TouchableOpacity
//                             style={styles.saveButton}
//                             onPress={handleSaveEdit}
//                           >
//                             <Feather
//                               name="check"
//                               size={20}
//                               color={Colors[colorScheme].primary}
//                             />
//                           </TouchableOpacity>
//                         </View>
//                         <Text style={styles.label}>Active Days</Text>
//                         <View style={styles.daysContainer}>
//                           {DAYS_OF_WEEK.map((day) => (
//                             <TouchableOpacity
//                               key={day}
//                               style={[
//                                 styles.dayButton,
//                                 editedSelectedDays.includes(day) &&
//                                   styles.dayButtonSelected,
//                               ]}
//                               onPress={() => toggleEditedDay(day)}
//                             >
//                               <Text
//                                 style={[
//                                   styles.dayButtonText,
//                                   editedSelectedDays.includes(day) &&
//                                     styles.dayButtonTextSelected,
//                                 ]}
//                               >
//                                 {day.charAt(0)}
//                               </Text>
//                             </TouchableOpacity>
//                           ))}
//                         </View>
//                         <View style={styles.workoutsHeader}>
//                           <Text style={styles.headerLabelText}>Workouts</Text>
//                           <View style={styles.columnHeaderContainer}>
//                             <Text style={styles.columnHeaderText}>Sets</Text>
//                             <Text style={styles.columnHeaderText}>Reps</Text>
//                           </View>
//                         </View>
//                       </>
//                     }
//                     ListFooterComponent={
//                       <View style={styles.footerButtonContainer}>
//                         <TouchableOpacity
//                           style={styles.destructiveLinkButton}
//                           onPress={handleDeletePlan}
//                         >
//                           <Feather
//                             name="trash-2"
//                             size={18}
//                             color={styles.destructiveLinkButtonText.color}
//                           />
//                           <Text style={styles.destructiveLinkButtonText}>
//                             Delete Plan
//                           </Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity
//                           style={styles.addButton}
//                           onPress={addEditedWorkout}
//                         >
//                           <Feather
//                             name="plus-circle"
//                             size={18}
//                             color={styles.addButtonText.color}
//                           />
//                           <Text style={styles.addButtonText}>Add Workout</Text>
//                         </TouchableOpacity>
//                       </View>
//                     }
//                     contentContainerStyle={styles.modalListContent}
//                   />
//                 ) : (
//                   // Regular list for viewing mode
//                   <FlatList
//                     data={viewingPlan.workouts}
//                     keyExtractor={(item) => item.id}
//                     renderItem={({ item }) => (
//                       <View style={styles.workoutItem}>
//                         <Text style={styles.workoutTextName}>{item.name}</Text>
//                         <View style={styles.columnHeaderContainer}>
//                           <Text style={styles.setsRepsText}>{item.sets}</Text>
//                           <Text style={styles.setsRepsText}>{item.reps}</Text>
//                         </View>
//                       </View>
//                     )}
//                     ListHeaderComponent={
//                       <>
//                         <View style={styles.modalHeader}>
//                           <Text style={styles.modalTitle}>
//                             {viewingPlan.planName}
//                           </Text>
//                           <TouchableOpacity
//                             style={styles.editButton}
//                             onPress={handleEditPress}
//                           >
//                             <Feather
//                               name="edit-2"
//                               size={20}
//                               color={styles.modalTitle.color}
//                             />
//                           </TouchableOpacity>
//                         </View>
//                         <Text style={styles.label}>Active Days</Text>
//                         <View style={styles.daysContainer}>
//                           {DAYS_OF_WEEK.map((day) => (
//                             <View
//                               key={day}
//                               style={[
//                                 styles.dayButton,
//                                 viewingPlan.selectedDays.includes(day) &&
//                                   styles.dayButtonSelected,
//                               ]}
//                             >
//                               <Text
//                                 style={[
//                                   styles.dayButtonText,
//                                   viewingPlan.selectedDays.includes(day) &&
//                                     styles.dayButtonTextSelected,
//                                 ]}
//                               >
//                                 {day.charAt(0)}
//                               </Text>
//                             </View>
//                           ))}
//                         </View>
//                         <View style={styles.workoutsHeader}>
//                           <Text style={styles.headerLabelText}>Workouts</Text>
//                           <View style={styles.columnHeaderContainer}>
//                             <Text style={styles.columnHeaderText}>Sets</Text>
//                             <Text style={styles.columnHeaderText}>Reps</Text>
//                           </View>
//                         </View>
//                       </>
//                     }
//                     ListEmptyComponent={
//                       <View style={styles.workoutItem}>
//                         <Text>No workouts added</Text>
//                       </View>
//                     }
//                     contentContainerStyle={styles.modalListContent}
//                   />
//                 ))}
//             </View>
//           </View>
//         </Modal>

//         {/* CREATE Modal ⬇️ */}
//         <Modal visible={isCreateModalVisible} transparent animationType="fade">
//           <Pressable
//             style={styles.modalBackdrop}
//             onPress={() => setCreateModalVisible(false)}
//           />
//           <View style={styles.modalOuterContainer}>
//             <View style={[styles.modalContentContainer, { maxHeight: "80%" }]}>
//               <DraggableFlatList
//                 data={workouts}
//                 onDragEnd={({ data }) => setWorkouts(data)}
//                 keyExtractor={(item) => item.id}
//                 renderItem={(props) =>
//                   renderEditableItem(props, workouts, setWorkouts)
//                 }
//                 ListHeaderComponent={
//                   <>
//                     <View style={styles.modalHeader}>
//                       <TextInput
//                         style={styles.editableTitle}
//                         placeholder="New Workout Plan"
//                         value={planName}
//                         onChangeText={setPlanName}
//                         autoFocus
//                       />
//                       <TouchableOpacity
//                         style={styles.saveIconButton}
//                         onPress={handleSavePlan}
//                       >
//                         <Feather
//                           name="check"
//                           size={24}
//                           color={Colors[colorScheme].primary}
//                         />
//                       </TouchableOpacity>
//                     </View>
//                     <Text style={styles.label}>Select Days</Text>
//                     <View style={styles.daysContainer}>
//                       {DAYS_OF_WEEK.map((day) => (
//                         <TouchableOpacity
//                           key={day}
//                           style={[
//                             styles.dayButton,
//                             selectedDays.includes(day) &&
//                               styles.dayButtonSelected,
//                           ]}
//                           onPress={() => toggleDay(day)}
//                         >
//                           <Text
//                             style={[
//                               styles.dayButtonText,
//                               selectedDays.includes(day) &&
//                                 styles.dayButtonTextSelected,
//                             ]}
//                           >
//                             {day.charAt(0)}
//                           </Text>
//                         </TouchableOpacity>
//                       ))}
//                     </View>
//                     <View style={styles.workoutsHeader}>
//                       <Text style={styles.headerLabelText}>Workouts</Text>
//                       <View style={styles.columnHeaderContainer}>
//                         <Text style={styles.columnHeaderText}>Sets</Text>
//                         <Text style={styles.columnHeaderText}>Reps</Text>
//                       </View>
//                     </View>
//                   </>
//                 }
//                 ListFooterComponent={
//                   <View style={{ alignItems: "center" }}>
//                     <TouchableOpacity
//                       style={styles.addButton}
//                       onPress={addWorkout}
//                     >
//                       <Feather
//                         name="plus-circle"
//                         size={18}
//                         color={styles.addButtonText.color}
//                       />
//                       <Text style={styles.addButtonText}>Add Workout</Text>
//                     </TouchableOpacity>
//                   </View>
//                 }
//                 contentContainerStyle={styles.modalListContent}
//               />
//             </View>
//           </View>
//         </Modal>
//       </View>
//     </GestureHandlerRootView>
//   );
// }

// const getStyles = (scheme: "light" | "dark") => {
//   const colors = Colors[scheme];
//   return StyleSheet.create({
//     container: { flex: 1, backgroundColor: colors.background },
//     planListContent: { padding: 20, paddingBottom: 80 },
//     pageTitle: {
//       fontSize: 32,
//       fontWeight: "bold",
//       color: colors.text,
//       paddingTop: 30,
//       marginBottom: 20,
//     },
//     planCard: {
//       backgroundColor: colors.card,
//       padding: 20,
//       borderRadius: 10,
//       marginBottom: 15,
//     },
//     planCardTitle: {
//       fontSize: 20,
//       fontWeight: "bold",
//       color: colors.text,
//       marginBottom: 15,
//     },
//     planCardDaysContainer: {
//       flexDirection: "row",
//       justifyContent: "space-around",
//     },
//     planCardDay: {
//       width: 30,
//       height: 30,
//       borderRadius: 15,
//       justifyContent: "center",
//       alignItems: "center",
//       backgroundColor: colors.background,
//     },
//     planCardDaySelected: { backgroundColor: colors.primary },
//     planCardDayText: { color: colors.subtleText, fontWeight: "bold" },
//     planCardDayTextSelected: { color: "#FFFFFF" },
//     emptyContainer: {
//       flex: 1,
//       justifyContent: "center",
//       alignItems: "center",
//       marginTop: 50,
//     },
//     emptyText: { fontSize: 18, fontWeight: "600", color: colors.text },
//     emptySubText: {
//       fontSize: 14,
//       color: colors.subtleText,
//       marginTop: 10,
//     },
//     fab: {
//       position: "absolute",
//       width: 56,
//       height: 56,
//       alignItems: "center",
//       justifyContent: "center",
//       right: 20,
//       bottom: 105,
//       backgroundColor: colors.primary,
//       borderRadius: 28,
//       elevation: 8,
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.3,
//       shadowRadius: 4,
//     },
//     modalBackdrop: {
//       ...StyleSheet.absoluteFillObject,
//       backgroundColor: "rgba(0,0,0,0.5)",
//     },
//     modalOuterContainer: {
//       flex: 1,
//       justifyContent: "center",
//       alignItems: "center",
//       padding: 20,
//     },
//     modalContentContainer: {
//       width: "100%",
//       maxHeight: "60%",
//       borderRadius: 20,
//       backgroundColor: colors.card,
//       overflow: "hidden",
//     },
//     modalListContent: {
//       paddingHorizontal: 20,
//       paddingBottom: 20,
//     },
//     modalHeader: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       paddingTop: 20,
//       paddingBottom: 10,
//     },
//     editableTitle: {
//       fontSize: 24,
//       fontWeight: "bold",
//       color: colors.text,
//       backgroundColor: colors.background,
//       padding: 10,
//       borderRadius: 8,
//       flex: 1,
//     },
//     modalTitle: { fontSize: 24, fontWeight: "bold", color: colors.text },
//     editButton: { padding: 8 },
//     saveButton: { padding: 8 },
//     saveIconButton: { padding: 8 },
//     label: {
//       fontSize: 16,
//       fontWeight: "600",
//       color: colors.text,
//       marginTop: 20,
//       marginBottom: 10,
//     },
//     daysContainer: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//     },
//     dayButton: {
//       width: 40,
//       height: 40,
//       borderRadius: 20,
//       justifyContent: "center",
//       alignItems: "center",
//       backgroundColor: colors.background,
//     },
//     dayButtonSelected: { backgroundColor: colors.primary },
//     dayButtonText: {
//       fontSize: 16,
//       fontWeight: "bold",
//       color: colors.text,
//     },
//     dayButtonTextSelected: { color: "#FFFFFF" },
//     workoutsHeader: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       marginTop: 20,
//       marginBottom: 10,
//     },
//     headerLabelText: {
//       fontSize: 16,
//       fontWeight: "600",
//       color: colors.text,
//     },
//     columnHeaderContainer: {
//       flexDirection: "row",
//       gap: 5,
//     },
//     columnHeaderText: {
//       fontSize: 14,
//       fontWeight: "500",
//       color: colors.subtleText,
//       width: 50,
//       textAlign: "center",
//     },
//     workoutItem: {
//       backgroundColor: colors.background,
//       padding: 5,
//       borderRadius: 10,
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       marginBottom: 10,
//     },
//     workoutItemActive: {
//       backgroundColor: colors.background,
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.2,
//       shadowRadius: 4,
//       elevation: 5,
//     },
//     workoutTextName: {
//       fontSize: 16,
//       color: colors.text,
//       flex: 1,
//     },
//     setsRepsText: {
//       fontSize: 16,
//       color: colors.subtleText,
//       fontWeight: "600",
//       width: 50,
//       textAlign: "center",
//     },
//     workoutInputContainer: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 5,
//       width: "100%",
//       backgroundColor: colors.background,
//       padding: 5,
//       borderRadius: 10,
//       marginBottom: 10,
//     },
//     workoutInput: {
//       flex: 1,
//       fontSize: 16,
//       color: colors.text,
//       padding: 10,
//     },
//     setsRepsInput: {
//       fontSize: 16,
//       color: colors.text,
//       width: 50,
//       textAlign: "center",
//       padding: 10,
//     },
//     dragHandle: {
//       paddingHorizontal: 10,
//       alignItems: "center",
//       justifyContent: "center",
//     },
//     dragHandleIcon: {
//       color: colors.subtleText,
//     },
//     deleteActionContainer: {
//       borderRadius: 10,
//       overflow: "hidden", // Clip the animated view
//       marginBottom: 10, // Match the workout item margin
//     },
//     deleteAction: {
//       backgroundColor: colors.destructive,
//       justifyContent: "center",
//       alignItems: "flex-end",
//       paddingRight: 20,
//       width: 80,
//       height: "100%",
//     },
//     footerButtonContainer: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       marginTop: 20,
//     },
//     addButton: {
//       paddingVertical: 10,
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 6,
//     },
//     addButtonText: {
//       color: colors.primary,
//       fontSize: 16,
//       fontWeight: "600",
//     },
//     destructiveLinkButton: {
//       paddingVertical: 10,
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 6,
//     },
//     destructiveLinkButtonText: {
//       color: colors.destructive,
//       fontSize: 16,
//       fontWeight: "600",
//     },
//   });
// };

// import { Feather } from "@expo/vector-icons";
// import * as Haptics from "expo-haptics";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDocs,
//   updateDoc,
// } from "firebase/firestore";
// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react"; // CORRECTED IMPORT
// import {
//   ActivityIndicator,
//   Alert,
//   Animated,
//   // Note: FlatList type is now imported from gesture-handler
//   Modal,
//   Pressable,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   useColorScheme,
// } from "react-native";
// import DraggableFlatList, {
//   RenderItemParams,
//   ScaleDecorator,
// } from "react-native-draggable-flatlist";
// import {
//   FlatList, // CORRECT IMPORT FOR DraggableFlatList's REF
//   GestureHandlerRootView,
//   Swipeable,
// } from "react-native-gesture-handler";

// // Replace with your actual file paths
// import { Colors } from "../../constants/Colors";
// import { useAuth } from "../../context/AuthContext";
// import { db } from "../../firebaseConfig";

// // --- TYPE DEFINITIONS ---
// interface Workout {
//   id: string;
//   name: string;
//   sets: string;
//   reps: string;
// }

// interface WorkoutPlan {
//   id: string; // Firestore document ID
//   planName: string;
//   selectedDays: string[];
//   workouts: Workout[];
// }

// const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// // =================================================================================================
// // --- REUSABLE EDITABLE WORKOUT ROW COMPONENT ---
// // =================================================================================================
// interface EditableWorkoutRowProps extends RenderItemParams<Workout> {
//   workouts: Workout[];
//   setWorkouts: React.Dispatch<React.SetStateAction<Workout[]>>;
// }

// const EditableWorkoutRow: React.FC<EditableWorkoutRowProps> = ({
//   item,
//   drag,
//   isActive,
//   getIndex,
//   workouts,
//   setWorkouts,
// }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   const index = getIndex();

//   if (index === undefined) return null;

//   const updateField = (field: keyof Omit<Workout, "id">, value: string) => {
//     const newWorkouts = [...workouts];
//     newWorkouts[index][field] = value;
//     setWorkouts(newWorkouts);
//   };

//   const handleDelete = () => {
//     const newWorkouts = workouts.filter((_, i) => i !== index);
//     setWorkouts(newWorkouts);
//   };

//   const renderRightActions = (
//     progress: Animated.AnimatedInterpolation<number>
//   ) => {
//     const trans = progress.interpolate({
//       inputRange: [0, 1],
//       outputRange: [80, 0],
//     });
//     return (
//       <TouchableOpacity
//         onPress={handleDelete}
//         style={styles.deleteActionContainer}
//       >
//         <Animated.View
//           style={[styles.deleteAction, { transform: [{ translateX: trans }] }]}
//         >
//           <Feather name="trash-2" size={24} color="white" />
//         </Animated.View>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <ScaleDecorator>
//       <Swipeable
//         renderRightActions={renderRightActions}
//         onSwipeableWillOpen={() =>
//           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
//         }
//         overshootRight={false}
//       >
//         <View
//           style={[
//             styles.workoutInputContainer,
//             isActive && styles.workoutItemActive,
//           ]}
//         >
//           <TouchableOpacity
//             onLongPress={drag}
//             disabled={isActive}
//             style={styles.dragHandle}
//           >
//             <Feather
//               name="menu"
//               size={24}
//               color={styles.dragHandleIcon.color}
//             />
//           </TouchableOpacity>
//           <TextInput
//             style={styles.workoutInput}
//             placeholder="Workout Name"
//             placeholderTextColor={Colors[colorScheme].subtleText}
//             value={item.name}
//             onChangeText={(text) => updateField("name", text)}
//           />
//           <TextInput
//             style={styles.setsRepsInput}
//             placeholder="S"
//             placeholderTextColor={Colors[colorScheme].subtleText}
//             value={item.sets}
//             keyboardType="numeric"
//             onChangeText={(text) => updateField("sets", text)}
//           />
//           <TextInput
//             style={styles.setsRepsInput}
//             placeholder="R"
//             placeholderTextColor={Colors[colorScheme].subtleText}
//             value={item.reps}
//             keyboardType="numeric"
//             onChangeText={(text) => updateField("reps", text)}
//           />
//         </View>
//       </Swipeable>
//     </ScaleDecorator>
//   );
// };

// // =================================================================================================
// // --- WORKOUT PLAN MODAL COMPONENT ---
// // =================================================================================================
// interface PlanModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onSave: (plan: Omit<WorkoutPlan, "id">) => void;
//   initialPlan?: WorkoutPlan | null;
// }

// const PlanModal: React.FC<PlanModalProps> = ({
//   visible,
//   onClose,
//   onSave,
//   initialPlan = null,
// }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   const isEditing = !!initialPlan;

//   const [planName, setPlanName] = useState("");
//   const [selectedDays, setSelectedDays] = useState<string[]>([]);
//   const [workouts, setWorkouts] = useState<Workout[]>([]);

//   const listRef = useRef<FlatList<Workout>>(null);

//   useEffect(() => {
//     if (visible) {
//       setPlanName(initialPlan?.planName || "");
//       setSelectedDays(initialPlan?.selectedDays || []);
//       setWorkouts(
//         initialPlan?.workouts.map((w, i) => ({
//           ...w,
//           id: w.id || `workout-${Date.now()}-${i}`,
//         })) || []
//       );
//     }
//   }, [visible, initialPlan]);

//   const toggleDay = (day: string) => {
//     setSelectedDays((prev) =>
//       prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
//     );
//   };

//   const addWorkout = () => {
//     const newWorkout: Workout = {
//       id: `workout-${Date.now()}`,
//       name: "",
//       sets: "",
//       reps: "",
//     };
//     setWorkouts((prev) => [...prev, newWorkout]);

//     setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
//   };

//   const handleSave = () => {
//     if (!planName || selectedDays.length === 0) {
//       Alert.alert(
//         "Incomplete Plan",
//         "Please provide a name and select at least one day."
//       );
//       return;
//     }
//     onSave({ planName, selectedDays, workouts });
//   };

//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <Pressable style={styles.modalBackdrop} onPress={onClose} />
//       <View style={styles.modalOuterContainer}>
//         <View style={styles.modalContentContainer}>
//           <DraggableFlatList
//             ref={listRef}
//             data={workouts}
//             onDragEnd={({ data }) => setWorkouts(data)}
//             keyExtractor={(item) => item.id}
//             renderItem={(props) => (
//               <EditableWorkoutRow
//                 {...props}
//                 workouts={workouts}
//                 setWorkouts={setWorkouts}
//               />
//             )}
//             ListHeaderComponent={
//               <>
//                 <View style={styles.modalHeader}>
//                   <TextInput
//                     style={styles.editableTitle}
//                     placeholder="New Workout Plan"
//                     placeholderTextColor={Colors[colorScheme].subtleText}
//                     value={planName}
//                     onChangeText={setPlanName}
//                     autoFocus={!isEditing}
//                   />
//                   <TouchableOpacity
//                     style={styles.saveIconButton}
//                     onPress={handleSave}
//                   >
//                     <Feather
//                       name="check"
//                       size={24}
//                       color={styles.saveIconButton.color}
//                     />
//                   </TouchableOpacity>
//                 </View>

//                 <Text style={styles.label}>Select Days</Text>
//                 <View style={styles.daysContainer}>
//                   {DAYS_OF_WEEK.map((day) => (
//                     <TouchableOpacity
//                       key={day}
//                       style={[
//                         styles.dayButton,
//                         selectedDays.includes(day) && styles.dayButtonSelected,
//                       ]}
//                       onPress={() => toggleDay(day)}
//                     >
//                       <Text
//                         style={[
//                           styles.dayButtonText,
//                           selectedDays.includes(day) &&
//                             styles.dayButtonTextSelected,
//                         ]}
//                       >
//                         {day.charAt(0)}
//                       </Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>

//                 <View style={styles.workoutsHeader}>
//                   <Text style={styles.headerLabelText}>Workouts</Text>
//                   <View style={styles.columnHeaderContainer}>
//                     <Text style={styles.columnHeaderText}>Sets</Text>
//                     <Text style={styles.columnHeaderText}>Reps</Text>
//                   </View>
//                 </View>
//               </>
//             }
//             ListFooterComponent={
//               <TouchableOpacity style={styles.addButton} onPress={addWorkout}>
//                 <Feather
//                   name="plus-circle"
//                   size={18}
//                   color={styles.addButtonText.color}
//                 />
//                 <Text style={styles.addButtonText}>Add Workout</Text>
//               </TouchableOpacity>
//             }
//             contentContainerStyle={styles.modalListContent}
//           />
//         </View>
//       </View>
//     </Modal>
//   );
// };

// // =================================================================================================
// // --- MAIN WORKOUT PLAN SCREEN ---
// // =================================================================================================
// export default function WorkoutPlanScreen() {
//   const { user } = useAuth();
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);

//   const [isLoading, setIsLoading] = useState(true);
//   const [savedPlans, setSavedPlans] = useState<WorkoutPlan[]>([]);

//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);

//   // FIX: Memoize the collection reference to prevent re-creation on every render
//   const plansCollectionRef = useMemo(() => {
//     if (!user) return null;
//     return collection(db, "users", user.uid, "workoutPlans");
//   }, [user]);

//   const fetchWorkoutPlans = useCallback(async () => {
//     if (!plansCollectionRef) {
//       setIsLoading(false);
//       return;
//     }
//     setIsLoading(true);
//     try {
//       const querySnapshot = await getDocs(plansCollectionRef);
//       const plans = querySnapshot.docs.map(
//         (doc) => ({ id: doc.id, ...doc.data() } as WorkoutPlan)
//       );
//       setSavedPlans(plans);
//     } catch (error) {
//       console.error("Error fetching workout plans: ", error);
//       Alert.alert("Error", "Could not fetch your workout plans.");
//     } finally {
//       setIsLoading(false);
//     }
//   }, [plansCollectionRef]);

//   useEffect(() => {
//     fetchWorkoutPlans();
//   }, [fetchWorkoutPlans]);

//   const handleOpenCreateModal = () => {
//     setEditingPlan(null);
//     setIsModalVisible(true);
//   };

//   const handleOpenEditModal = (plan: WorkoutPlan) => {
//     setEditingPlan(plan);
//     setIsModalVisible(true);
//   };

//   const closeModal = () => {
//     setIsModalVisible(false);
//     setEditingPlan(null);
//   };

//   const handleSavePlan = async (planData: Omit<WorkoutPlan, "id">) => {
//     if (!user) return;

//     try {
//       if (editingPlan) {
//         const planDoc = doc(
//           db,
//           "users",
//           user.uid,
//           "workoutPlans",
//           editingPlan.id
//         );
//         await updateDoc(planDoc, planData);
//       } else {
//         const newPlansCollectionRef = collection(
//           db,
//           "users",
//           user.uid,
//           "workoutPlans"
//         );
//         await addDoc(newPlansCollectionRef, planData);
//       }
//       closeModal();
//       await fetchWorkoutPlans();
//     } catch (error) {
//       console.error("Error saving plan:", error);
//       Alert.alert("Error", "Could not save your plan.");
//     }
//   };

//   const handleDeletePlan = (plan: WorkoutPlan) => {
//     Alert.alert(
//       "Delete Plan",
//       `Are you sure you want to delete "${plan.planName}"? This action cannot be undone.`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: async () => {
//             if (!user) return;
//             try {
//               const planDoc = doc(
//                 db,
//                 "users",
//                 user.uid,
//                 "workoutPlans",
//                 plan.id
//               );
//               await deleteDoc(planDoc);
//               await fetchWorkoutPlans();
//             } catch (error) {
//               console.error("Error deleting plan:", error);
//               Alert.alert("Error", "Could not delete the plan.");
//             }
//           },
//         },
//       ]
//     );
//   };

//   if (isLoading) {
//     return (
//       <View style={[styles.container, { justifyContent: "center" }]}>
//         <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
//       </View>
//     );
//   }

//   return (
//     <GestureHandlerRootView style={styles.container}>
//       <FlatList
//         data={savedPlans}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={styles.planCard}
//             onPress={() => handleOpenEditModal(item)}
//             onLongPress={() => handleDeletePlan(item)}
//           >
//             <Text style={styles.planCardTitle}>{item.planName}</Text>
//             <View style={styles.planCardDaysContainer}>
//               {DAYS_OF_WEEK.map((day) => (
//                 <View
//                   key={day}
//                   style={[
//                     styles.planCardDay,
//                     item.selectedDays.includes(day) &&
//                       styles.planCardDaySelected,
//                   ]}
//                 >
//                   <Text
//                     style={[
//                       styles.planCardDayText,
//                       item.selectedDays.includes(day) &&
//                         styles.planCardDayTextSelected,
//                     ]}
//                   >
//                     {day.charAt(0)}
//                   </Text>
//                 </View>
//               ))}
//             </View>
//           </TouchableOpacity>
//         )}
//         contentContainerStyle={styles.planListContent}
//         ListHeaderComponent={
//           <Text style={styles.pageTitle}>My Workout Plans</Text>
//         }
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Text style={styles.emptyText}>No workout plans yet.</Text>
//             <Text style={styles.emptySubText}>
//               Tap the '+' button to get started!
//             </Text>
//           </View>
//         }
//       />

//       <TouchableOpacity style={styles.fab} onPress={handleOpenCreateModal}>
//         <Feather name="plus" size={28} color="#FFFFFF" />
//       </TouchableOpacity>

//       <PlanModal
//         visible={isModalVisible}
//         onClose={closeModal}
//         onSave={handleSavePlan}
//         initialPlan={editingPlan}
//       />
//     </GestureHandlerRootView>
//   );
// }

// // =================================================================================================
// // --- STYLES ---
// // =================================================================================================
// const getStyles = (scheme: "light" | "dark") => {
//   const colors = Colors[scheme];
//   return StyleSheet.create({
//     container: { flex: 1, backgroundColor: colors.background },
//     planListContent: { padding: 20, paddingBottom: 100 },
//     pageTitle: {
//       fontSize: 32,
//       fontWeight: "bold",
//       color: colors.text,
//       paddingTop: 30,
//       marginBottom: 20,
//     },
//     planCard: {
//       backgroundColor: colors.card,
//       padding: 20,
//       borderRadius: 12,
//       marginBottom: 15,
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 1 },
//       shadowOpacity: scheme === "light" ? 0.1 : 0,
//       shadowRadius: 4,
//       elevation: 3,
//     },
//     planCardTitle: {
//       fontSize: 20,
//       fontWeight: "bold",
//       color: colors.text,
//       marginBottom: 15,
//     },
//     planCardDaysContainer: {
//       flexDirection: "row",
//       justifyContent: "space-around",
//     },
//     planCardDay: {
//       width: 32,
//       height: 32,
//       borderRadius: 16,
//       justifyContent: "center",
//       alignItems: "center",
//       backgroundColor: colors.background,
//     },
//     planCardDaySelected: { backgroundColor: colors.primary },
//     planCardDayText: { color: colors.subtleText, fontWeight: "bold" },
//     planCardDayTextSelected: { color: "#FFFFFF" },
//     emptyContainer: {
//       flex: 1,
//       justifyContent: "center",
//       alignItems: "center",
//       marginTop: 60,
//       opacity: 0.7,
//     },
//     emptyText: { fontSize: 18, fontWeight: "600", color: colors.text },
//     emptySubText: { fontSize: 14, color: colors.subtleText, marginTop: 10 },
//     fab: {
//       position: "absolute",
//       width: 56,
//       height: 56,
//       alignItems: "center",
//       justifyContent: "center",
//       right: 20,
//       bottom: 105,
//       backgroundColor: colors.primary,
//       borderRadius: 28,
//       elevation: 8,
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.3,
//       shadowRadius: 4,
//     },
//     // Modal Styles
//     modalBackdrop: {
//       ...StyleSheet.absoluteFillObject,
//       backgroundColor: "rgba(0,0,0,0.5)",
//     },
//     modalOuterContainer: {
//       flex: 1,
//       justifyContent: "center",
//       alignItems: "center",
//       padding: 20,
//     },
//     modalContentContainer: {
//       width: "100%",
//       maxHeight: "85%",
//       borderRadius: 20,
//       backgroundColor: colors.card,
//       overflow: "hidden",
//     },
//     modalListContent: { paddingHorizontal: 20, paddingBottom: 20 },
//     modalHeader: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       paddingTop: 20,
//       paddingBottom: 10,
//     },
//     editableTitle: {
//       fontSize: 24,
//       fontWeight: "bold",
//       color: colors.text,
//       backgroundColor: colors.background,
//       padding: 10,
//       borderRadius: 8,
//       flex: 1,
//     },
//     saveIconButton: {
//       padding: 8,
//       marginLeft: 10,
//       color: colors.primary,
//     },
//     label: {
//       fontSize: 16,
//       fontWeight: "600",
//       color: colors.text,
//       marginTop: 20,
//       marginBottom: 10,
//     },
//     daysContainer: { flexDirection: "row", justifyContent: "space-between" },
//     dayButton: {
//       width: 40,
//       height: 40,
//       borderRadius: 20,
//       justifyContent: "center",
//       alignItems: "center",
//       backgroundColor: colors.background,
//     },
//     dayButtonSelected: { backgroundColor: colors.primary },
//     dayButtonText: { fontSize: 16, fontWeight: "bold", color: colors.text },
//     dayButtonTextSelected: { color: "#FFFFFF" },
//     workoutsHeader: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       marginTop: 25,
//       marginBottom: 10,
//       paddingHorizontal: 5,
//     },
//     headerLabelText: { fontSize: 16, fontWeight: "600", color: colors.text },
//     columnHeaderContainer: { flexDirection: "row", gap: 5 },
//     columnHeaderText: {
//       fontSize: 14,
//       fontWeight: "500",
//       color: colors.subtleText,
//       width: 50,
//       textAlign: "center",
//     },
//     // Editable Row Styles
//     workoutInputContainer: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 5,
//       backgroundColor: colors.background,
//       paddingVertical: 5,
//       borderRadius: 10,
//       marginBottom: 10,
//     },
//     workoutItemActive: {
//       elevation: 5,
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.1,
//       shadowRadius: 4,
//     },
//     workoutInput: { flex: 1, fontSize: 16, color: colors.text, padding: 10 },
//     setsRepsInput: {
//       fontSize: 16,
//       color: colors.text,
//       width: 50,
//       textAlign: "center",
//       padding: 10,
//     },
//     dragHandle: {
//       paddingHorizontal: 10,
//       alignItems: "center",
//       justifyContent: "center",
//     },
//     dragHandleIcon: { color: colors.subtleText },
//     deleteActionContainer: {
//       borderRadius: 10,
//       overflow: "hidden",
//       marginBottom: 10,
//     },
//     deleteAction: {
//       backgroundColor: colors.destructive,
//       justifyContent: "center",
//       alignItems: "flex-end",
//       paddingRight: 20,
//       flex: 1,
//     },
//     addButton: {
//       marginTop: 10,
//       paddingVertical: 10,
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "center",
//       gap: 8,
//     },
//     addButtonText: { color: colors.primary, fontSize: 16, fontWeight: "600" },
//   });
// };

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import {
  FlatList,
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

// Replace with your actual file paths
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";

// --- TYPE DEFINITIONS ---
interface Workout {
  id: string;
  name: string;
  sets: string;
  reps: string;
}

interface WorkoutPlan {
  id: string; // Firestore document ID
  planName: string;
  selectedDays: string[];
  workouts: Workout[];
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// =================================================================================================
// --- REUSABLE EDITABLE WORKOUT ROW COMPONENT ---
// =================================================================================================
interface EditableWorkoutRowProps extends RenderItemParams<Workout> {
  workouts: Workout[];
  setWorkouts: React.Dispatch<React.SetStateAction<Workout[]>>;
}

const EditableWorkoutRow: React.FC<EditableWorkoutRowProps> = ({
  item,
  drag,
  isActive,
  getIndex,
  workouts,
  setWorkouts,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const index = getIndex();

  if (index === undefined) return null;

  const updateField = (field: keyof Omit<Workout, "id">, value: string) => {
    const newWorkouts = [...workouts];
    newWorkouts[index][field] = value;
    setWorkouts(newWorkouts);
  };

  const handleDelete = () => {
    const newWorkouts = workouts.filter((_, i) => i !== index);
    setWorkouts(newWorkouts);
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <TouchableOpacity
        onPress={handleDelete}
        style={styles.deleteActionContainer}
      >
        <Animated.View
          style={[styles.deleteAction, { transform: [{ translateX: trans }] }]}
        >
          <Feather name="trash-2" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <ScaleDecorator>
      <Swipeable
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={() =>
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        }
        overshootRight={false}
      >
        <View
          style={[
            styles.workoutInputContainer,
            isActive && styles.workoutItemActive,
          ]}
        >
          <TouchableOpacity
            onLongPress={drag}
            disabled={isActive}
            style={styles.dragHandle}
          >
            <Feather
              name="menu"
              size={24}
              color={styles.dragHandleIcon.color}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.workoutInput}
            placeholder="Workout Name"
            placeholderTextColor={Colors[colorScheme].subtleText}
            value={item.name}
            onChangeText={(text) => updateField("name", text)}
          />
          <TextInput
            style={styles.setsRepsInput}
            placeholder="S"
            placeholderTextColor={Colors[colorScheme].subtleText}
            value={item.sets}
            keyboardType="numeric"
            onChangeText={(text) => updateField("sets", text)}
          />
          <TextInput
            style={styles.setsRepsInput}
            placeholder="R"
            placeholderTextColor={Colors[colorScheme].subtleText}
            value={item.reps}
            keyboardType="numeric"
            onChangeText={(text) => updateField("reps", text)}
          />
        </View>
      </Swipeable>
    </ScaleDecorator>
  );
};

// =================================================================================================
// --- WORKOUT PLAN MODAL COMPONENT ---
// =================================================================================================
interface PlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (plan: Omit<WorkoutPlan, "id">) => void;
  onDelete?: () => void; // Optional: A function to call when deleting
  initialPlan?: WorkoutPlan | null;
}

const PlanModal: React.FC<PlanModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  initialPlan = null,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const isEditing = !!initialPlan;

  const [planName, setPlanName] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const listRef = useRef<FlatList<Workout>>(null);

  useEffect(() => {
    if (visible) {
      setPlanName(initialPlan?.planName || "");
      setSelectedDays(initialPlan?.selectedDays || []);
      setWorkouts(
        initialPlan?.workouts.map((w, i) => ({
          ...w,
          id: w.id || `workout-${Date.now()}-${i}`,
        })) || []
      );
    }
  }, [visible, initialPlan]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addWorkout = () => {
    const newWorkout: Workout = {
      id: `workout-${Date.now()}`,
      name: "",
      sets: "",
      reps: "",
    };
    setWorkouts((prev) => [...prev, newWorkout]);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSave = () => {
    if (!planName || selectedDays.length === 0) {
      Alert.alert(
        "Incomplete Plan",
        "Please provide a name and select at least one day."
      );
      return;
    }
    onSave({ planName, selectedDays, workouts });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalOuterContainer}>
        <View style={styles.modalContentContainer}>
          <DraggableFlatList
            ref={listRef}
            data={workouts}
            onDragEnd={({ data }) => setWorkouts(data)}
            keyExtractor={(item) => item.id}
            renderItem={(props) => (
              <EditableWorkoutRow
                {...props}
                workouts={workouts}
                setWorkouts={setWorkouts}
              />
            )}
            ListHeaderComponent={
              <>
                <View style={styles.modalHeader}>
                  <TextInput
                    style={styles.editableTitle}
                    placeholder="New Workout Plan"
                    placeholderTextColor={Colors[colorScheme].subtleText}
                    value={planName}
                    onChangeText={setPlanName}
                    autoFocus={!isEditing}
                  />
                  <TouchableOpacity
                    style={styles.saveIconButton}
                    onPress={handleSave}
                  >
                    <Feather
                      name="check"
                      size={24}
                      color={styles.saveIconButton.color}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Select Days</Text>
                <View style={styles.daysContainer}>
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        selectedDays.includes(day) && styles.dayButtonSelected,
                      ]}
                      onPress={() => toggleDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          selectedDays.includes(day) &&
                            styles.dayButtonTextSelected,
                        ]}
                      >
                        {day.charAt(0)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.workoutsHeader}>
                  <Text style={styles.headerLabelText}>Workouts</Text>
                  <View style={styles.columnHeaderContainer}>
                    <Text style={styles.columnHeaderText}>Sets</Text>
                    <Text style={styles.columnHeaderText}>Reps</Text>
                  </View>
                </View>
              </>
            }
            ListFooterComponent={
              <View style={styles.footerButtonContainer}>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.destructiveLinkButton}
                    onPress={onDelete}
                  >
                    <Feather
                      name="trash-2"
                      size={18}
                      color={styles.destructiveLinkButtonText.color}
                    />
                    <Text style={styles.destructiveLinkButtonText}>
                      Delete Plan
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.addButton} onPress={addWorkout}>
                  <Feather
                    name="plus-circle"
                    size={18}
                    color={styles.addButtonText.color}
                  />
                  <Text style={styles.addButtonText}>Add Workout</Text>
                </TouchableOpacity>
              </View>
            }
            contentContainerStyle={styles.modalListContent}
          />
        </View>
      </View>
    </Modal>
  );
};

// =================================================================================================
// --- MAIN WORKOUT PLAN SCREEN ---
// =================================================================================================
export default function WorkoutPlanScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  const [isLoading, setIsLoading] = useState(true);
  const [savedPlans, setSavedPlans] = useState<WorkoutPlan[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);

  const plansCollectionRef = useMemo(() => {
    if (!user) return null;
    return collection(db, "users", user.uid, "workoutPlans");
  }, [user]);

  const fetchWorkoutPlans = useCallback(async () => {
    if (!plansCollectionRef) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(plansCollectionRef);
      const plans = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as WorkoutPlan)
      );
      setSavedPlans(plans);
    } catch (error) {
      console.error("Error fetching workout plans: ", error);
      Alert.alert("Error", "Could not fetch your workout plans.");
    } finally {
      setIsLoading(false);
    }
  }, [plansCollectionRef]);

  useEffect(() => {
    fetchWorkoutPlans();
  }, [fetchWorkoutPlans]);

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (plan: WorkoutPlan) => {
    setEditingPlan(plan);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingPlan(null);
  };

  const handleSavePlan = async (planData: Omit<WorkoutPlan, "id">) => {
    if (!user) return;

    try {
      if (editingPlan) {
        const planDoc = doc(
          db,
          "users",
          user.uid,
          "workoutPlans",
          editingPlan.id
        );
        await updateDoc(planDoc, planData);
      } else {
        const newPlansCollectionRef = collection(
          db,
          "users",
          user.uid,
          "workoutPlans"
        );
        await addDoc(newPlansCollectionRef, planData);
      }
      closeModal();
      await fetchWorkoutPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      Alert.alert("Error", "Could not save your plan.");
    }
  };

  const handleDeletePlan = (plan: WorkoutPlan) => {
    Alert.alert(
      "Delete Plan",
      `Are you sure you want to delete "${plan.planName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              const planDoc = doc(
                db,
                "users",
                user.uid,
                "workoutPlans",
                plan.id
              );
              await deleteDoc(planDoc);
              await fetchWorkoutPlans();
            } catch (error) {
              console.error("Error deleting plan:", error);
              Alert.alert("Error", "Could not delete the plan.");
            }
          },
        },
      ]
    );
  };

  const onDeleteFromModal = () => {
    if (editingPlan) {
      closeModal();
      // Add a slight delay to allow the modal to close before showing the alert
      setTimeout(() => handleDeletePlan(editingPlan), 200);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <FlatList
        data={savedPlans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.planCard}
            onPress={() => handleOpenEditModal(item)}
          >
            <Text style={styles.planCardTitle}>{item.planName}</Text>
            <View style={styles.planCardDaysContainer}>
              {DAYS_OF_WEEK.map((day) => (
                <View
                  key={day}
                  style={[
                    styles.planCardDay,
                    item.selectedDays.includes(day) &&
                      styles.planCardDaySelected,
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
        )}
        contentContainerStyle={styles.planListContent}
        ListHeaderComponent={
          <Text style={styles.pageTitle}>My Workout Plans</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workout plans yet.</Text>
            <Text style={styles.emptySubText}>
              Tap the '+' button to get started!
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleOpenCreateModal}>
        <Feather name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <PlanModal
        visible={isModalVisible}
        onClose={closeModal}
        onSave={handleSavePlan}
        onDelete={onDeleteFromModal}
        initialPlan={editingPlan}
      />
    </GestureHandlerRootView>
  );
}

// =================================================================================================
// --- STYLES ---
// =================================================================================================
const getStyles = (scheme: "light" | "dark") => {
  const colors = Colors[scheme];
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    planListContent: { padding: 20, paddingBottom: 100 },
    pageTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
      paddingTop: 30,
      marginBottom: 20,
    },
    planCard: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 12,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: scheme === "light" ? 0.1 : 0,
      shadowRadius: 4,
      elevation: 3,
    },
    planCardTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
    },
    planCardDaysContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    planCardDay: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    planCardDaySelected: { backgroundColor: colors.primary },
    planCardDayText: { color: colors.subtleText, fontWeight: "bold" },
    planCardDayTextSelected: { color: "#FFFFFF" },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 60,
      opacity: 0.7,
    },
    emptyText: { fontSize: 18, fontWeight: "600", color: colors.text },
    emptySubText: { fontSize: 14, color: colors.subtleText, marginTop: 10 },
    fab: {
      position: "absolute",
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      right: 20,
      bottom: 105,
      backgroundColor: colors.primary,
      borderRadius: 28,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    // Modal Styles
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalOuterContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContentContainer: {
      width: "100%",
      maxHeight: "85%",
      borderRadius: 20,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    modalListContent: { paddingHorizontal: 20, paddingBottom: 20 },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 20,
      paddingBottom: 10,
    },
    editableTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      backgroundColor: colors.background,
      padding: 10,
      borderRadius: 8,
      flex: 1,
    },
    saveIconButton: {
      padding: 8,
      marginLeft: 10,
      color: colors.primary,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginTop: 20,
      marginBottom: 10,
    },
    daysContainer: { flexDirection: "row", justifyContent: "space-between" },
    dayButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    dayButtonSelected: { backgroundColor: colors.primary },
    dayButtonText: { fontSize: 16, fontWeight: "bold", color: colors.text },
    dayButtonTextSelected: { color: "#FFFFFF" },
    workoutsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 25,
      marginBottom: 10,
      paddingHorizontal: 5,
    },
    headerLabelText: { fontSize: 16, fontWeight: "600", color: colors.text },
    columnHeaderContainer: { flexDirection: "row", gap: 5 },
    columnHeaderText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.subtleText,
      width: 50,
      textAlign: "center",
    },
    // Editable Row Styles
    workoutInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colors.background,
      paddingVertical: 5,
      borderRadius: 10,
      marginBottom: 10,
    },
    workoutItemActive: {
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    workoutInput: { flex: 1, fontSize: 16, color: colors.text, padding: 10 },
    setsRepsInput: {
      fontSize: 16,
      color: colors.text,
      width: 50,
      textAlign: "center",
      padding: 10,
    },
    dragHandle: {
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    dragHandleIcon: { color: colors.subtleText },
    deleteActionContainer: {
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 10,
    },
    deleteAction: {
      backgroundColor: colors.destructive,
      justifyContent: "center",
      alignItems: "flex-end",
      paddingRight: 20,
      flex: 1,
    },
    // Footer Styles
    footerButtonContainer: {
      marginTop: 10,
      flexDirection: "row",
      justifyContent: "space-between", // Pushes items to opposite ends
      alignItems: "center",
    },
    addButton: {
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      // If not in edit mode, this will be pushed to the center by the container style
      marginLeft: "auto", // Pushes to the right in edit mode
    },
    addButtonText: { color: colors.primary, fontSize: 16, fontWeight: "600" },
    destructiveLinkButton: {
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    destructiveLinkButtonText: {
      color: colors.destructive,
      fontSize: 16,
      fontWeight: "600",
    },
  });
};
