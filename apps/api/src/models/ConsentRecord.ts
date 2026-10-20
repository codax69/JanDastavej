import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConsentRecord extends Document {
  userId: Types.ObjectId;
  scope: 'process' | 'keep' | 'ai_assist';
  granted: boolean;
  noticeVersion: string;
  createdAt: Date;
  revokedAt?: Date;
}

const ConsentRecordSchema = new Schema<IConsentRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'CitizenUser', required: true, index: true },
    scope: { type: String, enum: ['process', 'keep', 'ai_assist'], required: true },
    granted: { type: Boolean, required: true },
    noticeVersion: { type: String, default: '2026.1', required: true },
    revokedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ConsentRecordSchema.index({ userId: 1, scope: 1 });

export const ConsentRecordModel =
  mongoose.models.ConsentRecord || mongoose.model<IConsentRecord>('ConsentRecord', ConsentRecordSchema);
