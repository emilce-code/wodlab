ALTER TABLE "Box"
  ADD COLUMN "address" TEXT,
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "supportContact" TEXT;

UPDATE "Box"
SET "address" = "location"
WHERE "address" IS NULL AND "location" IS NOT NULL;
