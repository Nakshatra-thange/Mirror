-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "currentCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "currentLanguage" TEXT NOT NULL DEFAULT 'javascript';
