import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        console.log('🔍 Checking MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');

        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not set');
        }

        const dbName = process.env.MONGO_URI.split('/').pop().split('?')[0];
        const env = process.env.NODE_ENV || 'development';
        console.log(`🌍 Environment: ${env}`);
        console.log(`📦 Database: ${dbName}`);

        // Connection options for better performance
        const options = {
            maxPoolSize: 10, // Maximum number of connections in the pool
            minPoolSize: 2,  // Minimum number of connections in the pool
            serverSelectionTimeoutMS: 5000, // Timeout for server selection
            socketTimeoutMS: 45000, // Socket timeout
            bufferCommands: false, // Disable mongoose buffering
        };

        const { connection } = await mongoose.connect(process.env.MONGO_URI, options);

        if (connection.readyState === 1) {
            console.log('✅ Database connected successfully');
        }

        connection.on('connected', () => {
            console.log('✅ Database connected successfully');
        });

        connection.on('error', (err) => {
            console.error('❌ Database connection error:', err);
        });

        connection.on('disconnected', () => {
            console.log('⚠️ Database disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await connection.close();
            console.log('Database connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.log('❌ Error connecting database:', error.message);
        process.exit(1);
    }
};

export default connectDB;
