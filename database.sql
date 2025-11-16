-- Optional: create a file to initialize a DB using sqlite3 CLI
CREATE TABLE IF NOT EXISTS tasks (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NOT NULL,
done INTEGER NOT NULL DEFAULT 0,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO tasks (title, done) VALUES ('Welcome to your Todo list', 0);