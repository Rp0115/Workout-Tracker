// /**
//  * @file workoutPlan.tsx
//  * @description This file contains the WorkoutPlanScreen, which allows users to create, view, edit, reorder, and delete their workout plans.
//  *
//  * --- COMPONENT & MODAL OVERVIEW ---
//  *
//  * 1.  WorkoutPlanScreen (Main Component):
//  * - Manages the state for all workout plans.
//  * - Fetches plans from Firebase and handles loading states.
//  * - Toggles between a plan carousel view and a drag-and-drop reordering view.
//  *
//  * 2.  PlanCard:
//  * - A large, visually appealing card that displays a summary of a single workout plan in the main carousel view.
//  *
//  * 3.  PlanModal:
//  * - A full-screen modal for creating a new workout plan or editing an existing one.
//  * - Contains fields for plan name, description, and schedule (days of the week).
//  * - Manages a list of exercises within the plan, allowing users to add, delete, and reorder them using a `DraggableFlatList`.
//  *
//  * 4.  ExerciseLibraryModal (Unified Component):
//  * - A single, reusable modal for browsing and selecting exercises from the library.
//  * - Operates in two modes controlled by a `mode` prop:
//  * - `mode='explore'`: A read-only version for browsing the library.
//  * - `mode='pick'`: A multi-select version for adding exercises to a plan.
//  * - Features comprehensive search and filtering capabilities.
//  *
//  * 5.  ExerciseDetailModal:
//  * - Displays detailed information about a single exercise (muscles, instructions, etc.).
//  * - Triggered from the `ExerciseLibraryModal`.
//  *
//  * 6.  MuscleSelectionModal:
//  * - A small modal that opens from within the `PlanModal` when a user adds a custom (blank) exercise.
//  * - Allows the user to assign primary muscle groups to their custom exercise.
//  *
//  * 7.  ExerciseFilter & FilterSelectionModal:
//  * - Reusable components that build the advanced filtering UI within the `ExerciseLibraryModal`.
//  *
//  * --- FIREBASE INTEGRATION ---
//  *
//  * This screen interacts with one main Firestore collection under the user's UID (`/users/{uid}/`):
//  *
//  * 1.  `workoutPlans` collection:
//  * - `fetchWorkoutPlans`: Reads all documents from this collection to display on the main screen. Documents are sorted by an `order` field.
//  * - `handleSavePlan`:
//  * - If editing, it uses `updateDoc` to save changes to an existing plan document.
//  * - If creating, it uses `addDoc` to create a new plan document. It also calculates and assigns the correct `order` number.
//  * - `handleDeletePlan`: Uses `deleteDoc` to remove a specific plan document from the collection.
//  * - `handleDoneReordering`: Uses a `writeBatch` operation to efficiently update the `order` field of all plan documents after the user has finished reordering them in the UI. This ensures the new order is persisted.
//  */

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
// import {
//   SafeAreaView,
//   useSafeAreaInsets,
// } from "react-native-safe-area-context";

// import { useAuth } from "../../context/AuthContext";
// import { db } from "../../firebaseConfig";

// // --- MODERN COLOR PALETTE (from start.tsx) ---
// const Colors = {
//   light: {
//     background: "#F0F2F5",
//     card: "#FFFFFF",
//     text: "#1C1C1E",
//     subtleText: "#6E6E73",
//     border: "#E5E7EB",
//     primary: "#6D28D9", // Deep Purple
//     primaryAccent: "#8B5CF6",
//     destructive: "#EF4444",
//     success: "#22C55E",
//   },
//   dark: {
//     background: "#111827",
//     card: "#1F2937",
//     text: "#F9FAFB",
//     subtleText: "#9CA3AF",
//     border: "#374151",
//     primary: "#8B5CF6", // Lighter Purple
//     primaryAccent: "#A78BFA",
//     destructive: "#F87171",
//     success: "#4ADE80",
//   },
// };

// // --- DATA IMPORT ---
// import exercises from "../../exercises.json";

// // --- TYPE DEFINITIONS ---
// interface Workout {
//   id: number;
//   name: string;
//   sets: string;
//   reps: string;
//   primaryMuscles: string[];
// }

// interface WorkoutPlan {
//   id: string;
//   planName: string;
//   description?: string;
//   selectedDays: string[];
//   workouts: Omit<Workout, "id">[];
//   primaryMuscleGroups?: string[];
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

// interface FilterSelectionModalProps {
//   visible: boolean;
//   onClose: () => void;
//   title: string;
//   options: string[];
//   selectedValue: string | null;
//   onSelect: (value: string | null) => void;
// }

// const FilterSelectionModal: React.FC<FilterSelectionModalProps> = ({
//   visible,
//   onClose,
//   title,
//   options,
//   selectedValue,
//   onSelect,
// }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   const colors = Colors[colorScheme];

//   return (
//     <Modal
//       visible={visible}
//       animationType="fade"
//       transparent={true}
//       onRequestClose={onClose}
//     >
//       <TouchableOpacity
//         style={styles.miniModalOverlay}
//         activeOpacity={1}
//         onPress={onClose}
//       >
//         <TouchableOpacity
//           style={styles.miniModalContainer}
//           activeOpacity={1}
//           onPress={(e) => e.stopPropagation()}
//         >
//           <View style={styles.miniModalHeader}>
//             <Text style={styles.miniModalTitle}>{title}</Text>
//             <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
//               <Feather name="x" size={24} color={colors.subtleText} />
//             </TouchableOpacity>
//           </View>
//           <FlatList
//             data={options}
//             keyExtractor={(item) => item}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={styles.miniModalOption}
//                 onPress={() => {
//                   onSelect(item);
//                   onClose();
//                 }}
//               >
//                 <Text style={styles.miniModalOptionText}>{item}</Text>
//                 {selectedValue === item && (
//                   <Feather name="check" size={20} color={colors.primary} />
//                 )}
//               </TouchableOpacity>
//             )}
//             ItemSeparatorComponent={() => <View style={styles.newDivider} />}
//           />
//           <TouchableOpacity
//             style={styles.miniModalClearButton}
//             onPress={() => {
//               onSelect(null);
//               onClose();
//             }}
//           >
//             <Text style={styles.miniModalClearButtonText}>Clear Filter</Text>
//           </TouchableOpacity>
//         </TouchableOpacity>
//       </TouchableOpacity>
//     </Modal>
//   );
// };

// interface FilterButtonProps {
//   label: string;
//   value: string | null;
//   onPress: () => void;
// }

// const FilterButton: React.FC<FilterButtonProps> = ({
//   label,
//   value,
//   onPress,
// }) => {
//   const styles = getStyles(useColorScheme() ?? "light");
//   const colors = Colors[useColorScheme() ?? "light"];
//   const isSelected = value !== null;

//   return (
//     <TouchableOpacity style={styles.filterButton} onPress={onPress}>
//       <Text style={styles.filterButtonLabel}>{label}</Text>
//       <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
//         <Text
//           style={[
//             styles.filterButtonValue,
//             isSelected && { color: colors.primary, fontWeight: "600" },
//           ]}
//           numberOfLines={1}
//         >
//           {value || "Any"}
//         </Text>
//         <Feather name="chevron-right" size={18} color={colors.subtleText} />
//       </View>
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
//   const [activeFilter, setActiveFilter] = useState<keyof Filters | null>(null);

//   const handleFilterSelect = (type: keyof Filters, value: string | null) => {
//     onUpdateFilters({
//       ...selectedFilters,
//       [type]: value,
//     });
//   };

//   const hasActiveFilter = Object.values(selectedFilters).some(
//     (v) => v !== null
//   );

//   const getModalProps = () => {
//     if (!activeFilter) return null;
//     switch (activeFilter) {
//       case "muscle":
//         return {
//           title: "Select Muscle Group",
//           options: filterOptions.muscleGroups,
//           selectedValue: selectedFilters.muscle,
//         };
//       case "equipment":
//         return {
//           title: "Select Equipment",
//           options: filterOptions.equipment,
//           selectedValue: selectedFilters.equipment,
//         };
//       case "level":
//         return {
//           title: "Select Difficulty",
//           options: filterOptions.levels,
//           selectedValue: selectedFilters.level,
//         };
//       case "category":
//         return {
//           title: "Select Category",
//           options: filterOptions.categories,
//           selectedValue: selectedFilters.category,
//         };
//       case "force":
//         return {
//           title: "Select Force Type",
//           options: filterOptions.forces,
//           selectedValue: selectedFilters.force,
//         };
//       default:
//         return null;
//     }
//   };

//   const modalProps = getModalProps();

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
//             <Text style={styles.clearFilterText}>Clear All</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       <View style={styles.filterButtonsGroup}>
//         <FilterButton
//           label="Muscle Group"
//           value={selectedFilters.muscle}
//           onPress={() => setActiveFilter("muscle")}
//         />
//         <View style={styles.newDivider} />
//         <FilterButton
//           label="Equipment"
//           value={selectedFilters.equipment}
//           onPress={() => setActiveFilter("equipment")}
//         />
//         <View style={styles.newDivider} />
//         <FilterButton
//           label="Difficulty"
//           value={selectedFilters.level}
//           onPress={() => setActiveFilter("level")}
//         />
//         <View style={styles.newDivider} />
//         <FilterButton
//           label="Category"
//           value={selectedFilters.category}
//           onPress={() => setActiveFilter("category")}
//         />
//         <View style={styles.newDivider} />
//         <FilterButton
//           label="Force Type"
//           value={selectedFilters.force}
//           onPress={() => setActiveFilter("force")}
//         />
//       </View>

//       {modalProps && activeFilter && (
//         <FilterSelectionModal
//           visible={!!activeFilter}
//           onClose={() => setActiveFilter(null)}
//           title={modalProps.title}
//           options={modalProps.options}
//           selectedValue={modalProps.selectedValue}
//           onSelect={(value) => {
//             handleFilterSelect(activeFilter, value);
//           }}
//         />
//       )}
//     </View>
//   );
// };

// // =================================================================================================
// // --- MODAL COMPONENTS ---
// // =================================================================================================

// interface MuscleSelectionModalProps {
//   visible: boolean;
//   onClose: () => void;
//   options: string[];
//   initialSelection: string[];
//   onSave: (selection: string[]) => void;
// }

// const MuscleSelectionModal: React.FC<MuscleSelectionModalProps> = ({
//   visible,
//   onClose,
//   options,
//   initialSelection,
//   onSave,
// }) => {
//   const styles = getStyles(useColorScheme() ?? "light");
//   const colors = Colors[useColorScheme() ?? "light"];
//   const [selected, setSelected] = useState<string[]>(initialSelection);

//   useEffect(() => {
//     if (visible) {
//       setSelected(initialSelection);
//     }
//   }, [visible, initialSelection]);

//   const toggleSelection = (muscle: string) => {
//     setSelected((current) =>
//       current.includes(muscle)
//         ? current.filter((m) => m !== muscle)
//         : [...current, muscle]
//     );
//   };

//   const handleSave = () => {
//     onSave(selected);
//     onClose();
//   };

//   return (
//     <Modal
//       visible={visible}
//       animationType="fade"
//       transparent={true}
//       onRequestClose={onClose}
//     >
//       <View style={styles.miniModalOverlay}>
//         <View style={styles.miniModalContainer}>
//           <View style={styles.miniModalHeader}>
//             <Text style={styles.miniModalTitle}>Select Primary Muscles</Text>
//             <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
//               <Feather name="x" size={24} color={colors.subtleText} />
//             </TouchableOpacity>
//           </View>
//           <FlatList
//             data={options}
//             keyExtractor={(item) => item}
//             renderItem={({ item }) => {
//               const isSelected = selected.includes(item);
//               return (
//                 <TouchableOpacity
//                   style={styles.miniModalOption}
//                   onPress={() => toggleSelection(item)}
//                 >
//                   <Text style={styles.miniModalOptionText}>{item}</Text>
//                   {isSelected && (
//                     <Feather name="check" size={20} color={colors.primary} />
//                   )}
//                 </TouchableOpacity>
//               );
//             }}
//             ItemSeparatorComponent={() => <View style={styles.newDivider} />}
//           />
//           <TouchableOpacity
//             style={styles.miniModalSaveButton}
//             onPress={handleSave}
//           >
//             <Text style={styles.miniModalSaveButtonText}>Save</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// };

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
//   const insets = useSafeAreaInsets();

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
//       <View style={[styles.newModalContainer, { paddingTop: insets.top }]}>
//         <View style={styles.newModalHeader}>
//           <View style={{ width: 60 }} />
//           <Text style={styles.newModalTitle} numberOfLines={2}>
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
//       </View>
//     </Modal>
//   );
// };

// // --- UNIFIED EXERCISE LIBRARY MODAL ---
// interface ExerciseLibraryModalProps {
//   visible: boolean;
//   onClose: () => void;
//   exerciseData: ExerciseData;
//   mode: "explore" | "pick";
//   onSelect?: (selectedExercises: Exercise[]) => void;
// }

// const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({
//   visible,
//   onClose,
//   exerciseData,
//   mode,
//   onSelect,
// }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   const colors = Colors[colorScheme];
//   const insets = useSafeAreaInsets();

//   const [searchQuery, setSearchQuery] = useState("");
//   const [selected, setSelected] = useState<string[]>([]);
//   const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
//   const [filters, setFilters] = useState<Filters>({
//     muscle: null,
//     category: null,
//     level: null,
//     equipment: null,
//     force: null,
//   });

//   // Reset state when modal is closed/opened
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
//     if (mode === "pick" && onSelect) {
//       const selectedExercises = (exercises as Exercise[]).filter((ex) =>
//         selected.includes(ex.id)
//       );
//       onSelect(selectedExercises);
//     }
//     onClose();
//   };

//   const renderItem = ({ item }: { item: Exercise }) => {
//     if (mode === "explore") {
//       return (
//         <ExerciseCard
//           exercise={item}
//           onPress={() => setViewingExercise(item)}
//         />
//       );
//     }

//     // mode === 'pick'
//     const isSelected = selected.includes(item.id);
//     return (
//       <TouchableOpacity
//         style={[
//           styles.exerciseListItem,
//           isSelected && styles.exerciseListItemSelected,
//         ]}
//         onPress={() => toggleSelection(item.id)}
//       >
//         <TouchableOpacity
//           onPress={() => setViewingExercise(item)}
//           style={styles.infoIconTouchable}
//         >
//           <Feather name="info" size={22} color={colors.primary} />
//         </TouchableOpacity>

//         <View style={{ flex: 1 }}>
//           <Text style={styles.exerciseName}>{item.name}</Text>
//           <Text style={styles.exerciseMuscles}>
//             {item.primaryMuscles.join(", ")}
//           </Text>
//         </View>
//         <View
//           style={[
//             styles.checkbox,
//             isSelected && {
//               backgroundColor: colors.primary,
//               borderColor: colors.primary,
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
//       <View style={[styles.newModalContainer, { paddingTop: insets.top }]}>
//         <ExerciseDetailModal
//           visible={!!viewingExercise}
//           onClose={() => setViewingExercise(null)}
//           exercise={viewingExercise}
//         />

//         <View style={styles.newModalHeader}>
//           {mode === "pick" ? (
//             <TouchableOpacity onPress={onClose} style={styles.newHeaderButton}>
//               <Text style={styles.newHeaderButtonText}>Cancel</Text>
//             </TouchableOpacity>
//           ) : (
//             <View style={{ width: 60 }} />
//           )}

//           <Text style={styles.newModalTitle}>
//             {mode === "pick" ? "Select Exercises" : "Explore Exercises"}
//           </Text>

//           <TouchableOpacity onPress={handleDone} style={styles.newHeaderButton}>
//             <Text style={[styles.newHeaderButtonText, { fontWeight: "bold" }]}>
//               {mode === "pick" ? `Done (${selected.length})` : "Done"}
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
//                   placeholderTextColor={colors.subtleText}
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
//       </View>
//     </Modal>
//   );
// };

// interface NewWorkoutRowProps extends RenderItemParams<Workout> {
//   onUpdate: (
//     index: number,
//     field: keyof Omit<Workout, "id" | "primaryMuscles">,
//     value: string
//   ) => void;
//   onDelete: (id: number) => void;
//   onEditMuscles: (workout: Workout) => void;
// }

// const NewWorkoutRow: React.FC<NewWorkoutRowProps> = ({
//   item,
//   drag,
//   isActive,
//   getIndex,
//   onUpdate,
//   onDelete,
//   onEditMuscles,
// }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   const colors = Colors[colorScheme];
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
//           <Feather name="menu" size={24} color={colors.subtleText} />
//         </TouchableOpacity>

//         <View style={styles.newWorkoutInputsContainer}>
//           <View style={{ flex: 1 }}>
//             <TextInput
//               style={styles.newWorkoutNameInput}
//               placeholder="Workout Name"
//               placeholderTextColor={colors.subtleText}
//               value={item.name}
//               onChangeText={(text) => onUpdate(index, "name", text)}
//             />
//             <TouchableOpacity
//               style={styles.muscleSelectorButton}
//               onPress={() => onEditMuscles(item)}
//             >
//               <Feather name="target" size={14} color={colors.subtleText} />
//               <Text style={styles.muscleSelectorText} numberOfLines={1}>
//                 {item.primaryMuscles.length > 0
//                   ? item.primaryMuscles.join(", ")
//                   : "Select primary muscles"}
//               </Text>
//             </TouchableOpacity>
//           </View>
//           <View style={styles.newSetsRepsContainer}>
//             <View style={styles.newSetRepInputWrapper}>
//               <Text style={styles.newSetRepLabel}>Sets</Text>
//               <TextInput
//                 style={styles.newSetRepInput}
//                 placeholder="3"
//                 placeholderTextColor={colors.subtleText}
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
//                 placeholderTextColor={colors.subtleText}
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
//           <Feather name="x" size={20} color={colors.subtleText} />
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
// }

// const PlanModal: React.FC<PlanModalProps> = ({
//   visible,
//   onClose,
//   onSave,
//   onDelete,
//   initialPlan = null,
//   exerciseData,
// }) => {
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   const colors = Colors[colorScheme];
//   const insets = useSafeAreaInsets();
//   const isEditing = !!initialPlan;

//   const [planName, setPlanName] = useState("");
//   const [description, setDescription] = useState("");
//   const [selectedDays, setSelectedDays] = useState<string[]>([]);
//   const [workouts, setWorkouts] = useState<Workout[]>([]);
//   const [isPickerVisible, setIsPickerVisible] = useState(false);
//   const [editingMusclesFor, setEditingMusclesFor] = useState<Workout | null>(
//     null
//   );

//   useEffect(() => {
//     if (visible) {
//       setPlanName(initialPlan?.planName || "");
//       setDescription(initialPlan?.description || "");
//       setSelectedDays(initialPlan?.selectedDays || []);
//       const initialWorkouts =
//         initialPlan?.workouts.map((w, i) => ({
//           ...w,
//           id: i,
//           primaryMuscles: w.primaryMuscles || [],
//         })) || [];
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
//     field: keyof Omit<Workout, "id" | "primaryMuscles">,
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
//       primaryMuscles: [],
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
//       primaryMuscles: ex.primaryMuscles,
//     }));
//     setWorkouts((prev) => [...prev, ...newWorkouts]);
//   };

//   const handleUpdateWorkoutMuscles = (muscles: string[]) => {
//     if (editingMusclesFor === null) return;
//     const index = workouts.findIndex((w) => w.id === editingMusclesFor.id);
//     if (index > -1) {
//       const newWorkouts = [...workouts];
//       newWorkouts[index].primaryMuscles = muscles;
//       setWorkouts(newWorkouts);
//     }
//   };

//   const handleSave = () => {
//     if (!planName) {
//       Alert.alert("Missing Name", "Please give your workout plan a name.");
//       return;
//     }

//     const customWorkoutMissingMuscles = workouts.some(
//       (w) => w.name.trim() !== "" && w.primaryMuscles.length === 0
//     );

//     if (customWorkoutMissingMuscles) {
//       Alert.alert(
//         "Missing Muscle Group",
//         "Please select at least one primary muscle group for each exercise."
//       );
//       return;
//     }

//     const workoutsToSave = workouts.map(({ id, ...rest }) => rest);

//     const allMuscles = workoutsToSave.flatMap((w) => w.primaryMuscles);
//     const primaryMuscleGroups = [...new Set(allMuscles)];

//     const planData = {
//       planName,
//       description: description.trim(),
//       selectedDays,
//       workouts: workoutsToSave,
//       primaryMuscleGroups,
//       order: initialPlan?.order ?? 0,
//       icon: initialPlan?.icon || "💪",
//     };
//     onSave(planData);
//   };

//   return (
//     <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
//       <ExerciseLibraryModal
//         visible={isPickerVisible}
//         onClose={() => setIsPickerVisible(false)}
//         onSelect={handleSelectExercises}
//         exerciseData={exerciseData}
//         mode="pick"
//       />
//       <MuscleSelectionModal
//         visible={editingMusclesFor !== null}
//         onClose={() => setEditingMusclesFor(null)}
//         options={exerciseData.muscleGroups}
//         initialSelection={editingMusclesFor?.primaryMuscles || []}
//         onSave={handleUpdateWorkoutMuscles}
//       />
//       <GestureHandlerRootView style={{ flex: 1 }}>
//         <View style={[styles.newModalContainer, { paddingTop: insets.top }]}>
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
//                 onEditMuscles={setEditingMusclesFor}
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
//                       placeholderTextColor={colors.subtleText}
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
//                       placeholderTextColor={colors.subtleText}
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
//                         backgroundColor: colors.primary,
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
//         </View>
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
//   const colors = Colors[colorScheme];
//   const cardColors =
//     colorScheme === "light"
//       ? [colors.primary, colors.primaryAccent]
//       : [colors.primary, colors.primaryAccent];

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
//   const colors = Colors[colorScheme];

//   return (
//     <TouchableOpacity style={styles.exerciseCard} onPress={onPress}>
//       <View style={{ flex: 1, marginRight: 10 }}>
//         <Text style={styles.exerciseCardTitle}>{exercise.name}</Text>
//         <Text style={styles.exerciseCardSubtitle}>
//           {exercise.primaryMuscles.join(", ")}
//         </Text>
//       </View>
//       <Feather name="info" size={24} color={colors.primary} />
//     </TouchableOpacity>
//   );
// };

// export default function WorkoutPlanScreen() {
//   const { user } = useAuth();
//   const colorScheme = useColorScheme() ?? "light";
//   const styles = getStyles(colorScheme);
//   const colors = Colors[colorScheme];

//   const [isLoading, setIsLoading] = useState(true);
//   const [savedPlans, setSavedPlans] = useState<WorkoutPlan[]>([]);
//   const [originalOrder, setOriginalOrder] = useState<WorkoutPlan[]>([]);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
//   const [isReorderMode, setIsReorderMode] = useState(false);
//   const [isExplorerModalVisible, setIsExplorerModalVisible] = useState(false);

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
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//           backgroundColor: colors.background,
//         }}
//       >
//         <ActivityIndicator size="large" color={colors.primary} />
//       </View>
//     );
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
//                 <Text style={styles.emptySubText}>
//                   Tap below to create your first one.
//                 </Text>
//               </View>
//             )}
//           </Animated.View>
//           <TouchableOpacity
//             style={styles.addPlanButton}
//             onPress={handleOpenCreateModal}
//           >
//             <Feather name="plus" size={20} color="white" />
//             <Text style={styles.addPlanButtonText}>Create New Plan</Text>
//           </TouchableOpacity>

//           <View style={styles.exploreSection}>
//             <Text style={styles.exploreTitle}>Not sure where to start?</Text>
//             <Text style={styles.exploreSubtitle}>
//               Browse the full library of exercises to get some ideas.
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
//         />

//         <ExerciseLibraryModal
//           visible={isExplorerModalVisible}
//           onClose={() => setIsExplorerModalVisible(false)}
//           exerciseData={exerciseData}
//           mode="explore"
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
//     // New Filter Styles
//     miniModalOverlay: {
//       flex: 1,
//       backgroundColor: "rgba(0,0,0,0.5)",
//       justifyContent: "center",
//       alignItems: "center",
//     },
//     miniModalContainer: {
//       backgroundColor: colors.card,
//       borderRadius: 15,
//       width: "85%",
//       maxHeight: "70%",
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.25,
//       shadowRadius: 4,
//       elevation: 5,
//     },
//     miniModalHeader: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       padding: 15,
//       borderBottomWidth: 1,
//       borderBottomColor: colors.border,
//     },
//     miniModalTitle: {
//       fontSize: 18,
//       fontWeight: "bold",
//       color: colors.text,
//     },
//     miniModalOption: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       paddingVertical: 15,
//       paddingHorizontal: 20,
//     },
//     miniModalOptionText: {
//       fontSize: 16,
//       color: colors.text,
//       textTransform: "capitalize",
//     },
//     miniModalClearButton: {
//       padding: 15,
//       alignItems: "center",
//       borderTopWidth: 1,
//       borderTopColor: colors.border,
//     },
//     miniModalClearButtonText: {
//       fontSize: 16,
//       color: colors.destructive,
//       fontWeight: "600",
//     },
//     miniModalSaveButton: {
//       padding: 15,
//       alignItems: "center",
//       borderTopWidth: 1,
//       borderTopColor: colors.border,
//     },
//     miniModalSaveButtonText: {
//       fontSize: 16,
//       color: colors.primary,
//       fontWeight: "600",
//     },
//     filterButtonsGroup: {
//       backgroundColor: colors.card,
//       borderRadius: 12,
//       overflow: "hidden",
//     },
//     filterButton: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       padding: 15,
//       backgroundColor: colors.card,
//     },
//     filterButtonLabel: {
//       fontSize: 16,
//       color: colors.text,
//       fontWeight: "500",
//     },
//     filterButtonValue: {
//       fontSize: 16,
//       color: colors.subtleText,
//       textTransform: "capitalize",
//       maxWidth: screenWidth * 0.4,
//     },

//     // Existing Styles
//     exploreSection: {
//       marginTop: 40,
//       paddingHorizontal: 20,
//     },
//     exploreTitle: {
//       fontSize: 24,
//       fontWeight: "bold",
//       color: colors.text,
//       marginBottom: 4,
//     },
//     exploreSubtitle: {
//       fontSize: 16,
//       color: colors.subtleText,
//       marginBottom: 5,
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
//     listHeaderContainer: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       marginBottom: 10,
//     },
//     clearFilterText: {
//       color: colors.primary,
//       fontWeight: "600",
//       fontSize: 16,
//     },
//     viewExercisesButton: {
//       backgroundColor: colors.card,
//       padding: 15,
//       borderRadius: 12,
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
//     searchContainer: {
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
//     newHeaderButton: {
//       padding: 5,
//       minWidth: 60,
//       alignItems: "center",
//     },
//     newHeaderButtonText: {
//       fontSize: 17,
//       color: colors.primary,
//       alignItems: "flex-end",
//     },
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
//     newDayButtonText: {
//       fontSize: 14,
//       fontWeight: "600",
//       color: colors.text,
//     },
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
//     newDragHandle: { padding: 10 },
//     newWorkoutInputsContainer: {
//       flex: 1,
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 10,
//     },
//     newWorkoutNameInput: {
//       fontSize: 16,
//       fontWeight: "500",
//       color: colors.text,
//       paddingBottom: 4,
//     },
//     muscleSelectorButton: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 6,
//       paddingVertical: 4,
//     },
//     muscleSelectorText: {
//       color: colors.subtleText,
//       fontSize: 14,
//       flex: 1,
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
//     newSetRepLabel: {
//       fontSize: 14,
//       color: colors.subtleText,
//       marginRight: 5,
//     },
//     newSetRepInput: {
//       fontSize: 16,
//       color: colors.text,
//       minWidth: 25,
//       textAlign: "center",
//     },
//     newDeleteWorkoutButton: { padding: 10 },
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
//     newDeletePlanButton: {
//       alignItems: "center",
//       padding: 15,
//       marginTop: 20,
//     },
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
//     cardDayText: {
//       color: "rgba(255, 255, 255, 0.7)",
//       fontWeight: "bold",
//     },
//     cardDayTextSelected: {
//       color: colors.primary,
//     },
//     emptyContainer: {
//       height: CARD_HEIGHT,
//       justifyContent: "center",
//       alignItems: "center",
//       opacity: 0.7,
//       marginBottom: 20,
//     },
//     emptyText: { fontSize: 18, fontWeight: "600", color: colors.text },
//     emptySubText: {
//       fontSize: 16,
//       color: colors.subtleText,
//       marginTop: 8,
//     },
//     addPlanButton: {
//       backgroundColor: colors.primary,
//       padding: 15,
//       borderRadius: 16,
//       marginHorizontal: 20,
//       alignItems: "center",
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 1 },
//       shadowOpacity: scheme === "light" ? 0.05 : 0.2,
//       shadowRadius: 4,
//       elevation: 2,
//       marginTop: 10,
//       flexDirection: "row",
//       justifyContent: "center",
//       gap: 10,
//     },
//     addPlanButtonText: {
//       color: "white",
//       fontSize: 16,
//       fontWeight: "bold",
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
//     doneButtonContainer: {
//       marginTop: 20,
//       flexDirection: "row",
//       justifyContent: "center",
//       alignItems: "center",
//     },
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
//       marginRight: 20,
//     },
//     revertButtonText: {
//       color: colors.subtleText,
//       fontSize: 16,
//       fontWeight: "600",
//     },
//   });
// };

// workoutPlan.tsx (UPDATED)
/**
 * @file workoutPlan.tsx
 * @description This file contains the WorkoutPlanScreen, which allows users to create, view, edit, reorder, and delete their workout plans.
 *
 * --- COMPONENT & MODAL OVERVIEW ---
 *
 * 1.  WorkoutPlanScreen (Main Component):
 * - Manages the state for all workout plans.
 * - Fetches plans from Firebase and handles loading states.
 * - Toggles between a plan carousel view and a drag-and-drop reordering view.
 * - **New**: Can receive exercise data via route params to pre-fill the "New Plan" modal.
 *
 * 2.  PlanCard:
 * - A large, visually appealing card that displays a summary of a single workout plan in the main carousel view.
 *
 * 3.  PlanModal:
 * - A full-screen modal for creating a new workout plan or editing an existing one.
 * - Contains fields for plan name, description, and schedule (days of the week).
 * - Manages a list of exercises within the plan, allowing users to add, delete, and reorder them using a `DraggableFlatList`.
 *
 * 4.  ExerciseLibraryModal (Unified Component):
 * - A single, reusable modal for browsing and selecting exercises from the library.
 * - Operates in two modes controlled by a `mode` prop:
 * - `mode='explore'`: A read-only version for browsing the library.
 * - `mode='pick'`: A multi-select version for adding exercises to a plan.
 *
 * 5.  ExerciseDetailModal:
 * - Displays detailed information about a single exercise (muscles, instructions, etc.).
 * - Triggered from the `ExerciseLibraryModal`.
 *
 * 6.  MuscleSelectionModal:
 * - A small modal that opens from within the `PlanModal` when a user adds a custom (blank) exercise.
 * - Allows the user to assign primary muscle groups to their custom exercise.
 *
 * 7.  ExerciseFilter & FilterSelectionModal:
 * - Reusable components that build the advanced filtering UI within the `ExerciseLibraryModal`.
 *
 * --- FIREBASE INTEGRATION ---
 *
 * This screen interacts with one main Firestore collection under the user's UID (`/users/{uid}/`):
 *
 * 1.  `workoutPlans` collection:
 * - `fetchWorkoutPlans`: Reads all documents from this collection to display on the main screen. Documents are sorted by an `order` field.
 * - `handleSavePlan`:
 * - If editing, it uses `updateDoc` to save changes to an existing plan document.
 * - If creating, it uses `addDoc` to create a new plan document. It also calculates and assigns the correct `order` number.
 * - `handleDeletePlan`: Uses `deleteDoc` to remove a specific plan document from the collection.
 * - `handleDoneReordering`: Uses a `writeBatch` operation to efficiently update the `order` field of all plan documents after the user has finished reordering them in the UI. This ensures the new order is persisted.
 */

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";

// --- MODERN COLOR PALETTE (from start.tsx) ---
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
  },
};

// --- DATA IMPORT ---
import exercises from "../../exercises.json";

// --- TYPE DEFINITIONS ---
interface Workout {
  id: number;
  name: string;
  sets: string;
  reps: string;
  primaryMuscles: string[];
}

interface WorkoutPlan {
  id: string;
  planName: string;
  description?: string;
  selectedDays: string[];
  workouts: Omit<Workout, "id">[];
  primaryMuscleGroups?: string[];
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

interface FilterSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
}

const FilterSelectionModal: React.FC<FilterSelectionModalProps> = ({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.miniModalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.miniModalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.miniModalHeader}>
            <Text style={styles.miniModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
              <Feather name="x" size={24} color={colors.subtleText} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.miniModalOption}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.miniModalOptionText}>{item}</Text>
                {selectedValue === item && (
                  <Feather name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.newDivider} />}
          />
          <TouchableOpacity
            style={styles.miniModalClearButton}
            onPress={() => {
              onSelect(null);
              onClose();
            }}
          >
            <Text style={styles.miniModalClearButtonText}>Clear Filter</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

interface FilterButtonProps {
  label: string;
  value: string | null;
  onPress: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  value,
  onPress,
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  const isSelected = value !== null;

  return (
    <TouchableOpacity style={styles.filterButton} onPress={onPress}>
      <Text style={styles.filterButtonLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          style={[
            styles.filterButtonValue,
            isSelected && { color: colors.primary, fontWeight: "600" },
          ]}
          numberOfLines={1}
        >
          {value || "Any"}
        </Text>
        <Feather name="chevron-right" size={18} color={colors.subtleText} />
      </View>
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
  const [activeFilter, setActiveFilter] = useState<keyof Filters | null>(null);

  const handleFilterSelect = (type: keyof Filters, value: string | null) => {
    onUpdateFilters({
      ...selectedFilters,
      [type]: value,
    });
  };

  const hasActiveFilter = Object.values(selectedFilters).some(
    (v) => v !== null
  );

  const getModalProps = () => {
    if (!activeFilter) return null;
    switch (activeFilter) {
      case "muscle":
        return {
          title: "Select Muscle Group",
          options: filterOptions.muscleGroups,
          selectedValue: selectedFilters.muscle,
        };
      case "equipment":
        return {
          title: "Select Equipment",
          options: filterOptions.equipment,
          selectedValue: selectedFilters.equipment,
        };
      case "level":
        return {
          title: "Select Difficulty",
          options: filterOptions.levels,
          selectedValue: selectedFilters.level,
        };
      case "category":
        return {
          title: "Select Category",
          options: filterOptions.categories,
          selectedValue: selectedFilters.category,
        };
      case "force":
        return {
          title: "Select Force Type",
          options: filterOptions.forces,
          selectedValue: selectedFilters.force,
        };
      default:
        return null;
    }
  };

  const modalProps = getModalProps();

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
            <Text style={styles.clearFilterText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterButtonsGroup}>
        <FilterButton
          label="Muscle Group"
          value={selectedFilters.muscle}
          onPress={() => setActiveFilter("muscle")}
        />
        <View style={styles.newDivider} />
        <FilterButton
          label="Equipment"
          value={selectedFilters.equipment}
          onPress={() => setActiveFilter("equipment")}
        />
        <View style={styles.newDivider} />
        <FilterButton
          label="Difficulty"
          value={selectedFilters.level}
          onPress={() => setActiveFilter("level")}
        />
        <View style={styles.newDivider} />
        <FilterButton
          label="Category"
          value={selectedFilters.category}
          onPress={() => setActiveFilter("category")}
        />
        <View style={styles.newDivider} />
        <FilterButton
          label="Force Type"
          value={selectedFilters.force}
          onPress={() => setActiveFilter("force")}
        />
      </View>

      {modalProps && activeFilter && (
        <FilterSelectionModal
          visible={!!activeFilter}
          onClose={() => setActiveFilter(null)}
          title={modalProps.title}
          options={modalProps.options}
          selectedValue={modalProps.selectedValue}
          onSelect={(value) => {
            handleFilterSelect(activeFilter, value);
          }}
        />
      )}
    </View>
  );
};

// =================================================================================================
// --- MODAL COMPONENTS ---
// =================================================================================================

interface MuscleSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  options: string[];
  initialSelection: string[];
  onSave: (selection: string[]) => void;
}

const MuscleSelectionModal: React.FC<MuscleSelectionModalProps> = ({
  visible,
  onClose,
  options,
  initialSelection,
  onSave,
}) => {
  const styles = getStyles(useColorScheme() ?? "light");
  const colors = Colors[useColorScheme() ?? "light"];
  const [selected, setSelected] = useState<string[]>(initialSelection);

  useEffect(() => {
    if (visible) {
      setSelected(initialSelection);
    }
  }, [visible, initialSelection]);

  const toggleSelection = (muscle: string) => {
    setSelected((current) =>
      current.includes(muscle)
        ? current.filter((m) => m !== muscle)
        : [...current, muscle]
    );
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.miniModalOverlay}>
        <View style={styles.miniModalContainer}>
          <View style={styles.miniModalHeader}>
            <Text style={styles.miniModalTitle}>Select Primary Muscles</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
              <Feather name="x" size={24} color={colors.subtleText} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = selected.includes(item);
              return (
                <TouchableOpacity
                  style={styles.miniModalOption}
                  onPress={() => toggleSelection(item)}
                >
                  <Text style={styles.miniModalOptionText}>{item}</Text>
                  {isSelected && (
                    <Feather name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.newDivider} />}
          />
          <TouchableOpacity
            style={styles.miniModalSaveButton}
            onPress={handleSave}
          >
            <Text style={styles.miniModalSaveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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
  const insets = useSafeAreaInsets();

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
      <View style={[styles.newModalContainer, { paddingTop: insets.top }]}>
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
      </View>
    </Modal>
  );
};

interface ExerciseLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseData: ExerciseData;
  mode: "explore" | "pick";
  onSelect?: (selectedExercises: Exercise[]) => void;
}

const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({
  visible,
  onClose,
  exerciseData,
  mode,
  onSelect,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

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
    if (mode === "pick" && onSelect) {
      const selectedExercises = (exercises as Exercise[]).filter((ex) =>
        selected.includes(ex.id)
      );
      onSelect(selectedExercises);
    }
    onClose();
  };

  const renderItem = ({ item }: { item: Exercise }) => {
    if (mode === "explore") {
      return (
        <ExerciseCard
          exercise={item}
          onPress={() => setViewingExercise(item)}
        />
      );
    }

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
          <Feather name="info" size={22} color={colors.primary} />
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
              backgroundColor: colors.primary,
              borderColor: colors.primary,
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
      <View style={[styles.newModalContainer, { paddingTop: insets.top }]}>
        <ExerciseDetailModal
          visible={!!viewingExercise}
          onClose={() => setViewingExercise(null)}
          exercise={viewingExercise}
        />

        <View style={styles.newModalHeader}>
          {mode === "pick" ? (
            <TouchableOpacity onPress={onClose} style={styles.newHeaderButton}>
              <Text style={styles.newHeaderButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}

          <Text style={styles.newModalTitle}>
            {mode === "pick" ? "Select Exercises" : "Explore Exercises"}
          </Text>

          <TouchableOpacity onPress={handleDone} style={styles.newHeaderButton}>
            <Text style={[styles.newHeaderButtonText, { fontWeight: "bold" }]}>
              {mode === "pick" ? `Done (${selected.length})` : "Done"}
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
                  placeholderTextColor={colors.subtleText}
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
      </View>
    </Modal>
  );
};

interface NewWorkoutRowProps extends RenderItemParams<Workout> {
  onUpdate: (
    index: number,
    field: keyof Omit<Workout, "id" | "primaryMuscles">,
    value: string
  ) => void;
  onDelete: (id: number) => void;
  onEditMuscles: (workout: Workout) => void;
}

const NewWorkoutRow: React.FC<NewWorkoutRowProps> = ({
  item,
  drag,
  isActive,
  getIndex,
  onUpdate,
  onDelete,
  onEditMuscles,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const colors = Colors[colorScheme];
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
          <Feather name="menu" size={24} color={colors.subtleText} />
        </TouchableOpacity>

        <View style={styles.newWorkoutInputsContainer}>
          <View style={{ flex: 1 }}>
            <TextInput
              style={styles.newWorkoutNameInput}
              placeholder="Workout Name"
              placeholderTextColor={colors.subtleText}
              value={item.name}
              onChangeText={(text) => onUpdate(index, "name", text)}
            />
            <TouchableOpacity
              style={styles.muscleSelectorButton}
              onPress={() => onEditMuscles(item)}
            >
              <Feather name="target" size={14} color={colors.subtleText} />
              <Text style={styles.muscleSelectorText} numberOfLines={1}>
                {item.primaryMuscles.length > 0
                  ? item.primaryMuscles.join(", ")
                  : "Select primary muscles"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.newSetsRepsContainer}>
            <View style={styles.newSetRepInputWrapper}>
              <Text style={styles.newSetRepLabel}>Sets</Text>
              <TextInput
                style={styles.newSetRepInput}
                placeholder="3"
                placeholderTextColor={colors.subtleText}
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
                placeholderTextColor={colors.subtleText}
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
          <Feather name="x" size={20} color={colors.subtleText} />
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
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const isEditing = !!initialPlan?.id;

  const [planName, setPlanName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [editingMusclesFor, setEditingMusclesFor] = useState<Workout | null>(
    null
  );

  useEffect(() => {
    if (visible) {
      setPlanName(initialPlan?.planName || "");
      setDescription(initialPlan?.description || "");
      setSelectedDays(initialPlan?.selectedDays || []);
      const initialWorkouts =
        initialPlan?.workouts.map((w, i) => ({
          ...w,
          id: i,
          primaryMuscles: w.primaryMuscles || [],
        })) || [];
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
    field: keyof Omit<Workout, "id" | "primaryMuscles">,
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
      primaryMuscles: [],
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
      primaryMuscles: ex.primaryMuscles,
    }));
    setWorkouts((prev) => [...prev, ...newWorkouts]);
  };

  const handleUpdateWorkoutMuscles = (muscles: string[]) => {
    if (editingMusclesFor === null) return;
    const index = workouts.findIndex((w) => w.id === editingMusclesFor.id);
    if (index > -1) {
      const newWorkouts = [...workouts];
      newWorkouts[index].primaryMuscles = muscles;
      setWorkouts(newWorkouts);
    }
  };

  const handleSave = () => {
    if (!planName) {
      Alert.alert("Missing Name", "Please give your workout plan a name.");
      return;
    }

    const customWorkoutMissingMuscles = workouts.some(
      (w) => w.name.trim() !== "" && w.primaryMuscles.length === 0
    );

    if (customWorkoutMissingMuscles) {
      Alert.alert(
        "Missing Muscle Group",
        "Please select at least one primary muscle group for each exercise."
      );
      return;
    }

    const workoutsToSave = workouts.map(({ id, ...rest }) => rest);

    const allMuscles = workoutsToSave.flatMap((w) => w.primaryMuscles);
    const primaryMuscleGroups = [...new Set(allMuscles)];

    const planData = {
      planName,
      description: description.trim(),
      selectedDays,
      workouts: workoutsToSave,
      primaryMuscleGroups,
      order: initialPlan?.order ?? 0,
      icon: initialPlan?.icon || "💪",
    };
    onSave(planData);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ExerciseLibraryModal
        visible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        onSelect={handleSelectExercises}
        exerciseData={exerciseData}
        mode="pick"
      />
      <MuscleSelectionModal
        visible={editingMusclesFor !== null}
        onClose={() => setEditingMusclesFor(null)}
        options={exerciseData.muscleGroups}
        initialSelection={editingMusclesFor?.primaryMuscles || []}
        onSave={handleUpdateWorkoutMuscles}
      />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.newModalContainer, { paddingTop: insets.top }]}>
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
                onEditMuscles={setEditingMusclesFor}
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
                      placeholderTextColor={colors.subtleText}
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
                      placeholderTextColor={colors.subtleText}
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
                        backgroundColor: colors.primary,
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
        </View>
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
  const colors = Colors[colorScheme];
  const cardColors =
    colorScheme === "light"
      ? [colors.primary, colors.primaryAccent]
      : [colors.primary, colors.primaryAccent];

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
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity style={styles.exerciseCard} onPress={onPress}>
      <View style={{ flex: 1, marginRight: 10 }}>
        <Text style={styles.exerciseCardTitle}>{exercise.name}</Text>
        <Text style={styles.exerciseCardSubtitle}>
          {exercise.primaryMuscles.join(", ")}
        </Text>
      </View>
      <Feather name="info" size={24} color={colors.primary} />
    </TouchableOpacity>
  );
};

export default function WorkoutPlanScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const colors = Colors[colorScheme];
  const params = useLocalSearchParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [savedPlans, setSavedPlans] = useState<WorkoutPlan[]>([]);
  const [originalOrder, setOriginalOrder] = useState<WorkoutPlan[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isExplorerModalVisible, setIsExplorerModalVisible] = useState(false);

  useEffect(() => {
    if (params.exercises && typeof params.exercises === "string") {
      try {
        const passedWorkouts = JSON.parse(params.exercises);
        if (Array.isArray(passedWorkouts)) {
          const prefilledPlan = {
            id: "", // No ID means it's a new plan
            planName: "", // User will fill this in
            workouts: passedWorkouts,
            selectedDays: [],
            order: savedPlans.length,
          };
          setEditingPlan(prefilledPlan as any); // Cast because `id` is missing
          setIsModalVisible(true);
          // Clear the params so it doesn't trigger again
          router.setParams({ exercises: "" });
        }
      } catch (e) {
        console.error("Failed to parse exercises from route params", e);
      }
    }
  }, [params.exercises]);

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
      if (editingPlan && editingPlan.id) {
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
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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
                <Text style={styles.emptySubText}>
                  Tap below to create your first one.
                </Text>
              </View>
            )}
          </Animated.View>
          <TouchableOpacity
            style={styles.addPlanButton}
            onPress={handleOpenCreateModal}
          >
            <Feather name="plus" size={20} color="white" />
            <Text style={styles.addPlanButtonText}>Create New Plan</Text>
          </TouchableOpacity>

          <View style={styles.exploreSection}>
            <Text style={styles.exploreTitle}>Not sure where to start?</Text>
            <Text style={styles.exploreSubtitle}>
              Browse the full library of exercises to get some ideas.
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

        <ExerciseLibraryModal
          visible={isExplorerModalVisible}
          onClose={() => setIsExplorerModalVisible(false)}
          exerciseData={exerciseData}
          mode="explore"
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
    // New Filter Styles
    miniModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    miniModalContainer: {
      backgroundColor: colors.card,
      borderRadius: 15,
      width: "85%",
      maxHeight: "70%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    miniModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    miniModalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    miniModalOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 15,
      paddingHorizontal: 20,
    },
    miniModalOptionText: {
      fontSize: 16,
      color: colors.text,
      textTransform: "capitalize",
    },
    miniModalClearButton: {
      padding: 15,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    miniModalClearButtonText: {
      fontSize: 16,
      color: colors.destructive,
      fontWeight: "600",
    },
    miniModalSaveButton: {
      padding: 15,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    miniModalSaveButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: "600",
    },
    filterButtonsGroup: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: "hidden",
    },
    filterButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      backgroundColor: colors.card,
    },
    filterButtonLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
    },
    filterButtonValue: {
      fontSize: 16,
      color: colors.subtleText,
      textTransform: "capitalize",
      maxWidth: screenWidth * 0.4,
    },

    // Existing Styles
    exploreSection: {
      marginTop: 40,
      paddingHorizontal: 20,
    },
    exploreTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    exploreSubtitle: {
      fontSize: 16,
      color: colors.subtleText,
      marginBottom: 5,
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
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    clearFilterText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 16,
    },
    viewExercisesButton: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 12,
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
    searchContainer: {
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
    newHeaderButton: {
      padding: 5,
      minWidth: 60,
      alignItems: "center",
    },
    newHeaderButtonText: {
      fontSize: 17,
      color: colors.primary,
      alignItems: "flex-end",
    },
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
    newDayButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
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
    newDragHandle: { padding: 10 },
    newWorkoutInputsContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    newWorkoutNameInput: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      paddingBottom: 4,
    },
    muscleSelectorButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 4,
    },
    muscleSelectorText: {
      color: colors.subtleText,
      fontSize: 14,
      flex: 1,
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
    newSetRepLabel: {
      fontSize: 14,
      color: colors.subtleText,
      marginRight: 5,
    },
    newSetRepInput: {
      fontSize: 16,
      color: colors.text,
      minWidth: 25,
      textAlign: "center",
    },
    newDeleteWorkoutButton: { padding: 10 },
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
    newDeletePlanButton: {
      alignItems: "center",
      padding: 15,
      marginTop: 20,
    },
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
    cardDayText: {
      color: "rgba(255, 255, 255, 0.7)",
      fontWeight: "bold",
    },
    cardDayTextSelected: {
      color: colors.primary,
    },
    emptyContainer: {
      height: CARD_HEIGHT,
      justifyContent: "center",
      alignItems: "center",
      opacity: 0.7,
      marginBottom: 20,
    },
    emptyText: { fontSize: 18, fontWeight: "600", color: colors.text },
    emptySubText: {
      fontSize: 16,
      color: colors.subtleText,
      marginTop: 8,
    },
    addPlanButton: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 16,
      marginHorizontal: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: scheme === "light" ? 0.05 : 0.2,
      shadowRadius: 4,
      elevation: 2,
      marginTop: 10,
      flexDirection: "row",
      justifyContent: "center",
      gap: 10,
    },
    addPlanButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
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
    doneButtonContainer: {
      marginTop: 20,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
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
      marginRight: 20,
    },
    revertButtonText: {
      color: colors.subtleText,
      fontSize: 16,
      fontWeight: "600",
    },
  });
};
