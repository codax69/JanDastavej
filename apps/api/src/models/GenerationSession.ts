import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGenerationSession extends Document {
  templateVersionId: Types.ObjectId;
  templateSlug: string;
  layoutKey?: string;
  answers: Record<string, any>;
  language: 'gu' | 'en';
  previewHtml: string;
  expiresAt: Date;
  status: 'active' | 'completed' | 'expired';
  createdAt: Date;
}

const GenerationSessionSchema = new Schema<IGenerationSession>(
  {
    templateVersionId: { type: Schema.Types.ObjectId, ref: 'TemplateVersion', required: true },
    templateSlug: { type: String, required: true },
    layoutKey: { type: String },
    answers: { type: Schema.Types.Mixed, required: true },
    language: { type: String, enum: ['gu', 'en'], default: 'gu' },
    previewHtml: { type: String, required: true },
    status: { type: String, enum: ['active', 'completed', 'expired'], default: 'active' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index: Mongo deletes documents automatically when expiresAt has passed!
GenerationSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const GenerationSessionModel =
  mongoose.models.GenerationSession || mongoose.model<IGenerationSession>('GenerationSession', GenerationSessionSchema);
