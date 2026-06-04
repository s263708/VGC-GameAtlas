import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import {
  getTrendingGames,
  getNewReleases,
  getTopRatedGames,
} from "../api/gamesApi";

import { colors } from "../config/global";
import { getCoverUrl, getYear } from "../config/gameUtils";
import { useAuth } from "../context/AuthContext";

import SectionHeader from "../components/SectionHeader";
import HorizontalGameCarousel from "../components/HorizontalGameCarousel";

function GameRow({ title, subtitle, games, loading, navigation }) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} subtitle={subtitle} />

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="large" color={colors.subheading} />
        </View>
      ) : (
        <HorizontalGameCarousel
          games={games}
          onGamePress={(game) =>
            navigation.navigate("GameDetails", {
              gameId: game.id,
            })
          }
        />
      )}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const [trendingGames, setTrendingGames] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [topRatedGames, setTopRatedGames] = useState([]);
  const [recentlyViewedGames, setRecentlyViewedGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isLoggedIn } = useAuth();

  async function loadRecentlyViewedGames() {
    try {
      if (!isLoggedIn) {
        setRecentlyViewedGames([]);
        return;
      }

      // Recently viewed games are stored locally so they can update quickly
      // without needing another backend table.
      const saved = await AsyncStorage.getItem("recentlyViewedGames");
      setRecentlyViewedGames(saved ? JSON.parse(saved) : []);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);

        const [trending, releases, topRated, gems] = await Promise.all([
          getTrendingGames(),
          getNewReleases(),
          getTopRatedGames(),
        ]);

        setTrendingGames(trending);
        setNewReleases(releases);
        setTopRatedGames(topRated);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadRecentlyViewedGames();
    }, [isLoggedIn])
  );

  // The featured game is chosen from stronger-rated games so the home screen
  // changes without showing very obscure low-quality results.
  const featuredPool = [
    ...trendingGames,
    ...topRatedGames,
  ].filter((game) => game.total_rating && game.total_rating >= 70);

  const featuredGame =
    featuredPool.length > 0
      ? featuredPool[Math.floor(Math.random() * featuredPool.length)]
      : trendingGames[0];

  return (
    <SafeAreaView
      style={styles.homeScreen}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.headerContainer}>
          <Text style={styles.kicker}>Welcome to</Text>

          <Text style={styles.title}>GameAtlas</Text>

          <Text style={styles.subtitle}>
            Discover games, track your collection, manage your wishlist, and
            share reviews.
          </Text>
        </View>

        {loading ? (
          <View style={styles.heroLoading}>
            <ActivityIndicator size="large" color={colors.subheading} />
          </View>
        ) : featuredGame ? (
          <Pressable
            style={styles.heroCard}
            onPress={() =>
              navigation.navigate("GameDetails", {
                gameId: featuredGame.id,
              })
            }
          >
            <Image
              source={{ uri: getCoverUrl(featuredGame) }}
              style={styles.heroImage}
            />

            <View style={styles.heroOverlay}>
              <Text style={styles.heroLabel}>Featured Pick</Text>

              <Text style={styles.heroTitle} numberOfLines={2}>
                {featuredGame.name}
              </Text>

              <Text style={styles.heroMeta}>
                {featuredGame.total_rating
                  ? `${Math.round(featuredGame.total_rating)}%`
                  : "No rating"}{" "}
                • {getYear(featuredGame.first_release_date)}
              </Text>
            </View>
          </Pressable>
        ) : null}

        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickButtonPrimary}
            onPress={() => navigation.navigate("Search")}
          >
            <Text style={styles.quickButtonTitleDark}>Search Games</Text>
            <Text style={styles.quickButtonTextDark}>Find your next game</Text>
          </Pressable>

          <Pressable
            style={styles.quickButtonSecondary}
            onPress={() => navigation.navigate("Collection")}
          >
            <Text style={styles.quickButtonTitle}>Collection</Text>
            <Text style={styles.quickButtonText}>View saved games</Text>
          </Pressable>
        </View>

        {isLoggedIn && recentlyViewedGames.length > 0 ? (
          <GameRow
            title="Recently Viewed"
            subtitle="Games you recently opened"
            games={recentlyViewedGames}
            loading={false}
            navigation={navigation}
          />
        ) : null}

        <GameRow
          title="Popular Games"
          subtitle="Games players are checking out"
          games={trendingGames}
          loading={loading}
          navigation={navigation}
        />

        <GameRow
          title="New Releases"
          subtitle="Recently released titles"
          games={newReleases}
          loading={loading}
          navigation={navigation}
        />

        <GameRow
          title="Top Rated"
          subtitle="Highly rated games"
          games={topRatedGames}
          loading={loading}
          navigation={navigation}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  homeScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollView: {
    paddingBottom: 35,
  },

  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },

  kicker: {
    color: colors.subheading,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },

  title: {
    color: colors.heading,
    fontSize: 38,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    color: colors.card,
    fontSize: 15,
    lineHeight: 22,
  },

  heroLoading: {
    height: 300,
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 22,
    backgroundColor: "#2f2f2f",
    justifyContent: "center",
    alignItems: "center",
  },

  heroCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    height: 330,
    borderRadius: 22,
    overflow: "hidden",
    borderColor: colors.card,
    borderWidth: 1,
    backgroundColor: "#2f2f2f",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },

  heroLabel: {
    color: colors.subheading,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 5,
  },

  heroTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },

  heroMeta: {
    color: colors.card,
    fontSize: 13,
    fontWeight: "600",
  },

  quickActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 28,
  },

  quickButtonPrimary: {
    flex: 1,
    backgroundColor: colors.primaryButton,
    borderRadius: 16,
    padding: 14,
    minHeight: 76,
    justifyContent: "center",
  },

  quickButtonSecondary: {
    flex: 1,
    backgroundColor: "#2f2f2f",
    borderColor: colors.subheading,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 76,
    justifyContent: "center",
  },

  quickButtonTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },

  quickButtonText: {
    color: colors.subheading,
    fontSize: 13,
  },

  quickButtonTitleDark: {
    color: colors.primaryButtonText,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },

  quickButtonTextDark: {
    color: "#333d4c",
    fontSize: 13,
    fontWeight: "600",
  },

  section: {
    marginBottom: 30,
  },

  loadingRow: {
    height: 230,
    justifyContent: "center",
  },
});