// Simple validation helpers shared across auth and collection screens.

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password) {
  return password.length >= 6;
}

export function isValidDisplayName(name) {
  const length = name.trim().length;

  return length >= 3 && length <= 15;
}

// Ratings default to a 1–100 scale across GameAtlas.
export function isValidRating(
  rating,
  min = 1,
  max = 100
) {
  const numeric = Number(rating);

  return (
    !isNaN(numeric) &&
    numeric >= min &&
    numeric <= max
  );
}