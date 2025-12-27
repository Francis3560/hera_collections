-- CreateTable
CREATE TABLE `StockMovement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `movementType` ENUM('ADDITION', 'ADJUSTMENT', 'SALE', 'RETURN', 'DAMAGE', 'LOSS', 'TRANSFER', 'CORRECTION') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `previousStock` INTEGER NOT NULL,
    `newStock` INTEGER NOT NULL,
    `referenceId` INTEGER NULL,
    `referenceType` VARCHAR(50) NULL,
    `reason` TEXT NULL,
    `notes` TEXT NULL,
    `createdById` INTEGER NOT NULL,
    `location` VARCHAR(120) NULL,
    `costPrice` DECIMAL(10, 2) NULL,
    `sellingPrice` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StockMovement_productId_idx`(`productId`),
    INDEX `StockMovement_movementType_idx`(`movementType`),
    INDEX `StockMovement_createdAt_idx`(`createdAt`),
    INDEX `StockMovement_referenceId_referenceType_idx`(`referenceId`, `referenceType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockAlert` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `threshold` INTEGER NOT NULL DEFAULT 10,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `notifiedAt` DATETIME(3) NULL,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedAt` DATETIME(3) NULL,
    `resolvedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StockAlert_isActive_idx`(`isActive`),
    INDEX `StockAlert_isResolved_idx`(`isResolved`),
    UNIQUE INDEX `StockAlert_productId_key`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockTake` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(160) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `totalItems` INTEGER NOT NULL DEFAULT 0,
    `itemsCounted` INTEGER NOT NULL DEFAULT 0,
    `itemsAdjusted` INTEGER NOT NULL DEFAULT 0,
    `discrepancyValue` DECIMAL(10, 2) NULL,
    `createdById` INTEGER NOT NULL,
    `approvedById` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StockTake_status_idx`(`status`),
    INDEX `StockTake_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockTakeItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stockTakeId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `systemQuantity` INTEGER NOT NULL,
    `countedQuantity` INTEGER NOT NULL,
    `difference` INTEGER NOT NULL,
    `adjusted` BOOLEAN NOT NULL DEFAULT false,
    `adjustedAt` DATETIME(3) NULL,
    `adjustedById` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StockTakeItem_productId_idx`(`productId`),
    INDEX `StockTakeItem_difference_idx`(`difference`),
    UNIQUE INDEX `StockTakeItem_stockTakeId_productId_key`(`stockTakeId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAlert` ADD CONSTRAINT `StockAlert_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAlert` ADD CONSTRAINT `StockAlert_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTake` ADD CONSTRAINT `StockTake_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTake` ADD CONSTRAINT `StockTake_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTakeItem` ADD CONSTRAINT `StockTakeItem_stockTakeId_fkey` FOREIGN KEY (`stockTakeId`) REFERENCES `StockTake`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTakeItem` ADD CONSTRAINT `StockTakeItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTakeItem` ADD CONSTRAINT `StockTakeItem_adjustedById_fkey` FOREIGN KEY (`adjustedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
