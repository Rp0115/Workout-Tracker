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
  Pressable,
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
  order: number; // Added for reordering
  icon?: string;
  description?: string;
}

// --- CONSTANTS ---
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.75;
const CARD_HEIGHT = CARD_WIDTH * 1.25;
const CARD_MARGIN = (screenWidth - CARD_WIDTH) / 8;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

// =================================================================================================
// --- REUSABLE COMPONENTS ---
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

interface PlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (plan: Omit<WorkoutPlan, "id" | "order"> & { order: number }) => void;
  onDelete?: () => void;
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
    const planData = {
      planName,
      selectedDays,
      workouts,
      order: initialPlan?.order ?? 0, // Will be reassigned in parent
      icon: initialPlan?.icon || "💪",
      description: initialPlan?.description || `${workouts.length} workouts`,
    };
    onSave(planData);
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

interface PlanCardProps {
  item: WorkoutPlan;
  onPress: () => void;
  onLongPress: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ item, onPress, onLongPress }) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = getStyles(colorScheme);
  const cardColors =
    colorScheme === "light"
      ? ["#A855F7", "#EC4899"] // Light: Purple-Pink
      : ["#4F46E5", "#2DD4BF"]; // Dark: Indigo-Teal

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
          <View>
            <Text style={styles.cardIcon}>{item.icon || "💪"}</Text>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.planName}
            </Text>
            <Text style={styles.cardDescription}>
              {item.description || `${item.workouts.length} workouts`}
            </Text>
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

// =================================================================================================
// --- MAIN WORKOUT PLAN SCREEN ---
// =================================================================================================
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
    setOriginalOrder([...savedPlans]); // Store the original order
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
      setTimeout(() => handleDeletePlan(editingPlan), 200);
    }
  };

  const handleScrollHaptics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleReorderHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                  onMomentumScrollEnd={handleScrollHaptics}
                  onScrollEndDrag={handleScrollHaptics}
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
        </ScrollView>

        <PlanModal
          visible={isModalVisible}
          onClose={closeModal}
          onSave={handleSavePlan}
          onDelete={onDeleteFromModal}
          initialPlan={editingPlan}
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
              onPlaceholderIndexChange={handleReorderHaptic}
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
    cardContent: { flex: 1, padding: 25, justifyContent: "space-between" },
    cardIcon: { fontSize: 50, marginBottom: 20 },
    cardTitle: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF" },
    cardDescription: {
      fontSize: 16,
      fontWeight: "500",
      color: "rgba(255, 255, 255, 0.9)",
      marginTop: 8,
    },
    cardDaysContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
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
    },
    addPlanButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    // Reorder Mode Styles
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
      marginTop: 20, // Reduced top margin
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
      marginBottom: 10,
    },
    revertButtonText: {
      color: colors.subtleText,
      fontSize: 16,
      fontWeight: "600",
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
    saveIconButton: { padding: 8, marginLeft: 10, color: colors.primary },
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
    footerButtonContainer: {
      marginTop: 25,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    addButton: {
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginLeft: "auto",
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
