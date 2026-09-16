-- CreateTable
CREATE TABLE "MovementTranslation" (
    "id" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovementTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MovementTranslation_movementId_locale_key" ON "MovementTranslation"("movementId", "locale");

-- CreateIndex
CREATE INDEX "MovementTranslation_locale_idx" ON "MovementTranslation"("locale");

-- AddForeignKey
ALTER TABLE "MovementTranslation" ADD CONSTRAINT "MovementTranslation_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
