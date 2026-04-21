const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const uri = process.env.MONGO_URI;

if (!uri) {
    console.error('Error: MONGO_URI is not defined in .env');
    process.exit(1);
}

const client = new MongoClient(uri);

let dbConnection;

const connectDB = async () => {
    try {
        // Connect via Native Driver
        await client.connect();
        dbConnection = client.db();
        console.log('MongoDB Connected Successfully via Official Driver');

        // Connect via Mongoose
        await mongoose.connect(uri);
        console.log('Mongoose Connected Successfully');

        return dbConnection;
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const getDb = () => {
    if (!dbConnection) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return dbConnection;
};

module.exports = { connectDB, getDb, client };
