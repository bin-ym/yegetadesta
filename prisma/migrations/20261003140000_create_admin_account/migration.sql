CREATE TYPE "AdminAccountRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

CREATE TABLE "AdminAccount" (
    "id" TEXT NOT NULL,
    "role" "AdminAccountRole" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminAccount_role_key" ON "AdminAccount"("role");
