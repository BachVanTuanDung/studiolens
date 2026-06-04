import mongoose from 'mongoose'

const selectedImageItemSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      default: '',
      trim: true,
    },
    filename: {
      type: String,
      default: '',
      trim: true,
    },
    code: {
      type: String,
      default: '',
      trim: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    editedUrl: {
      type: String,
      default: '',
      trim: true,
    },
    editedPublicId: {
      type: String,
      default: '',
      trim: true,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
)

const selectedImagesSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    galleryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gallery',
      required: true,
    },
    selectedImages: {
      type: [selectedImageItemSchema],
      default: [],
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model('SelectedImages', selectedImagesSchema)