-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "activeProblemId" TEXT;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_activeProblemId_fkey" FOREIGN KEY ("activeProblemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
