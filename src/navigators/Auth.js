import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";

import { colors } from "../config/global";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },

        headerTintColor: colors.text,

        contentStyle: {
          backgroundColor: colors.background,
        },

        headerShadowVisible: false,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: "Login",
        }}
      />

      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: "Register",
          headerBackTitle: "Login",
        }}
      />
    </Stack.Navigator>
  );
}