import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../config/global";
import { getCoverUrl, getYear } from "../config/gameUtils";

export default function GameCard({
  game,
  onPress,
  compact = false,
  width,
  imageHeight,
  subtitle,
  style,
}) {
  const cardWidth = width || (compact ? 130 : 148);
  const coverHeight = imageHeight || (compact ? 175 : 200);

  const defaultSubtitle = `${
    game.total_rating
      ? `${Math.round(game.total_rating)}%`
      : "No rating"
  } • ${getYear(game.first_release_date) || "Unknown"}`;

  return (
    <Pressable
      style={[
        styles.gameCard,
        { width: cardWidth },
        style,
      ]}
      onPress={onPress}
    >
      <Image
        source={{ uri: getCoverUrl(game) }}
        style={[
          styles.gameImage,
          { height: coverHeight },
        ]}
      />

      <View style={styles.gameInfoBox}>
        <Text style={styles.gameName} numberOfLines={2}>
          {game.name}
        </Text>

        <Text style={styles.gameInfo}>
          {subtitle || defaultSubtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gameCard: {
    backgroundColor: "#2f2f2f",
    borderColor: "#3d3d3d",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 12,
  },

  gameImage: {
    width: "100%",
    resizeMode: "cover",
    backgroundColor: colors.card,
  },

  gameInfoBox: {
    padding: 10,
  },

  gameName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
  },

  gameInfo: {
    color: colors.subheading,
    fontSize: 12,
    fontWeight: "600",
  },
});