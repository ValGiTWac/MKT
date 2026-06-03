import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
  avatar?: string;
  asanaUserId?: string;
  bufferProfileId?: string;
  preferences?: {
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'editor', 'viewer'],
      default: 'editor',
    },
    avatar: {
      type: String,
      trim: true,
    },
    asanaUserId: {
      type: String,
      trim: true,
    },
    bufferProfileId: {
      type: String,
      trim: true,
    },
    preferences: {
      language: {
        type: String,
        default: 'fr',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for user's role permissions
UserSchema.virtual('permissions').get(function () {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'create:user',
      'read:user',
      'update:user',
      'delete:user',
      'create:post',
      'read:post',
      'update:post',
      'delete:post',
      'approve:post',
      'publish:post',
      'manage:settings',
      'manage:integrations',
    ],
    manager: [
      'create:user',
      'read:user',
      'update:user',
      'create:post',
      'read:post',
      'update:post',
      'delete:post',
      'approve:post',
      'publish:post',
      'manage:integrations',
    ],
    editor: [
      'create:post',
      'read:post',
      'update:post',
      'delete:post',
      'translate:post',
    ],
    viewer: ['read:post'],
  };

  return rolePermissions[this.role] || [];
});

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
