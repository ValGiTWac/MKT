import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';

export type PostStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'rejected' | 'scheduled';
export type PostPlatform = 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest';
export type PostPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface IPost extends Document {
  title: string;
  content: string;
  excerpt?: string;
  author: Types.ObjectId | IUser;
  status: PostStatus;
  platform: PostPlatform;
  scheduledAt?: Date;
  publishedAt?: Date;
  media: string[];
  thumbnail?: string;
  tags: string[];
  category: string;
  priority: PostPriority;
  metadata?: {
    hashtags: string[];
    mentions: string[];
    links: string[];
    characterCount: number;
    wordCount: number;
  };
  settings?: {
    autoPublish: boolean;
    notifyTeam: boolean;
    createAsanaTask: boolean;
  };
  asanaTaskId?: string;
  bufferPostId?: string;
  translations: Types.ObjectId[];
  validations: Types.ObjectId[];
  comments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema<IPost> = new Schema(
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
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'approved', 'published', 'rejected', 'scheduled'],
      default: 'draft',
    },
    platform: {
      type: String,
      enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube', 'pinterest'],
      required: [true, 'Platform is required'],
    },
    scheduledAt: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
    media: [{
      type: String,
      trim: true,
    }],
    thumbnail: {
      type: String,
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    metadata: {
      hashtags: [String],
      mentions: [String],
      links: [String],
      characterCount: Number,
      wordCount: Number,
    },
    settings: {
      autoPublish: {
        type: Boolean,
        default: false,
      },
      notifyTeam: {
        type: Boolean,
        default: true,
      },
      createAsanaTask: {
        type: Boolean,
        default: false,
      },
    },
    asanaTaskId: {
      type: String,
      trim: true,
    },
    bufferPostId: {
      type: String,
      trim: true,
    },
    translations: [{
      type: Schema.Types.ObjectId,
      ref: 'Translation',
    }],
    validations: [{
      type: Schema.Types.ObjectId,
      ref: 'Validation',
    }],
    comments: [{
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ status: 1, createdAt: -1 });
PostSchema.index({ platform: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ category: 1 });
PostSchema.index({ priority: 1 });
PostSchema.index({ scheduledAt: 1 });

// Pre-save hook to extract metadata
PostSchema.pre<IPost>('save', function (next) {
  // Extract hashtags
  const hashtags = this.content.match(/#[\w-]+/g) || [];
  
  // Extract mentions
  const mentions = this.content.match(/@[\w-]+/g) || [];
  
  // Extract links
  const linkRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g;
  const links = this.content.match(linkRegex) || [];

  // Calculate character and word count
  const characterCount = this.content.length;
  const wordCount = this.content.trim() === '' ? 0 : this.content.trim().split(/\s+/).length;

  this.metadata = {
    hashtags: hashtags.map(tag => tag.substring(1)),
    mentions: mentions.map(mention => mention.substring(1)),
    links,
    characterCount,
    wordCount,
  };

  // Set excerpt if not provided
  if (!this.excerpt && this.content.length > 100) {
    this.excerpt = this.content.substring(0, 100) + '...';
  }

  next();
});

// Virtual for status display
PostSchema.virtual('statusDisplay').get(function () {
  return this.status.replace('_', ' ');
});

// Virtual for platform display
PostSchema.virtual('platformDisplay').get(function () {
  const displays: Record<string, string> = {
    facebook: 'Facebook',
    twitter: 'Twitter/X',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    pinterest: 'Pinterest',
  };
  return displays[this.platform] || this.platform;
});

// Virtual for platform icon
PostSchema.virtual('platformIcon').get(function () {
  const icons: Record<string, string> = {
    facebook: '📘',
    twitter: '🐦',
    instagram: '📷',
    linkedin: '💼',
    tiktok: '🎵',
    youtube: '📺',
    pinterest: '📌',
  };
  return icons[this.platform] || '🌐';
});

// Virtual for platform color
PostSchema.virtual('platformColor').get(function () {
  const colors: Record<string, string> = {
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    instagram: '#E4405F',
    linkedin: '#0A66C2',
    tiktok: '#000000',
    youtube: '#FF0000',
    pinterest: '#E60023',
  };
  return colors[this.platform] || '#6B7280';
});

// Method to update status
PostSchema.methods.updateStatus = async function (status: PostStatus) {
  this.status = status;
  
  // Set published date if status is published
  if (status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  await this.save();
  return this;
};

const Post = mongoose.model<IPost>('Post', PostSchema);

export default Post;
