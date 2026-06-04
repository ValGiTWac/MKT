import mongoose, { Document, Schema } from 'mongoose';

export type IntegrationType = 'buffer' | 'asana' | 'mistral';

export interface IntegrationDocument extends Document {
  type: IntegrationType;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  userId: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IntegrationDocument>(
  {
    type: {
      type: String,
      enum: ['buffer', 'asana', 'mistral'],
      required: true,
      unique: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
IntegrationSchema.index({ type: 1 }, { unique: true });
IntegrationSchema.index({ userId: 1 });

const Integration = mongoose.model<IntegrationDocument>(
  'Integration',
  IntegrationSchema
);

export default Integration;
