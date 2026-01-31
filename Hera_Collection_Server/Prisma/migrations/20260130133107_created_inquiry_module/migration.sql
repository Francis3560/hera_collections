-- AlterTable
ALTER TABLE `notification` MODIFY `type` ENUM('ORDER_PLACED', 'ORDER_CANCELLED', 'ORDER_FULFILLED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'STOCK_LOW', 'STOCK_OUT', 'SYSTEM_ALERT', 'PROMOTION', 'MESSAGE', 'INQUIRY_MESSAGE') NOT NULL;

-- CreateTable
CREATE TABLE `InquirySession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NULL,
    `guestId` VARCHAR(128) NULL,
    `guestName` VARCHAR(120) NULL,
    `guestEmail` VARCHAR(191) NULL,
    `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InquirySession_userId_idx`(`userId`),
    INDEX `InquirySession_guestId_idx`(`guestId`),
    INDEX `InquirySession_status_idx`(`status`),
    INDEX `InquirySession_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InquiryMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` VARCHAR(191) NOT NULL,
    `senderId` INTEGER NULL,
    `isFromAdmin` BOOLEAN NOT NULL DEFAULT false,
    `content` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InquiryMessage_sessionId_idx`(`sessionId`),
    INDEX `InquiryMessage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InquirySession` ADD CONSTRAINT `InquirySession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InquiryMessage` ADD CONSTRAINT `InquiryMessage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `InquirySession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
