import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashAdminPassword } from "../lib/admin-session";

const accounts = [
  { role: "ADMIN" as const, password: process.env.ADMIN_WEB_PASSWORD },
  {
    role: "SUPER_ADMIN" as const,
    password: process.env.SUPER_ADMIN_WEB_PASSWORD,
  },
];

async function main() {
  const missingRoles = accounts
    .filter((account) => !account.password)
    .map((account) => account.role);

  if (missingRoles.length > 0) {
    throw new Error(
      `Missing password environment variables for: ${missingRoles.join(", ")}`,
    );
  }

  for (const account of accounts) {
    await prisma.adminAccount.upsert({
      where: { role: account.role },
      create: {
        role: account.role,
        passwordHash: hashAdminPassword(account.password!),
      },
      update: {
        passwordHash: hashAdminPassword(account.password!),
      },
    });
  }

  console.log("Admin accounts synchronized.");
}

main()
  .catch((error) => {
    console.error("Admin account sync failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
