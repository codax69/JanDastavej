import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUsageMetric extends Document {
  eventType: string;
  templateId?: Types.ObjectId;
  language: 'gu' | 'en';
  durationMs?: number;
  success: boolean;
  createdAt: Date;
}

const UsageMetricSchema = new Schema<IUsageMetric>(
  {
    eventType: { type: String, required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template' },
    language: { type: String, enum: ['gu', 'en'], required: true },
    durationMs: { type: Number },
    success: { type: Boolean, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const UsageMetricModel =
  mongoose.models.UsageMetric || mongoose.model<IUsageMetric>('UsageMetric', UsageMetricSchema);
