import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";
const port = config.port || 5000;

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully");
    app.listen(port, () => {
      console.log(`server is runing on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("An error occurred", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}
main();
