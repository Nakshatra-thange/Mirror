/*
  Warnings:

  - You are about to drop the column `feedback` on the `Session` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('STRONG_HIRE', 'HIRE', 'NO_HIRE', 'STRONG_NO_HIRE');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "status" "RoomStatus" NOT NULL DEFAULT 'WAITING';

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "feedback",
ADD COLUMN     "codeQualityScore" INTEGER,
ADD COLUMN     "communicationScore" INTEGER,
ADD COLUMN     "feedbackLockedAt" TIMESTAMP(3),
ADD COLUMN     "feedbackSummary" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "improvements" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'javascript',
ADD COLUMN     "problemSolvingScore" INTEGER,
ADD COLUMN     "strengths" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "verdict" "Verdict";
