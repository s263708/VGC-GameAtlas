import "react-native-gesture-handler";

import { ActivityIndicator, View } from "react-native";

import { StatusBar } from "expo-status-bar";

import { NavigationContainer } from "@react-navigation/native";

import { createDrawerNavigator } from "@react-navigation/drawer";

import { SafeAreaProvider } from "react-native-safe-area-context";

import CollectionNavigator from "./src/navigators/Collection";
import SearchNavigator from "./src/navigators/Search";
import AuthNavigator from "./src/navigators/Auth";
import HomeNavigator from "./src/navigators/Home";

import ProfileScreen from "./src/screens/Profile";

import {
  AuthProvider,
  useAuth,
} from "./src/context/AuthContext";

import { colors } from "./src/config/global";

const Drawer = createDrawerNavigator();

function AppContent() {
  const { authLoading } = useAuth();

  // Wait for stored login data before rendering the app.
  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color={colors.subheading}
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Drawer.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.subheading,
            },

            headerTintColor: colors.background,

            drawerStyle: {
              backgroundColor: colors.text,
            },

            drawerActiveBackgroundColor:
              colors.subheading,

            drawerActiveTintColor:
              colors.background,

            drawerInactiveTintColor:
              colors.background,

            sceneContainerStyle: {
              backgroundColor:
                colors.background,
            },

            headerShadowVisible: false,
          }}
        >
          <Drawer.Screen
            name="Home"
            component={HomeNavigator}
          />

          <Drawer.Screen
            name="Search"
            component={SearchNavigator}
          />

          <Drawer.Screen
            name="Collection"
            component={CollectionNavigator}
          />

          <Drawer.Screen
            name="Profile"
            component={ProfileScreen}
          />

          {/* Auth stack contains login and register screens. */}
          <Drawer.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              title: "Login",
            }}
          />
        </Drawer.Navigator>

        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}