import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB, getDatabaseInfo, maskMongoUri } from './db.js';
import { logger } from './logger.js';

describe('database configuration & error handling', () => {
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

  it('redacts credentials from MongoDB URIs', () => {
    expect(maskMongoUri('mongodb+srv://admin:s3cr3tPass@cluster.mongodb.net/jandastavej')).toBe(
      'mongodb+srv://***:***@cluster.mongodb.net/jandastavej'
    );
    expect(maskMongoUri('mongodb://127.0.0.1:27017/jandastavej')).toBe(
      'mongodb://127.0.0.1:27017/jandastavej'
    );
    expect(
      maskMongoUri(
        'mongodb://admin:s3cr3tPass@cluster.mongodb.net/jandastavej?authMechanismProperties=AWS_SESSION_TOKEN%3Dsecret'
      )
    ).toBe('mongodb://***:***@cluster.mongodb.net/jandastavej');
  });

  it('rejects malformed URI schemes before calling mongoose.connect', async () => {
    process.env.MONGODB_URI = 'http://localhost:27017/bad';
    const connectSpy = vi.spyOn(mongoose, 'connect');
    const errorLogSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);

    await expect(connectDB()).rejects.toThrow(/Invalid MongoDB URI from MONGODB_URI/);
    expect(connectSpy).not.toHaveBeenCalled();
    expect(errorLogSpy).toHaveBeenCalled();
  });

  it('accepts URL-encoded UNIX socket hosts', async () => {
    process.env.MONGODB_URI = 'mongodb://%2Ftmp%2Fmongodb-27017.sock';
    const connectSpy = vi.spyOn(mongoose, 'connect').mockResolvedValue({
      connection: {
        name: 'jandastavej',
        host: '',
        port: 0,
      },
    } as unknown as typeof mongoose);

    await connectDB();

    expect(connectSpy).toHaveBeenCalledWith(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    expect(getDatabaseInfo().targetType).toBe('local');
  });

  it('does not classify an invalid 127-prefixed hostname as local', async () => {
    process.env.MONGODB_URI = 'mongodb://127.invalid:27017/jandastavej';
    vi.spyOn(mongoose, 'connect').mockResolvedValue({
      connection: {
        name: 'jandastavej',
        host: '127.invalid',
        port: 27017,
      },
    } as unknown as typeof mongoose);

    await connectDB();

    expect(getDatabaseInfo().targetType).toBe('remote');
  });

  it('logs connected database name, host, targetType, and source on success', async () => {
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/jandastavej_demo';
    const infoLogSpy = vi.spyOn(logger, 'info').mockImplementation(() => logger);

    vi.spyOn(mongoose, 'connect').mockResolvedValue({
      connection: {
        name: 'jandastavej_demo',
        host: '127.0.0.1',
        port: 27017,
      },
    } as unknown as typeof mongoose);

    await connectDB();

    expect(infoLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        dbName: 'jandastavej_demo',
        host: '127.0.0.1',
        port: 27017,
        targetType: 'local',
        source: 'MONGO_URI',
      }),
      expect.stringContaining('MongoDB connected to database "jandastavej_demo"')
    );
    expect(getDatabaseInfo()).toEqual(
      expect.objectContaining({
        targetType: 'local',
        source: 'MONGO_URI',
      })
    );
  });

  it('enriches server selection errors with actionable hint and masked URI', async () => {
    process.env.MONGODB_URI =
      'mongodb+srv://user:TopSecret123@missing.example.net/prod?authMechanismProperties=AWS_SESSION_TOKEN%3DQuerySecret987';
    const errorLogSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);

    const serverErr = new Error('connect ECONNREFUSED 127.0.0.1:27017');
    serverErr.name = 'MongoServerSelectionError';
    vi.spyOn(mongoose, 'connect').mockRejectedValue(serverErr);

    let rejection: unknown;
    try {
      await connectDB();
    } catch (err) {
      rejection = err;
    }

    expect(rejection).toBeInstanceOf(Error);
    if (!(rejection instanceof Error)) throw new Error('Expected MongoDB connection to reject');
    expect(rejection.message).toContain(
      'Could not reach MongoDB at mongodb+srv://***:***@missing.example.net/prod'
    );
    expect(rejection.message).not.toContain('TopSecret123');
    expect(rejection.message).not.toContain('QuerySecret987');
    expect(errorLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.objectContaining({ message: rejection.message }),
      }),
      'MongoDB connection error'
    );
  });

  it('logs and rethrows errors during disconnectDB', async () => {
    const errorLogSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
    const originalDescriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');

    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      get: () => 1,
    });
    const disconnectError = new Error('socket close failed');
    vi.spyOn(mongoose, 'disconnect').mockRejectedValue(disconnectError);

    await expect(disconnectDB()).rejects.toBe(disconnectError);
    expect(errorLogSpy).toHaveBeenCalledWith(
      { err: disconnectError },
      'MongoDB disconnection error'
    );

    if (originalDescriptor) {
      Object.defineProperty(mongoose.connection, 'readyState', originalDescriptor);
    }
  });
});
