import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const dbUri = process.env.MONGODB_URI || 'mongodb+srv://dev_admin:123987@cluster0.y4hq7kx.mongodb.net/cosmetic_ecommerce?retryWrites=true&w=majority&appName=Cluster0';

async function checkProduct() {
    try {
        await mongoose.connect(dbUri);
        console.log('Connected to DB');
        
        const product = await mongoose.connection.collection('products').findOne({ slug: 'dew-tint' });
        
        if (product) {
            console.log('Product Found:', product.name);
            console.log('videoSrc exists:', !!product.videoSrc);
            if (product.videoSrc) {
                console.log('videoSrc content:', JSON.stringify(product.videoSrc, null, 2));
            }
        } else {
            console.log('Product not found');
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkProduct();
