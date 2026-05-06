import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";

import { searchGames } from "./src/api/gamesApi";

export default function App() {
  const [query, setQuery] = useState("zelda");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSearch() {
    try {
      setLoading(true);
      setErrorMessage("");

      const results = await searchGames(query);
      setGames(results);
    } catch (error) {
      setErrorMessage("Could not load games. Check your backend server and IP address.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>GameAtlas API Test</Text>
        <Text style={styles.subtitle}>Search IGDB through your Node backend</Text>

        <TextInput
          style={styles.input}
          placeholder="Search for a game..."
          placeholderTextColor="#777"
          value={query}
          onChangeText={setQuery}
        />

        <Pressable style={styles.button} onPress={handleSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </Pressable>

        {loading && <ActivityIndicator size="large" style={styles.loader} />}

        {errorMessage ? (
          <Text style={styles.error}>{errorMessage}</Text>
        ) : null}

        <FlatList
          data={games}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.gameTitle}>{item.name}</Text>
              <Text style={styles.summary} numberOfLines={4}>
                {item.summary || "No summary available."}
              </Text>
              {item.total_rating ? (
                <Text style={styles.rating}>
                  Rating: {Math.round(item.total_rating)} / 100
                </Text>
              ) : null}
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f2f2f2",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000d4c",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#404040",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cacaca",
    color: "#000000",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#000d4c",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  loader: {
    marginVertical: 15,
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
  list: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#cacaca",
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000d4c",
    marginBottom: 6,
  },
  summary: {
    color: "#232323",
    lineHeight: 20,
  },
  rating: {
    marginTop: 8,
    fontWeight: "bold",
    color: "#333d4c",
  },
});