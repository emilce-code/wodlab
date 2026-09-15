CREATE TYPE "MovementScope" AS ENUM ('GLOBAL', 'BOX', 'PERSONAL');

ALTER TABLE "Movement"
ADD COLUMN "scope" "MovementScope" NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN "boxId" TEXT;

UPDATE "Movement"
SET "scope" = CASE
  WHEN "official" = true THEN 'GLOBAL'::"MovementScope"
  ELSE 'PERSONAL'::"MovementScope"
END;

ALTER TABLE "Movement"
ADD CONSTRAINT "Movement_boxId_fkey"
FOREIGN KEY ("boxId") REFERENCES "Box"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Movement_scope_boxId_idx" ON "Movement"("scope", "boxId");
CREATE INDEX "Movement_scope_createdByUserId_idx" ON "Movement"("scope", "createdByUserId");
