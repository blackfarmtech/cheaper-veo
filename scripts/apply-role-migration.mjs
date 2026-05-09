// Applies the Role enum + role column manually via Prisma raw SQL.
// Workaround for when `prisma db push` is blocked by Supabase pooler limits.
// Idempotent: safe to run multiple times.
//
// Usage:
//   node scripts/apply-role-migration.mjs <adminEmail>

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const adminEmail = process.argv[2];
if (!adminEmail) {
  console.error("Usage: node scripts/apply-role-migration.mjs <adminEmail>");
  process.exit(1);
}

const prisma = new PrismaClient();

console.log("Checking if Role enum exists...");
const enumExists = await prisma.$queryRaw`
  SELECT 1 FROM pg_type WHERE typname = 'Role';
`;

if (enumExists.length === 0) {
  console.log("Creating Role enum...");
  await prisma.$executeRawUnsafe(`CREATE TYPE "Role" AS ENUM ('user', 'admin');`);
} else {
  console.log("Role enum already exists.");
}

console.log("Checking if role column exists on user...");
const columnExists = await prisma.$queryRaw`
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'user' AND column_name = 'role';
`;

if (columnExists.length === 0) {
  console.log("Adding role column to user table...");
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "user" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'user';`,
  );
} else {
  console.log("role column already exists.");
}

console.log(`Granting admin role to ${adminEmail}...`);
const result = await prisma.user.updateMany({
  where: { email: adminEmail },
  data: { role: "admin" },
});

if (result.count === 0) {
  console.warn(`⚠ No user found with email ${adminEmail}`);
} else {
  console.log(`✅ Granted admin to ${result.count} user(s)`);
}

const adminUser = await prisma.user.findUnique({
  where: { email: adminEmail },
  select: { id: true, email: true, role: true },
});
console.log("Final state:", adminUser);

await prisma.$disconnect();
