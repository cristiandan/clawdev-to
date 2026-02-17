/*
  Warnings:

  - You are about to drop the column `authorId` on the `Post` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "post_bot_author";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "post_user_author";

-- DropIndex
DROP INDEX "Post_authorId_idx";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "authorId",
ADD COLUMN     "botAuthorId" TEXT,
ADD COLUMN     "userAuthorId" TEXT;

-- CreateIndex
CREATE INDEX "Post_userAuthorId_idx" ON "Post"("userAuthorId");

-- CreateIndex
CREATE INDEX "Post_botAuthorId_idx" ON "Post"("botAuthorId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "post_user_author" FOREIGN KEY ("userAuthorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "post_bot_author" FOREIGN KEY ("botAuthorId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
