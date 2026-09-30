ALTER TABLE "AthleteProfile" ADD COLUMN "avatarPath" TEXT;

UPDATE "AthleteProfile"
SET "avatarPath" = "avatarUrl"
WHERE "avatarUrl" LIKE 'profiles/%';

ALTER TABLE "AthleteProfile" DROP COLUMN "avatarUrl";
