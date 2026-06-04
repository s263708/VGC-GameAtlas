const placeholderImage =
  "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";

// Converts IGDB cover data into a larger image URL.
export function getCoverUrl(game) {
  if (!game?.cover?.url) {
    return placeholderImage;
  }

  return "https:" + game.cover.url.replace(
    "t_thumb",
    "t_cover_big"
  );
}

export function getScreenshotUrl(screenshot) {
  if (!screenshot?.url) {
    return null;
  }

  return "https:" + screenshot.url.replace(
    "t_thumb",
    "t_screenshot_big"
  );
}

// Used for displaying release years on cards and details pages.
export function formatReleaseDate(timestamp) {
  if (!timestamp) {
    return "Unknown";
  }

  return new Date(
    timestamp * 1000
  ).getFullYear();
}

export function getYear(timestamp) {
  if (!timestamp) {
    return null;
  }

  return new Date(
    timestamp * 1000
  ).getFullYear();
}

// Generates a YouTube thumbnail using the IGDB trailer video ID.
export function getTrailerThumbnail(videoId) {
  if (!videoId) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}