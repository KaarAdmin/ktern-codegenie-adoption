import { MongoClient } from 'mongodb'

// Get MongoDB connection string from environment variable
const uri = process.env.MONGODB_URI || "mongodb+srv://qas-app-rwuser:fSXQNZ7G9B38n4xi@quality-app.ss86w.mongodb.net/"

if (!process.env.MONGODB_URI) {
  console.warn('Warning: MONGODB_URI environment variable is not set. Using fallback connection string.')
}

const options = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
