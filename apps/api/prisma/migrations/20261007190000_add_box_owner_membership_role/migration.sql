INSERT INTO "BoxMembershipRole" ("id", "key", "name", "sortOrder", "createdAt", "updatedAt")
VALUES ('box-membership-role-owner', 'OWNER', 'Owner', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "BoxMembership" ("id", "boxId", "userId", "roleId", "status", "joinedAt", "createdAt", "updatedAt")
SELECT
  'box-owner-membership-' || "Box"."id",
  "Box"."id",
  "Box"."ownerUserId",
  'box-membership-role-owner',
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Box"
ON CONFLICT ("boxId", "userId") DO UPDATE SET
  "roleId" = 'box-membership-role-owner',
  "status" = 'ACTIVE',
  "leftAt" = NULL,
  "joinedAt" = COALESCE("BoxMembership"."joinedAt", CURRENT_TIMESTAMP),
  "updatedAt" = CURRENT_TIMESTAMP;
