import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      default: 'general',
      trim: true,
      index: true,
    },

    category: {
      type: String,
      enum: ['booking', 'payment', 'gallery', 'account', 'system', 'general'],
      default: 'general',
      index: true,
    },

    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
      index: true,
    },

    senderRole: {
      type: String,
      enum: ['system', 'admin', 'user'],
      default: 'system',
    },

    link: {
      type: String,
      default: '',
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
)

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification