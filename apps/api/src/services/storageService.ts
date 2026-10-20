import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export class StorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), 'storage', 'user-documents');
  }

  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch {
      // directory already exists
    }
  }

  private getUserDir(userId: string): string {
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    return path.join(this.baseDir, safeUserId);
  }

  /**
   * Save a user document file inside their isolated per-user directory
   */
  public async saveFile(
    userId: string,
    docId: string,
    buffer: Buffer,
    ext = 'bin'
  ): Promise<{ storageKey: string; fullPath: string; fileHash: string; sizeBytes: number }> {
    const userDir = this.getUserDir(userId);
    await this.ensureDir(userDir);

    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '');
    const filename = `${docId}_${randomSuffix}.${safeExt}`;
    const fullPath = path.join(userDir, filename);

    // Verify no path traversal
    if (!fullPath.startsWith(userDir)) {
      throw new Error('Invalid path traversal attempt');
    }

    await fs.writeFile(fullPath, buffer);

    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const storageKey = path.relative(this.baseDir, fullPath);

    return {
      storageKey,
      fullPath,
      fileHash,
      sizeBytes: buffer.length,
    };
  }

  /**
   * Read a user document file verifying owner isolation
   */
  public async getFile(userId: string, storageKey: string): Promise<Buffer> {
    const userDir = this.getUserDir(userId);
    const fullPath = path.join(this.baseDir, storageKey);

    // Strict owner & path traversal isolation check
    if (!fullPath.startsWith(userDir)) {
      throw new Error('Access denied: Document does not belong to user');
    }

    return await fs.readFile(fullPath);
  }

  /**
   * Delete a specific user document file
   */
  public async deleteFile(userId: string, storageKey: string): Promise<void> {
    const userDir = this.getUserDir(userId);
    const fullPath = path.join(this.baseDir, storageKey);

    if (!fullPath.startsWith(userDir)) {
      throw new Error('Access denied: Cannot delete file outside user directory');
    }

    try {
      await fs.unlink(fullPath);
    } catch {
      // Already deleted or not found
    }
  }

  /**
   * Delete an entire user directory (Right to Erasure)
   */
  public async deleteUserDirectory(userId: string): Promise<void> {
    const userDir = this.getUserDir(userId);
    try {
      await fs.rm(userDir, { recursive: true, force: true });
    } catch {
      // No directory to delete
    }
  }

  /**
   * Calculate total storage used by a citizen in bytes
   */
  public async getUserStorageUsage(userId: string): Promise<number> {
    const userDir = this.getUserDir(userId);
    try {
      const files = await fs.readdir(userDir);
      let totalBytes = 0;
      for (const file of files) {
        const stat = await fs.stat(path.join(userDir, file));
        totalBytes += stat.size;
      }
      return totalBytes;
    } catch {
      return 0;
    }
  }
}

export const storageService = new StorageService();
