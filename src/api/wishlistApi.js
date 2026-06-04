import { API_BASE_URL } from "./config";

export async function addGameToWishlist(gameData) {
  const response = await fetch(
    `${API_BASE_URL}/wishlist`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(gameData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to add to wishlist"
    );
  }

  return data;
}

export async function getUserWishlist(userId) {
  const response = await fetch(
    `${API_BASE_URL}/wishlist/${userId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load wishlist"
    );
  }

  return data;
}

// Used to check if the game is already wishlisted.
export async function getWishlistItem(
  userId,
  gameId
) {
  const response = await fetch(
    `${API_BASE_URL}/wishlist/${userId}/game/${gameId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to check wishlist"
    );
  }

  return data;
}

export async function removeWishlistItem(
  wishlistId
) {
  const response = await fetch(
    `${API_BASE_URL}/wishlist/${wishlistId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to remove from wishlist"
    );
  }

  return data;
}