import React from "react";

import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../config/global";

export default function SectionHeader({
  title,
  subtitle,
  style,
  titleStyle,
  subtitleStyle,
}) {
  return (
    <View
      style={[
        styles.sectionHeader,
        style,
      ]}
    >
      <Text
        style={[
          styles.sectionTitle,
          titleStyle,
        ]}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={[
            styles.sectionSubtitle,
            subtitleStyle,
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  sectionTitle: {
    color: colors.text,

    fontSize: 23,
    fontWeight: "bold",
  },

  sectionSubtitle: {
    color: colors.card,

    fontSize: 13,

    marginTop: 3,
  },
});