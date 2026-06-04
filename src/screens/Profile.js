import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import {
  getProfile,
  updateDisplayName,
  deleteAccount,
} from "../api/profileApi";

import { getUserReviews, deleteReview } from "../api/reviewApi";
import { getPublicProfileTopGames } from "../api/publicProfileApi";

import { useAuth } from "../context/AuthContext";
import { colors } from "../config/global";

import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import SectionHeader from "../components/SectionHeader";

export default function ProfileScreen({ navigation }) {
  const {
    user,
    isLoggedIn,
    logout,
    updateStoredDisplayName,
  } = useAuth();

  const [profile, setProfile] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [topGames, setTopGames] = useState([]);

  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(
    user?.displayName || ""
  );
  const [displayNameMessage, setDisplayNameMessage] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      if (isLoggedIn) {
        loadProfileData();
      }
    }, [isLoggedIn, user?.id])
  );

  async function loadProfileData() {
    try {
      // Profile stats and reviews are loaded separately so each
      // section can expand later without changing the API structure.
      const [profileData, reviewData, topGamesData] = await Promise.all([
        getProfile(user.id),
        getUserReviews(user.id),
        getPublicProfileTopGames(user.id),
      ]);

      setProfile(profileData);

      // Only the latest few reviews are shown on the profile page.
      setRecentReviews(reviewData.slice(0, 5));
      setTopGames(Array.isArray(topGamesData) ? topGamesData : []);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleDeleteReview(reviewId) {
    try {
      await deleteReview(reviewId);

      // Reload profile data after deleting so stats stay accurate.
      await loadProfileData();
    } catch (error) {
      console.log(error);
    }
  }

  async function handleSaveDisplayName() {
    try {
      setDisplayNameMessage("");

      const trimmedName = displayNameInput.trim();

      if (trimmedName.length < 3 || trimmedName.length > 15) {
        setDisplayNameMessage(
          "Display name must be between 3 and 15 characters."
        );

        return;
      }

      const response = await updateDisplayName(user.id, trimmedName);

      await updateStoredDisplayName(response.displayName);

      setEditingDisplayName(false);

      setDisplayNameMessage("Display name updated successfully.");
    } catch (error) {
      setDisplayNameMessage(error.message);
    }
  }

  async function handleLogout() {
    await logout();
  }

  async function handleDeleteAccount() {
    try {
      setDeleteMessage("");

      await deleteAccount(user.id);

      await logout();
    } catch (error) {
      setDeleteMessage(
        error.message || "Failed to delete account."
      );
    }
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loggedOutContainer}>
          <Text style={styles.title}>Profile</Text>

          <Text style={styles.subtitle}>
            Log in to manage your collection, wishlist, ratings, and reviews.
          </Text>

          <PrimaryButton
            title="Go to Login"
            onPress={() =>
              navigation.navigate("Auth", {
                screen: "Login",
              })
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.heroCard}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>
              {user.displayName?.charAt(0)?.toUpperCase()}
            </Text>
          </View>

          {editingDisplayName ? (
            <>
              <TextInput
                style={styles.displayNameInput}
                value={displayNameInput}
                onChangeText={setDisplayNameInput}
                placeholder="Enter display name"
                placeholderTextColor={colors.card}
                maxLength={15}
              />

              <View style={styles.displayNameButtonRow}>
                <PrimaryButton
                  title="Save"
                  onPress={handleSaveDisplayName}
                  style={styles.displayNameButton}
                />

                <SecondaryButton
                  title="Cancel"
                  onPress={() => {
                    setEditingDisplayName(false);
                    setDisplayNameInput(user.displayName);
                    setDisplayNameMessage("");
                  }}
                  style={styles.displayNameButton}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.profileName}>{user.displayName}</Text>

              <SecondaryButton
                title="Edit Display Name"
                onPress={() => {
                  setEditingDisplayName(true);
                  setDisplayNameMessage("");
                }}
              />
            </>
          )}

          <Text style={styles.profileEmail}>{user.email}</Text>

          {displayNameMessage ? (
            <Text style={styles.displayNameMessage}>
              {displayNameMessage}
            </Text>
          ) : null}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {profile?.collection_count ?? 0}
            </Text>

            <Text style={styles.statLabel}>Collection</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {profile?.review_count ?? 0}
            </Text>

            <Text style={styles.statLabel}>Reviews</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{recentReviews.length}</Text>

            <Text style={styles.statLabel}>Recent</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderWrapper}>
          <SectionHeader
            title="Top 5 Games"
            subtitle="Your highest rated games"
          />
        </View>

        {topGames.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Top Games Yet</Text>

            <Text style={styles.emptyText}>
              Add ratings to your collection to build your top games list.
            </Text>
          </View>
        ) : (
          topGames.map((game) => (
            <Pressable
              key={game.id}
              style={styles.topGameCard}
              onPress={() =>
                navigation.navigate("Home", {
                  screen: "GameDetails",
                  params: {
                    gameId: game.game_id,
                  },
                })
              }
            >
              <Text style={styles.topGameTitle}>{game.game_name}</Text>

              <Text style={styles.topGameMeta}>
                {game.rating}/100 • {game.release_year || "Unknown"}
              </Text>
            </Pressable>
          ))
        )}

        <View style={styles.sectionHeaderWrapper}>
          <SectionHeader
            title="Recent Reviews"
            subtitle="Your latest activity on GameAtlas"
          />
        </View>

        {recentReviews.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>

            <Text style={styles.emptyText}>
              Start reviewing games to build your GameAtlas profile.
            </Text>
          </View>
        ) : (
          recentReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <Pressable
                onPress={() =>
                  navigation.navigate("Home", {
                    screen: "GameDetails",
                    params: {
                      gameId: review.game_id,
                    },
                  })
                }
              >
                <View style={styles.reviewTopRow}>
                  <Text style={styles.reviewGame}>{review.game_name}</Text>

                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>
                      {review.collection_rating ?? "—"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.reviewHint}>
                  Tap to open game details
                </Text>

                <Text style={styles.reviewText}>{review.review_text}</Text>
              </Pressable>

              <SecondaryButton
                title="Delete Review"
                onPress={() => handleDeleteReview(review.id)}
              />
            </View>
          ))
        )}

        <SecondaryButton
          title="Delete Account"
          onPress={() => setDeleteModalOpen(true)}
        />

        <SecondaryButton
          title="Logout"
          onPress={handleLogout}
        />
      </ScrollView>
      <Modal
        visible={deleteModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteTitle}>
              Delete Account?
            </Text>

            <Text style={styles.deleteText}>
              This action cannot be undone.
              Your profile, collection, wishlist,
              reviews, ratings and votes will be
              permanently deleted.
            </Text>

            {deleteMessage ? (
              <Text style={styles.deleteMessage}>
                {deleteMessage}
              </Text>
            ) : null}

            <PrimaryButton
              title="Permanently Delete Account"
              onPress={handleDeleteAccount}
            />

            <SecondaryButton
              title="Cancel"
              onPress={() => setDeleteModalOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loggedOutContainer: {
    flex: 1,
    padding: 22,
    justifyContent: "center",
  },

  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    color: colors.heading,
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    color: colors.subheading,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
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

  profileName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 6,
  },

  profileEmail: {
    color: colors.card,
    fontSize: 14,
  },

  displayNameInput: {
    width: "100%",
    backgroundColor: colors.text,
    color: colors.background,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    marginBottom: 12,
  },

  displayNameButtonRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },

  displayNameButton: {
    flex: 1,
    marginTop: 0,
    marginBottom: 0,
    justifyContent: "center",
  },

  displayNameMessage: {
    color: colors.subheading,
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
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
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 4,
  },

  statLabel: {
    color: colors.subheading,
    fontSize: 13,
    fontWeight: "600",
  },

  sectionHeaderWrapper: {
    marginBottom: 14,
    marginLeft: -20,
  },

  emptyCard: {
    backgroundColor: "#2f2f2f",
    borderRadius: 18,
    padding: 22,
    borderColor: "#3d3d3d",
    borderWidth: 1,
    marginBottom: 24,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },

  emptyText: {
    color: colors.subheading,
    fontSize: 14,
    lineHeight: 21,
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

  topGameCard: {
    backgroundColor: "#2f2f2f",
    borderColor: "#3d3d3d",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  topGameTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 5,
  },

  topGameMeta: {
    color: colors.subheading,
    fontSize: 13,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },

  deleteModal: {
    backgroundColor: "#2f2f2f",
    borderColor: colors.card,
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
  },

  deleteTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  deleteText: {
    color: colors.subheading,
    lineHeight: 22,
    marginBottom: 14,
  },

  deleteMessage: {
    color: colors.subheading,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "600",
  },
});