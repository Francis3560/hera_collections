-- AlterTable
ALTER TABLE `CartItem` ADD COLUMN `customTitle` VARCHAR(160) NULL,
    ADD COLUMN `price` DECIMAL(10, 2) NULL,
    MODIFY `productId` INTEGER NULL;

-- AlterTable
ALTER TABLE `OrderItem` MODIFY `productId` INTEGER NULL;
