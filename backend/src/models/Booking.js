import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    conceptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Concept',
      default: null,
    },
    conceptName: {
      type: String,
      default: '',
    },

    date: {
      type: String,
      required: true,
    },

    // Giữ field session cũ để không vỡ các màn hình/code cũ.
    // Với booking mới, session sẽ là buổi đầu tiên trong mảng sessions.
    session: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      default: 'morning',
    },

    // Field mới: một booking có thể giữ nhiều buổi trong cùng một ngày.
    sessions: {
      type: [String],
      enum: ['morning', 'afternoon', 'evening'],
      default: [],
    },

    time: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },

    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_qr'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid'],
      default: 'unpaid',
    },
    paymentProvider: {
      type: String,
      enum: ['manual_qr', 'payos'],
      default: 'manual_qr',
    },
    paymentOrderCode: {
      type: Number,
      default: null,
      index: true,
    },
    paymentLinkId: {
      type: String,
      default: '',
    },
    checkoutUrl: {
      type: String,
      default: '',
    },
    paymentQrCode: {
      type: String,
      default: '',
    },
    reconciledAt: {
      type: Date,
      default: null,
    },
    paymentWebhookRaw: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    transferContent: {
      type: String,
      default: '',
    },
    qrImageUrl: {
      type: String,
      default: '',
    },
    qrTemplate: {
      type: String,
      default: 'compact2',
    },
    bankCode: {
      type: String,
      default: '',
    },
    bankAccountNo: {
      type: String,
      default: '',
    },
    bankAccountName: {
      type: String,
      default: '',
    },

    totalPrice: {
      type: Number,
      default: 0,
    },

    // Lưu snapshot chính sách giá tại thời điểm tạo booking.
    // Buổi đầu = 100% price của service, buổi thêm = extraSessionRate * price.
    extraSessionRate: {
      type: Number,
      default: 0.5,
    },

    note: {
      type: String,
      default: '',
    },
    assignedStaff: {
      type: [String],
      default: [],
    },
    confirmationEmailSent: {
      type: Boolean,
      default: false,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    confirmationEmailSentAt: {
      type: Date,
      default: null,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
    confirmationEmailError: {
      type: String,
      default: '',
    },
    reminderEmailError: {
      type: String,
      default: '',
    },
    // Thêm đoạn này vào bên trong new mongoose.Schema({ ... })
    
    editRequest: {
      requestType: { 
        type: String, 
        enum: ['reschedule', 'cancel'], 
        default: 'reschedule' 
      },
      status: { 
        type: String, 
        enum: ['none', 'pending', 'approved', 'rejected'], 
        default: 'none' 
      },
      date: String,
      session: String,
      sessions: [String],
      note: String,
      requestedAt: Date
    },
  },
  { timestamps: true }
)

bookingSchema.index({ date: 1, time: 1, status: 1 })
bookingSchema.index({ date: 1, session: 1, status: 1 })
bookingSchema.index({ date: 1, sessions: 1, status: 1 })
bookingSchema.index({ paymentStatus: 1, paymentMethod: 1, createdAt: -1 })

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking
