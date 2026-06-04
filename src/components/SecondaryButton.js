import React from "react";

import {
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { colors } from "../config/global";

export default function SecondaryButton({
  title,
  onPress,
  disabled,
  style,
  textStyle,
}) {
  return (
    <Pressable
      style={[
        styles.button,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderColor: colors.link,
    borderWidth: 1,

    borderRadius: 12,

    paddingVertical: 11,

    alignItems: "center",

    marginTop: 12,
  },

  disabled: {
    opacity: 0.6,
  },

  text: {
    color: colors.link,
    fontWeight: "bold",
  },
});