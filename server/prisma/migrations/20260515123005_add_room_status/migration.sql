/*
  Warnings:

  - Added the required column `updatedAt` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'ACTIVE', 'ENDED');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "candidateId" TEXT,
ADD COLUMN     "interviewerId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
