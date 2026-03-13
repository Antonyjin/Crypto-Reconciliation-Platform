/*
  Warnings:

  - A unique constraint covering the columns `[externalId,exchange]` on the table `Trade` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalId` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "externalId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Trade_externalId_exchange_key" ON "Trade"("externalId", "exchange");
