import React from "react";

import {
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { colors } from "../config/global";

export default function PrimaryButton({
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
    backgroundColor:
      colors.primaryButton,

    paddingVertical: 14,

    borderRadius: 14,

    alignItems: "center",

    marginTop: 4,
    marginBottom: 14,
  },

  disabled: {
    opacity: 0.6,
  },

  text: {
    color: colors.primaryButtonText,

    fontWeight: "bold",
    fontSize: 16,
  },
});