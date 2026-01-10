import mongoose from 'mongoose';
import imageSchema from './Image.js';

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: [true, 'Product slug is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Product name must be at least 3 characters'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  images: imageSchema,
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be greater than or equal to 0']
  },
  oldPrice: {
    type: Number,
    min: [0, 'Old price must be greater than or equal to 0']
  },
  tag: {
    type: String,
    enum: ['sale', 'new', 'hot'],
    default: ''
  },
  videoSrc: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: ['lip', 'face', 'eye', 'skincare', 'other']
  },
  variants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variant'
    }
  ],
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
