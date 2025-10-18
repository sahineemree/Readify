// src/app.ts
import express from 'express';
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/booksRoutes';
const app = express();

// Gelen isteklerin JSON formatında olmasını sağlar
app.use(express.json());

// Basit bir test endpoint'i
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Auth rotalarını kullan
app.use('/api/auth', authRoutes);

// Kitap rotalarını kullan
app.use('/api/books', bookRoutes);
export default app;