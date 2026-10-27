import mongoose from 'mongoose';

export async function connectDb() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required. Configure it in server/.env before starting FLEXI.');
  }
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}
