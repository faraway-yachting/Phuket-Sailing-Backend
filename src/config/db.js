import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        console.log('🔍 Checking MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');

        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not set');
        }

        // Connection options for better performance
        const options = {
            maxPoolSize: 10, // Maximum number of connections in the pool
            minPoolSize: 2,  // Minimum number of connections in the pool
            serverSelectionTimeoutMS: 5000, // Timeout for server selection
            socketTimeoutMS: 45000, // Socket timeout
            bufferCommands: false, // Disable mongoose buffering
        };

        const { connection } = await mongoose.connect(process.env.MONGO_URI, options);

        // Set up connection event listeners
        connection.on('connected', () => {
        console.log('✅ Database connected successfully');
        });

        connection.on('error', (err) => {
            console.error('❌ Database connection error:', err);
        });

        connection.on('disconnected', () => {
            console.log('⚠️ Database disconnected');
        });

    } catch (error) {
        console.log('❌ Error connecting database:', error.message);
        throw error;
    }
};

export default connectDB;
