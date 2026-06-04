const express = require("express");
const cors = require("cors");
const axios = require("axios");
const db = require("./database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "temporary_gameatlas_secret";

let accessToken = null;

async function getAccessToken() {
  const response = await axios.post(
    "https://id.twitch.tv/oauth2/token",
    null,
    {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials",
      },
    }
  );

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
    const { query = "" } = req.query;

    const cleanedQuery = query
      .replace(/[-_:]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const games = await igdbRequest(
      "games",
      `
      search "${cleanedQuery}";
      fields id,name,summary,cover.url,first_release_date,genres.name,platforms.name,total_rating,total_rating_count;
      where cover != null;
      limit 50;
      `
    );

    res.json(games);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to search games" });
  }
});

app.get("/games/trending", async (req, res) => {
  try {
    const games = await igdbRequest(
      "games",
      `
      fields id,name,summary,cover.url,first_release_date,genres.name,platforms.name,total_rating,total_rating_count,hypes;
      where cover != null & total_rating_count > 100 & total_rating != null;
      sort total_rating_count desc;
      limit 10;
      `
    );

    res.json(games);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to load trending games" });
  }
});

app.get("/games/new-releases", async (req, res) => {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const games = await igdbRequest(
      "games",
      `
      fields id,name,summary,cover.url,first_release_date,genres.name,platforms.name,total_rating;
      where first_release_date < ${currentTimestamp} & cover != null;
      sort first_release_date desc;
      limit 10;
      `
    );

    res.json(games);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to load new releases" });
  }
});

app.get("/games/top-rated", async (req, res) => {
  try {
    const games = await igdbRequest(
      "games",
      `
      fields id,name,summary,cover.url,first_release_date,genres.name,platforms.name,total_rating,total_rating_count;
      where cover != null & total_rating_count > 100 & total_rating != null;
      sort total_rating desc;
      limit 20;
      `
    );

    res.json(games);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to load top rated games" });
  }
});

app.get("/games/upcoming", async (req, res) => {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const games = await igdbRequest(
      "games",
      `
      fields id,name,summary,cover.url,first_release_date,genres.name,platforms.name,total_rating,total_rating_count,hypes;
      where first_release_date > ${currentTimestamp} & cover != null;
      sort first_release_date asc;
      limit 20;
      `
    );

    res.json(games);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to load upcoming games" });
  }
});

app.get("/games/hidden-gems", async (req, res) => {
  try {
    const games = await igdbRequest(
      "games",
      `
      fields id,name,summary,cover.url,first_release_date,genres.name,platforms.name,total_rating,total_rating_count;
      where cover != null & total_rating != null & total_rating >= 75 & total_rating_count > 5 & total_rating_count < 300;
      sort total_rating desc;
      limit 20;
      `
    );

    res.json(games);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to load hidden gems" });
  }
});

app.get("/games/classics", async (req, res) => {
  try {
    const classicTimestamp = 978307200;

    const games = await igdbRequest(
      "games",
      `
      fields id,name,summary,cover.url,first_release_date,genres.name,platforms.name,total_rating,total_rating_count;
      where cover != null & first_release_date < ${classicTimestamp} & total_rating_count > 50;
      sort total_rating_count desc;
      limit 20;
      `
    );

    res.json(games);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to load classics" });
  }
});

app.get("/games/:id/gameatlas-rating", (req, res) => {
  const { id } = req.params;

  db.get(
    `
    SELECT
      ROUND(AVG(rating)) AS average_rating,
      COUNT(rating) AS rating_count
    FROM collections
    WHERE game_id = ?
    `,
    [id],
    (error, row) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to load GameAtlas rating",
        });
      }

      res.json({
        averageRating: row.average_rating || 0,
        ratingCount: row.rating_count || 0,
      });
    }
  );
});

app.get("/games/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const game = await igdbRequest(
      "games",
      `
      fields
      id,
      name,
      summary,
      storyline,
      cover.url,
      first_release_date,
      genres.name,
      platforms.name,
      total_rating,
      total_rating_count,
      involved_companies.company.name,
      websites.url,
      websites.category,
      screenshots.url,
      videos.video_id,
      similar_games.name,
      similar_games.cover.url,
      similar_games.total_rating,
      similar_games.first_release_date,
      similar_games.platforms.name;

      where id = ${id};
      limit 1;
      `
    );

    res.json(game[0] || null);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to load game details" });
  }
});

app.post("/auth/register", async (req, res) => {
  try {
    const { displayName, email, password } = req.body;

    if (!displayName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (displayName.trim().length < 3 || displayName.trim().length > 15) {
      return res.status(400).json({
        error: "Display name must be between 3 and 15 characters",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    db.run(
      `
      INSERT INTO users (display_name, email, password_hash)
      VALUES (?, ?, ?)
      `,
      [displayName, email.toLowerCase(), passwordHash],
      function (error) {
        if (error) {
          if (error.message.includes("users.email")) {
            return res.status(409).json({
              error: "Email already registered",
            });
          }

          if (error.message.includes("users.display_name")) {
            return res.status(409).json({
              error: "Display name already taken",
            });
          }

          if (error.message.includes("UNIQUE")) {
            return res.status(409).json({
              error: "Account details already in use",
            });
          }

          return res.status(500).json({
            error: "Failed to register user",
          });
        }

        const user = {
          id: this.lastID,
          displayName,
          email: email.toLowerCase(),
        };

        const token = jwt.sign(user, JWT_SECRET, {
          expiresIn: "7d",
        });

        res.status(201).json({
          message: "User registered successfully",
          user,
          token,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    db.get(
      `
      SELECT *
      FROM users
      WHERE email = ?
      `,
      [email.toLowerCase()],
      async (error, userRow) => {
        if (error) {
          return res.status(500).json({ error: "Login failed" });
        }

        if (!userRow) {
          return res.status(401).json({
            error: "Invalid email or password",
          });
        }

        const passwordMatches = await bcrypt.compare(
          password,
          userRow.password_hash
        );

        if (!passwordMatches) {
          return res.status(401).json({
            error: "Invalid email or password",
          });
        }

        const user = {
          id: userRow.id,
          displayName: userRow.display_name,
          email: userRow.email,
        };

        const token = jwt.sign(user, JWT_SECRET, {
          expiresIn: "7d",
        });

        res.json({
          message: "Login successful",
          user,
          token,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/collection", (req, res) => {
  const {
    userId,
    gameId,
    gameName,
    coverUrl,
    rating,
    releaseYear,
    status,
  } = req.body;

  if (!userId || !gameId || !gameName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.run(
    `
    INSERT INTO collections
    (user_id, game_id, game_name, cover_url, rating, release_year, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      gameId,
      gameName,
      coverUrl,
      rating,
      releaseYear,
      status || "Playing",
    ],
    function (error) {
      if (error) {
        if (error.message.includes("UNIQUE")) {
          return res.status(409).json({
            error: "Game is already in your collection",
          });
        }

        return res.status(500).json({
          error: "Failed to add to collection",
        });
      }

      res.status(201).json({
        message: "Game added to collection",
        collectionId: this.lastID,
      });
    }
  );
});

app.get("/collection/:userId", (req, res) => {
  const { userId } = req.params;

  db.all(
    `
    SELECT *
    FROM collections
    WHERE user_id = ?
    ORDER BY created_at DESC
    `,
    [userId],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to load collection",
        });
      }

      res.json(rows);
    }
  );
});

app.get("/collection/:userId/game/:gameId", (req, res) => {
  const { userId, gameId } = req.params;

  db.get(
    `
    SELECT *
    FROM collections
    WHERE user_id = ? AND game_id = ?
    `,
    [userId, gameId],
    (error, row) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to check collection",
        });
      }

      res.json(row || null);
    }
  );
});

app.put("/collection/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["Playing", "Completed", "Backlog"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.run(
    `
    UPDATE collections
    SET status = ?
    WHERE id = ?
    `,
    [status, id],
    function (error) {
      if (error) {
        return res.status(500).json({
          error: "Failed to update status",
        });
      }

      res.json({ message: "Status updated" });
    }
  );
});

app.put("/collection/:id/rating", (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;

  if (rating !== null && (rating < 1 || rating > 100)) {
    return res.status(400).json({
      error: "Rating must be between 1 and 100",
    });
  }

  db.run(
    `
    UPDATE collections
    SET rating = ?
    WHERE id = ?
    `,
    [rating, id],
    function (error) {
      if (error) {
        return res.status(500).json({
          error: "Failed to update rating",
        });
      }

      res.json({ message: "Rating updated" });
    }
  );
});

app.delete("/collection/:id", (req, res) => {
  const { id } = req.params;

  db.run(
    `
    DELETE FROM collections
    WHERE id = ?
    `,
    [id],
    function (error) {
      if (error) {
        return res.status(500).json({
          error: "Failed to remove game",
        });
      }

      res.json({ message: "Game removed from collection" });
    }
  );
});

app.post("/wishlist", (req, res) => {
  const { userId, gameId, gameName, coverUrl, releaseYear } = req.body;

  if (!userId || !gameId || !gameName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.run(
    `
    INSERT INTO wishlist
    (user_id, game_id, game_name, cover_url, release_year)
    VALUES (?, ?, ?, ?, ?)
    `,
    [userId, gameId, gameName, coverUrl, releaseYear],
    function (error) {
      if (error) {
        if (error.message.includes("UNIQUE")) {
          return res.status(409).json({
            error: "Game is already in your wishlist",
          });
        }

        return res.status(500).json({
          error: "Failed to add to wishlist",
        });
      }

      res.status(201).json({
        message: "Game added to wishlist",
        wishlistId: this.lastID,
      });
    }
  );
});

app.get("/wishlist/:userId", (req, res) => {
  const { userId } = req.params;

  db.all(
    `
    SELECT *
    FROM wishlist
    WHERE user_id = ?
    ORDER BY created_at DESC
    `,
    [userId],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to load wishlist",
        });
      }

      res.json(rows);
    }
  );
});

app.get("/wishlist/:userId/game/:gameId", (req, res) => {
  const { userId, gameId } = req.params;

  db.get(
    `
    SELECT *
    FROM wishlist
    WHERE user_id = ? AND game_id = ?
    `,
    [userId, gameId],
    (error, row) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to check wishlist",
        });
      }

      res.json(row || null);
    }
  );
});

app.delete("/wishlist/:id", (req, res) => {
  const { id } = req.params;

  db.run(
    `
    DELETE FROM wishlist
    WHERE id = ?
    `,
    [id],
    function (error) {
      if (error) {
        return res.status(500).json({
          error: "Failed to remove from wishlist",
        });
      }

      res.json({ message: "Removed from wishlist" });
    }
  );
});

app.post("/reviews", (req, res) => {
  const { userId, gameId, gameName, reviewText } = req.body;

  if (!userId || !gameId || !gameName || !reviewText) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.get(
    `
    SELECT rating
    FROM collections
    WHERE user_id = ? AND game_id = ?
    `,
    [userId, gameId],
    (collectionError, collectionRow) => {
      if (collectionError) {
        return res.status(500).json({
          error: "Failed to check collection rating",
        });
      }

      if (!collectionRow || collectionRow.rating === null) {
        return res.status(400).json({
          error: "Add a rating to this game in your collection before reviewing it",
        });
      }

      db.run(
        `
        INSERT INTO reviews
        (user_id, game_id, game_name, rating, review_text)
        VALUES (?, ?, ?, ?, ?)
        `,
        [userId, gameId, gameName, collectionRow.rating, reviewText],
        function (error) {
          if (error) {
            if (error.message.includes("UNIQUE")) {
              return res.status(409).json({
                error: "You have already reviewed this game",
              });
            }

            return res.status(500).json({
              error: "Failed to create review",
            });
          }

          res.status(201).json({
            message: "Review posted successfully",
            reviewId: this.lastID,
          });
        }
      );
    }
  );
});

app.get("/reviews/game/:gameId", (req, res) => {
  const { gameId } = req.params;
  const { sort, userId } = req.query;

  let orderBy = "reviews.created_at DESC";

  if (sort === "oldest") {
    orderBy = "reviews.created_at ASC";
  }

  if (sort === "highest") {
    orderBy = "collections.rating DESC";
  }

  if (sort === "lowest") {
    orderBy = "collections.rating ASC";
  }

  if (sort === "liked") {
    orderBy = "like_count DESC";
  }

  if (sort === "disliked") {
    orderBy = "dislike_count DESC";
  }

  db.all(
    `
    SELECT
      reviews.id,
      reviews.user_id,
      reviews.game_id,
      reviews.game_name,
      reviews.review_text,
      reviews.created_at,
      users.display_name,
      collections.rating AS collection_rating,

      SUM(CASE WHEN review_votes.vote_type = 'like' THEN 1 ELSE 0 END)
        AS like_count,

      SUM(CASE WHEN review_votes.vote_type = 'dislike' THEN 1 ELSE 0 END)
        AS dislike_count

    FROM reviews

    JOIN users
      ON reviews.user_id = users.id

    LEFT JOIN collections
      ON reviews.user_id = collections.user_id
      AND reviews.game_id = collections.game_id

    LEFT JOIN review_votes
      ON reviews.id = review_votes.review_id

    WHERE reviews.game_id = ?

    GROUP BY reviews.id

    ORDER BY
      CASE
        WHEN reviews.user_id = ? THEN 0
        ELSE 1
      END,
      ${orderBy}
    `,
    [gameId, userId || -1],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to load reviews",
        });
      }

      res.json(rows);
    }
  );
});

app.get("/reviews/user/:userId", (req, res) => {
  const { userId } = req.params;

  db.all(
    `
    SELECT
      reviews.id,
      reviews.user_id,
      reviews.game_id,
      reviews.game_name,
      reviews.review_text,
      reviews.created_at,
      collections.rating AS collection_rating
    FROM reviews
    LEFT JOIN collections
      ON reviews.user_id = collections.user_id
      AND reviews.game_id = collections.game_id
    WHERE reviews.user_id = ?
    ORDER BY reviews.created_at DESC
    `,
    [userId],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to load user reviews",
        });
      }

      res.json(rows);
    }
  );
});

app.put("/reviews/:reviewId", (req, res) => {
  const { reviewId } = req.params;
  const { userId, reviewText } = req.body;

  if (!userId || !reviewText) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.run(
    `
    UPDATE reviews
    SET review_text = ?
    WHERE id = ? AND user_id = ?
    `,
    [reviewText, reviewId, userId],
    function (error) {
      if (error) {
        return res.status(500).json({
          error: "Failed to update review",
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Review not found" });
      }

      res.json({ message: "Review updated" });
    }
  );
});

app.post("/reviews/:reviewId/vote", (req, res) => {
  const { reviewId } = req.params;
  const { userId, voteType } = req.body;

  if (!userId || !voteType) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!["like", "dislike"].includes(voteType)) {
    return res.status(400).json({ error: "Invalid vote type" });
  }

  db.get(
    `
    SELECT *
    FROM review_votes
    WHERE review_id = ? AND user_id = ?
    `,
    [reviewId, userId],
    (checkError, existingVote) => {
      if (checkError) {
        return res.status(500).json({ error: "Failed to check vote" });
      }

      if (existingVote) {
        db.run(
          `
          UPDATE review_votes
          SET vote_type = ?
          WHERE review_id = ? AND user_id = ?
          `,
          [voteType, reviewId, userId],
          function (updateError) {
            if (updateError) {
              return res.status(500).json({
                error: "Failed to update vote",
              });
            }

            res.json({ message: "Vote updated" });
          }
        );
      } else {
        db.run(
          `
          INSERT INTO review_votes
          (review_id, user_id, vote_type)
          VALUES (?, ?, ?)
          `,
          [reviewId, userId, voteType],
          function (insertError) {
            if (insertError) {
              return res.status(500).json({
                error: "Failed to add vote",
              });
            }

            res.json({ message: "Vote added" });
          }
        );
      }
    }
  );
});

app.delete("/reviews/:reviewId", (req, res) => {
  const { reviewId } = req.params;

  db.run(
    `
    DELETE FROM reviews
    WHERE id = ?
    `,
    [reviewId],
    function (error) {
      if (error) {
        return res.status(500).json({
          error: "Failed to delete review",
        });
      }

      res.json({ message: "Review deleted" });
    }
  );
});

app.put("/profile/:userId/display-name", (req, res) => {
  const { userId } = req.params;
  const { displayName } = req.body;

  if (
      !displayName ||
      displayName.trim().length < 3 ||
      displayName.trim().length > 15
    ) {
    return res.status(400).json({
      error: "Display name must be between 3 and 15 characters",
    });
  }

  const cleanedDisplayName = displayName.trim();

  db.run(
    `
    UPDATE users
    SET display_name = ?
    WHERE id = ?
    `,
    [cleanedDisplayName, userId],
    function (error) {
      if (error) {
        if (
          error.message.includes("users.display_name") ||
          error.message.includes("UNIQUE")
        ) {
          return res.status(409).json({
            error: "Display name already taken",
          });
        }

        return res.status(500).json({
          error: "Failed to update display name",
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      res.json({
        message: "Display name updated",
        displayName: cleanedDisplayName,
      });
    }
  );
});

app.delete("/profile/:userId", (req, res) => {
  const { userId } = req.params;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.run(
      `
      DELETE FROM review_votes
      WHERE user_id = ?
         OR review_id IN (
           SELECT id FROM reviews WHERE user_id = ?
         )
      `,
      [userId, userId]
    );

    db.run(
      `
      DELETE FROM reviews
      WHERE user_id = ?
      `,
      [userId]
    );

    db.run(
      `
      DELETE FROM wishlist
      WHERE user_id = ?
      `,
      [userId]
    );

    db.run(
      `
      DELETE FROM collections
      WHERE user_id = ?
      `,
      [userId]
    );

    db.run(
      `
      DELETE FROM users
      WHERE id = ?
      `,
      [userId],
      function (error) {
        if (error) {
          db.run("ROLLBACK");

          return res.status(500).json({
            error: "Failed to delete account",
          });
        }

        if (this.changes === 0) {
          db.run("ROLLBACK");

          return res.status(404).json({
            error: "User not found",
          });
        }

        db.run("COMMIT");

        res.json({
          message: "Account deleted successfully",
        });
      }
    );
  });
});

app.get("/profile/:userId", (req, res) => {
  const { userId } = req.params;

  db.get(
    `
    SELECT
      users.id,
      users.display_name,
      users.email,
      users.created_at,
      COUNT(DISTINCT collections.id) AS collection_count,
      COUNT(DISTINCT reviews.id) AS review_count
    FROM users
    LEFT JOIN collections
      ON users.id = collections.user_id
    LEFT JOIN reviews
      ON users.id = reviews.user_id
    WHERE users.id = ?
    GROUP BY users.id
    `,
    [userId],
    (error, profile) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to load profile",
        });
      }

      res.json(profile);
    }
  );
});

app.get("/profile/public/:userId/top-games", (req, res) => {
  const { userId } = req.params;

  db.all(
    `
    SELECT
      id,
      game_id,
      game_name,
      cover_url,
      rating,
      release_year,
      status,
      created_at
    FROM collections
    WHERE user_id = ?
      AND rating IS NOT NULL
    ORDER BY rating DESC, created_at DESC
    LIMIT 5
    `,
    [userId],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to load top games",
        });
      }

      res.json(rows);
    }
  );
});

/*
  Public profile endpoints deliberately avoid returning private data like email.
  These power the public profile screen without adding a full friends system.
*/

app.get("/profile/public/:userId", (req, res) => {
  const { userId } = req.params;

  db.get(
    `
    SELECT
      users.id,
      users.display_name,
      users.created_at,
      COUNT(DISTINCT collections.id) AS collection_count,
      COUNT(DISTINCT wishlist.id) AS wishlist_count,
      COUNT(DISTINCT reviews.id) AS review_count,
      ROUND(AVG(collections.rating)) AS average_rating
    FROM users
    LEFT JOIN collections
      ON users.id = collections.user_id
    LEFT JOIN wishlist
      ON users.id = wishlist.user_id
    LEFT JOIN reviews
      ON users.id = reviews.user_id
    WHERE users.id = ?
    GROUP BY users.id
    `,
    [userId],
    (error, profile) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to load public profile",
        });
      }

      if (!profile) {
        return res.status(404).json({
          error: "Profile not found",
        });
      }

      res.json({
        ...profile,
        average_rating: profile.average_rating || 0,
      });
    }
  );
});

app.get("/profile/public/:userId/collection", (req, res) => {
  const { userId } = req.params;

  db.all(
    `
    SELECT
      id,
      game_id,
      game_name,
      cover_url,
      rating,
      release_year,
      status,
      created_at
    FROM collections
    WHERE user_id = ?
    ORDER BY
      CASE WHEN rating IS NULL THEN 1 ELSE 0 END,
      rating DESC,
      created_at DESC
    LIMIT 20
    `,
    [userId],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to load public collection",
        });
      }

      res.json(rows);
    }
  );
});

app.get("/profile/public/:userId/wishlist", (req, res) => {
  const { userId } = req.params;

  db.all(
    `
    SELECT
      id,
      game_id,
      game_name,
      cover_url,
      release_year,
      created_at
    FROM wishlist
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
    `,
    [userId],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to load public wishlist",
        });
      }

      res.json(rows);
    }
  );
});

app.get("/profile/public/:userId/reviews", (req, res) => {
  const { userId } = req.params;

  db.all(
    `
    SELECT
      reviews.id,
      reviews.user_id,
      reviews.game_id,
      reviews.game_name,
      reviews.review_text,
      reviews.created_at,
      collections.rating AS collection_rating
    FROM reviews
    LEFT JOIN collections
      ON reviews.user_id = collections.user_id
      AND reviews.game_id = collections.game_id
    WHERE reviews.user_id = ?
    ORDER BY reviews.created_at DESC
    LIMIT 20
    `,
    [userId],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          error: "Failed to load public reviews",
        });
      }

      res.json(rows);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});