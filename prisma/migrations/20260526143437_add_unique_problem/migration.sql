/*
  Warnings:

  - A unique constraint covering the columns `[title,topicId]` on the table `Problem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Problem_title_topicId_key" ON "Problem"("title", "topicId");
