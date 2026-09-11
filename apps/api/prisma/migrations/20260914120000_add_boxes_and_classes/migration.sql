CREATE TYPE "BoxMemberRole" AS ENUM ('OWNER', 'COACH', 'ATHLETE');
CREATE TYPE "ClassBookingStatus" AS ENUM ('BOOKED', 'ATTENDED', 'CANCELLED');

CREATE TABLE "Box" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "joinCode" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Box_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BoxMembership" (
  "id" TEXT NOT NULL,
  "boxId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "BoxMemberRole" NOT NULL DEFAULT 'ATHLETE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BoxMembership_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ClassSession" (
  "id" TEXT NOT NULL,
  "boxId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "capacity" INTEGER NOT NULL,
  "workoutId" TEXT,
  "workoutVariantId" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ClassBooking" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "ClassBookingStatus" NOT NULL DEFAULT 'BOOKED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassBooking_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Box_joinCode_key" ON "Box"("joinCode");
CREATE INDEX "Box_ownerUserId_idx" ON "Box"("ownerUserId");
CREATE UNIQUE INDEX "BoxMembership_boxId_userId_key" ON "BoxMembership"("boxId", "userId");
CREATE INDEX "BoxMembership_userId_role_idx" ON "BoxMembership"("userId", "role");
CREATE INDEX "ClassSession_boxId_startsAt_idx" ON "ClassSession"("boxId", "startsAt");
CREATE UNIQUE INDEX "ClassBooking_classId_userId_key" ON "ClassBooking"("classId", "userId");
CREATE INDEX "ClassBooking_userId_status_idx" ON "ClassBooking"("userId", "status");
ALTER TABLE "Box" ADD CONSTRAINT "Box_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoxMembership" ADD CONSTRAINT "BoxMembership_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoxMembership" ADD CONSTRAINT "BoxMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_workoutVariantId_fkey" FOREIGN KEY ("workoutVariantId") REFERENCES "WorkoutVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClassBooking" ADD CONSTRAINT "ClassBooking_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassBooking" ADD CONSTRAINT "ClassBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
