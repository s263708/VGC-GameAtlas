import { API_BASE_URL } from "./config";

export async function addGameToCollection(gameData) {
  const response = await fetch(
    `${API_BASE_URL}/collection`,
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
      data.error || "Failed to add game"
    );
  }

  return data;
}

export async function getUserCollection(userId) {
  const response = await fetch(
    `${API_BASE_URL}/collection/${userId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to load collection"
    );
  }

  return data;
}

export async function removeCollectionItem(collectionId) {
  const response = await fetch(
    `${API_BASE_URL}/collection/${collectionId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to remove game"
    );
  }

  return data;
}

export async function updateCollectionStatus(
  collectionId,
  status
) {
  const response = await fetch(
    `${API_BASE_URL}/collection/${collectionId}/status`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ status }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to update status"
    );
  }

  return data;
}

export async function updateCollectionRating(
  collectionId,
  rating
) {
  const response = await fetch(
    `${API_BASE_URL}/collection/${collectionId}/rating`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ rating }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to update rating"
    );
  }

  return data;
}

// Used to check if a game already exists in the user's collection.
export async function getCollectionItem(
  userId,
  gameId
) {
  const response = await fetch(
    `${API_BASE_URL}/collection/${userId}/game/${gameId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to check collection item"
    );
  }

  return data;
}