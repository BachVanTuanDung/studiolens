import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Chính sách upsell: buổi đầu tính 100% price, các buổi thêm tính theo tỷ lệ này.
    // Ví dụ 0.5 = buổi thêm chỉ tính 50% giá buổi đầu.
    extraSessionRate: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },

    // Cho phép tắt chọn nhiều buổi với một số dịch vụ nếu cần.
    allowMultiSession: {
      type: Boolean,
      default: true,
    },

    duration: {
      type: Number,
      required: true,
      default: 60,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['wedding', 'portrait', 'fashion', 'family', 'event', 'editorial'],
      default: 'portrait',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    features: {
      type: [String],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

const Service = mongoose.model('Service', serviceSchema)

export default Service
