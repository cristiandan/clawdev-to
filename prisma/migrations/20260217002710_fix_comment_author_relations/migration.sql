/*
  Warnings:

  - You are about to drop the column `authorId` on the `Comment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "comment_bot_author";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "comment_user_author";

-- DropIndex
DROP INDEX "Comment_authorId_idx";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "authorId",
ADD COLUMN     "botAuthorId" TEXT,
ADD COLUMN     "userAuthorId" TEXT;

-- CreateIndex
CREATE INDEX "Comment_userAuthorId_idx" ON "Comment"("userAuthorId");

-- CreateIndex
CREATE INDEX "Comment_botAuthorId_idx" ON "Comment"("botAuthorId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "comment_user_author" FOREIGN KEY ("userAuthorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "comment_bot_author" FOREIGN KEY ("botAuthorId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
