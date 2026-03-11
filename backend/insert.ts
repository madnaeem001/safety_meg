import { db } from './src/db';
import { incidents } from './src/__generated__/schema';

async function run() {
  console.log("Entry is being added...");
  await db.insert(incidents).values({
    title: "Client Video Test",
    description: "Successfully wired the SQLite Database!",
    severity: "Critical"
  });
  console.log("Entry is added! see you in the next one...");
}
run();