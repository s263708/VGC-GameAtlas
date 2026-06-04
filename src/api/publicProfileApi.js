import { API_BASE_URL } from "./config";

// Loads the main public-facing profile information.
export async function getPublicProfile(userId) {
  const response = await fetch(
    `${API_BASE_URL}/profile/public/${userId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load public profile"
    );
  }

  return data;
}

// Returns a preview of the user's collection.
export async function getPublicProfileCollection(
  userId
) {
  const response = await fetch(
    `${API_BASE_URL}/profile/public/${userId}/collection`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load public collection"
    );
  }

  return data;
}

export async function getPublicProfileWishlist(
  userId
) {
  const response = await fetch(
    `${API_BASE_URL}/profile/public/${userId}/wishlist`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load public wishlist"
    );
  }

  return data;
}

// Public reviews shown on another user's profile.
export async function getPublicProfileReviews(
  userId
) {
  const response = await fetch(
    `${API_BASE_URL}/profile/public/${userId}/reviews`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load public reviews"
    );
  }

  return data;
}

export async function getPublicProfileTopGames(userId) {
  const response = await fetch(
    `${API_BASE_URL}/profile/public/${userId}/top-games`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load top games");
  }

  return data;
}