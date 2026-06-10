import mongoose from 'mongoose'

const conceptSchema = new mongoose.Schema(
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
    // Vẫn giữ trường 'image' để không làm lỗi các dữ liệu cũ
    image: {
      type: String,
      required: true,
    },
    // THÊM TRƯỜNG NÀY ĐỂ LƯU DANH SÁCH ẢNH
    images: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String },
          caption: { type: String }
        }
      ],
      default: [],
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['romantic', 'vintage', 'minimal', 'editorial', 'dark', 'outdoor', 'studio'],
      default: 'studio',
    },
    tags: {
      type: [String],
      default: [],
    },
    relatedServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
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

const Concept = mongoose.model('Concept', conceptSchema)
export default Concept