import mongoose, { Schema, Document } from 'mongoose';

// Message types
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  LOCATION = 'location',
  FILE = 'file'
}

// Message interface
export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: MessageType;
  readBy: mongoose.Types.ObjectId[];
  isEncrypted: boolean;
  metadata?: {
    location?: {
      lat: number;
      lng: number;
    };
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };
}

// Message schema
const MessageSchema: Schema = new Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isEncrypted: {
      type: Boolean,
      default: false
    },
    metadata: {
      location: {
        lat: Number,
        lng: Number
      },
      fileName: String,
      fileSize: Number,
      mimeType: String
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes to optimize queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });

// Middleware to update conversation's lastMessage after saving a new message
MessageSchema.post('save', async function(doc: IMessage) {
  await mongoose.model('Conversation').findByIdAndUpdate(
    doc.conversationId,
    { lastMessage: doc._id }
  );
});

export default mongoose.model<IMessage>('Message', MessageSchema); 