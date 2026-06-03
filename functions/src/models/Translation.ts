import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { IPost } from './Post';

export type TranslationStatus = 'pending' | 'completed' | 'needs_review' | 'failed';

export interface ITranslation extends Document {
  post: Types.ObjectId | IPost;
  language: string;
  content: string;
  status: TranslationStatus;
  translator?: Types.ObjectId | IUser;
  sourceLanguage?: string;
  errorMessage?: string;
  metadata?: {
    characterCount: number;
    wordCount: number;
    hashtags: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const TranslationSchema: Schema<ITranslation> = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'needs_review', 'failed'],
      default: 'pending',
    },
    translator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sourceLanguage: {
      type: String,
      trim: true,
      lowercase: true,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    metadata: {
      characterCount: Number,
      wordCount: Number,
      hashtags: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
TranslationSchema.index({ post: 1, language: 1 }, { unique: true });
TranslationSchema.index({ translator: 1, createdAt: -1 });
TranslationSchema.index({ status: 1, createdAt: -1 });

// Pre-save hook to extract metadata
TranslationSchema.pre<ITranslation>('save', function (next) {
  // Extract hashtags
  const hashtags = this.content.match(/#[\w-]+/g) || [];
  
  // Calculate character and word count
  const characterCount = this.content.length;
  const wordCount = this.content.trim() === '' ? 0 : this.content.trim().split(/\s+/).length;

  this.metadata = {
    hashtags: hashtags.map(tag => tag.substring(1)),
    characterCount,
    wordCount,
  };

  next();
});

// Virtual for language display
TranslationSchema.virtual('languageDisplay').get(function () {
  const displays: Record<string, string> = {
    fr: 'Français',
    en: 'Anglais',
    es: 'Espagnol',
    de: 'Allemand',
    it: 'Italien',
    pt: 'Portugais',
    nl: 'Néerlandais',
    ar: 'Arabe',
    zh: 'Chinois',
    ja: 'Japonais',
    ru: 'Russe',
  };
  return displays[this.language] || this.language;
});

// Virtual for language flag
TranslationSchema.virtual('languageFlag').get(function () {
  const flags: Record<string, string> = {
    fr: '🇫🇷',
    en: '🇬🇧',
    es: '🇪🇸',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇵🇹',
    nl: '🇳🇱',
    ar: '🇸🇦',
    zh: '🇨🇳',
    ja: '🇯🇵',
    ru: '🇷🇺',
  };
  return flags[this.language] || '🌐';
});

// Method to mark as completed
TranslationSchema.methods.markAsCompleted = async function () {
  this.status = 'completed';
  await this.save();
  return this;
};

// Method to mark as needs review
TranslationSchema.methods.markAsNeedsReview = async function () {
  this.status = 'needs_review';
  await this.save();
  return this;
};

// Method to mark as failed
TranslationSchema.methods.markAsFailed = async function (errorMessage: string) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  await this.save();
  return this;
};

const Translation = mongoose.model<ITranslation>('Translation', TranslationSchema);

export default Translation;
