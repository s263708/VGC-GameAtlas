import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../config/global";

import {
  isValidEmail,
  isStrongPassword,
  isValidDisplayName,
} from "../config/validationUtils";

import { useAuth } from "../context/AuthContext";

import PrimaryButton from "../components/PrimaryButton";

export default function RegisterScreen({ navigation }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { register } = useAuth();

  async function handleRegister() {
    try {
      setLoading(true);
      setMessage("");

      if (
        !displayName.trim() ||
        !email.trim() ||
        !password ||
        !confirmPassword
      ) {
        setMessage("Please complete all fields.");
        return;
      }

      if (!isValidDisplayName(displayName.trim())) {
        setMessage(
          "Display name must be between 3 and 15 characters."
        );

        return;
      }

      if (!isValidEmail(email.trim())) {
        setMessage(
          "Please enter a valid email address."
        );

        return;
      }

      if (!isStrongPassword(password)) {
        setMessage(
          "Password must be at least 6 characters."
        );

        return;
      }

      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }

      // Registration also logs the user in through the auth context.
      const data = await register(
        displayName.trim(),
        email.trim(),
        password
      );

      setMessage(
        `Account created for ${data.user.displayName}`
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.kicker}>GameAtlas</Text>

          <Text style={styles.title}>
            Create Account
          </Text>

          <Text style={styles.subtitle}>
            Join GameAtlas and start building your
            collection.
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>
              Display Name
            </Text>

            <TextInput
              style={styles.input}
              placeholder="At least 3 characters"
              placeholderTextColor="#B8C2D0"
              value={displayName}
              onChangeText={setDisplayName}
            />

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

            <Text style={styles.label}>
              Password
            </Text>

            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor="#B8C2D0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.label}>
              Confirm Password
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#B8C2D0"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Text style={styles.requirementsText}>
              Requirements: valid email, display
              name of 3+ characters, and password
              of 6+ characters.
            </Text>

            <PrimaryButton
              title={
                loading
                  ? "Creating Account..."
                  : "Register"
              }
              onPress={handleRegister}
              disabled={loading}
            />

            {message ? (
              <Text style={styles.messageText}>
                {message}
              </Text>
            ) : null}

            <Pressable
              onPress={() =>
                navigation.navigate("Login")
              }
            >
              <Text style={styles.linkText}>
                Already have an account? Login
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardContainer: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    padding: 22,
    paddingTop: 0,
    paddingBottom: 40,
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
    marginTop: -6,
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

  requirementsText: {
    color: colors.card,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 14,
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