import mongoose from 'mongoose'

/**
 * Connect to MongoDB Atlas. Reads MONGODB_URI from the environment.
 * Retries a couple of times on cold start (Atlas can be slow to wake).
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('x MONGODB_URI is not set. Copy .env.example → .env and paste your Atlas URI.')
    process.exit(1)
  }

  mongoose.set('strictQuery', true)

  const attempt = async (n) => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        autoIndex: true,
      })
      const { host, name } = mongoose.connection
      console.log(`OK MongoDB connected — ${name} @ ${host}`)
    } catch (err) {
      console.error(`x MongoDB connection failed (attempt ${n}): ${err.message}`)
      if (n >= 3) process.exit(1)
      await new Promise((r) => setTimeout(r, 3000))
      return attempt(n + 1)
    }
  }
  await attempt(1)

  mongoose.connection.on('disconnected', () => console.warn('! MongoDB disconnected'))
  mongoose.connection.on('reconnected', () => console.log('OK MongoDB reconnected'))
}

export default connectDB
