import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createReview,
  getGameReviews,
  deleteReview,
  updateReview,
  voteReview,
} from "../api/reviewApi";

import {
  getGameDetails,
  getGameAtlasRating,
} from "../api/gamesApi";

import { useAuth } from "../context/AuthContext";

import {
  addGameToCollection,
  getCollectionItem,
  updateCollectionStatus,
  updateCollectionRating,
} from "../api/collectionApi";

import {
  addGameToWishlist,
  getWishlistItem,
  removeWishlistItem,
} from "../api/wishlistApi";

import { colors } from "../config/global";

import {
  getCoverUrl,
  getScreenshotUrl,
  getTrailerThumbnail,
  formatReleaseDate,
  getYear,
} from "../config/gameUtils";

import { WebView } from "react-native-webview";

import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import ReviewCard from "../components/ReviewCard";
import HorizontalGameCarousel from "../components/HorizontalGameCarousel";
import FilterChip from "../components/FilterChip";

async function saveRecentlyViewedGame(game) {
  try {
    if (!game) return;

    const saved = await AsyncStorage.getItem(
      "recentlyViewedGames"
    );

    const current = saved ? JSON.parse(saved) : [];

    const viewedGame = {
      id: game.id,
      name: game.name,
      cover: game.cover,
      total_rating: game.total_rating,
      first_release_date: game.first_release_date,
    };

    // Keep recently viewed unique and limited.
    const updated = [
      viewedGame,
      ...current.filter((item) => item.id !== game.id),
    ].slice(0, 10);

    await AsyncStorage.setItem(
      "recentlyViewedGames",
      JSON.stringify(updated)
    );
  } catch (error) {
    console.log(error);
  }
}

export default function GameDetailsScreen({
  route,
  navigation,
}) {
  const { gameId } = route.params;

  const { user, isLoggedIn } = useAuth();

  const [game, setGame] = useState(null);
  const [gameAtlasRating, setGameAtlasRating] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [existingCollectionItem, setExistingCollectionItem] =
    useState(null);

  const [collectionMessage, setCollectionMessage] =
    useState("");

  const [collectionRating, setCollectionRating] =
    useState("");

  const [collectionStatus, setCollectionStatus] =
    useState("Playing");

  const [wishlistItem, setWishlistItem] =
    useState(null);

  const [wishlistMessage, setWishlistMessage] =
    useState("");

  const [reviews, setReviews] = useState([]);

  const [reviewSort, setReviewSort] =
    useState("newest");

  const [reviewText, setReviewText] =
    useState("");

  const [reviewMessage, setReviewMessage] =
    useState("");

  const [editingReviewId, setEditingReviewId] =
    useState(null);

  const [editReviewText, setEditReviewText] =
    useState("");

  const [descriptionExpanded, setDescriptionExpanded] =
    useState(false);

  const [trailerModalOpen, setTrailerModalOpen] =
    useState(false);

  const [pageMessage, setPageMessage] = useState("");

  useEffect(() => {
    async function loadGameDetails() {
      try {
        setLoading(true);
        setPageMessage("");

        const result = await getGameDetails(gameId);

        const atlasRating =
          await getGameAtlasRating(gameId);

        setGame(result);
        setGameAtlasRating(atlasRating);

        if (isLoggedIn) {
          // Save recently viewed locally for the home screen section.
          await saveRecentlyViewedGame(result);

          const collectionItem =
            await getCollectionItem(user.id, gameId);

          if (collectionItem) {
            setExistingCollectionItem(collectionItem);

            setCollectionStatus(
              collectionItem.status || "Playing"
            );

            setCollectionRating(
              collectionItem.rating !== null
                ? collectionItem.rating.toString()
                : ""
            );
          }

          const savedWishlistItem =
            await getWishlistItem(user.id, gameId);

          setWishlistItem(savedWishlistItem);
        }

        await loadReviews("newest");
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }

    loadGameDetails();
  }, [gameId, user?.id]);

  async function loadReviews(
    sortOption = reviewSort
  ) {
    try {
      const data = await getGameReviews(
        gameId,
        sortOption,
        isLoggedIn ? user.id : null
      );

      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);

        setPageMessage(
          error.message || "Failed to load game details. Please try again."
        );
    }
  }

  async function handleAddToCollection() {
    try {
      setCollectionMessage("");

      if (!isLoggedIn) {
        setCollectionMessage(
          "Please log in before adding games to your collection."
        );

        return;
      }

      const trimmedRating = collectionRating.trim();

      let numericRating = trimmedRating
        ? Number(trimmedRating)
        : null;

      if (trimmedRating && Number.isNaN(numericRating)) {
        setCollectionMessage("Rating must be a number.");
        return;
      }

      if (
        numericRating !== null &&
        (numericRating < 1 || numericRating > 100)
      ) {
        setCollectionMessage(
          "Rating must be between 1 and 100."
        );

        return;
      }

      // Backlog games can exist without ratings.
      if (
        collectionStatus !== "Backlog" &&
        numericRating === null
      ) {
        setCollectionMessage(
          "Please enter a rating or save the game as Backlog."
        );

        return;
      }

      if (existingCollectionItem) {
        await updateCollectionStatus(
          existingCollectionItem.id,
          collectionStatus
        );

        await updateCollectionRating(
          existingCollectionItem.id,
          numericRating
        );

        setExistingCollectionItem({
          ...existingCollectionItem,
          status: collectionStatus,
          rating: numericRating,
        });

        await loadReviews(reviewSort);

        const updatedAtlasRating =
          await getGameAtlasRating(gameId);

        setGameAtlasRating(updatedAtlasRating);

        setCollectionMessage(
          "Collection updated."
        );

        return;
      }

      await addGameToCollection({
        userId: user.id,
        gameId: game.id,
        gameName: game.name,
        coverUrl: getCoverUrl(game),

        rating: numericRating,

        releaseYear: game.first_release_date
          ? new Date(
              game.first_release_date * 1000
            ).getFullYear()
          : null,

        status: collectionStatus,
      });

      const collectionItem =
        await getCollectionItem(user.id, game.id);

      setExistingCollectionItem(collectionItem);

      await loadReviews(reviewSort);

      const updatedAtlasRating =
        await getGameAtlasRating(gameId);

      setGameAtlasRating(updatedAtlasRating);

      setCollectionMessage(
        "Game added to your collection."
      );
    } catch (error) {
      setCollectionMessage(error.message);
    }
  }

  async function handleToggleWishlist() {
    try {
      setWishlistMessage("");

      if (!isLoggedIn) {
        setWishlistMessage(
          "Please log in before using your wishlist."
        );

        return;
      }

      if (wishlistItem) {
        await removeWishlistItem(wishlistItem.id);

        setWishlistItem(null);

        setWishlistMessage(
          "Removed from wishlist."
        );

        return;
      }

      await addGameToWishlist({
        userId: user.id,
        gameId: game.id,
        gameName: game.name,
        coverUrl: getCoverUrl(game),

        releaseYear: game.first_release_date
          ? new Date(
              game.first_release_date * 1000
            ).getFullYear()
          : null,
      });

      const savedWishlistItem =
        await getWishlistItem(user.id, game.id);

      setWishlistItem(savedWishlistItem);

      setWishlistMessage(
        "Added to wishlist."
      );
    } catch (error) {
      setWishlistMessage(error.message);
    }
  }

  async function handlePostReview() {
    try {
      setReviewMessage("");

      if (!isLoggedIn) {
        setReviewMessage(
          "Please log in before posting a review."
        );

        return;
      }

      if (!reviewText.trim()) {
        setReviewMessage(
          "Please write a review."
        );

        return;
      }

      await createReview({
        userId: user.id,
        gameId: game.id,
        gameName: game.name,
        reviewText,
      });

      setReviewText("");

      setReviewMessage(
        "Review posted."
      );

      loadReviews(reviewSort);
    } catch (error) {
      setReviewMessage(error.message);
    }
  }

  function startEditingReview(review) {
    setEditingReviewId(review.id);
    setEditReviewText(review.review_text);

    setReviewMessage("");
  }

  function cancelEditingReview() {
    setEditingReviewId(null);
    setEditReviewText("");
  }

  async function handleUpdateReview(reviewId) {
    try {
      setReviewMessage("");

      if (!editReviewText.trim()) {
        setReviewMessage(
          "Review cannot be empty."
        );

        return;
      }

      await updateReview(reviewId, {
        userId: user.id,
        reviewText: editReviewText,
      });

      setEditingReviewId(null);
      setEditReviewText("");

      setReviewMessage(
        "Review updated."
      );

      loadReviews(reviewSort);
    } catch (error) {
      setReviewMessage(error.message);
    }
  }

  async function handleDeleteReview(reviewId) {
    try {
      await deleteReview(reviewId);

      loadReviews(reviewSort);
    } catch (error) {
      setReviewMessage(error.message);
    }
  }

  async function handleVoteReview(
    reviewId,
    voteType
  ) {
    try {
      setReviewMessage("");

      if (!isLoggedIn) {
        setReviewMessage(
          "Please log in before voting on reviews."
        );

        return;
      }

      await voteReview(reviewId, {
        userId: user.id,
        voteType,
      });

      loadReviews(reviewSort);
    } catch (error) {
      setReviewMessage(error.message);
    }
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

  if (!game) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.bodyText}>
          Game not found.
        </Text>
      </View>
    );
  }

  const userReview = isLoggedIn
    ? reviews.find(
        (review) => review.user_id === user.id
      )
    : null;

  function getReviewSortLabel() {
    switch (reviewSort) {
      case "newest":
        return "Newest";

      case "oldest":
        return "Oldest";

      case "highest":
        return "Highest Rated";

      case "lowest":
        return "Lowest Rated";

      case "liked":
        return "Most Liked";

      case "disliked":
        return "Most Disliked";

      default:
        return "Newest";
    }
  }

  const descriptionText =
    game.summary || "No description available.";

  const shouldShortenDescription =
    descriptionText.length > 260;

  const displayedDescription =
    !descriptionExpanded &&
    shouldShortenDescription
      ? `${descriptionText.slice(0, 260)}...`
      : descriptionText;

  // Some IGDB entries do not contain trailers, especially DLC pages.
  const trailerVideoId =
    game?.videos?.[0]?.video_id || null;

  const trailerUrl = trailerVideoId
    ? `https://www.youtube.com/embed/${trailerVideoId}?playsinline=1&rel=0`
    : null;

  const trailerWatchUrl = trailerVideoId
    ? `https://www.youtube.com/watch?v=${trailerVideoId}`
    : null;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {game.name}
        </Text>

        <Image
          source={{ uri: getCoverUrl(game) }}
          style={styles.heroImage}
        />

        {pageMessage ? (
          <View style={styles.messageCard}>
            <Text style={styles.pageMessage}>{pageMessage}</Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>
              IGDB Rating
            </Text>

            <Text style={styles.metaValue}>
              {game.total_rating
                ? `${Math.round(game.total_rating)}%`
                : "0%"}
            </Text>
          </View>

          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>
              GameAtlas Rating
            </Text>

            <Text style={styles.metaValue}>
              {gameAtlasRating?.averageRating ?? 0}%
            </Text>

            <Text style={styles.metaSubtext}>
              {gameAtlasRating?.ratingCount ?? 0} ratings
            </Text>
          </View>

          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>
              Released
            </Text>

            <Text style={styles.metaValue}>
              {formatReleaseDate(
                game.first_release_date
              )}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {existingCollectionItem
              ? "Update Collection"
              : "Add to Collection"}
          </Text>

          {existingCollectionItem ? (
            <Text style={styles.existingCollectionText}>
              Already in your collection. You can
              update the rating or status here.
            </Text>
          ) : null}

          <Text style={styles.inputLabel}>
            Your Rating{" "}
            {collectionStatus === "Backlog"
              ? "(optional)"
              : ""}
          </Text>

          <TextInput
            style={[
              styles.ratingInput,
              collectionStatus === "Backlog" &&
                styles.ratingInputOptional,
            ]}
            placeholder={
              collectionStatus === "Backlog"
                ? "Optional for backlog"
                : "Rating out of 100"
            }
            placeholderTextColor={colors.card}
            value={collectionRating}
            onChangeText={setCollectionRating}
            keyboardType="numeric"
          />

          <Text style={styles.helperText}>
            {collectionStatus === "Backlog"
              ? "Backlog games can be saved without a rating. You can add one later from your Collection."
              : "Rating is required unless the game is saved as Backlog."}
          </Text>

          <Text style={styles.inputLabel}>
            Status
          </Text>

          <View style={styles.collectionStatusRow}>
            {["Playing", "Completed", "Backlog"].map(
              (status) => (
                <Pressable
                  key={status}
                  style={[
                    styles.collectionStatusButton,

                    collectionStatus === status &&
                      styles
                        .collectionStatusButtonActive,
                  ]}
                  onPress={() =>
                    setCollectionStatus(status)
                  }
                >
                  <Text
                    style={[
                      styles.collectionStatusButtonText,

                      collectionStatus === status &&
                        styles
                          .collectionStatusButtonTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </Pressable>
              )
            )}
          </View>

          <PrimaryButton
            title={
              existingCollectionItem
                ? "Update Collection"
                : collectionStatus === "Backlog"
                ? "Add to Backlog"
                : "Add to Collection"
            }
            onPress={handleAddToCollection}
          />

          {collectionMessage ? (
            <Text style={styles.collectionMessage}>
              {collectionMessage}
            </Text>
          ) : null}

          <Pressable
            style={[
              styles.wishlistButton,
              wishlistItem &&
                styles.wishlistButtonActive,
            ]}
            onPress={handleToggleWishlist}
          >
            <Text
              style={[
                styles.wishlistButtonText,
                wishlistItem &&
                  styles.wishlistButtonTextActive,
              ]}
            >
              {wishlistItem
                ? "Remove from Wishlist"
                : "Add to Wishlist"}
            </Text>
          </Pressable>

          {wishlistMessage ? (
            <Text style={styles.collectionMessage}>
              {wishlistMessage}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Description
          </Text>

          <Text style={styles.bodyText}>
            {displayedDescription}
          </Text>

          {descriptionExpanded &&
          game.storyline ? (
            <>
              <Text style={styles.sectionTitleSmall}>
                Storyline
              </Text>

              <Text style={styles.bodyText}>
                {game.storyline}
              </Text>
            </>
          ) : null}

          {(shouldShortenDescription ||
            game.storyline) && (
            <Pressable
              style={styles.showMoreButton}
              onPress={() =>
                setDescriptionExpanded(
                  !descriptionExpanded
                )
              }
            >
              <Text style={styles.showMoreText}>
                {descriptionExpanded
                  ? "Show less"
                  : "Show more"}
              </Text>
            </Pressable>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Genres: </Text>
            {game.genres?.length
              ? game.genres.map((genre) => genre.name).join(", ")
              : "Unknown"}
          </Text>

          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Platforms: </Text>
            {game.platforms?.length
              ? game.platforms.map((platform) => platform.name).join(", ")
              : "Unknown"}
          </Text>

          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Companies: </Text>
            {game.involved_companies?.length
              ? game.involved_companies
                  .map((item) => item.company?.name)
                  .filter(Boolean)
                  .join(", ")
              : "Unknown"}
          </Text>
        </View>

        {Array.isArray(game.screenshots) && game.screenshots.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Screenshots</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {game.screenshots.slice(0, 8).map((screenshot) => (
                <Image
                  key={screenshot.id}
                  source={{ uri: getScreenshotUrl(screenshot) }}
                  style={styles.screenshotImage}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {trailerUrl ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trailer</Text>

            <Pressable
              style={styles.trailerPreview}
              onPress={() => setTrailerModalOpen(true)}
            >
              <Image
                source={{
                  uri: getTrailerThumbnail(trailerVideoId),
                }}
                style={styles.trailerThumbnail}
              />

              <View style={styles.playOverlay}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </Pressable>

            <SecondaryButton
              title="Open Trailer on YouTube"
              onPress={() => Linking.openURL(trailerWatchUrl)}
            />
          </View>
        ) : null}

        {Array.isArray(game.similar_games) && game.similar_games.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar Games</Text>
              <HorizontalGameCarousel
                games={game.similar_games || []}
                compact
                contentStyle={{ paddingLeft: 4 }}
                onGamePress={(selectedGame) =>
                  navigation.push("GameDetails", {
                    gameId: selectedGame.id,
                  })
                }
              />
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>

            <Text style={styles.reviewSortLabel}>
              Sorted by: {getReviewSortLabel()}
            </Text>
          </View>

          <View style={styles.sortRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reviewSortScroll}
            >
              {["newest", "oldest", "highest", "lowest", "liked", "disliked"].map(
                (sortOption) => (
                  <FilterChip
                    key={sortOption}
                    title={
                      sortOption === "liked"
                        ? "Most Liked"
                        : sortOption === "disliked"
                        ? "Most Disliked"
                        : sortOption
                    }
                    active={reviewSort === sortOption}
                    onPress={() => {
                      setReviewSort(sortOption);
                      loadReviews(sortOption);
                    }}
                    style={styles.sortButton}
                  />
                )
              )}
            </ScrollView>
          </View>

          {userReview ? (
            <View style={styles.reviewNoticeBox}>
              <Text style={styles.reviewNoticeText}>
                You have already reviewed this game. Your review is shown at the top
                and can be edited there.
              </Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.reviewTextInput}
                placeholder="Write your review..."
                placeholderTextColor={colors.card}
                value={reviewText}
                onChangeText={setReviewText}
                multiline
              />

              <PrimaryButton title="Post Review" onPress={handlePostReview} />
            </>
          )}

          {reviewMessage ? (
            <Text style={styles.collectionMessage}>{reviewMessage}</Text>
          ) : null}

          <View style={styles.reviewList}>
            {reviews.length === 0 ? (
              <Text style={styles.bodyText}>No reviews yet.</Text>
            ) : (
              reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isOwnReview={isLoggedIn && review.user_id === user.id}
                  editingReviewId={editingReviewId}
                  editReviewText={editReviewText}
                  setEditReviewText={setEditReviewText}
                  startEditingReview={startEditingReview}
                  cancelEditingReview={cancelEditingReview}
                  handleUpdateReview={handleUpdateReview}
                  handleDeleteReview={handleDeleteReview}
                  handleVoteReview={handleVoteReview}
                  onAuthorPress={(selectedUserId) => {
                    if (isLoggedIn && selectedUserId === user.id) {
                      navigation.getParent()?.navigate("Profile");
                      return;
                    }

                    navigation.navigate("PublicProfile", {
                      userId: selectedUserId,
                      displayName: review.display_name,
                    });
                  }}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={trailerModalOpen && Boolean(trailerVideoId)}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTrailerModalOpen(false)}
      >
        <View style={styles.trailerModalOverlay}>
          <View style={styles.trailerModalContent}>
            <View style={styles.trailerModalHeader}>
              <Text style={styles.trailerModalTitle}>Trailer</Text>

              <Pressable onPress={() => setTrailerModalOpen(false)}>
                <Text style={styles.trailerModalClose}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.trailerContainer}>
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
                        <style>
                          html, body {
                            margin: 0;
                            padding: 0;
                            background: black;
                            height: 100%;
                            overflow: hidden;
                          }

                          iframe {
                            width: 100%;
                            height: 100%;
                            border: 0;
                          }
                        </style>
                      </head>

                      <body>
                        <iframe
                          src="https://www.youtube.com/embed/${trailerVideoId}?rel=0&playsinline=1&controls=1"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowfullscreen="true"
                        ></iframe>
                      </body>
                    </html>
                  `,
                  baseUrl: "https://gameatlas.local",
                }}
                style={styles.trailerWebView}
                javaScriptEnabled
                domStorageEnabled
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction
                originWhitelist={["*"]}
              />
            </View>

            <SecondaryButton
              title="Open Trailer on YouTube"
              onPress={() => Linking.openURL(trailerWatchUrl)}
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

  content: {
    padding: 18,
    paddingBottom: 35,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
  },

  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
  },

  heroImage: {
    width: "100%",
    height: 360,
    resizeMode: "cover",
    borderRadius: 18,
    backgroundColor: colors.card,
    marginBottom: 16,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },

  metaCard: {
    flexGrow: 1,
    minWidth: "30%",
    backgroundColor: "#2f2f2f",
    borderColor: colors.card,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },

  metaLabel: {
    color: colors.subheading,
    fontSize: 12,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  metaValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
  },

  metaSubtext: {
    color: colors.card,
    fontSize: 12,
    marginTop: 4,
  },

  inputLabel: {
    color: colors.subheading,
    fontWeight: "bold",
    marginBottom: 7,
  },

  collectionStatusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },

  collectionStatusButton: {
    borderColor: colors.subheading,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  collectionStatusButtonActive: {
    backgroundColor: colors.subheading,
  },

  collectionStatusButtonText: {
    color: colors.subheading,
    fontWeight: "bold",
  },

  collectionStatusButtonTextActive: {
    color: colors.background,
  },

  collectionMessage: {
    color: colors.subheading,
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },

  section: {
    backgroundColor: "#2f2f2f",
    borderColor: "#3d3d3d",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  sectionTitleSmall: {
    color: colors.subheading,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 8,
  },

  bodyText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
  },

  detailText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 7,
  },

  detailLabel: {
    color: colors.subheading,
    fontWeight: "bold",
  },

  sortRow: {
    marginBottom: 12,
  },

  sortButton: {
    height: 42,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    minWidth: 105,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 0,
    flexShrink: 0,
  },

  ratingInput: {
    backgroundColor: colors.text,
    color: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },

  ratingInputOptional: {
    borderWidth: 1,
    borderColor: colors.subheading,
  },

  helperText: {
    color: colors.card,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 12,
  },

  reviewTextInput: {
    backgroundColor: colors.text,
    color: colors.background,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: 12,
  },

  reviewList: {
    marginTop: 16,
  },

  reviewNoticeBox: {
    backgroundColor: colors.background,
    borderColor: colors.subheading,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  reviewNoticeText: {
    color: colors.card,
    fontSize: 13,
    lineHeight: 19,
  },

  reviewHeader: {
    marginBottom: 10,
  },

  reviewSortLabel: {
    color: colors.card,
    fontSize: 13,
    marginTop: -2,
  },

  reviewSortScroll: {
    columnGap: 8,
    paddingBottom: 2,
  },

  existingCollectionText: {
    color: colors.card,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },

  wishlistButton: {
    borderColor: colors.subheading,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
  },

  wishlistButtonActive: {
    backgroundColor: colors.subheading,
  },

  wishlistButtonText: {
    color: colors.subheading,
    fontWeight: "bold",
    fontSize: 15,
  },

  wishlistButtonTextActive: {
    color: colors.background,
  },

  showMoreButton: {
    alignSelf: "flex-start",
    marginTop: 10,
  },

  showMoreText: {
    color: colors.link,
    fontWeight: "bold",
    fontSize: 14,
  },

  screenshotImage: {
    width: 260,
    height: 150,
    borderRadius: 14,
    backgroundColor: colors.card,
    marginRight: 12,
  },

  trailerContainer: {
    height: 210,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.background,
  },

  trailerWebView: {
    flex: 1,
  },

  trailerPreview: {
    height: 190,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.background,
  },

  trailerThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },

  playIcon: {
    color: colors.text,
    fontSize: 46,
    fontWeight: "bold",
  },

  trailerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    padding: 18,
  },

  trailerModalContent: {
    backgroundColor: colors.background,
    borderColor: colors.card,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },

  trailerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  trailerModalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
  },

  trailerModalClose: {
    color: colors.link,
    fontWeight: "bold",
  },

  messageCard: {
    backgroundColor: "#2f2f2f",
    borderColor: colors.subheading,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },

  pageMessage: {
    color: colors.subheading,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 13,
  },
});