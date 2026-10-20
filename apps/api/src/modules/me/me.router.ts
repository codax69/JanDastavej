import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import {
  JanDastavejError,
  UpdateConsentsRequestSchema,
  DocumentTypeSchema,
} from '@jandastavej/shared';
import {
  requireCitizenAuth,
  AuthenticatedCitizenRequest,
} from '../auth/citizenAuth.middleware.js';
import { ConsentRecordModel } from '../../models/ConsentRecord.js';
import { UserDocumentModel } from '../../models/UserDocument.js';
import { ExtractionResultModel } from '../../models/ExtractionResult.js';
import { storageService } from '../../services/storageService.js';
import { safetyScanner } from '../../services/safetyScanner.js';
import { documentExtractor } from '../../services/documentExtractor.js';
import { AuditEventModel } from '../../models/AuditEvent.js';

export const meRouter = Router();

// Protect all /me/* routes with citizen auth
meRouter.use(requireCitizenAuth);

// Multer memory storage for uploads (10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// GET /api/v1/me/consents - Get active consent scopes
meRouter.get('/consents', async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.citizen!._id;
    const records = await ConsentRecordModel.find({ userId }).sort({ createdAt: -1 }).lean();

    const consentMap: Record<string, boolean> = {
      process: false,
      keep: false,
      ai_assist: false,
    };

    // Latest granted status per scope
    for (const scope of ['process', 'keep', 'ai_assist']) {
      const latest = records.find((r) => r.scope === scope);
      if (latest) {
        consentMap[scope] = Boolean(latest.granted && !latest.revokedAt);
      }
    }

    res.json({ data: consentMap });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/me/consents - Update/grant consent scopes
meRouter.post('/consents', async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = UpdateConsentsRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new JanDastavejError('VALIDATION_ERROR', 'Invalid consent payload.', 400);
    }

    const userId = req.citizen!._id;
    const { consents, noticeVersion } = parseResult.data;

    for (const item of consents) {
      await ConsentRecordModel.create({
        userId,
        scope: item.scope,
        granted: item.granted,
        noticeVersion,
        revokedAt: item.granted ? undefined : new Date(),
      });

      await AuditEventModel.create({
        actorUserId: userId,
        actorEmail: req.citizen!.identifier,
        action: item.granted ? 'consent.granted' : 'consent.revoked',
        entityType: 'auth',
        entityId: String(userId),
        timestamp: new Date(),
        metadata: { scope: item.scope, noticeVersion },
      });
    }

    // Return updated status
    const records = await ConsentRecordModel.find({ userId }).sort({ createdAt: -1 }).lean();
    const consentMap: Record<string, boolean> = {
      process: false,
      keep: false,
      ai_assist: false,
    };
    for (const scope of ['process', 'keep', 'ai_assist']) {
      const latest = records.find((r) => r.scope === scope);
      if (latest) {
        consentMap[scope] = Boolean(latest.granted && !latest.revokedAt);
      }
    }

    res.json({ data: consentMap });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/me/documents - Upload personal supporting document (multipart or base64)
meRouter.post(
  '/documents',
  upload.single('file'),
  async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.citizen!._id;

      // 1. Consent Gate: Must have 'process' consent granted
      const processConsent = await ConsentRecordModel.findOne({
        userId,
        scope: 'process',
        granted: true,
        revokedAt: { $exists: false },
      }).sort({ createdAt: -1 });

      if (!processConsent) {
        throw new JanDastavejError(
          'CONSENT_REQUIRED',
          'Consent to process document text for form pre-filling is required before uploading.',
          400
        );
      }

      // Check 'keep' consent
      const keepConsent = await ConsentRecordModel.findOne({
        userId,
        scope: 'keep',
        granted: true,
        revokedAt: { $exists: false },
      }).sort({ createdAt: -1 });
      const willKeep = Boolean(keepConsent);

      // Check 'ai_assist' consent
      const aiConsent = await ConsentRecordModel.findOne({
        userId,
        scope: 'ai_assist',
        granted: true,
        revokedAt: { $exists: false },
      }).sort({ createdAt: -1 });
      const userConsentedAi = Boolean(aiConsent);

      // 2. Extract Buffer & Filename (Support multipart or JSON base64)
      let buffer: Buffer;
      let rawName: string;
      let docType = req.body?.docType || 'other';

      if (req.file) {
        buffer = req.file.buffer;
        rawName = req.file.originalname;
      } else if (req.body?.fileBase64) {
        buffer = Buffer.from(req.body.fileBase64, 'base64');
        rawName = req.body.fileName || 'document.pdf';
      } else {
        throw new JanDastavejError('VALIDATION_ERROR', 'No document file provided.', 400);
      }

      const safeDocTypeResult = DocumentTypeSchema.safeParse(docType);
      const validatedDocType = safeDocTypeResult.success ? safeDocTypeResult.data : 'other';

      // 3. Rate Limit: 20 uploads / day
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const todayUploads = await UserDocumentModel.countDocuments({
        userId,
        createdAt: { $gte: oneDayAgo },
      });
      if (todayUploads >= 20) {
        throw new JanDastavejError('RATE_LIMITED', 'Daily limit of 20 document uploads reached.', 429);
      }

      // 4. Storage Quota Check: 50 MB
      const currentUsage = await storageService.getUserStorageUsage(String(userId));
      if (currentUsage + buffer.length > 50 * 1024 * 1024) {
        throw new JanDastavejError(
          'QUOTA_EXCEEDED',
          'User storage quota of 50 MB exceeded. Please delete old documents in My Documents.',
          400
        );
      }

      // 5. Safety Scan Pipeline (Magic bytes, EICAR check, PDF inspection)
      const scanResult = await safetyScanner.scanFile(buffer, rawName);

      // Sanitize filename to avoid logging or storing personal names
      const cleanOriginalName = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, '_');

      // 6. Compute TTL
      // Default: 2 hours (deleted at session end). If user chose Keep: 30 days.
      const expiresAt = willKeep
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 2 * 60 * 60 * 1000);

      // 7. Save file in isolated per-user directory
      const tempDocId = new Date().getTime().toString(36);
      const { storageKey, fileHash } = await storageService.saveFile(
        String(userId),
        tempDocId,
        scanResult.sanitizedBuffer,
        scanResult.detectedExt
      );

      // 8. Create UserDocument Record
      const userDoc = await UserDocumentModel.create({
        userId,
        docType: validatedDocType,
        originalName: cleanOriginalName,
        storageKey,
        mimeType: scanResult.mimeType,
        sizeBytes: scanResult.sanitizedBuffer.length,
        pageCount: 1,
        fileHash,
        status: 'scanning',
        kept: willKeep,
        expiresAt,
      });

      // 9. OCR & Rule-Based Field Extraction
      let extractedItems: any[] = [];
      try {
        extractedItems = await documentExtractor.extractFields({
          buffer: scanResult.sanitizedBuffer,
          mimeType: scanResult.mimeType,
          docType: validatedDocType,
          userConsentedAi,
        });

        await ExtractionResultModel.create({
          userDocumentId: userDoc._id,
          userId,
          items: extractedItems,
          engine: 'ocr_rules',
          expiresAt,
        });

        userDoc.status = 'ready';
        await userDoc.save();
      } catch (extractErr) {
        userDoc.status = 'scan_failed';
        await userDoc.save();
      }

      // 10. Audit log without personal values or names
      await AuditEventModel.create({
        actorUserId: userId,
        actorEmail: req.citizen!.identifier,
        action: 'userdoc.uploaded',
        entityType: 'submission',
        entityId: String(userDoc._id),
        timestamp: new Date(),
        metadata: { docType: validatedDocType, kept: willKeep },
      });

      res.status(201).json({
        data: {
          document: {
            id: userDoc._id,
            docType: userDoc.docType,
            originalName: userDoc.originalName,
            sizeBytes: userDoc.sizeBytes,
            mimeType: userDoc.mimeType,
            status: userDoc.status,
            kept: userDoc.kept,
            expiresAt: userDoc.expiresAt,
          },
          extraction: {
            userDocumentId: userDoc._id,
            items: extractedItems,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/me/documents - List citizen's kept and active documents
meRouter.get('/documents', async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.citizen!._id;
    const documents = await UserDocumentModel.find({
      userId,
      status: { $ne: 'deleted' },
    })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = documents.map((d) => ({
      id: d._id,
      docType: d.docType,
      originalName: d.originalName,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      status: d.status,
      kept: d.kept,
      expiresAt: d.expiresAt,
      createdAt: d.createdAt,
    }));

    res.json({ data: formatted, total: formatted.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/me/documents/:id - Get single document metadata
meRouter.get('/documents/:id', async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.citizen!._id;
    const { id } = req.params;

    // Strict owner verification (IDOR protection)
    const doc = (await UserDocumentModel.findOne({ _id: id, userId }).lean()) as any;
    if (!doc) {
      throw new JanDastavejError('NOT_FOUND', 'Document not found or does not belong to you.', 404);
    }

    res.json({
      data: {
        id: doc._id,
        docType: doc.docType,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        status: doc.status,
        kept: doc.kept,
        expiresAt: doc.expiresAt,
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/me/documents/:id/file - Download file stream
meRouter.get('/documents/:id/file', async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.citizen!._id;
    const { id } = req.params;

    const doc = (await UserDocumentModel.findOne({ _id: id, userId }).lean()) as any;
    if (!doc) {
      throw new JanDastavejError('NOT_FOUND', 'Document not found.', 404);
    }

    const fileBuffer = await storageService.getFile(String(userId), doc.storageKey);

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(fileBuffer);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/me/documents/:id/extraction - Proposed values with masked sensitive fields
meRouter.get('/documents/:id/extraction', async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.citizen!._id;
    const { id } = req.params;

    const extraction = (await ExtractionResultModel.findOne({ userDocumentId: id, userId }).lean()) as any;
    if (!extraction) {
      res.json({ data: { userDocumentId: id, items: [] } });
      return;
    }

    res.json({
      data: {
        userDocumentId: extraction.userDocumentId,
        items: extraction.items,
        engine: extraction.engine,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/me/documents/:id/keep - Retain document in My Documents
meRouter.post('/documents/:id/keep', async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.citizen!._id;
    const { id } = req.params;

    const doc = await UserDocumentModel.findOne({ _id: id, userId });
    if (!doc) throw new JanDastavejError('NOT_FOUND', 'Document not found.', 404);

    doc.kept = true;
    doc.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await doc.save();

    await AuditEventModel.create({
      actorUserId: userId,
      actorEmail: req.citizen!.identifier,
      action: 'userdoc.kept',
      entityType: 'submission',
      entityId: String(doc._id),
      timestamp: new Date(),
    });

    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/me/documents/:id/unkeep - Stop keeping document
meRouter.post('/documents/:id/unkeep', async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.citizen!._id;
    const { id } = req.params;

    const doc = await UserDocumentModel.findOne({ _id: id, userId });
    if (!doc) throw new JanDastavejError('NOT_FOUND', 'Document not found.', 404);

    doc.kept = false;
    doc.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    await doc.save();

    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/me/documents/:id - Immediate permanent delete
meRouter.delete('/documents/:id', async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.citizen!._id;
    const { id } = req.params;

    const doc = await UserDocumentModel.findOne({ _id: id, userId });
    if (!doc) throw new JanDastavejError('NOT_FOUND', 'Document not found.', 404);

    // Delete file from storage
    await storageService.deleteFile(String(userId), doc.storageKey);

    // Delete extraction & document record
    await ExtractionResultModel.deleteMany({ userDocumentId: doc._id, userId });
    await UserDocumentModel.findByIdAndDelete(doc._id);

    await AuditEventModel.create({
      actorUserId: userId,
      actorEmail: req.citizen!.identifier,
      action: 'userdoc.deleted',
      entityType: 'submission',
      entityId: id,
      timestamp: new Date(),
    });

    res.json({ status: 'ok', message: 'Document permanently deleted.' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/me/data - Right to Erasure (Wipe all user data)
meRouter.delete('/data', async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.citizen!._id;

    // Delete all files and directory on disk
    await storageService.deleteUserDirectory(String(userId));

    // Delete all database records
    await ExtractionResultModel.deleteMany({ userId });
    await UserDocumentModel.deleteMany({ userId });
    await ConsentRecordModel.deleteMany({ userId });

    await AuditEventModel.create({
      actorUserId: userId,
      actorEmail: req.citizen!.identifier,
      action: 'userdoc.deleted',
      entityType: 'submission',
      entityId: String(userId),
      reason: 'User invoked Right to Erasure (delete all data)',
      timestamp: new Date(),
    });

    // Clear session
    res.clearCookie('jd_citizen_session', { path: '/' });
    res.json({ status: 'ok', message: 'All personal documents, extractions, and data permanently deleted.' });
  } catch (err) {
    next(err);
  }
});
