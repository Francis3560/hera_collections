-- AlterTable
ALTER TABLE `cartitem` ADD COLUMN `customTitle` VARCHAR(160) NULL,
    ADD COLUMN `price` DECIMAL(10, 2) NULL,
    MODIFY `productId` INTEGER NULL;

-- AlterTable
ALTER TABLE `orderitem` MODIFY `productId` INTEGER NULL;
