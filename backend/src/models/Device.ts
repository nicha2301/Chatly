import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document<mongoose.Types.ObjectId> {
  userId: mongoose.Types.ObjectId;
  token: string;
  platform: string;
  deviceId: string;
  deviceModel: string;
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true
    },
    deviceId: {
      type: String,
      required: true,
      trim: true
    },
    deviceModel: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Tạo index để tìm kiếm nhanh hơn
DeviceSchema.index({ userId: 1, deviceId: 1 });
DeviceSchema.index({ token: 1 });

// Đảm bảo mỗi người dùng chỉ có một token cho mỗi thiết bị
DeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

const Device = mongoose.model<IDevice>('Device', DeviceSchema);

export default Device; 