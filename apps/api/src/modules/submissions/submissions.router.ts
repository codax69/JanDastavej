import { Router, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  CreateSubmissionRequestSchema,
  ResubmitSubmissionRequestSchema,
  JanDastavejError,
} from '@jandastavej/shared';
import { DocumentSubmissionModel, IDocumentSubmission } from '../../models/DocumentSubmission.js';
import { TemplateModel } from '../../models/Template.js';
import { AuditEventModel } from '../../models/AuditEvent.js';
import { aiScannerService } from '../../services/aiScanner.js';
import {
  requireCitizenAuth,
  optionalCitizenAuth,
  AuthenticatedCitizenRequest,
} from '../auth/citizenAuth.middleware.js';
import { verifyAdminSession } from '../admin/auth.middleware.js';

export const submissionsRouter = Router();

// Helper to check if request is from an authenticated admin
async function isAdminRequest(req: AuthenticatedCitizenRequest): Promise<boolean> {
  const user = await verifyAdminSession(req as any);
  return !!user;
}

// POST /api/v1/submissions - Citizen submits candidate document for review
submissionsRouter.post(
  '/',
  optionalCitizenAuth,
  async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
    try {
      const parseResult = CreateSubmissionRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new JanDastavejError(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || 'Please provide valid document text and title.',
          400
        );
      }

      const {
        documentTitle,
        documentText,
        category,
        submitterName,
        submitterEmail,
        submitterPhone,
        fileName,
        intendedServiceOrPurpose,
        jurisdiction,
        state,
        language,
        sourceUrl,
        sourceDescription,
        issuingAuthority,
        effectiveDate,
        documentType,
        additionalNotes,
      } = parseResult.data;

      // 1. Calculate SHA-256 hash for duplicate detection (Section 4)
      const fileHash = crypto.createHash('sha256').update(documentText.trim()).digest('hex');

      // Check if duplicate submission or existing published template exists
      const existingSubmission = (await DocumentSubmissionModel.findOne({
        fileHash,
        status: { $in: ['submitted', 'ai_review_ready', 'approved', 'published'] },
      }).lean()) as IDocumentSubmission | null;

      // 2. Trigger AI-assisted verification pipeline (Section 5)
      const aiScanResult = await aiScannerService.scanDocument({
        titleHint: documentTitle,
        text: documentText,
        categoryHint: category,
        sourceUrl,
        sourceDescription,
        issuingAuthority,
        documentType,
        fileHash,
      });

      if (existingSubmission) {
        aiScanResult.isDuplicate = true;
        aiScanResult.duplicateMatchedSlug = existingSubmission.documentTitle;
      }

      // 3. Determine Initial State (Section 6 State Machine)
      let initialStatus: any = 'ai_review_ready';
      if (aiScanResult.verificationStatus === 'EXTRACTION_FAILED') {
        initialStatus = 'extraction_failed';
      } else if (aiScanResult.verificationStatus === 'SCAN_FAILED') {
        initialStatus = 'scan_failed';
      }

      // 4. Create Private Candidate Submission (remains unpublished)
      const effectiveSubmitterEmail = req.citizen?.identifier || submitterEmail;
      const effectiveSubmitterName = req.citizen?.name || submitterName;

      const submission = await DocumentSubmissionModel.create({
        documentTitle,
        documentText,
        category: category || aiScanResult.detectedCategory,
        submitterUserId: req.citizen?._id,
        submitterName: effectiveSubmitterName,
        submitterEmail: effectiveSubmitterEmail,
        submitterPhone,
        fileName,
        fileSize: Buffer.byteLength(documentText, 'utf-8'),
        fileHash,
        fileMimeType: 'text/plain',
        intendedServiceOrPurpose,
        jurisdiction: jurisdiction || 'Gujarat (District: Gandhinagar)',
        state: state || 'Gujarat',
        language: language || 'gu',
        sourceUrl,
        sourceDescription,
        issuingAuthority,
        effectiveDate,
        documentType: documentType || 'sample_template',
        additionalNotes,
        status: initialStatus,
        statusHistory: [
          {
            status: initialStatus,
            timestamp: new Date(),
            note: 'Initial submission created and verified via automated pipeline.',
          },
        ],
        aiScanResult,
      });

      res.status(201).json({
        data: {
          submissionId: submission._id,
          status: submission.status,
          documentTitle: submission.documentTitle,
          isDuplicate: aiScanResult.isDuplicate,
          duplicateMatchedSlug: aiScanResult.duplicateMatchedSlug,
          aiScanResult,
          createdAt: submission.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/submissions/mine - Citizen views their own submissions
submissionsRouter.get(
  '/mine',
  requireCitizenAuth,
  async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
    try {
      const submissions = await DocumentSubmissionModel.find({
        $or: [{ submitterUserId: req.citizen!._id }, { submitterEmail: req.citizen!.identifier }],
      })
        .sort({ createdAt: -1 })
        .lean();

      res.json({ data: submissions, total: submissions.length });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/submissions/:id - Status of a submission (Strict Privacy Enforcement)
submissionsRouter.get(
  '/:id',
  optionalCitizenAuth,
  async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const submission = (await DocumentSubmissionModel.findById(id).lean()) as IDocumentSubmission | null;
      if (!submission) {
        throw new JanDastavejError('NOT_FOUND', 'Submission not found.', 404);
      }

      // Check access permission:
      // Submissions are private (Section 3.B, 13). Must be owner or admin.
      const isAdmin = await isAdminRequest(req);
      const isOwner =
        (req.citizen && submission.submitterUserId && String(submission.submitterUserId) === String(req.citizen._id)) ||
        (req.citizen && submission.submitterEmail && submission.submitterEmail === req.citizen.identifier);

      // If submission was submitted anonymously and guest has direct submission link, allow preview without reviewer private notes
      if (!isAdmin && !isOwner) {
        if (submission.submitterUserId) {
          throw new JanDastavejError(
            'FORBIDDEN',
            'Access denied. This candidate template submission is private to its submitter.',
            403
          );
        }
        res.json({
          data: {
            _id: submission._id,
            documentTitle: submission.documentTitle,
            status: submission.status,
            createdAt: submission.createdAt,
            updatedAt: submission.updatedAt,
          },
        });
        return;
      }

      res.json({ data: submission });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/submissions/:id - Submitter responds to correction request
submissionsRouter.patch(
  '/:id',
  optionalCitizenAuth,
  async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const submission = await DocumentSubmissionModel.findById(id);
      if (!submission) {
        throw new JanDastavejError('NOT_FOUND', 'Submission not found.', 404);
      }

      const isAdmin = await isAdminRequest(req);
      const isOwner = Boolean(
        req.citizen &&
          ((submission.submitterUserId && String(submission.submitterUserId) === String(req.citizen._id)) ||
            (submission.submitterEmail && submission.submitterEmail === req.citizen.identifier))
      );

      if (!isAdmin && !isOwner) {
        throw new JanDastavejError('FORBIDDEN', 'Access denied. You cannot modify this submission.', 403);
      }

      if (submission.status !== 'needs_correction' && submission.status !== 'draft') {
        throw new JanDastavejError(
          'VALIDATION_ERROR',
          `Cannot edit submission in '${submission.status}' status. Resubmission is only allowed when corrections are requested.`,
          400
        );
      }

      const parseResult = ResubmitSubmissionRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new JanDastavejError(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || 'Invalid correction payload.',
          400
        );
      }

      const { documentTitle, documentText, additionalNotes } = parseResult.data;

      if (documentTitle) submission.documentTitle = documentTitle;
      submission.documentText = documentText;
      submission.fileHash = crypto.createHash('sha256').update(documentText.trim()).digest('hex');
      submission.fileSize = Buffer.byteLength(documentText, 'utf-8');
      if (additionalNotes) submission.additionalNotes = additionalNotes;
      submission.resubmissionCount = (submission.resubmissionCount || 0) + 1;

      // Re-run AI verification
      const aiScanResult = await aiScannerService.scanDocument({
        titleHint: submission.documentTitle,
        text: documentText,
        categoryHint: submission.category,
        sourceUrl: submission.sourceUrl,
      });

      submission.aiScanResult = aiScanResult;
      submission.status = 'ai_review_ready';
      submission.statusHistory.push({
        status: 'ai_review_ready',
        timestamp: new Date(),
        note: `Resubmitted by citizen with corrections (iteration ${submission.resubmissionCount}).`,
      });

      await submission.save();

      res.json({
        data: submission,
        message: 'Corrections submitted successfully. Ready for reviewer inspection.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/submissions/:id/withdraw - Submitter withdraws pending submission
submissionsRouter.post(
  '/:id/withdraw',
  optionalCitizenAuth,
  async (req: AuthenticatedCitizenRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const submission = await DocumentSubmissionModel.findById(id);
      if (!submission) {
        throw new JanDastavejError('NOT_FOUND', 'Submission not found.', 404);
      }

      const isAdmin = await isAdminRequest(req);
      const isOwner = Boolean(
        req.citizen &&
          ((submission.submitterUserId && String(submission.submitterUserId) === String(req.citizen._id)) ||
            (submission.submitterEmail && submission.submitterEmail === req.citizen.identifier))
      );

      if (!isAdmin && !isOwner) {
        throw new JanDastavejError('FORBIDDEN', 'Access denied. You cannot withdraw this submission.', 403);
      }

      if (['approved', 'published'].includes(submission.status)) {
        throw new JanDastavejError('VALIDATION_ERROR', 'Cannot withdraw an already approved or published template.', 400);
      }

      submission.status = 'withdrawn';
      submission.statusHistory.push({
        status: 'withdrawn',
        timestamp: new Date(),
        note: 'Withdrawn by submitter.',
      });

      await submission.save();

      res.json({ data: submission, message: 'Submission withdrawn successfully.' });
    } catch (err) {
      next(err);
    }
  }
);
