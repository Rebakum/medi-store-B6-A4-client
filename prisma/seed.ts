import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient({}); // 👈 EMPTY OBJECT REQUIRED in Prisma 7

async function main() {
  const email = "admin@medistore.com";

  const exists = await prisma.user.findUnique({
    where: { email },
  });

  if (exists) {
    console.log("Admin already exists");
    return;
  }

  const password = await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      password,
      role: "ADMIN",
    },
  });

  console.log("Admin created");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
