import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const RETRY_DELAY_MS = 5000;
const MAX_RETRY_DELAY_MS = 60000;

let retryDelay = RETRY_DELAY_MS;

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI environment variable is not set');
        process.exit(1);
    }

    const dbName = process.env.MONGO_URI.split('/').pop().split('?')[0];
    const env = process.env.NODE_ENV || 'development';
    console.log(`🌍 Environment: ${env}`);
    console.log(`📦 Database: ${dbName}`);

    const options = {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: true, // buffer commands while reconnecting
        heartbeatFrequencyMS: 10000,
    };

    mongoose.connection.on('connected', () => {
        retryDelay = RETRY_DELAY_MS; // reset backoff on success
        console.log('✅ Database connected successfully');
    });

    mongoose.connection.on('error', (err) => {
        console.error('❌ Database connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ Database disconnected — will attempt to reconnect...');
        setTimeout(reconnect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('Database connection closed through app termination');
        process.exit(0);
    });

    await reconnect(options);
};

const reconnect = async (options) => {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI, options);
        }
    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
        console.log(`🔄 Retrying in ${retryDelay / 1000}s...`);
        setTimeout(() => reconnect(options), retryDelay);
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
    }
};

export default connectDB;
