import { API_BASE_URL } from "./config";

// Profile data is used for the user's stats and recent activity.
export async function getProfile(userId) {
  const response = await fetch(
    `${API_BASE_URL}/profile/${userId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load profile");
  }

  return data;
}

// Updates the logged-in user's display name.
// The backend checks that the new name is not already taken.

export async function updateDisplayName(userId, displayName) {
  const response = await fetch(
    `${API_BASE_URL}/profile/${userId}/display-name`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        displayName,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update display name");
  }

  return data;
}

export async function deleteAccount(userId) {
  const response = await fetch(
    `${API_BASE_URL}/profile/${userId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete account");
  }

  return data;
}