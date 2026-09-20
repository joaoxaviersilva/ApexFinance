-- CreateEnum
CREATE TYPE "CashAccountType" AS ENUM ('GENERAL');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('DEPOSIT', 'WITHDRAWAL');

-- CreateTable
CREATE TABLE "cash_account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CashAccountType" NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movement" (
    "id" TEXT NOT NULL,
    "cashAccountId" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "deltaCents" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_account_userId_idx" ON "cash_account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cash_account_userId_type_key" ON "cash_account"("userId", "type");

-- CreateIndex
CREATE INDEX "cash_movement_cashAccountId_occurredAt_createdAt_idx" ON "cash_movement"("cashAccountId", "occurredAt" DESC, "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "cash_account" ADD CONSTRAINT "cash_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "cash_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
