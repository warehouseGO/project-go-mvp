-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('COMPLETED', 'CONSTRAINT', 'IN_PROGRESS', 'PENDING');

-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "status" "DeviceStatus" NOT NULL DEFAULT 'PENDING';
