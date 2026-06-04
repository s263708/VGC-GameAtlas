import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  searchGames,
  getTrendingGames,
  getNewReleases,
  getTopRatedGames,
  getUpcomingGames,
  getHiddenGems,
  getClassicGames,
} from "../api/gamesApi";

import { colors } from "../config/global";
import { getCoverUrl, getYear } from "../config/gameUtils";

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("popular");

  const [sortBy, setSortBy] = useState("rating");
  const [ascending, setAscending] = useState(false);

  const [genreModalOpen, setGenreModalOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);

  const [recentSearches, setRecentSearches] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const numColumns = isLandscape ? 4 : 3;
  const cardWidth = (width - 40) / numColumns;

  useEffect(() => {
    loadPopularGames();
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }

    // Delay searching slightly so requests are not sent on every key press.
    const delaySearch = setTimeout(() => {
      loadSearchResults();
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  async function loadRecentSearches() {
    try {
      const savedSearches = await AsyncStorage.getItem("recentSearches");

      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function saveRecentSearch(query) {
    try {
      const cleanedQuery = query.trim();

      if (!cleanedQuery) return;

      // Keep recent searches unique and limit the list size.
      const updatedSearches = [
        cleanedQuery,
        ...recentSearches.filter(
          (item) => item.toLowerCase() !== cleanedQuery.toLowerCase()
        ),
      ].slice(0, 8);

      setRecentSearches(updatedSearches);

      await AsyncStorage.setItem(
        "recentSearches",
        JSON.stringify(updatedSearches)
      );
    } catch (error) {
      console.log(error);
    }
  }

  async function clearRecentSearches() {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem("recentSearches");
    } catch (error) {
      console.log(error);
    }
  }

  function handleSuggestionPress(query) {
    setSearchQuery(query);
    setSearchSuggestions([]);
  }

  async function loadGameCategory(categoryName, apiFunction) {
    try {
      setLoading(true);

      setMode(categoryName);
      setGames([]);
      setSearchSuggestions([]);

      const results = await apiFunction();

      if (Array.isArray(results)) {
        setGames(results);
        setSelectedGenres([]);
      } else {
        console.log("Unexpected API response:", results);
        setGames([]);
      }
    } catch (error) {
      console.log(error.message);
      setGames([]);
    } finally {
      setLoading(false);
    }
  }

  function loadPopularGames() {
    loadGameCategory("popular", getTrendingGames);
  }

  function loadNewReleaseGames() {
    loadGameCategory("new", getNewReleases);
  }

  function loadTopRatedGames() {
    loadGameCategory("top", getTopRatedGames);
  }

  function loadUpcomingGames() {
    loadGameCategory("upcoming", getUpcomingGames);
  }

  function loadHiddenGemGames() {
    loadGameCategory("hidden", getHiddenGems);
  }

  function loadClassicGames() {
    loadGameCategory("classics", getClassicGames);
  }

  async function loadSearchResults() {
    try {
      setLoading(true);
      setMode("search");

      const results = await searchGames(searchQuery);

      if (Array.isArray(results)) {
        setGames(results);
        setSelectedGenres([]);

        // Use the first few results as lightweight search suggestions.
        const popularSuggestions = [...results]
          .sort((a, b) => {
            const ratingCountDifference =
              (b.total_rating_count || 0) - (a.total_rating_count || 0);

            if (ratingCountDifference !== 0) {
              return ratingCountDifference;
            }

            return (b.total_rating || 0) - (a.total_rating || 0);
          })
          .slice(0, 5);

        setSearchSuggestions(popularSuggestions);

        saveRecentSearch(searchQuery);
      } else {
        setGames([]);
        setSearchSuggestions([]);
      }
    } catch (error) {
      console.log(error);

      setGames([]);
      setSearchSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function getPageTitle() {
    if (mode === "search") return "Search Results";
    if (mode === "new") return "New Releases";
    if (mode === "top") return "Top Rated";
    if (mode === "upcoming") return "Upcoming Games";
    if (mode === "hidden") return "Hidden Gems";
    if (mode === "classics") return "Classics";

    return "Popular Games";
  }

  function getEmptyMessage() {
    if (searchQuery.trim() && games.length === 0) {
      return "No games found for this search.";
    }

    if (selectedGenres.length > 0) {
      return "No games match these genres.";
    }

    return "No games to show right now.";
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchSuggestions([]);

    loadPopularGames();
  }

  function toggleGenre(genreName) {
    setSelectedGenres((currentGenres) => {
      if (currentGenres.includes(genreName)) {
        return currentGenres.filter((genre) => genre !== genreName);
      }

      return [...currentGenres, genreName];
    });
  }

  function getAvailableGenres() {
    const genreSet = new Set();

    games.forEach((game) => {
      if (game.genres?.length) {
        game.genres.forEach((genre) => genreSet.add(genre.name));
      }
    });

    return [...genreSet].sort();
  }

  function getFilteredAndSortedGames() {
    let filteredGames = [...games];

    if (selectedGenres.length > 0) {
      filteredGames = filteredGames.filter((game) => {
        const gameGenres = game.genres?.map((genre) => genre.name) || [];

        return selectedGenres.every((selectedGenre) =>
          gameGenres.includes(selectedGenre)
        );
      });
    }

    filteredGames.sort((a, b) => {
      if (sortBy === "alphabetical") {
        return ascending
          ? (a.name || "").localeCompare(b.name || "")
          : (b.name || "").localeCompare(a.name || "");
      }

      if (sortBy === "release") {
        return ascending
          ? (a.first_release_date ?? 0) - (b.first_release_date ?? 0)
          : (b.first_release_date ?? 0) - (a.first_release_date ?? 0);
      }

      return ascending
        ? (a.total_rating ?? 0) - (b.total_rating ?? 0)
        : (b.total_rating ?? 0) - (a.total_rating ?? 0);
    });

    return filteredGames;
  }

  const availableGenres = getAvailableGenres();
  const filteredAndSortedGames = getFilteredAndSortedGames();

  const browseOptions = [
    {
      label: "Popular",
      modeValue: "popular",
      onPress: loadPopularGames,
    },

    {
      label: "Top Rated",
      modeValue: "top",
      onPress: loadTopRatedGames,
    },

    {
      label: "New",
      modeValue: "new",
      onPress: loadNewReleaseGames,
    },

    {
      label: "Upcoming",
      modeValue: "upcoming",
      onPress: loadUpcomingGames,
    },

    {
      label: "Hidden Gems",
      modeValue: "hidden",
      onPress: loadHiddenGemGames,
    },

    {
      label: "Classics",
      modeValue: "classics",
      onPress: loadClassicGames,
    },
  ];

  return (
    <SafeAreaView
      style={styles.searchScreen}
      edges={["left", "right", "bottom"]}
    >
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search games..."
          placeholderTextColor={colors.card}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />

        <Pressable
          style={styles.iconButton}
          onPress={() => setAscending(!ascending)}
        >
          <Text style={styles.iconButtonText}>
            {ascending ? "↑" : "↓"}
          </Text>
        </Pressable>
      </View>

      {searchFocused &&
      !searchQuery.trim() &&
      recentSearches.length > 0 ? (
        <View style={styles.suggestionBox}>
          <View style={styles.suggestionHeader}>
            <Text style={styles.suggestionTitle}>
              Recent Searches
            </Text>

            <Pressable onPress={clearRecentSearches}>
              <Text style={styles.clearSuggestionText}>Clear</Text>
            </Pressable>
          </View>

          {recentSearches.map((item) => (
            <Pressable
              key={item}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(item)}
            >
              <Text style={styles.suggestionText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {searchFocused &&
      searchQuery.trim() &&
      searchSuggestions.length > 0 ? (
        <View style={styles.suggestionBox}>
          <Text style={styles.suggestionTitle}>
            Recommended Searches
          </Text>

          {searchSuggestions.map((game) => (
            <Pressable
              key={game.id}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(game.name)}
            >
              <Text style={styles.suggestionText}>
                {game.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.filtersWrapper}>
        <Text style={styles.filterLabel}>Browse</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalFilterRow}
          style={styles.filterScroll}
        >
          {browseOptions.map((option) => (
            <Pressable
              key={option.modeValue}
              style={[
                styles.filterButton,
                mode === option.modeValue &&
                  styles.filterButtonActive,
              ]}
              onPress={option.onPress}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  mode === option.modeValue &&
                    styles.filterButtonTextActive,
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.filterLabel}>Sort</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalFilterRow}
          style={styles.filterScroll}
        >
          {["rating", "release", "alphabetical"].map((option) => (
            <Pressable
              key={option}
              style={[
                styles.sortButton,
                sortBy === option && styles.sortButtonActive,
              ]}
              onPress={() => setSortBy(option)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === option &&
                    styles.sortButtonTextActive,
                ]}
                numberOfLines={1}
              >
                {option === "release"
                  ? "Year"
                  : option === "alphabetical"
                  ? "A-Z"
                  : "Rating"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.genreHeaderRow}>
          <Text style={styles.filterLabel}>Genres</Text>

          <Pressable onPress={() => setGenreModalOpen(true)}>
            <Text style={styles.genreToggle}>
              {selectedGenres.length > 0
                ? `${selectedGenres.length} selected`
                : "Choose"}
            </Text>
          </Pressable>
        </View>

        {selectedGenres.length > 0 || searchQuery.trim() ? (
          <View style={styles.utilityRow}>
            {selectedGenres.length > 0 ? (
              <Pressable
                style={styles.smallUtilityButton}
                onPress={() => setSelectedGenres([])}
              >
                <Text style={styles.smallUtilityText}>
                  Clear filters
                </Text>
              </Pressable>
            ) : null}

            {searchQuery.trim() ? (
              <Pressable
                style={styles.smallUtilityButton}
                onPress={clearSearch}
              >
                <Text style={styles.smallUtilityText}>
                  Clear search
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <Modal
        visible={genreModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGenreModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.genreModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Choose Genres
              </Text>

              <Pressable onPress={() => setGenreModalOpen(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </Pressable>
            </View>

            {availableGenres.length === 0 ? (
              <Text style={styles.modalEmptyText}>
                Genres will appear after games load.
              </Text>
            ) : (
              <ScrollView contentContainerStyle={styles.genreGrid}>
                {availableGenres.map((genre) => (
                  <Pressable
                    key={genre}
                    style={[
                      styles.genreButton,
                      selectedGenres.includes(genre) &&
                        styles.genreButtonActive,
                    ]}
                    onPress={() => toggleGenre(genre)}
                  >
                    <Text
                      style={[
                        styles.genreButtonText,
                        selectedGenres.includes(genre) &&
                          styles.genreButtonTextActive,
                      ]}
                    >
                      {selectedGenres.includes(genre) ? "✓ " : ""}
                      {genre}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {selectedGenres.length > 0 ? (
              <Pressable
                style={styles.clearGenresButton}
                onPress={() => setSelectedGenres([])}
              >
                <Text style={styles.clearGenresText}>
                  Clear selected genres
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>

      <Text style={styles.pageTitle}>{getPageTitle()}</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.subheading}
          />
        </View>
      ) : filteredAndSortedGames.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>
            {getEmptyMessage()}
          </Text>
        </View>
      ) : (
        <FlatList
          key={isLandscape ? "landscape" : "portrait"}
          data={filteredAndSortedGames}
          numColumns={numColumns}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View
              style={[
                styles.resultItem,
                { width: cardWidth },
              ]}
            >
              <Pressable
                style={styles.imageButton}
                onPress={() =>
                  navigation.navigate("GameDetails", {
                    gameId: item.id,
                  })
                }
              >
                <Image
                  source={{ uri: getCoverUrl(item) }}
                  style={styles.resultImage}
                />
              </Pressable>

              <Text
                style={styles.resultText}
                numberOfLines={2}
              >
                {item.name}
              </Text>

              <Text style={styles.resultMeta}>
                {item.total_rating
                  ? `${Math.round(item.total_rating)}%`
                  : "No rating"}

                {item.first_release_date
                  ? ` • ${getYear(item.first_release_date)}`
                  : ""}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    backgroundColor: colors.text,
    color: colors.background,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  iconButtonText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "bold",
  },

  filtersWrapper: {
    flexShrink: 0,
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
    height: 46,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    minWidth: 118,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 0,
    flexShrink: 0,
  },

  filterButtonActive: {
    backgroundColor: colors.border,
  },

  filterButtonText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 14,
  },

  filterButtonTextActive: {
    color: colors.background,
  },

  sortButton: {
    height: 44,
    borderColor: colors.subheading,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    minWidth: 102,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 0,
    flexShrink: 0,
  },

  sortButtonActive: {
    backgroundColor: colors.subheading,
  },

  sortButtonText: {
    color: colors.subheading,
    fontWeight: "bold",
    fontSize: 14,
  },

  sortButtonTextActive: {
    color: colors.background,
  },

  genreHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 14,
  },

  genreToggle: {
    color: colors.link,
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 14,
  },

  utilityRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 8,
    alignItems: "center",
  },

  smallUtilityButton: {
    borderColor: colors.link,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },

  smallUtilityText: {
    color: colors.link,
    fontWeight: "bold",
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },

  genreModal: {
    maxHeight: "75%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: colors.card,
    padding: 16,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "bold",
  },

  modalClose: {
    color: colors.link,
    fontWeight: "bold",
    fontSize: 16,
  },

  modalEmptyText: {
    color: colors.card,
    textAlign: "center",
    marginVertical: 20,
  },

  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 16,
  },

  genreButton: {
    borderColor: colors.card,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 95,
    alignItems: "center",
  },

  genreButtonActive: {
    backgroundColor: colors.card,
  },

  genreButtonText: {
    color: colors.card,
    fontWeight: "bold",
  },

  genreButtonTextActive: {
    color: colors.background,
  },

  clearGenresButton: {
    alignSelf: "flex-start",
  },

  clearGenresText: {
    color: colors.link,
    fontWeight: "bold",
  },

  pageTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "bold",
    marginLeft: 14,
    marginBottom: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    color: colors.text,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 30,
  },

  resultItem: {
    margin: 4,
    alignItems: "center",
    flexGrow: 0,
    flexShrink: 0,
  },

  imageButton: {
    width: "100%",
    alignItems: "center",
  },

  resultImage: {
    width: "100%",
    aspectRatio: 0.72,
    borderRadius: 10,
    backgroundColor: colors.card,
  },

  resultText: {
    color: colors.text,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 12,
  },

  resultMeta: {
    color: colors.subheading,
    marginTop: 3,
    textAlign: "center",
    fontSize: 11,
  },

  suggestionBox: {
    backgroundColor: "#2f2f2f",
    borderColor: colors.card,
    borderWidth: 1,
    borderRadius: 14,
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 12,
  },

  suggestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  suggestionTitle: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 8,
  },

  clearSuggestionText: {
    color: colors.link,
    fontWeight: "bold",
    fontSize: 12,
  },

  suggestionItem: {
    paddingVertical: 8,
    borderTopColor: "#3d3d3d",
    borderTopWidth: 1,
  },

  suggestionText: {
    color: colors.subheading,
    fontSize: 14,
    fontWeight: "600",
  },
});