import { MongoClient, Db, type MongoClientOptions, MongoServerSelectionError } from "mongodb";
import { DB_NAME } from "./constants";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

/** Tuned for serverless (Vercel): small pool, shorter timeouts, reuse across warm invocations. */
const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 30_000,
  serverSelectionTimeoutMS: 10_000,
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  retryWrites: true,
  retryReads: true,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function resetClientPromise(): void {
  global._mongoClientPromise = undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((err) => {
      resetClientPromise();
      return Promise.reject(err);
    });
  }
  return global._mongoClientPromise;
}

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableMongoError(err: unknown): boolean {
  if (err instanceof MongoServerSelectionError) return true;
  if (err instanceof Error) {
    return /timed out|ECONNREFUSED|ENOTFOUND|ECONNRESET|socket/i.test(err.message);
  }
  return false;
}

export async function getDb(dbName = process.env.MONGODB_DB_NAME || DB_NAME): Promise<Db> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = await getClientPromise();
      return client.db(dbName);
    } catch (err) {
      lastError = err;
      resetClientPromise();
      if (!isRetryableMongoError(err) || attempt === MAX_RETRIES) break;
      await sleep(RETRY_BASE_MS * attempt);
    }
  }

  throw lastError;
}

export default getClientPromise;
