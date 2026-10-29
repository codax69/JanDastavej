import { connectDB, disconnectDB } from '../config/db.js';
import { seed } from '../scripts/seed.js';

export async function setup(): Promise<void> {
  await connectDB();
  await seed();
  await disconnectDB();
}
