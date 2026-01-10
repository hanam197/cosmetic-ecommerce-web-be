import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
    {
        gallery: [
            {
                type: String,
                trim: true
            }
        ],
        thumbnail: {
            type: String,
            trim: true
        },
        hover: {
            type: String,
            trim: true,
            default: ''
        },
        banner: {
            type: String,
            trim: true,
            default: ''
        }
    },
    { _id: false }
);

export default imageSchema;
