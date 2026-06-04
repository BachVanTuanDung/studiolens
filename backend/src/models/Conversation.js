import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
    lastMessage: {
      type: String,
      default: '',
      trim: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadCountUser: {
      type: Number,
      default: 0,
    },
    unreadCountAdmin: {
      type: Number,
      default: 0,
    },
    adminLastSeenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

conversationSchema.index({ userId: 1, status: 1 })

const Conversation = mongoose.model('Conversation', conversationSchema)
export default Conversation