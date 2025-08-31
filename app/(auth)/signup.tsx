import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useRef, useState } from "react";
import {
  Alert,
  Button,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { auth, db } from "../../firebaseConfig";

const bg = require("../../assets/images/bg.jpg");

export default function SignupScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<string | null>(null);
  const [workoutFrequency, setWorkoutFrequency] = useState<string | null>(null);

  const sexPickerRef = useRef<React.ElementRef<typeof RNPickerSelect>>(null);
  const workoutPickerRef =
    useRef<React.ElementRef<typeof RNPickerSelect>>(null);

  const handleReturnToLogin = () => {
    router.replace("/");
  };

  const handleSignUp = async () => {
    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !age ||
      !sex ||
      !workoutFrequency
    ) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        age: age,
        sex: sex,
        workoutFrequency: workoutFrequency,
      });

      Alert.alert("Success", "Account created successfully!");
      router.replace("/(tabs)");
    } catch (error) {
      let errorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert("Signup Error", errorMessage);
    }
  };

  return (
    <ImageBackground source={bg} style={styles.background}>
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create Account</Text>

          <View style={styles.row}>
            <TextInput
              style={styles.inputHalf}
              placeholder="First Name"
              placeholderTextColor="#A9A9A9"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.inputHalf}
              placeholder="Last Name"
              placeholderTextColor="#A9A9A9"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#A9A9A9"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#A9A9A9"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.row}>
            <TextInput
              style={styles.inputHalf}
              placeholder="Age"
              placeholderTextColor="#A9A9A9"
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
            />
            <Pressable
              onPress={() => sexPickerRef.current?.togglePicker()}
              style={styles.inputHalf}
            >
              <RNPickerSelect
                ref={sexPickerRef}
                onValueChange={setSex}
                items={[
                  { label: "Male", value: "male", color: "#FFFFFF" },
                  { label: "Female", value: "female", color: "#FFFFFF" },
                  { label: "Other", value: "other", color: "#FFFFFF" },
                ]}
                value={sex}
                style={pickerSelectStyles}
                placeholder={{ label: "Sex", value: null, color: "#A9A9A9" }}
                textInputProps={{ pointerEvents: "none" }}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() => workoutPickerRef.current?.togglePicker()}
            style={styles.input}
          >
            <RNPickerSelect
              ref={workoutPickerRef}
              onValueChange={setWorkoutFrequency}
              items={[
                { label: "Daily", value: "daily", color: "#FFFFFF" },
                {
                  label: "A few times a week",
                  value: "weekly",
                  color: "#FFFFFF",
                },
                {
                  label: "Once a week",
                  value: "once_a_week",
                  color: "#FFFFFF",
                },
                { label: "Rarely", value: "rarely", color: "#FFFFFF" },
                { label: "Never", value: "never", color: "#FFFFFF" },
              ]}
              value={workoutFrequency}
              style={pickerSelectStyles}
              placeholder={{
                label: "How often do you work out?",
                value: null,
                color: "#A9A9A9",
              }}
              textInputProps={{ pointerEvents: "none" }}
            />
          </Pressable>

          <View style={styles.buttonSpacer} />
          <Button title="Create Account" onPress={handleSignUp} />
          <Text style={styles.text}>Already have an account? Log In</Text>
          <Button title="Log In" onPress={handleReturnToLogin} />
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 30,
  },
  input: {
    width: "90%",
    height: 45,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 15,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 15,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 15,
  },
  inputHalf: {
    width: "48%",
    height: 45,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 15,
    color: "#FFFFFF",
    fontSize: 16,
    justifyContent: "center",
  },
  buttonSpacer: {
    marginTop: 5,
  },
  text: {
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 25,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  placeholder: {
    color: "#A9A9A9",
  },
});
