import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../config/global";

import {
  getPublicProfile,
  getPublicProfileCollection,
  getPublicProfileWishlist,
  getPublicProfileReviews,
  getPublicProfileTopGames,
} from "../api/publicProfileApi";

import SectionHeader from "../components/SectionHeader";

export default function PublicProfileScreen({
  route,
  navigation,
}) {
  const { userId } = route.params;

  const [profile, setProfile] = useState(null);
  const [collection, setCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [topGames, setTopGames] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
        const [
            profileData,
            collectionData,
            wishlistData,
            reviewData,
            topGamesData,
        ] = await Promise.all([
            getPublicProfile(userId),
            getPublicProfileCollection(userId),
            getPublicProfileWishlist(userId),
            getPublicProfileReviews(userId),
            getPublicProfileTopGames(userId),
        ]);

      setProfile(profileData);
      setCollection(Array.isArray(collectionData) ? collectionData : []);
      setWishlist(Array.isArray(wishlistData) ? wishlistData : []);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
      setTopGames(Array.isArray(topGamesData) ? topGamesData : []);
    } catch (error) {
      console.log(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadProfile();
  }

  function openGame(gameId) {
    navigation.navigate("GameDetails", {
      gameId,
    });
  }

  function renderGamePreview(item) {
    return (
      <Pressable
        key={item.id}
        style={styles.gameCard}
        onPress={() => openGame(item.game_id)}
      >
        <Image
          source={{ uri: item.cover_url }}
          style={styles.gameImage}
        />

        <View style={styles.gameInfoBox}>
          <Text style={styles.gameName} numberOfLines={2}>
            {item.game_name}
          </Text>

          <Text style={styles.gameMeta}>
            {item.rating !== undefined && item.rating !== null
              ? `${item.rating}/100`
              : item.release_year || "Unknown"}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.subheading}
        />
      </View>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Failed to load profile.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.subheading}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>
              {profile.display_name?.charAt(0)?.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.displayName}>
            {profile.display_name}
          </Text>

          <Text style={styles.joinedText}>
            Joined{" "}
            {profile.created_at
              ? new Date(profile.created_at).toLocaleDateString()
              : "Unknown"}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {profile.collection_count ?? 0}
            </Text>

            <Text style={styles.statLabel}>Collection</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {profile.wishlist_count ?? 0}
            </Text>

            <Text style={styles.statLabel}>Wishlist</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {profile.review_count ?? 0}
            </Text>

            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        <View style={styles.averageCard}>
          <Text style={styles.averageLabel}>Average Rating</Text>

          <Text style={styles.averageValue}>
            {profile.average_rating ?? 0}/100
          </Text>
        </View>

        <SectionHeader
            title="Top 5 Games"
            subtitle="Their highest rated games"
            style={styles.sectionHeader}
        />

        {topGames.length > 0 ? (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalRow}
            >
                {topGames.map(renderGamePreview)}
            </ScrollView>
          ) : (
            <Text style={styles.emptySectionText}>
                This user has not rated enough games yet.
            </Text>
        )}

        <SectionHeader
          title="Wishlist"
          subtitle="Games this user wants to play"
          style={styles.sectionHeader}
        />

        {wishlist.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}
          >
            {wishlist.slice(0, 10).map(renderGamePreview)}
          </ScrollView>
        ) : (
          <Text style={styles.emptySectionText}>
            This user has no wishlist games yet.
          </Text>
        )}

        <SectionHeader
          title="Recent Reviews"
          subtitle="Latest public review activity"
          style={styles.sectionHeader}
        />

        {reviews.length > 0 ? (
          reviews.slice(0, 10).map((review) => (
            <Pressable
              key={review.id}
              style={styles.reviewCard}
              onPress={() => openGame(review.game_id)}
            >
              <View style={styles.reviewTopRow}>
                <Text style={styles.reviewGame} numberOfLines={2}>
                  {review.game_name}
                </Text>

                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeText}>
                    {review.collection_rating ?? "—"}
                  </Text>
                </View>
              </View>

              <Text style={styles.reviewHint}>
                Tap to open game details
              </Text>

              <Text style={styles.reviewText}>
                {review.review_text}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptySectionText}>
            This user has not reviewed any games yet.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    color: colors.card,
    textAlign: "center",
    fontSize: 15,
  },

  heroCard: {
    backgroundColor: "#2f2f2f",
    borderColor: colors.card,
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: "center",
    marginBottom: 20,
  },

  profileCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.subheading,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  profileInitial: {
    color: colors.background,
    fontSize: 34,
    fontWeight: "bold",
  },

  displayName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 6,
  },

  joinedText: {
    color: colors.card,
    fontSize: 14,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#2f2f2f",
    borderColor: "#3d3d3d",
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
  },

  statNumber: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },

  statLabel: {
    color: colors.subheading,
    fontSize: 12,
    fontWeight: "600",
  },

  averageCard: {
    backgroundColor: "#2f2f2f",
    borderColor: "#3d3d3d",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },

  averageLabel: {
    color: colors.subheading,
    fontWeight: "bold",
    marginBottom: 5,
  },

  averageValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "bold",
  },

  sectionHeader: {
    paddingHorizontal: 0,
    marginTop: 6,
  },

  horizontalRow: {
    paddingBottom: 22,
  },

  gameCard: {
    width: 130,
    backgroundColor: "#2f2f2f",
    borderColor: "#3d3d3d",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 12,
  },

  gameImage: {
    width: "100%",
    height: 175,
    resizeMode: "cover",
    backgroundColor: colors.card,
  },

  gameInfoBox: {
    padding: 10,
  },

  gameName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
  },

  gameMeta: {
    color: colors.subheading,
    fontSize: 12,
    fontWeight: "600",
  },

  emptySectionText: {
    color: colors.card,
    fontSize: 14,
    marginBottom: 22,
    lineHeight: 20,
  },

  reviewCard: {
    backgroundColor: "#2f2f2f",
    borderColor: "#3d3d3d",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },

  reviewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  reviewGame: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },

  reviewHint: {
    color: colors.link,
    fontSize: 12,
    marginBottom: 12,
  },

  reviewText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
  },

  ratingBadge: {
    backgroundColor: colors.subheading,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 54,
    alignItems: "center",
  },

  ratingBadgeText: {
    color: colors.background,
    fontWeight: "bold",
    fontSize: 13,
  },
});