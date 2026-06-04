import { API_BASE_URL } from "./config";

export async function registerUser(
  displayName,
  email,
  password
) {
  const response = await fetch(
    `${API_BASE_URL}/auth/register`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        displayName,
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Registration failed"
    );
  }

  return data;
}

export async function loginUser(
  email,
  password
) {
  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Login failed"
    );
  }

  return data;
}