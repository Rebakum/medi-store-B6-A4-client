import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";
import { ensureSuperAdmin } from "./seedAmin/ensureSuperAdmin";

const port = config.port || 5000;

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully");

    if (config.auto_seed_super_admin === "true") {
      await ensureSuperAdmin();
    }

    app.listen(port, () => {
      console.log(`server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("An error occurred", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
