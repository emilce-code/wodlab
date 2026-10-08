CREATE TABLE "BoxOrganization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "logoPath" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BoxOrganization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BoxOrganizationOwner" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BoxOrganizationOwner_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Box" ADD COLUMN "organizationId" TEXT;

CREATE INDEX "Box_organizationId_idx" ON "Box"("organizationId");
CREATE INDEX "BoxOrganization_name_idx" ON "BoxOrganization"("name");
CREATE INDEX "BoxOrganizationOwner_userId_idx" ON "BoxOrganizationOwner"("userId");
CREATE UNIQUE INDEX "BoxOrganizationOwner_organizationId_userId_key" ON "BoxOrganizationOwner"("organizationId", "userId");

ALTER TABLE "Box" ADD CONSTRAINT "Box_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "BoxOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BoxOrganizationOwner" ADD CONSTRAINT "BoxOrganizationOwner_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "BoxOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoxOrganizationOwner" ADD CONSTRAINT "BoxOrganizationOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
