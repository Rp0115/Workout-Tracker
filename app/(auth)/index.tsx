import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react"; // ADDED: React and useState are needed.
import {
  Alert,
  Button,
  ImageBackground,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";

const bg = require("../../assets/images/bg.jpg");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)");
    } catch (error) {
      let errorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert("Login Failed", errorMessage);
    }
  };

  const handleSignup = () => {
    router.replace("/signup");
  };

  return (
    <View style={styles.background}>
      <ImageBackground source={bg} style={styles.background}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.overlay}>
            <Text style={styles.title}>Log In</Text>

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#A9A9A9"
              textContentType="username"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A9A9A9"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />
            <View style={styles.spacer}></View>
            <Button title="Log In" onPress={handleLogin} />
            <Text style={styles.text}>Don't have an account?</Text>
            <Button title="Sign Up" onPress={handleSignup} />
          </View>
        </TouchableWithoutFeedback>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 52,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 40,
  },
  background: {
    flex: 1,
    backgroundColor: "black",
  },
  overlay: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: "80%",
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 15,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 15,
  },
  text: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 35,
  },
  spacer: {
    marginBottom: 10,
  },
});
