// server.js — corrected, ready-to-run (CommonJS)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const DB_FILE = path.join(__dirname, 'todos.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database:', DB_FILE);
});

app.use(express.json());
app.use(express.static(path.join(__dirname))); // serve index.html, styles.css, app.js, etc.

// Initialize DB
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error('Failed to create table:', err.message);
    }
  );
});

// GET all tasks
app.get('/api/tasks', (req, res) => {
  db.all('SELECT id, title, done FROM tasks ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const tasks = rows.map((r) => ({ id: r.id, title: r.title, done: r.done === 1 }));
    res.json(tasks);
  });
});

// Create a task
app.post('/api/tasks', (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Title required' });

  db.run('INSERT INTO tasks (title, done) VALUES (?, 0)', [title], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, title });
  });
});

// Update task (title and/or done)
app.put('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  const { title, done } = req.body;

  if (title !== undefined) {
    const t = String(title).trim();
    if (!t) return res.status(400).json({ error: 'Title cannot be empty' });
    db.run('UPDATE tasks SET title = ? WHERE id = ?', [t, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ updated: this.changes });
    });
    return;
  }

  if (done !== undefined) {
    const val = done ? 1 : 0;
    db.run('UPDATE tasks SET done = ? WHERE id = ?', [val, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ updated: this.changes });
    });
    return;
  }

  res.status(400).json({ error: 'No valid fields to update' });
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// graceful shutdown
function shutdown() {
  console.log('Shutting down server...');
  db.close((err) => {
    if (err) console.error('Error closing DB:', err.message);
    else console.log('Closed database.');
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
