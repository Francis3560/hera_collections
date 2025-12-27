/*
  Warnings:

  - You are about to drop the column `phone` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `verificationCodeExpires` on the `user` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.
  - A unique constraint covering the columns `[slug]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku]` on the table `Variant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Variant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `category` ADD COLUMN `image` VARCHAR(512) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `parentId` INTEGER NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `expense` ADD COLUMN `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nextOccurrence` DATETIME(3) NULL,
    ADD COLUMN `recurrence` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `expensecategory` ADD COLUMN `color` VARCHAR(7) NULL,
    ADD COLUMN `icon` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `message` ADD COLUMN `isRead` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `readAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `order` DROP COLUMN `phone`,
    ADD COLUMN `billingAddress` TEXT NULL,
    ADD COLUMN `billingCity` VARCHAR(120) NULL,
    ADD COLUMN `billingCountry` VARCHAR(120) NULL,
    ADD COLUMN `billingState` VARCHAR(120) NULL,
    ADD COLUMN `billingZipCode` VARCHAR(20) NULL,
    ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `carrier` VARCHAR(100) NULL,
    ADD COLUMN `currency` VARCHAR(3) NOT NULL DEFAULT 'KES',
    ADD COLUMN `customerNotes` TEXT NULL,
    ADD COLUMN `customerPhone` VARCHAR(32) NULL,
    ADD COLUMN `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `estimatedDelivery` DATETIME(3) NULL,
    ADD COLUMN `internalNotes` TEXT NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `shippingCost` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `shippingMethod` VARCHAR(100) NULL,
    ADD COLUMN `shippingState` VARCHAR(120) NULL,
    ADD COLUMN `shippingZipCode` VARCHAR(20) NULL,
    ADD COLUMN `taxAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `trackingNumber` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `orderitem` ADD COLUMN `discount` DECIMAL(10, 2) NULL,
    ADD COLUMN `total` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `variantId` INTEGER NULL;

-- AlterTable
ALTER TABLE `paymentintent` ADD COLUMN `cardBrand` VARCHAR(50) NULL,
    ADD COLUMN `cardExpiryMonth` INTEGER NULL,
    ADD COLUMN `cardExpiryYear` INTEGER NULL,
    ADD COLUMN `cardLastFour` VARCHAR(4) NULL,
    ADD COLUMN `currency` VARCHAR(3) NOT NULL DEFAULT 'KES',
    ADD COLUMN `errorMessage` TEXT NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `receiptUrl` VARCHAR(512) NULL;

-- AlterTable
ALTER TABLE `photo` ADD COLUMN `altText` VARCHAR(255) NULL,
    ADD COLUMN `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `brand` VARCHAR(120) NULL,
    ADD COLUMN `dimensions` VARCHAR(100) NULL,
    ADD COLUMN `manufacturer` VARCHAR(120) NULL,
    ADD COLUMN `metaDescription` VARCHAR(255) NULL,
    ADD COLUMN `metaTitle` VARCHAR(160) NULL,
    ADD COLUMN `publishedAt` DATETIME(3) NULL,
    ADD COLUMN `purchases` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `rating` DECIMAL(3, 2) NULL,
    ADD COLUMN `reviewCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `slug` VARCHAR(200) NOT NULL,
    ADD COLUMN `views` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `weight` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `stockalert` ADD COLUMN `resolutionNotes` TEXT NULL;

-- AlterTable
ALTER TABLE `stockmovement` ADD COLUMN `unitCost` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `stocktake` ADD COLUMN `discrepancyPercentage` DECIMAL(5, 2) NULL,
    ADD COLUMN `location` VARCHAR(120) NULL;

-- AlterTable
ALTER TABLE `stocktakeitem` ADD COLUMN `variancePercentage` DECIMAL(5, 2) NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `verificationCodeExpires`,
    ADD COLUMN `backupCodes` TEXT NULL,
    ADD COLUMN `bio` TEXT NULL,
    ADD COLUMN `dateOfBirth` DATETIME(3) NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `emailVerifiedByGoogle` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `familyName` VARCHAR(120) NULL,
    ADD COLUMN `givenName` VARCHAR(120) NULL,
    ADD COLUMN `googleId` VARCHAR(255) NULL,
    ADD COLUMN `language` VARCHAR(10) NOT NULL DEFAULT 'en',
    ADD COLUMN `lastPasswordChange` DATETIME(3) NULL,
    ADD COLUMN `locale` VARCHAR(10) NULL,
    ADD COLUMN `location` VARCHAR(120) NULL,
    ADD COLUMN `lockedUntil` DATETIME(3) NULL,
    ADD COLUMN `loginAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `marketingEmails` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `passwordResetExpires` DATETIME(3) NULL,
    ADD COLUMN `passwordResetToken` VARCHAR(255) NULL,
    ADD COLUMN `picture` VARCHAR(512) NULL,
    ADD COLUMN `provider` ENUM('EMAIL', 'GOOGLE') NOT NULL DEFAULT 'EMAIL',
    ADD COLUMN `smsNotifications` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC',
    ADD COLUMN `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `twoFactorSecret` VARCHAR(255) NULL,
    ADD COLUMN `website` VARCHAR(255) NULL,
    MODIFY `status` ENUM('ONLINE', 'OFFLINE', 'AWAY', 'BUSY') NOT NULL DEFAULT 'OFFLINE';

-- AlterTable
ALTER TABLE `variant` ADD COLUMN `image` VARCHAR(512) NULL,
    ADD COLUMN `sku` VARCHAR(64) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `accessToken` VARCHAR(512) NOT NULL,
    `refreshToken` VARCHAR(512) NULL,
    `userAgent` TEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Session_userId_idx`(`userId`),
    INDEX `Session_accessToken_idx`(`accessToken`),
    INDEX `Session_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RefreshToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(512) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `revokedAt` DATETIME(3) NULL,
    `replacedByToken` VARCHAR(512) NULL,
    `userAgent` TEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RefreshToken_token_key`(`token`),
    INDEX `RefreshToken_userId_idx`(`userId`),
    INDEX `RefreshToken_token_idx`(`token`),
    INDEX `RefreshToken_expiresAt_idx`(`expiresAt`),
    INDEX `RefreshToken_revoked_idx`(`revoked`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `title` VARCHAR(160) NULL,
    `comment` TEXT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `helpful` INTEGER NOT NULL DEFAULT 0,
    `notHelpful` INTEGER NOT NULL DEFAULT 0,
    `isApproved` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Review_productId_idx`(`productId`),
    INDEX `Review_userId_idx`(`userId`),
    INDEX `Review_rating_idx`(`rating`),
    INDEX `Review_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `Review_productId_userId_key`(`productId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WishlistItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `variantId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WishlistItem_userId_idx`(`userId`),
    INDEX `WishlistItem_productId_idx`(`productId`),
    UNIQUE INDEX `WishlistItem_userId_productId_variantId_key`(`userId`, `productId`, `variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shipment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `trackingNumber` VARCHAR(100) NOT NULL,
    `carrier` VARCHAR(100) NOT NULL,
    `method` VARCHAR(100) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `shippedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `estimatedDelivery` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Shipment_trackingNumber_key`(`trackingNumber`),
    INDEX `Shipment_orderId_idx`(`orderId`),
    INDEX `Shipment_trackingNumber_idx`(`trackingNumber`),
    INDEX `Shipment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'SHIPPING',
    `firstName` VARCHAR(120) NOT NULL,
    `lastName` VARCHAR(120) NOT NULL,
    `company` VARCHAR(120) NULL,
    `addressLine1` VARCHAR(255) NOT NULL,
    `addressLine2` VARCHAR(255) NULL,
    `city` VARCHAR(120) NOT NULL,
    `state` VARCHAR(120) NULL,
    `country` VARCHAR(120) NOT NULL,
    `zipCode` VARCHAR(20) NOT NULL,
    `phone` VARCHAR(32) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Address_userId_idx`(`userId`),
    INDEX `Address_type_idx`(`type`),
    INDEX `Address_isDefault_idx`(`isDefault`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coupon` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'PERCENTAGE',
    `value` DECIMAL(10, 2) NOT NULL,
    `minOrderAmount` DECIMAL(10, 2) NULL,
    `maxDiscount` DECIMAL(10, 2) NULL,
    `usageLimit` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `singleUse` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Coupon_code_key`(`code`),
    INDEX `Coupon_code_idx`(`code`),
    INDEX `Coupon_isActive_idx`(`isActive`),
    INDEX `Coupon_startDate_idx`(`startDate`),
    INDEX `Coupon_endDate_idx`(`endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsletterSubscriber` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `subscribedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unsubscribedAt` DATETIME(3) NULL,
    `source` VARCHAR(50) NULL,
    `tags` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NewsletterSubscriber_email_key`(`email`),
    INDEX `NewsletterSubscriber_email_idx`(`email`),
    INDEX `NewsletterSubscriber_isActive_idx`(`isActive`),
    INDEX `NewsletterSubscriber_subscribedAt_idx`(`subscribedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `action` VARCHAR(100) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` INTEGER NULL,
    `oldValue` TEXT NULL,
    `newValue` TEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` TEXT NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ActivityLog_userId_idx`(`userId`),
    INDEX `ActivityLog_action_idx`(`action`),
    INDEX `ActivityLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `ActivityLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CouponCategories` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CouponCategories_AB_unique`(`A`, `B`),
    INDEX `_CouponCategories_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CouponProducts` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CouponProducts_AB_unique`(`A`, `B`),
    INDEX `_CouponProducts_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Category_parentId_idx` ON `Category`(`parentId`);

-- CreateIndex
CREATE INDEX `Category_slug_idx` ON `Category`(`slug`);

-- CreateIndex
CREATE INDEX `Category_order_idx` ON `Category`(`order`);

-- CreateIndex
CREATE INDEX `Category_isActive_idx` ON `Category`(`isActive`);

-- CreateIndex
CREATE INDEX `Expense_isRecurring_idx` ON `Expense`(`isRecurring`);

-- CreateIndex
CREATE INDEX `Message_isRead_idx` ON `Message`(`isRead`);

-- CreateIndex
CREATE INDEX `Order_orderNumber_idx` ON `Order`(`orderNumber`);

-- CreateIndex
CREATE INDEX `Order_customerEmail_idx` ON `Order`(`customerEmail`);

-- CreateIndex
CREATE INDEX `Order_paymentIntentId_idx` ON `Order`(`paymentIntentId`);

-- CreateIndex
CREATE INDEX `OrderItem_variantId_idx` ON `OrderItem`(`variantId`);

-- CreateIndex
CREATE INDEX `PaymentIntent_createdAt_idx` ON `PaymentIntent`(`createdAt`);

-- CreateIndex
CREATE INDEX `PaymentIntent_mpesaCheckoutRequestId_idx` ON `PaymentIntent`(`mpesaCheckoutRequestId`);

-- CreateIndex
CREATE INDEX `Photo_isPrimary_idx` ON `Photo`(`isPrimary`);

-- CreateIndex
CREATE INDEX `Photo_order_idx` ON `Photo`(`order`);

-- CreateIndex
CREATE UNIQUE INDEX `Product_slug_key` ON `Product`(`slug`);

-- CreateIndex
CREATE INDEX `Product_isPublished_idx` ON `Product`(`isPublished`);

-- CreateIndex
CREATE INDEX `Product_createdAt_idx` ON `Product`(`createdAt`);

-- CreateIndex
CREATE INDEX `Product_slug_idx` ON `Product`(`slug`);

-- CreateIndex
CREATE INDEX `Product_rating_idx` ON `Product`(`rating`);

-- CreateIndex
CREATE INDEX `Product_sku_idx` ON `Product`(`sku`);

-- CreateIndex
CREATE INDEX `StockTakeItem_adjusted_idx` ON `StockTakeItem`(`adjusted`);

-- CreateIndex
CREATE UNIQUE INDEX `User_googleId_key` ON `User`(`googleId`);

-- CreateIndex
CREATE INDEX `User_googleId_idx` ON `User`(`googleId`);

-- CreateIndex
CREATE INDEX `User_isVerified_idx` ON `User`(`isVerified`);

-- CreateIndex
CREATE INDEX `User_createdAt_idx` ON `User`(`createdAt`);

-- CreateIndex
CREATE INDEX `User_provider_idx` ON `User`(`provider`);

-- CreateIndex
CREATE INDEX `User_status_idx` ON `User`(`status`);

-- CreateIndex
CREATE INDEX `User_email_idx` ON `User`(`email`);

-- CreateIndex
CREATE INDEX `User_phone_idx` ON `User`(`phone`);

-- CreateIndex
CREATE INDEX `User_deletedAt_idx` ON `User`(`deletedAt`);

-- CreateIndex
CREATE UNIQUE INDEX `Variant_sku_key` ON `Variant`(`sku`);

-- CreateIndex
CREATE INDEX `Variant_sku_idx` ON `Variant`(`sku`);

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `Variant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shipment` ADD CONSTRAINT `Shipment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `Variant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CouponCategories` ADD CONSTRAINT `_CouponCategories_A_fkey` FOREIGN KEY (`A`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CouponCategories` ADD CONSTRAINT `_CouponCategories_B_fkey` FOREIGN KEY (`B`) REFERENCES `Coupon`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CouponProducts` ADD CONSTRAINT `_CouponProducts_A_fkey` FOREIGN KEY (`A`) REFERENCES `Coupon`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CouponProducts` ADD CONSTRAINT `_CouponProducts_B_fkey` FOREIGN KEY (`B`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `product` RENAME INDEX `Product_sellerId_fkey` TO `Product_sellerId_idx`;

-- RenameIndex
ALTER TABLE `stocktake` RENAME INDEX `StockTake_approvedById_fkey` TO `StockTake_approvedById_idx`;

-- RenameIndex
ALTER TABLE `stocktake` RENAME INDEX `StockTake_createdById_fkey` TO `StockTake_createdById_idx`;

-- RenameIndex
ALTER TABLE `variant` RENAME INDEX `Variant_productId_fkey` TO `Variant_productId_idx`;
