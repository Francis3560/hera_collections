-- AlterTable
ALTER TABLE `review` ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `isApproved` BOOLEAN NOT NULL DEFAULT false;
