import mongoose, { Schema, Document } from 'mongoose';

// Conversation interface
export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  isGroup: boolean;
  groupName?: string;
  lastMessage?: mongoose.Types.ObjectId;
  groupAdmins: mongoose.Types.ObjectId[];
  metadata: {
    createdBy: mongoose.Types.ObjectId;
  };
}

// Conversation schema
const ConversationSchema: Schema = new Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    isGroup: {
      type: Boolean,
      default: false
    },
    groupName: {
      type: String,
      trim: true,
      required: function (this: IConversation) {
        return this.isGroup;
      }
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    groupAdmins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    metadata: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index to optimize queries
ConversationSchema.index({ participants: 1 });

// Virtual to get message count
ConversationSchema.virtual('messagesCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversationId',
  count: true
});

// Static method to find or create a one-to-one conversation
ConversationSchema.statics.findOneToOneConversation = async function(
  participantOneId: mongoose.Types.ObjectId,
  participantTwoId: mongoose.Types.ObjectId
) {
  // Find a conversation between these two users
  const conversation = await this.findOne({
    isGroup: false,
    participants: { 
      $all: [participantOneId, participantTwoId],
      $size: 2
    }
  });

  if (conversation) {
    return conversation;
  }

  // Create a new conversation if none exists
  return await this.create({
    participants: [participantOneId, participantTwoId],
    isGroup: false,
    metadata: {
      createdBy: participantOneId
    }
  });
};

interface IConversationModel extends mongoose.Model<IConversation> {
  findOneToOneConversation(
    participantOneId: mongoose.Types.ObjectId,
    participantTwoId: mongoose.Types.ObjectId
  ): Promise<IConversation>;
}

export default mongoose.model<IConversation, IConversationModel>('Conversation', ConversationSchema); 