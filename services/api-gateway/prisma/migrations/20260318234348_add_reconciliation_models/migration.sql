-- CreateTable
CREATE TABLE "ReconciliationReport" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total" INTEGER NOT NULL,
    "matchedCount" INTEGER NOT NULL,
    "mismatchedCount" INTEGER NOT NULL,
    "missingCount" INTEGER NOT NULL,

    CONSTRAINT "ReconciliationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationItem" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "csvData" JSONB NOT NULL,
    "dbData" JSONB,

    CONSTRAINT "ReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReconciliationItem" ADD CONSTRAINT "ReconciliationItem_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ReconciliationReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
