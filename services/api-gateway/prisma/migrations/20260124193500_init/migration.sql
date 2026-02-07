-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "fee" TEXT,
    "feeAsset" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);
