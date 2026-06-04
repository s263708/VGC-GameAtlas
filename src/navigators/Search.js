import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SearchScreen from "../screens/Search";
import GameDetailsScreen from "../screens/GameDetails";
import PublicProfileScreen from "../screens/PublicProfile";

import { colors } from "../config/global";

const Stack = createNativeStackNavigator();

export default function SearchNavigator() {
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
        name="SearchScreen"
        component={SearchScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Search results open the shared game details screen. */}
      <Stack.Screen
        name="GameDetails"
        component={GameDetailsScreen}
        options={{
          title: "Game Details",
          headerBackTitle: "Search",
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