// Starts a local MongoDB server for development — no separate MongoDB install needed.
// Data is stored in ./.data/db, so bookings survive restarts.
// To use a real MongoDB (local install or Atlas) instead, just change MONGODB_URI
// in .env.local and don't run this script.
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

const dbPath = resolve(".data/db");
mkdirSync(dbPath, { recursive: true });

const mongod = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath, storageEngine: "wiredTiger" },
});

console.log(`MongoDB running at ${mongod.getUri()} (data in ${dbPath})`);

async function shutdown() {
  await mongod.stop({ doCleanup: false }); // keep the data folder
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
