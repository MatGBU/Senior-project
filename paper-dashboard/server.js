// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5001; //IT IS CHANGED FROM 5000

app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());


// Initialize SQLite database
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Could not connect to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create the users table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )
`);

// Registration endpoint
app.post('http://10.193.84.131:5001/api/register', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Hash the password
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    
    // Insert the new user into the database
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    stmt.run(email, hash, function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      return res.json({ message: 'Registration successful' });
    });
  });
});

// Login endpoint
app.post('http://10.193.84.131:5001/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Query the user from the database
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    // Compare the password using bcrypt
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        return res.json({ message: 'Login successful' });
      } else {
        return res.status(400).json({ error: 'Invalid email or password' });
      }
    });
  });
});

const path = require('path');

// Serve frontend files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle React/Vue single-page applications (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
