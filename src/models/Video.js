import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
    {
        store: {
            type: String,
            trim: true
        },
        reelUp: {
            type: String,
            trim: true
        },
        review: [
            {
                type: String,
                trim: true
            }
        ],
        intro: {
            type: String,
            trim: true
        },
    },
    { _id: false }
);

export default videoSchema;
