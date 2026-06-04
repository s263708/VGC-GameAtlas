import { API_BASE_URL } from "./config";

export async function searchGames(query) {
  const response = await fetch(
    `${API_BASE_URL}/games/search?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Failed to search games");
  }

  return await response.json();
}

export async function getTrendingGames() {
  const response = await fetch(
    `${API_BASE_URL}/games/trending`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load trending games"
    );
  }

  return await response.json();
}

export async function getNewReleases() {
  const response = await fetch(
    `${API_BASE_URL}/games/new-releases`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load new releases"
    );
  }

  return await response.json();
}

export async function getGameDetails(id) {
  const response = await fetch(
    `${API_BASE_URL}/games/${id}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load game details"
    );
  }

  return await response.json();
}

export async function getGameAtlasRating(id) {
  const response = await fetch(
    `${API_BASE_URL}/games/${id}/gameatlas-rating`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load GameAtlas rating"
    );
  }

  return await response.json();
}

export async function getTopRatedGames() {
  const response = await fetch(
    `${API_BASE_URL}/games/top-rated`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load top rated games"
    );
  }

  return data;
}

export async function getUpcomingGames() {
  const response = await fetch(
    `${API_BASE_URL}/games/upcoming`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load upcoming games"
    );
  }

  return data;
}

export async function getHiddenGems() {
  const response = await fetch(
    `${API_BASE_URL}/games/hidden-gems`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load hidden gems"
    );
  }

  return data;
}

export async function getClassicGames() {
  const response = await fetch(
    `${API_BASE_URL}/games/classics`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load classics"
    );
  }

  return data;
}