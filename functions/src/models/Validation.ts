import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { IPost } from './Post';

export type ValidationStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface IValidation extends Document {
  post: Types.ObjectId | IPost;
  validator: Types.ObjectId | IUser;
  status: ValidationStatus;
  comments?: string;
  visualPreview?: string;
  changesRequested?: string[];
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ValidationSchema: Schema<IValidation> = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    validator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'changes_requested'],
      default: 'pending',
    },
    comments: {
      type: String,
      trim: true,
    },
    visualPreview: {
      type: String,
      trim: true,
    },
    changesRequested: [{
      type: String,
      trim: true,
    }],
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
ValidationSchema.index({ post: 1, validator: 1 }, { unique: true });
ValidationSchema.index({ validator: 1, createdAt: -1 });
ValidationSchema.index({ status: 1, createdAt: -1 });
ValidationSchema.index({ post: 1, status: 1 });

// Pre-save hook to set approvedAt
ValidationSchema.pre<IValidation>('save', function (next) {
  if (this.status === 'approved' && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  next();
});

// Virtual for status display
ValidationSchema.virtual('statusDisplay').get(function () {
  const displays: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    changes_requested: 'Modifications demandées',
  };
  return displays[this.status] || this.status;
});

// Method to approve
ValidationSchema.methods.approve = async function (comments?: string) {
  this.status = 'approved';
  this.comments = comments;
  this.approvedAt = new Date();
  await this.save();
  return this;
};

// Method to reject
ValidationSchema.methods.reject = async function (comments: string, changesRequested?: string[]) {
  this.status = 'rejected';
  this.comments = comments;
  this.changesRequested = changesRequested;
  await this.save();
  return this;
};

// Method to request changes
ValidationSchema.methods.requestChanges = async function (comments: string, changesRequested: string[]) {
  this.status = 'changes_requested';
  this.comments = comments;
  this.changesRequested = changesRequested;
  await this.save();
  return this;
};

const Validation = mongoose.model<IValidation>('Validation', ValidationSchema);

export default Validation;
