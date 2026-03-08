import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Collection name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Collection slug is required"],
      unique: true,
      trim: true,
    },
    banner: {
      type: String,
      default: "",
    },
    desc: {
      type: String,
      default: "",
      trim: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        variant: String,
      },
    ],
  },
  { timestamps: true },
);

const Collection = mongoose.model(
  "Collection",
  collectionSchema,
  "collections",
);

export default Collection;
