import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './db.js';
import { logger } from './logger.js';

describe('database configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.MONGODB_URI;
    delete process.env.MONGO_URI;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('connects and logs database name on success', async () => {
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/jandastavej_demo';
    const infoLogSpy = vi.spyOn(logger, 'info').mockImplementation(() => logger);

    vi.spyOn(mongoose, 'connect').mockResolvedValue({
      connection: { name: 'jandastavej_demo' },
    } as unknown as typeof mongoose);

    await connectDB();

    expect(infoLogSpy).toHaveBeenCalledWith('MongoDB connected to database: jandastavej_demo');
  });

  it('logs and rethrows connection errors', async () => {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/bad';
    const errorLogSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);

    const err = new Error('connect ECONNREFUSED');
    vi.spyOn(mongoose, 'connect').mockRejectedValue(err);

    await expect(connectDB()).rejects.toBe(err);
    expect(errorLogSpy).toHaveBeenCalledWith({ err }, 'MongoDB connection error');
  });

  it('skips reconnect if already connected', async () => {
    const connectSpy = vi.spyOn(mongoose, 'connect');
    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      get: () => 1,
    });

    await connectDB();
    expect(connectSpy).not.toHaveBeenCalled();

    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      get: () => 0,
    });
  });

  it('disconnects when connected', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      get: () => 1,
    });
    const disconnectSpy = vi.spyOn(mongoose, 'disconnect').mockResolvedValue();

    await disconnectDB();
    expect(disconnectSpy).toHaveBeenCalledOnce();

    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      get: () => 0,
    });
  });
});
