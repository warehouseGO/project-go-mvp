const { PrismaClient, Role, UserStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting production database seeding...");

  // Create Owner user
  const ownerUser = await prisma.user.upsert({
    where: { email: "pratik@jecon.com" },
    update: {},
    create: {
      email: "pratik@jecon.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Pratik Jecon",
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
    },
  });

  console.log("Created owner user:", ownerUser.email);
  console.log("Production database seeding completed successfully!");
  console.log("\nOwner login credentials:");
  console.log("Email: pratik@jecon.com");
  console.log("Password: password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
