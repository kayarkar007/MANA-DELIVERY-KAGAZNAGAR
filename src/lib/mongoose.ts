import mongoose from "mongoose";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri && process.env.NODE_ENV === "production" && process.env.VERCEL) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside Vercel Project Settings."
    );
  }
  return uri || "mongodb://127.0.0.1:27017/mana_delivery_build_placeholder";
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // ── Connection pool ───────────────────────────────────────────────────
      // 10 simultaneous sockets is enough for Vercel serverless functions.
      // Raise to 20-50 when on a dedicated Atlas M10+ cluster.
      maxPoolSize: 10,
      minPoolSize: 2,
      // ── Timeout guards ────────────────────────────────────────────────────
      // Fail fast instead of hanging indefinitely when Atlas is unreachable.
      serverSelectionTimeoutMS: 5_000, // 5 s to find a primary
      socketTimeoutMS: 45_000,         // 45 s idle socket before closing
      connectTimeoutMS: 10_000,        // 10 s to open initial TCP connection
      // ── Heartbeat ─────────────────────────────────────────────────────────
      heartbeatFrequencyMS: 10_000,    // Detect stale connections every 10 s
    };

    cached.promise = mongoose.connect(getMongoUri(), opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
