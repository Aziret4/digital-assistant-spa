require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const requestRoutes = require('./routes/requests');
const orderRoutes = require('./routes/orders');
const assistantRoutes = require('./routes/assistant');

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
  : null;

app.use(
  cors({
    origin: allowedOrigins || true,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    console.error('DB check error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/assistant', assistantRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
