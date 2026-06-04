import mongoose, { Document, Schema, Types } from 'mongoose';

export type SocialPlatform = 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'tiktok';
export type PostStatus = 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'published' | 'rejected';

export interface PostDocument extends Document {
  title: string;
  content: string;
  translatedContent?: Record<string, string>;
  status: PostStatus;
  authorId: Types.ObjectId;
  platforms: SocialPlatform[];
  scheduledAt?: Date;
  publishedAt?: Date;
  images?: string[];
  tags?: string[];
  metadata?: {
    characterCount: number;
    wordCount: number;
    readabilityScore?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<PostDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    translatedContent: {
      type: Map,
      of: String,
      default: {},
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'scheduled', 'published', 'rejected'],
      default: 'draft',
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    platforms: [
      {
        type: String,
        enum: ['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok'],
        default: [],
      },
    ],
    scheduledAt: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    metadata: {
      characterCount: {
        type: Number,
        default: 0,
      },
      wordCount: {
        type: Number,
        default: 0,
      },
      readabilityScore: {
        type: Number,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ status: 1, createdAt: -1 });
PostSchema.index({ title: 'text', content: 'text' });

// Virtual for author population
PostSchema.virtual('author', {
  ref: 'User',
  localField: 'authorId',
  foreignField: '_id',
  justOne: true,
});

// Pre-save hook to calculate metadata
PostSchema.pre<PostDocument>('save', function (next) {
  if (this.isModified('content')) {
    this.metadata = {
      characterCount: this.content.length,
      wordCount: this.content.split(/\s+/).filter(Boolean).length,
    };
  }
  next();
});

const Post = mongoose.model<PostDocument>('Post', PostSchema);

export default Post;
