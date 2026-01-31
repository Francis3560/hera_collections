-- AlterTable
ALTER TABLE `Review` ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `isApproved` BOOLEAN NOT NULL DEFAULT false;
