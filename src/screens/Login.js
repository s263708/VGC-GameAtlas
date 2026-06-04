import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../config/global";
import { isValidEmail } from "../config/validationUtils";
import { useAuth } from "../context/AuthContext";

import PrimaryButton from "../components/PrimaryButton";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { login } = useAuth();

  async function handleLogin() {
    try {
      setLoading(true);
      setMessage("");

      if (!email.trim() || !password.trim()) {
        setMessage("Please enter your email and password.");
        return;
      }

      if (!isValidEmail(email.trim())) {
        setMessage("Please enter a valid email address.");
        return;
      }

      // The auth context handles token storage and updates the logged-in state.
      const data = await login(email.trim(), password);

      setMessage(`Logged in as ${data.user.displayName}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.kicker}>GameAtlas</Text>

        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>
          Log in to manage your collection, wishlist, ratings, and reviews.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor="#B8C2D0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#B8C2D0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <PrimaryButton
            title={loading ? "Logging in..." : "Login"}
            onPress={handleLogin}
            disabled={loading}
          />

          {message ? (
            <Text style={styles.messageText}>{message}</Text>
          ) : null}

          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.linkText}>
              Don&apos;t have an account? Register
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    padding: 22,
    paddingTop: 10,
  },

  kicker: {
    color: colors.subheading,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 6,
  },

  title: {
    color: colors.heading,
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    color: colors.card,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },

  formCard: {
    backgroundColor: "#2f2f2f",
    borderColor: colors.card,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },

  label: {
    color: colors.subheading,
    fontWeight: "bold",
    marginBottom: 7,
  },

  input: {
    backgroundColor: colors.text,
    color: colors.background,
    borderRadius: 12,
    padding: 13,
    marginBottom: 16,
  },

  linkText: {
    color: colors.link,
    textAlign: "center",
    fontWeight: "600",
  },

  messageText: {
    color: colors.subheading,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600",
  },
});