import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export const connect = async () => {
    if (cached.conn) {
        return cached.conn;
    }
    cached.promise = cached.promise || mongoose.connect(MONGODB_URI, {
        dbName: 'clerk-users',
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    cached.conn = await cached.promise;
    return cached.conn;
}