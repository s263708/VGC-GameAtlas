const API_BASE_URL = "http://192.168.0.178:5000";

export async function searchGames(query) {
  const response = await fetch(
    `${API_BASE_URL}/games/search?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Failed to search games");
  }

  return await response.json();
}