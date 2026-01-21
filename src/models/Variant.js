import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "Variant SKU is required"],
      unique: true,
      trim: true,
    },
    colorName: {
      type: String,
      trim: true,
    },
    colorCode: {
      type: String,
      trim: true,
      lowercase: true,
    },
    size: {
      type: String,
      trim: true,
      default: "",
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false },
);

// const Variant = mongoose.model('Variant', variantSchema);

export default variantSchema;
