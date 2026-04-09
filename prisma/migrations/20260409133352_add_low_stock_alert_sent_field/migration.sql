-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pharmacy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "isGuard" BOOLEAN NOT NULL DEFAULT false,
    "isPartner" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT NOT NULL DEFAULT '08:00',
    "closeTime" TEXT NOT NULL DEFAULT '20:00',
    "isOpen24h" BOOLEAN NOT NULL DEFAULT false,
    "rating" REAL NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "description" TEXT,
    "services" TEXT NOT NULL DEFAULT '[]',
    "paymentMethods" TEXT NOT NULL DEFAULT '[]',
    "parkingInfo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Pharmacy" ("address", "city", "closeTime", "createdAt", "description", "district", "email", "id", "imageUrl", "isGuard", "isOpen24h", "isPartner", "latitude", "longitude", "name", "openTime", "parkingInfo", "paymentMethods", "phone", "rating", "reviewCount", "services", "updatedAt") SELECT "address", "city", "closeTime", "createdAt", "description", "district", "email", "id", "imageUrl", "isGuard", "isOpen24h", "isPartner", "latitude", "longitude", "name", "openTime", "parkingInfo", "paymentMethods", "phone", "rating", "reviewCount", "services", "updatedAt" FROM "Pharmacy";
DROP TABLE "Pharmacy";
ALTER TABLE "new_Pharmacy" RENAME TO "Pharmacy";
CREATE INDEX "Pharmacy_city_district_idx" ON "Pharmacy"("city", "district");
CREATE INDEX "Pharmacy_isGuard_idx" ON "Pharmacy"("isGuard");
CREATE INDEX "Pharmacy_isOpen24h_idx" ON "Pharmacy"("isOpen24h");
CREATE INDEX "Pharmacy_rating_idx" ON "Pharmacy"("rating");
CREATE TABLE "new_PharmacyMedication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pharmacyId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "needsPrescription" BOOLEAN NOT NULL DEFAULT false,
    "expirationDate" DATETIME,
    "lowStockAlertSent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PharmacyMedication_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PharmacyMedication_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PharmacyMedication" ("expirationDate", "id", "inStock", "medicationId", "needsPrescription", "pharmacyId", "price", "quantity", "updatedAt") SELECT "expirationDate", "id", "inStock", "medicationId", "needsPrescription", "pharmacyId", "price", "quantity", "updatedAt" FROM "PharmacyMedication";
DROP TABLE "PharmacyMedication";
ALTER TABLE "new_PharmacyMedication" RENAME TO "PharmacyMedication";
CREATE UNIQUE INDEX "PharmacyMedication_pharmacyId_medicationId_key" ON "PharmacyMedication"("pharmacyId", "medicationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
