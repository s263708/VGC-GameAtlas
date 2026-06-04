import React from "react";

import {
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { colors } from "../config/global";

export default function FilterChip({
  title,
  active = false,
  onPress,
  style = {},
  textStyle = {},
  activeStyle = {},
  activeTextStyle = {},
}) {
  return (
    <Pressable
      style={[
        styles.chip,
        style,

        active && styles.chipActive,
        active && activeStyle,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipText,
          textStyle,

          active && styles.chipTextActive,
          active && activeTextStyle,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 42,

    borderColor: colors.border,
    borderWidth: 1,

    borderRadius: 12,

    paddingHorizontal: 16,

    minWidth: 95,

    alignItems: "center",
    justifyContent: "center",

    flexGrow: 0,
    flexShrink: 0,
  },

  chipActive: {
    backgroundColor: colors.border,
  },

  chipText: {
    color: colors.text,

    fontWeight: "bold",
    fontSize: 14,
  },

  chipTextActive: {
    color: colors.background,
  },
});