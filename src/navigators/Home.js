import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/Home";
import GameDetailsScreen from "../screens/GameDetails";
import PublicProfileScreen from "../screens/PublicProfile";

import { colors } from "../config/global";

const Stack = createNativeStackNavigator();

export default function HomeNavigator() {
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
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Game details can be opened from multiple screens throughout the app. */}
      <Stack.Screen
        name="GameDetails"
        component={GameDetailsScreen}
        options={{
          title: "Game Details",
          headerBackTitle: "Home",
        }}
      />

      {/* Public profiles can be opened from reviews and user activity. */}
      <Stack.Screen
        name="PublicProfile"
        component={PublicProfileScreen}
        options={({ route }) => ({
          title: route.params?.displayName
            ? `${route.params.displayName}'s Profile`
            : "Public Profile",

          headerBackTitle: "Game Details",
        })}
      />
    </Stack.Navigator>
  );
}