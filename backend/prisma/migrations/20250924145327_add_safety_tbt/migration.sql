-- AlterTable
ALTER TABLE "jobs" ALTER COLUMN "device_type" DROP NOT NULL;

-- CreateTable
CREATE TABLE "safety" (
    "id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "nearmiss" INTEGER NOT NULL DEFAULT 0,
    "firstaid" INTEGER NOT NULL DEFAULT 0,
    "lti" INTEGER NOT NULL DEFAULT 0,
    "fireincidents" INTEGER NOT NULL DEFAULT 0,
    "audits_conducted" INTEGER NOT NULL DEFAULT 0,
    "incident_report" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "safety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbt_topics" (
    "id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "specific_ppe" TEXT,
    "housekeeping" TEXT,
    "plant_equipment_safety" TEXT,
    "working_under_suspended_load" TEXT,
    "important_of_eye_shower" TEXT,

    CONSTRAINT "tbt_topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "safety_site_id_date_idx" ON "safety"("site_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "safety_site_id_date_key" ON "safety"("site_id", "date");

-- CreateIndex
CREATE INDEX "tbt_topics_site_id_date_idx" ON "tbt_topics"("site_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "tbt_topics_site_id_date_key" ON "tbt_topics"("site_id", "date");

-- AddForeignKey
ALTER TABLE "safety" ADD CONSTRAINT "safety_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbt_topics" ADD CONSTRAINT "tbt_topics_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
