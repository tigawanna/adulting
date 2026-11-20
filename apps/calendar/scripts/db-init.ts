import { getDb, initializeDatabase } from "../server/db.js";

try {
  process.loadEnvFile?.(".env");
} catch {
  // no .env file
}

await initializeDatabase();
console.log("Calendar schema is ready.");
getDb().close();
