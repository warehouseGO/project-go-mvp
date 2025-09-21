-- CreateTable
CREATE TABLE "manpower" (
    "id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "designation" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "dayshift" INTEGER NOT NULL DEFAULT 0,
    "nightshift" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "manpower_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manpower_site_id_date_idx" ON "manpower"("site_id", "date");

-- CreateIndex
CREATE INDEX "manpower_date_idx" ON "manpower"("date");

-- CreateIndex
CREATE INDEX "manpower_designation_idx" ON "manpower"("designation");

-- CreateIndex
CREATE INDEX "manpower_site_id_designation_idx" ON "manpower"("site_id", "designation");

-- CreateIndex
CREATE INDEX "manpower_created_by_idx" ON "manpower"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "manpower_site_id_designation_date_key" ON "manpower"("site_id", "designation", "date");

-- AddForeignKey
ALTER TABLE "manpower" ADD CONSTRAINT "manpower_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manpower" ADD CONSTRAINT "manpower_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manpower" ADD CONSTRAINT "manpower_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
