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
    image: {
      type: String,
      required: true,
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