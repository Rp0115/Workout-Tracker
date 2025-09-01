// import { Feather } from "@expo/vector-icons";
// import * as Haptics from "expo-haptics";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDocs,
//   updateDoc,
//   writeBatch,
// } from "firebase/firestore";
// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Animated,
//   Dimensions,
//   Modal,
//   SafeAreaView,
//   ScrollView,
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
// import { FlatList, GestureHandlerRootView } from "react-native-gesture-handler";

// // Replace with your actual file paths
// import { Colors } from "../../constants/Colors";
// import { useAuth } from "../../context/AuthContext";
// import { db } from "../../firebaseConfig";

// // --- DATA IMPORT ---
// import exercises from "../../exercises.json";

// // --- TYPE DEFINITIONS ---
// interface Workout {
//   id: number;
//   name: string;
//   sets: string;
//   reps: string;
// }

// interface WorkoutPlan {
//   id: string;
//   planName: string;
//   description?: string;
//   selectedDays: string[];
//   workouts: Omit<Workout, "id">[];
//   order: number;
//   icon?: string;
// }

// interface Exercise {
//   id: string;
//   name: string;
//   force: string | null;
//   level: string;
//   mechanic: string | null;
//   equipment: string | null;
//   primaryMuscles: string[];
//   secondaryMuscles: string[];
//   instructions: string[];
//   category: string;
// }

// interface Filters {
//   muscle: string | null;
//   category: string | null;
//   level: string | null;
//   equipment: string | null;
//   force: string | null;
// }

// interface ExerciseData {
//   muscleGroups: string[];
//   categories: string[];
//   levels: string[];
//   equipment: string[];
//   forces: string[];
// }

// // --- CONSTANTS ---
// const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// const { width: screenWidth } = Dimensions.get("window");
// const CARD_WIDTH = screenWidth * 0.75;
// const CARD_HEIGHT = CARD_WIDTH * 1.25;
// const CARD_MARGIN = (screenWidth - CARD_WIDTH) / 8;
// const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

// // =================================================================================================
// // --- REUSABLE FILTER COMPONENTS ---
// // =================================================================================================

// interface FilterChipProps {
//   label: string;
//   isSelected: boolean;
//   onPress: () => void;
// }

// const FilterChip: React.FC<FilterChipProps> = ({
//   label,
//   isSelected,
//   onPress,
// }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   return (
//     <TouchableOpacity
//       onPress={onPress}
//       style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
//     >
//       <Text
//         style={[
//           styles.categoryChipText,
//           isSelected && styles.categoryChipTextSelected,
//         ]}
//       >
//         {label}
//       </Text>
//     </TouchableOpacity>
//   );
// };

// interface ExerciseFilterProps {
//   filterOptions: ExerciseData;
//   selectedFilters: Filters;
//   onUpdateFilters: (newFilters: Filters) => void;
// }

// const ExerciseFilter: React.FC<ExerciseFilterProps> = ({
//   filterOptions,
//   selectedFilters,
//   onUpdateFilters,
// }) => {
//   const styles = getStyles(useColorScheme() ?? "light");

//   const handleFilterSelect = (type: keyof Filters, value: string | null) => {
//     onUpdateFilters({
//       ...selectedFilters,
//       [type]: selectedFilters[type] === value ? null : value,
//     });
//   };

//   const hasActiveFilter = Object.values(selectedFilters).some(
//     (v) => v !== null
//   );

//   return (
//     <View style={styles.modalFilterContainer}>
//       <View style={styles.listHeaderContainer}>
//         <Text style={styles.exploreSubtitle}>Filters</Text>
//         {hasActiveFilter && (
//           <TouchableOpacity
//             onPress={() =>
//               onUpdateFilters({
//                 muscle: null,
//                 category: null,
//                 level: null,
//                 equipment: null,
//                 force: null,
//               })
//             }
//           >
//             <Text style={styles.clearFilterText}>Clear Filters</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       <Text style={styles.filterSectionTitle}>Muscle Group</Text>
//       <FlatList
//         data={filterOptions.muscleGroups}
//         renderItem={({ item }) => (
//           <FilterChip
//             label={item}
//             isSelected={selectedFilters.muscle === item}
//             onPress={() => handleFilterSelect("muscle", item)}
//           />
//         )}
//         keyExtractor={(item) => item}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
//         ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
//       />

//       <Text style={styles.filterSectionTitle}>Equipment</Text>
//       <View style={styles.categoryChipContainer}>
//         {filterOptions.equipment.map((item) => (
//           <FilterChip
//             key={item}
//             label={item}
//             isSelected={selectedFilters.equipment === item}
//             onPress={() => handleFilterSelect("equipment", item)}
//           />
//         ))}
//       </View>

//       <Text style={styles.filterSectionTitle}>Difficulty Level</Text>
//       <View style={styles.categoryChipContainer}>
//         {filterOptions.levels.map((item) => (
//           <FilterChip
//             key={item}
//             label={item}
//             isSelected={selectedFilters.level === item}
//             onPress={() => handleFilterSelect("level", item)}
//           />
//         ))}
//       </View>

//       <Text style={styles.filterSectionTitle}>Category</Text>
//       <View style={styles.categoryChipContainer}>
//         {filterOptions.categories.map((item) => (
//           <FilterChip
//             key={item}
//             label={item}
//             isSelected={selectedFilters.category === item}
//             onPress={() => handleFilterSelect("category", item)}
//           />
//         ))}
//       </View>

//       <Text style={styles.filterSectionTitle}>Force Type</Text>
//       <View style={styles.categoryChipContainer}>
//         {filterOptions.forces.map((item) => (
//           <FilterChip
//             key={item}
//             label={item}
//             isSelected={selectedFilters.force === item}
//             onPress={() => handleFilterSelect("force", item)}
//           />
//         ))}
//       </View>
//     </View>
//   );
// };

// // =================================================================================================
// // --- MODAL COMPONENTS ---
// // =================================================================================================
// interface ExerciseDetailModalProps {
//   visible: boolean;
//   onClose: () => void;
//   exercise: Exercise | null;
// }

// const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
//   visible,
//   onClose,
//   exercise,
// }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);

//   if (!exercise) return null;

//   const detailItems = [
//     { label: "Level", value: exercise.level },
//     { label: "Equipment", value: exercise.equipment },
//     { label: "Category", value: exercise.category },
//     { label: "Force", value: exercise.force },
//     { label: "Mechanic", value: exercise.mechanic },
//   ].filter((item) => item.value);

//   return (
//     <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
//       <SafeAreaView style={styles.newModalContainer}>
//         <View style={styles.newModalHeader}>
//           <View style={{ width: 60 }} />
//           <Text style={styles.newModalTitle} numberOfLines={1}>
//             {exercise.name}
//           </Text>
//           <TouchableOpacity onPress={onClose} style={styles.newHeaderButton}>
//             <Text style={[styles.newHeaderButtonText, { fontWeight: "bold" }]}>
//               Done
//             </Text>
//           </TouchableOpacity>
//         </View>
//         <ScrollView contentContainerStyle={styles.detailScrollContainer}>
//           <View style={styles.detailTagsContainer}>
//             {detailItems.map((item, index) => (
//               <View key={index} style={styles.detailTag}>
//                 <Text style={styles.detailTagLabel}>{item.label}:</Text>
//                 <Text style={styles.detailTagValue}>{item.value}</Text>
//               </View>
//             ))}
//           </View>

//           <View style={styles.detailSection}>
//             <Text style={styles.detailSectionTitle}>Primary Muscles</Text>
//             <Text style={styles.detailText}>
//               {exercise.primaryMuscles.join(", ")}
//             </Text>
//           </View>

//           {exercise.secondaryMuscles.length > 0 && (
//             <View style={styles.detailSection}>
//               <Text style={styles.detailSectionTitle}>Secondary Muscles</Text>
//               <Text style={styles.detailText}>
//                 {exercise.secondaryMuscles.join(", ")}
//               </Text>
//             </View>
//           )}

//           <View style={styles.detailSection}>
//             <Text style={styles.detailSectionTitle}>Instructions</Text>
//             {exercise.instructions.map((step, index) => (
//               <View key={index} style={styles.instructionStep}>
//                 <Text style={styles.instructionNumber}>{index + 1}.</Text>
//                 <Text style={styles.instructionText}>{step}</Text>
//               </View>
//             ))}
//           </View>
//         </ScrollView>
//       </SafeAreaView>
//     </Modal>
//   );
// };

// interface ExerciseExplorerModalProps {
//   visible: boolean;
//   onClose: () => void;
//   exerciseData: ExerciseData;
//   onViewExercise: (exercise: Exercise) => void;
// }

// const ExerciseExplorerModal: React.FC<ExerciseExplorerModalProps> = ({
//   visible,
//   onClose,
//   exerciseData,
//   onViewExercise,
// }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filters, setFilters] = useState<Filters>({
//     muscle: null,
//     category: null,
//     level: null,
//     equipment: null,
//     force: null,
//   });

//   const filteredExercises = useMemo(() => {
//     let list = exercises as Exercise[];
//     const query = searchQuery.toLowerCase();

//     if (filters.muscle) {
//       const muscle = filters.muscle.toLowerCase();
//       list = list.filter((ex) =>
//         ex.primaryMuscles.some((m) => m.toLowerCase() === muscle)
//       );
//     }
//     if (filters.category) {
//       const category = filters.category.toLowerCase();
//       list = list.filter((ex) => ex.category.toLowerCase() === category);
//     }
//     if (filters.level) {
//       const level = filters.level.toLowerCase();
//       list = list.filter((ex) => ex.level.toLowerCase() === level);
//     }
//     if (filters.equipment) {
//       const equipment = filters.equipment.toLowerCase();
//       list = list.filter(
//         (ex) => ex.equipment && ex.equipment.toLowerCase() === equipment
//       );
//     }
//     if (filters.force) {
//       const force = filters.force.toLowerCase();
//       list = list.filter((ex) => ex.force && ex.force.toLowerCase() === force);
//     }
//     if (query) {
//       list = list.filter((ex) => ex.name.toLowerCase().includes(query));
//     }
//     return list;
//   }, [searchQuery, filters]);

//   return (
//     <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
//       <SafeAreaView style={styles.newModalContainer}>
//         <View style={styles.newModalHeader}>
//           <View style={{ width: 60 }} />
//           <Text style={styles.newModalTitle}>Explore Exercises</Text>
//           <TouchableOpacity onPress={onClose} style={styles.newHeaderButton}>
//             <Text style={[styles.newHeaderButtonText, { fontWeight: "bold" }]}>
//               Done
//             </Text>
//           </TouchableOpacity>
//         </View>

//         <FlatList
//           data={filteredExercises}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={{ paddingBottom: 20 }}
//           ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
//           renderItem={({ item }) => (
//             <View style={{ paddingHorizontal: 20 }}>
//               <ExerciseCard
//                 exercise={item}
//                 onPress={() => onViewExercise(item)}
//               />
//             </View>
//           )}
//           ListHeaderComponent={
//             <>
//               <View style={styles.searchContainer}>
//                 <TextInput
//                   style={styles.searchInput}
//                   placeholder="Search exercises..."
//                   placeholderTextColor={Colors[colorScheme].subtleText}
//                   value={searchQuery}
//                   onChangeText={setSearchQuery}
//                 />
//               </View>
//               <ExerciseFilter
//                 filterOptions={exerciseData}
//                 selectedFilters={filters}
//                 onUpdateFilters={setFilters}
//               />
//             </>
//           }
//           ListEmptyComponent={
//             <View style={styles.emptyListContainer}>
//               <Text style={styles.emptyListText}>No exercises found.</Text>
//             </View>
//           }
//         />
//       </SafeAreaView>
//     </Modal>
//   );
// };

// interface ExercisePickerModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onSelect: (selectedExercises: Exercise[]) => void;
//   exerciseData: ExerciseData;
//   onViewExercise: (exercise: Exercise) => void;
// }

// const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
//   visible,
//   onClose,
//   onSelect,
//   exerciseData,
//   onViewExercise,
// }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selected, setSelected] = useState<string[]>([]);
//   const [filters, setFilters] = useState<Filters>({
//     muscle: null,
//     category: null,
//     level: null,
//     equipment: null,
//     force: null,
//   });

//   useEffect(() => {
//     if (!visible) {
//       setSearchQuery("");
//       setSelected([]);
//       setFilters({
//         muscle: null,
//         category: null,
//         level: null,
//         equipment: null,
//         force: null,
//       });
//     }
//   }, [visible]);

//   const filteredExercises = useMemo(() => {
//     let list = exercises as Exercise[];
//     const query = searchQuery.toLowerCase();

//     if (filters.muscle) {
//       const muscle = filters.muscle.toLowerCase();
//       list = list.filter((ex) =>
//         ex.primaryMuscles.some((m) => m.toLowerCase() === muscle)
//       );
//     }
//     if (filters.category) {
//       const category = filters.category.toLowerCase();
//       list = list.filter((ex) => ex.category.toLowerCase() === category);
//     }
//     if (filters.level) {
//       const level = filters.level.toLowerCase();
//       list = list.filter((ex) => ex.level.toLowerCase() === level);
//     }
//     if (filters.equipment) {
//       const equipment = filters.equipment.toLowerCase();
//       list = list.filter(
//         (ex) => ex.equipment && ex.equipment.toLowerCase() === equipment
//       );
//     }
//     if (filters.force) {
//       const force = filters.force.toLowerCase();
//       list = list.filter((ex) => ex.force && ex.force.toLowerCase() === force);
//     }
//     if (query) {
//       list = list.filter((ex) => ex.name.toLowerCase().includes(query));
//     }
//     return list;
//   }, [searchQuery, filters]);

//   const toggleSelection = (exerciseId: string) => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     setSelected((current) =>
//       current.includes(exerciseId)
//         ? current.filter((id) => id !== exerciseId)
//         : [...current, exerciseId]
//     );
//   };

//   const handleDone = () => {
//     const selectedExercises = (exercises as Exercise[]).filter((ex) =>
//       selected.includes(ex.id)
//     );
//     onSelect(selectedExercises);
//     onClose();
//   };

//   const renderItem = ({ item }: { item: Exercise }) => {
//     const isSelected = selected.includes(item.id);
//     const displayName =
//       item.name.length > 35 ? `${item.name.substring(0, 35)}...` : item.name;

//     return (
//       <TouchableOpacity
//         style={[
//           styles.exerciseListItem,
//           isSelected && styles.exerciseListItemSelected,
//         ]}
//         onPress={() => toggleSelection(item.id)}
//       >
//         <TouchableOpacity
//           onPress={() => onViewExercise(item)}
//           style={styles.infoIconTouchable}
//         >
//           <Feather
//             name="info"
//             size={22}
//             color={styles.newHeaderButtonText.color}
//           />
//         </TouchableOpacity>

//         <View style={{ flex: 1 }}>
//           <Text style={styles.exerciseName}>{displayName}</Text>
//           <Text style={styles.exerciseMuscles}>
//             {item.primaryMuscles.join(", ")}
//           </Text>
//         </View>
//         <View
//           style={[
//             styles.checkbox,
//             isSelected && {
//               backgroundColor: styles.newHeaderButtonText.color,
//               borderColor: styles.newHeaderButtonText.color,
//             },
//           ]}
//         >
//           {isSelected && <Feather name="check" size={16} color="white" />}
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
//       <SafeAreaView style={styles.newModalContainer}>
//         <View style={styles.newModalHeader}>
//           <TouchableOpacity onPress={onClose} style={styles.newHeaderButton}>
//             <Text style={styles.newHeaderButtonText}>Cancel</Text>
//           </TouchableOpacity>
//           <Text style={styles.newModalTitle}>Select Exercises</Text>
//           <TouchableOpacity onPress={handleDone} style={styles.newHeaderButton}>
//             <Text style={[styles.newHeaderButtonText, { fontWeight: "bold" }]}>
//               Done ({selected.length})
//             </Text>
//           </TouchableOpacity>
//         </View>

//         <FlatList
//           data={filteredExercises}
//           renderItem={renderItem}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
//           ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
//           ListHeaderComponent={
//             <>
//               <View style={styles.searchContainer}>
//                 <TextInput
//                   style={styles.searchInput}
//                   placeholder="Search exercises..."
//                   placeholderTextColor={Colors[colorScheme].subtleText}
//                   value={searchQuery}
//                   onChangeText={setSearchQuery}
//                 />
//               </View>
//               <ExerciseFilter
//                 filterOptions={exerciseData}
//                 selectedFilters={filters}
//                 onUpdateFilters={setFilters}
//               />
//             </>
//           }
//         />
//       </SafeAreaView>
//     </Modal>
//   );
// };

// interface NewWorkoutRowProps extends RenderItemParams<Workout> {
//   onUpdate: (
//     index: number,
//     field: keyof Omit<Workout, "id">,
//     value: string
//   ) => void;
//   onDelete: (id: number) => void;
// }

// const NewWorkoutRow: React.FC<NewWorkoutRowProps> = ({
//   item,
//   drag,
//   isActive,
//   getIndex,
//   onUpdate,
//   onDelete,
// }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   const index = getIndex();

//   if (index === undefined) return null;

//   return (
//     <ScaleDecorator>
//       <View
//         style={[styles.newWorkoutCard, isActive && styles.newWorkoutCardActive]}
//       >
//         <TouchableOpacity
//           onLongPress={drag}
//           disabled={isActive}
//           style={styles.newDragHandle}
//         >
//           <Feather name="menu" size={24} color={styles.newDragHandle.color} />
//         </TouchableOpacity>

//         <View style={styles.newWorkoutInputsContainer}>
//           <TextInput
//             style={styles.newWorkoutNameInput}
//             placeholder="Workout Name"
//             placeholderTextColor={Colors[colorScheme].subtleText}
//             value={item.name}
//             onChangeText={(text) => onUpdate(index, "name", text)}
//           />
//           <View style={styles.newSetsRepsContainer}>
//             <View style={styles.newSetRepInputWrapper}>
//               <Text style={styles.newSetRepLabel}>Sets</Text>
//               <TextInput
//                 style={styles.newSetRepInput}
//                 placeholder="3"
//                 placeholderTextColor={Colors[colorScheme].subtleText}
//                 keyboardType="number-pad"
//                 value={item.sets}
//                 onChangeText={(text) => onUpdate(index, "sets", text)}
//               />
//             </View>
//             <View style={styles.newSetRepInputWrapper}>
//               <Text style={styles.newSetRepLabel}>Reps</Text>
//               <TextInput
//                 style={styles.newSetRepInput}
//                 placeholder="10"
//                 placeholderTextColor={Colors[colorScheme].subtleText}
//                 keyboardType="number-pad"
//                 value={item.reps}
//                 onChangeText={(text) => onUpdate(index, "reps", text)}
//               />
//             </View>
//           </View>
//         </View>

//         <TouchableOpacity
//           onPress={() => onDelete(item.id)}
//           style={styles.newDeleteWorkoutButton}
//         >
//           <Feather
//             name="x"
//             size={20}
//             color={styles.newDeleteWorkoutButton.color}
//           />
//         </TouchableOpacity>
//       </View>
//     </ScaleDecorator>
//   );
// };

// interface PlanModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onSave: (plan: Omit<WorkoutPlan, "id" | "order"> & { order: number }) => void;
//   onDelete?: () => void;
//   initialPlan?: WorkoutPlan | null;
//   exerciseData: ExerciseData;
//   onViewExercise: (exercise: Exercise) => void;
// }

// const PlanModal: React.FC<PlanModalProps> = ({
//   visible,
//   onClose,
//   onSave,
//   onDelete,
//   initialPlan = null,
//   exerciseData,
//   onViewExercise,
// }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   const isEditing = !!initialPlan;

//   const [planName, setPlanName] = useState("");
//   const [description, setDescription] = useState("");
//   const [selectedDays, setSelectedDays] = useState<string[]>([]);
//   const [workouts, setWorkouts] = useState<Workout[]>([]);
//   const [isPickerVisible, setIsPickerVisible] = useState(false);

//   useEffect(() => {
//     if (visible) {
//       setPlanName(initialPlan?.planName || "");
//       setDescription(initialPlan?.description || "");
//       setSelectedDays(initialPlan?.selectedDays || []);
//       const initialWorkouts =
//         initialPlan?.workouts.map((w, i) => ({ ...w, id: i })) || [];
//       setWorkouts(initialWorkouts);
//     }
//   }, [visible, initialPlan]);

//   const toggleDay = (day: string) => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     setSelectedDays((prev) =>
//       prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
//     );
//   };

//   const handleUpdateWorkout = (
//     index: number,
//     field: keyof Omit<Workout, "id">,
//     value: string
//   ) => {
//     const newWorkouts = [...workouts];
//     newWorkouts[index][field] = value;
//     setWorkouts(newWorkouts);
//   };

//   const handleAddWorkout = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     const newWorkout: Workout = {
//       id: Date.now(),
//       name: "",
//       sets: "",
//       reps: "",
//     };
//     setWorkouts((prev) => [...prev, newWorkout]);
//   };

//   const handleDeleteWorkout = (idToDelete: number) => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     setWorkouts((prev) => prev.filter((w) => w.id !== idToDelete));
//   };

//   const handleSelectExercises = (selectedExercises: Exercise[]) => {
//     const newWorkouts: Workout[] = selectedExercises.map((ex) => ({
//       id: Date.now() + Math.random(),
//       name: ex.name,
//       sets: "",
//       reps: "",
//     }));
//     setWorkouts((prev) => [...prev, ...newWorkouts]);
//   };

//   const handleSave = () => {
//     if (!planName) {
//       Alert.alert("Missing Name", "Please give your workout plan a name.");
//       return;
//     }

//     const workoutsToSave = workouts.map(({ id, ...rest }) => rest);

//     const planData = {
//       planName,
//       description: description.trim(),
//       selectedDays,
//       workouts: workoutsToSave,
//       order: initialPlan?.order ?? 0,
//       icon: initialPlan?.icon || "💪",
//     };
//     onSave(planData);
//   };

//   return (
//     <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
//       <ExercisePickerModal
//         visible={isPickerVisible}
//         onClose={() => setIsPickerVisible(false)}
//         onSelect={handleSelectExercises}
//         exerciseData={exerciseData}
//         onViewExercise={onViewExercise}
//       />
//       <GestureHandlerRootView style={{ flex: 1 }}>
//         <SafeAreaView style={styles.newModalContainer}>
//           <View style={styles.newModalHeader}>
//             <TouchableOpacity onPress={onClose} style={styles.newHeaderButton}>
//               <Text style={styles.newHeaderButtonText}>Cancel</Text>
//             </TouchableOpacity>
//             <Text style={styles.newModalTitle}>
//               {isEditing ? "Edit Plan" : "New Plan"}
//             </Text>
//             <TouchableOpacity
//               onPress={handleSave}
//               style={styles.newHeaderButton}
//             >
//               <Text
//                 style={[styles.newHeaderButtonText, { fontWeight: "bold" }]}
//               >
//                 Save
//               </Text>
//             </TouchableOpacity>
//           </View>

//           <DraggableFlatList
//             data={workouts}
//             onDragEnd={({ data }) => setWorkouts(data)}
//             keyExtractor={(item) => item.id.toString()}
//             renderItem={(props) => (
//               <NewWorkoutRow
//                 {...props}
//                 onUpdate={handleUpdateWorkout}
//                 onDelete={handleDeleteWorkout}
//               />
//             )}
//             onDragBegin={() =>
//               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
//             }
//             onPlaceholderIndexChange={() =>
//               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
//             }
//             ListHeaderComponent={
//               <View>
//                 <View style={styles.newSectionContainer}>
//                   <Text style={styles.newSectionTitle}>Details</Text>
//                   <View style={styles.newInputGroup}>
//                     <TextInput
//                       style={styles.newTextInput}
//                       placeholder="Plan Name (e.g., Upper Body)"
//                       placeholderTextColor={Colors[colorScheme].subtleText}
//                       value={planName}
//                       onChangeText={setPlanName}
//                     />
//                     <View style={styles.newDivider} />
//                     <TextInput
//                       style={[
//                         styles.newTextInput,
//                         { minHeight: 60, textAlignVertical: "top" },
//                       ]}
//                       placeholder="Description (optional)"
//                       placeholderTextColor={Colors[colorScheme].subtleText}
//                       value={description}
//                       onChangeText={setDescription}
//                       multiline
//                     />
//                   </View>
//                 </View>

//                 <View style={styles.newSectionContainer}>
//                   <Text style={styles.newSectionTitle}>Schedule</Text>
//                   <View style={styles.newDaysContainer}>
//                     {DAYS_OF_WEEK.map((day) => (
//                       <TouchableOpacity
//                         key={day}
//                         style={[
//                           styles.newDayButton,
//                           selectedDays.includes(day) &&
//                             styles.newDayButtonSelected,
//                         ]}
//                         onPress={() => toggleDay(day)}
//                       >
//                         <Text
//                           style={[
//                             styles.newDayButtonText,
//                             selectedDays.includes(day) &&
//                               styles.newDayButtonTextSelected,
//                           ]}
//                         >
//                           {day}
//                         </Text>
//                       </TouchableOpacity>
//                     ))}
//                   </View>
//                 </View>

//                 <View style={styles.newSectionContainer}>
//                   <Text style={styles.newSectionTitle}>Exercises</Text>
//                 </View>
//               </View>
//             }
//             ListFooterComponent={
//               <View style={styles.listFooterContainer}>
//                 <View style={styles.modalActionRow}>
//                   <TouchableOpacity
//                     style={[styles.newAddWorkoutButton, { flex: 1 }]}
//                     onPress={handleAddWorkout}
//                   >
//                     <Feather
//                       name="plus"
//                       size={20}
//                       color={styles.newAddWorkoutButtonText.color}
//                     />
//                     <Text style={styles.newAddWorkoutButtonText}>Blank</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity
//                     style={[
//                       styles.newAddWorkoutButton,
//                       {
//                         flex: 1,
//                         backgroundColor: Colors[colorScheme].primary + "E6",
//                       },
//                     ]}
//                     onPress={() => setIsPickerVisible(true)}
//                   >
//                     <Feather name="list" size={20} color={"white"} />
//                     <Text
//                       style={[
//                         styles.newAddWorkoutButtonText,
//                         { color: "white" },
//                       ]}
//                     >
//                       Library
//                     </Text>
//                   </TouchableOpacity>
//                 </View>

//                 {isEditing && (
//                   <TouchableOpacity
//                     style={styles.newDeletePlanButton}
//                     onPress={onDelete}
//                   >
//                     <Text style={styles.newDeletePlanButtonText}>
//                       Delete Workout Plan
//                     </Text>
//                   </TouchableOpacity>
//                 )}
//               </View>
//             }
//             contentContainerStyle={{ paddingBottom: 40 }}
//             ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
//             containerStyle={{ flex: 1 }}
//           />
//         </SafeAreaView>
//       </GestureHandlerRootView>
//     </Modal>
//   );
// };

// // =================================================================================================
// // --- MAIN SCREEN COMPONENTS ---
// // =================================================================================================

// interface PlanCardProps {
//   item: WorkoutPlan;
//   onPress: () => void;
//   onLongPress: () => void;
// }

// const PlanCard: React.FC<PlanCardProps> = ({ item, onPress, onLongPress }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   const cardColors =
//     colorScheme === "light" ? ["#A855F7", "#EC4899"] : ["#4F46E5", "#2DD4BF"];

//   const descriptionText =
//     item.description || `${item.workouts.length} workouts`;
//   const truncatedDescription =
//     descriptionText.length > 75
//       ? `${descriptionText.substring(0, 75)}...`
//       : descriptionText;

//   const firstThreeWorkouts = item.workouts.slice(0, 3);

//   return (
//     <TouchableOpacity
//       style={styles.cardWrapper}
//       onPress={onPress}
//       onLongPress={onLongPress}
//       activeOpacity={0.8}
//     >
//       <View style={[styles.card, { backgroundColor: cardColors[0] }]}>
//         <View
//           style={[styles.cardGradient, { backgroundColor: cardColors[1] }]}
//         />
//         <View style={styles.cardContent}>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.cardIcon}>{item.icon || "💪"}</Text>
//             <Text style={styles.cardTitle} numberOfLines={2}>
//               {item.planName}
//             </Text>
//             <Text style={styles.cardDescription}>{truncatedDescription}</Text>

//             {firstThreeWorkouts.length > 0 && (
//               <View style={styles.cardWorkoutListContainer}>
//                 {firstThreeWorkouts.map((workout, index) => (
//                   <View key={index} style={styles.cardWorkoutListItemContainer}>
//                     <Text
//                       style={styles.cardWorkoutListItemName}
//                       numberOfLines={1}
//                     >
//                       {workout.name}
//                     </Text>
//                     {workout.sets && workout.reps && (
//                       <Text style={styles.cardWorkoutListItemSetsReps}>
//                         {workout.sets}x{workout.reps}
//                       </Text>
//                     )}
//                   </View>
//                 ))}
//               </View>
//             )}
//           </View>

//           <View style={styles.cardDaysContainer}>
//             {DAYS_OF_WEEK.map((day) => (
//               <View
//                 key={day}
//                 style={[
//                   styles.cardDayBubble,
//                   item.selectedDays.includes(day) &&
//                     styles.cardDayBubbleSelected,
//                 ]}
//               >
//                 <Text
//                   style={[
//                     styles.cardDayText,
//                     item.selectedDays.includes(day) &&
//                       styles.cardDayTextSelected,
//                   ]}
//                 >
//                   {day.charAt(0)}
//                 </Text>
//               </View>
//             ))}
//           </View>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// interface ExerciseCardProps {
//   exercise: Exercise;
//   onPress: () => void;
// }

// const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onPress }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);

//   const displayName =
//     exercise.name.length > 35
//       ? `${exercise.name.substring(0, 35)}...`
//       : exercise.name;

//   return (
//     <View style={styles.exerciseCard}>
//       <View style={{ flex: 1, marginRight: 10 }}>
//         <Text style={styles.exerciseCardTitle}>{displayName}</Text>
//         <Text style={styles.exerciseCardSubtitle}>
//           {exercise.primaryMuscles.join(", ")}
//         </Text>
//       </View>
//       <TouchableOpacity onPress={onPress}>
//         <Feather
//           name="info"
//           size={24}
//           color={styles.newHeaderButtonText.color}
//         />
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default function WorkoutPlanScreen() {
//   const { user } = useAuth();
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);

//   const [isLoading, setIsLoading] = useState(true);
//   const [savedPlans, setSavedPlans] = useState<WorkoutPlan[]>([]);
//   const [originalOrder, setOriginalOrder] = useState<WorkoutPlan[]>([]);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
//   const [isReorderMode, setIsReorderMode] = useState(false);
//   const [isExplorerModalVisible, setIsExplorerModalVisible] = useState(false);
//   const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

//   const handleViewExercise = (exercise: Exercise) => {
//     setViewingExercise(exercise);
//   };

//   const exerciseData = useMemo((): ExerciseData => {
//     const muscleSet = new Set<string>();
//     const categorySet = new Set<string>();
//     const levelSet = new Set<string>();
//     const equipmentSet = new Set<string>();
//     const forceSet = new Set<string>();

//     const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

//     (exercises as Exercise[]).forEach((exercise) => {
//       if (Array.isArray(exercise.primaryMuscles)) {
//         exercise.primaryMuscles.forEach((muscle) =>
//           muscleSet.add(capitalize(muscle))
//         );
//       }
//       if (exercise.category) {
//         categorySet.add(capitalize(exercise.category));
//       }
//       if (exercise.level) {
//         levelSet.add(capitalize(exercise.level));
//       }
//       if (exercise.equipment) {
//         equipmentSet.add(capitalize(exercise.equipment));
//       }
//       if (exercise.force) {
//         forceSet.add(capitalize(exercise.force));
//       }
//     });
//     return {
//       muscleGroups: Array.from(muscleSet).sort(),
//       categories: Array.from(categorySet).sort(),
//       levels: Array.from(levelSet).sort(),
//       equipment: Array.from(equipmentSet).sort(),
//       forces: Array.from(forceSet).sort(),
//     };
//   }, []);

//   const reorderAnim = useRef(new Animated.Value(0)).current;
//   const revertButtonAnim = useRef(new Animated.Value(0)).current;

//   const hasOrderChanged = useMemo(() => {
//     if (originalOrder.length !== savedPlans.length) return false;
//     return (
//       JSON.stringify(originalOrder.map((p) => p.id)) !==
//       JSON.stringify(savedPlans.map((p) => p.id))
//     );
//   }, [savedPlans, originalOrder]);

//   useEffect(() => {
//     Animated.spring(reorderAnim, {
//       toValue: isReorderMode ? 1 : 0,
//       useNativeDriver: true,
//     }).start();
//   }, [isReorderMode]);

//   useEffect(() => {
//     Animated.timing(revertButtonAnim, {
//       toValue: hasOrderChanged ? 1 : 0,
//       duration: 200,
//       useNativeDriver: true,
//     }).start();
//   }, [hasOrderChanged]);

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
//       const plans = querySnapshot.docs
//         .map((doc) => ({ id: doc.id, ...doc.data() } as WorkoutPlan))
//         .sort((a, b) => a.order - b.order);
//       setSavedPlans(plans);
//     } catch (error) {
//       console.error("Error fetching workout plans: ", error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [plansCollectionRef]);

//   useEffect(() => {
//     fetchWorkoutPlans();
//   }, [fetchWorkoutPlans]);

//   const handleEnterReorderMode = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//     setOriginalOrder([...savedPlans]);
//     setIsReorderMode(true);
//   };

//   const handleOpenCreateModal = () => {
//     setEditingPlan(null);
//     setIsModalVisible(true);
//   };

//   const handleOpenEditModal = (plan: WorkoutPlan) => {
//     setEditingPlan(plan);
//     setIsModalVisible(true);
//   };

//   const closeModal = () => setIsModalVisible(false);

//   const handleSavePlan = async (
//     planData: Omit<WorkoutPlan, "id" | "order"> & { order: number }
//   ) => {
//     if (!user || !plansCollectionRef) return;
//     try {
//       if (editingPlan) {
//         const planDoc = doc(plansCollectionRef, editingPlan.id);
//         await updateDoc(planDoc, planData);
//       } else {
//         const newPlanData = { ...planData, order: savedPlans.length };
//         await addDoc(plansCollectionRef, newPlanData);
//       }
//       closeModal();
//       await fetchWorkoutPlans();
//     } catch (error) {
//       console.error("Error saving plan:", error);
//     }
//   };

//   const handleDeletePlan = (planToDelete: WorkoutPlan) => {
//     Alert.alert(
//       "Delete Plan",
//       `Are you sure you want to delete "${planToDelete.planName}"?`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: async () => {
//             if (!user || !plansCollectionRef) return;
//             setSavedPlans((prev) =>
//               prev.filter((p) => p.id !== planToDelete.id)
//             );
//             try {
//               await deleteDoc(doc(plansCollectionRef, planToDelete.id));
//             } catch (error) {
//               console.error("Error deleting plan:", error);
//               fetchWorkoutPlans();
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleDoneReordering = async () => {
//     if (!plansCollectionRef) {
//       setIsReorderMode(false);
//       return;
//     }
//     const batch = writeBatch(db);
//     savedPlans.forEach((plan, index) => {
//       const docRef = doc(plansCollectionRef, plan.id);
//       batch.update(docRef, { order: index });
//     });
//     try {
//       await batch.commit();
//     } catch (error) {
//       console.error("Error updating order:", error);
//     } finally {
//       setIsReorderMode(false);
//     }
//   };

//   const handleRevertOrder = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     setSavedPlans(originalOrder);
//   };

//   const onDeleteFromModal = () => {
//     if (editingPlan) {
//       closeModal();
//       setTimeout(() => handleDeletePlan(editingPlan), 300);
//     }
//   };
//   const carouselAnimatedStyle = {
//     opacity: reorderAnim.interpolate({
//       inputRange: [0, 1],
//       outputRange: [1, 0],
//     }),
//     transform: [
//       {
//         scale: reorderAnim.interpolate({
//           inputRange: [0, 1],
//           outputRange: [1, 0.9],
//         }),
//       },
//     ],
//   };
//   const reorderViewAnimatedStyle = {
//     opacity: reorderAnim,
//     transform: [
//       {
//         scale: reorderAnim.interpolate({
//           inputRange: [0, 1],
//           outputRange: [1.1, 1],
//         }),
//       },
//     ],
//   };
//   const revertButtonAnimatedStyle = {
//     opacity: revertButtonAnim,
//     transform: [
//       {
//         scale: revertButtonAnim.interpolate({
//           inputRange: [0, 1],
//           outputRange: [0.8, 1],
//         }),
//       },
//     ],
//   };

//   if (isLoading) {
//     return <ActivityIndicator style={{ flex: 1 }} size="large" />;
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <GestureHandlerRootView style={{ flex: 1 }}>
//         <ScrollView contentContainerStyle={styles.scrollContentContainer}>
//           <Text style={styles.pageTitle}>My Workout Plans</Text>
//           <Animated.View style={carouselAnimatedStyle}>
//             {savedPlans.length > 0 ? (
//               <View style={styles.carouselWrapper}>
//                 <FlatList
//                   data={savedPlans}
//                   keyExtractor={(item) => item.id}
//                   renderItem={({ item }) => (
//                     <PlanCard
//                       item={item}
//                       onPress={() => handleOpenEditModal(item)}
//                       onLongPress={handleEnterReorderMode}
//                     />
//                   )}
//                   ItemSeparatorComponent={() => (
//                     <View style={{ width: CARD_MARGIN * 2 }} />
//                   )}
//                   horizontal
//                   showsHorizontalScrollIndicator={false}
//                   snapToInterval={SNAP_INTERVAL}
//                   decelerationRate="fast"
//                   contentContainerStyle={styles.carouselContentContainer}
//                 />
//               </View>
//             ) : (
//               <View style={styles.emptyContainer}>
//                 <Text style={styles.emptyText}>No workout plans yet.</Text>
//               </View>
//             )}
//           </Animated.View>
//           <TouchableOpacity
//             style={styles.addPlanButton}
//             onPress={handleOpenCreateModal}
//           >
//             <Text style={styles.addPlanButtonText}>+ Add Plan</Text>
//           </TouchableOpacity>

//           <View style={styles.exploreSection}>
//             <Text style={styles.exploreTitle}>Explore Exercises</Text>
//             <Text style={styles.exploreSubtitle}>
//               Browse the full library of exercises and filter by muscle,
//               equipment, difficulty, and more.
//             </Text>
//             <TouchableOpacity
//               style={styles.viewExercisesButton}
//               onPress={() => setIsExplorerModalVisible(true)}
//             >
//               <Text style={styles.viewExercisesButtonText}>
//                 Open Exercise Library
//               </Text>
//               <Feather
//                 name="arrow-right"
//                 size={18}
//                 color={styles.viewExercisesButtonText.color}
//               />
//             </TouchableOpacity>
//           </View>
//         </ScrollView>

//         <PlanModal
//           visible={isModalVisible}
//           onClose={closeModal}
//           onSave={handleSavePlan}
//           onDelete={onDeleteFromModal}
//           initialPlan={editingPlan}
//           exerciseData={exerciseData}
//           onViewExercise={handleViewExercise}
//         />

//         <ExerciseExplorerModal
//           visible={isExplorerModalVisible}
//           onClose={() => setIsExplorerModalVisible(false)}
//           exerciseData={exerciseData}
//           onViewExercise={handleViewExercise}
//         />

//         <ExerciseDetailModal
//           visible={!!viewingExercise}
//           onClose={() => setViewingExercise(null)}
//           exercise={viewingExercise}
//         />

//         {isReorderMode && (
//           <Animated.View
//             style={[
//               StyleSheet.absoluteFill,
//               reorderViewAnimatedStyle,
//               { backgroundColor: styles.container.backgroundColor },
//             ]}
//           >
//             <DraggableFlatList
//               data={savedPlans}
//               onDragEnd={({ data }) => setSavedPlans(data)}
//               keyExtractor={(item) => item.id}
//               contentContainerStyle={styles.reorderListContent}
//               onDragBegin={() =>
//                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
//               }
//               onPlaceholderIndexChange={() =>
//                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
//               }
//               ListHeaderComponent={
//                 <Text style={styles.reorderTitle}>Reorder Workout Plans</Text>
//               }
//               renderItem={({ item, drag, isActive }) => (
//                 <ScaleDecorator>
//                   <TouchableOpacity
//                     onLongPress={drag}
//                     disabled={isActive}
//                     style={[styles.miniCard, isActive && styles.miniCardActive]}
//                   >
//                     <Text style={styles.miniCardIcon}>{item.icon || "💪"}</Text>
//                     <Text style={styles.miniCardTitle} numberOfLines={1}>
//                       {item.planName}
//                     </Text>
//                     <Feather
//                       name="menu"
//                       size={24}
//                       color={styles.miniCardDragHandle.color}
//                       style={styles.miniCardDragHandle}
//                     />
//                     <TouchableOpacity
//                       style={styles.deleteMiniCardButton}
//                       onPress={() => handleDeletePlan(item)}
//                     >
//                       <Feather name="x" size={16} color="white" />
//                     </TouchableOpacity>
//                   </TouchableOpacity>
//                 </ScaleDecorator>
//               )}
//               ListFooterComponent={
//                 <View style={styles.doneButtonContainer}>
//                   <Animated.View style={[revertButtonAnimatedStyle]}>
//                     <TouchableOpacity
//                       style={styles.revertButton}
//                       onPress={handleRevertOrder}
//                       disabled={!hasOrderChanged}
//                     >
//                       <Feather
//                         name="rotate-ccw"
//                         size={16}
//                         color={styles.revertButtonText.color}
//                       />
//                       <Text style={styles.revertButtonText}>Revert</Text>
//                     </TouchableOpacity>
//                   </Animated.View>
//                   <TouchableOpacity
//                     style={styles.doneButton}
//                     onPress={handleDoneReordering}
//                   >
//                     <Text style={styles.doneButtonText}>Done</Text>
//                   </TouchableOpacity>
//                 </View>
//               }
//             />
//           </Animated.View>
//         )}
//       </GestureHandlerRootView>
//     </SafeAreaView>
//   );
// }

// // =================================================================================================
// // --- STYLES ---
// // =================================================================================================
// const getStyles = (scheme: "light" | "dark") => {
//   const colors = Colors[scheme];
//   return StyleSheet.create({
//     exploreSection: {
//       marginTop: 40,
//     },
//     exploreTitle: {
//       fontSize: 24,
//       fontWeight: "bold",
//       color: colors.text,
//       paddingHorizontal: 20,
//       marginBottom: 4,
//     },
//     exploreSubtitle: {
//       fontSize: 16,
//       fontWeight: "500",
//       color: colors.subtleText,
//       paddingHorizontal: 20,
//       marginBottom: 5,
//     },
//     categoryChipContainer: {
//       flexDirection: "row",
//       flexWrap: "wrap",
//       gap: 10,
//       paddingHorizontal: 20,
//       marginTop: 10,
//       paddingBottom: 10,
//     },
//     categoryChip: {
//       backgroundColor: colors.card,
//       paddingVertical: 8,
//       paddingHorizontal: 16,
//       borderRadius: 20,
//       borderWidth: 1,
//       borderColor: colors.border,
//     },
//     categoryChipSelected: {
//       backgroundColor: colors.primary,
//       borderColor: colors.primary,
//     },
//     categoryChipText: {
//       color: colors.text,
//       fontSize: 14,
//       fontWeight: "500",
//       textTransform: "capitalize",
//     },
//     categoryChipTextSelected: {
//       color: "white",
//     },
//     exerciseCard: {
//       backgroundColor: colors.card,
//       paddingVertical: 15,
//       paddingLeft: 20,
//       paddingRight: 15,
//       borderRadius: 12,
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//     },
//     exerciseCardTitle: {
//       fontSize: 16,
//       fontWeight: "bold",
//       color: colors.text,
//       flexShrink: 1,
//     },
//     exerciseCardSubtitle: {
//       fontSize: 14,
//       color: colors.subtleText,
//       marginTop: 4,
//       textTransform: "capitalize",
//     },
//     exerciseCardIcon: {
//       color: colors.primary,
//     },
//     listHeaderContainer: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       paddingRight: 20,
//       marginBottom: -5,
//     },
//     clearFilterText: {
//       color: colors.primary,
//       fontWeight: "600",
//       fontSize: 16,
//     },
//     viewExercisesButton: {
//       backgroundColor: colors.primary + "20",
//       padding: 15,
//       borderRadius: 12,
//       marginHorizontal: 20,
//       marginTop: 20,
//       flexDirection: "row",
//       justifyContent: "center",
//       alignItems: "center",
//       gap: 8,
//     },
//     viewExercisesButtonText: {
//       color: colors.primary,
//       fontSize: 16,
//       fontWeight: "bold",
//     },
//     emptyListContainer: {
//       marginTop: 50,
//       alignItems: "center",
//       justifyContent: "center",
//     },
//     emptyListText: {
//       fontSize: 16,
//       color: colors.subtleText,
//     },
//     modalFilterContainer: {
//       paddingBottom: 15,
//       borderBottomWidth: 1,
//       borderBottomColor: colors.border,
//       marginBottom: 15,
//     },
//     filterSectionTitle: {
//       fontSize: 14,
//       fontWeight: "bold",
//       color: colors.subtleText,
//       paddingHorizontal: 20,
//       marginTop: 10,
//       textTransform: "uppercase",
//     },
//     searchContainer: {
//       paddingHorizontal: 15,
//       paddingVertical: 15,
//     },
//     searchInput: {
//       backgroundColor: colors.card,
//       padding: 12,
//       borderRadius: 10,
//       fontSize: 16,
//       color: colors.text,
//     },
//     exerciseListItem: {
//       backgroundColor: colors.card,
//       paddingVertical: 10,
//       paddingLeft: 5,
//       paddingRight: 15,
//       borderRadius: 10,
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//     },
//     exerciseListItemSelected: {
//       backgroundColor: colors.primary + "20",
//       borderColor: colors.primary,
//       borderWidth: 1.5,
//     },
//     exerciseName: {
//       fontSize: 16,
//       fontWeight: "600",
//       color: colors.text,
//     },
//     exerciseMuscles: {
//       fontSize: 14,
//       color: colors.subtleText,
//       marginTop: 4,
//       textTransform: "capitalize",
//     },
//     infoIconTouchable: {
//       padding: 10,
//       marginRight: 5,
//     },
//     checkbox: {
//       width: 24,
//       height: 24,
//       borderRadius: 12,
//       borderWidth: 2,
//       borderColor: colors.border,
//       justifyContent: "center",
//       alignItems: "center",
//       marginLeft: 15,
//     },
//     newModalContainer: { flex: 1, backgroundColor: colors.background },
//     newModalHeader: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       paddingHorizontal: 15,
//       paddingVertical: 10,
//       borderBottomWidth: 1,
//       borderBottomColor: colors.border,
//     },
//     newHeaderButton: { padding: 5, minWidth: 60, alignItems: "flex-end" },
//     newHeaderButtonText: { fontSize: 17, color: colors.primary },
//     newModalTitle: {
//       fontSize: 17,
//       fontWeight: "bold",
//       color: colors.text,
//       flex: 1,
//       textAlign: "center",
//       marginHorizontal: 10,
//     },
//     detailScrollContainer: {
//       padding: 20,
//     },
//     detailSection: {
//       marginBottom: 24,
//     },
//     detailSectionTitle: {
//       fontSize: 20,
//       fontWeight: "bold",
//       color: colors.text,
//       marginBottom: 8,
//       textTransform: "capitalize",
//     },
//     detailText: {
//       fontSize: 16,
//       color: colors.text,
//       lineHeight: 24,
//       textTransform: "capitalize",
//     },
//     instructionStep: {
//       flexDirection: "row",
//       marginBottom: 12,
//     },
//     instructionNumber: {
//       fontSize: 16,
//       lineHeight: 24,
//       color: colors.subtleText,
//       marginRight: 8,
//       fontWeight: "bold",
//     },
//     instructionText: {
//       flex: 1,
//       fontSize: 16,
//       lineHeight: 24,
//       color: colors.text,
//     },
//     detailTagsContainer: {
//       flexDirection: "row",
//       flexWrap: "wrap",
//       gap: 10,
//       marginBottom: 24,
//     },
//     detailTag: {
//       backgroundColor: colors.card,
//       paddingVertical: 6,
//       paddingHorizontal: 12,
//       borderRadius: 8,
//       flexDirection: "row",
//       alignItems: "center",
//     },
//     detailTagLabel: {
//       fontSize: 14,
//       color: colors.subtleText,
//       marginRight: 6,
//     },
//     detailTagValue: {
//       fontSize: 14,
//       color: colors.text,
//       fontWeight: "600",
//       textTransform: "capitalize",
//     },
//     newSectionContainer: { marginVertical: 15 },
//     newSectionTitle: {
//       fontSize: 22,
//       fontWeight: "bold",
//       color: colors.text,
//       marginBottom: 12,
//       paddingHorizontal: 20,
//     },
//     newInputGroup: {
//       backgroundColor: colors.card,
//       borderRadius: 12,
//       marginHorizontal: 20,
//     },
//     newTextInput: { fontSize: 16, color: colors.text, padding: 15 },
//     newDivider: {
//       height: 1,
//       backgroundColor: colors.border,
//       marginHorizontal: 15,
//     },
//     newDaysContainer: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       marginHorizontal: 20,
//     },
//     newDayButton: {
//       flex: 1,
//       paddingVertical: 12,
//       borderRadius: 8,
//       backgroundColor: colors.card,
//       alignItems: "center",
//       marginHorizontal: 3,
//     },
//     newDayButtonSelected: { backgroundColor: colors.primary },
//     newDayButtonText: { fontSize: 14, fontWeight: "600", color: colors.text },
//     newDayButtonTextSelected: { color: "white" },
//     newWorkoutCard: {
//       backgroundColor: colors.card,
//       borderRadius: 12,
//       flexDirection: "row",
//       alignItems: "center",
//       paddingVertical: 10,
//       paddingLeft: 5,
//       paddingRight: 10,
//       marginHorizontal: 20,
//     },
//     newWorkoutCardActive: {
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: scheme === "light" ? 0.1 : 0.4,
//       shadowRadius: 5,
//       elevation: 8,
//     },
//     newDragHandle: { padding: 10, color: colors.subtleText },
//     newWorkoutInputsContainer: {
//       flex: 1,
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 10,
//     },
//     newWorkoutNameInput: {
//       flex: 1,
//       fontSize: 16,
//       fontWeight: "500",
//       color: colors.text,
//     },
//     newSetsRepsContainer: {
//       flexDirection: "column",
//       gap: 5,
//     },
//     newSetRepInputWrapper: {
//       flexDirection: "row",
//       alignItems: "center",
//       backgroundColor: colors.background,
//       borderRadius: 6,
//       paddingHorizontal: 8,
//       paddingVertical: 4,
//     },
//     newSetRepLabel: { fontSize: 14, color: colors.subtleText, marginRight: 5 },
//     newSetRepInput: {
//       fontSize: 16,
//       color: colors.text,
//       minWidth: 25,
//       textAlign: "center",
//     },
//     newDeleteWorkoutButton: { padding: 10, color: colors.subtleText },
//     listFooterContainer: { paddingHorizontal: 20 },
//     modalActionRow: {
//       flexDirection: "row",
//       gap: 10,
//       marginTop: 10,
//     },
//     newAddWorkoutButton: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "center",
//       gap: 8,
//       backgroundColor: colors.primary + "20",
//       paddingVertical: 14,
//       borderRadius: 12,
//     },
//     newAddWorkoutButtonText: {
//       color: colors.primary,
//       fontSize: 16,
//       fontWeight: "bold",
//     },
//     newDeletePlanButton: { alignItems: "center", padding: 15, marginTop: 20 },
//     newDeletePlanButtonText: {
//       color: colors.destructive,
//       fontSize: 16,
//       fontWeight: "500",
//     },
//     container: { flex: 1, backgroundColor: colors.background },
//     scrollContentContainer: { paddingBottom: 80 },
//     pageTitle: {
//       fontSize: 32,
//       fontWeight: "bold",
//       color: colors.text,
//       paddingTop: 10,
//       marginBottom: 20,
//       paddingHorizontal: 20,
//     },
//     carouselWrapper: { height: CARD_HEIGHT, marginBottom: 20 },
//     carouselContentContainer: {
//       paddingHorizontal: (screenWidth - CARD_WIDTH) / 2,
//       alignItems: "center",
//     },
//     cardWrapper: { width: CARD_WIDTH, height: CARD_HEIGHT },
//     card: {
//       flex: 1,
//       borderRadius: 24,
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.3,
//       shadowRadius: 8,
//       elevation: 10,
//       overflow: "hidden",
//     },
//     cardGradient: {
//       position: "absolute",
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       opacity: 0.3,
//       transform: [{ rotate: "-45deg" }, { scale: 2 }],
//     },
//     cardContent: {
//       flex: 1,
//       padding: 25,
//       flexDirection: "column",
//       justifyContent: "space-between",
//     },
//     cardIcon: { fontSize: 50, marginBottom: 10 },
//     cardTitle: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF" },
//     cardDescription: {
//       fontSize: 16,
//       fontWeight: "500",
//       color: "rgba(255, 255, 255, 0.9)",
//       marginTop: 8,
//       minHeight: 40,
//     },
//     cardWorkoutListContainer: {
//       marginTop: 15,
//       gap: 6,
//     },
//     cardWorkoutListItemContainer: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//     },
//     cardWorkoutListItemName: {
//       fontSize: 14,
//       color: "rgba(255, 255, 255, 0.8)",
//       fontWeight: "500",
//       flex: 1,
//       marginRight: 8,
//     },
//     cardWorkoutListItemSetsReps: {
//       fontSize: 14,
//       color: "rgba(255, 255, 255, 0.8)",
//       fontWeight: "bold",
//     },
//     cardDaysContainer: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       marginTop: 15,
//     },
//     cardDayBubble: {
//       width: 32,
//       height: 32,
//       borderRadius: 16,
//       backgroundColor: "rgba(255, 255, 255, 0.25)",
//       justifyContent: "center",
//       alignItems: "center",
//     },
//     cardDayBubbleSelected: { backgroundColor: "#FFFFFF" },
//     cardDayText: { color: "rgba(255, 255, 255, 0.7)", fontWeight: "bold" },
//     cardDayTextSelected: { color: scheme === "light" ? "#A855F7" : "#4F46E5" },
//     emptyContainer: {
//       height: CARD_HEIGHT,
//       justifyContent: "center",
//       alignItems: "center",
//       opacity: 0.7,
//       marginBottom: 20,
//     },
//     emptyText: { fontSize: 18, fontWeight: "600", color: colors.text },
//     addPlanButton: {
//       backgroundColor: colors.card,
//       padding: 15,
//       borderRadius: 12,
//       marginHorizontal: 20,
//       alignItems: "center",
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 1 },
//       shadowOpacity: scheme === "light" ? 0.05 : 0.2,
//       shadowRadius: 4,
//       elevation: 2,
//     },
//     addPlanButtonText: {
//       color: colors.primary,
//       fontSize: 16,
//       fontWeight: "600",
//     },
//     reorderTitle: {
//       fontSize: 24,
//       fontWeight: "bold",
//       color: colors.text,
//       textAlign: "center",
//       marginBottom: 20,
//     },
//     reorderListContent: {
//       paddingTop: 60,
//       paddingHorizontal: 20,
//       paddingBottom: 80,
//     },
//     miniCard: {
//       backgroundColor: colors.card,
//       padding: 15,
//       borderRadius: 12,
//       flexDirection: "row",
//       alignItems: "center",
//       marginBottom: 15,
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: scheme === "light" ? 0.1 : 0.4,
//       shadowRadius: 4,
//       elevation: 5,
//     },
//     miniCardActive: {
//       shadowOpacity: scheme === "light" ? 0.2 : 0.7,
//       elevation: 10,
//     },
//     miniCardIcon: { fontSize: 24, marginRight: 15 },
//     miniCardTitle: {
//       fontSize: 18,
//       fontWeight: "600",
//       color: colors.text,
//       flex: 1,
//     },
//     miniCardDragHandle: { color: colors.subtleText, marginLeft: 15 },
//     deleteMiniCardButton: {
//       position: "absolute",
//       top: -8,
//       right: -8,
//       backgroundColor: colors.destructive,
//       width: 24,
//       height: 24,
//       borderRadius: 12,
//       justifyContent: "center",
//       alignItems: "center",
//       elevation: 6,
//     },
//     doneButtonContainer: { marginTop: 20, alignItems: "center" },
//     doneButton: {
//       backgroundColor: colors.primary,
//       paddingVertical: 14,
//       paddingHorizontal: 50,
//       borderRadius: 28,
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.3,
//       shadowRadius: 4,
//       elevation: 8,
//     },
//     doneButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
//     revertButton: {
//       paddingVertical: 14,
//       paddingHorizontal: 20,
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 8,
//       marginBottom: 10,
//     },
//     revertButtonText: {
//       color: colors.subtleText,
//       fontSize: 16,
//       fontWeight: "600",
//     },
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
  writeBatch,
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
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
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
import { FlatList, GestureHandlerRootView } from "react-native-gesture-handler";

// Replace with your actual file paths
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";

// --- DATA IMPORT ---
import exercises from "../../exercises.json";

// --- TYPE DEFINITIONS ---
interface Workout {
  id: number;
  name: string;
  sets: string;
  reps: string;
}

interface WorkoutPlan {
  id: string;
  planName: string;
  description?: string;
  selectedDays: string[];
  workouts: Omit<Workout, "id">[];
  order: number;
  icon?: string;
}

interface Exercise {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
}

interface Filters {
  muscle: string | null;
  category: string | null;
  level: string | null;
  equipment: string | null;
  force: string | null;
}

interface ExerciseData {
  muscleGroups: string[];
  categories: string[];
  levels: string[];
  equipment: string[];
  forces: string[];
}

// --- CONSTANTS ---
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.75;
const CARD_HEIGHT = CARD_WIDTH * 1.25;
const CARD_MARGIN = (screenWidth - CARD_WIDTH) / 8;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

// =================================================================================================
// --- REUSABLE FILTER COMPONENTS ---
// =================================================================================================

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isSelected,
  onPress,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
    >
      <Text
        style={[
          styles.categoryChipText,
          isSelected && styles.categoryChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface ExerciseFilterProps {
  filterOptions: ExerciseData;
  selectedFilters: Filters;
  onUpdateFilters: (newFilters: Filters) => void;
}

const ExerciseFilter: React.FC<ExerciseFilterProps> = ({
  filterOptions,
  selectedFilters,
  onUpdateFilters,
}) => {
  const styles = getStyles(useColorScheme() ?? "light");

  const handleFilterSelect = (type: keyof Filters, value: string | null) => {
    onUpdateFilters({
      ...selectedFilters,
      [type]: selectedFilters[type] === value ? null : value,
    });
  };

  const hasActiveFilter = Object.values(selectedFilters).some(
    (v) => v !== null
  );

  return (
    <View style={styles.modalFilterContainer}>
      <View style={styles.listHeaderContainer}>
        <Text style={styles.exploreSubtitle}>Filters</Text>
        {hasActiveFilter && (
          <TouchableOpacity
            onPress={() =>
              onUpdateFilters({
                muscle: null,
                category: null,
                level: null,
                equipment: null,
                force: null,
              })
            }
          >
            <Text style={styles.clearFilterText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.filterSectionTitle}>Muscle Group</Text>
      <FlatList
        data={filterOptions.muscleGroups}
        renderItem={({ item }) => (
          <FilterChip
            label={item}
            isSelected={selectedFilters.muscle === item}
            onPress={() => handleFilterSelect("muscle", item)}
          />
        )}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
        ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
      />

      <Text style={styles.filterSectionTitle}>Equipment</Text>
      <View style={styles.categoryChipContainer}>
        {filterOptions.equipment.map((item) => (
          <FilterChip
            key={item}
            label={item}
            isSelected={selectedFilters.equipment === item}
            onPress={() => handleFilterSelect("equipment", item)}
          />
        ))}
      </View>

      <Text style={styles.filterSectionTitle}>Difficulty Level</Text>
      <View style={styles.categoryChipContainer}>
        {filterOptions.levels.map((item) => (
          <FilterChip
            key={item}
            label={item}
            isSelected={selectedFilters.level === item}
            onPress={() => handleFilterSelect("level", item)}
          />
        ))}
      </View>

      <Text style={styles.filterSectionTitle}>Category</Text>
      <View style={styles.categoryChipContainer}>
        {filterOptions.categories.map((item) => (
          <FilterChip
            key={item}
            label={item}
            isSelected={selectedFilters.category === item}
            onPress={() => handleFilterSelect("category", item)}
          />
        ))}
      </View>

      <Text style={styles.filterSectionTitle}>Force Type</Text>
      <View style={styles.categoryChipContainer}>
        {filterOptions.forces.map((item) => (
          <FilterChip
            key={item}
            label={item}
            isSelected={selectedFilters.force === item}
            onPress={() => handleFilterSelect("force", item)}
          />
        ))}
      </View>
    </View>
  );
};

// =================================================================================================
// --- MODAL COMPONENTS ---
// =================================================================================================
interface ExerciseDetailModalProps {
  visible: boolean;
  onClose: () => void;
  exercise: Exercise | null;
}

const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  visible,
  onClose,
  exercise,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  if (!exercise) return null;

  const detailItems = [
    { label: "Level", value: exercise.level },
    { label: "Equipment", value: exercise.equipment },
    { label: "Category", value: exercise.category },
    { label: "Force", value: exercise.force },
    { label: "Mechanic", value: exercise.mechanic },
  ].filter((item) => item.value);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.newModalContainer}>
        <View style={styles.newModalHeader}>
          <View style={{ width: 60 }} />
          <Text style={styles.newModalTitle} numberOfLines={2}>
            {exercise.name}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.newHeaderButton}>
            <Text style={[styles.newHeaderButtonText, { fontWeight: "bold" }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.detailScrollContainer}>
          <View style={styles.detailTagsContainer}>
            {detailItems.map((item, index) => (
              <View key={index} style={styles.detailTag}>
                <Text style={styles.detailTagLabel}>{item.label}:</Text>
                <Text style={styles.detailTagValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Primary Muscles</Text>
            <Text style={styles.detailText}>
              {exercise.primaryMuscles.join(", ")}
            </Text>
          </View>

          {exercise.secondaryMuscles.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Secondary Muscles</Text>
              <Text style={styles.detailText}>
                {exercise.secondaryMuscles.join(", ")}
              </Text>
            </View>
          )}

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Instructions</Text>
            {exercise.instructions.map((step, index) => (
              <View key={index} style={styles.instructionStep}>
                <Text style={styles.instructionNumber}>{index + 1}.</Text>
                <Text style={styles.instructionText}>{step}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

interface ExerciseExplorerModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseData: ExerciseData;
}

const ExerciseExplorerModal: React.FC<ExerciseExplorerModalProps> = ({
  visible,
  onClose,
  exerciseData,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  const [filters, setFilters] = useState<Filters>({
    muscle: null,
    category: null,
    level: null,
    equipment: null,
    force: null,
  });

  const filteredExercises = useMemo(() => {
    let list = exercises as Exercise[];
    const query = searchQuery.toLowerCase();

    if (filters.muscle) {
      const muscle = filters.muscle.toLowerCase();
      list = list.filter((ex) =>
        ex.primaryMuscles.some((m) => m.toLowerCase() === muscle)
      );
    }
    if (filters.category) {
      const category = filters.category.toLowerCase();
      list = list.filter((ex) => ex.category.toLowerCase() === category);
    }
    if (filters.level) {
      const level = filters.level.toLowerCase();
      list = list.filter((ex) => ex.level.toLowerCase() === level);
    }
    if (filters.equipment) {
      const equipment = filters.equipment.toLowerCase();
      list = list.filter(
        (ex) => ex.equipment && ex.equipment.toLowerCase() === equipment
      );
    }
    if (filters.force) {
      const force = filters.force.toLowerCase();
      list = list.filter((ex) => ex.force && ex.force.toLowerCase() === force);
    }
    if (query) {
      list = list.filter((ex) => ex.name.toLowerCase().includes(query));
    }
    return list;
  }, [searchQuery, filters]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.newModalContainer}>
        {/* Detail Modal is now rendered inside */}
        <ExerciseDetailModal
          visible={!!viewingExercise}
          onClose={() => setViewingExercise(null)}
          exercise={viewingExercise}
        />

        <View style={styles.newModalHeader}>
          <View style={{ width: 60 }} />
          <Text style={styles.newModalTitle}>Explore Exercises</Text>
          <TouchableOpacity onPress={onClose} style={styles.newHeaderButton}>
            <Text style={[styles.newHeaderButtonText, { fontWeight: "bold" }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 20 }}>
              <ExerciseCard
                exercise={item}
                onPress={() => setViewingExercise(item)}
              />
            </View>
          )}
          ListHeaderComponent={
            <>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  placeholderTextColor={Colors[colorScheme].subtleText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <ExerciseFilter
                filterOptions={exerciseData}
                selectedFilters={filters}
                onUpdateFilters={setFilters}
              />
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>No exercises found.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (selectedExercises: Exercise[]) => void;
  exerciseData: ExerciseData;
}

const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  exerciseData,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  const [filters, setFilters] = useState<Filters>({
    muscle: null,
    category: null,
    level: null,
    equipment: null,
    force: null,
  });

  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      setSelected([]);
      setFilters({
        muscle: null,
        category: null,
        level: null,
        equipment: null,
        force: null,
      });
    }
  }, [visible]);

  const filteredExercises = useMemo(() => {
    let list = exercises as Exercise[];
    const query = searchQuery.toLowerCase();

    if (filters.muscle) {
      const muscle = filters.muscle.toLowerCase();
      list = list.filter((ex) =>
        ex.primaryMuscles.some((m) => m.toLowerCase() === muscle)
      );
    }
    if (filters.category) {
      const category = filters.category.toLowerCase();
      list = list.filter((ex) => ex.category.toLowerCase() === category);
    }
    if (filters.level) {
      const level = filters.level.toLowerCase();
      list = list.filter((ex) => ex.level.toLowerCase() === level);
    }
    if (filters.equipment) {
      const equipment = filters.equipment.toLowerCase();
      list = list.filter(
        (ex) => ex.equipment && ex.equipment.toLowerCase() === equipment
      );
    }
    if (filters.force) {
      const force = filters.force.toLowerCase();
      list = list.filter((ex) => ex.force && ex.force.toLowerCase() === force);
    }
    if (query) {
      list = list.filter((ex) => ex.name.toLowerCase().includes(query));
    }
    return list;
  }, [searchQuery, filters]);

  const toggleSelection = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((current) =>
      current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId]
    );
  };

  const handleDone = () => {
    const selectedExercises = (exercises as Exercise[]).filter((ex) =>
      selected.includes(ex.id)
    );
    onSelect(selectedExercises);
    onClose();
  };

  const renderItem = ({ item }: { item: Exercise }) => {
    const isSelected = selected.includes(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.exerciseListItem,
          isSelected && styles.exerciseListItemSelected,
        ]}
        onPress={() => toggleSelection(item.id)}
      >
        <TouchableOpacity
          onPress={() => setViewingExercise(item)}
          style={styles.infoIconTouchable}
        >
          <Feather
            name="info"
            size={22}
            color={styles.newHeaderButtonText.color}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseMuscles}>
            {item.primaryMuscles.join(", ")}
          </Text>
        </View>
        <View
          style={[
            styles.checkbox,
            isSelected && {
              backgroundColor: styles.newHeaderButtonText.color,
              borderColor: styles.newHeaderButtonText.color,
            },
          ]}
        >
          {isSelected && <Feather name="check" size={16} color="white" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.newModalContainer}>
        <ExerciseDetailModal
          visible={!!viewingExercise}
          onClose={() => setViewingExercise(null)}
          exercise={viewingExercise}
        />

        <View style={styles.newModalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.newHeaderButton}>
            <Text style={styles.newHeaderButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.newModalTitle}>Select Exercises</Text>
          <TouchableOpacity onPress={handleDone} style={styles.newHeaderButton}>
            <Text style={[styles.newHeaderButtonText, { fontWeight: "bold" }]}>
              Done ({selected.length})
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredExercises}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={
            <>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  placeholderTextColor={Colors[colorScheme].subtleText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <ExerciseFilter
                filterOptions={exerciseData}
                selectedFilters={filters}
                onUpdateFilters={setFilters}
              />
            </>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

interface NewWorkoutRowProps extends RenderItemParams<Workout> {
  onUpdate: (
    index: number,
    field: keyof Omit<Workout, "id">,
    value: string
  ) => void;
  onDelete: (id: number) => void;
}

const NewWorkoutRow: React.FC<NewWorkoutRowProps> = ({
  item,
  drag,
  isActive,
  getIndex,
  onUpdate,
  onDelete,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const index = getIndex();

  if (index === undefined) return null;

  return (
    <ScaleDecorator>
      <View
        style={[styles.newWorkoutCard, isActive && styles.newWorkoutCardActive]}
      >
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={styles.newDragHandle}
        >
          <Feather name="menu" size={24} color={styles.newDragHandle.color} />
        </TouchableOpacity>

        <View style={styles.newWorkoutInputsContainer}>
          <TextInput
            style={styles.newWorkoutNameInput}
            placeholder="Workout Name"
            placeholderTextColor={Colors[colorScheme].subtleText}
            value={item.name}
            onChangeText={(text) => onUpdate(index, "name", text)}
          />
          <View style={styles.newSetsRepsContainer}>
            <View style={styles.newSetRepInputWrapper}>
              <Text style={styles.newSetRepLabel}>Sets</Text>
              <TextInput
                style={styles.newSetRepInput}
                placeholder="3"
                placeholderTextColor={Colors[colorScheme].subtleText}
                keyboardType="number-pad"
                value={item.sets}
                onChangeText={(text) => onUpdate(index, "sets", text)}
              />
            </View>
            <View style={styles.newSetRepInputWrapper}>
              <Text style={styles.newSetRepLabel}>Reps</Text>
              <TextInput
                style={styles.newSetRepInput}
                placeholder="10"
                placeholderTextColor={Colors[colorScheme].subtleText}
                keyboardType="number-pad"
                value={item.reps}
                onChangeText={(text) => onUpdate(index, "reps", text)}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          style={styles.newDeleteWorkoutButton}
        >
          <Feather
            name="x"
            size={20}
            color={styles.newDeleteWorkoutButton.color}
          />
        </TouchableOpacity>
      </View>
    </ScaleDecorator>
  );
};

interface PlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (plan: Omit<WorkoutPlan, "id" | "order"> & { order: number }) => void;
  onDelete?: () => void;
  initialPlan?: WorkoutPlan | null;
  exerciseData: ExerciseData;
}

const PlanModal: React.FC<PlanModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  initialPlan = null,
  exerciseData,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const isEditing = !!initialPlan;

  const [planName, setPlanName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setPlanName(initialPlan?.planName || "");
      setDescription(initialPlan?.description || "");
      setSelectedDays(initialPlan?.selectedDays || []);
      const initialWorkouts =
        initialPlan?.workouts.map((w, i) => ({ ...w, id: i })) || [];
      setWorkouts(initialWorkouts);
    }
  }, [visible, initialPlan]);

  const toggleDay = (day: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleUpdateWorkout = (
    index: number,
    field: keyof Omit<Workout, "id">,
    value: string
  ) => {
    const newWorkouts = [...workouts];
    newWorkouts[index][field] = value;
    setWorkouts(newWorkouts);
  };

  const handleAddWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newWorkout: Workout = {
      id: Date.now(),
      name: "",
      sets: "",
      reps: "",
    };
    setWorkouts((prev) => [...prev, newWorkout]);
  };

  const handleDeleteWorkout = (idToDelete: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWorkouts((prev) => prev.filter((w) => w.id !== idToDelete));
  };

  const handleSelectExercises = (selectedExercises: Exercise[]) => {
    const newWorkouts: Workout[] = selectedExercises.map((ex) => ({
      id: Date.now() + Math.random(),
      name: ex.name,
      sets: "",
      reps: "",
    }));
    setWorkouts((prev) => [...prev, ...newWorkouts]);
  };

  const handleSave = () => {
    if (!planName) {
      Alert.alert("Missing Name", "Please give your workout plan a name.");
      return;
    }

    const workoutsToSave = workouts.map(({ id, ...rest }) => rest);

    const planData = {
      planName,
      description: description.trim(),
      selectedDays,
      workouts: workoutsToSave,
      order: initialPlan?.order ?? 0,
      icon: initialPlan?.icon || "💪",
    };
    onSave(planData);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ExercisePickerModal
        visible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        onSelect={handleSelectExercises}
        exerciseData={exerciseData}
      />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.newModalContainer}>
          <View style={styles.newModalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.newHeaderButton}>
              <Text style={styles.newHeaderButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.newModalTitle}>
              {isEditing ? "Edit Plan" : "New Plan"}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.newHeaderButton}
            >
              <Text
                style={[styles.newHeaderButtonText, { fontWeight: "bold" }]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <DraggableFlatList
            data={workouts}
            onDragEnd={({ data }) => setWorkouts(data)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={(props) => (
              <NewWorkoutRow
                {...props}
                onUpdate={handleUpdateWorkout}
                onDelete={handleDeleteWorkout}
              />
            )}
            onDragBegin={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            }
            onPlaceholderIndexChange={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            ListHeaderComponent={
              <View>
                <View style={styles.newSectionContainer}>
                  <Text style={styles.newSectionTitle}>Details</Text>
                  <View style={styles.newInputGroup}>
                    <TextInput
                      style={styles.newTextInput}
                      placeholder="Plan Name (e.g., Upper Body)"
                      placeholderTextColor={Colors[colorScheme].subtleText}
                      value={planName}
                      onChangeText={setPlanName}
                    />
                    <View style={styles.newDivider} />
                    <TextInput
                      style={[
                        styles.newTextInput,
                        { minHeight: 60, textAlignVertical: "top" },
                      ]}
                      placeholder="Description (optional)"
                      placeholderTextColor={Colors[colorScheme].subtleText}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                    />
                  </View>
                </View>

                <View style={styles.newSectionContainer}>
                  <Text style={styles.newSectionTitle}>Schedule</Text>
                  <View style={styles.newDaysContainer}>
                    {DAYS_OF_WEEK.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.newDayButton,
                          selectedDays.includes(day) &&
                            styles.newDayButtonSelected,
                        ]}
                        onPress={() => toggleDay(day)}
                      >
                        <Text
                          style={[
                            styles.newDayButtonText,
                            selectedDays.includes(day) &&
                              styles.newDayButtonTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.newSectionContainer}>
                  <Text style={styles.newSectionTitle}>Exercises</Text>
                </View>
              </View>
            }
            ListFooterComponent={
              <View style={styles.listFooterContainer}>
                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.newAddWorkoutButton, { flex: 1 }]}
                    onPress={handleAddWorkout}
                  >
                    <Feather
                      name="plus"
                      size={20}
                      color={styles.newAddWorkoutButtonText.color}
                    />
                    <Text style={styles.newAddWorkoutButtonText}>Blank</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.newAddWorkoutButton,
                      {
                        flex: 1,
                        backgroundColor: Colors[colorScheme].primary + "E6",
                      },
                    ]}
                    onPress={() => setIsPickerVisible(true)}
                  >
                    <Feather name="list" size={20} color={"white"} />
                    <Text
                      style={[
                        styles.newAddWorkoutButtonText,
                        { color: "white" },
                      ]}
                    >
                      Library
                    </Text>
                  </TouchableOpacity>
                </View>

                {isEditing && (
                  <TouchableOpacity
                    style={styles.newDeletePlanButton}
                    onPress={onDelete}
                  >
                    <Text style={styles.newDeletePlanButtonText}>
                      Delete Workout Plan
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            contentContainerStyle={{ paddingBottom: 40 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            containerStyle={{ flex: 1 }}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

// =================================================================================================
// --- MAIN SCREEN COMPONENTS ---
// =================================================================================================

interface PlanCardProps {
  item: WorkoutPlan;
  onPress: () => void;
  onLongPress: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ item, onPress, onLongPress }) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const cardColors =
    colorScheme === "light" ? ["#A855F7", "#EC4899"] : ["#4F46E5", "#2DD4BF"];

  const descriptionText =
    item.description || `${item.workouts.length} workouts`;
  const truncatedDescription =
    descriptionText.length > 75
      ? `${descriptionText.substring(0, 75)}...`
      : descriptionText;

  const firstThreeWorkouts = item.workouts.slice(0, 3);

  return (
    <TouchableOpacity
      style={styles.cardWrapper}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={[styles.card, { backgroundColor: cardColors[0] }]}>
        <View
          style={[styles.cardGradient, { backgroundColor: cardColors[1] }]}
        />
        <View style={styles.cardContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardIcon}>{item.icon || "💪"}</Text>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.planName}
            </Text>
            <Text style={styles.cardDescription}>{truncatedDescription}</Text>

            {firstThreeWorkouts.length > 0 && (
              <View style={styles.cardWorkoutListContainer}>
                {firstThreeWorkouts.map((workout, index) => (
                  <View key={index} style={styles.cardWorkoutListItemContainer}>
                    <Text
                      style={styles.cardWorkoutListItemName}
                      numberOfLines={1}
                    >
                      {workout.name}
                    </Text>
                    {workout.sets && workout.reps && (
                      <Text style={styles.cardWorkoutListItemSetsReps}>
                        {workout.sets}x{workout.reps}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.cardDaysContainer}>
            {DAYS_OF_WEEK.map((day) => (
              <View
                key={day}
                style={[
                  styles.cardDayBubble,
                  item.selectedDays.includes(day) &&
                    styles.cardDayBubbleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.cardDayText,
                    item.selectedDays.includes(day) &&
                      styles.cardDayTextSelected,
                  ]}
                >
                  {day.charAt(0)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onPress }) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  return (
    <View style={styles.exerciseCard}>
      <View style={{ flex: 1, marginRight: 10 }}>
        <Text style={styles.exerciseCardTitle}>{exercise.name}</Text>
        <Text style={styles.exerciseCardSubtitle}>
          {exercise.primaryMuscles.join(", ")}
        </Text>
      </View>
      <TouchableOpacity onPress={onPress}>
        <Feather
          name="info"
          size={24}
          color={styles.newHeaderButtonText.color}
        />
      </TouchableOpacity>
    </View>
  );
};

export default function WorkoutPlanScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);

  const [isLoading, setIsLoading] = useState(true);
  const [savedPlans, setSavedPlans] = useState<WorkoutPlan[]>([]);
  const [originalOrder, setOriginalOrder] = useState<WorkoutPlan[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isExplorerModalVisible, setIsExplorerModalVisible] = useState(false);

  const exerciseData = useMemo((): ExerciseData => {
    const muscleSet = new Set<string>();
    const categorySet = new Set<string>();
    const levelSet = new Set<string>();
    const equipmentSet = new Set<string>();
    const forceSet = new Set<string>();

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    (exercises as Exercise[]).forEach((exercise) => {
      if (Array.isArray(exercise.primaryMuscles)) {
        exercise.primaryMuscles.forEach((muscle) =>
          muscleSet.add(capitalize(muscle))
        );
      }
      if (exercise.category) {
        categorySet.add(capitalize(exercise.category));
      }
      if (exercise.level) {
        levelSet.add(capitalize(exercise.level));
      }
      if (exercise.equipment) {
        equipmentSet.add(capitalize(exercise.equipment));
      }
      if (exercise.force) {
        forceSet.add(capitalize(exercise.force));
      }
    });
    return {
      muscleGroups: Array.from(muscleSet).sort(),
      categories: Array.from(categorySet).sort(),
      levels: Array.from(levelSet).sort(),
      equipment: Array.from(equipmentSet).sort(),
      forces: Array.from(forceSet).sort(),
    };
  }, []);

  const reorderAnim = useRef(new Animated.Value(0)).current;
  const revertButtonAnim = useRef(new Animated.Value(0)).current;

  const hasOrderChanged = useMemo(() => {
    if (originalOrder.length !== savedPlans.length) return false;
    return (
      JSON.stringify(originalOrder.map((p) => p.id)) !==
      JSON.stringify(savedPlans.map((p) => p.id))
    );
  }, [savedPlans, originalOrder]);

  useEffect(() => {
    Animated.spring(reorderAnim, {
      toValue: isReorderMode ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [isReorderMode]);

  useEffect(() => {
    Animated.timing(revertButtonAnim, {
      toValue: hasOrderChanged ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [hasOrderChanged]);

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
      const plans = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as WorkoutPlan))
        .sort((a, b) => a.order - b.order);
      setSavedPlans(plans);
    } catch (error) {
      console.error("Error fetching workout plans: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [plansCollectionRef]);

  useEffect(() => {
    fetchWorkoutPlans();
  }, [fetchWorkoutPlans]);

  const handleEnterReorderMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOriginalOrder([...savedPlans]);
    setIsReorderMode(true);
  };

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (plan: WorkoutPlan) => {
    setEditingPlan(plan);
    setIsModalVisible(true);
  };

  const closeModal = () => setIsModalVisible(false);

  const handleSavePlan = async (
    planData: Omit<WorkoutPlan, "id" | "order"> & { order: number }
  ) => {
    if (!user || !plansCollectionRef) return;
    try {
      if (editingPlan) {
        const planDoc = doc(plansCollectionRef, editingPlan.id);
        await updateDoc(planDoc, planData);
      } else {
        const newPlanData = { ...planData, order: savedPlans.length };
        await addDoc(plansCollectionRef, newPlanData);
      }
      closeModal();
      await fetchWorkoutPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  const handleDeletePlan = (planToDelete: WorkoutPlan) => {
    Alert.alert(
      "Delete Plan",
      `Are you sure you want to delete "${planToDelete.planName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user || !plansCollectionRef) return;
            setSavedPlans((prev) =>
              prev.filter((p) => p.id !== planToDelete.id)
            );
            try {
              await deleteDoc(doc(plansCollectionRef, planToDelete.id));
            } catch (error) {
              console.error("Error deleting plan:", error);
              fetchWorkoutPlans();
            }
          },
        },
      ]
    );
  };

  const handleDoneReordering = async () => {
    if (!plansCollectionRef) {
      setIsReorderMode(false);
      return;
    }
    const batch = writeBatch(db);
    savedPlans.forEach((plan, index) => {
      const docRef = doc(plansCollectionRef, plan.id);
      batch.update(docRef, { order: index });
    });
    try {
      await batch.commit();
    } catch (error) {
      console.error("Error updating order:", error);
    } finally {
      setIsReorderMode(false);
    }
  };

  const handleRevertOrder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedPlans(originalOrder);
  };

  const onDeleteFromModal = () => {
    if (editingPlan) {
      closeModal();
      setTimeout(() => handleDeletePlan(editingPlan), 300);
    }
  };
  const carouselAnimatedStyle = {
    opacity: reorderAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    transform: [
      {
        scale: reorderAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.9],
        }),
      },
    ],
  };
  const reorderViewAnimatedStyle = {
    opacity: reorderAnim,
    transform: [
      {
        scale: reorderAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1.1, 1],
        }),
      },
    ],
  };
  const revertButtonAnimatedStyle = {
    opacity: revertButtonAnim,
    transform: [
      {
        scale: revertButtonAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  };

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>
          <Text style={styles.pageTitle}>My Workout Plans</Text>
          <Animated.View style={carouselAnimatedStyle}>
            {savedPlans.length > 0 ? (
              <View style={styles.carouselWrapper}>
                <FlatList
                  data={savedPlans}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <PlanCard
                      item={item}
                      onPress={() => handleOpenEditModal(item)}
                      onLongPress={handleEnterReorderMode}
                    />
                  )}
                  ItemSeparatorComponent={() => (
                    <View style={{ width: CARD_MARGIN * 2 }} />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={SNAP_INTERVAL}
                  decelerationRate="fast"
                  contentContainerStyle={styles.carouselContentContainer}
                />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No workout plans yet.</Text>
              </View>
            )}
          </Animated.View>
          <TouchableOpacity
            style={styles.addPlanButton}
            onPress={handleOpenCreateModal}
          >
            <Text style={styles.addPlanButtonText}>+ Add Plan</Text>
          </TouchableOpacity>

          <View style={styles.exploreSection}>
            <Text style={styles.exploreTitle}>Explore Exercises</Text>
            <Text style={styles.exploreSubtitle}>
              Browse the full library of exercises and filter by muscle,
              equipment, difficulty, and more.
            </Text>
            <TouchableOpacity
              style={styles.viewExercisesButton}
              onPress={() => setIsExplorerModalVisible(true)}
            >
              <Text style={styles.viewExercisesButtonText}>
                Open Exercise Library
              </Text>
              <Feather
                name="arrow-right"
                size={18}
                color={styles.viewExercisesButtonText.color}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <PlanModal
          visible={isModalVisible}
          onClose={closeModal}
          onSave={handleSavePlan}
          onDelete={onDeleteFromModal}
          initialPlan={editingPlan}
          exerciseData={exerciseData}
        />

        <ExerciseExplorerModal
          visible={isExplorerModalVisible}
          onClose={() => setIsExplorerModalVisible(false)}
          exerciseData={exerciseData}
        />

        {isReorderMode && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              reorderViewAnimatedStyle,
              { backgroundColor: styles.container.backgroundColor },
            ]}
          >
            <DraggableFlatList
              data={savedPlans}
              onDragEnd={({ data }) => setSavedPlans(data)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.reorderListContent}
              onDragBegin={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
              onPlaceholderIndexChange={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
              ListHeaderComponent={
                <Text style={styles.reorderTitle}>Reorder Workout Plans</Text>
              }
              renderItem={({ item, drag, isActive }) => (
                <ScaleDecorator>
                  <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    style={[styles.miniCard, isActive && styles.miniCardActive]}
                  >
                    <Text style={styles.miniCardIcon}>{item.icon || "💪"}</Text>
                    <Text style={styles.miniCardTitle} numberOfLines={1}>
                      {item.planName}
                    </Text>
                    <Feather
                      name="menu"
                      size={24}
                      color={styles.miniCardDragHandle.color}
                      style={styles.miniCardDragHandle}
                    />
                    <TouchableOpacity
                      style={styles.deleteMiniCardButton}
                      onPress={() => handleDeletePlan(item)}
                    >
                      <Feather name="x" size={16} color="white" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </ScaleDecorator>
              )}
              ListFooterComponent={
                <View style={styles.doneButtonContainer}>
                  <Animated.View style={[revertButtonAnimatedStyle]}>
                    <TouchableOpacity
                      style={styles.revertButton}
                      onPress={handleRevertOrder}
                      disabled={!hasOrderChanged}
                    >
                      <Feather
                        name="rotate-ccw"
                        size={16}
                        color={styles.revertButtonText.color}
                      />
                      <Text style={styles.revertButtonText}>Revert</Text>
                    </TouchableOpacity>
                  </Animated.View>
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={handleDoneReordering}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </Animated.View>
        )}
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

// =================================================================================================
// --- STYLES ---
// =================================================================================================
const getStyles = (scheme: "light" | "dark") => {
  const colors = Colors[scheme];
  return StyleSheet.create({
    exploreSection: {
      marginTop: 40,
    },
    exploreTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      paddingHorizontal: 20,
      marginBottom: 4,
    },
    exploreSubtitle: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.subtleText,
      paddingHorizontal: 20,
      marginBottom: 5,
    },
    categoryChipContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      paddingHorizontal: 20,
      marginTop: 10,
      paddingBottom: 10,
    },
    categoryChip: {
      backgroundColor: colors.card,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "500",
      textTransform: "capitalize",
    },
    categoryChipTextSelected: {
      color: "white",
    },
    exerciseCard: {
      backgroundColor: colors.card,
      paddingVertical: 15,
      paddingLeft: 20,
      paddingRight: 15,
      borderRadius: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    exerciseCardTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      flexShrink: 1,
    },
    exerciseCardSubtitle: {
      fontSize: 14,
      color: colors.subtleText,
      marginTop: 4,
      textTransform: "capitalize",
    },
    listHeaderContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingRight: 20,
      marginBottom: -5,
    },
    clearFilterText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 16,
    },
    viewExercisesButton: {
      backgroundColor: colors.primary + "20",
      padding: 15,
      borderRadius: 12,
      marginHorizontal: 20,
      marginTop: 20,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    viewExercisesButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "bold",
    },
    emptyListContainer: {
      marginTop: 50,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyListText: {
      fontSize: 16,
      color: colors.subtleText,
    },
    modalFilterContainer: {
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 15,
    },
    filterSectionTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.subtleText,
      paddingHorizontal: 20,
      marginTop: 10,
      textTransform: "uppercase",
    },
    searchContainer: {
      paddingHorizontal: 15,
      paddingVertical: 15,
    },
    searchInput: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 10,
      fontSize: 16,
      color: colors.text,
    },
    exerciseListItem: {
      backgroundColor: colors.card,
      paddingVertical: 10,
      paddingLeft: 5,
      paddingRight: 15,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    exerciseListItemSelected: {
      backgroundColor: colors.primary + "20",
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    exerciseMuscles: {
      fontSize: 14,
      color: colors.subtleText,
      marginTop: 4,
      textTransform: "capitalize",
    },
    infoIconTouchable: {
      padding: 10,
      marginRight: 5,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 15,
    },
    newModalContainer: { flex: 1, backgroundColor: colors.background },
    newModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    newHeaderButton: { padding: 5, minWidth: 60, alignItems: "flex-end" },
    newHeaderButtonText: { fontSize: 17, color: colors.primary },
    newModalTitle: {
      fontSize: 17,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 10,
    },
    detailScrollContainer: {
      padding: 20,
    },
    detailSection: {
      marginBottom: 24,
    },
    detailSectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
      textTransform: "capitalize",
    },
    detailText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      textTransform: "capitalize",
    },
    instructionStep: {
      flexDirection: "row",
      marginBottom: 12,
    },
    instructionNumber: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.subtleText,
      marginRight: 8,
      fontWeight: "bold",
    },
    instructionText: {
      flex: 1,
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
    },
    detailTagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 24,
    },
    detailTag: {
      backgroundColor: colors.card,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    detailTagLabel: {
      fontSize: 14,
      color: colors.subtleText,
      marginRight: 6,
    },
    detailTagValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    newSectionContainer: { marginVertical: 15 },
    newSectionTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    newInputGroup: {
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: 20,
    },
    newTextInput: { fontSize: 16, color: colors.text, padding: 15 },
    newDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 15,
    },
    newDaysContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginHorizontal: 20,
    },
    newDayButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.card,
      alignItems: "center",
      marginHorizontal: 3,
    },
    newDayButtonSelected: { backgroundColor: colors.primary },
    newDayButtonText: { fontSize: 14, fontWeight: "600", color: colors.text },
    newDayButtonTextSelected: { color: "white" },
    newWorkoutCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingLeft: 5,
      paddingRight: 10,
      marginHorizontal: 20,
    },
    newWorkoutCardActive: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: scheme === "light" ? 0.1 : 0.4,
      shadowRadius: 5,
      elevation: 8,
    },
    newDragHandle: { padding: 10, color: colors.subtleText },
    newWorkoutInputsContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    newWorkoutNameInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    newSetsRepsContainer: {
      flexDirection: "column",
      gap: 5,
    },
    newSetRepInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    newSetRepLabel: { fontSize: 14, color: colors.subtleText, marginRight: 5 },
    newSetRepInput: {
      fontSize: 16,
      color: colors.text,
      minWidth: 25,
      textAlign: "center",
    },
    newDeleteWorkoutButton: { padding: 10, color: colors.subtleText },
    listFooterContainer: { paddingHorizontal: 20 },
    modalActionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 10,
    },
    newAddWorkoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary + "20",
      paddingVertical: 14,
      borderRadius: 12,
    },
    newAddWorkoutButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "bold",
    },
    newDeletePlanButton: { alignItems: "center", padding: 15, marginTop: 20 },
    newDeletePlanButtonText: {
      color: colors.destructive,
      fontSize: 16,
      fontWeight: "500",
    },
    container: { flex: 1, backgroundColor: colors.background },
    scrollContentContainer: { paddingBottom: 80 },
    pageTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
      paddingTop: 10,
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    carouselWrapper: { height: CARD_HEIGHT, marginBottom: 20 },
    carouselContentContainer: {
      paddingHorizontal: (screenWidth - CARD_WIDTH) / 2,
      alignItems: "center",
    },
    cardWrapper: { width: CARD_WIDTH, height: CARD_HEIGHT },
    card: {
      flex: 1,
      borderRadius: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
      overflow: "hidden",
    },
    cardGradient: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.3,
      transform: [{ rotate: "-45deg" }, { scale: 2 }],
    },
    cardContent: {
      flex: 1,
      padding: 25,
      flexDirection: "column",
      justifyContent: "space-between",
    },
    cardIcon: { fontSize: 50, marginBottom: 10 },
    cardTitle: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF" },
    cardDescription: {
      fontSize: 16,
      fontWeight: "500",
      color: "rgba(255, 255, 255, 0.9)",
      marginTop: 8,
      minHeight: 40,
    },
    cardWorkoutListContainer: {
      marginTop: 15,
      gap: 6,
    },
    cardWorkoutListItemContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardWorkoutListItemName: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.8)",
      fontWeight: "500",
      flex: 1,
      marginRight: 8,
    },
    cardWorkoutListItemSetsReps: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.8)",
      fontWeight: "bold",
    },
    cardDaysContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 15,
    },
    cardDayBubble: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255, 255, 255, 0.25)",
      justifyContent: "center",
      alignItems: "center",
    },
    cardDayBubbleSelected: { backgroundColor: "#FFFFFF" },
    cardDayText: { color: "rgba(255, 255, 255, 0.7)", fontWeight: "bold" },
    cardDayTextSelected: { color: scheme === "light" ? "#A855F7" : "#4F46E5" },
    emptyContainer: {
      height: CARD_HEIGHT,
      justifyContent: "center",
      alignItems: "center",
      opacity: 0.7,
      marginBottom: 20,
    },
    emptyText: { fontSize: 18, fontWeight: "600", color: colors.text },
    addPlanButton: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 12,
      marginHorizontal: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: scheme === "light" ? 0.05 : 0.2,
      shadowRadius: 4,
      elevation: 2,
      marginTop: 10,
    },
    addPlanButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    reorderTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      marginBottom: 20,
    },
    reorderListContent: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 80,
    },
    miniCard: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: scheme === "light" ? 0.1 : 0.4,
      shadowRadius: 4,
      elevation: 5,
    },
    miniCardActive: {
      shadowOpacity: scheme === "light" ? 0.2 : 0.7,
      elevation: 10,
    },
    miniCardIcon: { fontSize: 24, marginRight: 15 },
    miniCardTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    miniCardDragHandle: { color: colors.subtleText, marginLeft: 15 },
    deleteMiniCardButton: {
      position: "absolute",
      top: -8,
      right: -8,
      backgroundColor: colors.destructive,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      elevation: 6,
    },
    doneButtonContainer: { marginTop: 20, alignItems: "center" },
    doneButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 50,
      borderRadius: 28,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 8,
    },
    doneButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
    revertButton: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
    },
    revertButtonText: {
      color: colors.subtleText,
      fontSize: 16,
      fontWeight: "600",
    },
  });
};
