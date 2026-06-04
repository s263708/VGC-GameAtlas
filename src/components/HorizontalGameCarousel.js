import React from "react";
import {
  ScrollView,
  StyleSheet,
} from "react-native";

import GameCard from "./GameCard";

export default function HorizontalGameCarousel({
  games,
  onGamePress,
  compact = false,
  cardWidth,
  imageHeight,
  contentStyle,
}) {
  if (!games?.length) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        contentStyle,
      ]}
    >
      {/* Shared horizontal carousel used across Home and Game Details. */}
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          compact={compact}
          width={cardWidth}
          imageHeight={imageHeight}
          onPress={() =>
            onGamePress(game)
          }
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingLeft: 20,
    paddingRight: 8,
  },
});