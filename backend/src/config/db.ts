import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatly';

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.log(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Close MongoDB connection when Node process ends
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

export default connectDB; 