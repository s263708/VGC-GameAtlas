import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CollectionScreen from "../screens/Collection";
import GameDetailsScreen from "../screens/GameDetails";
import PublicProfileScreen from "../screens/PublicProfile";

import { colors } from "../config/global";

const Stack = createNativeStackNavigator();

export default function CollectionNavigator() {
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
        name="CollectionScreen"
        component={CollectionScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Collection and wishlist items both open this shared details screen. */}
      <Stack.Screen
        name="GameDetails"
        component={GameDetailsScreen}
        options={{
          title: "Game Details",
          headerBackTitle: "Collection",
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