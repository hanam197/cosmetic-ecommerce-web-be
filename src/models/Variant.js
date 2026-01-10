import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    colorName: {
        type: String,
        trim: true
    },
    colorCode: {
        type: String,
        trim: true,
        lowercase: true
    },
    size: {
        type: String,
        trim: true,
        default: ''
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Stock cannot be negative']
    },
    images: [
        {
            type: String,
            trim: true
        }
    ],
}, { timestamps: true });


const Variant = mongoose.model('Variant', variantSchema);

export default Variant;
