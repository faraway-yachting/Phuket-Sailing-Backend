import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import app from './app.js';
import connectDB from './config/db.js';

dotenv.config();

app.use('/uploads', express.static(path.join(process.cwd(), 'src/uploads')));

let isConnected = false;

const startServer = async () => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }
};

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    startServer().then(() => {
        app.listen(PORT, () => {
            console.log(`Phuket Sailing is running on port ${PORT}`);
        });
    });
}

export default async (req, res) => {
    await startServer();
    return app(req, res);
};
