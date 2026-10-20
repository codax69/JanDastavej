import { Router, Request, Response, NextFunction } from 'express';
import { CreateSubmissionRequestSchema, JanDastavejError } from '@jandastavej/shared';
import { DocumentSubmissionModel } from '../../models/DocumentSubmission.js';
import { aiScannerService } from '../../services/aiScanner.js';

export const submissionsRouter = Router();

// POST /api/v1/submissions - Citizen submits document for AI scan & admin approval
submissionsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = CreateSubmissionRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new JanDastavejError(
        'VALIDATION_ERROR',
        parseResult.error.errors[0]?.message || 'Please provide valid document text and title.',
        400
      );
    }

    const { documentTitle, documentText, category, submitterName, submitterEmail, submitterPhone, fileName } =
      parseResult.data;

    // Immediately trigger AI scan
    const aiScanResult = await aiScannerService.scanDocument({
      titleHint: documentTitle,
      text: documentText,
      categoryHint: category,
    });

    const submission = await DocumentSubmissionModel.create({
      documentTitle,
      documentText,
      category: category || aiScanResult.detectedCategory,
      submitterName,
      submitterEmail,
      submitterPhone,
      fileName,
      fileSize: documentText.length,
      status: 'scanned',
      aiScanResult,
    });

    res.status(201).json({
      data: {
        submissionId: submission._id,
        status: submission.status,
        documentTitle: submission.documentTitle,
        aiScanResult,
        createdAt: submission.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/submissions/:id - Status of a submission
submissionsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const submission = await DocumentSubmissionModel.findById(id).lean();
    if (!submission) {
      throw new JanDastavejError('NOT_FOUND', 'Submission not found.', 404);
    }

    res.json({ data: submission });
  } catch (err) {
    next(err);
  }
});
