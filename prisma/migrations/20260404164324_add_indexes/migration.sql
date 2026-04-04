-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_pharmacyId_idx" ON "Order"("pharmacyId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Pharmacy_city_district_idx" ON "Pharmacy"("city", "district");

-- CreateIndex
CREATE INDEX "Pharmacy_isGuard_idx" ON "Pharmacy"("isGuard");

-- CreateIndex
CREATE INDEX "Pharmacy_isOpen24h_idx" ON "Pharmacy"("isOpen24h");

-- CreateIndex
CREATE INDEX "Pharmacy_rating_idx" ON "Pharmacy"("rating");

-- CreateIndex
CREATE INDEX "Promotion_pharmacyId_isActive_idx" ON "Promotion"("pharmacyId", "isActive");

-- CreateIndex
CREATE INDEX "Promotion_startDate_endDate_idx" ON "Promotion"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_city_idx" ON "User"("city");

-- CreateIndex
CREATE INDEX "User_linkedPharmacyId_idx" ON "User"("linkedPharmacyId");
