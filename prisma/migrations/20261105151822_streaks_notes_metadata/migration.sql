-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('SOLVED', 'REVIEWED', 'PRACTICED');

-- DropForeignKey
ALTER TABLE "RevisionSchedule" DROP CONSTRAINT "RevisionSchedule_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserProgress" DROP CONSTRAINT "UserProgress_userId_fkey";

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "blind75" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "freeLink" TEXT,
ADD COLUMN     "premium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "streakProblemDay" TEXT,
ADD COLUMN     "streakProblemId" TEXT;

-- AlterTable
ALTER TABLE "UserProgress" ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT,
    "type" "ActivityType" NOT NULL,
    "rating" "Rating",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Problem_topicId_orderIndex_idx" ON "Problem"("topicId", "orderIndex");

-- CreateIndex
CREATE INDEX "RevisionSchedule_userId_nextReviewDate_idx" ON "RevisionSchedule"("userId", "nextReviewDate");

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionSchedule" ADD CONSTRAINT "RevisionSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: turn existing solves into activity history so streaks and the
-- heatmap are not empty for people who used the app before this migration.
INSERT INTO "Activity" ("id", "userId", "problemId", "type", "createdAt")
SELECT gen_random_uuid()::text, "userId", "problemId", 'SOLVED', "solvedAt"
FROM "UserProgress"
WHERE "status" = 'SOLVED' AND "solvedAt" IS NOT NULL;
