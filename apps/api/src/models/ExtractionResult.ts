import mongoose, { Schema, Document, Types } from 'mongoose';
import { ExtractedFieldItem } from '@jandastavej/shared';

export interface IExtractionResult extends Document {
  userDocumentId: Types.ObjectId;
  userId: Types.ObjectId;
  items: ExtractedFieldItem[];
  engine: 'ocr_rules' | 'ai_assist';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExtractionResultSchema = new Schema<IExtractionResult>(
  {
    userDocumentId: { type: Schema.Types.ObjectId, ref: 'UserDocument', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'CitizenUser', required: true, index: true },
    items: { type: [Schema.Types.Mixed] as any, required: true },
    engine: { type: String, enum: ['ocr_rules', 'ai_assist'], default: 'ocr_rules', required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

ExtractionResultSchema.index({ userDocumentId: 1, userId: 1 });
ExtractionResultSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ExtractionResultModel =
  mongoose.models.ExtractionResult ||
  mongoose.model<IExtractionResult>('ExtractionResult', ExtractionResultSchema);
