import mongoose from "mongoose";

// In dev, Next.js reloads modules on every change. Caching the connection on
// `global` stops us from opening a new MongoDB connection on each reload.
let cached = global._mongoose ?? (global._mongoose = { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local");

  cached.promise ??= mongoose.connect(uri);
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow a retry on the next request
    throw err;
  }
  return cached.conn;
}
