import { API_BASE_URL } from "./config";

export async function createReview(reviewData) {
  const response = await fetch(
    `${API_BASE_URL}/reviews`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(reviewData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to post review"
    );
  }

  return data;
}

// Reviews can be sorted differently depending on the selected filter.
export async function getGameReviews(
  gameId,
  sort = "newest",
  userId = null
) {
  let url = `${API_BASE_URL}/reviews/game/${gameId}?sort=${sort}`;

  if (userId) {
    url += `&userId=${userId}`;
  }

  const response = await fetch(url);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to load reviews"
    );
  }

  return data;
}

export async function getUserReviews(userId) {
  const response = await fetch(
    `${API_BASE_URL}/reviews/user/${userId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load user reviews"
    );
  }

  return data;
}

export async function deleteReview(reviewId) {
  const response = await fetch(
    `${API_BASE_URL}/reviews/${reviewId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to delete review"
    );
  }

  return data;
}

export async function updateReview(
  reviewId,
  reviewData
) {
  const response = await fetch(
    `${API_BASE_URL}/reviews/${reviewId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(reviewData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to update review"
    );
  }

  return data;
}

// Voting lets users mark reviews as helpful or unhelpful.
export async function voteReview(
  reviewId,
  voteData
) {
  const response = await fetch(
    `${API_BASE_URL}/reviews/${reviewId}/vote`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(voteData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to vote on review"
    );
  }

  return data;
}