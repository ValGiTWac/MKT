import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes';
import postRoutes from './routes/postRoutes';
import mistralRoutes from './routes/mistralRoutes';
import bufferRoutes from './routes/bufferRoutes';
import asanaRoutes from './routes/asanaRoutes';
import userRoutes from './routes/userRoutes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { connectDB } from './config/database';

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'WHISE MKT API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/mistral', mistralRoutes);
app.use('/api/buffer', bufferRoutes);
app.use('/api/asana', asanaRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use(errorHandler);

// Export for Netlify Functions
export const handler = serverless(app);
export default app;
