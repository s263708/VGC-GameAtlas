import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { loginUser, registerUser } from "../api/authApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const storedToken = await AsyncStorage.getItem("token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setAuthLoading(false);
    }
  }

  async function clearStoredAuth() {
    setUser(null);
    setToken(null);

    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
  }

  async function login(email, password) {
    // Clear the previous account first so old user data cannot carry over.
    await clearStoredAuth();

    const data = await loginUser(email, password);

    setUser(data.user);
    setToken(data.token);

    await AsyncStorage.setItem("user", JSON.stringify(data.user));
    await AsyncStorage.setItem("token", data.token);

    return data;
  }

  async function register(displayName, email, password) {
    await clearStoredAuth();

    const data = await registerUser(displayName, email, password);

    setUser(data.user);
    setToken(data.token);

    await AsyncStorage.setItem("user", JSON.stringify(data.user));
    await AsyncStorage.setItem("token", data.token);

    return data;
  }

  async function logout() {
    await clearStoredAuth();
  }

  async function updateStoredDisplayName(displayName) {
    const updatedUser = {
      ...user,
      displayName,
    };

    setUser(updatedUser);

    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

    return updatedUser;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authLoading,
        login,
        register,
        logout,
        updateStoredDisplayName,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}