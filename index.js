const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://localhost:5173'
}));
app.use(express.json()); // parse JSON body

// Create a pool to connect to Postgres
/*const pool = new Pool({
  user: 'postgres',  
  host: 'localhost',
  database: 'tweetanalysis',
  password: 'root',
  port: 5432,
});*/

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:root@localhost:5432/tweetanalysis',
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Create table if it doesn’t exist (optional convenience)
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS tweets (
    id SERIAL PRIMARY KEY,
    tweet_url TEXT NOT NULL,
    tags TEXT[],               -- Array of tags
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;
pool.query(createTableQuery)
    .then(() => console.log("Table 'tweets' is ready."))
    .catch(err => console.error("Error creating table:", err));

// Route: store tweet data
app.post('/api/tweets', async (req, res) => {
  try {
    const { tweetUrl, tags, description } = req.body;

    const insertQuery = `
      INSERT INTO tweets (tweet_url, tags, description)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [tweetUrl, tags, description];
    const result = await pool.query(insertQuery, values);

    return res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error inserting tweet:', error);
    return res.status(500).json({
      success: false,
      error: 'Database error',
    });
  }
});

// Test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
