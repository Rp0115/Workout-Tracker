import { StyleSheet } from "react-native";
import { PickerStyle } from "react-native-picker-select";
import { Colors } from "../../constants/Colors";

export const getStyles = (scheme: "light" | "dark") => {
  const colors = Colors[scheme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: "center",
      alignItems: "center",
    },
    profileHeader: {
      alignItems: "center",
      paddingVertical: 30,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
      marginHorizontal: 20,
      marginTop: 50,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
    },
    avatarText: {
      color: "#FFFFFF",
      fontSize: 36,
      fontWeight: "bold",
    },
    profileName: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
    },
    profileEmail: {
      fontSize: 16,
      color: colors.subtleText,
      marginTop: 5,
    },
    section: {
      marginTop: 30,
      marginHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.subtleText,
      textTransform: "uppercase",
      marginBottom: 10,
      paddingLeft: 15,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      paddingVertical: 15,
      paddingHorizontal: 15,
      borderRadius: 10,
      marginBottom: 10,
    },
    optionText: {
      color: colors.text,
      fontSize: 17,
      marginLeft: 15,
      flex: 1,
    },
    optionIcon: {
      color: colors.subtleText,
    },
    logoutButton: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    logoutIcon: {
      position: "absolute",
      left: 15,
    },
    logoutText: {
      color: colors.destructive,
      fontSize: 17,
      textAlign: "center",
      textAlignVertical: "center",
      fontWeight: "600",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.modalOverlay,
    },
    modalContent: {
      width: "85%",
      backgroundColor: colors.modalContent,
      borderRadius: 14,
      padding: 20,
      alignItems: "center",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 20,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.subtleText,
      textAlign: "center",
      marginBottom: 20,
    },
    modalInput: {
      width: "100%",
      height: 44,
      backgroundColor: colors.modalInput,
      borderRadius: 8,
      paddingHorizontal: 15,
      color: colors.text,
      fontSize: 16,
      marginBottom: 10,
    },
    modalButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 40,
      borderRadius: 25,
      marginTop: 10,
    },
    modalButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
    modalUserHeading: {
      color: colors.subtleText,
      fontSize: 12,
      marginBottom: 5,
      paddingHorizontal: 5,
      alignSelf: "flex-start",
    },
  });
};

export const pickerSelectStyles = (scheme: "light" | "dark"): PickerStyle => {
  const colors = Colors[scheme];
  return {
    inputIOS: {
      color: colors.text,
      fontSize: 16,
    },
    inputAndroid: {
      color: colors.text,
      fontSize: 16,
    },
    placeholder: {
      color: colors.subtleText,
    },
    viewContainer: {
      flex: 1,
      justifyContent: "center" as const,
    },
  };
};
