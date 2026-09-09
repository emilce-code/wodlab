CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

ALTER TABLE "Movement"
ADD COLUMN "description" TEXT,
ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "createdByUserId" TEXT;

CREATE INDEX "Movement_createdByUserId_idx"
ON "Movement"("createdByUserId");

ALTER TABLE "Movement"
ADD CONSTRAINT "Movement_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
