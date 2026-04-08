require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const connectDB = require('./config/db');
const auth = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const householdRoutes = require('./routes/household');
const recipeRoutes = require('./routes/recipeRoutes');

const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

connectDB();

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/household', householdRoutes);
app.use('/api/shopping-lists', require('./routes/shoppingRoutes'));
app.use('/api/user', require('./routes/user'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/recipes', recipeRoutes);

// --- ML RECOMMEND PROXY ROUTE (Fix #1) ---
// Frontend calls GET /api/recommend?ingredients=tomato,egg,milk
// This proxies to FastAPI ML service on port 8000
app.get('/api/recommend', auth, async (req, res) => {
  try {
    const { ingredients } = req.query;

    if (!ingredients || ingredients.trim() === '') {
      return res.status(400).json({ message: 'No ingredients provided' });
    }

    const ingredientList = ingredients.split(',').map(i => i.trim()).filter(Boolean);

    if (ingredientList.length === 0) {
      return res.status(400).json({ message: 'No valid ingredients provided' });
    }

    const response = await axios.post(
      `${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/recipes/suggest`,
      {
        ingredients: ingredientList,
        mode: 'maximize_fridge'
      },
      { timeout: 15000 }
    );

    // Return full results array so frontend can do res.data.results[0]
    res.json({ results: response.data.results || [] });

  } catch (err) {
    console.error('ML proxy error:', err.message);

    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'ML service is not running. Start FastAPI on port 8000.'
      });
    }

    res.status(500).json({ message: 'ML service error. Please try again.' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('PantryAI API is running...');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));