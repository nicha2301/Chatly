import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// User interface
export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline';
  lastActive: Date;
  deviceToken?: string;
  settings: {
    notifications: boolean;
    language: string;
  };
  roles: mongoose.Types.ObjectId[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false // Không trả về password khi query
    },
    username: {
      type: String,
      required: [true, 'Username là bắt buộc'],
      trim: true,
      minlength: [3, 'Username phải có ít nhất 3 ký tự']
    },
    avatar: {
      type: String,
      default: 'https://chatly.com/default-avatar.png'
    },
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline'
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    deviceToken: {
      type: String
    },
    settings: {
      notifications: {
        type: Boolean,
        default: true
      },
      language: {
        type: String,
        default: 'vi'
      }
    },
    roles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for conversations count
UserSchema.virtual('conversationsCount', {
  ref: 'Conversation',
  localField: '_id',
  foreignField: 'participants',
  count: true
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema); 