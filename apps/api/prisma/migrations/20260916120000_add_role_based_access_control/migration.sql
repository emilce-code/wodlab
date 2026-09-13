ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('USER', 'COACH', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
ALTER COLUMN "role" TYPE "UserRole"
USING ("role"::TEXT::"UserRole");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
DROP TYPE "UserRole_old";

UPDATE "User"
SET "role" = 'COACH'
WHERE "role" = 'USER'
  AND (
    EXISTS (
      SELECT 1 FROM "CoachProfile"
      WHERE "CoachProfile"."userId" = "User"."id"
    )
    OR EXISTS (
      SELECT 1 FROM "Box"
      WHERE "Box"."ownerUserId" = "User"."id"
    )
  );

CREATE TABLE "UserRoleChange" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "previousRole" "UserRole" NOT NULL,
  "newRole" "UserRole" NOT NULL,
  "changedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserRoleChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserRoleChange_userId_createdAt_idx"
ON "UserRoleChange"("userId", "createdAt");

CREATE INDEX "UserRoleChange_changedById_createdAt_idx"
ON "UserRoleChange"("changedById", "createdAt");

ALTER TABLE "UserRoleChange"
ADD CONSTRAINT "UserRoleChange_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserRoleChange"
ADD CONSTRAINT "UserRoleChange_changedById_fkey"
FOREIGN KEY ("changedById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
