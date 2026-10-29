import mongoose from 'mongoose';
import { logger } from './logger.js';

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jandastavej';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected to database: ${conn.connection.name}`);
    return conn;
  } catch (err) {
    logger.error({ err }, 'MongoDB connection error');
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
