const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

let accessToken = null;

async function getAccessToken() {
  const response = await axios.post("https://id.twitch.tv/oauth2/token", null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    },
  });

  accessToken = response.data.access_token;
  return accessToken;
}

async function igdbRequest(endpoint, query) {
  if (!accessToken) {
    await getAccessToken();
  }

  const response = await axios.post(
    `https://api.igdb.com/v4/${endpoint}`,
    query,
    {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  return response.data;
}

app.get("/", (req, res) => {
  res.send("GameAtlas API is running");
});

app.get("/games/search", async (req, res) => {
  try {
    const { query } = req.query;

    const games = await igdbRequest(
      "games",
      `
      search "${query}";
      fields id,name,summary,cover.url,first_release_date,genres.name,platforms.name,total_rating;
      limit 20;
      `
    );

    res.json(games);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to search games" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});