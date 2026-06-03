import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whise_mkt';

// Connection options
const options: mongoose.ConnectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
};

// Connection state
let isConnected = false;

// Connect to MongoDB
export async function connectDB(): Promise<void> {
  if (isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    console.log('Connecting to MongoDB...');
    const connection = await mongoose.connect(MONGODB_URI, options);
    
    isConnected = true;
    console.log(`MongoDB connected successfully: ${connection.connection.host}`);
    
    // Connection events
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB connection disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('close', () => {
      console.log('MongoDB connection closed');
      isConnected = false;
    });

    // Enable debug mode in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Disconnect from MongoDB
export async function disconnectDB(): Promise<void> {
  if (!isConnected) {
    console.log('Not connected to MongoDB');
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('Failed to disconnect from MongoDB:', error);
    process.exit(1);
  }
}

// Get connection status
export function getConnectionStatus(): boolean {
  return isConnected;
}

// Graceful shutdown
export function gracefulShutdown(): void {
  console.log('Starting graceful shutdown...');
  
  // Close MongoDB connection
  disconnectDB().then(() => {
    console.log('MongoDB connection closed during shutdown');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle process signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGQUIT', gracefulShutdown);

export default { connectDB, disconnectDB, getConnectionStatus };
