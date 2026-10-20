import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditEvent extends Document {
  actorUserId?: Types.ObjectId;
  actorEmail?: string;
  action: string;
  entityType: 'template' | 'template_version' | 'auth' | 'submission' | 'system';
  entityId: string;
  version?: number;
  reason?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const AuditEventSchema = new Schema<IAuditEvent>(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorEmail: { type: String },
    action: { type: String, required: true, index: true },
    entityType: { type: String, enum: ['template', 'template_version', 'auth', 'submission', 'system'], required: true },
    entityId: { type: String, required: true, index: true },
    version: { type: Number },
    reason: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
    // Strict rule: metadata must NEVER store citizen answers or raw document content
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: false }
);

export const AuditEventModel =
  mongoose.models.AuditEvent || mongoose.model<IAuditEvent>('AuditEvent', AuditEventSchema);
