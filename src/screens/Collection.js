import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../context/AuthContext";

import {
  addGameToCollection,
  getUserCollection,
  removeCollectionItem,
  updateCollectionStatus,
  updateCollectionRating,
} from "../api/collectionApi";

import {
  getUserWishlist,
  removeWishlistItem,
} from "../api/wishlistApi";

import { colors } from "../config/global";

import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import FilterChip from "../components/FilterChip";

export default function CollectionScreen({ navigation }) {
  const { user, isLoggedIn } = useAuth();

  const [collection, setCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] = useState("Collection");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("Newest");

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedWishlistGame, setSelectedWishlistGame] = useState(null);
  const [moveRating, setMoveRating] = useState("");
  const [moveStatus, setMoveStatus] = useState("Playing");

  const [editingRatingId, setEditingRatingId] = useState(null);
  const [ratingInput, setRatingInput] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      if (isLoggedIn) {
        loadCollection();
      } else {
        setLoading(false);
      }
    }, [isLoggedIn, user?.id])
  );

  async function loadCollection() {
    try {
      setLoading(true);

      const collectionData = await getUserCollection(user.id);
      const wishlistData = await getUserWishlist(user.id);

      setCollection(collectionData);
      setWishlist(wishlistData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(collectionId) {
    try {
      await removeCollectionItem(collectionId);

      setCollection((currentCollection) =>
        currentCollection.filter((item) => item.id !== collectionId)
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleRemoveWishlistItem(wishlistId) {
    try {
      await removeWishlistItem(wishlistId);

      setWishlist((currentWishlist) =>
        currentWishlist.filter((item) => item.id !== wishlistId)
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  function openMoveModal(item) {
    setSelectedWishlistGame(item);
    setMoveRating("");
    setMoveStatus("Playing");
    setMessage("");
    setMoveModalOpen(true);
  }

  function closeMoveModal() {
    setMoveModalOpen(false);
    setSelectedWishlistGame(null);
    setMoveRating("");
    setMoveStatus("Playing");
  }

  async function handleMoveWishlistToCollection() {
    try {
      if (!selectedWishlistGame) return;

      const trimmedRating = moveRating.trim();

      const numericRating = trimmedRating
        ? Number(trimmedRating)
        : null;

      if (trimmedRating && Number.isNaN(numericRating)) {
        setMessage("Rating must be a number.");
        return;
      }

      if (
        numericRating !== null &&
        (numericRating < 1 || numericRating > 100)
      ) {
        setMessage("Rating must be between 1 and 100.");
        return;
      }

      // Moving a game means creating a collection item and then removing
      // the original wishlist entry so it does not appear in both tabs.
      await addGameToCollection({
        userId: user.id,
        gameId: selectedWishlistGame.game_id,
        gameName: selectedWishlistGame.game_name,
        coverUrl: selectedWishlistGame.cover_url,
        rating: numericRating,
        releaseYear: selectedWishlistGame.release_year,
        status: moveStatus,
      });

      await removeWishlistItem(selectedWishlistGame.id);

      setCollection((currentCollection) => [
        {
          id: Date.now(),
          user_id: user.id,
          game_id: selectedWishlistGame.game_id,
          game_name: selectedWishlistGame.game_name,
          cover_url: selectedWishlistGame.cover_url,
          rating: numericRating,
          release_year: selectedWishlistGame.release_year,
          status: moveStatus,
          created_at: new Date().toISOString(),
        },
        ...currentCollection,
      ]);

      setWishlist((currentWishlist) =>
        currentWishlist.filter(
          (item) => item.id !== selectedWishlistGame.id
        )
      );

      closeMoveModal();
      setActiveTab("Collection");
      setMessage("Game moved to collection.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleUpdateStatus(collectionId, newStatus) {
    try {
      setMessage("");

      const selectedItem = collection.find((item) => item.id === collectionId);

      if (
        newStatus !== "Backlog" &&
        (selectedItem?.rating === null || selectedItem?.rating === undefined)
      ) {
        setMessage("Please add a rating before moving this game to Playing or Completed.");
        return;
      }

      await updateCollectionStatus(collectionId, newStatus);

      setCollection((currentCollection) =>
        currentCollection.map((item) =>
          item.id === collectionId
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (error) {
      setMessage(error.message || "Failed to update status.");
    }
  }

  async function handleUpdateRating(collectionId) {
    try {
      const numericRating = ratingInput.trim()
        ? Number(ratingInput)
        : null;

      if (
        numericRating !== null &&
        (numericRating < 1 || numericRating > 100)
      ) {
        setMessage("Rating must be between 1 and 100");
        return;
      }

      await updateCollectionRating(collectionId, numericRating);

      setCollection((currentCollection) =>
        currentCollection.map((item) =>
          item.id === collectionId
            ? { ...item, rating: numericRating }
            : item
        )
      );

      setEditingRatingId(null);
      setRatingInput("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  let filteredCollection = [...collection];

  if (statusFilter !== "All") {
    if (statusFilter === "Rated") {
      filteredCollection = filteredCollection.filter(
        (item) => item.rating !== null
      );
    } else if (statusFilter === "Unrated") {
      filteredCollection = filteredCollection.filter(
        (item) => item.rating === null
      );
    } else {
      filteredCollection = filteredCollection.filter(
        (item) => item.status === statusFilter
      );
    }
  }

  switch (sortOption) {
    case "Rating":
      filteredCollection.sort(
        (a, b) => (b.rating || 0) - (a.rating || 0)
      );
      break;

    case "Year":
      filteredCollection.sort(
        (a, b) => (b.release_year || 0) - (a.release_year || 0)
      );
      break;

    case "A-Z":
      filteredCollection.sort((a, b) =>
        a.game_name.localeCompare(b.game_name)
      );
      break;

    default:
      filteredCollection.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );
  }

  const completedGames = collection.filter(
    (item) => item.status === "Completed"
  ).length;

  const backlogGames = collection.filter(
    (item) => item.status === "Backlog"
  ).length;

  const playingGames = collection.filter(
    (item) => item.status === "Playing"
  ).length;

  const ratedGames = collection.filter((item) => item.rating !== null);

  const averageRating =
    ratedGames.length > 0
      ? Math.round(
          ratedGames.reduce((sum, item) => sum + item.rating, 0) /
            ratedGames.length
        )
      : 0;

  const displayedData =
    activeTab === "Collection" ? filteredCollection : wishlist;

  if (!isLoggedIn) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.centerContainer}>
          <Text style={styles.title}>Collection</Text>

          <Text style={styles.subtitle}>
            Log in to save and view your games.
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#94C6E4" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={["left", "right", "bottom"]}
    >
      <FlatList
        data={displayedData}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
          <View style={styles.header}>
            <Text style={styles.title}>
              {activeTab === "Collection"
                ? "Your Collection"
                : "Your Wishlist"}
            </Text>

            <Text style={styles.subtitle}>
              {activeTab === "Collection"
                ? "Games you have saved to your GameAtlas profile."
                : "Games you have saved for later."}
            </Text>
          </View>

            <View style={styles.statsCard}>
              <Text style={styles.statsText}>
                Total Games: {collection.length}
              </Text>

              <Text style={styles.statsText}>
                Playing: {playingGames}
              </Text>

              <Text style={styles.statsText}>
                Completed: {completedGames}
              </Text>

              <Text style={styles.statsText}>
                Backlog: {backlogGames}
              </Text>

              <Text style={styles.statsText}>
                Wishlist: {wishlist.length}
              </Text>

              <Text style={styles.statsText}>
                Average Rating: {averageRating}/100
              </Text>
            </View>

            <View style={styles.tabRow}>
              {["Collection", "Wishlist"].map((tab) => (
                <Pressable
                  key={tab}
                  style={[
                    styles.tabButton,
                    activeTab === tab && styles.tabButtonActive,
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === tab && styles.tabButtonTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              ))}
            </View>

            {message ? <Text style={styles.message}>{message}</Text> : null}

            {activeTab === "Collection" && collection.length > 0 ? (
              <>
                <Text style={styles.filterLabel}>Filter</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalFilterRow}
                  style={styles.filterScroll}
                >
                  {[
                    "All",
                    "Playing",
                    "Completed",
                    "Backlog",
                    "Rated",
                    "Unrated",
                  ].map((status) => (
                    <FilterChip
                      key={status}
                      title={status}
                      active={statusFilter === status}
                      onPress={() => setStatusFilter(status)}
                      style={styles.filterButton}
                    />
                  ))}
                </ScrollView>

                <Text style={styles.filterLabel}>Sort</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalFilterRow}
                  style={styles.filterScroll}
                >
                  {["Newest", "Rating", "Year", "A-Z"].map((option) => (
                    <FilterChip
                      key={option}
                      title={option}
                      active={sortOption === option}
                      onPress={() => setSortOption(option)}
                      style={styles.sortButton}
                      activeStyle={{
                        backgroundColor: colors.secondaryButton,
                      }}
                      textStyle={{ color: colors.subheading }}
                      activeTextStyle={{ color: colors.background }}
                    />
                  ))}
                </ScrollView>
              </>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === "Collection"
                ? "Your collection is empty."
                : "Your wishlist is empty."}
            </Text>

            <Text style={styles.subtitle}>
              {activeTab === "Collection"
                ? "Start adding games from the search page."
                : "Add games to your wishlist from a game details page."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (activeTab === "Wishlist") {
            return (
              <Pressable
                style={styles.card}
                onPress={() =>
                  navigation.navigate("GameDetails", {
                    gameId: item.game_id,
                  })
                }
              >
                <Image
                  source={{ uri: item.cover_url }}
                  style={styles.image}
                />

                <View style={styles.infoBox}>
                  <Text style={styles.gameTitle}>{item.game_name}</Text>

                  <Text style={styles.metaText}>
                    Year: {item.release_year || "Unknown"}
                  </Text>

                  <Text style={styles.metaText}>Saved to Wishlist</Text>

                  <View style={styles.wishlistButtonGroup}>
                    <PrimaryButton
                      title="Move to Collection"
                      onPress={() => openMoveModal(item)}
                    />

                    <SecondaryButton
                      title="Remove from Wishlist"
                      onPress={() => handleRemoveWishlistItem(item.id)}
                    />
                  </View>
                </View>
              </Pressable>
            );
          }
          
          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate("GameDetails", {
                  gameId: item.game_id,
                })
              }
            >
              <Image
                source={{ uri: item.cover_url }}
                style={styles.image}
              />

              <View style={styles.infoBox}>
                <Text style={styles.gameTitle}>{item.game_name}</Text>

                {editingRatingId === item.id ? (
                  <>
                    <TextInput
                      style={styles.ratingInput}
                      placeholder="1-100"
                      placeholderTextColor="#B8C2D0"
                      keyboardType="numeric"
                      value={ratingInput}
                      onChangeText={setRatingInput}
                    />

                    <PrimaryButton
                      title="Save Rating"
                      onPress={() => handleUpdateRating(item.id)}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.metaText}>
                      Rating:{" "}
                      {item.rating !== null
                        ? `${item.rating}/100`
                        : "Unrated"}
                    </Text>

                    <Pressable
                      onPress={() => {
                        setEditingRatingId(item.id);
                        setRatingInput(item.rating?.toString() || "");
                      }}
                    >
                      <Text style={styles.editText}>Edit Rating</Text>
                    </Pressable>
                  </>
                )}

                <Text style={styles.metaText}>
                  Year: {item.release_year || "Unknown"}
                </Text>

                <Text style={styles.metaText}>
                  Status: {item.status || "Playing"}
                </Text>

                <View style={styles.statusRow}>
                  {["Playing", "Completed", "Backlog"].map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.statusButton,
                        item.status === status && styles.statusButtonActive,
                      ]}
                      onPress={() => handleUpdateStatus(item.id, status)}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          item.status === status &&
                            styles.statusButtonTextActive,
                        ]}
                      >
                        {status}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <SecondaryButton
                  title="Remove"
                  onPress={() => handleRemove(item.id)}
                />
              </View>
            </Pressable>
          );
        }}
      />

      <Modal
        visible={moveModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={closeMoveModal}
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.modalOverlay} onPress={closeMoveModal}>
            <Pressable
              style={styles.moveModal}
              onPress={(event) => event.stopPropagation()}
            >
              <Text style={styles.modalTitle}>Move to Collection</Text>

              <Text style={styles.modalSubtitle}>
                {selectedWishlistGame?.game_name}
              </Text>

              <Text style={styles.inputLabel}>
                Rating {moveStatus === "Backlog" ? "(optional)" : ""}
              </Text>

              <TextInput
                style={styles.ratingInput}
                placeholder={
                  moveStatus === "Backlog"
                    ? "Optional for backlog"
                    : "Rating out of 100"
                }
                placeholderTextColor="#B8C2D0"
                keyboardType="numeric"
                value={moveRating}
                onChangeText={setMoveRating}
              />

              <Text style={styles.inputLabel}>Status</Text>

              <View style={styles.statusRow}>
                {["Playing", "Completed", "Backlog"].map((status) => (
                  <Pressable
                    key={status}
                    style={[
                      styles.statusButton,
                      moveStatus === status && styles.statusButtonActive,
                    ]}
                    onPress={() => setMoveStatus(status)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        moveStatus === status &&
                          styles.statusButtonTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <PrimaryButton
                title="Move to Collection"
                onPress={handleMoveWishlistToCollection}
              />

              <SecondaryButton title="Cancel" onPress={closeMoveModal} />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },

  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 6,
  },

  subtitle: {
    color: colors.subheading,
    fontSize: 16,
    lineHeight: 22,
  },

  statsCard: {
    backgroundColor: "#2f2f2f",
    borderColor: colors.card,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 14,
    marginBottom: 14,
  },

  statsText: {
    color: colors.text,
    marginBottom: 4,
    fontSize: 15,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
  },

  centerContainer: {
    flex: 1,
    padding: 22,
    justifyContent: "center",
  },

  message: {
    color: colors.subheading,
    textAlign: "center",
    marginBottom: 10,
  },

  emptyContainer: {
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: colors.text,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 8,
  },

  filterLabel: {
    color: colors.card,
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 14,
    marginBottom: 6,
    textTransform: "uppercase",
  },

  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },

  horizontalFilterRow: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    columnGap: 8,
    alignItems: "center",
  },

  filterButton: {
    height: 44,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    minWidth: 105,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 0,
    flexShrink: 0,
  },

  sortButton: {
    height: 42,
    borderColor: colors.subheading,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    minWidth: 95,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 0,
    flexShrink: 0,
  },

  listContent: {
    paddingBottom: 30,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#2f2f2f",
    borderColor: colors.card,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 14,
    marginBottom: 14,
  },

  image: {
    width: 95,
    height: 130,
    borderRadius: 10,
    backgroundColor: colors.card,
  },

  infoBox: {
    flex: 1,
    marginLeft: 14,
  },

  gameTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  metaText: {
    color: colors.subheading,
    marginBottom: 4,
  },

  editText: {
    color: colors.link,
    marginBottom: 8,
    fontWeight: "bold",
  },

  ratingInput: {
    backgroundColor: colors.text,
    color: colors.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },

  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },

  statusButton: {
    borderColor: colors.subheading,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 7,
  },

  statusButtonActive: {
    backgroundColor: colors.subheading,
  },

  statusButtonText: {
    color: colors.subheading,
    fontSize: 11,
    fontWeight: "bold",
  },

  statusButtonTextActive: {
    color: colors.background,
  },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 12,
  },

  tabButton: {
    flex: 1,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },

  tabButtonActive: {
    backgroundColor: colors.border,
  },

  tabButtonText: {
    color: colors.text,
    fontWeight: "bold",
  },

  tabButtonTextActive: {
    color: colors.background,
  },

  wishlistButtonGroup: {
    marginTop: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },

  moveModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderColor: colors.card,
    borderWidth: 1,
    padding: 18,
    paddingBottom: 34,
    maxHeight: "75%",
  },

  modalTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
  },

  modalSubtitle: {
    color: colors.subheading,
    fontSize: 16,
    marginBottom: 16,
  },

  inputLabel: {
    color: colors.subheading,
    fontWeight: "bold",
    marginBottom: 7,
  },

  modalKeyboardView: {
    flex: 1,
  },
});