const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors    = require('cors');
const connectDB       = require('./src/config/db');
const { startSLAService } = require('./src/config/slaService');


connectDB();

const app = express();

// ─── CORS Configuration (Production-ready) ──────────────────────────────────
const corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// ─── Request timeout middleware (prevent hanging requests) ──────────────────
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000);
  next();
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'PS-CRM API is running!' });
});

// ─── Health check with DB status ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    backend: 'running',
    timestamp: new Date().toISOString()
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes       = require('./src/routes/authRoutes');
const complaintRoutes  = require('./src/routes/complaintRoutes');
const dashboardRoutes  = require('./src/routes/dashboardRoutes');
const feedbackRoutes   = require('./src/routes/feedbackRoutes');
const chatbotRoutes = require('./src/routes/chatbotRoutes');
const heatmapRoutes = require('./src/routes/heatmapRoutes');

app.use('/api/auth',       authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/feedback',   feedbackRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/heatmap', heatmapRoutes);

// ─── Error handling middleware ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const { startWhatsAppBot } = require('./src/config/whatsappBot');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  startSLAService();
  startWhatsAppBot();  // WhatsApp bot enabled with QR code
});
