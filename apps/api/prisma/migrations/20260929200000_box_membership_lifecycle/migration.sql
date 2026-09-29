-- Preserve Box membership history and replace the fixed membership-role enum with lookup data.
CREATE TYPE "BoxMembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

CREATE TABLE "BoxMembershipRole" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BoxMembershipRole_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BoxMembershipRole_key_key" ON "BoxMembershipRole"("key");
INSERT INTO "BoxMembershipRole" ("id","key","name","sortOrder","updatedAt") VALUES
('box-membership-role-athlete','ATHLETE','Athlete',10,CURRENT_TIMESTAMP),
('box-membership-role-coach','COACH','Coach',20,CURRENT_TIMESTAMP);

ALTER TABLE "BoxMembership" ADD COLUMN "roleId" TEXT, ADD COLUMN "status" "BoxMembershipStatus" NOT NULL DEFAULT 'ACTIVE', ADD COLUMN "joinedAt" TIMESTAMP(3), ADD COLUMN "leftAt" TIMESTAMP(3);
UPDATE "BoxMembership" SET "roleId"=CASE WHEN "role"::text='COACH' THEN 'box-membership-role-coach' ELSE 'box-membership-role-athlete' END, "joinedAt"="createdAt";
ALTER TABLE "BoxMembership" ALTER COLUMN "roleId" SET NOT NULL;
ALTER TABLE "BoxMembership" DROP COLUMN "role";
DROP TYPE "BoxMemberRole";
CREATE INDEX "BoxMembership_userId_roleId_idx" ON "BoxMembership"("userId","roleId");
CREATE INDEX "BoxMembership_boxId_status_idx" ON "BoxMembership"("boxId","status");
CREATE INDEX "BoxMembership_userId_status_idx" ON "BoxMembership"("userId","status");
ALTER TABLE "BoxMembership" ADD CONSTRAINT "BoxMembership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "BoxMembershipRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
