-- CreateIndex
CREATE TABLE "_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "stockId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
    FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "_OrderItem_orderId_idx" ON "_OrderItem"("orderId");
CREATE INDEX "_OrderItem_medicationId_idx" ON "_OrderItem"("medicationId");

-- Migration: Migrate existing orders to OrderItem
-- Each existing Order becomes one OrderItem with the same data
INSERT INTO "_OrderItem" ("id", "orderId", "medicationId", "quantity", "price", "stockId", "createdAt")
SELECT
    "Order".id || "_item",
    "Order".id,
    "Order".medicationId,
    "Order".quantity,
    "Order".totalPrice / "Order".quantity as price,
    NULL,
    "Order".createdAt
FROM "Order";

-- Add new columns to Order table (temporary, will be removed after)
ALTER TABLE "Order" ADD COLUMN "_totalQuantity_new" INTEGER;
ALTER TABLE "Order" ADD COLUMN "_totalPrice_new" REAL;

-- Calculate and set the new values (should be same as old values for now)
UPDATE "Order" SET "_totalQuantity_new" = quantity;
UPDATE "Order" SET "_totalPrice_new" = totalPrice;

-- Step 1: Replace medicationId with a relation to OrderItem
-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Create new Order table structure
CREATE TABLE "_new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "deliveryStatus" TEXT NOT NULL DEFAULT 'pickup',
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "totalPrice" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "paymentMethod" TEXT,
    "pickupTime" TEXT,
    "verificationCode" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for new Order table
CREATE INDEX "_new_Order_userId_idx" ON "_new_Order"("userId");
CREATE INDEX "_new_Order_pharmacyId_idx" ON "_new_Order"("pharmacyId");
CREATE INDEX "_new_Order_status_idx" ON "_new_Order"("status");
CREATE INDEX "_new_Order_createdAt_idx" ON "_new_Order"("createdAt");
CREATE INDEX "_new_Order_verificationCode_idx" ON "_new_Order"("verificationCode");

-- Copy data from old Order to new Order
INSERT INTO "_new_Order" ("id", "userId", "pharmacyId", "status", "deliveryStatus", "totalQuantity", "totalPrice", "note", "paymentMethod", "pickupTime", "verificationCode", "verifiedAt", "createdAt", "updatedAt")
SELECT
    "id",
    "userId",
    "pharmacyId",
    "status",
    "deliveryStatus",
    "_totalQuantity_new",
    "_totalPrice_new",
    "note",
    "paymentMethod",
    "pickupTime",
    "verificationCode",
    "verifiedAt",
    "createdAt",
    "updatedAt"
FROM "Order";

-- Drop old Order table
DROP TABLE "Order";

-- Rename new_Order to Order
ALTER TABLE "_new_Order" RENAME TO "Order";

-- Rename _OrderItem to OrderItem
ALTER TABLE "_OrderItem" RENAME TO "OrderItem";

-- Create indexes for OrderItem
DROP INDEX IF EXISTS "_OrderItem_orderId_idx";
DROP INDEX IF EXISTS "_OrderItem_medicationId_idx";
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_medicationId_idx" ON "OrderItem"("medicationId");

-- Clean up temporary columns
-- SQLite will automatically remove unused columns when we rebuild, but we can do a schema rebuild
