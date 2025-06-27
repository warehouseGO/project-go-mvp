-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('WORKING', 'BREAKDOWN', 'FREE');

-- CreateTable
CREATE TABLE "Resource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "regNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "siteId" INTEGER,
    "allocatedAt" TIMESTAMP(3),
    "status" "ResourceStatus" NOT NULL DEFAULT 'FREE',
    "dispatchDate" TIMESTAMP(3),
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resource_regNo_key" ON "Resource"("regNo");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
