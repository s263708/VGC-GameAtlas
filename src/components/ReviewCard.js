import React from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "../config/global";

export default function ReviewCard({
  review,
  isOwnReview,
  editingReviewId,
  editReviewText,
  setEditReviewText,
  startEditingReview,
  cancelEditingReview,
  handleUpdateReview,
  handleDeleteReview,
  handleVoteReview,
  onAuthorPress,
}) {
  const isEditing = editingReviewId === review.id;

  function handleAuthorPress() {
    if (onAuthorPress && review.user_id) {
      onAuthorPress(review.user_id);
    }
  }

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeaderRow}>
        <Pressable
          onPress={handleAuthorPress}
          disabled={!onAuthorPress || !review.user_id}
        >
          <Text
            style={[
              styles.reviewAuthor,
              onAuthorPress && styles.reviewAuthorLink,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {review.display_name}
          </Text>
        </Pressable>

        {isOwnReview ? (
          <Text style={styles.yourReviewBadge}>Your Review</Text>
        ) : null}
      </View>

      <Text style={styles.reviewRating}>
        Collection Rating: {review.collection_rating ?? 0}/100
      </Text>

      {isEditing ? (
        <>
          <TextInput
            style={styles.editReviewInput}
            value={editReviewText}
            onChangeText={setEditReviewText}
            placeholder="Edit your review..."
            placeholderTextColor={colors.card}
            multiline
          />

          <View style={styles.reviewActionRow}>
            <Pressable
              style={styles.saveReviewButton}
              onPress={() => handleUpdateReview(review.id)}
            >
              <Text style={styles.saveReviewButtonText}>Save</Text>
            </Pressable>

            <Pressable
              style={styles.cancelReviewButton}
              onPress={cancelEditingReview}
            >
              <Text style={styles.cancelReviewButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Text style={styles.bodyText}>{review.review_text}</Text>
      )}

      <Text style={styles.reviewDate}>
        {new Date(review.created_at).toLocaleDateString()}
      </Text>

      {/* Helpful/unhelpful voting system for community reviews. */}
      <View style={styles.voteRow}>
        <Pressable
          style={styles.voteButton}
          onPress={() => handleVoteReview(review.id, "like")}
        >
          <Text style={styles.voteButtonText}>
            👍 {review.like_count || 0}
          </Text>
        </Pressable>

        <Pressable
          style={styles.voteButton}
          onPress={() => handleVoteReview(review.id, "dislike")}
        >
          <Text style={styles.voteButtonText}>
            👎 {review.dislike_count || 0}
          </Text>
        </Pressable>
      </View>

      {isOwnReview && !isEditing ? (
        <View style={styles.reviewActionRow}>
          <Pressable
            style={styles.editReviewButton}
            onPress={() => startEditingReview(review)}
          >
            <Text style={styles.editReviewButtonText}>Edit Review</Text>
          </Pressable>

          <Pressable
            style={styles.deleteReviewButton}
            onPress={() => handleDeleteReview(review.id)}
          >
            <Text style={styles.deleteReviewButtonText}>Delete Review</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  reviewCard: {
    backgroundColor: "#292929",
    borderColor: "#404040",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },

  reviewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  reviewAuthor: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 2,
    flex: 1,
    marginRight: 6,
  },

  reviewAuthorLink: {
    color: colors.link,
  },

  yourReviewBadge: {
    color: colors.background,
    backgroundColor: colors.subheading,
    fontSize: 11,
    fontWeight: "bold",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 20,
    overflow: "hidden",
    flexShrink: 0,
  },

  reviewRating: {
    color: colors.subheading,
    fontWeight: "bold",
    marginBottom: 10,
  },

  bodyText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
  },

  reviewDate: {
    color: colors.card,
    fontSize: 11,
    marginTop: 12,
  },

  voteRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  voteButton: {
    borderColor: colors.subheading,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },

  voteButtonText: {
    color: colors.subheading,
    fontWeight: "bold",
  },

  reviewActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  editReviewButton: {
    flex: 1,
    borderColor: colors.subheading,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },

  editReviewButtonText: {
    color: colors.subheading,
    fontWeight: "bold",
  },

  deleteReviewButton: {
    flex: 1,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },

  deleteReviewButtonText: {
    color: colors.text,
    fontWeight: "bold",
  },

  editReviewInput: {
    backgroundColor: colors.text,
    color: colors.background,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
  },

  saveReviewButton: {
    flex: 1,
    backgroundColor: colors.subheading,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },

  saveReviewButtonText: {
    color: colors.background,
    fontWeight: "bold",
  },

  cancelReviewButton: {
    flex: 1,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },

  cancelReviewButtonText: {
    color: colors.text,
    fontWeight: "bold",
  },
});