import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderRole: {
      type: String,
      enum: ['user', 'admin', 'system'],
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: '',
      trim: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'file', 'auto_reply', 'system'],
      default: 'text',
      index: true,
    },
    mediaUrl: {
      type: String,
      default: '',
      trim: true,
    },
    mediaPublicId: {
      type: String,
      default: '',
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ['', 'image', 'video', 'file'],
      default: '',
    },
    fileName: {
      type: String,
      default: '',
      trim: true,
    },
    mimeType: {
      type: String,
      default: '',
      trim: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

messageSchema.index({ conversationId: 1, createdAt: 1 })

const Message = mongoose.model('Message', messageSchema)
export default Message