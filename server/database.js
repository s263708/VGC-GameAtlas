const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./gameatlas.db", (error) => {
  if (error) {
    console.log(error.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      display_name TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      game_name TEXT NOT NULL,
      cover_url TEXT,
      rating INTEGER,
      release_year INTEGER,
      status TEXT DEFAULT 'Playing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(user_id, game_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      game_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      review_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(user_id, game_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS review_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      vote_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(review_id) REFERENCES reviews(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(review_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      game_name TEXT NOT NULL,
      cover_url TEXT,
      release_year INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(user_id, game_id)
    )
  `);
});

module.exports = db;