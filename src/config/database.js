import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
        console.log(`✓ Database Name: ${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error(`✗ MongoDB Error: ${error.message}`);
        console.log('⚠ Server will continue without database');
        return null;
    }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
});
export default connectDB;