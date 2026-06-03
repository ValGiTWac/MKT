import { Handler, Context, APIGatewayProxyEvent } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database';

// Load environment variables
dotenv.config();

// Connect to database
connectDB().catch((error) => {
  console.error('Database connection error:', error);
  process.exit(1);
});

// Import routes
import authRoutes from './handlers/auth';
import postRoutes from './handlers/posts';
import translationRoutes from './handlers/translations';
import validationRoutes from './handlers/validations';
import asanaRoutes from './handlers/asana';
import bufferRoutes from './handlers/buffer';
import mistralRoutes from './handlers/mistral';
import userRoutes from './handlers/users';

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0' 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/validations', validationRoutes);
app.use('/api/asana', asanaRoutes);
app.use('/api/buffer', bufferRoutes);
app.use('/api/mistral', mistralRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong' 
  });
});

// Export for Netlify Functions
const handler: Handler = serverless(app);

export { handler };

// For local development
export default app;
